import { describe, expect, it } from 'vitest';
import { careerStats } from './records';
import { isUnlocked, nextUnlock, careerTitle, BACKGROUNDS, COLORS } from './customization';
import { itemAt, itemForCompletedCount, seasonDef, seasonLap, seasonTitle, SEASONS, SEASON_LENGTH } from './workItems';
import type { DailyWork } from './types';

const day = (date: string, extra: Partial<DailyWork> = {}) =>
  ({ date, completed: true, earned: 100000, workedMs: 8 * 3600e3, season: 1, workItemIndex: 0, ...extra }) as DailyWork;

describe('시즌', () => {
  it('모든 시즌이 20개 작업물을 갖고 이모지가 겹치지 않는다', () => {
    for (const s of SEASONS) {
      expect(s.items).toHaveLength(SEASON_LENGTH);
      expect(new Set(s.items.map((i) => i.name)).size).toBe(SEASON_LENGTH);
    }
  });
  it('시즌 5부터는 처음 테마로 돌아가 2회차가 된다', () => {
    expect(seasonDef(1).theme).toBe('office');
    expect(seasonDef(2).theme).toBe('cafe');
    expect(seasonDef(5).theme).toBe('office');
    expect(seasonLap(5)).toBe(2);
    expect(seasonTitle(5)).toContain('2회차');
  });
  it('완성 개수로 시즌과 순번을 정한다', () => {
    expect(itemForCompletedCount(0)).toEqual({ season: 1, index: 0 });
    expect(itemForCompletedCount(20)).toEqual({ season: 2, index: 0 });
    expect(itemAt(2, 0).name).toBe('카페 간판');
  });
});

describe('해금·누적', () => {
  const p = (completed: number, earned = 0) => ({ completed, collected: 0, bestRarity: -1, earned });
  it('배경은 시즌을 끝낼 때마다 하나씩 열린다', () => {
    const open = (n: number) => BACKGROUNDS.filter((b) => isUnlocked(b.unlock, p(n))).map((b) => b.id);
    expect(open(0)).toEqual(['default']);
    expect(open(40)).toEqual(['default', 'cafe']);
    expect(open(80)).toEqual(['default', 'cafe', 'garden', 'camp']);
  });
  it('누적 금액으로 여는 아이템', () => {
    expect(isUnlocked({ kind: 'earned', won: 3_000_000 }, p(0, 2_999_999))).toBe(false);
    expect(isUnlocked({ kind: 'earned', won: 3_000_000 }, p(0, 3_000_000))).toBe(true);
  });
  it('다음 해금은 가장 가까운 것', () => {
    const n = nextUnlock(p(26));
    expect(n?.remaining).toBe(4);
    expect(n?.label).toBe(COLORS.find((c) => c.id === 'cream')?.label);
  });
  it('칭호는 출근일수에 따라 오른다', () => {
    expect(careerTitle(0)).toBe('수습 햄스터');
    expect(careerTitle(100)).toContain('백일');
  });
  it('연속 출근은 주말·공휴일을 건너뛰어도 이어진다', () => {
    // 2026-09-17(목) 18(금) → 주말 → 21(월) 22(화)
    const days = Object.fromEntries(['2026-09-17', '2026-09-18', '2026-09-21', '2026-09-22'].map((d) => [d, day(d)]));
    expect(careerStats(days).streak).toBe(4);
  });
  it('평일을 빠지면 연속이 끊긴다', () => {
    const days = Object.fromEntries(['2026-09-14', '2026-09-15', '2026-09-17', '2026-09-18'].map((d) => [d, day(d)]));
    expect(careerStats(days).streak).toBe(2);
    expect(careerStats(days).completedDays).toBe(4);
  });
});

describe('꾸미기 아이템', () => {
  it('저장돼 있던 옛 아이템(야구모자·후드티 등)은 없음으로 돌아가고 새 설정은 유지된다', async () => {
    const { sanitizeCustom } = await import('./customization');
    const old = sanitizeCustom({ hat: 'crown', outfit: 'hoodie', glasses: true } as never);
    expect(old.hat).toBe('none');
    expect(old.outfit).toBe('none');
    expect(old.glasses).toBe(true);
    expect(old.hand).toBe('none');
    const keep = sanitizeCustom({ hat: 'postit', outfit: 'bubble', hand: 'pencil' });
    expect([keep.hat, keep.outfit, keep.hand]).toEqual(['postit', 'bubble', 'pencil']);
  });
});
