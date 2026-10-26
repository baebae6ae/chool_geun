/**
 * 개발자 응원(후원): 광고 없이 개인이 만드는 앱이라, 재밌게 쓰는 사람이 커피 한 잔으로 응원할 수 있다.
 * 후원해도 기능은 똑같다. 대신 햄스터가 고마워하고 도감에 후원자 배지가 붙는다.
 * 결제는 Google Play 인앱 상품(소모성)이라 같은 후원을 여러 번 할 수 있다.
 */
import type { AppState } from './types';

export interface Tier {
  /** Play Console 인앱 상품 ID */
  id: string;
  emoji: string;
  name: string;
  /** 스토어 가격을 못 받아 왔을 때 보여 줄 가격 */
  price: string;
  /** 후원 직후 햄스터의 감사 인사 */
  thanks: string;
}

export const TIERS: Tier[] = [
  { id: 'tip_coffee', emoji: '☕', name: '아아 한 잔', price: '1,500원', thanks: '카페인 충전 완료! 오늘은 야근 안 하고 퇴근할 수 있을 것 같아요' },
  { id: 'tip_cake', emoji: '🍰', name: '케이크 한 조각', price: '5,000원', thanks: '당 충전 완료! 새 썰 하나 더 그릴 힘이 났어요' },
  { id: 'tip_chicken', emoji: '🍗', name: '치킨 반 마리', price: '10,000원', thanks: '치킨이라니… 햄스터가 감동해서 쳇바퀴를 100바퀴 돌았어요' },
];

/** 후원 한 번 기록 */
export function recordSupport(state: AppState, now: number): AppState {
  const s = state.support;
  return { ...state, support: { count: (s?.count ?? 0) + 1, first: s?.first ?? now, last: now } };
}

export const isSupporter = (state: Pick<AppState, 'support'>) => (state.support?.count ?? 0) > 0;
