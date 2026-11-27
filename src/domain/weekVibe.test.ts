import { describe, expect, it } from 'vitest';
import { weekVibe } from './weekVibe';
import type { Schedule } from './types';

const sch = { workStart: '09:00', workEnd: '18:00', lunchStart: '12:00', lunchEnd: '13:00' } as Schedule;
const s: { weekendWork: boolean; holidaysOff: boolean; dayOverrides: Record<string, 'on' | 'off'> } = { weekendWork: false, holidaysOff: true, dayOverrides: {} };
const at = (key: string, hm: string) => new Date(`${key}T${hm}:00`).getTime();

describe('요일 분위기', () => {
  it('월요일 근무 중엔 월요병, 금요일 점심 이후~밤엔 불금', () => {
    expect(weekVibe('2026-11-30', s, sch, at('2026-11-30', '10:00'), 'working')).toBe('monday');
    expect(weekVibe('2026-11-30', s, sch, at('2026-11-30', '19:00'), 'off')).toBeNull();
    expect(weekVibe('2026-11-27', s, sch, at('2026-11-27', '10:00'), 'working')).toBeNull();
    expect(weekVibe('2026-11-27', s, sch, at('2026-11-27', '15:00'), 'working')).toBe('friday');
    expect(weekVibe('2026-11-27', s, sch, at('2026-11-27', '22:00'), 'off')).toBe('friday');
    expect(weekVibe('2026-11-25', s, sch, at('2026-11-25', '15:00'), 'working')).toBeNull();
  });
  it('공휴일이 끼면 월요일·금요일도 옮겨 간다', () => {
    // 2026-12-25(금) 성탄절 → 24일(목)이 불금
    expect(weekVibe('2026-12-24', s, sch, at('2026-12-24', '15:00'), 'working')).toBe('friday');
    // 연차로 월요일을 쉬면 화요일이 월요병
    const leave = { ...s, dayOverrides: { '2026-11-30': 'off' as const } };
    expect(weekVibe('2026-12-01', leave, sch, at('2026-12-01', '10:00'), 'working')).toBe('monday');
  });
});
