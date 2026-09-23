import { useEffect, useState, useSyncExternalStore } from 'react';
import { createInitialState } from './domain/engine';
import { DEFAULT_CUSTOM } from './domain/customization';
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

function load(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed.version === 1) return { ...createInitialState(parsed.seed), ...parsed, custom: { ...DEFAULT_CUSTOM, ...parsed.custom } };
    }
  } catch {
    // 저장소 접근 불가 / 손상 → 새로 시작
  }
  return createInitialState();
}

let state: AppState = load();
const listeners = new Set<() => void>();

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
    // 저장 실패해도 메모리 상태로 계속 동작
  }
  // 브라우저가 공간이 부족할 때 기록을 지우지 않도록 요청 (안드로이드 크롬 등)
  if (firstSave) navigator.storage?.persist?.().catch(() => {});
  listeners.forEach((l) => l());
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
