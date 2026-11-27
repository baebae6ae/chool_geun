import { describe, expect, it } from 'vitest';
import { setDiary, MEMO_MAX } from './diary';
import type { AppState } from './types';

const st = { days: { '2026-11-27': { date: '2026-11-27' } } } as unknown as AppState;

describe('오늘의 한 줄 일기', () => {
  it('기분을 고르고, 같은 걸 다시 누르면 지워진다', () => {
    let s = setDiary(st, '2026-11-27', { mood: '😆' });
    expect(s.days['2026-11-27'].diary).toEqual({ mood: '😆' });
    s = setDiary(s, '2026-11-27', { mood: '😆' });
    expect(s.days['2026-11-27'].diary).toBeUndefined();
  });
  it('메모는 길이를 자르고, 비우면 남기지 않으며, 모르는 이모지는 받지 않는다', () => {
    let s = setDiary(st, '2026-11-27', { memo: 'a'.repeat(500) });
    expect(s.days['2026-11-27'].diary?.memo).toHaveLength(MEMO_MAX);
    s = setDiary(s, '2026-11-27', { memo: '   ' });
    expect(s.days['2026-11-27'].diary).toBeUndefined();
    expect(setDiary(st, '2026-11-27', { mood: '💩' }).days['2026-11-27'].diary).toBeUndefined();
    expect(setDiary(st, '2026-12-01', { mood: '😆' })).toBe(st);
  });
});
