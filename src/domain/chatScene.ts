/**
 * 어이없는 대화 — 근무 중 어느 때쯤 앱이 만든 "가짜" 업무 메신저 대화가 도착하고,
 * 상대가 어이없는 말을 하면 "사이다 날리기!" 버튼으로 쾅! 하고 속 시원하게 받아친다.
 * 실제 대화가 아니며 어디로도 보내지지 않는다. 모든 대화는 직장인이 흔히 겪는 상황을 일반화해 만든 것이다.
 */
import { createRng } from './random';
import type { FrontAction } from '../components/hamster/HamsterSprite';
import type { AppState } from './types';
import bundled from '../content/chat.json';

export interface ChatLine {
  /** 내가 보낸 말풍선이면 true */
  me: boolean;
  /** 말풍선이 아닌 상황 설명 ("다음 날", "3분 뒤" 같은) */
  sys?: boolean;
  text: string;
}

export interface ChatScene {
  /** 대화방 이름 (상대) */
  who: string;
  /** 대화: 마지막 줄은 늘 상대의 어이없는 말 */
  lines: ChatLine[];
  /** 사이다 답변 */
  retort: string;
}

/** '>'로 시작하는 줄은 내가 보낸 말, '#'은 상황 설명, 나머지는 상대의 말. 사이다 답변은 상대 논리를 그대로 뒤집는 한 방이다. */
const sc = (who: string, lines: string[], retort: string): ChatScene => ({
  who,
  lines: lines.map((t) =>
    t.startsWith('>') ? { me: true, text: t.slice(1) } : t.startsWith('#') ? { me: false, sys: true, text: t.slice(1) } : { me: false, text: t },
  ),
  retort,
});

/** chat.json에 적힌 대화 한 편 (줄 앞 '>'·'#' 표기 그대로) */
interface RawScene {
  who: string;
  lines: string[];
  retort: string;
}

const okText = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

/** 인터넷에서 받은 대화가 화면에 그릴 수 있는 형태인지 확인한다 (틀린 대화는 건너뛴다) */
export function validRawScene(x: unknown): x is RawScene {
  try {
    const r = x as RawScene;
    if (!r || !okText(r.who, 20) || !okText(r.retort, 80) || !Array.isArray(r.lines)) return false;
    if (r.lines.length < 2 || r.lines.length > 7 || !r.lines.every((l) => okText(l, 80) && l.replace(/^[>#]/, '').trim().length > 0)) return false;
    // 마지막 줄은 늘 상대의 어이없는 말
    const last = r.lines[r.lines.length - 1];
    return !last.startsWith('>') && !last.startsWith('#');
  } catch {
    return false;
  }
}

const toScenes = (list: unknown): ChatScene[] =>
  (Array.isArray(list) ? list : []).filter(validRawScene).map((r) => sc(r.who, r.lines, r.retort));

/** 앱에 들어 있는 기본 대화 (인터넷이 안 돼도 나온다) */
export const SCENES: ChatScene[] = toScenes(bundled.scenes);

/** 새 대화는 앱 업데이트 없이 이 파일로 받아온다 (main에 올리면 GitHub Pages가 배포). 받은 목록이 기본 목록을 통째로 대신한다 */
export const CHAT_URL = 'https://baebae6ae.github.io/chool_geun/chat.json';
const CACHE_KEY = 'hamster-chat:v1';

function readCache(): ChatScene[] {
  try {
    return toScenes(JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null')?.scenes);
  } catch {
    return [];
  }
}
let remote: ChatScene[] = typeof localStorage === 'undefined' ? [] : readCache();

/** 지금 쓰는 대화 목록: 받아 둔 게 있으면 그것, 없으면 앱에 든 것 */
export function allScenes(): ChatScene[] {
  return remote.length ? remote : SCENES;
}

/** 사이트에서 대화 목록을 받아 기기에 저장한다. 실패하면 조용히 넘어간다. 새로 받았으면 true */
export async function refreshChats(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetcher(`${CHAT_URL}?h=${Math.floor(Date.now() / 3_600_000)}`, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return false;
    const d = await r.json();
    const raw = Array.isArray(d?.scenes) ? d.scenes.filter(validRawScene) : [];
    const list = toScenes(raw);
    // 너무 적게 받았으면 잘못 올린 파일일 수 있으니 쓰지 않는다
    if (list.length < 10) return false;
    const changed = JSON.stringify(list) !== JSON.stringify(remote);
    remote = list;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ scenes: raw }));
    } catch {
      // 저장 못 해도 이번 실행 동안은 쓴다
    }
    return changed;
  } catch {
    return false;
  }
}

/** 테스트용: 받아 둔 대화 바꾸기 */
export function __setRemoteScenes(list: ChatScene[]) {
  remote = list;
}

/** 사이다를 날린 뒤에 찍히는 도장 문구 */
export const STAMPS = ['논파 완료!', '사이다 한 캔!', '할 말 했다!', '속이 뻥!', '쾅! 끝!', 'KO승!'];

/** 그날 나올 대화와 도장 (날짜와 기기 시드로 정해져 언제 열어도 같다) */
export function sceneFor(seed: number, key: string): { scene: ChatScene; stamp: string; index: number } {
  const rng = createRng(`${seed}:${key}:chat`);
  const list = allScenes();
  const index = Math.floor(rng() * list.length);
  return { scene: list[index], stamp: STAMPS[Math.floor(rng() * STAMPS.length)], index };
}

/** 도착 시각: 근무 시간의 20~75% 지점 (날짜와 시드로 정해진다) */
export function chatAt(seed: number, key: string, bounds: { start: number; end: number }): number {
  const rng = createRng(`${seed}:${key}:chatat`);
  return bounds.start + Math.floor((bounds.end - bounds.start) * (0.2 + rng() * 0.55));
}

/**
 * 지금 보여줄 대화가 있는지: 근무 중(출근해서 아직 퇴근 전이고 근무 시간 안)이고, 도착 시각이 지났고,
 * 오늘 아직 사이다를 날리지 않았을 때. 안 누르고 지나가도 아무 불이익이 없다.
 */
export function pendingChat(state: AppState, key: string, now: number, opts: { bounds: { start: number; end: number } | null; clockedOut: boolean; overtime: boolean }): { scene: ChatScene; stamp: string; at: number } | null {
  const { bounds } = opts;
  if (!bounds || opts.clockedOut || opts.overtime || state.chat?.[key]?.doneAt) return null;
  const at = chatAt(state.seed, key, bounds);
  if (now < at || now >= bounds.end) return null;
  const s = sceneFor(state.seed, key);
  return { scene: s.scene, stamp: s.stamp, at };
}

/** 사이다 완료: 오늘 기록하고 누적 횟수를 올린다 */
export function winChat(state: AppState, key: string, now: number): AppState {
  if (state.chat?.[key]?.doneAt) return state;
  return {
    ...state,
    chat: { ...state.chat, [key]: { doneAt: now } },
    stats: { ...state.stats, chatWins: (state.stats?.chatWins ?? 0) + 1 },
  };
}

/** 사이다 연기: 책상 쾅 → 사이다 벌컥벌컥 → 캬~ (모두 이 이벤트 전용으로 새로 그린 동작) */
export const CIDER_BEATS: { action: FrontAction; ms: number; line: string }[] = [
  { action: 'slam', ms: 1700, line: '…잠깐만요. 이건 못 참아요.' },
  { action: 'cider', ms: 2900, line: '치익— 사이다 한 캔 땄어요~' },
  { action: 'ahh', ms: 2600, line: '캬~ 속이 뻥 뚫린다!' },
];
export const CIDER_TOTAL_MS = CIDER_BEATS.reduce((s, b) => s + b.ms, 0);
/** 책상을 내려치는 순간(ms): 이때 사이다 답변이 화면에 꽂힌다 */
export const SLAM_HIT_MS = 950;
export const CIDER_FINAL_LINE = '할 말 다 했다~ 사이다 최고!';

/** 사이다를 날리고 나서 "줄어든" 스트레스 (재미용, 41~99%) */
export function cleanStress(rnd: () => number = Math.random): number {
  return 41 + Math.floor(rnd() * 59);
}
