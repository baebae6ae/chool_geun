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

export type RoomTheme = 'office' | 'cafe' | 'garden' | 'camp';

export interface SeasonDef {
  theme: RoomTheme;
  title: string;
  /** 방 이름 (화면 제목에 쓴다) */
  room: string;
  icon: string;
  items: WorkItem[];
}

const w = (day: number, emoji: string, name: string, effect: string, x: number, y: number, size: number): WorkItem => ({
  day,
  emoji,
  name,
  effect,
  pos: { x, y, size },
});

/** 시즌 1 — 햄스터 사무실 */
const OFFICE: WorkItem[] = [
  w(1, '🧱', '사무실 벽', '방 생성', 50, 0, 0),
  w(2, '🪑', '책상', '책상 배치', 50, 70, 2.6),
  w(3, '💻', '컴퓨터', '업무공간 생성', 50, 61, 1.6),
  w(4, '💺', '의자', '책상 완성', 50, 84, 1.9),
  w(5, '☕', '커피머신', '휴게공간', 86, 58, 1.7),
  w(6, '📚', '책장', '사무실 장식', 12, 50, 2.6),
  w(7, '🌱', '화분', '사무실 장식', 63, 61, 1.2),
  w(8, '🛋️', '소파', '휴게공간', 80, 80, 2.8),
  w(9, '🪟', '창문', '외관 변화', 50, 22, 3.2),
  w(10, '🖼️', '그림', '벽 장식', 80, 24, 2),
  w(11, '🗄️', '서랍장', '사무용품', 30, 62, 2.1),
  w(12, '🧸', '인형', '책상 장식', 38, 61, 1.1),
  w(13, '💡', '스탠드', '책상 장식', 42, 58, 1.3),
  w(14, '🖨️', '프린터', '업무공간', 30, 50, 1.6),
  w(15, '🧃', '음료 냉장고', '휴게공간', 90, 42, 1.8),
  w(16, '📅', '달력', '벽 장식', 22, 24, 1.6),
  w(17, '🧹', '청소도구', '사무실 장식', 8, 80, 1.7),
  w(18, '🎮', '게임기', '휴게공간', 68, 88, 1.3),
  w(19, '🪴', '대형 화분', '사무실 장식', 22, 82, 2.4),
  w(20, '🚪', '사무실 문', '시즌 완성', 94, 70, 2.8),
];

/** 시즌 2 — 햄스터 카페 */
const CAFE: WorkItem[] = [
  w(1, '🪧', '카페 간판', '가게 이름 걸기', 50, 16, 2.4),
  w(2, '☕', '에스프레소 머신', '메뉴 준비', 20, 58, 2.2),
  w(3, '🧁', '컵케이크 진열대', '디저트', 36, 62, 1.8),
  w(4, '🍰', '시그니처 케이크', '디저트', 60, 62, 1.7),
  w(5, '🍪', '쿠키 접시', '디저트', 74, 64, 1.3),
  w(6, '🪑', '카페 의자', '좌석', 28, 82, 2.1),
  w(7, '🌷', '꽃병', '분위기', 50, 66, 1.3),
  w(8, '📖', '메뉴판', '벽 장식', 82, 36, 1.6),
  w(9, '🕰️', '벽시계', '벽 장식', 15, 26, 1.8),
  w(10, '🎶', '스피커', '분위기', 88, 54, 1.5),
  w(11, '🍯', '꿀단지', '재료', 41, 52, 1.3),
  w(12, '🥐', '크루아상', '베이커리', 66, 52, 1.3),
  w(13, '🧋', '버블티', '신메뉴', 78, 64, 1.4),
  w(14, '🍩', '도넛 탑', '베이커리', 22, 70, 1.4),
  w(15, '🧊', '얼음 냉동고', '재료', 90, 72, 1.6),
  w(16, '💡', '펜던트 조명', '분위기', 35, 30, 1.6),
  w(17, '🖼️', '액자', '벽 장식', 65, 28, 1.8),
  w(18, '🌿', '행잉 화분', '분위기', 92, 22, 1.8),
  w(19, '🛎️', '주문 벨', '카운터', 56, 76, 1.3),
  w(20, '🎉', '개업 풍선', '시즌 완성', 8, 64, 2.2),
];

/** 시즌 3 — 햄스터 옥상 정원 */
const GARDEN: WorkItem[] = [
  w(1, '🌱', '새싹', '씨앗 심기', 20, 72, 1.6),
  w(2, '🪴', '화분', '정원 시작', 32, 64, 1.7),
  w(3, '🌻', '해바라기', '꽃밭', 50, 60, 2.4),
  w(4, '🌷', '튤립 화단', '꽃밭', 68, 66, 1.7),
  w(5, '🌼', '데이지', '꽃밭', 80, 70, 1.4),
  w(6, '🥕', '당근 밭', '텃밭', 24, 84, 1.5),
  w(7, '🍅', '방울토마토', '텃밭', 42, 80, 1.5),
  w(8, '🌽', '옥수수', '텃밭', 58, 78, 1.9),
  w(9, '🪣', '물뿌리개', '정원 도구', 12, 66, 1.5),
  w(10, '🧺', '수확 바구니', '정원 도구', 70, 84, 1.5),
  w(11, '🐝', '꿀벌', '손님', 38, 34, 1.2),
  w(12, '🦋', '나비', '손님', 62, 28, 1.3),
  w(13, '🐛', '애벌레', '손님', 86, 78, 1.1),
  w(14, '☀️', '햇살', '날씨', 82, 14, 2.4),
  w(15, '☁️', '구름', '날씨', 18, 16, 2.2),
  w(16, '🌈', '무지개', '날씨', 50, 20, 3),
  w(17, '🪁', '연', '놀이', 90, 36, 1.6),
  w(18, '🏡', '새집', '손님', 8, 40, 1.8),
  w(19, '🍓', '딸기 화분', '텃밭', 92, 62, 1.4),
  w(20, '⛲', '작은 분수', '시즌 완성', 52, 82, 2.2),
];

/** 시즌 4 — 햄스터 캠핑장 */
const CAMP: WorkItem[] = [
  w(1, '⛺', '텐트', '캠핑장 시작', 50, 62, 3),
  w(2, '🔥', '모닥불', '불 피우기', 72, 76, 2),
  w(3, '🌲', '소나무', '숲', 12, 56, 2.8),
  w(4, '🪵', '장작', '땔감', 84, 82, 1.5),
  w(5, '🌙', '달', '밤하늘', 80, 16, 2.2),
  w(6, '⭐', '별', '밤하늘', 24, 14, 1.4),
  w(7, '🥾', '등산화', '장비', 34, 84, 1.4),
  w(8, '🎒', '배낭', '장비', 24, 78, 1.8),
  w(9, '🧭', '나침반', '장비', 40, 70, 1.2),
  w(10, '🔦', '손전등', '장비', 62, 80, 1.3),
  w(11, '🥫', '통조림', '식량', 78, 68, 1.2),
  w(12, '🍢', '꼬치구이', '식량', 66, 70, 1.3),
  w(13, '🍡', '마시멜로', '식량', 90, 76, 1.2),
  w(14, '🦉', '부엉이', '손님', 36, 30, 1.6),
  w(15, '🐿️', '다람쥐', '손님', 14, 74, 1.4),
  w(16, '🛶', '카누', '호수', 20, 88, 2),
  w(17, '🎣', '낚싯대', '호수', 8, 66, 1.7),
  w(18, '🏞️', '호수 풍경', '풍경', 50, 28, 3.2),
  w(19, '🧣', '담요', '캠핑 용품', 56, 88, 1.5),
  w(20, '🏕️', '캠프 완성', '시즌 완성', 92, 50, 2.6),
];

export const SEASONS: SeasonDef[] = [
  { theme: 'office', title: '햄스터 사무실 만들기', room: '사무실', icon: '🏢', items: OFFICE },
  { theme: 'cafe', title: '햄스터 카페 열기', room: '카페', icon: '☕', items: CAFE },
  { theme: 'garden', title: '옥상 정원 가꾸기', room: '옥상 정원', icon: '🌻', items: GARDEN },
  { theme: 'camp', title: '햄스터 캠핑장', room: '캠핑장', icon: '⛺', items: CAMP },
];

/** 시즌 5부터는 처음 테마로 돌아가 2회차가 된다 */
export function seasonDef(season: number): SeasonDef {
  return SEASONS[(Math.max(1, season) - 1) % SEASONS.length];
}

export function seasonLap(season: number): number {
  return Math.floor((Math.max(1, season) - 1) / SEASONS.length) + 1;
}

export function seasonTitle(season: number): string {
  const lap = seasonLap(season);
  return seasonDef(season).title + (lap > 1 ? ` (${lap}회차)` : '');
}

export function itemAt(season: number, index: number): WorkItem {
  const items = seasonDef(season).items;
  return items[Math.min(Math.max(index, 0), items.length - 1)];
}

/** 예전 코드 호환: 시즌 1 목록 */
export const WORK_ITEMS = OFFICE;
export const SEASON_TITLE = SEASONS[0].title;

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
