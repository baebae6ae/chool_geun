/** 날짜 키(YYYY-MM-DD)와 시각(HH:mm) 관련 유틸. 모든 계산은 기기 로컬 시간 기준. */

export const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const;
export const WEEKDAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
export const MONTH_EN = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
] as const;

export const pad = (n: number) => String(n).padStart(2, '0');

export function dateKey(d: Date | number): string {
  const x = typeof d === 'number' ? new Date(d) : d;
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
}

export function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, n: number): string {
  const d = parseKey(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

/** HH:mm → 자정부터의 분 */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/** 날짜 키 + HH:mm → epoch ms */
export function atTime(key: string, hhmm: string): number {
  const d = parseKey(key);
  const [h, m] = hhmm.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

export function weekday(key: string): number {
  return parseKey(key).getDay();
}

/** 해당 주의 월요일 키 */
export function mondayOf(key: string): string {
  const wd = weekday(key);
  return addDays(key, wd === 0 ? -6 : 1 - wd);
}

export function formatKoreanDate(key: string): string {
  const d = parseKey(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAY_KO[d.getDay()]}요일`;
}

export function formatDotDate(key: string): string {
  return key.replaceAll('-', '.');
}

export function formatClock(t: number, withSeconds = false): string {
  const d = new Date(t);
  const base = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return withSeconds ? `${base}:${pad(d.getSeconds())}` : base;
}

/** ms → "8시간 00분" */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}시간 ${pad(m)}분`;
}

/** 남은 시간 → "18분", "1시간 5분", "30초" */
export function formatRemaining(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  if (s < 60) return `${s}초`;
  const totalMin = Math.ceil(s / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}
