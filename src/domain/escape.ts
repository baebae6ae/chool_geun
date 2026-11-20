/**
 * 오늘의 퇴근 탈출: 퇴근할 때 보는 복셀 사무실 연출 6편 중 하나를 고른다.
 * 아직 안 본 편을 먼저, 다 봤으면 처음부터 다시. 같은 날엔 언제 열어도 같은 편.
 */
import { createRng } from './random';
import type { AppState } from './types';

export const ESCAPE_IDS = ['sideways', 'airplane', 'copier', 'bossToo', 'wallBreak', 'scissors'] as const;
export type EscapeId = (typeof ESCAPE_IDS)[number];

export function pickEscape(state: Pick<AppState, 'seed' | 'escapes'>, key: string): EscapeId {
  const seen = state.escapes ?? {};
  const today = Object.entries(seen).find(([, v]) => v?.date === key)?.[0] as EscapeId | undefined;
  if (today && ESCAPE_IDS.includes(today)) return today;
  const fresh = ESCAPE_IDS.filter((id) => !seen[id]);
  const pool = fresh.length ? fresh : [...ESCAPE_IDS];
  const rng = createRng(`${state.seed}:${key}:escape`);
  return pool[Math.floor(rng() * pool.length)];
}

/** 본 편 기록 (다 봤으면 새 바퀴를 시작한다) */
export function markEscapeSeen(state: AppState, id: EscapeId, key: string): AppState {
  let seen = { ...(state.escapes ?? {}) };
  if (ESCAPE_IDS.every((x) => seen[x]) && seen[id]?.date !== key) seen = {};
  seen[id] = { date: key };
  return { ...state, escapes: seen };
}
