/**
 * 퇴근 후 업무 연락 — 평일 저녁에 앱이 만든 "가짜" 업무 메시지가 오고, "읽씹하기!" 버튼으로
 * 캐릭터가 얄밉게 무시하는 모습을 보며 스트레스를 푼다. 실제 연락이 아니며 어디로도 보내지지 않는다.
 */
import { addDays, atTime } from './date';
import { createRng } from './random';
import type { FrontAction } from '../components/hamster/HamsterSprite';
import type { AppState } from './types';

export interface WorkMessage {
  /** 도착 시각 (그날 19:00~21:30 사이, 날짜와 기기 시드로 정해진다) */
  at: number;
  sender: string;
  text: string;
}

const POOL: { sender: string; text: string }[] = [
  { sender: '팀장님', text: '내일 아침까지 가능할까요?' },
  { sender: '팀장님', text: '이거 월요일에 해도 되는데, 지금 보면 좋겠다 ㅎㅎ' },
  { sender: '팀장님', text: '아 그리고 하나만 더…' },
  { sender: '팀장님', text: '혹시 지금 통화 되세요? 길게는 안 걸려요(길어요)' },
  { sender: '부장님', text: '확인 부탁드립니다. (확인 부탁드립니다.)' },
  { sender: '부장님', text: '퇴근 잘 했죠? 근데 그 건 어떻게 됐죠?' },
  { sender: '김대리', text: '혹시 자요? 급한 건 아닌데 지금 가능?' },
  { sender: '김대리', text: '아까 보낸 파일 다시 한 번만 봐줄 수 있어요?' },
  { sender: '김과장', text: '퇴근하셨나요? (이미 읽음 확인함)' },
  { sender: '김과장', text: '내일 회의 자료 미리 공유 가능할까요?' },
  { sender: '박사원', text: '선배님 죄송한데 이거 어디 있는지 아세요?' },
  { sender: '옆 팀', text: '자료 다시 보내 주실 수 있나요? 아까 보내셨는데…' },
  { sender: '거래처', text: '퇴근하셨죠? 잠깐만 통화 가능하실까요?' },
  { sender: '거래처', text: '내일 오전까지 회신 부탁드립니다. 오늘 밤에도 괜찮습니다' },
  { sender: '총무팀', text: '회식 장소 투표해 주세요 (어차피 정해짐)' },
  { sender: '총무팀', text: '[공지] 내일 전체 회의 앞당겨졌습니다. 8시 반!' },
  { sender: '인사팀', text: '[공지] 유연근무제 안내 (그래도 9시 출근)' },
  { sender: '단톡방', text: '업무방(99+) 읽지 않은 메시지가 있습니다' },
  { sender: '단톡방', text: '전체 공지: 확인하신 분은 확인 댓글 남겨 주세요' },
  { sender: '팀장님', text: '다들 퇴근했겠지만, 혹시 몰라서 ㅎㅎ' },
  { sender: '대표님', text: '내일 아침에 잠깐 얘기 좀 합시다' },
  { sender: '김대리', text: '혹시 지금 노트북 켜실 수 있어요? 5분이면 돼요' },
  { sender: '박사원', text: '저녁 시간에 죄송합니다! 이거 한 번만 확인해 주세요' },
  { sender: '팀장님', text: '내일 일정 변경됐으니 확인 바랍니다 (밤 늦게 미안)' },
];

/** 그날 저녁에 올 가짜 업무 연락 (날짜와 기기 시드로 정해져 언제 열어도 같다) */
export function eveningMessage(seed: number, key: string): WorkMessage {
  const rng = createRng(`${seed}:${key}:workmsg`);
  const m = POOL[Math.floor(rng() * POOL.length)];
  return { at: atTime(key, '19:00') + Math.floor(rng() * 151) * 60_000, ...m };
}

/** 지금 보여줄 연락이 있는지: 퇴근한 날, 도착 시각이 지났고, 자정 전이고, 아직 읽씹하지 않았고, 야근 중이 아닐 때 */
export function pendingWorkMessage(state: AppState, key: string, now: number, opts: { clockedOut: boolean; overtime: boolean }): WorkMessage | null {
  if (!opts.clockedOut || opts.overtime || state.evening?.[key]?.readAt) return null;
  const m = eveningMessage(state.seed, key);
  return now >= m.at && now < atTime(addDays(key, 1), '00:00') ? m : null;
}

/** 읽씹 완료: 오늘 읽씹을 기록하고 누적 횟수를 올린다 */
export function ignoreWorkMessage(state: AppState, key: string, now: number): AppState {
  if (state.evening?.[key]?.readAt) return state;
  return {
    ...state,
    evening: { ...state.evening, [key]: { readAt: now } },
    stats: { ...state.stats, ignored: (state.stats?.ignored ?? 0) + 1 },
  };
}

/**
 * 읽씹 연기: 이 순서대로 캐릭터가 연기하고, 각 동작이 시작될 때 한마디씩 한다.
 * 모두 읽씹 전용으로 새로 그린 동작이다.
 */
export const IGNORE_BEATS: { action: FrontAction; ms: number; line: string }[] = [
  { action: 'phoneShow', ms: 1900, line: '읽었어요~ 읽음 ✓✓ 보이죠?' },
  { action: 'earplug', ms: 2300, line: '아아~ 아무것도 안 들려요~' },
  { action: 'phoneToss', ms: 1800, line: '업무 폰은 안녕~ 휙!' },
  { action: 'hipsway', ms: 2400, line: '퇴. 근. 했. 거. 든. 요. ^^' },
  { action: 'blowkiss', ms: 2000, line: '내일의 제가 알아서 할게요~ 쪽♥' },
];
export const IGNORE_TOTAL_MS = IGNORE_BEATS.reduce((s, b) => s + b.ms, 0);
/** 마지막 한마디 (연기가 끝난 뒤) */
export const IGNORE_FINAL_LINE = '읽씹 완료! 속이 시원하다~';

/** 읽씹하고 나서 "줄어든" 스트레스 (재미용, 31~97%) */
export function stressRelief(rnd: () => number = Math.random): number {
  return 31 + Math.floor(rnd() * 67);
}
