/**
 * 드래곤 변신: 화나거나 스트레스 풀고 싶을 때 누르는 아무 맥락 없는 기능.
 * 열받는 메시지 → 분노 게이지 999% → 정통 판타지 드래곤으로 변신해 본사를 부수고 → 결국 상상이었다.
 * 분노 원인·주문·부수기 장면·현실 복귀 엔딩은 할 때마다 랜덤으로 고른다.
 */
import { createRng } from './random';

export type AttackId = 'fire' | 'claw' | 'crush' | 'tail' | 'roar' | 'dive';

export interface Attack {
  id: AttackId;
  name: string;
  /** 화면에 크게 박히는 효과음 */
  sfx: string;
  /** 판타지 자막 (직장 개그) */
  caption: string;
  /** 칠 때 튀는 데미지 숫자 */
  damage: string;
}

export const ATTACKS: Attack[] = [
  { id: 'fire', name: '불 뿜기', sfx: '화르르르륵!!', caption: '결재 라인, 전원 불탔다.', damage: 'CRITICAL! -999,999' },
  { id: 'claw', name: '발톱 내려찍기', sfx: '콰아앙!!', caption: '반려된 서류 427장, 영원히 반려.', damage: '-반려 ∞' },
  { id: 'crush', name: '쥐어 부수기', sfx: '우지끈!!', caption: '용지 걸림, 영구 해결.', damage: 'CRITICAL! -용지 걸림' },
  { id: 'tail', name: '꼬리 휩쓸기', sfx: '휘이익—!!', caption: '5분이면 끝나는 회의, 진짜 5분 만에 끝.', damage: '-회의 3시간' },
  { id: 'roar', name: '포효 충격파', sfx: '크롸아아아!!', caption: '유리 천장, 와장창.', damage: 'CRITICAL! -유리 천장' },
  { id: 'dive', name: '급강하 박치기', sfx: '쿠콰콰쾅!!', caption: '본사 이전 확정.', damage: 'CRITICAL! -9,999,999' },
];

/** 변신 직전에 날아오는 열받는 메시지 */
export interface RageLine {
  from: string;
  time: string;
  text: string;
}

export const RAGE_LINES: RageLine[] = [
  { from: '팀장님', time: '오후 5:52', text: '이거 오늘까지 가능하죠? 아 퇴근 8분 전이구나 ㅎㅎ 화이팅~' },
  { from: '팀장님', time: '오전 10:14', text: '어제 김대리가 만든 거 내가 한 걸로 보고 올렸어 ㅎㅎ 반응 좋더라~ 고마워' },
  { from: '부장님', time: '오후 3:40', text: '연봉은 회사가 어려워서 동결이야. 아 참, 나 이번에 차 바꿨어 ㅎㅎ' },
  { from: '팀장님', time: '오후 11:47', text: '자니? 내일 아침 8시까지 보고서 수정 좀~ 별거 아니야' },
  { from: '팀장님', time: '오후 4:30', text: '내가 언제 A안으로 하랬어? 처음부터 다시 해 와. 오늘 안에' },
  { from: '부장님', time: '오후 6:01', text: '벌써 가? 요즘 애들은 참 칼퇴가 당연한 줄 알더라~' },
  { from: '팀장님', time: '오후 2:15', text: '연차? 그날은 좀… 다들 바쁜데 눈치 좀 챙기자 ㅎㅎ' },
  { from: '팀장님', time: '토요일 오전 9:03', text: '주말에 미안~ 진짜 잠깐만 확인해 줘. 5분이면 돼' },
  { from: '부장님', time: '오후 7:20', text: '야근 수당? 우리 포괄임금제인 거 몰랐어? ㅎㅎ' },
  { from: '옆팀 과장', time: '오전 11:02', text: '그거 그쪽 팀 일 아니었어요? 저희는 모르는 일인데요~ ^^' },
  { from: '팀장님', time: '오후 5:58', text: '아 맞다 오늘 회식이야! 다들 당연히 오는 거지? 빠지면 서운해~' },
  { from: '팀장님', time: '오전 9:01', text: '김대리 표정이 왜 그래? 웃어~ 회사는 가족 같은 곳이잖아 ㅎㅎ' },
];

/** 변신 주문 */
export const SPELLS: string[] = [
  '봉인 해제… 연봉 동결의 힘이여!',
  '깨어나라… 야근 1,000시간의 분노여!',
  '지금 이 순간, 나는 퇴사보다 강하다!',
  '포괄임금의 저주여… 불꽃이 되어라!',
];

/** 현실 복귀 엔딩 */
export type EndingId = 'boss' | 'keyboard' | 'cup' | 'loop' | 'fact';
export const ENDINGS: EndingId[] = ['boss', 'keyboard', 'cup', 'loop', 'fact'];

export interface DragonPlan {
  rage: RageLine;
  spell: string;
  attacks: Attack[];
  ending: EndingId;
}

/** 이번 변신에서 보여 줄 것들 (부수기 장면은 count개, 겹치지 않게) */
export function planDragon(seed: string, count = 3): DragonPlan {
  const rng = createRng(`dragon:${seed}`);
  const pick = <T,>(list: T[]) => list[Math.floor(rng() * list.length)];
  const pool = [...ATTACKS];
  const attacks: Attack[] = [];
  while (attacks.length < count && pool.length) attacks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return { rage: pick(RAGE_LINES), spell: pick(SPELLS), attacks, ending: pick(ENDINGS) };
}

/** 하위 호환: 부수기 장면만 고르기 */
export function pickAttacks(seed: string, count = 3): Attack[] {
  return planDragon(seed, count).attacks;
}
