import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, achievementContext, achievementCount, grantAchievements, newAchievements } from './achievements';
import { atTime } from './date';
import { clockOut, createInitialState, reconcile } from './engine';
import { bumpStat, bumpThing } from './play';
import { recordVisit } from './visitors';
import type { AppState, Settings } from './types';

const settings: Settings = {
  salary: 3_000_000, payday: 25, monthWorkDays: 20, weekendWork: false,
  workStart: '09:00', workEnd: '18:00', lunchStart: '12:00', lunchEnd: '13:00', hamsterName: '햄찌', notifications: false,
};
const base = (): AppState => ({ ...createInitialState(3), settings });

describe('업적', () => {
  it('id가 겹치지 않고 목표가 1 이상이다', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) expect(a.goal).toBeGreaterThanOrEqual(1);
  });

  it('처음엔 아무것도 달성하지 않았다', () => {
    expect(newAchievements(base())).toHaveLength(0);
    expect(achievementCount(base())[0]).toBe(0);
  });

  it('출근을 마치면 첫 출근이 달성되고, 한 번 달성하면 다시 나오지 않는다', () => {
    const t = atTime('2026-09-22', '19:00');
    let s = reconcile(base(), t).state;
    const fresh = newAchievements(s);
    expect(fresh.map((a) => a.id)).toContain('first-day');
    s = grantAchievements(s, fresh.map((a) => a.id), t);
    expect(newAchievements(s)).toHaveLength(0);
    expect(s.achievements!['first-day']).toBe(t);
    // 다시 부여해도 처음 시각을 유지
    expect(grantAchievements(s, ['first-day'], t + 999).achievements!['first-day']).toBe(t);
  });

  it('쓰다듬기·방 안 물건·손님이 쌓이면 달성된다', () => {
    let s = base();
    for (let i = 0; i < 100; i++) s = bumpStat(s, 'pet');
    for (const t of ['window', 'clock', 'wheel', 'nest', 'desk'] as const) s = bumpThing(s, t);
    s = recordVisit(s, 'cat', 1);
    const ids = newAchievements(s).map((a) => a.id);
    expect(ids).toEqual(expect.arrayContaining(['pet-100', 'explore', 'guest-1']));
    expect(ids).not.toContain('guest-3');
    const c = achievementContext(s);
    expect(c.tappedThings).toBe(5);
    expect(c.visitors).toBe(1);
  });

  it('조기 퇴근처럼 작업물을 못 끝낸 날은 출근 업적에 세지 않는다', () => {
    const t = atTime('2026-09-22', '10:00');
    const s = clockOut(reconcile(base(), t).state, '2026-09-22', t);
    expect(achievementContext(s).completed).toBe(0);
  });
});
