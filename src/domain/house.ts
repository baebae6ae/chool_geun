/** 집 꾸미기 단계: 작업물을 완성한 날(진짜 출근)이 쌓일수록 방이 호화로워진다 */
import { careerStats } from './records';
import type { AppState } from './types';

export const HOUSE_LEVELS = [
  { at: 0, name: '원룸' },
  { at: 20, name: '러그 깐 원룸' },
  { at: 40, name: '갤러리 원룸' },
  { at: 70, name: '커튼 달린 방' },
  { at: 100, name: '벽난로 하우스' },
  { at: 150, name: '샹들리에 맨션' },
  { at: 200, name: '대리석 저택' },
  { at: 300, name: '황금 저택' },
  { at: 365, name: '햄스터 궁전' },
] as const;

export function houseLevel(completedDays: number): number {
  let lv = 1;
  HOUSE_LEVELS.forEach((l, i) => {
    if (completedDays >= l.at) lv = i + 1;
  });
  return lv;
}

export function houseLevelOf(state: Pick<AppState, 'days' | 'settings'>): number {
  return houseLevel(careerStats(state.days, state.settings?.dayOverrides).completedDays);
}

/** 아직 연출을 안 본 새 단계 (없으면 null). 처음 켠 사람은 지금 단계 연출을 한 번만 본다 */
export function pendingHouseUp(state: Pick<AppState, 'days' | 'settings' | 'houseSeen'>): number | null {
  const lv = houseLevelOf(state);
  return lv >= 2 && lv > (state.houseSeen ?? 1) ? lv : null;
}
