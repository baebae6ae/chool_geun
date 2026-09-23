/** 기획서 7~8. 직장인 가챠 & 도감 */
import { weekday } from './date';
import { createRng, type Rng } from './random';
import type { Rarity } from './types';

export interface GachaEvent {
  id: string;
  rarity: Rarity;
  emoji: string;
  name: string;
  description: string;
  /** 금요일에만 발생 */
  fridayOnly?: boolean;
}

export const RARITIES: Rarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'];

/** 기획서 7-2. 등급별 확률 */
export const RARITY_RATE: Record<Rarity, number> = {
  COMMON: 0.6,
  UNCOMMON: 0.25,
  RARE: 0.1,
  EPIC: 0.04,
  LEGENDARY: 0.01,
};

export const RARITY_LABEL: Record<Rarity, string> = {
  COMMON: '커먼',
  UNCOMMON: '언커먼',
  RARE: '레어',
  EPIC: '에픽',
  LEGENDARY: '레전더리',
};

const ev = (id: string, rarity: Rarity, emoji: string, name: string, description: string, fridayOnly?: boolean): GachaEvent => ({
  id, rarity, emoji, name, description, ...(fridayOnly ? { fridayOnly } : {}),
});

export const GACHA_EVENTS: GachaEvent[] = [
  // COMMON (20)
  ev('c01', 'COMMON', '☕', '커피 수혈', '집중력이 회복되었습니다.'),
  ev('c02', 'COMMON', '🍱', '점심 메뉴 고민', '오늘 뭐 먹지... 30분째 고민 중입니다.'),
  ev('c03', 'COMMON', '🖨️', '프린터 종이 걸림', '또 너야?'),
  ev('c04', 'COMMON', '📎', '클립 발견', '서랍 속에서 클립 하나를 찾았습니다.'),
  ev('c05', 'COMMON', '🥱', '오후 3시의 하품', '잠깐 눈이 감겼다 떠졌습니다.'),
  ev('c06', 'COMMON', '💧', '물 한 잔', '수분 보충 완료.'),
  ev('c07', 'COMMON', '🔔', '메신저 알림', '별 내용 없는 알림이었습니다.'),
  ev('c08', 'COMMON', '🪑', '의자 삐걱', '의자가 오늘따라 시끄럽습니다.'),
  ev('c09', 'COMMON', '🖱️', '마우스 배터리 부족', '딸깍... 딸깍...'),
  ev('c10', 'COMMON', '🌤️', '창밖 날씨 좋음', '나가고 싶다.'),
  ev('c11', 'COMMON', '📋', '회의록 당번', '누군가는 써야 하니까요.'),
  ev('c12', 'COMMON', '🪪', '사원증 두고 옴', '다행히 동료가 문을 열어줬습니다.'),
  ev('c13', 'COMMON', '🍫', '초콜릿 한 조각', '당 충전 완료.'),
  ev('c14', 'COMMON', '💻', '업데이트 알림', '"나중에 하기"를 눌렀습니다.'),
  ev('c15', 'COMMON', '🗂️', '최종_최종', '최종_진짜최종_수정본.pptx'),
  ev('c16', 'COMMON', '🧊', '에어컨 너무 셈', '카디건을 걸쳤습니다.'),
  ev('c17', 'COMMON', '🎧', '집중 모드', '노이즈 캔슬링 ON.'),
  ev('c18', 'COMMON', '📞', '잘못 걸린 전화', '"아 죄송합니다~"'),
  ev('c19', 'COMMON', '🤧', '옆자리 재채기', '건강하세요.'),
  ev('c20', 'COMMON', '🧾', '영수증 정리', '법카 영수증을 차곡차곡 붙였습니다.'),
  // UNCOMMON (13)
  ev('u01', 'UNCOMMON', '🍰', '간식 등장', '누군가 간식을 가져왔습니다.'),
  ev('u02', 'UNCOMMON', '📢', '갑자기 생긴 회의', '5분 뒤 회의실로 오세요.'),
  ev('u03', 'UNCOMMON', '➕', '업무 요청 추가', '"이것도 같이 부탁해요~"'),
  ev('u04', 'UNCOMMON', '🎂', '생일 케이크', '이번 달 생일자 축하 파티!'),
  ev('u05', 'UNCOMMON', '🍕', '피자 타임', '점심에 피자가 쏟아졌습니다.'),
  ev('u06', 'UNCOMMON', '🧋', '커피 쏘는 선배', '"뭐 마실래?"'),
  ev('u07', 'UNCOMMON', '📶', '와이파이 끊김', '잠깐의 강제 휴식.'),
  ev('u08', 'UNCOMMON', '📦', '택배 도착', '회사로 시킨 택배가 왔습니다.'),
  ev('u09', 'UNCOMMON', '💬', '칭찬 한마디', '"오 이거 좋은데요?"'),
  ev('u10', 'UNCOMMON', '🐛', '버그 발견', '내가 만든 건 아닙니다... 아마도.'),
  ev('u11', 'UNCOMMON', '🌞', '창가 햇살', '광합성 중.'),
  ev('u12', 'UNCOMMON', '🗓️', '연차 승인', '다음 주 금요일은 휴가!'),
  ev('u13', 'UNCOMMON', '🎵', '사내 방송', '오늘의 추천곡이 흘러나옵니다.'),
  // RARE (9)
  ev('r01', 'RARE', '📨', '메일 없는 오후', '30분 동안 새로운 메일이 없습니다.'),
  ev('r02', 'RARE', '🏃', '칼퇴각', '오늘 할 일이 모두 끝났습니다.'),
  ev('r03', 'RARE', '💳', '법카 점심', '오늘 점심은 회사가 쏩니다.'),
  ev('r04', 'RARE', '🧘', '조용한 사무실', '모두가 집중하는 평화로운 시간.'),
  ev('r05', 'RARE', '✅', '한 번에 결재', '수정 요청 없이 통과!'),
  ev('r06', 'RARE', '🎁', '사내 경품 당첨', '커피 쿠폰을 받았습니다.'),
  ev('r07', 'RARE', '🔋', '풀충전 컨디션', '오늘따라 일이 잘 됩니다.'),
  ev('r08', 'RARE', '🍜', '맛집 발견', '회사 근처 숨은 맛집을 찾았습니다.'),
  ev('r09', 'RARE', '🙆', '팀장님 기분 좋음', '오늘은 뭐든 OK.'),
  // EPIC (5)
  ev('e01', 'EPIC', '❌', '회의 취소', '오늘 예정된 회의가 취소되었습니다.'),
  ev('e02', 'EPIC', '⏰', '업무 조기 종료', '할 일이 예상보다 빨리 끝났습니다.'),
  ev('e03', 'EPIC', '💸', '성과급 소식', '이번 분기 성과급이 나온다는 소문!'),
  ev('e04', 'EPIC', '🏖️', '임시 휴무 공지', '다음 주 월요일은 창립기념일입니다.'),
  ev('e05', 'EPIC', '🖥️', '새 모니터 지급', '듀얼 모니터가 생겼습니다.'),
  // LEGENDARY (3)
  ev('l01', 'LEGENDARY', '🏃‍♂️', '팀장님 먼저 퇴근', '오늘은 조용히 퇴근할 수 있을 것 같습니다.'),
  ev('l02', 'LEGENDARY', '🎉', '전 직원 칼퇴', '사장님이 오늘은 일찍 들어가라고 합니다.'),
  ev('l03', 'LEGENDARY', '🌈', '금요일 오후 아무 일도 없음', '전설로만 전해지던 그 오후.', true),
];

export const GACHA_BY_ID: Record<string, GachaEvent> = Object.fromEntries(GACHA_EVENTS.map((e) => [e.id, e]));

export function rollRarity(r: number): Rarity {
  let acc = 0;
  for (const rarity of RARITIES) {
    acc += RARITY_RATE[rarity];
    if (r < acc) return rarity;
  }
  return 'COMMON';
}

export function pickEvent(rng: Rng, dayOfWeek: number): GachaEvent {
  const rarity = rollRarity(rng());
  const pool = GACHA_EVENTS.filter((e) => e.rarity === rarity && (!e.fridayOnly || dayOfWeek === 5));
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * 하루치 가챠 스케줄. 날짜 + 기기 시드로 결정되므로 언제 앱을 열어도 같은 결과.
 * @returns 발생 이벤트 id와 근무 진행 비율(0.05~0.95) 위치
 */
export function planDailyGacha(seed: number, key: string): { eventId: string; fraction: number }[] {
  const rng = createRng(`${seed}:${key}:gacha`);
  const count = 1 + Math.floor(rng() * 3); // 하루 1~3회
  const plan = [];
  for (let i = 0; i < count; i++) {
    plan.push({ eventId: pickEvent(rng, weekday(key)).id, fraction: 0.05 + rng() * 0.9 });
  }
  return plan.sort((a, b) => a.fraction - b.fraction);
}
