/**
 * 썰 극장: 직장 썰을 지금 키우는 캐릭터가 주인공인 세로 숏폼 애니메이션으로 보여 준다.
 * 썰 하나는 컷(Cut)의 목록이고, 컷마다 웹툰처럼 칸(Panel)을 나누고 시간에 맞춰 이벤트가 일어난다.
 * 연출 문법: 세로 꽉 찬 화면 + 진행 막대, 웹툰 컷 분할, 점프컷·휙 넘기기·스크롤 전환,
 * 단어 단위로 튀어나오는 자막(키네틱 타이포), 2프레임 끊어 움직이기, 망점·색 어긋남, 레이어 깊이감과 초점 이동.
 */
import type { FrontAction } from '../components/hamster/HamsterSprite';
import type { AppState, DailyWork, HatId, OutfitId, Species } from './types';
import { createRng } from './random';
import bundled from '../content/stories.json';

/**
 * 배경: 장소 · 속마음 장소(황무지·후광·먹구름·우주) · 설정 샷(건물 밖) · 단색,
 * 그리고 화면 가득 소품을 보여 주는 인서트(폰 잠금화면 `phone:19:40|보낸 사람|알림`, 벽시계 `clock:16:47`, 모니터 `screen:문구`,
 * 출입문 지문 인식기 `scan:08:59:57|다시 시도하세요`)
 */
export type Bg =
  | 'office'
  | 'meeting'
  | 'pantry'
  | 'elevator'
  | 'subway'
  | 'building'
  | 'restroom'
  | 'copyroom'
  | 'beach'
  | 'home'
  | 'wasteland'
  | 'halo'
  | 'rain'
  | 'space'
  | `flat:${string}`
  | `phone:${string}`
  | `clock:${string}`
  | `screen:${string}`
  | `scan:${string}`;
/** 카메라 거리: 전체 → 중간 → 가까이 → 얼굴 */
export type Shot = 'wide' | 'medium' | 'close' | 'face';
/** 칸 나누기: 한 칸 / 위아래 / 좌우 대치 / 위 하나 + 아래 둘 */
export type Layout = 'full' | 'stack' | 'versus' | 'trio';
/** 컷 전환: 점프컷 / 휙 넘기기 / 웹툰 스크롤 / 쾅 확대 */
export type Enter = 'cut' | 'whip' | 'scroll' | 'punch';
export type Mark = 'sweat' | 'anger' | 'sparkle' | 'gloom' | 'idea' | null;
/** 대본에서 쓰는 동작: 정면 동작 + 눕기(옆으로 누워 잠) */
export type Act = FrontAction | 'lie';
export type PropName = 'door' | 'laptop' | 'fridge' | 'lift' | 'printer' | 'stall';
export type TextStyle = 'narr' | 'shout' | 'whisper' | 'label' | 'sfx' | 'stamp';

export interface Role {
  id: string;
  /** me = 지금 키우는 캐릭터, boss·mate = 다른 종 동료 */
  as: 'me' | 'boss' | 'mate';
  label: string;
  outfit?: OutfitId;
  hat?: HatId;
}

export interface Place {
  who: string;
  x: number;
  action?: Act;
  facing?: 1 | -1;
  hidden?: boolean;
  /** 물속에 잠겨 있음 (바다 배경에서 `sink`로 떠오른다) */
  sunk?: boolean;
  /** 책상에 앉아 있음 (앞에 노트북 책상) */
  desk?: boolean;
  /** 이름표 스티커 */
  tag?: boolean;
}

export interface Panel {
  bg: Bg;
  shot: Shot;
  /** 카메라가 따라갈 배우 */
  focus?: string;
  cast: Place[];
  /** 초점: 앞(fg)이나 뒤(bg)를 흐리게 */
  blur?: 'fg' | 'bg';
}

export type Ev = { at: number; p?: number } & (
  | { do: 'act'; who: string; action: Act }
  | { do: 'move'; who: string; to: number; ms: number; run?: boolean; then?: Act }
  | { do: 'show'; who: string }
  | { do: 'say'; who: string; text: string }
  | { do: 'text'; text: string; x: number; y: number; style: TextStyle; size?: number; tilt?: number }
  /** 숫자가 촤라락 바뀌는 자막 */
  | { do: 'count'; from: string; to: string; x: number; y: number; ms: number }
  | { do: 'chat'; from: 'them' | 'me'; name?: string; text: string }
  | { do: 'mark'; who: string; mark: Mark }
  | { do: 'flash' }
  | { do: 'shake'; power?: 1 | 2 | 3 }
  /** 색 어긋남(망점 인쇄가 어긋난 듯한 글리치) */
  | { do: 'glitch'; ms: number }
  /** 칸 밖으로 튀어나오기 */
  | { do: 'burst'; who: string }
  /** 초점 이동 */
  | { do: 'focus'; blur: 'fg' | 'bg' | null }
  /** 칸 안에서 한 번에 확 당기기 (점프 줌) */
  | { do: 'snap'; shot: Shot; focus?: string }
  | { do: 'prop'; prop: PropName; state: string }
  /** 물속으로 잠기기(on) · 물 위로 쑥 떠오르기(off) */
  | { do: 'sink'; who: string; on: boolean }
  /** 카메라를 천천히 옮기기 (다가가기·따라가기) */
  | { do: 'cam'; shot: Shot; focus?: string; ms: number }
  /** 조명: 0 = 그대로, 1 = 완전 암전 */
  | { do: 'light'; level: number; ms: number }
  /** 과하게 밝아지며 번지는 패닉 화면 */
  | { do: 'glare'; on: boolean }
  /** 새까만 실루엣으로 */
  | { do: 'silhouette'; who: string; on: boolean }
  /** 머리 위 생각 풍선: 내 분신 count명이 action을 한다 */
  | { do: 'dream'; who: string; count: number; action?: Act; text?: string }
  | { do: 'dreamPop' }
  /** 한 번에 가지 않고 들썩들썩 조금씩 다가가기 */
  | { do: 'inch'; who: string; to: number; steps: number; ms: number }
);

export interface Cut {
  ms: number;
  layout: Layout;
  enter?: Enter;
  panels: Panel[];
  events?: Ev[];
}

export interface Story {
  id: string;
  no: number;
  title: string;
  credit: string;
  cast: Role[];
  cuts: Cut[];
}

/** 동료 역할을 맡을 종 두 가지: 내 캐릭터와 다른 종 */
export function castSpecies(me: Species | undefined): { boss: Species; mate: Species } {
  const kind = me === 'lop' ? 'rabbit' : (me ?? 'hamster');
  const others = (['cat', 'hamster', 'bird', 'rabbit'] as Species[]).filter((s) => s !== kind);
  return { boss: others[0], mate: others[1] };
}

/* ============================ 대본 불러오기 ============================ */

/** 대본에서 쓸 수 있는 정면 동작 (엔진이 그릴 줄 아는 것만) */
const FRONT_ACTIONS: FrontAction[] = [
  'idle', 'sniff', 'groom', 'nibble', 'yawn', 'sip', 'look', 'type', 'typeFast', 'wave', 'stuff', 'sneeze', 'doze', 'dizzy', 'dance',
  'cheer', 'heart', 'shy', 'hug', 'doom', 'meal', 'game', 'phone', 'read', 'shower', 'snack', 'smug', 'tongue', 'shrug', 'slowclap',
  'phoneShow', 'earplug', 'phoneToss', 'hipsway', 'blowkiss', 'slam', 'cider', 'ahh', 'shock', 'cry', 'quake', 'rotten', 'resolve',
  'headhold', 'kneel', 'soul', 'think', 'aha', 'tug', 'poke',
];
const ACTIONS = new Set<string>([...FRONT_ACTIONS, 'lie']);
const PLACES = new Set(['office', 'meeting', 'pantry', 'elevator', 'subway', 'building', 'restroom', 'copyroom', 'beach', 'home', 'wasteland', 'halo', 'rain', 'space']);
const PANELS_OF: Record<string, number> = { full: 1, stack: 2, versus: 2, trio: 3 };
const SHOTS = new Set(['wide', 'medium', 'close', 'face']);
const ENTERS = new Set(['cut', 'whip', 'scroll', 'punch']);
const STYLES = new Set(['narr', 'shout', 'whisper', 'label', 'sfx', 'stamp']);
const MARKS = new Set(['sweat', 'anger', 'sparkle', 'gloom', 'idea', null]);
const PROPS = new Set(['door', 'laptop', 'fridge', 'lift', 'printer', 'stall']);

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const okBg = (v: unknown) => isStr(v) && (PLACES.has(v) || /^(flat|phone|clock|screen|scan):./.test(v));

/** 인터넷에서 받은 대본이 엔진이 그릴 수 있는 형태인지 꼼꼼히 확인한다 (틀린 썰은 통째로 건너뛴다) */
export function validStory(x: unknown): x is Story {
  try {
    const s = x as Story;
    if (!s || !isStr(s.id) || !isNum(s.no) || !isStr(s.title) || !isStr(s.credit)) return false;
    if (!Array.isArray(s.cast) || !s.cast.length || !Array.isArray(s.cuts) || !s.cuts.length || s.cuts.length > 20) return false;
    const roles = new Set<string>();
    for (const r of s.cast) {
      if (!isStr(r.id) || !['me', 'boss', 'mate'].includes(r.as) || !isStr(r.label)) return false;
      roles.add(r.id);
    }
    for (const c of s.cuts) {
      if (!isNum(c.ms) || c.ms < 300 || c.ms > 10_000 || PANELS_OF[c.layout] === undefined || !Array.isArray(c.panels)) return false;
      if (c.panels.length !== PANELS_OF[c.layout] || (c.enter !== undefined && !ENTERS.has(c.enter))) return false;
      for (const p of c.panels) {
        if (!okBg(p.bg) || !SHOTS.has(p.shot) || !Array.isArray(p.cast)) return false;
        if (p.focus !== undefined && !roles.has(p.focus)) return false;
        for (const a of p.cast) {
          if (!roles.has(a.who) || !isNum(a.x) || (a.action !== undefined && !ACTIONS.has(a.action))) return false;
        }
      }
      for (const e of c.events ?? []) {
        if (!isNum(e.at) || e.at < 0 || e.at > c.ms) return false;
        if (e.p !== undefined && (!isNum(e.p) || e.p < 0 || e.p >= c.panels.length)) return false;
        if ('who' in e && !roles.has(e.who)) return false;
        switch (e.do) {
          case 'act':
            if (!ACTIONS.has(e.action)) return false;
            break;
          case 'move':
            if (!isNum(e.to) || !isNum(e.ms) || (e.then !== undefined && !ACTIONS.has(e.then))) return false;
            break;
          case 'inch':
            if (!isNum(e.to) || !isNum(e.ms) || !isNum(e.steps) || e.steps < 1) return false;
            break;
          case 'say':
            if (!isStr(e.text)) return false;
            break;
          case 'text':
            if (!isStr(e.text) || !isNum(e.x) || !isNum(e.y) || !STYLES.has(e.style)) return false;
            break;
          case 'count':
            if (!isStr(e.from) || !isStr(e.to) || !isNum(e.ms)) return false;
            break;
          case 'chat':
            if (!isStr(e.text) || (e.from !== 'me' && e.from !== 'them')) return false;
            break;
          case 'mark':
            if (!MARKS.has(e.mark)) return false;
            break;
          case 'cam':
          case 'snap':
            if (!SHOTS.has(e.shot)) return false;
            break;
          case 'light':
            if (!isNum(e.level) || !isNum(e.ms)) return false;
            break;
          case 'prop':
            if (!PROPS.has(e.prop) || !isStr(e.state)) return false;
            break;
          case 'dream':
            if (!isNum(e.count) || e.count < 1 || e.count > 9 || (e.action !== undefined && !ACTIONS.has(e.action))) return false;
            break;
          case 'sink':
            if (typeof e.on !== 'boolean') return false;
            break;
          case 'show':
          case 'flash':
          case 'shake':
          case 'glitch':
          case 'burst':
          case 'focus':
          case 'glare':
          case 'silhouette':
          case 'dreamPop':
            break;
          default:
            return false;
        }
      }
    }
    return true;
  } catch {
    return false;
  }
}

/** 앱에 들어 있는 기본 썰 (인터넷이 안 돼도 볼 수 있다) */
export const STORIES: Story[] = (bundled.stories as unknown[]).filter(validStory);

/** 새 썰은 앱 업데이트 없이 이 파일로 받아온다 (main에 올리면 GitHub Pages가 배포) */
export const STORIES_URL = 'https://baebae6ae.github.io/chool_geun/stories.json';
const CACHE_KEY = 'hamster-stories:v1';

function readCache(): Story[] {
  try {
    const d = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    return Array.isArray(d?.stories) ? d.stories.filter(validStory) : [];
  } catch {
    return [];
  }
}
let remote: Story[] = typeof localStorage === 'undefined' ? [] : readCache();

/** 기본 썰 + 받아 둔 썰 (같은 id면 받아 둔 쪽이 최신) */
export function allStories(): Story[] {
  const map = new Map(STORIES.map((s) => [s.id, s]));
  for (const s of remote) map.set(s.id, s);
  return [...map.values()].sort((a, b) => a.no - b.no);
}

/** 인터넷에서 썰 목록을 받아 기기에 저장한다. 실패하면 조용히 넘어간다. 새로 받았으면 true */
export async function refreshStories(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetcher(`${STORIES_URL}?h=${Math.floor(Date.now() / 3_600_000)}`, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return false;
    const d = await r.json();
    const list: Story[] = Array.isArray(d?.stories) ? d.stories.filter(validStory) : [];
    if (!list.length) return false;
    const changed = JSON.stringify(list) !== JSON.stringify(remote);
    remote = list;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ stories: list }));
    } catch {
      // 저장 못 해도 이번 실행 동안은 쓴다
    }
    return changed;
  } catch {
    return false;
  }
}

/** 테스트용: 받아 둔 썰 바꾸기 */
export function __setRemoteStories(list: Story[]) {
  remote = list;
}

/** 오늘의 썰: 날짜와 기기 시드로 정해져 하루 종일 같다. 아직 안 본 썰을 먼저 고른다. */
export function storyOfDay(seed: number, key: string, seen: Record<string, number> = {}): Story {
  const list = allStories();
  const fresh = list.filter((s) => !seen[s.id]);
  const pool = fresh.length ? fresh : list;
  const rng = createRng(`${seed}:${key}:story`);
  return pool[Math.floor(rng() * pool.length)];
}

/** 오늘의 썰 (한 번 정해지면 그날은 바뀌지 않는다) */
export function todaysStory(state: AppState, key: string): Story {
  const id = state.stories?.days?.[key];
  return allStories().find((s) => s.id === id) ?? storyOfDay(state.seed, key, state.stories?.seen);
}

/** 썰을 봤다고 기록 (그날의 썰로 고정하고, 도감 썰 모음에 열린다) */
export function markStorySeen(state: AppState, key: string, id: string, now: number): AppState {
  const st = state.stories ?? {};
  return {
    ...state,
    stories: {
      seen: { ...st.seen, [id]: st.seen?.[id] ?? now },
      days: { ...st.days, [key]: st.days?.[key] ?? id },
    },
  };
}

/** 오늘의 썰을 볼 수 있는지: 출근한 날 퇴근한 뒤 */
export function storyUnlocked(day: Pick<DailyWork, 'clockedOut'> | undefined): boolean {
  return !!day?.clockedOut;
}

/** 썰 한 편의 전체 길이 */
export function storyLength(s: Story): number {
  return s.cuts.reduce((t, c) => t + c.ms, 0);
}
