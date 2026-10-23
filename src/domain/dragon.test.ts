import { describe, expect, it } from 'vitest';
import { ATTACKS, ENDINGS, planDragon, pickAttacks, RAGE_LINES } from './dragon';

describe('드래곤 변신', () => {
  it('부수기 장면은 겹치지 않게 3개를 고른다', () => {
    const list = pickAttacks('a');
    expect(list).toHaveLength(3);
    expect(new Set(list.map((a) => a.id)).size).toBe(3);
  });

  it('할 때마다 조합이 달라지고, 여러 번 하면 모든 장면이 나온다', () => {
    const seen = new Set<string>();
    const combos = new Set<string>();
    for (let i = 0; i < 40; i++) {
      const list = pickAttacks(`run-${i}`);
      combos.add(list.map((a) => a.id).join(','));
      list.forEach((a) => seen.add(a.id));
    }
    expect(seen.size).toBe(ATTACKS.length);
    expect(combos.size).toBeGreaterThan(10);
  });

  it('분노 원인·주문·엔딩도 할 때마다 랜덤이고, 여러 번 하면 엔딩 5종이 다 나온다', () => {
    const endings = new Set<string>();
    const rages = new Set<string>();
    for (let i = 0; i < 80; i++) {
      const p = planDragon(`p-${i}`);
      expect(p.spell.length).toBeGreaterThan(0);
      endings.add(p.ending);
      rages.add(p.rage.text);
    }
    expect(endings.size).toBe(ENDINGS.length);
    expect(rages.size).toBeGreaterThan(RAGE_LINES.length / 2);
  });
});
