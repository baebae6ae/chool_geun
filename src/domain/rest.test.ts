import { describe, expect, it } from 'vitest';
import { atTime } from './date';
import { daysInMonth, restDailyPay, restEarnedAt } from './rest';
import type { Settings } from './types';

const settings = { salary: 3_100_000, payMode: 'monthly' } as Settings;

describe('누워서 번 돈', () => {
  it('하루치는 월급 ÷ 그 달 날짜 수', () => {
    expect(daysInMonth('2026-10-10')).toBe(31);
    expect(daysInMonth('2026-02-07')).toBe(28);
    expect(restDailyPay(settings, '2026-10-10')).toBeCloseTo(100_000);
  });

  it('자정부터 고르게 쌓이고, 다음 날 자정에 하루치가 된다', () => {
    expect(restEarnedAt(settings, '2026-10-10', atTime('2026-10-10', '00:00'))).toBe(0);
    expect(restEarnedAt(settings, '2026-10-10', atTime('2026-10-10', '12:00'))).toBeCloseTo(50_000);
    expect(restEarnedAt(settings, '2026-10-10', atTime('2026-10-11', '03:00'))).toBeCloseTo(100_000);
  });
});
