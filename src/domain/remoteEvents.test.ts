import { describe, expect, it } from 'vitest';
import data from '../content/events.json';
import { GACHA_EVENTS, HOLIDAY_EVENTS, planDailyGacha } from './gacha';
import { applyExtraEvents, EXTRA_ICONS, refreshEvents, validExtraEvent, validShape } from './remoteEvents';

describe('도감 이벤트 늘리기', () => {
  it('앱에 든 새 이벤트 15종이 모두 올바르고, 평일 60종·휴일 25종이 된다', () => {
    for (const e of data.events) expect(validExtraEvent(e)).toBe(true);
    expect(GACHA_EVENTS).toHaveLength(60);
    expect(HOLIDAY_EVENTS).toHaveLength(25);
    expect(new Set([...GACHA_EVENTS, ...HOLIDAY_EVENTS].map((e) => e.id)).size).toBe(85);
    expect(Object.keys(EXTRA_ICONS)).toHaveLength(15);
  });
  it('이상한 도형·이벤트는 건너뛴다', () => {
    expect(validShape({ t: 'path', d: 'M0 0 url(javascript:x)' })).toBe(false);
    expect(validShape({ t: 'circle', cx: 1, cy: 1, r: 99 })).toBe(false);
    expect(validShape({ t: 'rect', x: 1, y: 1, w: 3, h: 3, fill: 'red;x' })).toBe(false);
    expect(validExtraEvent({ ...data.events[0], id: 'Bad Id' })).toBe(false);
    expect(applyExtraEvents([{ ...data.events[0] }])).toBe(0); // 이미 있는 건 다시 안 붙는다
  });
  it('사이트에서 받은 새 이벤트가 붙고, 가챠에서 나올 수 있다', async () => {
    const fresh = { ...data.events[0], id: 'w-new-test', rarity: 'COMMON', name: '새 이벤트' };
    const ok = (async () => ({ ok: true, json: async () => ({ events: [...data.events, fresh] }) })) as unknown as typeof fetch;
    expect(await refreshEvents(ok)).toBe(true);
    expect(GACHA_EVENTS.some((e) => e.id === 'w-new-test')).toBe(true);
    const seen = new Set<string>();
    for (let s = 1; s < 4000 && !seen.has('w-new-test'); s++) planDailyGacha(s, '2026-12-01').forEach((g) => seen.add(g.eventId));
    expect(seen.has('w-new-test')).toBe(true);
  });
});
