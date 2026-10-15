import { describe, expect, it } from 'vitest';
import { addDays, atTime } from './domain/date';
import { createInitialState, reconcile } from './domain/engine';
import { DAILY_LIMIT } from './notify';
import { planNotifications } from './notifySchedule';
import type { AppState, Settings } from './domain/types';

const settings: Settings = {
  salary: 3_000_000,
  payday: 25,
  monthWorkDays: 20,
  weekendWork: false,
  workStart: '09:00',
  workEnd: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  hamsterName: '햄찌',
  notifications: true,
};
const TUE = '2026-09-22';
const state = (): AppState => ({ ...createInitialState(7), settings });
const dayOf = (at: number) => new Date(at).toDateString();

describe('알림 예약 계획', () => {
  it('출근 전날 밤: 내일 출근·퇴근이 예약되고, 하루 최대 개수를 넘지 않는다', () => {
    const now = atTime(TUE, '22:00');
    const plan = planNotifications(state(), now);
    const tomorrow = addDays(TUE, 1);
    const day = plan.filter((p) => dayOf(p.at) === dayOf(atTime(tomorrow, '12:00')));
    expect(day.map((p) => p.kind)).toEqual(expect.arrayContaining(['clockIn', 'clockOut']));
    expect(day.length).toBeLessThanOrEqual(DAILY_LIMIT);
    // 시각 순, 전부 미래
    for (let i = 0; i < plan.length; i++) {
      expect(plan[i].at).toBeGreaterThan(now);
      if (i) expect(plan[i].at).toBeGreaterThanOrEqual(plan[i - 1].at);
    }
    expect(plan.find((p) => p.kind === 'clockIn')!.at).toBe(atTime(tomorrow, '09:00'));
  });

  it('월급날 아침에는 월급날 알림이 먼저 예약된다', () => {
    const PAY = '2026-10-20'; // 급여일 20일(화)
    const s: AppState = { ...state(), settings: { ...settings, payday: 20 } };
    const plan = planNotifications(s, atTime('2026-10-19', '22:00'), 2).filter((p) => dayOf(p.at) === dayOf(atTime(PAY, '12:00')));
    expect(plan.map((p) => p.kind)).toContain('payday');
    expect(plan.find((p) => p.kind === 'payday')!.at).toBe(atTime(PAY, '08:30'));
    expect(plan.length).toBeLessThanOrEqual(DAILY_LIMIT);
  });

  it('퇴근을 이미 한 날은 퇴근·출근 알림을 만들지 않는다', () => {
    const t = atTime(TUE, '19:00');
    const s = reconcile(state(), t).state;
    const plan = planNotifications(s, t, 1);
    expect(plan.filter((p) => dayOf(p.at) === dayOf(atTime(TUE, '12:00')))).toHaveLength(0);
  });

  it('쉬는 날은 휴일 이벤트(10시~21시)만 예약된다', () => {
    const SAT = '2026-09-26';
    const plan = planNotifications(state(), atTime(SAT, '08:00'), 1);
    expect(plan.length).toBeGreaterThan(0);
    for (const p of plan) {
      expect(p.kind).toBe('holidayGacha');
      expect(p.at).toBeGreaterThanOrEqual(atTime(SAT, '10:00'));
      expect(p.at).toBeLessThanOrEqual(atTime(SAT, '21:00'));
    }
  });

  it('앱을 열어 정해진 가챠와 열기 전에 계산한 가챠가 같은 시각이다', () => {
    const now = atTime(TUE, '07:00');
    const before = planNotifications(state(), now, 1).filter((p) => p.kind === 'gacha').map((p) => p.at);
    const opened = reconcile(state(), now).state;
    const after = planNotifications(opened, now, 1).filter((p) => p.kind === 'gacha').map((p) => p.at);
    expect(after).toEqual(before);
  });
});
