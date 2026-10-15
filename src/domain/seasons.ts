/**
 * 계절 이벤트. 기간 중에 앱을 켠 날이 쌓이면 그 기간에만 받을 수 있는 꾸미기 아이템이 열린다.
 * - 놓쳐도 벌칙은 없고, 다음 해에 같은 기간이 또 돌아온다.
 * - 한 번 받은 아이템은 기간이 끝나도 계속 쓸 수 있다.
 */
import { addDays, pad } from './date';
import type { AppState } from './types';

export type SeasonId = 'halloween' | 'christmas';

export interface SeasonItem {
  kind: 'hat' | 'outfit' | 'deco';
  id: string;
  label: string;
  emoji: string;
  /** 기간 중 앱을 켠 날이 이만큼 되면 열린다 */
  days: number;
}

export interface SeasonEvent {
  id: SeasonId;
  name: string;
  emoji: string;
  /** [월, 일] 시작과 끝(그날 포함). 해를 넘기지 않는 기간 */
  from: [number, number];
  to: [number, number];
  items: SeasonItem[];
}

export const SEASON_EVENTS: SeasonEvent[] = [
  {
    id: 'halloween',
    name: '할로윈',
    emoji: '🎃',
    from: [10, 20],
    to: [11, 2],
    items: [
      { kind: 'hat', id: 'pumpkin', label: '호박 모자', emoji: '🎃', days: 1 },
      { kind: 'hat', id: 'witch', label: '마녀 모자', emoji: '🧙', days: 3 },
      { kind: 'outfit', id: 'skeleton', label: '해골 티셔츠', emoji: '💀', days: 5 },
      { kind: 'deco', id: 'jackolantern', label: '호박등', emoji: '🕯️', days: 7 },
    ],
  },
  {
    id: 'christmas',
    name: '크리스마스',
    emoji: '🎄',
    from: [12, 15],
    to: [12, 27],
    items: [
      { kind: 'hat', id: 'santa', label: '산타 모자', emoji: '🎅', days: 1 },
      { kind: 'hat', id: 'antlers', label: '루돌프 뿔', emoji: '🦌', days: 3 },
      { kind: 'outfit', id: 'scarf', label: '빨간 목도리', emoji: '🧣', days: 5 },
      { kind: 'deco', id: 'tree', label: '크리스마스 트리', emoji: '🎄', days: 7 },
    ],
  },
];

export const SEASON_BY_ID = Object.fromEntries(SEASON_EVENTS.map((e) => [e.id, e])) as Record<SeasonId, SeasonEvent>;
export const SEASON_ITEMS: (SeasonItem & { event: SeasonId })[] = SEASON_EVENTS.flatMap((e) => e.items.map((i) => ({ ...i, event: e.id })));

const ymd = (y: number, [m, d]: [number, number]) => `${y}-${pad(m)}-${pad(d)}`;

export function seasonRange(e: SeasonEvent, year: number): [string, string] {
  return [ymd(year, e.from), ymd(year, e.to)];
}

/** 이 날짜가 속한 계절 이벤트 (없으면 null) */
export function activeSeason(key: string): { event: SeasonEvent; year: number; from: string; to: string } | null {
  const year = Number(key.slice(0, 4));
  for (const event of SEASON_EVENTS) {
    const [from, to] = seasonRange(event, year);
    if (key >= from && key <= to) return { event, year, from, to };
  }
  return null;
}

/** 이벤트 시작 전 며칠 남았는지 (기간 중이거나 올해 이미 지났으면 null) */
export function daysUntilSeason(key: string): { event: SeasonEvent; days: number } | null {
  if (activeSeason(key)) return null;
  const year = Number(key.slice(0, 4));
  let best: { event: SeasonEvent; days: number } | null = null;
  for (const event of SEASON_EVENTS) {
    const [from] = seasonRange(event, year);
    if (from <= key) continue;
    let n = 0;
    for (let k = key; k < from && n < 400; k = addDays(k, 1)) n++;
    if (!best || n < best.days) best = { event, days: n };
  }
  return best;
}

/** 오늘 앱을 켰다고 기록한다 (이벤트 기간이 아니거나 이미 기록했으면 그대로) */
export function visitSeason(state: AppState, key: string): AppState {
  const a = activeSeason(key);
  if (!a) return state;
  const id = `${a.event.id}:${a.year}`;
  const list = state.seasons?.[id] ?? [];
  if (list.includes(key)) return state;
  return { ...state, seasons: { ...state.seasons, [id]: [...list, key] } };
}

/** 이벤트별로 지금까지 가장 많이 접속한 해의 접속일수 */
export function seasonDays(state: Pick<AppState, 'seasons'>): Record<SeasonId, number> {
  const out: Record<SeasonId, number> = { halloween: 0, christmas: 0 };
  for (const [id, list] of Object.entries(state.seasons ?? {})) {
    const ev = id.split(':')[0] as SeasonId;
    if (ev in out) out[ev] = Math.max(out[ev], list.length);
  }
  return out;
}

/** 지금까지 받은 한정 아이템 */
export function ownedSeasonItems(state: Pick<AppState, 'seasons'>) {
  const days = seasonDays(state);
  return SEASON_ITEMS.filter((i) => days[i.event] >= i.days);
}

/** 이 이벤트에서 다음으로 열리는 아이템과 남은 접속일 */
export function nextSeasonItem(state: Pick<AppState, 'seasons'>, id: SeasonId) {
  const days = seasonDays(state)[id];
  const next = SEASON_BY_ID[id].items.find((i) => i.days > days);
  return next ? { item: next, remaining: next.days - days } : null;
}

export function seasonRangeText(e: SeasonEvent): string {
  return `${e.from[0]}/${e.from[1]}~${e.to[0]}/${e.to[1]}`;
}
