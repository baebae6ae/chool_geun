import { Fragment, useEffect, useState } from 'react';
import { idbGet, loadSource, readCookie } from '../store';

const SOURCE: Record<string, string> = {
  local: 'localStorage (정상)',
  cookie: '쿠키 백업 — localStorage가 비어 있었음',
  fresh: '없음 — 모든 저장소가 비어 있었음',
};

const get = (s: () => Storage, k: string) => {
  try {
    return s().getItem(k);
  } catch (e) {
    return `오류: ${(e as Error).name}`;
  }
};

/** `?diag` — 기록이 어디에 남아 있는지 한눈에 (문제 생기면 이 화면을 캡처) */
export function Diag() {
  const [idb, setIdb] = useState('확인 중…');
  const [persisted, setPersisted] = useState('확인 중…');
  useEffect(() => {
    idbGet()
      .then((raw) => setIdb(raw ? (JSON.parse(raw).settings ? '있음 (설정 포함)' : '있음 (설정 없음)') : '없음'))
      .catch((e) => setIdb(`오류: ${e?.name ?? e}`));
    const st = navigator.storage;
    if (st?.persisted) st.persisted().then((p) => setPersisted(p ? '예' : '아니오')).catch(() => setPersisted('오류'));
    else setPersisted('지원 안 함');
  }, []);
  const local = get(() => localStorage, 'hamster-worklog:v1');
  const cookie = readCookie();
  const rows: [string, string][] = [
    ['이번에 불러온 곳', SOURCE[loadSource]],
    ['localStorage 기록', local ? (local.startsWith('오류') ? local : JSON.parse(local).settings ? '있음 (설정 포함)' : '있음 (설정 없음)') : '없음'],
    ['쿠키 백업', cookie?.settings ? '있음' : '없음'],
    ['IndexedDB 백업', idb],
    ['켜진 횟수 (localStorage)', get(() => localStorage, 'hamster-diag:loads') ?? '-'],
    ['켜진 횟수 (이 탭)', get(() => sessionStorage, 'hamster-diag:loads') ?? '-'],
    ['영구 저장 허용', persisted],
    ['홈 화면 앱', matchMedia('(display-mode: standalone)').matches ? '예' : '아니오'],
    ['서비스워커', navigator.serviceWorker?.controller ? '작동 중' : '없음'],
    ['브라우저', navigator.userAgent],
  ];
  return (
    <div style={{ padding: 16, fontSize: 14, lineHeight: 1.5 }}>
      <h2 style={{ marginTop: 0 }}>저장 상태 진단</h2>
      <p>새로고침을 몇 번 한 뒤 이 화면을 캡처해서 보내주세요.</p>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 12px' }}>
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <dt style={{ fontWeight: 700 }}>{k}</dt>
            <dd style={{ margin: 0, wordBreak: 'break-all' }}>{v}</dd>
          </Fragment>
        ))}
      </dl>
      <p>
        <a href="./">앱으로 돌아가기</a>
      </p>
    </div>
  );
}
