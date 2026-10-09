/**
 * 안드로이드 홈 화면 위젯과 앱을 잇는다.
 * 앱 상태가 바뀔 때마다 앞으로 2주 치 위젯 상태와 (꾸미기가 바뀌었으면) 캐릭터 그림을 네이티브 쪽에 넘긴다.
 * 웹·PWA에서는 아무것도 하지 않는다.
 */
import { Capacitor, registerPlugin } from '@capacitor/core';
import { buildWidgetTimeline, WIDGET_POSES, type WidgetPose } from './domain/widget';
import { createDay } from './domain/engine';
import { dateKey } from './domain/date';
import type { AppState, Customization } from './domain/types';
import type { Pose } from './components/hamster/HamsterSprite';
import { isNative } from './platform';

interface WidgetBridgePlugin {
  update(o: { timeline: string; images?: Record<string, string> }): Promise<void>;
  preview(o: { size: 'wide' | 'small'; now?: number; timeline?: string; width?: number; height?: number }): Promise<{ png: string }>;
  pin(o: { size: 'wide' | 'small' }): Promise<{ ok: boolean }>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');
const enabled = isNative && Capacitor.getPlatform() === 'android';

const POSE: Record<WidgetPose, { pose: Pose; tired?: boolean }> = {
  sleep: { pose: { pose: 'side', action: 'sleep' } },
  yawn: { pose: { pose: 'front', action: 'yawn' } },
  type: { pose: { pose: 'front', action: 'type' } },
  nibble: { pose: { pose: 'front', action: 'nibble' } },
  typeFast: { pose: { pose: 'front', action: 'typeFast' } },
  doom: { pose: { pose: 'front', action: 'doom' }, tired: true },
  meal: { pose: { pose: 'front', action: 'meal' } },
  game: { pose: { pose: 'front', action: 'game' } },
  phone: { pose: { pose: 'front', action: 'phone' } },
  snack: { pose: { pose: 'front', action: 'snack' } },
};

const IMG_KEY = 'hamster-widget-img';
const IMG_VERSION = 2;

async function renderImages(custom: Customization): Promise<Record<string, string>> {
  const { posePng } = await import('./shareCard');
  const out: Record<string, string> = {};
  for (const p of WIDGET_POSES) out[p] = await posePng(custom, POSE[p].pose, 220, POSE[p].tired);
  return out;
}

let running: Promise<void> | null = null;

/** 위젯 갱신. 실패해도 앱에는 영향이 없도록 조용히 넘어간다 */
export function syncWidget(state: AppState, now: number): Promise<void> {
  if (!enabled || !state.settings) return Promise.resolve();
  const job = (running ?? Promise.resolve()).then(async () => {
    try {
      const timeline = JSON.stringify(buildWidgetTimeline(state, now));
      const key = JSON.stringify({ v: IMG_VERSION, c: state.custom });
      let images: Record<string, string> | undefined;
      let saved: string | null = null;
      try {
        saved = localStorage.getItem(IMG_KEY);
      } catch {
        // 무시
      }
      if (saved !== key) images = await renderImages(state.custom);
      await WidgetBridge.update({ timeline, images });
      if (images) {
        try {
          localStorage.setItem(IMG_KEY, key);
        } catch {
          // 무시
        }
      }
    } catch (e) {
      console.warn('widget sync failed', e);
    }
  });
  running = job;
  return job;
}

/** 점검용: 특정 시각·상태의 위젯을 그림으로 받아 본다 (에뮬레이터 점검 스크립트가 쓴다) */
declare global {
  interface Window {
    __widgetDebug?: {
      timeline: (now: number, overtimeStartedAt?: number) => string;
      preview: WidgetBridgePlugin['preview'];
      pin: WidgetBridgePlugin['pin'];
      sync: () => Promise<void>;
    };
  }
}

export function installWidgetDebug(getState: () => AppState, now: () => number) {
  if (!enabled) return;
  window.__widgetDebug = {
    timeline: (t, ot) => {
      const s = getState();
      if (!ot || !s.settings) return JSON.stringify(buildWidgetTimeline(s, t));
      // 야근 화면 점검: 그날 기록이 없으면 (미래 날짜 등) 하나 만들어 둔다
      const key = dateKey(ot);
      const day = s.days[key] ?? createDay(s, s.settings, key, ot);
      const st: AppState = { ...s, days: { ...s.days, [key]: day }, overtime: { date: key, startedAt: ot } };
      return JSON.stringify(buildWidgetTimeline(st, t));
    },
    preview: (o) => WidgetBridge.preview(o),
    pin: (o) => WidgetBridge.pin(o),
    sync: () => syncWidget(getState(), now()),
  };
}
