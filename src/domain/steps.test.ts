import { describe, expect, it } from 'vitest';
import { monthActivity, stepTier } from './steps';
import type { DailyWork } from './types';

describe('근무 중 걸음 수', () => {
  it('걸음 수로 5단계', () => {
    expect([0, 999, 1000, 2499, 2500, 4999, 5000, 7999, 8000, 30000].map((s) => stepTier(s).level)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  });

  it('한 달 종합: 가장 많았던 단계와 그에 맞는 팁, 걸음 수 없는 날은 뺀다', () => {
    const d = (date: string, steps?: number) => ({ date, clockedOut: true, steps }) as DailyWork;
    const days = { a: d('2026-10-01', 500), b: d('2026-10-02', 1500), c: d('2026-10-05', 1200), e: d('2026-10-06', 9000), f: d('2026-10-07'), g: d('2026-09-30', 20000) };
    const m = monthActivity(days, 2026, 10);
    expect(m.days).toBe(4);
    expect(m.counts).toEqual([1, 2, 0, 0, 1]);
    expect(m.main?.level).toBe(2);
    expect(m.tip?.title).toContain('같은 자세');
    expect(m.best).toEqual({ date: '2026-10-06', steps: 9000 });
    expect(m.average).toBe(3050);
    expect(monthActivity(days, 2026, 8).main).toBeNull();
  });
});
