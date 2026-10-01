import { describe, expect, it } from 'vitest';
import { ALL_COMFORT, ALL_QUOTES, pickComfort, pickQuote, pickTimeBubble, QUOTE_COUNT, quotePhase } from './quotes';
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
  it('한마디는 하루 단위로 고정되고 날마다 달라진다', () => {
    const a = pickQuote({ key: k, off: false, payday: false });
    expect(pickQuote({ key: k, off: false, payday: false })).toBe(a);
    const days = Array.from({ length: 60 }, (_, i) => pickQuote({ key: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`, off: false, payday: false }));
    expect(new Set(days).size).toBeGreaterThan(15);
  });
  it('한마디에는 시간대 전용 문구(점심시간입니다 등)가 섞이지 않는다', () => {
    const phaseOnly = new Set(ALL_QUOTES.filter((q) => /점심시간입니다|퇴근했습니다|출근 전/.test(q)));
    for (let i = 1; i <= 28; i++) {
      for (const off of [false, true]) {
        const q = pickQuote({ key: `2026-10-${String(i).padStart(2, '0')}`, off, payday: i === 25 });
        expect(phaseOnly.has(q)).toBe(false);
      }
    }
  });
  it('쉬는 날엔 쉬는 날 문구가, 월급날엔 월급 문구가 나온다', () => {
    const offs = Array.from({ length: 30 }, (_, i) => pickQuote({ key: `2026-11-${String((i % 28) + 1).padStart(2, '0')}`, off: true, payday: true }));
    expect(offs.some((q) => /쉬는 날|휴일|쉴 때|소파/.test(q))).toBe(true);
    expect(offs.every((q) => !/월급날의 알림음/.test(q))).toBe(true);
    const pay = Array.from({ length: 40 }, (_, i) => pickQuote({ key: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`, off: false, payday: true }));
    expect(pay.some((q) => /월급/.test(q))).toBe(true);
  });
  it('시간대 말풍선은 해당 시간대 문구에서 나온다', () => {
    expect(pickTimeBubble('lunch', 3)).toBe(pickTimeBubble('lunch', 3));
    expect(pickTimeBubble('lunch', 3).length).toBeGreaterThan(5);
  });

  it('위로 문구: 충분히 많고, 같은 번호면 같은 문구, 번호가 오르면 다른 문구가 나온다', () => {
    expect(ALL_COMFORT.length).toBeGreaterThanOrEqual(30);
    expect(new Set(ALL_COMFORT).size).toBe(ALL_COMFORT.length);
    expect(pickComfort(k, 1)).toBe(pickComfort(k, 1));
    const seen = new Set(Array.from({ length: 20 }, (_, i) => pickComfort(k, i + 1)));
    expect(seen.size).toBeGreaterThan(8);
  });
});
