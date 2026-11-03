import { describe, expect, it } from 'vitest';
import { markReviewAsked, REVIEW_GAP_MS, shouldAskReview } from './review';
import type { AppState, DailyWork } from './types';

const DAY = 24 * 60 * 60 * 1000;
const withDays = (n: number) =>
  ({
    settings: {},
    days: Object.fromEntries(Array.from({ length: n }, (_, i) => [`2026-10-0${i + 1}`, { completed: true } as DailyWork])),
  }) as unknown as AppState;

describe('리뷰 부탁', () => {
  it('출근 3일이 안 되면 부탁하지 않는다', () => {
    expect(shouldAskReview(withDays(2), 0)).toBe(false);
    expect(shouldAskReview(withDays(3), 0)).toBe(true);
  });

  it('한 번 부탁하면 30일은 쉬고, 평생 3번까지만', () => {
    let s = markReviewAsked(withDays(5), 0);
    expect(shouldAskReview(s, 10 * DAY)).toBe(false);
    expect(shouldAskReview(s, REVIEW_GAP_MS)).toBe(true);
    s = markReviewAsked(markReviewAsked(s, REVIEW_GAP_MS), 2 * REVIEW_GAP_MS);
    expect(s.reviewAsk!.count).toBe(3);
    expect(shouldAskReview(s, 10 * REVIEW_GAP_MS)).toBe(false);
  });
});
