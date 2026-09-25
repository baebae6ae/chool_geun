import { estimateNet } from './tax';
import { atTime, toMinutes, weekday } from './date';
import type { Schedule, Settings } from './types';

const MIN = 60_000;

export interface DayBounds {
  start: number;
  end: number;
  lunchStart: number;
  lunchEnd: number;
}

/** 점심시간은 근무시간 안으로 잘라낸다. */
export function dayBounds(key: string, s: Schedule): DayBounds {
  const start = atTime(key, s.workStart);
  const end = atTime(key, s.workEnd);
  const ls = Math.min(Math.max(atTime(key, s.lunchStart), start), end);
  const le = Math.min(Math.max(atTime(key, s.lunchEnd), ls), end);
  return { start, end, lunchStart: ls, lunchEnd: le };
}

const overlap = (a1: number, a2: number, b1: number, b2: number) =>
  Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));

/** t 시점까지 실제로 일한 시간 (점심 제외) */
export function workedMs(key: string, s: Schedule, t: number): number {
  const b = dayBounds(key, s);
  return overlap(b.start, b.end, -Infinity, t) - overlap(b.lunchStart, b.lunchEnd, -Infinity, t);
}

export function totalWorkMs(key: string, s: Schedule): number {
  return workedMs(key, s, Infinity);
}

/** 근무시간 대비 진행률 0~1 */
export function progressAt(key: string, s: Schedule, t: number): number {
  const total = totalWorkMs(key, s);
  if (total <= 0) return 0;
  return Math.min(1, workedMs(key, s, t) / total);
}

/** 진행 비율(0~1)을 실제 시각으로 변환 (점심시간 건너뜀) */
export function timeAtFraction(key: string, s: Schedule, f: number): number {
  const b = dayBounds(key, s);
  const target = totalWorkMs(key, s) * f;
  const beforeLunch = b.lunchStart - b.start;
  return target < beforeLunch ? b.start + target : b.start + target + (b.lunchEnd - b.lunchStart);
}

export const netOptionsOf = (s: Settings) => ({
  dependents: s.dependents ?? 1,
  mealAllowance: s.mealAllowance ?? 200_000,
  severanceIncluded: s.severanceIncluded ?? false,
});

/** 화면에 쌓이는 기준 월급: 월급 입력이면 그대로, 연봉 입력이면 세후(기본) 또는 세전 */
export function monthlyPay(s: Settings): number {
  if (s.payMode !== 'annual') return s.salary;
  const est = estimateNet(s.annualSalary ?? 0, netOptionsOf(s));
  if (s.showGross) return est.grossMonthly;
  return s.netOverride ?? est.netMonthly;
}

/** 월급 ÷ 월 근무시간 = 시간당 급여 */
export function hourlyWage(settings: Settings): number {
  const dailyHours = scheduleDailyMs(settings) / (60 * MIN);
  const monthHours = dailyHours * settings.monthWorkDays;
  return monthHours > 0 ? monthlyPay(settings) / monthHours : 0;
}

export function scheduleDailyMs(s: Schedule): number {
  const work = toMinutes(s.workEnd) - toMinutes(s.workStart);
  const ls = Math.min(Math.max(toMinutes(s.lunchStart), toMinutes(s.workStart)), toMinutes(s.workEnd));
  const le = Math.min(Math.max(toMinutes(s.lunchEnd), ls), toMinutes(s.workEnd));
  return Math.max(0, work - (le - ls)) * MIN;
}

export function earnedAt(key: string, s: Schedule, hourly: number, t: number): number {
  return (workedMs(key, s, t) / (60 * MIN)) * hourly;
}

export function isWorkday(key: string, settings: Pick<Settings, 'weekendWork'>): boolean {
  const wd = weekday(key);
  return settings.weekendWork || (wd !== 0 && wd !== 6);
}

export function validateSchedule(s: Schedule): string | null {
  const ws = toMinutes(s.workStart);
  const we = toMinutes(s.workEnd);
  const ls = toMinutes(s.lunchStart);
  const le = toMinutes(s.lunchEnd);
  if ([ws, we, ls, le].some(Number.isNaN)) return '시간을 모두 입력해 주세요.';
  if (we <= ws) return '퇴근시간은 출근시간보다 늦어야 해요.';
  if (le < ls) return '점심 종료가 점심 시작보다 빨라요.';
  if (ls < ws || le > we) return '점심시간은 근무시간 안에 있어야 해요.';
  if (we - ws - (le - ls) < 30) return '근무시간이 너무 짧아요.';
  return null;
}

export type HamsterMood =
  | 'holiday' // 쉬는 날
  | 'beforeWork' // 출근 전
  | 'arriving' // 출근: 가방 메고 등장
  | 'starting' // 업무 시작: 책상에 앉음
  | 'working' // 업무중
  | 'break' // 휴식
  | 'almostDone' // 퇴근 임박 (잔여 30분)
  | 'oneMore' // 퇴근 1분 전 "조금만 더..."
  | 'off'; // 퇴근

export function hamsterMood(key: string, s: Schedule, t: number, clockedOut: boolean): HamsterMood {
  if (clockedOut) return 'off';
  const b = dayBounds(key, s);
  if (t < b.start) return 'beforeWork';
  if (t >= b.end) return 'off';
  if (t >= b.lunchStart && t < b.lunchEnd) return 'break';
  if (t >= b.end - MIN) return 'oneMore';
  if (t >= b.end - 30 * MIN) return 'almostDone';
  if (t < b.start + 10 * MIN) return 'arriving';
  if (t < b.start + 20 * MIN) return 'starting';
  return 'working';
}

export const MOOD_LABEL: Record<HamsterMood, string> = {
  holiday: '쉬는 날',
  beforeWork: '출근 준비중',
  arriving: '출근',
  starting: '업무 시작',
  working: '업무중',
  break: '휴식중',
  almostDone: '퇴근 임박',
  oneMore: '조금만 더...',
  off: '퇴근',
};
