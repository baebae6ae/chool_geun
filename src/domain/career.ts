/**
 * 내 회사생활: 입사일로 근속 기간·연차·예상 퇴직금을 계산하고, 한 달 기록으로 리포트를 만든다.
 * 모두 근로기준법의 일반적인 기준으로 계산한 참고용 숫자다 (회사 규정에 따라 다를 수 있다).
 */
import { dateKey, pad, parseKey, toMinutes, weekday } from './date';
import { netOptionsOf } from './schedule';
import { estimateNet } from './tax';
import type { DailyWork, Settings } from './types';

const DAY = 86_400_000;

/** 두 날짜 사이의 날 수 (b - a) */
export function daysBetween(a: string, b: string): number {
  const x = parseKey(a);
  const y = parseKey(b);
  return Math.round((Date.UTC(y.getFullYear(), y.getMonth(), y.getDate()) - Date.UTC(x.getFullYear(), x.getMonth(), x.getDate())) / DAY);
}

/** n개월 뒤 같은 날 (그 달에 없는 날이면 말일) */
export function addMonths(key: string, n: number): string {
  const d = parseKey(key);
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return dateKey(target);
}

/** 입사일부터 오늘까지 꽉 채운 개월 수 */
export function fullMonths(hire: string, today: string): number {
  if (today < hire) return 0;
  let n = 0;
  while (addMonths(hire, n + 1) <= today) n++;
  return n;
}

export interface Tenure {
  /** 입사일을 1일째로 센 근속 일수 */
  days: number;
  years: number;
  months: number;
  /** 다음 입사 기념일과 그때 채우는 햇수 */
  nextAnniversary: string;
  nextYears: number;
  /** 오늘이 입사 기념일이면 그 햇수 */
  anniversaryToday: number | null;
}

export function tenure(hire: string, today: string): Tenure {
  const m = fullMonths(hire, today);
  const years = Math.floor(m / 12);
  const nextYears = years + 1;
  const anniv = years > 0 && addMonths(hire, years * 12) === today ? years : null;
  return {
    days: Math.max(0, daysBetween(hire, today) + 1),
    years,
    months: m % 12,
    nextAnniversary: addMonths(hire, nextYears * 12),
    nextYears,
    anniversaryToday: anniv,
  };
}

export interface LeaveYear {
  /** 이 연차 기간 (to는 포함하지 않음) */
  from: string;
  to: string;
  /** 1년 미만 (매달 1일씩 생기는 연차) */
  firstYear: boolean;
  total: number;
  /** 쓴(쓸 예정 포함) 연차 */
  used: number;
  /** 이 기간에 쓴 날들 */
  dates: { date: string; amount: number }[];
}

/**
 * 입사일 기준 연차 (근로기준법 제60조):
 * 1년 미만이면 한 달 개근할 때마다 1일 (최대 11일),
 * 1년 이상이면 15일, 3년차부터 2년마다 1일씩 더해 최대 25일.
 * 회사 기준이 다르면 totalOverride로 직접 정한다.
 */
export function leaveYear(hire: string, today: string, leave: Record<string, number> = {}, totalOverride?: number | null): LeaveYear {
  const years = Math.floor(fullMonths(hire, today) / 12);
  const from = addMonths(hire, years * 12);
  const to = addMonths(hire, (years + 1) * 12);
  const legal = years === 0 ? Math.min(11, fullMonths(hire, today)) : Math.min(25, 15 + Math.floor((years - 1) / 2));
  const dates = Object.entries(leave)
    .filter(([d, a]) => d >= from && d < to && a > 0)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    from,
    to,
    firstYear: years === 0,
    total: totalOverride != null && totalOverride >= 0 ? totalOverride : legal,
    used: dates.reduce((s, d) => s + d.amount, 0),
    dates,
  };
}

export interface Severance {
  /** 지금 그만두면 받을 예상 퇴직금 (1년 미만이면 1년을 채웠을 때 기준으로 쌓이는 금액) */
  amount: number;
  /** 1년 이상 일해서 법정 퇴직금 대상인지 */
  eligible: boolean;
  /** 1년까지 남은 날 */
  daysToEligible: number;
  /** 연봉에 퇴직금이 포함돼 있음 */
  included: boolean;
  /** 계산에 쓴 세전 월급 */
  monthly: number;
}

/** 세전 월급 (연봉 입력이면 연봉 ÷ 12, 퇴직금 포함이면 ÷ 13 / 월급 입력이면 입력한 월급) */
export function grossMonthly(s: Settings): number {
  if (s.payMode === 'annual') return estimateNet(s.annualSalary ?? 0, netOptionsOf(s)).grossMonthly;
  return s.salary;
}

/** 예상 퇴직금 ≈ 1일 평균임금 × 30일 × 재직일수 / 365 ≈ 월 평균임금 × 재직일수 / 365 */
export function severance(s: Settings, hire: string, today: string): Severance {
  const monthly = grossMonthly(s);
  const days = Math.max(0, daysBetween(hire, today));
  const oneYear = daysBetween(hire, addMonths(hire, 12));
  return {
    amount: Math.floor((monthly * days) / 365),
    eligible: days >= oneYear,
    daysToEligible: Math.max(0, oneYear - days),
    included: !!s.severanceIncluded && s.payMode === 'annual',
    monthly,
  };
}

export interface MonthReport {
  days: number;
  /** 계약상 시급 (정해진 시간만 일했을 때) */
  contractHourly: number;
  /** 야근까지 넣은 실제 시급 */
  realHourly: number;
  /** 평균 퇴근 시각 (HH:mm) */
  avgLeave: string | null;
  onTimeDays: number;
  overtimeDays: number;
  overtimeHours: number;
  /** 야근을 가장 많이 한 요일 (0=일) */
  worstWeekday: number | null;
}

/** 그날 실제로 회사를 나선 시각 (분) */
function leaveMinutes(d: DailyWork): number {
  if (d.leftAt) return toMinutes(d.leftAt);
  if (d.early && d.endTime) {
    const t = new Date(d.endTime);
    return t.getHours() * 60 + t.getMinutes();
  }
  return toMinutes(d.schedule.workEnd);
}

export function monthReport(days: Record<string, DailyWork>, y: number, m: number): MonthReport {
  const prefix = `${y}-${pad(m)}-`;
  const list = Object.values(days).filter((d) => d.date.startsWith(prefix) && d.clockedOut);
  let earned = 0;
  let extra = 0;
  let worked = 0;
  let ot = 0;
  let mins = 0;
  const byWeekday = new Map<number, number>();
  for (const d of list) {
    earned += d.earned || 0;
    extra += d.overtimePay || 0;
    worked += d.workedMs || 0;
    ot += d.overtimeMs || 0;
    mins += leaveMinutes(d);
    if (d.overtimeMs) byWeekday.set(weekday(d.date), (byWeekday.get(weekday(d.date)) ?? 0) + d.overtimeMs);
  }
  const worst = [...byWeekday.entries()].sort((a, b) => b[1] - a[1])[0];
  const avg = list.length ? Math.round(mins / list.length) : null;
  return {
    days: list.length,
    contractHourly: worked > 0 ? earned / (worked / 3_600_000) : 0,
    realHourly: worked + ot > 0 ? (earned + extra) / ((worked + ot) / 3_600_000) : 0,
    avgLeave: avg == null ? null : `${pad(Math.floor(avg / 60) % 24)}:${pad(avg % 60)}`,
    onTimeDays: list.filter((d) => !d.overtimeMs).length,
    overtimeDays: list.filter((d) => d.overtimeMs).length,
    overtimeHours: ot / 3_600_000,
    worstWeekday: worst ? worst[0] : null,
  };
}
