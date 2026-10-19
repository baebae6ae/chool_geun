import { describe, expect, it } from 'vitest';
import { addMonths, daysBetween, fullMonths, leaveYear, monthReport, severance, tenure } from './career';
import type { DailyWork, Settings } from './types';

const settings = (o: Partial<Settings> = {}) => ({ salary: 3_000_000, payMode: 'monthly', ...o }) as Settings;

describe('근속', () => {
  it('날짜 계산', () => {
    expect(daysBetween('2025-01-01', '2026-01-01')).toBe(365);
    expect(addMonths('2025-01-31', 1)).toBe('2025-02-28');
    expect(fullMonths('2025-01-31', '2025-02-27')).toBe(0);
    expect(fullMonths('2025-01-31', '2025-02-28')).toBe(1);
  });

  it('근속 기간과 다음 입사 기념일', () => {
    const t = tenure('2024-03-04', '2026-10-19');
    expect(t.years).toBe(2);
    expect(t.months).toBe(7);
    expect(t.nextAnniversary).toBe('2027-03-04');
    expect(t.nextYears).toBe(3);
    expect(t.anniversaryToday).toBeNull();
    expect(tenure('2024-03-04', '2026-03-04').anniversaryToday).toBe(2);
    expect(tenure('2026-10-19', '2026-10-19').days).toBe(1);
  });
});

describe('연차', () => {
  it('1년 미만은 한 달에 1일씩, 최대 11일', () => {
    expect(leaveYear('2026-05-10', '2026-10-19').total).toBe(5);
    expect(leaveYear('2025-11-01', '2026-10-19').total).toBe(11);
    expect(leaveYear('2026-05-10', '2026-10-19').firstYear).toBe(true);
  });

  it('1년 이상은 15일, 3년차부터 2년마다 1일 더, 최대 25일', () => {
    expect(leaveYear('2025-10-01', '2026-10-19').total).toBe(15);
    expect(leaveYear('2023-10-01', '2026-10-19').total).toBe(16);
    expect(leaveYear('2000-01-01', '2026-10-19').total).toBe(25);
  });

  it('이번 연차 기간에 쓴 연차·반차만 센다, 직접 정한 개수가 우선', () => {
    const leave = { '2026-09-30': 1, '2026-10-02': 1, '2026-10-20': 0.5, '2027-10-02': 1 };
    const l = leaveYear('2024-10-01', '2026-10-19', leave);
    expect(l.from).toBe('2026-10-01');
    expect(l.used).toBe(1.5);
    expect(l.dates.map((d) => d.date)).toEqual(['2026-10-02', '2026-10-20']);
    expect(leaveYear('2024-10-01', '2026-10-19', leave, 20).total).toBe(20);
  });
});

describe('퇴직금', () => {
  it('월급 × 재직일수 / 365, 1년 미만이면 대상 아님', () => {
    const s = severance(settings(), '2025-10-19', '2026-10-19');
    expect(s.eligible).toBe(true);
    expect(s.amount).toBe(3_000_000);
    const y = severance(settings(), '2026-04-19', '2026-10-19');
    expect(y.eligible).toBe(false);
    expect(y.daysToEligible).toBe(182);
  });

  it('연봉에 퇴직금 포함이면 표시한다', () => {
    const s = severance(settings({ payMode: 'annual', annualSalary: 39_000_000, severanceIncluded: true }), '2025-10-19', '2026-10-19');
    expect(s.included).toBe(true);
    expect(s.monthly).toBe(3_000_000);
  });
});

describe('월간 리포트', () => {
  const day = (date: string, o: Partial<DailyWork>): DailyWork =>
    ({ date, clockedOut: true, earned: 80_000, workedMs: 8 * 3_600_000, schedule: { workStart: '09:00', workEnd: '18:00', lunchStart: '12:00', lunchEnd: '13:00' }, ...o }) as DailyWork;
  it('실제 시급·평균 퇴근 시각·야근 요일', () => {
    const days = {
      a: day('2026-10-05', {}),
      b: day('2026-10-07', { leftAt: '21:00', overtimeMs: 3 * 3_600_000 }),
      c: day('2026-10-14', { leftAt: '20:00', overtimeMs: 2 * 3_600_000 }),
      d: day('2026-09-30', { leftAt: '23:00', overtimeMs: 5 * 3_600_000 }),
    };
    const r = monthReport(days, 2026, 10);
    expect(r.days).toBe(3);
    expect(r.contractHourly).toBe(10_000);
    expect(Math.round(r.realHourly)).toBe(Math.round(240_000 / 29));
    expect(r.avgLeave).toBe('19:40');
    expect(r.onTimeDays).toBe(1);
    expect(r.overtimeDays).toBe(2);
    expect(r.overtimeHours).toBe(5);
    expect(r.worstWeekday).toBe(3);
  });
});
