/** 오늘 번 돈이 이만큼 쌓일 때마다 햄스터가 알려준다 */
export const MILESTONES: { won: number; emoji: string; text: string }[] = [
  { won: 1_000, emoji: '🐟', text: '붕어빵 두 개' },
  { won: 1_800, emoji: '🍙', text: '삼각김밥 하나' },
  { won: 4_500, emoji: '☕', text: '아메리카노 한 잔' },
  { won: 10_000, emoji: '🍲', text: '국밥 한 그릇' },
  { won: 15_000, emoji: '🎬', text: '영화 한 편' },
  { won: 23_000, emoji: '🍗', text: '치킨 한 마리' },
  { won: 45_000, emoji: '🥓', text: '삼겹살 2인분' },
  { won: 70_000, emoji: '🎭', text: '뮤지컬 한 편' },
  { won: 100_000, emoji: '👟', text: '운동화 한 켤레' },
  { won: 150_000, emoji: '🍽️', text: '호텔 뷔페' },
  { won: 250_000, emoji: '✈️', text: '제주도 왕복 비행기' },
  { won: 400_000, emoji: '🎧', text: '무선 이어폰' },
];

/** 번 돈으로 달성한 가장 큰 단계 (-1이면 아직 없음) */
export function milestoneIndex(earned: number): number {
  let i = -1;
  while (i + 1 < MILESTONES.length && earned >= MILESTONES[i + 1].won) i++;
  return i;
}
