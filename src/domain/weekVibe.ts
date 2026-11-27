/**
 * 요일 분위기: 쉬고 나서 첫 출근날(보통 월요일)은 방이 흐리고 햄스터가 축 처지고,
 * 쉬기 전 마지막 출근날(보통 금요일)은 점심 이후부터 밤까지 방이 들썩인다. 글자 없이 분위기만.
 * 공휴일·대체휴일·연차가 끼면 그 주의 "월요일·금요일"도 같이 옮겨 간다.
 */
import { addDays } from './date';
import { dayBounds, isWorkday, type HamsterMood } from './schedule';
import type { Schedule, Settings } from './types';

export type Vibe = 'monday' | 'friday';

const WORK: HamsterMood[] = ['beforeWork', 'arriving', 'starting', 'working', 'break', 'almostDone', 'oneMore'];

export function weekVibe(
  key: string,
  settings: Pick<Settings, 'weekendWork' | 'holidaysOff' | 'dayOverrides'>,
  schedule: Schedule,
  t: number,
  mood: HamsterMood,
): Vibe | null {
  if (!isWorkday(key, settings) || mood === 'holiday') return null;
  const first = !isWorkday(addDays(key, -1), settings);
  const last = !isWorkday(addDays(key, 1), settings);
  const b = dayBounds(key, schedule);
  // 불금: 점심 끝나고부터 그날 밤까지 (퇴근 후 포함)
  if (last && t >= b.lunchEnd) return 'friday';
  // 월요병: 아침 7시부터 퇴근할 때까지
  if (first && WORK.includes(mood) && new Date(t).getHours() >= 7) return 'monday';
  return null;
}
