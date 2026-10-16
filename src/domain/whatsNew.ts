/**
 * 업데이트 소식: 업데이트한 뒤 처음 켰을 때 한 번만 "이번에 새로 생긴 것"을 보여 준다.
 * 본 버전은 기기 저장소(state.whatsNew)에 남아서 다음부터는 뜨지 않는다. 앱·웹 모두 같다.
 * 새 소식은 NEWS 맨 위에 버전을 1 올려서 추가한다. 여러 버전을 건너뛰고 업데이트한 사람에게는
 * 못 본 버전의 소식을 모두 (새것부터) 보여 준다.
 */
import type { AppState } from './types';

export interface NewsItem {
  icon: string;
  text: string;
}

export const NEWS: { version: number; items: NewsItem[] }[] = [
  {
    version: 2,
    items: [
      { icon: '🐰', text: '토끼가 귀가 쫑긋 선 일반 토끼로 바뀌었어요' },
      { icon: '❔', text: '출근 50일을 채우면 히든 캐릭터가 열려요' },
    ],
  },
  {
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
  },
];

export const WHATS_NEW_VERSION = Math.max(...NEWS.map((n) => n.version));

/** 이 기기에서 아직 못 본 소식 (새것부터) */
export function unseenNews(state: AppState): NewsItem[] {
  const seen = state.whatsNew ?? 0;
  return NEWS.filter((n) => n.version > seen).flatMap((n) => n.items);
}

/** 이 기기에서 아직 이번 소식을 못 봤는지 (처음 설정 중인 새 사용자는 제외) */
export function whatsNewPending(state: AppState): boolean {
  return !!state.settings && (state.whatsNew ?? 0) < WHATS_NEW_VERSION;
}

/** 이번 소식을 본 것으로 기록 (새로 시작한 사용자도 이걸로 기록해서 지난 소식이 뜨지 않게 한다) */
export function markWhatsNewSeen(state: AppState): AppState {
  return (state.whatsNew ?? 0) >= WHATS_NEW_VERSION ? state : { ...state, whatsNew: WHATS_NEW_VERSION };
}
