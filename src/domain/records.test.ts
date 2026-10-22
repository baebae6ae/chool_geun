import { describe, expect, it } from 'vitest';
import { paydaySummary, seasonParts } from './records';
import type { DailyWork, Settings } from './types';

const day = (date: string, season: number, workItemIndex: number, completed = true) => ({ date, season, workItemIndex, completed }) as DailyWork;
const toDays = (list: DailyWork[]) => Object.fromEntries(list.map((d) => [d.date, d]));

describe('파트별 결과물', () => {
  it('공휴일로 빠진 날 없이 만든 순서대로 5개씩 채운다', () => {
    // 1주차 월~금 5개, 2주차는 월·금이 공휴일이라 화~목 3개, 3주차 월~목 4개
    const dates = ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-06', '2026-10-07', '2026-10-08', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'];
    const parts = seasonParts(toDays(dates.map((d, i) => day(d, 1, i))), 1);
    expect(parts.length).toBe(3);
    expect(parts[0].every(Boolean)).toBe(true);
    expect(parts[1].every(Boolean)).toBe(true);
    expect(parts[1].map((d) => d!.date)).toEqual(['2026-10-06', '2026-10-07', '2026-10-08', '2026-10-12', '2026-10-13']);
    expect(parts[2].filter(Boolean).length).toBe(2);
  });

  it('완성하지 못한 날과 다른 시즌은 빼고, 아무것도 없으면 빈 목록', () => {
    const days = toDays([day('2026-10-01', 1, 0), day('2026-10-02', 1, 1, false), day('2026-10-05', 2, 0)]);
    const parts = seasonParts(days, 1);
    expect(parts.length).toBe(1);
    expect(parts[0].filter(Boolean).length).toBe(1);
    expect(seasonParts(days, 3)).toEqual([]);
  });
});

describe('월급날 정산', () => {
  const settings = { salary: 3_000_000, payday: 25 } as Settings;
  it('앱을 켠 날 수와 상관없이 설정한 월급이 그대로 들어온다', () => {
    // 지난 월급날(11/25) 이후 앱으로 기록한 날은 이틀뿐
    const days = toDays([
      { ...day('2026-12-21', 1, 0), clockedOut: true, earned: 140_000 },
      { ...day('2026-12-22', 1, 1), clockedOut: true, earned: 140_000 },
    ] as DailyWork[]);
    const p = paydaySummary(days, '2026-12-23', settings);
    expect(p.salary).toBe(3_000_000);
    expect(p.total).toBe(3_000_000);
    expect(p.workDays).toBe(2);
  });

  it('지난 월급날 이후 야근 수당만 더하고, 그 전 야근은 뺀다', () => {
    const days = toDays([
      { ...day('2026-11-24', 1, 0), clockedOut: true, overtimePay: 50_000 },
      { ...day('2026-12-02', 1, 1), clockedOut: true, overtimePay: 30_000 },
      { ...day('2026-12-15', 1, 2), clockedOut: true, overtimePay: 20_000 },
    ] as DailyWork[]);
    const p = paydaySummary(days, '2026-12-23', settings);
    expect(p.overtime).toBe(50_000);
    expect(p.total).toBe(3_050_000);
  });
});
