import { describe, expect, it } from 'vitest';
import { hourlyWage, monthlyPay } from './schedule';
import { estimateNet } from './tax';
import type { Settings } from './types';

const base: Settings = {
  salary: 3_000_000,
  payday: 25,
  monthWorkDays: 21,
  weekendWork: false,
  workStart: '09:00',
  workEnd: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  hamsterName: '햄찌',
  notifications: false,
};
const opts = { dependents: 1, mealAllowance: 200_000, severanceIncluded: false };

describe('연봉 → 세후 월급', () => {
  it('연봉 4천만원이면 세후 월 약 290만원대', () => {
    const r = estimateNet(40_000_000, opts);
    expect(r.grossMonthly).toBe(3_333_333);
    expect(r.netMonthly).toBeGreaterThan(2_850_000);
    expect(r.netMonthly).toBeLessThan(2_980_000);
  });

  it('연봉이 오르면 실수령도 오르고, 공제율도 커진다', () => {
    const a = estimateNet(30_000_000, opts);
    const b = estimateNet(60_000_000, opts);
    const c = estimateNet(100_000_000, opts);
    expect(a.netMonthly).toBeLessThan(b.netMonthly);
    expect(b.netMonthly).toBeLessThan(c.netMonthly);
    const rate = (r: typeof a) => 1 - r.netMonthly / r.grossMonthly;
    expect(rate(a)).toBeLessThan(rate(b));
    expect(rate(b)).toBeLessThan(rate(c));
  });

  it('부양가족이 많으면 세금이 줄고, 퇴직금 포함이면 13으로 나눈다', () => {
    expect(estimateNet(50_000_000, { ...opts, dependents: 4 }).incomeTax).toBeLessThan(estimateNet(50_000_000, opts).incomeTax);
    expect(estimateNet(52_000_000, { ...opts, severanceIncluded: true }).grossMonthly).toBe(4_000_000);
  });

  it('예전 기록(월급 입력)은 그대로, 연봉 입력은 세후·세전·직접 입력 순으로 반영', () => {
    expect(monthlyPay(base)).toBe(3_000_000);
    const annual: Settings = { ...base, payMode: 'annual', annualSalary: 40_000_000 };
    const net = estimateNet(40_000_000, opts).netMonthly;
    expect(monthlyPay(annual)).toBe(net);
    expect(monthlyPay({ ...annual, showGross: true })).toBe(3_333_333);
    expect(monthlyPay({ ...annual, netOverride: 2_800_000 })).toBe(2_800_000);
    expect(hourlyWage({ ...annual, showGross: true })).toBeGreaterThan(hourlyWage(annual));
  });
});
