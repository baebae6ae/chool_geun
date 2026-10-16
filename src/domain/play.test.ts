import { describe, expect, it } from 'vitest';
import { atTime } from './date';
import { createInitialState } from './engine';
import { addHeart, BOND_LEVELS, bondLevel, bondLine, bumpStat, bumpThing, clockLine, DAILY_HEART_CAP, heartsToNext, thingLine, THINGS } from './play';

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe('친밀도', () => {
  it('하트 개수로 단계가 정해진다', () => {
    expect(bondLevel(0)).toBe(1);
    expect(bondLevel(BOND_LEVELS[1] - 1)).toBe(1);
    expect(bondLevel(BOND_LEVELS[1])).toBe(2);
    expect(bondLevel(9999)).toBe(5);
    expect(heartsToNext(0)).toBe(BOND_LEVELS[1]);
    expect(heartsToNext(9999)).toBeNull();
  });

  it('하루 최대 하트 수를 넘지 않고, 다음 날엔 다시 쌓인다', () => {
    let s = createInitialState(1);
    const t = atTime('2026-10-12', '12:00');
    for (let i = 0; i < DAILY_HEART_CAP + 5; i++) s = addHeart(s, t).state;
    expect(s.bond?.hearts).toBe(DAILY_HEART_CAP);
    s = addHeart(s, atTime('2026-10-13', '09:00')).state;
    expect(s.bond?.hearts).toBe(DAILY_HEART_CAP + 1);
  });

  it('단계가 오르는 순간을 알려 준다', () => {
    let s = createInitialState(1);
    s = { ...s, bond: { hearts: BOND_LEVELS[1] - 1, today: { date: '2000-01-01', n: 0 } } };
    const r = addHeart(s, atTime('2026-10-12', '12:00'));
    expect(r.leveledUp).toBe(2);
    expect(addHeart(r.state, atTime('2026-10-12', '12:01')).leveledUp).toBeNull();
  });

  it('1단계엔 속마음이 없고, 높을수록 문구가 늘어난다', () => {
    expect(bondLine(1)).toBeNull();
    const seen = new Set<string>();
    const rnd = seeded(3);
    for (let i = 0; i < 200; i++) seen.add(bondLine(5, rnd)!);
    expect(seen.size).toBeGreaterThan(8);
    const low = new Set<string>();
    for (let i = 0; i < 200; i++) low.add(bondLine(2, rnd)!);
    expect(low.size).toBeLessThan(seen.size);
  });
});

describe('방 안 물건 · 누적 기록', () => {
  it('물건마다 한마디가 있고, 시계는 남은 시간을 말한다', () => {
    for (const t of THINGS) expect(thingLine(t, seeded(5)).length).toBeGreaterThan(5);
    const seen = new Set<string>();
    const rnd = seeded(9);
    for (let i = 0; i < 100; i++) seen.add(clockLine('working', 135, rnd));
    expect([...seen].some((l) => l.includes('2시간 15분'))).toBe(true);
    expect(clockLine('off', 0, seeded(1))).toContain('쉬는 날');
  });

  it('눌린 횟수를 센다', () => {
    let s = createInitialState(1);
    s = bumpThing(bumpThing(s, 'clock'), 'clock');
    s = bumpStat(s, 'pet');
    expect(s.stats?.things?.clock).toBe(2);
    expect(s.stats?.pet).toBe(1);
  });
});

describe('손님', () => {
  it('내 캐릭터를 뺀 나머지 종만 온다', async () => {
    const { visitorChoices, pickVisitor, recordVisit } = await import('./visitors');
    expect(visitorChoices('cat').sort()).toEqual(['bird', 'hamster', 'rabbit']);
    expect(visitorChoices(undefined)).not.toContain('hamster');
    for (let i = 0; i < 50; i++) expect(pickVisitor('rabbit', seeded(i + 1))).not.toBe('rabbit');
    // 히든 롭이어는 손님으로 오지 않고, 롭이어를 키우면 토끼도 같은 종이라 오지 않는다
    expect(visitorChoices('hamster')).not.toContain('lop');
    expect(visitorChoices('lop').sort()).toEqual(['bird', 'cat', 'hamster']);
    let s = createInitialState(1);
    s = recordVisit(recordVisit(s, 'bird', 1000), 'bird', 2000);
    expect(s.visitors?.bird).toEqual({ first: 1000, count: 2 });
  });
});
