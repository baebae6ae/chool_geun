import { describe, expect, it } from 'vitest';
import { addDays, atTime, formatRemaining, mondayOf, weekday } from './date';
import { GACHA_EVENTS, RARITY_RATE, planDailyGacha, rollRarity } from './gacha';
import {
  earnedAt,
  hamsterMood,
  hourlyWage,
  progressAt,
  timeAtFraction,
  totalWorkMs,
  validateSchedule,
  workedMs,
} from './schedule';
import { applySettings, clockOut, createInitialState, daysUntilPayday, playerProgress, reconcile, unseenGacha } from './engine';
import { monthSummary, weekSlots } from './records';
import type { AppState, Settings } from './types';

const HOUR = 3_600_000;
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
const DAY = '2026-09-22'; // 화요일

function withSettings(): AppState {
  return { ...createInitialState(42), settings };
}

describe('schedule', () => {
  it('점심을 제외한 근무시간을 계산한다', () => {
    expect(totalWorkMs(DAY, settings)).toBe(8 * HOUR);
    expect(workedMs(DAY, settings, atTime(DAY, '08:00'))).toBe(0);
    expect(workedMs(DAY, settings, atTime(DAY, '11:00'))).toBe(2 * HOUR);
    expect(workedMs(DAY, settings, atTime(DAY, '12:30'))).toBe(3 * HOUR);
    expect(workedMs(DAY, settings, atTime(DAY, '14:00'))).toBe(4 * HOUR);
    expect(workedMs(DAY, settings, atTime(DAY, '20:00'))).toBe(8 * HOUR);
  });

  it('진행률은 근무시간에 비례한다', () => {
    expect(progressAt(DAY, settings, atTime(DAY, '13:00'))).toBeCloseTo(3 / 8);
    expect(progressAt(DAY, settings, atTime(DAY, '18:00'))).toBe(1);
  });

  it('진행 비율을 실제 시각으로 변환할 때 점심을 건너뛴다', () => {
    expect(timeAtFraction(DAY, settings, 0.25)).toBe(atTime(DAY, '11:00'));
    expect(timeAtFraction(DAY, settings, 0.5)).toBe(atTime(DAY, '14:00'));
  });

  it('시간당 급여 = 월급 ÷ 월 근무시간', () => {
    expect(hourlyWage(settings)).toBeCloseTo(3_000_000 / 160);
    expect(earnedAt(DAY, settings, hourlyWage(settings), atTime(DAY, '18:00'))).toBeCloseTo(150_000);
  });

  it('햄스터 상태가 시간에 따라 바뀐다', () => {
    const m = (t: string) => hamsterMood(DAY, settings, atTime(DAY, t), false);
    expect(m('08:30')).toBe('beforeWork');
    expect(m('09:05')).toBe('arriving');
    expect(m('09:15')).toBe('starting');
    expect(m('10:00')).toBe('working');
    expect(m('12:10')).toBe('break');
    expect(m('17:40')).toBe('almostDone');
    expect(atTime(DAY, '18:00') - 1000).toBeGreaterThan(0);
    expect(hamsterMood(DAY, settings, atTime(DAY, '18:00') - 1000, false)).toBe('oneMore');
    expect(m('18:00')).toBe('off');
  });

  it('잘못된 스케줄을 거른다', () => {
    expect(validateSchedule(settings)).toBeNull();
    expect(validateSchedule({ ...settings, workEnd: '08:00' })).not.toBeNull();
    expect(validateSchedule({ ...settings, lunchStart: '19:00', lunchEnd: '20:00' })).not.toBeNull();
  });
});

describe('gacha', () => {
  it('도감은 50종이고 확률 합은 1', () => {
    expect(GACHA_EVENTS).toHaveLength(50);
    expect(new Set(GACHA_EVENTS.map((e) => e.id)).size).toBe(50);
    expect(Object.values(RARITY_RATE).reduce((a, b) => a + b)).toBeCloseTo(1);
  });

  it('등급 롤', () => {
    expect(rollRarity(0)).toBe('COMMON');
    expect(rollRarity(0.61)).toBe('UNCOMMON');
    expect(rollRarity(0.86)).toBe('RARE');
    expect(rollRarity(0.96)).toBe('EPIC');
    expect(rollRarity(0.995)).toBe('LEGENDARY');
  });

  it('하루 1~3회, 결정적, 금요일 전용 이벤트는 금요일에만', () => {
    for (let i = 0; i < 300; i++) {
      const key = `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
      const plan = planDailyGacha(i, key);
      expect(plan.length).toBeGreaterThanOrEqual(1);
      expect(plan.length).toBeLessThanOrEqual(3);
      expect(planDailyGacha(i, key)).toEqual(plan);
      if (weekday(key) !== 5) expect(plan.some((p) => p.eventId === 'l03')).toBe(false);
    }
  });
});

describe('engine', () => {
  it('설정 전에는 아무것도 하지 않는다', () => {
    expect(reconcile(createInitialState(1), Date.now()).changed).toBe(false);
  });

  it('오늘 기록을 만들고, 가챠를 시간에 맞춰 획득하고, 퇴근시간에 자동 완성한다', () => {
    let s = withSettings();
    const r1 = reconcile(s, atTime(DAY, '08:50'));
    expect(r1.createdToday).toBe(true);
    s = r1.state;
    const today = s.days[DAY];
    expect(today.workItemIndex).toBe(0);
    expect(today.gacha.every((g) => !g.obtained)).toBe(true);

    const r2 = reconcile(s, atTime(DAY, '18:00'));
    s = r2.state;
    const done = s.days[DAY];
    expect(done.clockedOut).toBe(true);
    expect(done.completed).toBe(true);
    expect(done.progress).toBe(1);
    expect(done.earned).toBeCloseTo(150_000);
    expect(done.gacha.every((g) => g.obtained)).toBe(true);
    expect(r2.newGacha.length).toBe(done.gacha.length);
    expect(unseenGacha(s)).toHaveLength(done.gacha.length);
    expect(playerProgress(s).completed).toBe(1);

    // 다음 날은 다음 작업물
    s = reconcile(s, atTime('2026-09-23', '10:00')).state;
    expect(s.days['2026-09-23'].workItemIndex).toBe(1);
  });

  it('앱을 닫아둔 지난 날도 다음 실행 때 퇴근 처리된다', () => {
    let s = reconcile(withSettings(), atTime(DAY, '10:00')).state;
    const r = reconcile(s, atTime('2026-09-28', '08:00'));
    s = r.state;
    expect(r.finalized).toContain(DAY);
    expect(s.days[DAY].completed).toBe(true);
    // 앱을 열지 않은 23일은 기록이 없다
    expect(s.days['2026-09-23']).toBeUndefined();
    expect(s.days['2026-09-28'].workItemIndex).toBe(1);
  });

  it('공휴일(추석)엔 근무일이 아니고, 이미 만들어진 오늘 기록도 치운다', () => {
    expect(reconcile(withSettings(), atTime('2026-09-25', '10:00')).state.days['2026-09-25']).toBeUndefined();
    // 공휴일 처리 전 버전에서 만들어진 기록
    const before = reconcile({ ...withSettings(), settings: { ...withSettings().settings!, holidaysOff: false } }, atTime('2026-09-25', '08:00')).state;
    expect(before.days['2026-09-25']).toBeDefined();
    const after = reconcile({ ...before, settings: { ...before.settings!, holidaysOff: true } }, atTime('2026-09-25', '08:30')).state;
    expect(after.days['2026-09-25']).toBeUndefined();
    // 공휴일에도 일하는 사람
    const worker = { ...withSettings(), settings: { ...withSettings().settings!, holidaysOff: false } };
    expect(reconcile(worker, atTime('2026-09-25', '10:00')).state.days['2026-09-25']).toBeDefined();
  });

  it('조기 퇴근은 미완성으로 저장되고 다음 날 같은 작업을 이어간다', () => {
    let s = reconcile(withSettings(), atTime(DAY, '09:00')).state;
    s = clockOut(s, DAY, atTime(DAY, '14:00'));
    const d = s.days[DAY];
    expect(d.clockedOut).toBe(true);
    expect(d.early).toBe(true);
    expect(d.completed).toBe(false);
    expect(d.progress).toBeCloseTo(0.5);
    expect(d.gacha.every((g) => g.at <= atTime(DAY, '14:00'))).toBe(true);
    // 퇴근 후 다시 reconcile 해도 변하지 않는다
    expect(reconcile(s, atTime(DAY, '19:00')).changed).toBe(false);
    s = reconcile(s, atTime('2026-09-23', '09:00')).state;
    expect(s.days['2026-09-23'].workItemIndex).toBe(0);
  });

  it('주말에는 기록을 만들지 않는다 (주말 근무 off)', () => {
    const r = reconcile(withSettings(), atTime('2026-09-26', '10:00'));
    expect(r.state.days['2026-09-26']).toBeUndefined();
  });

  it('20개를 완성하면 시즌 2가 시작된다', () => {
    let s = withSettings();
    let key = '2026-09-01';
    let made = 0;
    while (made < 21) {
      const r = reconcile(s, atTime(key, '19:00'));
      s = r.state;
      if (s.days[key]) made++;
      key = addDays(key, 1);
    }
    const days = Object.values(s.days).sort((a, b) => a.date.localeCompare(b.date));
    expect(days[19].season).toBe(1);
    expect(days[19].workItemIndex).toBe(19);
    expect(days[20].season).toBe(2);
    expect(days[20].workItemIndex).toBe(0);
  });
});

describe('records', () => {
  it('주간 슬롯과 월간 요약', () => {
    let s = withSettings();
    for (const k of ['2026-09-21', '2026-09-22', '2026-09-23']) s = reconcile(s, atTime(k, '18:30')).state;
    const slots = weekSlots('2026-09-23', s.days, false);
    expect(slots.map((x) => x.date)).toEqual(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25']);
    expect(slots.filter((x) => x.day?.completed)).toHaveLength(3);
    const m = monthSummary(2026, 9, s.days);
    expect(m.workDays).toBe(3);
    expect(m.completed).toBe(3);
    expect(m.earned).toBeCloseTo(450_000);
    expect(m.workedMs).toBe(24 * HOUR);
  });

  it('유틸', () => {
    expect(mondayOf('2026-09-27')).toBe('2026-09-21');
    // 2026-09-25는 추석, 24일도 연휴 → 23일(수)에 지급
    expect(daysUntilPayday('2026-09-22', 25)).toBe(1);
    // 2026-10-25는 일요일 → 23일(금)
    expect(daysUntilPayday('2026-09-26', 25)).toBe(27);
    // 2026-02-28은 토요일 → 27일(금)
    expect(daysUntilPayday('2026-02-20', 31)).toBe(7);
    expect(daysUntilPayday('2026-11-20', 25)).toBe(5);
    expect(formatRemaining(18 * 60_000)).toBe('18분');
    expect(formatRemaining(65 * 60_000)).toBe('1시간 5분');
  });
});

describe('applySettings', () => {
  it('퇴근 전 오늘 기록에 새 스케줄을 반영한다', () => {
    let s = reconcile(withSettings(), atTime(DAY, '10:00')).state;
    s = applySettings(s, { ...settings, workEnd: '19:00', salary: 4_000_000 }, atTime(DAY, '10:00'));
    expect(s.days[DAY].schedule.workEnd).toBe('19:00');
    expect(s.days[DAY].hourly).toBeCloseTo(4_000_000 / (20 * 9));
    expect(reconcile(s, atTime(DAY, '18:30')).state.days[DAY].clockedOut).toBe(false);
  });
});
