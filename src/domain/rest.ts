/**
 * "누워서 번 돈" — 월급은 쉬는 날에도 흘러간다는 재미용 숫자.
 * 이번 달 월급 ÷ 이번 달 날짜 수를 하루(0시~24시) 동안 고르게 쌓는다.
 * 평일에 번 돈이 이미 월급 전체를 나눈 값이라, 기록·월급 합계에는 더하지 않는다.
 */
import { addDays, atTime, parseKey } from './date';
import { monthlyPay } from './schedule';
import type { Settings } from './types';

export function daysInMonth(key: string): number {
  const d = parseKey(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** 쉬는 날 하루치 */
export function restDailyPay(settings: Settings, key: string): number {
  return monthlyPay(settings) / daysInMonth(key);
}

/** 그날 now까지 누워서 번 돈 */
export function restEarnedAt(settings: Settings, key: string, now: number): number {
  const start = atTime(key, '00:00');
  const end = atTime(addDays(key, 1), '00:00');
  const f = Math.min(1, Math.max(0, (now - start) / (end - start)));
  return restDailyPay(settings, key) * f;
}
