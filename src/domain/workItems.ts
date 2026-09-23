/** 기획서 6. 시즌 1 「햄스터 사무실 만들기」 */

export interface WorkItem {
  day: number;
  emoji: string;
  name: string;
  /** 완성 후 */
  effect: string;
  /** 사무실 화면 배치 위치 (%) — x, y는 오브젝트 중심, size는 rem */
  pos: { x: number; y: number; size: number };
}

export const SEASON_LENGTH = 20;
export const SEASON_TITLE = '햄스터 사무실 만들기';

export const WORK_ITEMS: WorkItem[] = [
  { day: 1, emoji: '🧱', name: '사무실 벽', effect: '방 생성', pos: { x: 50, y: 0, size: 0 } },
  { day: 2, emoji: '🪑', name: '책상', effect: '책상 배치', pos: { x: 50, y: 70, size: 2.6 } },
  { day: 3, emoji: '💻', name: '컴퓨터', effect: '업무공간 생성', pos: { x: 50, y: 61, size: 1.6 } },
  { day: 4, emoji: '💺', name: '의자', effect: '책상 완성', pos: { x: 50, y: 84, size: 1.9 } },
  { day: 5, emoji: '☕', name: '커피머신', effect: '휴게공간', pos: { x: 86, y: 58, size: 1.7 } },
  { day: 6, emoji: '📚', name: '책장', effect: '사무실 장식', pos: { x: 12, y: 50, size: 2.6 } },
  { day: 7, emoji: '🌱', name: '화분', effect: '사무실 장식', pos: { x: 63, y: 61, size: 1.2 } },
  { day: 8, emoji: '🛋️', name: '소파', effect: '휴게공간', pos: { x: 80, y: 80, size: 2.8 } },
  { day: 9, emoji: '🪟', name: '창문', effect: '외관 변화', pos: { x: 50, y: 22, size: 3.2 } },
  { day: 10, emoji: '🖼️', name: '그림', effect: '벽 장식', pos: { x: 80, y: 24, size: 2 } },
  { day: 11, emoji: '🗄️', name: '서랍장', effect: '사무용품', pos: { x: 30, y: 62, size: 2.1 } },
  { day: 12, emoji: '🧸', name: '인형', effect: '책상 장식', pos: { x: 38, y: 61, size: 1.1 } },
  { day: 13, emoji: '💡', name: '스탠드', effect: '책상 장식', pos: { x: 42, y: 58, size: 1.3 } },
  { day: 14, emoji: '🖨️', name: '프린터', effect: '업무공간', pos: { x: 30, y: 50, size: 1.6 } },
  { day: 15, emoji: '🧃', name: '음료 냉장고', effect: '휴게공간', pos: { x: 90, y: 42, size: 1.8 } },
  { day: 16, emoji: '📅', name: '달력', effect: '벽 장식', pos: { x: 22, y: 24, size: 1.6 } },
  { day: 17, emoji: '🧹', name: '청소도구', effect: '사무실 장식', pos: { x: 8, y: 80, size: 1.7 } },
  { day: 18, emoji: '🎮', name: '게임기', effect: '휴게공간', pos: { x: 68, y: 88, size: 1.3 } },
  { day: 19, emoji: '🪴', name: '대형 화분', effect: '사무실 장식', pos: { x: 22, y: 82, size: 2.4 } },
  { day: 20, emoji: '🚪', name: '사무실 문', effect: '시즌 완성', pos: { x: 94, y: 70, size: 2.8 } },
];

/** 기획서 5-1. 근무시간 = 작업물 제작시간 */
export const STAGES = [
  { from: 0, emoji: '🧱', label: '재료 준비' },
  { from: 0.2, emoji: '🪵', label: '조립' },
  { from: 0.45, emoji: '🔨', label: '제작' },
  { from: 0.75, emoji: '🎨', label: '마감' },
  { from: 1, emoji: '✨', label: '완성' },
] as const;

export function stageOf(progress: number) {
  let s: (typeof STAGES)[number] = STAGES[0];
  for (const st of STAGES) if (progress >= st.from) s = st;
  return s;
}

/** 전체 완성 개수 → 다음 작업물 */
export function itemForCompletedCount(completed: number) {
  return {
    season: Math.floor(completed / SEASON_LENGTH) + 1,
    index: completed % SEASON_LENGTH,
  };
}
