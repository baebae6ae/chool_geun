import { describe, expect, it } from 'vitest';
import { atTime } from './date';
import { createInitialState } from './engine';
import { chatAt, CIDER_BEATS, CIDER_TOTAL_MS, cleanStress, pendingChat, SCENES, sceneFor, SLAM_HIT_MS, winChat } from './chatScene';
import { ACHIEVEMENTS, achievementContext } from './achievements';

const KEY = '2026-10-13';
const bounds = { start: atTime(KEY, '09:00'), end: atTime(KEY, '18:00') };
const base = () => createInitialState(5);
const work = { bounds, clockedOut: false, overtime: false };

describe('어이없는 대화', () => {
  it('대화가 충분히 많고, 모두 상대의 어이없는 말로 끝나며 사이다 답변이 있다', () => {
    expect(SCENES.length).toBeGreaterThanOrEqual(60);
    for (const s of SCENES) {
      expect(s.lines.length).toBeGreaterThanOrEqual(2);
      expect(s.lines.length).toBeLessThanOrEqual(7);
      expect(s.lines[s.lines.length - 1].me).toBe(false);
      expect(s.lines.some((l) => l.me)).toBe(true);
      expect(s.retort.length).toBeGreaterThan(15);
      expect(s.retort.length).toBeLessThan(130);
      // 욕설은 그대로 쓰지 않고 가려서 쓴다
      expect(s.retort).not.toMatch(/씨발|시발|쓰발|병신|새끼/);
    }
    expect(new Set(SCENES.map((s) => s.retort)).size).toBe(SCENES.length);
  });

  it('날짜와 시드로 정해지고 여러 가지가 나온다', () => {
    const seen = new Set<number>();
    for (let seed = 1; seed < 300; seed++) {
      expect(sceneFor(seed, KEY)).toEqual(sceneFor(seed, KEY));
      seen.add(sceneFor(seed, KEY).index);
    }
    expect(seen.size).toBeGreaterThan(40);
  });

  it('도착 시각은 근무 시간의 20~75% 지점이다', () => {
    for (let seed = 1; seed < 100; seed++) {
      const at = chatAt(seed, KEY, bounds);
      expect(at).toBeGreaterThanOrEqual(bounds.start + (bounds.end - bounds.start) * 0.2);
      expect(at).toBeLessThan(bounds.start + (bounds.end - bounds.start) * 0.75 + 1);
    }
  });

  it('근무 중이고 도착 시각이 지나야 보인다. 퇴근·야근·쉬는 날엔 안 보인다', () => {
    const s = base();
    const at = chatAt(s.seed, KEY, bounds);
    expect(pendingChat(s, KEY, at - 1000, work)).toBeNull();
    expect(pendingChat(s, KEY, at, work)?.scene).toEqual(sceneFor(s.seed, KEY).scene);
    expect(pendingChat(s, KEY, bounds.end, work)).toBeNull();
    expect(pendingChat(s, KEY, at, { ...work, clockedOut: true })).toBeNull();
    expect(pendingChat(s, KEY, at, { ...work, overtime: true })).toBeNull();
    expect(pendingChat(s, KEY, at, { ...work, bounds: null })).toBeNull();
  });

  it('사이다를 날리면 오늘은 다시 안 나오고 횟수가 쌓인다', () => {
    let s = base();
    const at = chatAt(s.seed, KEY, bounds);
    s = winChat(s, KEY, at + 5000);
    expect(s.chat?.[KEY]?.doneAt).toBe(at + 5000);
    expect(s.stats?.chatWins).toBe(1);
    expect(pendingChat(s, KEY, at + 6000, work)).toBeNull();
    expect(winChat(s, KEY, at + 9000)).toBe(s);
    s = winChat(s, '2026-10-14', atTime('2026-10-14', '12:00'));
    expect(s.stats?.chatWins).toBe(2);
  });

  it('연기는 책상 쾅 → 사이다 → 캬~ 순서이고, 쾅 하는 순간이 첫 동작 안에 있다', () => {
    expect(CIDER_BEATS.map((b) => b.action)).toEqual(['slam', 'cider', 'ahh']);
    expect(SLAM_HIT_MS).toBeLessThan(CIDER_BEATS[0].ms);
    expect(CIDER_TOTAL_MS).toBe(CIDER_BEATS.reduce((a, b) => a + b.ms, 0));
    for (let i = 0; i < 50; i++) {
      const v = cleanStress(() => i / 50);
      expect(v).toBeGreaterThanOrEqual(41);
      expect(v).toBeLessThanOrEqual(99);
    }
  });

  it('업적: 사이다 횟수가 업적에 반영된다', () => {
    const s = { ...base(), stats: { chatWins: 10 } };
    expect(achievementContext(s).chatWins).toBe(10);
    const ids = ACHIEVEMENTS.filter((a) => a.value(achievementContext(s)) >= a.goal).map((a) => a.id);
    expect(ids).toContain('cider-1');
    expect(ids).toContain('cider-10');
    expect(ids).not.toContain('cider-30');
  });
});
