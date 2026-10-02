/** 야근 기록과 "벌었어야 할 돈" 계산 */
import { addDays, atTime, toMinutes } from './date';
import type { AppState, DailyWork, Settings } from './types';

/** 야근 수당 배율 (연장근로 가산 1.5배) */
export const OVERTIME_RATE = 1.5;
const HOUR = 3_600_000;

export function wageTypeOf(s: Pick<Settings, 'wageType'> | null | undefined): 'overtime' | 'inclusive' {
  return s?.wageType === 'inclusive' ? 'inclusive' : 'overtime';
}

/** 야근 시간(ms)에 대한 실제 수당과 못 받은 돈 */
export function overtimeMoney(wage: 'overtime' | 'inclusive', hourly: number, ms: number): { pay: number; owed: number } {
  const value = (Math.max(0, ms) / HOUR) * hourly * OVERTIME_RATE;
  return wage === 'inclusive' ? { pay: 0, owed: value } : { pay: value, owed: 0 };
}

const pad = (n: number) => String(n).padStart(2, '0');
export const hhmm = (t: number) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 퇴근 시각 문자열 → 야근 ms. 퇴근시간보다 이르면 0, 새벽(0~5시)이면 다음 날로 본다 */
export function overtimeFromLeft(day: Pick<DailyWork, 'schedule'>, left: string): number {
  const end = toMinutes(day.schedule.workEnd);
  let m = toMinutes(left);
  if (m < end) {
    if (m <= 5 * 60) m += 24 * 60;
    else return 0;
  }
  return (m - end) * 60_000;
}

/** 퇴근 시각을 기록한다. left가 null이면 "정시 퇴근" */
export function recordLeft(state: AppState, key: string, left: string | null): AppState {
  const day = state.days[key];
  if (!day) return state;
  const at = left ?? day.schedule.workEnd;
  const ms = overtimeFromLeft(day, at);
  return setOvertime(state, key, ms, at);
}

/** 야근 시간(ms)과 퇴근 시각을 직접 넣는다 */
export function setOvertime(state: AppState, key: string, ms: number, leftAt: string): AppState {
  const day = state.days[key];
  if (!day) return state;
  const { pay, owed } = overtimeMoney(wageTypeOf(state.settings), day.hourly, ms);
  const overtime = state.overtime?.date === key ? undefined : state.overtime;
  return {
    ...state,
    overtime,
    days: { ...state.days, [key]: { ...day, leftAt, leftAsked: true, overtimeMs: ms, overtimePay: pay, overtimeOwed: owed } },
  };
}

/** 퇴근 시간이 지난 뒤 "야근하기"를 눌렀을 때 */
export function startOvertime(state: AppState, key: string, now: number): AppState {
  const day = state.days[key];
  if (!day || state.overtime) return state;
  return { ...state, overtime: { date: key, startedAt: Math.max(now, atTime(key, day.schedule.workEnd)) } };
}

/** "진짜 퇴근"을 눌렀을 때: 야근을 시작한 때부터 지금까지를 기록한다 (자정을 넘기면 자정까지) */
export function endOvertime(state: AppState, now: number): AppState {
  const o = state.overtime;
  if (!o) return state;
  const day = state.days[o.date];
  if (!day) return { ...state, overtime: undefined };
  const midnight = atTime(addDays(o.date, 1), '00:00');
  const end = Math.min(now, midnight);
  const ms = Math.max(0, end - o.startedAt) + (day.overtimeMs ?? 0);
  return setOvertime(state, o.date, ms, hhmm(end));
}

/** 지금 이 순간까지의 야근 진행 (화면 표시용). 없으면 null */
export function liveOvertime(state: AppState, key: string, now: number) {
  const o = state.overtime;
  if (!o || o.date !== key) return null;
  const day = state.days[key];
  if (!day) return null;
  const ms = Math.max(0, now - o.startedAt) + (day.overtimeMs ?? 0);
  return { ms, ...overtimeMoney(wageTypeOf(state.settings), day.hourly, ms) };
}

/** 퇴근 시각을 아직 안 물어본 가장 최근 근무일 (오늘 제외, 최근 3일 안) */
export function pendingLeftAsk(state: AppState, todayKey: string): string | null {
  const from = addDays(todayKey, -3);
  const list = Object.values(state.days)
    .filter((d) => d.clockedOut && !d.leftAsked && d.date < todayKey && d.date >= from)
    .sort((a, b) => b.date.localeCompare(a.date));
  return list[0]?.date ?? null;
}

export interface OvertimeTotals {
  ms: number;
  pay: number;
  owed: number;
  days: number;
}

export function overtimeTotals(days: Record<string, DailyWork>, prefix = ''): OvertimeTotals {
  const t: OvertimeTotals = { ms: 0, pay: 0, owed: 0, days: 0 };
  for (const d of Object.values(days)) {
    if (!d.overtimeMs || !d.date.startsWith(prefix)) continue;
    t.ms += d.overtimeMs;
    t.pay += d.overtimePay ?? 0;
    t.owed += d.overtimeOwed ?? 0;
    t.days++;
  }
  return t;
}
