import { describe, expect, it } from 'vitest';
import { atTime } from './date';
import { HOLIDAY_BY_ID, HOLIDAY_EVENTS, isHolidayEvent, planHolidayGacha } from './gacha';
import { createInitialState, markGachaSeen, reconcile, unseenGacha } from './engine';
import type { AppState, Settings } from './types';

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
  notifications: false,
};
const SAT = '2026-10-10';
const SUN = '2026-10-11';
const state = (): AppState => ({ ...createInitialState(42), settings });

describe('휴일 가챠', () => {
  it('휴일 이벤트는 20종, 직장인 이벤트와 id가 겹치지 않는다', () => {
    expect(HOLIDAY_EVENTS).toHaveLength(20);
    expect(HOLIDAY_EVENTS.every((e) => isHolidayEvent(e.id) && e.id.startsWith('h'))).toBe(true);
  });

  it('하루 1~3번, 날짜와 시드로 정해지고, "내일도 쉬는 날"은 내일 출근이면 안 나온다', () => {
    for (let seed = 1; seed < 400; seed++) {
      const plan = planHolidayGacha(seed, SUN, false);
      expect(plan.length).toBeGreaterThanOrEqual(1);
      expect(plan.length).toBeLessThanOrEqual(3);
      expect(plan.some((p) => HOLIDAY_BY_ID[p.eventId].beforeOff)).toBe(false);
      expect(planHolidayGacha(seed, SUN, false)).toEqual(plan);
    }
  });

  it('쉬는 날 앱을 열면 10시~21시 사이에 정해지고, 시간이 지나면 도감에 들어간다', () => {
    const morning = reconcile(state(), atTime(SAT, '08:00')).state;
    const plan = morning.holidays?.[SAT]?.gacha ?? [];
    expect(plan.length).toBeGreaterThan(0);
    expect(morning.days[SAT]).toBeUndefined();
    for (const g of plan) {
      expect(g.at).toBeGreaterThanOrEqual(atTime(SAT, '10:00'));
      expect(g.at).toBeLessThanOrEqual(atTime(SAT, '21:00'));
      expect(g.obtained).toBe(false);
    }
    // 다시 열어도 같은 계획
    expect(reconcile(morning, atTime(SAT, '09:00')).state.holidays?.[SAT]).toEqual(morning.holidays?.[SAT]);

    const night = reconcile(morning, atTime(SAT, '22:00'));
    expect(night.newGacha.length).toBe(plan.length);
    const got = night.state.holidays![SAT].gacha;
    expect(got.every((g) => g.obtained)).toBe(true);
    for (const g of got) expect(night.state.collection[g.eventId]).toBeTruthy();

    // 확인 팝업 → 확인하면 사라진다
    const pending = unseenGacha(night.state);
    expect(pending.length).toBe(plan.length);
    let s = night.state;
    for (const p of pending) s = markGachaSeen(s, p.date, p.eventId, p.at);
    expect(unseenGacha(s)).toHaveLength(0);
  });

  it('출근하는 날에는 휴일 이벤트를 만들지 않는다', () => {
    const r = reconcile(state(), atTime('2026-10-12', '11:00')).state;
    expect(r.holidays?.['2026-10-12']).toBeUndefined();
    expect(r.days['2026-10-12']).toBeTruthy();
  });
});
