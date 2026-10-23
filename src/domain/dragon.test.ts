import { afterEach, describe, expect, it } from 'vitest';
import data from '../content/dragon.json';
import { __setRemoteAttacks, allAttacks, ENDINGS, planDragon, RAGE_LINES, refreshDragon, validAttack, type Attack } from './dragon';

afterEach(() => __setRemoteAttacks([]));

describe('드래곤 변신', () => {
  it('앱에 든 장면은 모두 엔진이 그릴 수 있는 형태다', () => {
    for (const a of data.attacks) expect(validAttack(a)).toBe(true);
    expect(allAttacks().length).toBe(data.attacks.length);
  });

  it('부수기 장면은 겹치지 않게 3개를 고른다', () => {
    const list = planDragon('a').attacks;
    expect(list).toHaveLength(3);
    expect(new Set(list.map((a) => a.id)).size).toBe(3);
  });

  it('할 때마다 조합이 달라지고, 여러 번 하면 모든 장면이 나온다', () => {
    const seen = new Set<string>();
    const combos = new Set<string>();
    for (let i = 0; i < 120; i++) {
      const list = planDragon(`run-${i}`).attacks;
      combos.add(list.map((a) => a.id).join(','));
      list.forEach((a) => seen.add(a.id));
    }
    expect(seen.size).toBe(allAttacks().length);
    expect(combos.size).toBeGreaterThan(20);
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

  it('틀린 장면(모르는 효과, 이상한 그림 경로·카메라)은 건너뛴다', () => {
    const base = data.attacks[0] as Attack;
    expect(validAttack({ ...base, fx: ['nuke'] })).toBe(false);
    expect(validAttack({ ...base, img: '../evil.webp' })).toBe(false);
    expect(validAttack({ ...base, cam: ['scale(1)', 'url(x)'] })).toBe(false);
    expect(validAttack({ ...base, hit: -1 })).toBe(false);
    expect(validAttack(null)).toBe(false);
  });

  it('사이트에서 새 장면을 받으면 앱 업데이트 없이 목록에 더해지고, 앱에 없는 그림은 사이트에서 받는다', async () => {
    const fresh: Attack = { ...(data.attacks[0] as Attack), id: 'new-scene', img: 'dragon/new-scene.webp', caption: '새 장면' };
    const fetcher = (async () => ({ ok: true, json: async () => ({ attacks: [...data.attacks, fresh] }) })) as unknown as typeof fetch;
    expect(await refreshDragon(fetcher)).toBe(true);
    const all = allAttacks();
    expect(all.length).toBe(data.attacks.length + 1);
    expect(all.find((a) => a.id === 'new-scene')!.src).toBe('https://baebae6ae.github.io/chool_geun/dragon/new-scene.webp');
    expect(all.find((a) => a.id === 'fire')!.src).not.toContain('https://');
  });

  it('받기에 실패하면 앱에 든 장면 그대로', async () => {
    const fail = (async () => ({ ok: false })) as unknown as typeof fetch;
    expect(await refreshDragon(fail)).toBe(false);
    expect(allAttacks().length).toBe(data.attacks.length);
  });
});
