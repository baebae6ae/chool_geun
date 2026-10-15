import { describe, expect, it } from 'vitest';
import { createInitialState } from './engine';
import { HATS, isUnlocked, OUTFITS, DECOS, sanitizeCustom, unlockText } from './customization';
import { activeSeason, daysUntilSeason, nextSeasonItem, ownedSeasonItems, seasonDays, SEASON_ITEMS, visitSeason } from './seasons';
import { playerProgress } from './engine';

describe('계절 이벤트', () => {
  it('기간 안에서만 이벤트가 켜진다 (경계 포함)', () => {
    expect(activeSeason('2026-10-19')).toBeNull();
    expect(activeSeason('2026-10-20')?.event.id).toBe('halloween');
    expect(activeSeason('2026-11-02')?.event.id).toBe('halloween');
    expect(activeSeason('2026-11-03')).toBeNull();
    expect(activeSeason('2026-12-15')?.event.id).toBe('christmas');
    expect(activeSeason('2027-12-27')?.event.id).toBe('christmas');
    expect(activeSeason('2026-12-28')).toBeNull();
    expect(daysUntilSeason('2026-10-15')).toMatchObject({ days: 5 });
    expect(daysUntilSeason('2026-10-25')).toBeNull();
  });

  it('앱을 켠 날이 쌓이고, 같은 날은 한 번만 센다', () => {
    let s = createInitialState(1);
    s = visitSeason(s, '2026-10-21');
    s = visitSeason(s, '2026-10-21');
    s = visitSeason(s, '2026-10-25');
    s = visitSeason(s, '2026-09-01'); // 기간 밖은 무시
    expect(seasonDays(s).halloween).toBe(2);
    expect(seasonDays(s).christmas).toBe(0);
  });

  it('접속일수에 따라 한정 아이템이 열리고, 꾸미기 해금 규칙과 이어진다', () => {
    let s = createInitialState(1);
    expect(ownedSeasonItems(s)).toHaveLength(0);
    expect(isUnlocked(HATS.find((h) => h.id === 'pumpkin')!.unlock, playerProgress(s))).toBe(false);
    for (const d of ['21', '22', '23']) s = visitSeason(s, `2026-10-${d}`);
    expect(ownedSeasonItems(s).map((i) => i.id)).toEqual(['pumpkin', 'witch']);
    const p = playerProgress(s);
    expect(isUnlocked(HATS.find((h) => h.id === 'witch')!.unlock, p)).toBe(true);
    expect(isUnlocked(OUTFITS.find((o) => o.id === 'skeleton')!.unlock, p)).toBe(false);
    expect(nextSeasonItem(s, 'halloween')).toMatchObject({ remaining: 2 });
    // 작년에 받은 것도 계속 인정 (여러 해 중 가장 많은 해 기준)
    s = { ...s, seasons: { ...s.seasons, 'christmas:2025': ['2025-12-15', '2025-12-16', '2025-12-17', '2025-12-18', '2025-12-19', '2025-12-20', '2025-12-21'] } };
    expect(ownedSeasonItems(s).some((i) => i.id === 'tree')).toBe(true);
  });

  it('한정 아이템 8개가 모두 꾸미기 목록에 있고, 안내 문구가 있다', () => {
    expect(SEASON_ITEMS).toHaveLength(8);
    for (const i of SEASON_ITEMS) {
      const list = i.kind === 'hat' ? HATS : i.kind === 'outfit' ? OUTFITS : DECOS;
      const it = list.find((x) => x.id === i.id);
      expect(it, i.id).toBeTruthy();
      expect(unlockText(it!.unlock)).toContain('한정');
    }
    // 저장된 꾸미기에 한정 아이템이 있어도 지워지지 않는다
    expect(sanitizeCustom({ hat: 'santa', outfit: 'scarf', deco: 'tree' }).hat).toBe('santa');
  });
});
