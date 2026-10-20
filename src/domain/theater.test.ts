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

describe('썰 받아오기', () => {
  it('앱에 들어 있는 썰은 모두 검사를 통과한다', async () => {
    const { validStory } = await import('./theater');
    const data = (await import('../content/stories.json')).default as { stories: unknown[] };
    expect(data.stories.length).toBe(STORIES.length);
    for (const s of data.stories) expect(validStory(s)).toBe(true);
  });

  it('엔진이 모르는 배경·동작·이벤트가 있거나 형식이 틀리면 건너뛴다', async () => {
    const { validStory } = await import('./theater');
    const base = JSON.parse(JSON.stringify(STORIES[0]));
    expect(validStory(base)).toBe(true);
    const bad = (f: (s: any) => void) => {
      const s = JSON.parse(JSON.stringify(base));
      f(s);
      return validStory(s);
    };
    expect(bad((s) => (s.cuts[0].panels[0].bg = 'pool'))).toBe(false);
    expect(bad((s) => (s.cuts[1].events[0] = { at: 0, do: 'act', who: 'me', action: 'backflip' }))).toBe(false);
    expect(bad((s) => (s.cuts[1].events[0] = { at: 0, do: 'explode' }))).toBe(false);
    expect(bad((s) => (s.cuts[1].events[0].who = 'ceo'))).toBe(false);
    expect(bad((s) => (s.cuts[0].layout = 'stack'))).toBe(false);
    expect(bad((s) => delete s.title)).toBe(false);
    expect(validStory(null)).toBe(false);
    expect(validStory('hello')).toBe(false);
  });

  it('새 썰을 받으면 목록에 더해지고, 같은 id는 새 대본으로 바뀌며, 실패하면 그대로', async () => {
    const { allStories, refreshStories, __setRemoteStories } = await import('./theater');
    const extra = { ...JSON.parse(JSON.stringify(STORIES[1])), id: 'new-one', no: 99, title: '새 썰' };
    const fixed = { ...JSON.parse(JSON.stringify(STORIES[0])), title: '고친 제목' };
    const ok = (async () => ({ ok: true, json: async () => ({ stories: [fixed, extra, { id: 'broken' }] }) })) as unknown as typeof fetch;
    expect(await refreshStories(ok)).toBe(true);
    const list = allStories();
    expect(list.length).toBe(STORIES.length + 1);
    expect(list.find((s) => s.id === STORIES[0].id)?.title).toBe('고친 제목');
    expect(list.at(-1)?.id).toBe('new-one');
    const fail = (async () => {
      throw new Error('offline');
    }) as unknown as typeof fetch;
    expect(await refreshStories(fail)).toBe(false);
    expect(allStories().length).toBe(STORIES.length + 1);
    __setRemoteStories([]);
  });
});
