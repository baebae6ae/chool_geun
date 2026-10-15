/**
 * 업데이트 소식: 업데이트한 뒤 처음 켰을 때 한 번만 "이번에 새로 생긴 것"을 보여 준다.
 * 본 버전은 기기 저장소(state.whatsNew)에 남아서 다음부터는 뜨지 않는다. 앱·웹 모두 같다.
 * 새 업데이트에 소식을 띄우려면 version을 1 올리고 items를 바꾼다.
 */
import type { AppState } from './types';

export const WHATS_NEW = {
  version: 1,
  items: [
    { icon: '🥤', text: "근무 중 어이없는 대화가 오면 '사이다 날리기!'로 쾅!" },
    { icon: '📵', text: "퇴근 후 가짜 업무 연락은 '읽씹하기!'" },
    { icon: '📱', text: '홈 화면 위젯: 앱을 안 열어도 퇴근까지 남은 시간' },
    { icon: '🛋️', text: "주말·저녁 일과와 쉬는 날에도 쌓이는 '누워서 번 돈'" },
    { icon: '💕', text: '쓰다듬기 친밀도, 손님 방문, 방 안 물건 누르기' },
    { icon: '🎃', text: '계절 이벤트 한정 아이템과 업적 메달' },
    { icon: '🏢', text: '사무실 결과물이 파트별로 바뀌어 휴일·연차에도 끊기지 않아요' },
  ],
} as const;

/** 이 기기에서 아직 이번 소식을 못 봤는지 (처음 설정 중인 새 사용자는 제외) */
export function whatsNewPending(state: AppState): boolean {
  return !!state.settings && (state.whatsNew ?? 0) < WHATS_NEW.version;
}

/** 이번 소식을 본 것으로 기록 (새로 시작한 사용자도 이걸로 기록해서 지난 소식이 뜨지 않게 한다) */
export function markWhatsNewSeen(state: AppState): AppState {
  return (state.whatsNew ?? 0) >= WHATS_NEW.version ? state : { ...state, whatsNew: WHATS_NEW.version };
}
