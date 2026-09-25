/** 기획서 15. 햄스터 커스터마이징 — 기본 아이템 + 게임 진행 보상 */
import type { AppState, Customization, DecoId, HamsterColor, HatId, OutfitId, Rarity } from './types';

export type Unlock =
  | { kind: 'default' }
  | { kind: 'completed'; n: number } // 작업물 n개 완성
  | { kind: 'collected'; n: number } // 도감 n종 수집
  | { kind: 'rarity'; rarity: Rarity }; // 해당 등급 이상 1종 획득

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
  { id: 'golden', label: '골든', emoji: '🟠', unlock: d, body: '#ffd6a6', light: '#ffe7c9', shade: '#e9b27a', cream: '#fff7ec', ear: '#8b5a36', line: '#a85f26' },
  { id: 'white', label: '화이트', emoji: '⚪', unlock: d, body: '#ffffff', light: '#ffffff', shade: '#e4ddd4', cream: '#ffffff', ear: '#cdc8c2', line: '#b3a28c' },
  { id: 'gray', label: '그레이', emoji: '🩶', unlock: { kind: 'completed', n: 3 }, body: '#d8d4cf', light: '#e8e5e1', shade: '#aaa39b', cream: '#f7f5f2', ear: '#8e8883', line: '#6d665f' },
  { id: 'choco', label: '초코', emoji: '🟤', unlock: { kind: 'completed', n: 7 }, body: '#b98158', light: '#cf9c77', shade: '#8a5a3c', cream: '#f6e4cf', ear: '#5e3a24', line: '#432818' },
];

export const HATS: CatalogItem<HatId>[] = [
  { id: 'none', label: '없음', emoji: '🚫', unlock: d },
  { id: 'cap', label: '야구모자', emoji: '🧢', unlock: d },
  { id: 'beanie', label: '비니', emoji: '🧶', unlock: { kind: 'completed', n: 5 } },
  { id: 'ribbon', label: '리본', emoji: '🎀', unlock: { kind: 'collected', n: 8 } },
  { id: 'headset', label: '헤드셋', emoji: '🎧', unlock: { kind: 'rarity', rarity: 'RARE' } },
  { id: 'crown', label: '왕관', emoji: '👑', unlock: { kind: 'completed', n: 20 } },
];

export const OUTFITS: CatalogItem<OutfitId>[] = [
  { id: 'none', label: '없음', emoji: '🚫', unlock: d },
  { id: 'tie', label: '넥타이', emoji: '👔', unlock: d },
  { id: 'hoodie', label: '후드티', emoji: '🧥', unlock: { kind: 'completed', n: 2 } },
  { id: 'cardigan', label: '카디건', emoji: '🧶', unlock: { kind: 'collected', n: 15 } },
  { id: 'suit', label: '정장', emoji: '🤵', unlock: { kind: 'completed', n: 10 } },
  { id: 'apron', label: '앞치마', emoji: '🍳', unlock: { kind: 'rarity', rarity: 'EPIC' } },
];

export const DECOS: CatalogItem<DecoId>[] = [
  { id: 'none', label: '없음', emoji: '🚫', unlock: d },
  { id: 'plant', label: '화분', emoji: '🌱', unlock: d },
  { id: 'doll', label: '인형', emoji: '🧸', unlock: { kind: 'completed', n: 12 } },
  { id: 'cactus', label: '선인장', emoji: '🌵', unlock: { kind: 'collected', n: 25 } },
];

export const GLASSES_UNLOCK: Unlock = { kind: 'collected', n: 3 };

export const DEFAULT_CUSTOM: Customization = {
  color: 'golden',
  glasses: false,
  hat: 'none',
  outfit: 'tie',
  laptop: true,
  mug: true,
  deco: 'plant',
};

const RARITY_ORDER: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

export interface Progress {
  completed: number;
  collected: number;
  bestRarity: number; // RARITY_ORDER 인덱스, 없으면 -1
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
  }
}

export function rarityIndex(r: Rarity): number {
  return RARITY_ORDER.indexOf(r);
}

export type ProgressSource = Pick<AppState, 'days' | 'collection'>;
