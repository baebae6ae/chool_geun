import { describe, expect, it } from 'vitest';
import { CINEMA_END, PAGE2, withPage1 } from '../../domain/paydayCinema';
import { EPISODES } from './episodes';

describe('월급날 새 편 효과음', () => {
  it('편마다 효과음이 연출 안에서 시간 순서대로 울린다', () => {
    for (const [id, ep] of Object.entries(EPISODES)) {
      const page2 = ep.cues(2_918_960);
      expect(page2.every((c) => c.at >= 0 && c.at + PAGE2 < CINEMA_END), id).toBe(true);
      const all = withPage1(page2);
      expect(all.every((c, i) => i === 0 || c.at >= all[i - 1].at), id).toBe(true);
    }
  });
});
