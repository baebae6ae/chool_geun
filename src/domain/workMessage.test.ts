import { describe, expect, it } from 'vitest';
import { addDays, atTime } from './date';
import { createInitialState } from './engine';
import { eveningMessage, ignoreWorkMessage, IGNORE_LINES, pendingWorkMessage, stressRelief } from './workMessage';
import { ACHIEVEMENTS, achievementContext } from './achievements';

const KEY = '2026-10-13';
const base = () => createInitialState(5);
const out = { clockedOut: true, overtime: false };

describe('퇴근 후 업무 연락', () => {
  it('날짜와 시드로 정해지고, 도착은 19:00~21:30 사이다', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed < 200; seed++) {
      const m = eveningMessage(seed, KEY);
      expect(eveningMessage(seed, KEY)).toEqual(m);
      expect(m.at).toBeGreaterThanOrEqual(atTime(KEY, '19:00'));
      expect(m.at).toBeLessThanOrEqual(atTime(KEY, '21:30'));
      seen.add(m.text);
    }
    expect(seen.size).toBeGreaterThan(15);
    expect(eveningMessage(5, KEY)).not.toEqual(eveningMessage(5, addDays(KEY, 1)));
  });

  it('퇴근했고 도착 시각이 지나야 보인다. 자정이 지나거나 야근 중이거나 일하지 않은 날엔 안 보인다', () => {
    const s = base();
    const m = eveningMessage(s.seed, KEY);
    expect(pendingWorkMessage(s, KEY, m.at - 1000, out)).toBeNull();
    expect(pendingWorkMessage(s, KEY, m.at, out)).toEqual(m);
    expect(pendingWorkMessage(s, KEY, atTime(KEY, '23:59') + 59_000, out)).toEqual(m);
    expect(pendingWorkMessage(s, KEY, atTime(addDays(KEY, 1), '00:00'), out)).toBeNull();
    expect(pendingWorkMessage(s, KEY, m.at, { clockedOut: true, overtime: true })).toBeNull();
    expect(pendingWorkMessage(s, KEY, m.at, { clockedOut: false, overtime: false })).toBeNull();
  });

  it('읽씹하면 그날은 사라지고 횟수가 쌓이고, 같은 날 두 번 세지 않는다', () => {
    let s = base();
    const m = eveningMessage(s.seed, KEY);
    s = ignoreWorkMessage(s, KEY, m.at + 5000);
    expect(s.stats?.ignored).toBe(1);
    expect(pendingWorkMessage(s, KEY, m.at + 6000, out)).toBeNull();
    expect(ignoreWorkMessage(s, KEY, m.at + 9000)).toBe(s);
    s = ignoreWorkMessage(s, addDays(KEY, 1), atTime(addDays(KEY, 1), '20:30'));
    expect(s.stats?.ignored).toBe(2);
  });

  it('업적 3개가 읽씹 횟수로 달성된다', () => {
    const s = { ...base(), stats: { ignored: 10 } };
    const c = achievementContext(s);
    const done = ACHIEVEMENTS.filter((a) => a.id.startsWith('ignore-') && a.value(c) >= a.goal).map((a) => a.id);
    expect(done).toEqual(['ignore-1', 'ignore-10']);
  });

  it('읽씹 대사와 스트레스 감소율이 정해진 범위 안에 있다', () => {
    expect(IGNORE_LINES.length).toBeGreaterThanOrEqual(4);
    for (let i = 0; i < 100; i++) {
      const v = stressRelief(() => Math.min(0.999999, i / 100));
      expect(v).toBeGreaterThanOrEqual(31);
      expect(v).toBeLessThanOrEqual(97);
    }
  });
});
