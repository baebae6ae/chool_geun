import { describe, expect, it } from 'vitest';
import { houseLevel, HOUSE_LEVELS } from './house';

describe('집 꾸미기 단계', () => {
  it('출근 일수에 따라 1~9단계', () => {
    expect(houseLevel(0)).toBe(1);
    expect(houseLevel(19)).toBe(1);
    expect(houseLevel(20)).toBe(2);
    expect(houseLevel(52)).toBe(3);
    expect(houseLevel(364)).toBe(8);
    expect(houseLevel(365)).toBe(HOUSE_LEVELS.length);
    expect(houseLevel(9999)).toBe(9);
  });
});
