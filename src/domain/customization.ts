/** 기획서 15. 햄스터 커스터마이징 — 기본 아이템 + 게임 진행 보상 */
import type { AppState, Customization, DecoId, HamsterColor, HandId, HatId, OutfitId, Rarity, RoomBg, Species } from './types';

export type Unlock =
  | { kind: 'default' }
  | { kind: 'completed'; n: number } // 작업물 n개 완성
  | { kind: 'collected'; n: number } // 도감 n종 수집
  | { kind: 'rarity'; rarity: Rarity } // 해당 등급 이상 1종 획득
  | { kind: 'earned'; won: number }; // 지금까지 번 돈(누적)

export interface CatalogItem<T extends string> {
  id: T;
  label: string;
  emoji: string;
  unlock: Unlock;
}

const d = { kind: 'default' } as const;

/** 털 색상 팔레트. light/shade는 그라디언트 음영, cream은 가슴/배 털 */
export interface FurPalette {
  body: string;
  light: string;
  shade: string;
  cream: string;
  ear: string;
  /** 윤곽선 */
  line: string;
}

export const COLORS: (CatalogItem<HamsterColor> & FurPalette)[] = [
  { id: 'golden', label: '골든', emoji: '🟠', unlock: d, body: '#ffcf9c', light: '#ffe3c2', shade: '#f0a06c', cream: '#fff7ec', ear: '#b07a52', line: '#a85f26' },
  { id: 'white', label: '화이트', emoji: '⚪', unlock: d, body: '#ffffff', light: '#ffffff', shade: '#e4ddd4', cream: '#ffffff', ear: '#cdc8c2', line: '#b3a28c' },
  { id: 'gray', label: '그레이', emoji: '🩶', unlock: { kind: 'completed', n: 3 }, body: '#d8d4cf', light: '#e8e5e1', shade: '#aaa39b', cream: '#f7f5f2', ear: '#aaa49f', line: '#6d665f' },
  { id: 'choco', label: '초코', emoji: '🟤', unlock: { kind: 'completed', n: 7 }, body: '#b98158', light: '#cf9c77', shade: '#8a5a3c', cream: '#f6e4cf', ear: '#855a3e', line: '#432818' },
  { id: 'cream', label: '크림', emoji: '🍦', unlock: { kind: 'completed', n: 30 }, body: '#fff0d2', light: '#fff7e8', shade: '#f0cf9c', cream: '#fffaf0', ear: '#d9b78a', line: '#b08a55' },
  { id: 'silver', label: '실버', emoji: '🩵', unlock: { kind: 'completed', n: 150 }, body: '#e6e3ee', light: '#f2f0f8', shade: '#b9b4cc', cream: '#f8f6fc', ear: '#a59fbd', line: '#6f6a88' },
];

export const SPECIES: CatalogItem<Species>[] = [
  { id: 'hamster', label: '햄스터', emoji: '🐹', unlock: d },
  { id: 'rabbit', label: '토끼', emoji: '🐰', unlock: d },
  { id: 'bird', label: '오목눈이', emoji: '🐦', unlock: d },
  { id: 'cat', label: '고양이', emoji: '🐱', unlock: d },
];

export const HATS: CatalogItem<HatId>[] = [
  { id: 'none', label: '없음', emoji: '🚫', unlock: d },
  { id: 'postit', label: '포스트잇', emoji: '📝', unlock: d },
  { id: 'cup', label: '종이컵', emoji: '🥤', unlock: { kind: 'completed', n: 5 } },
  { id: 'stapler', label: '스테이플러', emoji: '📎', unlock: { kind: 'completed', n: 10 } },
  { id: 'mouse', label: '마우스', emoji: '🖱️', unlock: { kind: 'collected', n: 12 } },
  { id: 'headset', label: '헤드셋', emoji: '🎧', unlock: { kind: 'rarity', rarity: 'RARE' } },
  { id: 'eraser', label: '지우개', emoji: '🧽', unlock: { kind: 'completed', n: 30 } },
  { id: 'tape', label: '박스테이프', emoji: '📦', unlock: { kind: 'earned', won: 3_000_000 } },
];

export const OUTFITS: CatalogItem<OutfitId>[] = [
  { id: 'none', label: '없음', emoji: '🚫', unlock: d },
  { id: 'tie', label: '넥타이', emoji: '👔', unlock: d },
  { id: 'badge', label: '사원증', emoji: '🪪', unlock: { kind: 'completed', n: 2 } },
  { id: 'suit', label: '정장', emoji: '🤵', unlock: { kind: 'completed', n: 10 } },
  { id: 'cardigan', label: '카디건', emoji: '🧶', unlock: { kind: 'collected', n: 15 } },
  { id: 'bubble', label: '뽁뽁이 망토', emoji: '🫧', unlock: { kind: 'completed', n: 25 } },
  { id: 'box', label: '택배 상자', emoji: '📦', unlock: { kind: 'completed', n: 45 } },
];

export const HANDS: CatalogItem<HandId>[] = [
  { id: 'none', label: '없음', emoji: '🚫', unlock: d },
  { id: 'pencil', label: '연필', emoji: '✏️', unlock: d },
  { id: 'highlighter', label: '형광펜', emoji: '🖍️', unlock: { kind: 'completed', n: 4 } },
  { id: 'calculator', label: '계산기', emoji: '🧮', unlock: { kind: 'completed', n: 15 } },
  { id: 'stamp', label: '결재 도장', emoji: '🔖', unlock: { kind: 'completed', n: 35 } },
];

export const DECOS: CatalogItem<DecoId>[] = [
  { id: 'none', label: '없음', emoji: '🚫', unlock: d },
  { id: 'plant', label: '화분', emoji: '🌱', unlock: d },
  { id: 'doll', label: '인형', emoji: '🧸', unlock: { kind: 'completed', n: 12 } },
  { id: 'cactus', label: '선인장', emoji: '🌵', unlock: { kind: 'collected', n: 25 } },
  { id: 'cake', label: '케이크', emoji: '🍰', unlock: { kind: 'completed', n: 40 } },
  { id: 'sunflower', label: '해바라기', emoji: '🌻', unlock: { kind: 'completed', n: 60 } },
  { id: 'lantern', label: '랜턴', emoji: '🏮', unlock: { kind: 'completed', n: 80 } },
];

/** 서식지 배경 — 시즌을 끝낼 때마다 하나씩 열린다 */
export const BACKGROUNDS: CatalogItem<RoomBg>[] = [
  { id: 'default', label: '기본 방', emoji: '🏠', unlock: d },
  { id: 'cafe', label: '카페', emoji: '☕', unlock: { kind: 'completed', n: 40 } },
  { id: 'garden', label: '옥상 정원', emoji: '🌻', unlock: { kind: 'completed', n: 60 } },
  { id: 'camp', label: '캠핑장', emoji: '⛺', unlock: { kind: 'completed', n: 80 } },
];

/** 저장된 꾸미기에서 사라진 아이템(옛 모자·옷)은 '없음'으로 돌린다 */
export function sanitizeCustom(c: Partial<Customization> | undefined): Customization {
  const m = { ...DEFAULT_CUSTOM, ...c };
  const ok = <T extends string>(list: { id: T }[], v: T, fallback: T): T => (list.some((i) => i.id === v) ? v : fallback);
  return {
    ...m,
    species: ok(SPECIES, m.species ?? 'hamster', 'hamster'),
    color: ok(COLORS, m.color, 'golden'),
    hat: ok(HATS, m.hat, 'none'),
    outfit: ok(OUTFITS, m.outfit, 'none'),
    hand: ok(HANDS, m.hand, 'none'),
    deco: ok(DECOS, m.deco, 'none'),
    bg: ok(BACKGROUNDS, m.bg ?? 'default', 'default'),
  };
}

/** 문구 속 '햄스터'를 지금 키우는 캐릭터 이름으로 바꾼다 (토끼·오목눈이·고양이 모두 받침이 없어 조사는 그대로 맞는다) */
export function speciesWord(text: string, species: Species | undefined): string {
  if (!species || species === 'hamster') return text;
  const name = SPECIES.find((x) => x.id === species)?.label ?? '햄스터';
  return text.replaceAll('햄스터', name);
}

/** 쓰다듬거나 간식을 줄 때 캐릭터마다 다른 반응 말풍선 */
export const REACTION_LINES: Record<Species, { pet: string[]; feed: string[]; hug: string[] }> = {
  hamster: {
    pet: ['헤헤, 간지러워요', '더 쓰다듬어 주세요', '오늘도 고생했어요', '손이 따뜻해요', '찍찍!'],
    feed: ['냠냠! 해바라기씨 최고예요', '볼주머니에 쏙 넣어둘게요', '바삭바삭… 고마워요!', '더 주세요… 는 농담이에요'],
    hug: ['꼬옥 안아줄게요 🤍'],
  },
  rabbit: {
    pet: ['귀 만지면 간지러워요', '더 쓰다듬어 주세요', '쫑긋쫑긋!', '손이 따뜻해요', '푸르르~ 기분 좋아요'],
    feed: ['아삭아삭! 최고예요', '당근이면 더 좋은데… 농담이에요', '냠냠, 오물오물…', '고마워요, 깡총!'],
    hug: ['폭신하게 안아줄게요 🤍'],
  },
  bird: {
    pet: ['짹짹! 간지러워요', '쪼로롱~ 기분 좋아요', '깃털이 부풀었어요', '손이 따뜻해요', '포르르~'],
    feed: ['콕콕! 맛있어요', '모이 고마워요, 짹짹!', '쪼옥쪼옥… 냠냠', '더 주세요… 는 농담이에요'],
    hug: ['깃털로 폭 감싸줄게요 🤍'],
  },
  cat: {
    pet: ['골골골~', '야옹~ 더 긁어주세요', '그르릉… 기분 좋아요', '손이 따뜻해서 졸려요', '냥!'],
    feed: ['츄릅… 간식이다냥', '냠냠! 맛있다냥', '고마워요, 골골~', '더 주세요… 는 농담이에요'],
    hug: ['골골골… 꼬옥 안아줄게요 🤍'],
  },
};

export const GLASSES_UNLOCK: Unlock = { kind: 'collected', n: 3 };

export const DEFAULT_CUSTOM: Customization = {
  species: 'hamster',
  color: 'golden',
  glasses: false,
  hat: 'none',
  outfit: 'tie',
  hand: 'none',
  laptop: true,
  mug: true,
  deco: 'plant',
  bg: 'default',
};

const RARITY_ORDER: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export interface Progress {
  completed: number;
  collected: number;
  bestRarity: number; // RARITY_ORDER 인덱스, 없으면 -1
  /** 지금까지 번 돈 */
  earned: number;
}

export function isUnlocked(u: Unlock, p: Progress): boolean {
  switch (u.kind) {
    case 'default':
      return true;
    case 'completed':
      return p.completed >= u.n;
    case 'collected':
      return p.collected >= u.n;
    case 'rarity':
      return p.bestRarity >= RARITY_ORDER.indexOf(u.rarity);
    case 'earned':
      return p.earned >= u.won;
  }
}

export function unlockText(u: Unlock): string {
  switch (u.kind) {
    case 'default':
      return '';
    case 'completed':
      return `작업물 ${u.n}개 완성`;
    case 'collected':
      return `도감 ${u.n}종 수집`;
    case 'rarity':
      return `${u.rarity} 이상 획득`;
    case 'earned':
      return `누적 ${(u.won / 10000).toLocaleString('ko-KR')}만 원 벌기`;
  }
}

export function rarityIndex(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

/** 가장 가까운 다음 해금 (작업물 개수 기준). 다 열었으면 null */
export function nextUnlock(p: Progress): { label: string; emoji: string; remaining: number } | null {
  const all: { label: string; emoji: string; unlock: Unlock }[] = [...COLORS, ...HATS, ...OUTFITS, ...HANDS, ...DECOS, ...BACKGROUNDS];
  let best: { label: string; emoji: string; remaining: number } | null = null;
  for (const it of all) {
    if (it.unlock.kind !== 'completed' || p.completed >= it.unlock.n) continue;
    const remaining = it.unlock.n - p.completed;
    if (!best || remaining < best.remaining) best = { label: it.label, emoji: it.emoji, remaining };
  }
  return best;
}

/** 출근일수 칭호 */
export const CAREER_TITLES: { n: number; title: string }[] = [
  { n: 0, title: '수습 햄스터' },
  { n: 10, title: '신입 햄스터' },
  { n: 30, title: '적응 완료' },
  { n: 60, title: '든든한 대리' },
  { n: 100, title: '백일 기념 과장' },
  { n: 200, title: '베테랑 차장' },
  { n: 365, title: '1주년 부장' },
  { n: 730, title: '전설의 임원' },
];

export function careerTitle(completed: number, species: Species = 'hamster'): string {
  let t = CAREER_TITLES[0].title;
  for (const c of CAREER_TITLES) if (completed >= c.n) t = c.title;
  const name = SPECIES.find((x) => x.id === species)?.label ?? '햄스터';
  return t.replace('햄스터', name);
}

export type ProgressSource = Pick<AppState, 'days' | 'collection'>;
