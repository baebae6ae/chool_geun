import { describe, expect, it } from 'vitest';
import { createInitialState } from './engine';
import { castSpecies, markStorySeen, STORIES, storyOfDay, storyUnlocked, todaysStory } from './theater';

describe('썰 극장 대본', () => {
  it('모든 썰의 컷·칸·배우·이벤트가 서로 맞다', () => {
    const ids = new Set<string>();
    for (const s of STORIES) {
      expect(ids.has(s.id)).toBe(false);
      ids.add(s.id);
      const roles = new Set(s.cast.map((r) => r.id));
      for (const c of s.cuts) {
        const need = { full: 1, stack: 2, versus: 2, trio: 3 }[c.layout];
        expect(c.panels.length).toBe(need);
        for (const p of c.panels) for (const x of p.cast) expect(roles.has(x.who)).toBe(true);
        for (const e of c.events ?? []) {
          expect(e.at).toBeLessThan(c.ms);
          if (e.p !== undefined) expect(e.p).toBeLessThan(c.panels.length);
          if ('who' in e) {
            const panels = e.p === undefined ? c.panels : [c.panels[e.p]];
            expect(panels.some((p) => p.cast.some((x) => x.who === e.who))).toBe(true);
          }
        }
      }
    }
  });

  it('동료 역할은 내 캐릭터와 다른 종, 둘도 서로 다르다', () => {
    for (const me of ['hamster', 'rabbit', 'cat', 'bird', 'lop'] as const) {
      const c = castSpecies(me);
      const kind = me === 'lop' ? 'rabbit' : me;
      expect(c.boss).not.toBe(kind);
      expect(c.mate).not.toBe(kind);
      expect(c.boss).not.toBe(c.mate);
    }
  });

  it('오늘의 썰은 퇴근해야 열리고, 하루 동안 바뀌지 않으며, 안 본 썰부터 나온다', () => {
    expect(storyUnlocked(undefined)).toBe(false);
    expect(storyUnlocked({ clockedOut: false })).toBe(false);
    expect(storyUnlocked({ clockedOut: true })).toBe(true);
    let s = createInitialState(7);
    const key = '2026-10-20';
    const first = todaysStory(s, key);
    s = markStorySeen(s, key, first.id, 1000);
    expect(todaysStory(s, key).id).toBe(first.id);
    expect(s.stories?.seen?.[first.id]).toBe(1000);
    for (let i = 1; i < 20; i++) {
      const next = storyOfDay(7, `2026-11-${String(i).padStart(2, '0')}`, s.stories?.seen);
      expect(next.id).not.toBe(first.id);
    }
  });
});
