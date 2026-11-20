import { describe, expect, it } from 'vitest';
import { BURST, CINEMA_END, diaryDate, LEFTOVER, paydayBills, PILE, sfxCues } from './paydayCinema';

describe('월급날 다이어리 연출', () => {
  it('청구서 넷이 받은 돈을 나눠 가져가고 3,200원만 남는다', () => {
    for (const total of [2_918_960, 1_500_000, 9_870_123, 120_000]) {
      const bills = paydayBills(total);
      expect(bills).toHaveLength(4);
      expect(bills.every((b) => b.amount >= 0)).toBe(true);
      expect(total - bills.reduce((s, b) => s + b.amount, 0)).toBe(LEFTOVER);
    }
    const [card, rent] = paydayBills(2_918_960);
    expect(card.amount % 1000).toBe(0);
    expect(card.amount).toBeGreaterThan(rent.amount);
  });

  it('월급이 3,200원보다 적어도 음수가 되지 않는다', () => {
    expect(paydayBills(1000).every((b) => b.amount === 0)).toBe(true);
  });

  it('날짜는 다이어리처럼 "11월 25일 (수)"', () => {
    expect(diaryDate('2026-11-25')).toBe('11월 25일 (수)');
  });

  it('동전 16개, 청구서 넷이 4개씩 가져가고, 효과음은 연출 안에서 시간 순서대로', () => {
    expect(PILE).toHaveLength(16);
    expect(BURST).toHaveLength(16);
    const cues = sfxCues(paydayBills(3_000_000));
    expect(cues.filter((c) => c.sfx === 'slam')).toHaveLength(4);
    expect(cues.filter((c) => c.sfx === 'clink')).toHaveLength(32);
    expect(cues.every((c, i) => c.at >= 0 && c.at < CINEMA_END && (i === 0 || c.at >= cues[i - 1].at))).toBe(true);
  });
});
