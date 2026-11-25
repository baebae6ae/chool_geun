/**
 * 월급날 다이어리 연출: 1쪽 "월급 들어온 날!!!"은 같고, 2쪽은 여섯 편 중 하나.
 * 아직 안 본 편을 먼저, 다 봤으면 처음부터 다시. 같은 날엔 언제 열어도 같은 편.
 * 화면 그리기는 components/payday, 여기는 편 고르기·시간표·금액처럼 화면과 상관없는 계산만 둔다.
 */
import { weekday } from './date';
import { createRng } from './random';
import type { AppState } from './types';

export const PAYDAY_IDS = ['bills', 'cart', 'breeze', 'train', 'flex', 'piggy'] as const;
export type PaydayId = (typeof PAYDAY_IDS)[number];

export function pickPayday(state: Pick<AppState, 'seed' | 'paydayEps'>, key: string): PaydayId {
  const seen = state.paydayEps ?? {};
  const today = Object.entries(seen).find(([, v]) => v?.date === key)?.[0] as PaydayId | undefined;
  if (today && PAYDAY_IDS.includes(today)) return today;
  // 처음 보는 사람은 원래 편(청구서)부터
  if (!Object.keys(seen).length) return 'bills';
  const fresh = PAYDAY_IDS.filter((id) => !seen[id]);
  const pool = fresh.length ? fresh : [...PAYDAY_IDS];
  const rng = createRng(`${state.seed}:${key}:payday`);
  return pool[Math.floor(rng() * pool.length)];
}

/** 본 편 기록 (다 봤으면 새 바퀴를 시작한다) */
export function markPaydaySeen(state: AppState, id: PaydayId, key: string): AppState {
  let seen = { ...(state.paydayEps ?? {}) };
  if (PAYDAY_IDS.every((x) => seen[x]) && seen[id]?.date !== key) seen = {};
  seen[id] = { date: key };
  return { ...state, paydayEps: seen };
}

/** 편마다 마지막에 남는 돈 (개그) */
export const LEFTOVERS: Record<PaydayId, number> = { bills: 3_200, cart: 870, breeze: 12, train: 3_200, flex: 1_500, piggy: 0 };

/** 받은 돈에서 남길 돈을 빼고 비율대로 나눈다 (천 원 단위, 나머지는 마지막 몫). 음수는 없다 */
export function splitPay(total: number, leftover: number, ratios: number[]): number[] {
  const rest = Math.max(0, Math.floor(total) - leftover);
  const parts = ratios.slice(0, -1).map((r) => Math.floor((rest * r) / 1000) * 1000);
  return [...parts, rest - parts.reduce((a, b) => a + b, 0)];
}

/** 마지막에 남는 돈 (개그) */
export const LEFTOVER = 3_200;

export interface CinemaBill {
  name: string;
  color: string;
  amount: number;
  /** 2쪽 기준으로 청구서가 쾅 내려앉는 시각(초) */
  at: number;
}

/** 실제로 받은 돈을 청구서 넷이 나눠 가져가고 3,200원만 남는다 (재미용 비율, 천 원 단위) */
export function paydayBills(total: number): CinemaBill[] {
  const rest = Math.max(0, Math.floor(total) - LEFTOVER);
  const k = (r: number) => Math.floor((rest * r) / 1000) * 1000;
  const card = k(0.42);
  const rent = k(0.38);
  const phone = k(0.04);
  const sub = rest - card - rent - phone;
  return [
    { name: '카드값', color: '#e0533d', amount: card, at: 0.9 },
    { name: '월세', color: '#3b7be2', amount: rent, at: 1.9 },
    { name: '통신비', color: '#2fa463', amount: phone, at: 2.9 },
    { name: '구독료', color: '#9a5bd6', amount: sub, at: 3.9 },
  ];
}

/** 이 날짜에 보여 줄 "11월 25일 (화)" */
export function diaryDate(key: string): string {
  const [, m, d] = key.split('-').map(Number);
  return `${m}월 ${d}일 (${'일월화수목금토'[weekday(key)]})`;
}

/** 1쪽(월급 들어온 날) 길이, 넘기는 시간, 2쪽 시작 시각, 전체 길이 (초) */
export const PAGE_FLIP = 4.3;
export const PAGE2 = 4.9;
export const CINEMA_END = PAGE2 + 7.2;

/** 동전 더미: 위쪽 줄부터 가져가도록 아래 줄 → 위 줄 순서. 청구서 하나가 4개씩 가져간다 */
export const PILE: [number, number][] = (() => {
  const out: [number, number][] = [];
  let s = 11;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  [8, 5, 3].forEach((cap, row) => {
    for (let k = 0; k < cap; k++) out.push([360 + (k - (cap - 1) / 2) * 52 + (r() - 0.5) * 10, 962 - row * 32]);
  });
  return out;
})();

/** 1쪽: 동전이 터져 나와 더미에 내려앉는 시각과 궤적 */
export const BURST = PILE.map(([x, y], i) => {
  let s = 100 + i * 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const t0 = 2.08 + r() * 0.25;
  const dur = 0.6 + r() * 0.35;
  return { x, y, t0, dur, h: 260 + r() * 260, spin: 9 + r() * 9, sx: 360 + (r() - 0.5) * 60, sy: 780 };
});

/** 2쪽: 청구서 i가 가져가는 동전 j(0~3)의 출발 시각 */
export const grabAt = (bill: CinemaBill, j: number) => bill.at + 0.35 + j * 0.13;
export const GRAB_DUR = 0.45;

export type Sfx = 'pen' | 'ding' | 'buzz' | 'whoosh' | 'thump' | 'clink' | 'twinkle' | 'slam' | 'scribble' | 'sad' | 'pop' | 'pthud' | 'wind' | 'rustle' | 'chime' | 'rattle' | 'print';
export type Cue = { at: number; sfx: Sfx; dur?: number };

/** 1쪽 효과음 (연출 처음 기준) */
export function page1Cues(): Cue[] {
  const cues: Cue[] = [
    { at: 0, sfx: 'pen', dur: 0.55 },
    { at: 1.12, sfx: 'ding' },
    { at: 1.12, sfx: 'buzz', dur: 0.33 },
    { at: 1.78, sfx: 'whoosh', dur: 0.3 },
    { at: 2.04, sfx: 'thump' },
    { at: 2.3, sfx: 'twinkle' },
    { at: 3.15, sfx: 'pen', dur: 0.45 },
    { at: PAGE_FLIP, sfx: 'whoosh', dur: 0.4 },
  ];
  for (const c of BURST) cues.push({ at: c.t0 + c.dur, sfx: 'clink' });
  return cues;
}

/** 효과음 시간표 (초, 연출 처음 기준): 1쪽 + 2쪽(page2는 2쪽 시작 기준 시간표) */
export function withPage1(page2: Cue[]): Cue[] {
  return [...page1Cues(), ...page2.map((c) => ({ ...c, at: c.at + PAGE2 }))].filter((c) => c.at < CINEMA_END).sort((a, b) => a.at - b.at);
}

/** 원래 편(청구서) 효과음 */
export function sfxCues(bills: CinemaBill[]): Cue[] {
  const cues: Cue[] = [
    { at: PAGE2, sfx: 'pen', dur: 0.6 },
    { at: PAGE2 + 0.45, sfx: 'pen', dur: 0.45 },
  ];
  for (const b of bills) {
    cues.push({ at: PAGE2 + b.at, sfx: 'slam' });
    for (let j = 0; j < 4; j++) cues.push({ at: PAGE2 + grabAt(b, j) + GRAB_DUR, sfx: 'clink' });
  }
  const last = bills[bills.length - 1];
  cues.push({ at: PAGE2 + last.at + 1.15, sfx: 'scribble', dur: 0.5 }, { at: PAGE2 + last.at + 1.3, sfx: 'sad' }, { at: PAGE2 + 5.3, sfx: 'pen', dur: 0.6 });
  return withPage1(cues.map((c) => ({ ...c, at: c.at - PAGE2 })));
}
