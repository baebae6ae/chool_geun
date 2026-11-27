/**
 * 오늘의 한 줄 일기: 퇴근할 때 기분 이모지 하나 + 하고 싶으면 메모.
 * 진짜 내 하루 기록이라 달력에 도장 대신 이모지로 쌓인다. 안 남겨도 아무 일 없다.
 */
import type { AppState, Diary } from './types';

export const DIARY_MOODS = [
  { emoji: '😆', label: '최고' },
  { emoji: '🙂', label: '괜찮' },
  { emoji: '😐', label: '그냥' },
  { emoji: '😩', label: '지침' },
  { emoji: '🤯', label: '폭발' },
] as const;

export const MEMO_MAX = 200;

/** 그날 일기를 고친다. 기분을 다시 누르면 지워지고, 빈 메모는 남기지 않는다 */
export function setDiary(state: AppState, date: string, patch: Partial<Diary>): AppState {
  const day = state.days[date];
  if (!day) return state;
  const next: Diary = { ...day.diary, ...patch };
  if (patch.mood !== undefined && day.diary?.mood === patch.mood) delete next.mood;
  if (next.memo !== undefined) next.memo = next.memo.slice(0, MEMO_MAX);
  if (!next.memo?.trim()) delete next.memo;
  if (!DIARY_MOODS.some((m) => m.emoji === next.mood)) delete next.mood;
  const diary = next.mood || next.memo ? next : undefined;
  return { ...state, days: { ...state.days, [date]: { ...day, diary } } };
}
