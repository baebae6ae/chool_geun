import { describe, expect, it } from 'vitest';
import { holidayName, holidaysOf } from './holidays';
import { isWorkday } from './schedule';

describe('대한민국 공휴일 (규칙 계산)', () => {
  it('음력 명절을 해마다 맞게 계산한다', () => {
    expect(holidayName('2025-01-29')).toBe('설날');
    expect(holidayName('2026-02-17')).toBe('설날');
    expect(holidayName('2027-02-07')).toBe('설날');
    expect(holidayName('2026-09-25')).toBe('추석');
    expect(holidayName('2026-09-24')).toBe('추석 연휴');
    expect(holidayName('2025-10-06')).toBe('추석');
    expect(holidayName('2026-05-24')).toBe('부처님오신날');
    expect(holidayName('2030-09-12')).toBe('추석');
  });

  it('대체공휴일', () => {
    // 추석 연휴가 일요일과 겹침
    expect(holidayName('2025-10-08')).toBe('대체공휴일');
    // 어린이날·부처님오신날이 같은 날 → 하루
    expect(holidayName('2025-05-05')).toBe('어린이날·부처님오신날');
    expect(holidayName('2025-05-06')).toBe('대체공휴일');
    expect(holidayName('2025-05-07')).toBeUndefined();
    // 국경일이 토·일
    expect(holidayName('2026-03-02')).toBe('대체공휴일');
    expect(holidayName('2026-08-17')).toBe('대체공휴일');
    expect(holidayName('2026-10-05')).toBe('대체공휴일');
    // 추석이 토요일에 걸쳐도 대체 없음 (일요일만)
    expect(holidayName('2026-09-28')).toBeUndefined();
    // 현충일은 대체공휴일 없음
    expect(holidayName('2026-06-08')).toBeUndefined();
    // 2028 추석이 개천절과 겹침
    expect(holidayName('2028-10-03')).toBe('개천절·추석');
    expect(holidayName('2028-10-05')).toBe('대체공휴일');
    // 2027 설 연휴가 일요일과 겹침
    expect(holidayName('2027-02-09')).toBe('대체공휴일');
  });

  it('선거일', () => {
    expect(holidayName('2026-06-03')).toBe('지방선거');
    expect(holidayName('2028-04-12')).toBe('국회의원 선거');
    // 다음 날이 현충일이면 다음 주 수요일
    expect(holidayName('2030-06-12')).toBe('지방선거');
  });

  it('먼 미래도 매년 설·추석·부처님오신날이 있다', () => {
    for (let y = 2025; y <= 2050; y++) {
      const names = Object.values(holidaysOf(y));
      expect(names.filter((n) => n === '설날').length).toBe(1);
      expect(names.filter((n) => n.includes('추석') && !n.includes('연휴')).length).toBe(1);
      expect(names.some((n) => n.includes('부처님오신날'))).toBe(true);
    }
  });

  it('날짜별로 직접 정한 쉬는 날/출근일이 우선', () => {
    const s = { weekendWork: false, holidaysOff: true };
    expect(isWorkday('2026-09-25', s)).toBe(false);
    expect(isWorkday('2026-09-25', { ...s, dayOverrides: { '2026-09-25': 'on' } })).toBe(true);
    expect(isWorkday('2026-09-29', s)).toBe(true);
    expect(isWorkday('2026-09-29', { ...s, dayOverrides: { '2026-09-29': 'off' } })).toBe(false);
    expect(isWorkday('2026-09-25', { ...s, holidaysOff: false })).toBe(true);
  });
});
