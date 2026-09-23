/** 기획서 16. 알림은 최소화 — 하루 최대 3회, 앱이 백그라운드일 때만 */
import { dateKey } from './domain/date';
import type { AppState } from './domain/types';

export const DAILY_LIMIT = 3;

export const MESSAGES = {
  clockIn: { title: '🐹 출근했습니다.', body: '오늘도 하나 만들어볼까요?' },
  gacha: { title: '🎰 직장인 이벤트가 발생했습니다!', body: '어떤 이벤트인지 확인해 보세요.' },
  clockOut: { title: '🐹 퇴근시간입니다.', body: '오늘의 작업이 완성됐어요.' },
} as const;

/** 알림을 보낼 수 있으면 보내고, 카운트가 반영된 새 상태를 돌려준다. */
export function sendNotification(state: AppState, kind: keyof typeof MESSAGES, now: number): AppState {
  if (!state.settings?.notifications) return state;
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return state;
  if (!document.hidden) return state;
  const today = dateKey(now);
  const count = state.notif.date === today ? state.notif.count : 0;
  if (count >= DAILY_LIMIT) return state;
  const msg = MESSAGES[kind];
  const opts = { body: msg.body, icon: './icon.svg', tag: `hamster-${kind}` };
  // 모바일 브라우저는 페이지 컨텍스트의 new Notification()을 막는 경우가 있어 서비스워커 우선
  if (navigator.serviceWorker?.controller) {
    navigator.serviceWorker.ready.then((reg) => reg.showNotification(msg.title, opts)).catch(() => {});
  } else {
    try {
      new Notification(msg.title, opts);
    } catch {
      return state;
    }
  }
  return { ...state, notif: { date: today, count: count + 1 } };
}
