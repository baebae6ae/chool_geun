import { describe, expect, it } from 'vitest';
import { createInitialState } from './engine';
import { ESCAPE_IDS, markEscapeSeen, pickEscape } from './escape';
import { addDays } from './date';

describe('오늘의 퇴근 탈출', () => {
  it('같은 날엔 같은 편, 6일이면 6편을 한 번씩 다 본다', () => {
    let s = createInitialState(3);
    const seen: string[] = [];
    let key = '2026-12-01';
    for (let i = 0; i < 6; i++) {
      const id = pickEscape(s, key);
      expect(pickEscape(s, key)).toBe(id);
      s = markEscapeSeen(s, id, key);
      expect(pickEscape(s, key)).toBe(id);
      seen.push(id);
      key = addDays(key, 1);
    }
    expect(new Set(seen).size).toBe(ESCAPE_IDS.length);
    // 다 보고 나면 새 바퀴
    const next = pickEscape(s, key);
    s = markEscapeSeen(s, next, key);
    expect(Object.keys(s.escapes ?? {})).toEqual([next]);
  });
});
