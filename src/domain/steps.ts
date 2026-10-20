/**
 * 근무 중 걸음 수: 출근~퇴근 사이에 휴대폰이 센 걸음 수로 그날을 5단계로 나눈다 (안드로이드 앱 전용).
 * 앉았는지 서 있었는지는 알 수 없으니 "얼마나 움직였는지"만 본다.
 * 월말 조언은 진단이 아니라 생활 팁이다.
 */
import { pad } from './date';
import type { DailyWork } from './types';

export interface StepTier {
  level: 1 | 2 | 3 | 4 | 5;
  /** 이 걸음 수 이상이면 이 단계 */
  min: number;
  emoji: string;
  name: string;
  /** 퇴근할 때 친구가 하는 한마디 */
  line: string;
}

export const STEP_TIERS: StepTier[] = [
  { level: 1, min: 0, emoji: '🐌', name: '거의 안 움직인 날', line: '오늘 의자랑 결혼한 줄 알았어요' },
  { level: 2, min: 1000, emoji: '🐢', name: '조금 움직인 날', line: '엉덩이가 좀 무거운 하루였네요' },
  { level: 3, min: 2500, emoji: '🐹', name: '적당히 돌아다닌 날', line: '딱 좋게 움직였어요, 칭찬해요!' },
  { level: 4, min: 5000, emoji: '🐇', name: '바쁘게 뛰어다닌 날', line: '오늘 정말 바빴죠? 다리 수고했어요' },
  { level: 5, min: 8000, emoji: '🐆', name: '회사를 누빈 날', line: '발바닥에 불났겠어요! 오늘은 푹 쉬어요' },
];

export function stepTier(steps: number): StepTier {
  let t = STEP_TIERS[0];
  for (const x of STEP_TIERS) if (steps >= x.min) t = x;
  return t;
}

export interface MonthActivity {
  /** 걸음 수가 기록된 날 */
  days: number;
  total: number;
  average: number;
  best: { date: string; steps: number } | null;
  /** 단계별 일수 (1~5단계 순서) */
  counts: number[];
  /** 가장 많았던 단계 */
  main: StepTier | null;
  tip: { title: string; body: string; stretch: string } | null;
}

/** 가장 많았던 움직임에 맞춘 생활 팁 */
export function activityTip(level: number): { title: string; body: string; stretch: string } {
  if (level <= 2) {
    return {
      title: '같은 자세로 오래 있던 달이에요',
      body: '오래 앉아 있거나 한자리에 서 있으면 허리·목·어깨가 굳고 다리가 붓기 쉬워요. 한 시간에 한 번은 일어나서 기지개를 켜 보세요.',
      stretch: '목 천천히 돌리기 · 허리 뒤로 젖히기 · 까치발 들기',
    };
  }
  if (level === 3) {
    return {
      title: '적당히 움직인 균형 잡힌 달이에요',
      body: '지금처럼만 움직이면 좋아요. 점심시간에 10분 산책을 더하면 금상첨화예요.',
      stretch: '어깨 으쓱 털기 · 손목 돌리기',
    };
  }
  return {
    title: '많이 걷고 뛰어다닌 달이에요',
    body: '무릎·발목·발바닥이 지치기 쉬워요. 편한 신발을 신고, 물도 자주 마시고, 퇴근하면 다리를 올리고 쉬어 주세요.',
    stretch: '종아리 늘리기 · 발바닥 굴리기 · 다리 올리고 쉬기',
  };
}

export function monthActivity(days: Record<string, DailyWork>, y: number, m: number): MonthActivity {
  const prefix = `${y}-${pad(m)}-`;
  const list = Object.values(days).filter((d) => d.date.startsWith(prefix) && d.clockedOut && typeof d.steps === 'number');
  const counts = [0, 0, 0, 0, 0];
  let total = 0;
  let best: MonthActivity['best'] = null;
  for (const d of list) {
    const s = d.steps ?? 0;
    total += s;
    counts[stepTier(s).level - 1]++;
    if (!best || s > best.steps) best = { date: d.date, steps: s };
  }
  let mainIdx = -1;
  // 같은 일수면 더 많이 움직인 쪽을 고른다
  counts.forEach((c, i) => {
    if (c > 0 && (mainIdx < 0 || c >= counts[mainIdx])) mainIdx = i;
  });
  const main = mainIdx >= 0 ? STEP_TIERS[mainIdx] : null;
  return {
    days: list.length,
    total,
    average: list.length ? Math.round(total / list.length) : 0,
    best,
    counts,
    main,
    tip: main ? activityTip(main.level) : null,
  };
}
