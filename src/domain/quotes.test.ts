import { describe, expect, it } from 'vitest';
import { ALL_QUOTES, pickQuote, QUOTE_COUNT, quotePhase } from './quotes';
import { atTime } from './date';

const sched = { workStart: '09:00', workEnd: '18:00', lunchStart: '12:00', lunchEnd: '13:00' };
const k = '2026-10-02';

describe('오늘의 한마디', () => {
  it('문구가 충분히 많고 중복·빈 문구가 없다', () => {
    expect(QUOTE_COUNT).toBeGreaterThanOrEqual(300);
    expect(new Set(ALL_QUOTES).size).toBe(ALL_QUOTES.length);
    expect(ALL_QUOTES.every((q) => q.trim().length > 5 && q.length < 80)).toBe(true);
  });
  it('시간대 구간을 맞게 나눈다', () => {
    const at = (hm: string) => quotePhase(atTime(k, hm), k, sched, false);
    expect(at('08:00')).toBe('before');
    expect(at('10:30')).toBe('morning');
    expect(at('12:30')).toBe('lunch');
    expect(at('15:00')).toBe('afternoon');
    expect(at('17:30')).toBe('leaving');
    expect(at('19:00')).toBe('after');
    expect(quotePhase(atTime(k, '10:30'), k, sched, true)).toBe('after');
    expect(quotePhase(atTime(k, '10:30'), k, null, false)).toBe('off');
  });
  it('같은 상황이면 같은 문구, salt를 바꾸면 다른 문구가 나올 수 있다', () => {
    const a = pickQuote({ key: k, phase: 'morning', payday: false });
    expect(pickQuote({ key: k, phase: 'morning', payday: false })).toBe(a);
    const seen = new Set(Array.from({ length: 30 }, (_, i) => pickQuote({ key: k, phase: 'morning', payday: false, salt: i })));
    expect(seen.size).toBeGreaterThan(8);
  });
  it('쉬는 날엔 쉬는 날 문구만, 월급날엔 월급 문구가 섞인다', () => {
    for (let i = 0; i < 40; i++) {
      const q = pickQuote({ key: '2026-10-03', phase: 'off', payday: true, salt: i });
      expect(q).not.toContain('월급날의 알림음'); // 월급 문구는 쉬는 날엔 쓰지 않음
    }
    const hits = Array.from({ length: 60 }, (_, i) => pickQuote({ key: '2026-10-23', phase: 'afternoon', payday: true, salt: i }));
    expect(hits.some((q) => /월급/.test(q))).toBe(true);
  });
});
