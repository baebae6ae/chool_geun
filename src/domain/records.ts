/** 기획서 11~13. 일일 / 주간 / 월간 기록 집계 */
import { addDays, mondayOf } from './date';
import { WORK_ITEMS } from './workItems';
import type { DailyWork } from './types';

export function itemOf(day: Pick<DailyWork, 'workItemIndex'>) {
  return WORK_ITEMS[day.workItemIndex];
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
  return '₩' + n.toLocaleString('ko-KR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}
