/**
 * 업적 — 못 따도 벌칙은 없고, 달성하면 메달이 도감에 쌓인다.
 * 각 업적은 현재 값(value)이 목표(goal) 이상이면 달성이다.
 */
import { GACHA_BY_ID, GACHA_EVENTS, HOLIDAY_BY_ID, HOLIDAY_EVENTS } from './gacha';
import { overtimeTotals } from './overtime';
import { RARE_BEHAVIORS } from './rare';
import { careerStats } from './records';
import { SEASON_ITEMS, ownedSeasonItems } from './seasons';
import { bondLevel, THINGS } from './play';
import { allStories } from './theater';
import type { AppState } from './types';

export type Glyph = 'paw' | 'flame' | 'moon' | 'coin' | 'star' | 'sparkle' | 'heart' | 'bubble' | 'clock' | 'gift';
export type Tier = 'bronze' | 'silver' | 'gold';

export interface AchContext {
  completed: number;
  streak: number;
  overtimeDays: number;
  overtimeHours: number;
  paydaySeen: number;
  dex: number;
  holiday: number;
  rare: number;
  pet: number;
  feed: number;
  bond: number;
  tappedThings: number;
  clockTaps: number;
  visitors: number;
  seasonItems: number;
  ignored: number;
  chatWins: number;
  stories: number;
  dragon: number;
  escapes: number;
  paydays: number;
}

export interface Achievement {
  id: string;
  name: string;
  /** 달성 조건 설명 */
  desc: string;
  glyph: Glyph;
  tier: Tier;
  goal: number;
  value: (c: AchContext) => number;
}

export function achievementContext(state: AppState): AchContext {
  const career = careerStats(state.days, state.settings?.dayOverrides);
  const ot = overtimeTotals(state.days);
  const ids = Object.keys(state.collection);
  return {
    completed: career.completedDays,
    streak: career.streak,
    overtimeDays: ot.days,
    overtimeHours: ot.ms / 3_600_000,
    paydaySeen: state.paydaySeen ? 1 : 0,
    dex: ids.filter((id) => id in GACHA_BY_ID).length,
    holiday: ids.filter((id) => id in HOLIDAY_BY_ID).length,
    rare: RARE_BEHAVIORS.filter((r) => state.rare?.[r.id]).length,
    pet: state.stats?.pet ?? 0,
    feed: state.stats?.feed ?? 0,
    bond: bondLevel(state.bond?.hearts ?? 0),
    tappedThings: THINGS.filter((t) => (state.stats?.things?.[t] ?? 0) > 0).length,
    clockTaps: state.stats?.things?.clock ?? 0,
    visitors: Object.keys(state.visitors ?? {}).length,
    seasonItems: ownedSeasonItems(state).length,
    ignored: state.stats?.ignored ?? 0,
    chatWins: state.stats?.chatWins ?? 0,
    stories: Object.keys(state.stories?.seen ?? {}).length,
    dragon: state.stats?.dragon ?? 0,
    escapes: state.stats?.escapes ?? 0,
    // 예전 버전은 횟수를 안 셌으니, 한 번이라도 본 적이 있으면 1부터
    paydays: Math.max(state.stats?.paydays ?? 0, state.paydaySeen ? 1 : 0),
  };
}

const a = (id: string, name: string, desc: string, glyph: Glyph, tier: Tier, goal: number, value: Achievement['value']): Achievement => ({ id, name, desc, glyph, tier, goal, value });

export const ACHIEVEMENTS: Achievement[] = [
  a('first-day', '첫 출근', '작업물을 1개 완성해요', 'paw', 'bronze', 1, (c) => c.completed),
  a('week', '일주일 출근', '작업물을 7개 완성해요', 'paw', 'bronze', 7, (c) => c.completed),
  a('month', '한 달 출근', '작업물을 30개 완성해요', 'paw', 'silver', 30, (c) => c.completed),
  a('fifty', '오십 일 출근', '작업물을 50개 완성해요', 'paw', 'silver', 50, (c) => c.completed),
  a('hundred', '백일 출근', '작업물을 100개 완성해요', 'paw', 'gold', 100, (c) => c.completed),
  a('two-hundred', '이백 일 출근', '작업물을 200개 완성해요', 'paw', 'gold', 200, (c) => c.completed),
  a('year', '1주년', '작업물을 365개 완성해요. 1년 동안 고생했어요', 'paw', 'gold', 365, (c) => c.completed),
  a('streak5', '5일 연속 출근', '쉬는 날은 끊지 않아요. 5일 이어서 출근해요', 'flame', 'bronze', 5, (c) => c.streak),
  a('streak20', '20일 연속 출근', '20일 이어서 출근해요', 'flame', 'silver', 20, (c) => c.streak),
  a('streak60', '60일 연속 출근', '60일 이어서 출근해요. 몸 챙기면서요', 'flame', 'gold', 60, (c) => c.streak),
  a('ot-first', '야근 생존자', '야근을 한 번 해요', 'moon', 'bronze', 1, (c) => c.overtimeDays),
  a('ot-10h', '야근 10시간', '야근 시간이 합쳐서 10시간이 돼요', 'moon', 'silver', 10, (c) => c.overtimeHours),
  a('payday', '월급날 도장', '월급날을 맞이해요', 'coin', 'bronze', 1, (c) => c.paydaySeen),
  a('payday-3', '월급 세 번', '월급날을 세 번 맞이해요', 'coin', 'silver', 3, (c) => c.paydays),
  a('payday-12', '월급 1년치', '월급날을 열두 번 맞이해요', 'coin', 'gold', 12, (c) => c.paydays),
  a('ot-30h', '야근 30시간', '야근 시간이 합쳐서 30시간이 돼요. 수고 많았어요', 'moon', 'gold', 30, (c) => c.overtimeHours),
  a('dex-10', '이벤트 10종', '직장인 이벤트를 10종 모아요', 'star', 'bronze', 10, (c) => c.dex),
  a('dex-30', '이벤트 30종', '직장인 이벤트를 30종 모아요', 'star', 'silver', 30, (c) => c.dex),
  a('dex-all', '이벤트 도감 완성', '직장인 이벤트를 전부 모아요', 'star', 'gold', GACHA_EVENTS.length, (c) => c.dex),
  a('holiday-5', '휴일 이벤트 5종', '쉬는 날 이벤트를 5종 모아요', 'gift', 'bronze', 5, (c) => c.holiday),
  a('holiday-all', '휴일 도감 완성', '휴일 이벤트를 전부 모아요', 'gift', 'gold', HOLIDAY_EVENTS.length, (c) => c.holiday),
  a('rare-3', '희귀 행동 3종', '희귀 행동을 3종 목격해요', 'sparkle', 'bronze', 3, (c) => c.rare),
  a('rare-all', '희귀 행동 완성', '희귀 행동을 전부 목격해요', 'sparkle', 'gold', RARE_BEHAVIORS.length, (c) => c.rare),
  a('pet-100', '쓰다듬기 100번', '캐릭터를 100번 쓰다듬어요', 'heart', 'bronze', 100, (c) => c.pet),
  a('pet-500', '쓰다듬기 장인', '캐릭터를 500번 쓰다듬어요', 'heart', 'silver', 500, (c) => c.pet),
  a('feed-100', '간식 창고', '간식을 100번 줘요', 'heart', 'silver', 100, (c) => c.feed),
  a('feed-30', '간식 30번', '간식을 30번 줘요', 'heart', 'bronze', 30, (c) => c.feed),
  a('bond-3', '친구가 됐어요', '친밀도 3단계가 돼요', 'heart', 'silver', 3, (c) => c.bond),
  a('bond-5', '둘도 없는 사이', '친밀도 5단계가 돼요', 'heart', 'gold', 5, (c) => c.bond),
  a('explore', '방 안 탐험가', '창문·시계·쳇바퀴·이불·노트북을 모두 눌러 봐요', 'bubble', 'silver', THINGS.length, (c) => c.tappedThings),
  a('clock-20', '시계 집착', '시계를 20번 눌러요. 눌러도 빨리 안 가요', 'clock', 'bronze', 20, (c) => c.clockTaps),
  a('ignore-1', '첫 읽씹', '퇴근 후 업무 연락을 읽씹해요', 'bubble', 'bronze', 1, (c) => c.ignored),
  a('ignore-10', '읽씹 장인', '퇴근 후 업무 연락을 10번 읽씹해요', 'bubble', 'silver', 10, (c) => c.ignored),
  a('ignore-30', '읽씹 마스터', '퇴근 후 업무 연락을 30번 읽씹해요', 'bubble', 'gold', 30, (c) => c.ignored),
  a('ignore-60', '읽씹의 신', '퇴근 후 업무 연락을 60번 읽씹해요', 'bubble', 'gold', 60, (c) => c.ignored),
  a('cider-1', '첫 사이다', '어이없는 대화에 사이다를 날려요', 'bubble', 'bronze', 1, (c) => c.chatWins),
  a('cider-10', '사이다 장인', '사이다를 10번 날려요', 'bubble', 'silver', 10, (c) => c.chatWins),
  a('cider-30', '사이다 마스터', '사이다를 30번 날려요', 'bubble', 'gold', 30, (c) => c.chatWins),
  a('cider-60', '사이다 공장장', '사이다를 60번 날려요', 'bubble', 'gold', 60, (c) => c.chatWins),
  a('story-10', '썰 극장 단골', '오늘의 썰을 10편 봐요', 'star', 'bronze', 10, (c) => c.stories),
  a('story-30', '썰 극장 VIP', '오늘의 썰을 30편 봐요', 'star', 'silver', 30, (c) => c.stories),
  a('story-all', '썰 극장 전편 관람', '지금 있는 썰을 전부 봐요', 'star', 'gold', allStories().length, (c) => c.stories),
  a('dragon-1', '첫 변신', '드래곤으로 변신해요', 'flame', 'bronze', 1, (c) => c.dragon),
  a('dragon-10', '본사 단골 손님', '드래곤으로 10번 변신해요', 'flame', 'silver', 10, (c) => c.dragon),
  a('dragon-30', '본사 철거반', '드래곤으로 30번 변신해요', 'flame', 'gold', 30, (c) => c.dragon),
  a('escape-6', '탈출 전편 관람', '퇴근 탈출 여섯 편을 다 봐요', 'paw', 'silver', 6, (c) => c.escapes),
  a('escape-50', '퇴근 탈출 장인', '퇴근 탈출을 50번 봐요', 'paw', 'gold', 50, (c) => c.escapes),
  a('guest-1', '첫 손님', '다른 친구가 놀러 와요', 'paw', 'bronze', 1, (c) => c.visitors),
  a('guest-3', '손님 접대왕', '세 종류의 손님을 모두 만나요', 'paw', 'silver', 3, (c) => c.visitors),
  a('season-1', '한정 아이템', '계절 이벤트 한정 아이템을 받아요', 'gift', 'bronze', 1, (c) => c.seasonItems),
  a('season-all', '한정 수집가', '한정 아이템을 전부 받아요', 'gift', 'gold', SEASON_ITEMS.length, (c) => c.seasonItems),
];

// 도감 완성 목표는 이벤트가 늘어나면 같이 늘어난다
for (const [id, list] of [['dex-all', GACHA_EVENTS], ['holiday-all', HOLIDAY_EVENTS]] as const) {
  const x = ACHIEVEMENTS.find((a) => a.id === id);
  if (x) Object.defineProperty(x, 'goal', { get: () => list.length });
}

export const ACH_BY_ID = Object.fromEntries(ACHIEVEMENTS.map((x) => [x.id, x])) as Record<string, Achievement>;

/** 지금 상태에서 새로 달성한 업적 */
export function newAchievements(state: AppState): Achievement[] {
  const c = achievementContext(state);
  return ACHIEVEMENTS.filter((x) => !state.achievements?.[x.id] && x.value(c) >= x.goal);
}

export function grantAchievements(state: AppState, ids: string[], now: number): AppState {
  const next = { ...state.achievements };
  for (const id of ids) next[id] ??= now;
  return { ...state, achievements: next };
}

/** 달성한 개수 / 전체 */
export function achievementCount(state: AppState): [number, number] {
  return [ACHIEVEMENTS.filter((x) => state.achievements?.[x.id]).length, ACHIEVEMENTS.length];
}
