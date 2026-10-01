import { isNative } from './platform';
import { getState, restoreFromBackup } from './store';

const LAST_KEY = 'hamster-backup:last';

export function lastBackupAt(): number | null {
  try {
    const v = Number(localStorage.getItem(LAST_KEY));
    return v > 0 ? v : null;
  } catch {
    return null;
  }
}

function fileName(now: Date) {
  const p = (n: number) => String(n).padStart(2, '0');
  return `햄스터출근일지-백업-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`;
}

/**
 * 기록 전체를 파일로 저장한다. 폰에서는 공유 시트(파일에 저장·드라이브 등), PC에서는 다운로드.
 * 반환값: 사용자가 취소했으면 false.
 */
export async function saveBackup(): Promise<boolean> {
  const now = new Date();
  const body = JSON.stringify({ app: 'hamster-worklog', exportedAt: now.toISOString(), state: getState() }, null, 1);
  const name = fileName(now);
  const file = new File([body], name, { type: 'application/json' });

  if (isNative) {
    // 웹뷰는 blob 다운로드가 안 되므로 임시 파일로 쓴 뒤 공유 창(드라이브·파일 등)으로 내보낸다
    try {
      const [{ Filesystem, Directory, Encoding }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
      const w = await Filesystem.writeFile({ path: name, data: body, directory: Directory.Cache, encoding: Encoding.UTF8 });
      await Share.share({ title: '햄스터 출근일지 백업', url: w.uri, dialogTitle: '백업 파일 저장' });
      markDone(now);
      return true;
    } catch (e) {
      if (/cancel/i.test(String((e as Error)?.message))) return false;
      throw e;
    }
  }

  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '햄스터 출근일지 백업' });
      markDone(now);
      return true;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return false;
      // 공유가 막힌 환경이면 다운로드로 넘어간다
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  markDone(now);
  return true;
}

function markDone(now: Date) {
  try {
    localStorage.setItem(LAST_KEY, String(now.getTime()));
  } catch {
    // 무시
  }
}

export async function loadBackupFile(file: File): Promise<void> {
  if (file.size > 20 * 1024 * 1024) throw new Error('파일이 너무 커요.');
  restoreFromBackup(await file.text());
}
