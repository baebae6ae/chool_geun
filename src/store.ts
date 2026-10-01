import { useEffect, useState, useSyncExternalStore } from 'react';
import { createInitialState } from './domain/engine';
import { sanitizeCustom } from './domain/customization';
import type { AppState } from './domain/types';

const KEY = 'hamster-worklog:v1';

/** 이 브라우저가 기록을 저장할 수 있는지 (시크릿 모드·쿠키 차단이면 false) */
export const storageOk: boolean = (() => {
  try {
    const k = '__hamster_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
})();

/** 카카오톡·인스타그램 등 앱 안 브라우저 — 창을 닫으면 저장소가 지워지는 경우가 있다 */
export const inAppBrowser: string | null = (() => {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent;
  if (/KAKAOTALK/i.test(ua)) return '카카오톡';
  if (/Instagram/i.test(ua)) return '인스타그램';
  if (/FBAN|FBAV/i.test(ua)) return '페이스북';
  if (/NAVER\(inapp/i.test(ua)) return '네이버';
  if (/Line\//i.test(ua)) return '라인';
  return null;
})();

/**
 * 기록은 두 군데에 나눠 저장한다. 브라우저가 localStorage만 비워도 IndexedDB 백업에서 되살린다.
 * 전부 기기 안에만 있고 서버로 전송되지 않는다 (쿠키는 요청마다 서버로 가므로 쓰지 않는다).
 */
const IDB_NAME = 'hamster-worklog';

/** 예전 버전이 만든 백업 쿠키(월급 값 포함)를 지운다 */
const LEGACY_COOKIE = 'hamster_core';
try {
  document.cookie = `${LEGACY_COOKIE}=; max-age=0`;
  document.cookie = `${LEGACY_COOKIE}=; max-age=0; path=/`;
} catch {
  // 쿠키 차단
}

export type LoadSource = 'local' | 'fresh';
export let loadSource: LoadSource = 'fresh';

function parseState(raw: string | null | undefined): AppState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AppState;
    if (parsed?.version !== 1) return null;
    return { ...createInitialState(parsed.seed), ...parsed, custom: sanitizeCustom(parsed.custom) };
  } catch {
    return null;
  }
}

let dbp: Promise<IDBDatabase> | null = null;
function db(): Promise<IDBDatabase> {
  dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(IDB_NAME, 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}

export async function idbGet(): Promise<string | undefined> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = d.transaction('kv').objectStore('kv').get('state');
    r.onsuccess = () => resolve(r.result as string | undefined);
    r.onerror = () => reject(r.error);
  });
}

async function idbPut(value: string) {
  const d = await db();
  await new Promise<void>((resolve, reject) => {
    const t = d.transaction('kv', 'readwrite');
    t.objectStore('kv').put(value, 'state');
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

function load(): AppState {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    // 저장소 접근 불가
  }
  const local = parseState(raw);
  if (local) {
    loadSource = 'local';
    return local;
  }
  return createInitialState();
}

/** 진단용: 앱이 켜진 횟수를 저장소마다 따로 센다. 새로고침마다 한쪽만 0으로 돌아가면 그 저장소가 지워지는 것 */
function bump(store: Storage | undefined, k: string) {
  try {
    if (!store) return;
    store.setItem(k, String(Number(store.getItem(k) || 0) + 1));
  } catch {
    // 무시
  }
}
bump(typeof localStorage === 'undefined' ? undefined : localStorage, 'hamster-diag:loads');
bump(typeof sessionStorage === 'undefined' ? undefined : sessionStorage, 'hamster-diag:loads');

let state: AppState = load();
const listeners = new Set<() => void>();

// localStorage가 비어 있었다면 IndexedDB 백업에서 전체 기록을 되살린다
if ((loadSource as LoadSource) !== 'local' && typeof indexedDB !== 'undefined') {
  idbGet()
    .then((raw) => {
      const backup = parseState(raw);
      if (backup?.settings && (!state.settings || backup.seed === state.seed)) setState(backup);
    })
    .catch(() => {});
}

let idbTimer: ReturnType<typeof setTimeout> | undefined;
function flushIdb() {
  clearTimeout(idbTimer);
  idbTimer = undefined;
  if (typeof indexedDB === 'undefined') return;
  idbPut(JSON.stringify(state)).catch(() => {});
}
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => idbTimer && flushIdb());
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && idbTimer && flushIdb());
}

export function getState(): AppState {
  return state;
}

export function setState(next: AppState | ((s: AppState) => AppState)) {
  const value = typeof next === 'function' ? next(state) : next;
  if (value === state) return;
  const firstSave = !state.settings && !!value.settings;
  state = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // 저장 실패해도 메모리 상태로 계속 동작 (쿠키·IndexedDB 백업이 남음)
  }
  clearTimeout(idbTimer);
  idbTimer = setTimeout(flushIdb, 400);
  // 브라우저가 공간이 부족할 때 기록을 지우지 않도록 요청 (안드로이드 크롬 등)
  if (firstSave) navigator.storage?.persist?.().catch(() => {});
  listeners.forEach((l) => l());
}

/** 백업 파일에서 복원. 형식이 맞지 않으면 이유를 담은 Error를 던진다 */
export function restoreFromBackup(text: string): void {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('백업 파일이 아니에요 (읽을 수 없는 형식).');
  }
  const obj = data as { app?: string; state?: unknown; version?: unknown };
  const candidate = obj && typeof obj === 'object' && 'state' in obj ? obj.state : data;
  const parsed = parseState(JSON.stringify(candidate));
  if (!parsed || !parsed.settings || typeof parsed.days !== 'object' || typeof parsed.collection !== 'object') {
    throw new Error('햄스터 출근일지 백업 파일이 아니에요.');
  }
  setState(parsed);
}

export function resetState() {
  setState(createInitialState());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useAppState(): AppState {
  return useSyncExternalStore(subscribe, getState);
}

/**
 * 현재 시각. `?t=2026-09-22T17:42` 로 가상 시각을 지정하면 그 시점부터 흐른다 (시연/테스트용).
 */
const offset = (() => {
  try {
    const t = new URLSearchParams(location.search).get('t');
    if (!t) return 0;
    const target = new Date(t).getTime();
    return Number.isNaN(target) ? 0 : target - Date.now();
  } catch {
    return 0;
  }
})();

export const now = () => Date.now() + offset;

export function useNow(intervalMs = 1000): number {
  const [t, setT] = useState(now);
  useEffect(() => {
    const id = setInterval(() => setT(now()), intervalMs);
    const onVisible = () => setT(now());
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [intervalMs]);
  return t;
}
