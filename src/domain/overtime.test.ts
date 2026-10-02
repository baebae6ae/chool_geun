import { describe, expect, it } from 'vitest';
import { endOvertime, liveOvertime, overtimeFromLeft, overtimeMoney, overtimeTotals, pendingLeftAsk, recordLeft, startOvertime } from './overtime';
import { atTime } from './date';
import type { AppState, DailyWork } from './types';

const sched = { workStart: '09:00', workEnd: '18:00', lunchStart: '12:00', lunchEnd: '13:00' };
const day = (date: string, extra: Partial<DailyWork> = {}) =>
  ({ date, schedule: sched, hourly: 20000, clockedOut: true, completed: true, ...extra }) as DailyWork;
const st = (days: DailyWork[], wageType: 'overtime' | 'inclusive' = 'inclusive'): AppState =>
  ({ version: 1, seed: 1, settings: { wageType } as never, custom: {} as never, days: Object.fromEntries(days.map((d) => [d.date, d])), collection: {}, notif: { date: '', count: 0 } }) as AppState;

describe('야근 계산', () => {
  it('포괄임금제는 못 받은 돈, 수당 지급은 받은 돈으로 계산한다 (1.5배)', () => {
    expect(overtimeMoney('inclusive', 20000, 2 * 3_600_000)).toEqual({ pay: 0, owed: 60000 });
    expect(overtimeMoney('overtime', 20000, 2 * 3_600_000)).toEqual({ pay: 60000, owed: 0 });
  });
  it('퇴근 시각으로 야근 시간을 구한다 (정시·일찍은 0, 새벽은 다음 날)', () => {
    const d = day('2026-10-01');
    expect(overtimeFromLeft(d, '18:00')).toBe(0);
    expect(overtimeFromLeft(d, '17:30')).toBe(0);
    expect(overtimeFromLeft(d, '20:30')).toBe(2.5 * 3_600_000);
    expect(overtimeFromLeft(d, '01:00')).toBe(7 * 3_600_000);
  });
  it('퇴근 시각을 기록하면 시간·돈·물어봤다는 표시가 남는다', () => {
    const s = recordLeft(st([day('2026-10-01')]), '2026-10-01', '20:00');
    const d = s.days['2026-10-01'];
    expect([d.leftAt, d.leftAsked, d.overtimeMs, d.overtimeOwed, d.overtimePay]).toEqual(['20:00', true, 2 * 3_600_000, 60000, 0]);
    const ontime = recordLeft(st([day('2026-10-01')]), '2026-10-01', null);
    expect(ontime.days['2026-10-01'].overtimeMs).toBe(0);
    expect(ontime.days['2026-10-01'].leftAsked).toBe(true);
  });
  it('물어볼 날은 아직 안 물어본 가장 최근 근무일(오늘 제외·3일 이내)이다', () => {
    const s = st([day('2026-09-29'), day('2026-10-01'), day('2026-10-02', { leftAsked: true }), day('2026-09-20')]);
    expect(pendingLeftAsk(s, '2026-10-03')).toBe('2026-10-01');
    expect(pendingLeftAsk(recordLeft(s, '2026-10-01', null), '2026-10-03')).toBeNull();
    expect(pendingLeftAsk(s, '2026-10-01')).toBe('2026-09-29');
  });
  it('야근하기 → 진짜 퇴근: 시작한 때부터 끝낸 때까지가 기록된다', () => {
    const k = '2026-10-01';
    let s = startOvertime(st([day(k)]), k, atTime(k, '18:10'));
    expect(s.overtime?.date).toBe(k);
    const live = liveOvertime(s, k, atTime(k, '19:10'));
    expect(live?.ms).toBe(3_600_000);
    expect(live?.owed).toBe(30000);
    s = endOvertime(s, atTime(k, '20:10'));
    expect(s.overtime).toBeUndefined();
    expect(s.days[k].overtimeMs).toBe(2 * 3_600_000);
    expect(s.days[k].leftAt).toBe('20:10');
  });
  it('월·누계 합산', () => {
    const s = recordLeft(recordLeft(st([day('2026-10-01'), day('2026-10-02')]), '2026-10-01', '19:00'), '2026-10-02', '21:00');
    const all = overtimeTotals(s.days);
    expect([all.days, all.ms, all.owed]).toEqual([2, 4 * 3_600_000, 120000]);
    expect(overtimeTotals(s.days, '2026-11').days).toBe(0);
  });
});
