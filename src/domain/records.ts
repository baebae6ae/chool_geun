/** 기획서 11~13. 일일 / 주간 / 월간 기록 집계 */
import { addDays, mondayOf } from './date';
import { daysUntilPayday } from './engine';
import { isBankDay } from './schedule';
import { itemAt } from './workItems';
import type { DailyWork } from './types';

export function itemOf(day: Pick<DailyWork, 'season' | 'workItemIndex'>) {
  return itemAt(day.season, day.workItemIndex);
}

export interface WeekSlot {
  date: string;
  day: DailyWork | undefined;
}

/** 월~금 (주말 근무 시 월~일) 슬롯 */
export function weekSlots(key: string, days: Record<string, DailyWork>, includeWeekend: boolean): WeekSlot[] {
  const mon = mondayOf(key);
  const n = includeWeekend ? 7 : 5;
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(mon, i);
    return { date, day: days[date] };
  });
}

/** 월~금 5일 모두 완성하면 주간 결과물 완성 */
export function isWeekComplete(slots: WeekSlot[]): boolean {
  return slots.filter((s) => s.day?.completed).length >= 5;
}

export interface MonthSummary {
  workDays: number;
  workedMs: number;
  completed: number;
  gacha: number;
  earned: number;
  days: DailyWork[];
}

export function monthSummary(year: number, month: number, days: Record<string, DailyWork>): MonthSummary {
  const prefix = `${year}-${String(month).padStart(2, '0')}-`;
  const list = Object.values(days)
    .filter((d) => d.date.startsWith(prefix) && d.clockedOut)
    .sort((a, b) => a.date.localeCompare(b.date));
  return {
    workDays: list.length,
    workedMs: list.reduce((s, d) => s + d.workedMs, 0),
    completed: list.filter((d) => d.completed).length,
    gacha: list.reduce((s, d) => s + d.gacha.filter((g) => g.obtained).length, 0),
    earned: list.reduce((s, d) => s + d.earned, 0),
    days: list,
  };
}

/** 시즌별로 완성된 작업물 인덱스 */
export function completedInSeason(days: Record<string, DailyWork>, season: number): Set<number> {
  const set = new Set<number>();
  for (const d of Object.values(days)) if (d.completed && d.season === season) set.add(d.workItemIndex);
  return set;
}

export function formatWon(n: number, decimals = 0): string {
  return '₩ ' + n.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** 월급날: 지난 월급날 다음 날부터 오늘까지 번 돈 (오늘은 지금까지 번 만큼) */
export function paydaySummary(
  days: Record<string, DailyWork>,
  key: string,
  payday: number,
  todayEarned: number,
): { total: number; workDays: number; since: string } {
  let prev = addDays(key, -1);
  for (let i = 0; i < 40 && daysUntilPayday(prev, payday) !== 0; i++) prev = addDays(prev, -1);
  const since = addDays(prev, 1);
  let total = 0;
  let workDays = 0;
  for (const d of Object.values(days)) {
    if (d.date < since || d.date > key) continue;
    if (d.date === key) {
      total += d.clockedOut ? d.earned : todayEarned;
      workDays++;
    } else if (d.clockedOut) {
      total += d.earned;
      workDays++;
    }
  }
  return { total, workDays, since };
}

export interface CareerStats {
  completedDays: number;
  earned: number;
  workedHours: number;
  /** 연속 출근(쉬는 날은 끊지 않는다) */
  streak: number;
}

export function careerStats(days: Record<string, DailyWork>, overrides: Record<string, 'off' | 'on'> = {}): CareerStats {
  const done = Object.values(days)
    .filter((d) => d.completed)
    .map((d) => d.date)
    .sort();
  let earned = 0;
  let worked = 0;
  for (const d of Object.values(days)) {
    earned += d.earned || 0;
    worked += d.workedMs || 0;
  }
  let streak = 0;
  for (let i = done.length - 1; i >= 0; i--) {
    if (i < done.length - 1) {
      // 두 출근일 사이의 날이 전부 쉬는 날이어야 이어진 것으로 본다
      let k = addDays(done[i], 1);
      let ok = true;
      while (k < done[i + 1]) {
        if (isBankDay(k) && overrides[k] !== 'off') ok = false;
        k = addDays(k, 1);
      }
      if (!ok) break;
    }
    streak++;
  }
  return { completedDays: done.length, earned, workedHours: worked / 3_600_000, streak };
}
