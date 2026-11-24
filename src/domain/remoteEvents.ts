/**
 * 도감 이벤트 늘리기: 앱에 박힌 50+20종 외에 events.json(앱에 든 것 + 사이트에서 받은 것)의 이벤트를 더한다.
 * 아이콘은 그림 파일이 아니라 도형 목록(원·타원·사각형·패스)이라 안전하게 그릴 수 있다.
 * 받은 이벤트는 GACHA_EVENTS / HOLIDAY_EVENTS 목록에 그대로 이어 붙여서, 도감·가챠·업적이 그대로 쓴다.
 */
import bundled from '../content/events.json';
import { EVENT_BY_ID, GACHA_BY_ID, GACHA_EVENTS, HOLIDAY_BY_ID, HOLIDAY_EVENTS, RARITIES, type GachaEvent, type HolidayEvent } from './gacha';
import type { Rarity } from './types';

export type Shape =
  | { t: 'path'; d: string; fill?: string; stroke?: string; sw?: number }
  | { t: 'circle'; cx: number; cy: number; r: number; fill?: string; stroke?: string; sw?: number }
  | { t: 'ellipse'; cx: number; cy: number; rx: number; ry: number; fill?: string; stroke?: string; sw?: number }
  | { t: 'rect'; x: number; y: number; w: number; h: number; rx?: number; fill?: string; stroke?: string; sw?: number };

export interface ExtraEvent {
  id: string;
  kind: 'work' | 'holiday';
  rarity: Rarity;
  emoji: string;
  name: string;
  description: string;
  fridayOnly?: boolean;
  beforeOff?: boolean;
  icon?: Shape[];
}

const num = (v: unknown, lo = -10, hi = 60) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const str = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
/** 색: 팔레트 이름이나 #rrggbb, 또는 none */
const color = (v: unknown) => v === undefined || (typeof v === 'string' && (/^#[0-9a-fA-F]{6}$/.test(v) || /^[a-z]{2,8}$/.test(v)));
const PATH_D = /^[MmLlHhVvCcSsQqTtAaZz0-9 .,-]{1,400}$/;

export function validShape(x: unknown): x is Shape {
  const s = x as Record<string, unknown>;
  if (!s || typeof s !== 'object' || !color(s.fill) || !color(s.stroke) || (s.sw !== undefined && !num(s.sw, 0, 6))) return false;
  switch (s.t) {
    case 'path':
      return typeof s.d === 'string' && PATH_D.test(s.d);
    case 'circle':
      return num(s.cx) && num(s.cy) && num(s.r, 0, 30);
    case 'ellipse':
      return num(s.cx) && num(s.cy) && num(s.rx, 0, 30) && num(s.ry, 0, 30);
    case 'rect':
      return num(s.x) && num(s.y) && num(s.w, 0, 60) && num(s.h, 0, 60) && (s.rx === undefined || num(s.rx, 0, 30));
    default:
      return false;
  }
}

export function validExtraEvent(x: unknown): x is ExtraEvent {
  const e = x as ExtraEvent;
  try {
    return (
      !!e &&
      typeof e.id === 'string' && /^[a-z][a-z0-9-]{1,15}$/.test(e.id) &&
      (e.kind === 'work' || e.kind === 'holiday') &&
      RARITIES.includes(e.rarity) &&
      str(e.emoji, 8) && str(e.name, 24) && str(e.description, 60) &&
      (e.icon === undefined || (Array.isArray(e.icon) && e.icon.length <= 30 && e.icon.every(validShape)))
    );
  } catch {
    return false;
  }
}

/** 받은 이벤트 아이콘 (id → 도형 목록) */
export const EXTRA_ICONS: Record<string, Shape[]> = {};

/** 목록에 없던 이벤트만 이어 붙인다 (이미 있는 id는 글자만 최신으로) */
export function applyExtraEvents(list: unknown[]): number {
  let added = 0;
  for (const x of list) {
    if (!validExtraEvent(x)) continue;
    const base: GachaEvent = { id: x.id, rarity: x.rarity, emoji: x.emoji, name: x.name, description: x.description, ...(x.fridayOnly ? { fridayOnly: true } : {}) };
    if (x.icon) EXTRA_ICONS[x.id] = x.icon;
    const known = EVENT_BY_ID[x.id];
    if (known) {
      Object.assign(known, { emoji: base.emoji, name: base.name, description: base.description });
      continue;
    }
    if (x.kind === 'work') {
      GACHA_EVENTS.push(base);
      GACHA_BY_ID[x.id] = base;
    } else {
      const h: HolidayEvent = { ...base, ...(x.beforeOff ? { beforeOff: true } : {}) };
      HOLIDAY_EVENTS.push(h);
      HOLIDAY_BY_ID[x.id] = h;
    }
    EVENT_BY_ID[x.id] = base;
    added++;
  }
  return added;
}

export const EVENTS_URL = 'https://baebae6ae.github.io/chool_geun/events.json';
const CACHE_KEY = 'hamster-events:v1';

// 앱에 든 것 → 받아 둔 것 순서로 바로 붙인다 (예전에 모은 새 이벤트도 도감에 보이게)
applyExtraEvents((bundled as { events: unknown[] }).events);
try {
  if (typeof localStorage !== 'undefined') applyExtraEvents(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')?.events ?? []);
} catch {
  // 무시
}

/** 사이트에서 이벤트 목록을 받아 붙이고 저장한다. 새로 붙은 게 있으면 true */
export async function refreshEvents(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetcher(`${EVENTS_URL}?h=${Math.floor(Date.now() / 3_600_000)}`, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return false;
    const d = await r.json();
    const list: unknown[] = Array.isArray(d?.events) ? d.events.filter(validExtraEvent) : [];
    if (!list.length) return false;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ events: list }));
    } catch {
      // 저장 못 해도 이번 실행 동안은 쓴다
    }
    return applyExtraEvents(list) > 0;
  } catch {
    return false;
  }
}
