import { describe, expect, it } from 'vitest';
import { atTime } from './date';
import { createInitialState, reconcile } from './engine';
import { startOvertime } from './overtime';
import type { AppState, Settings } from './types';
import { buildWidgetTimeline, type WidgetEntry } from './widget';

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

const at = (list: WidgetEntry[], t: number) => [...list].reverse().find((e) => e.at <= t)!;

describe('위젯 타임라인', () => {
  const state: AppState = { ...createInitialState(1), settings };
  const now = atTime(DAY, '10:00');
  const tl = buildWidgetTimeline(state, now);

  it('시각 순으로 정렬되어 있다', () => {
    for (let i = 1; i < tl.length; i++) expect(tl[i].at).toBeGreaterThanOrEqual(tl[i - 1].at);
  });

  it('근무일 하루의 상태가 시간대별로 바뀐다', () => {
    expect(at(tl, atTime(DAY, '07:00'))).toMatchObject({ theme: 'morning', label: '출근까지' });
    expect(at(tl, atTime(DAY, '09:10')).img).toBe('yawn');
    expect(at(tl, atTime(DAY, '10:00'))).toMatchObject({ img: 'type', label: '퇴근까지' });
    expect(at(tl, atTime(DAY, '12:30'))).toMatchObject({ img: 'nibble' });
    expect(at(tl, atTime(DAY, '12:30')).side.money?.perMin).toBe(0);
    expect(at(tl, atTime(DAY, '17:45')).img).toBe('typeFast');
    expect(at(tl, atTime(DAY, '19:00'))).toMatchObject({ theme: 'night', big: '퇴근 완료' });
  });

  it('돈은 구간 시작 금액에서 분당 금액만큼 늘고, 다음 구간 금액을 넘지 않는다', () => {
    const e = at(tl, atTime(DAY, '10:00'));
    const m = e.side.money!;
    expect(m.base).toBeGreaterThan(0);
    expect(m.perMin).toBeGreaterThan(0);
    expect(m.cap).toBeGreaterThan(m.base);
  });

  it('주말은 쉬는 날 하나로 표시된다', () => {
    const sat = at(tl, atTime('2026-09-26', '11:00'));
    expect(sat).toMatchObject({ theme: 'off', big: '쉬는 날' });
  });

  it('추석 연휴는 공휴일 이름과 함께 쉬는 날', () => {
    const tl2 = buildWidgetTimeline(state, atTime(DAY, '10:00'));
    expect(at(tl2, atTime('2026-09-25', '10:00')).label).toContain('추석');
  });

  it('2주 치를 넘겨준다', () => {
    expect(tl[tl.length - 1].at).toBeGreaterThanOrEqual(atTime('2026-10-05', '00:00'));
  });

  it('야근을 시작하면 그날 퇴근 이후가 썩어가는 방이 된다', () => {
    const t = atTime(DAY, '18:40');
    const s = startOvertime(reconcile(state, t).state, DAY, t);
    const list = buildWidgetTimeline(s, t);
    expect(at(list, atTime(DAY, '18:50'))).toMatchObject({ theme: 'rot1', img: 'doom' });
    expect(at(list, atTime(DAY, '19:20')).theme).toBe('rot2');
    expect(at(list, atTime(DAY, '21:00')).theme).toBe('rot4');
    expect(at(list, atTime(DAY, '21:00')).chrono).toEqual({ target: t, down: false });
    // 다음 날은 원래대로
    expect(at(list, atTime('2026-09-23', '07:00')).theme).toBe('morning');
  });
});
