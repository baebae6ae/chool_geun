/**
 * 리뷰 부탁: 기분 좋은 순간(사이다 날린 뒤, 썰 다 본 뒤, 드래곤 변신 뒤, 월급날)에 가끔 Google Play 별점 창을 띄운다.
 * 출근을 3일 이상 한 사람에게만, 한 번 띄우면 30일은 쉬고, 평생 3번까지만. (실제로 뜰지는 Google이 한 번 더 정한다)
 */
import { completedCount } from './engine';
import type { AppState } from './types';

export const REVIEW_MIN_DAYS = 3;
export const REVIEW_GAP_MS = 30 * 24 * 60 * 60 * 1000;
export const REVIEW_MAX = 3;

export function shouldAskReview(state: AppState, now: number): boolean {
  if (!state.settings || completedCount(state.days) < REVIEW_MIN_DAYS) return false;
  const r = state.reviewAsk;
  if (!r) return true;
  return r.count < REVIEW_MAX && now - r.last >= REVIEW_GAP_MS;
}

export function markReviewAsked(state: AppState, now: number): AppState {
  return { ...state, reviewAsk: { count: (state.reviewAsk?.count ?? 0) + 1, last: now } };
}
