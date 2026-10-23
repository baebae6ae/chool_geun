import { describe, expect, it } from 'vitest';
import { ATTACKS, pickAttacks } from './dragon';

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
});
