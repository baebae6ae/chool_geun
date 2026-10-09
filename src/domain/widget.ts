/**
 * 안드로이드 홈 화면 위젯에 넘길 "앞으로의 상태 목록".
 * 위젯은 스스로 계산하지 않고, 앱이 앞으로 2주 치 상태가 바뀌는 시각과 그때 보여줄 내용을 미리 넘겨 둔다.
 * 위젯은 지금 시각에 해당하는 항목을 골라 그리기만 한다 (누르면 항상 앱이 열린다).
 */
import { addDays, atTime, dateKey, pad } from './date';
import { daysUntilPayday } from './engine';
import { holidayName } from './holidays';
import { overtimeMoney, OVERTIME_RATE, wageTypeOf } from './overtime';
import { restDailyPay, restEarnedAt } from './rest';
import { dayBounds, earnedAt, hourlyWage, isWorkday } from './schedule';
import type { AppState, Schedule, Settings } from './types';

export type WidgetPose = 'sleep' | 'yawn' | 'type' | 'nibble' | 'typeFast' | 'doom' | 'meal' | 'game' | 'phone' | 'snack';
export const WIDGET_POSES: WidgetPose[] = ['sleep', 'yawn', 'type', 'nibble', 'typeFast', 'doom', 'meal', 'game', 'phone', 'snack'];

export type WidgetTheme = 'morning' | 'day' | 'night' | 'off' | 'rot1' | 'rot2' | 'rot3' | 'rot4';

export interface WidgetEntry {
  /** 이 상태가 시작되는 시각 (ms) */
  at: number;
  theme: WidgetTheme;
  img: WidgetPose;
  /** 큰 글씨 위의 작은 글씨 ("퇴근까지") */
  label: string;
  /** 초 단위로 흐르는 시계. down이면 target까지 남은 시간, 아니면 target부터 지난 시간 */
  chrono?: { target: number; down: boolean };
  /** chrono가 없을 때의 큰 글씨 */
  big?: string;
  /** 맨 아래 한 줄 ("햄찌 · 열일 중") */
  status: string;
  /** 오른쪽 칸. money가 있으면 위젯이 그리는 순간의 금액을 계산해 value 대신 쓴다 */
  side: {
    label: string;
    value?: string;
    note?: string;
    /** note 앞에 "14:47 기준 · "을 붙인다 */
    stamp?: boolean;
    tone?: 'normal' | 'red' | 'green';
    money?: { base: number; at: number; perMin: number; cap: number };
  };
  /** 하루 진행 막대 (넓은 위젯) */
  progress?: { from: number; to: number };
}

const MIN = 60_000;
const won = (n: number) => `₩ ${Math.floor(n).toLocaleString('ko-KR')}`;
const hm = (t: number) => {
  const d = new Date(t);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function scheduleOf(s: Settings): Schedule {
  return { workStart: s.workStart, workEnd: s.workEnd, lunchStart: s.lunchStart, lunchEnd: s.lunchEnd };
}

function paydayText(key: string, payday: number) {
  const d = daysUntilPayday(key, payday);
  return d === 0 ? '오늘이 월급날!' : `월급날 D-${d}`;
}

/** 근무일 하루를 상태가 바뀌는 시각마다 잘라 항목으로 만든다 */
function workdayEntries(key: string, schedule: Schedule, hourly: number, name: string, payday: number): WidgetEntry[] {
  const b = dayBounds(key, schedule);
  const midnight = atTime(key, '00:00');
  const hasLunch = b.lunchEnd > b.lunchStart;
  const cuts = [midnight, b.start, b.start + 30 * MIN, b.end - 30 * MIN, b.end];
  if (hasLunch) cuts.push(b.lunchStart, b.lunchEnd);
  const times = [...new Set(cuts.filter((t) => t >= midnight && t <= b.end))].sort((a, z) => a - z);
  // 퇴근 후 저녁 일과 (앱 속 햄스터와 같은 순서)
  const evening = EVENING.map(([h, img, status]) => ({ t: atTime(key, h), img, status })).filter((e) => e.t > b.end);
  const eveningAt = (t: number) => [...EVENING].reverse().find(([h]) => atTime(key, h) <= t) ?? EVENING[0];
  const rate = hourly / 60;
  const pay = paydayText(key, payday);

  const done = (t: number, img: WidgetPose, status: string): WidgetEntry => ({
    at: t,
    theme: 'night',
    img,
    label: '오늘도 수고했어요',
    big: '퇴근 완료',
    status: `${name} · ${status}`,
    side: { label: '오늘 번 돈', value: won(earnedAt(key, schedule, hourly, b.end)), note: pay },
  });
  const work = times.map((t, i): WidgetEntry => {
    const next = times[i + 1] ?? b.end;
    if (t < b.start) {
      return {
        at: t,
        theme: 'morning',
        img: 'sleep',
        label: '출근까지',
        chrono: { target: b.start, down: true },
        status: `${name} · 출근 전 쿨쿨`,
        side: { label: '오늘 출근', value: hm(b.start), note: pay },
      };
    }
    if (t >= b.end) {
      const [, img, status] = eveningAt(t);
      return done(t, img, status);
    }
    const lunch = hasLunch && t >= b.lunchStart && t < b.lunchEnd;
    const img: WidgetPose = lunch ? 'nibble' : t < b.start + 30 * MIN ? 'yawn' : t >= b.end - 30 * MIN ? 'typeFast' : 'type';
    const status = lunch ? '점심 먹는 중' : img === 'yawn' ? '출근 완료 · 하아암' : img === 'typeFast' ? '막판 스퍼트!' : '열일 중';
    const base = earnedAt(key, schedule, hourly, t);
    return {
      at: t,
      theme: 'day',
      img,
      label: '퇴근까지',
      chrono: { target: b.end, down: true },
      status: `${name} · ${status}`,
      side: lunch
        ? { label: '오늘 번 돈', money: { base, at: t, perMin: 0, cap: base }, note: '점심시간 · 잠시 멈춤' }
        : {
            label: '오늘 번 돈',
            money: { base, at: t, perMin: rate, cap: earnedAt(key, schedule, hourly, next) },
            note: `분당 ₩${Math.round(rate).toLocaleString('ko-KR')}`,
            stamp: true,
          },
      progress: { from: b.start, to: b.end },
    } satisfies WidgetEntry;
  });
  return [...work, ...evening.map((e) => done(e.t, e.img, e.status))];
}

/** 퇴근 후 저녁: 시각(이때부터), 그림, 상태 문구 */
const EVENING: [string, WidgetPose, string][] = [
  ['00:00', 'meal', '저녁 먹는 중'],
  ['20:00', 'phone', '드라마 정주행 중'],
  ['23:00', 'sleep', '퇴근하고 꿀잠 중'],
];

/** 쉬는 날 하루 (앱 속 햄스터와 같은 순서) */
const HOLIDAY: [string, WidgetPose, string][] = [
  ['00:00', 'sleep', '쉬는 날 늦잠 중'],
  ['10:00', 'meal', '브런치 먹는 중'],
  ['14:00', 'game', '게임하는 중'],
  ['17:00', 'snack', '과자 먹는 중'],
  ['20:00', 'phone', '드라마 정주행 중'],
  ['23:00', 'sleep', '쿨쿨 자는 중'],
];

/** 쉬는 날: 시간대마다 하는 일이 바뀌고, 오른쪽엔 "누워서 번 돈"이 쌓인다 (월급 ÷ 그 달 날짜 수) */
function offEntries(key: string, settings: Settings, name: string): WidgetEntry[] {
  const holiday = holidayName(key);
  const perMin = restDailyPay(settings, key) / 1440;
  return HOLIDAY.map(([h, img, status], i) => {
    const t = atTime(key, h);
    const next = i + 1 < HOLIDAY.length ? atTime(key, HOLIDAY[i + 1][0]) : atTime(addDays(key, 1), '00:00');
    return {
      at: t,
      theme: 'off',
      img,
      label: holiday ? `오늘은 ${holiday}` : '오늘은',
      big: '쉬는 날',
      status: `${name} · ${status}`,
      side: {
        label: '누워서 번 돈',
        money: { base: restEarnedAt(settings, key, t), at: t, perMin, cap: restEarnedAt(settings, key, next) },
        note: paydayText(key, settings.payday),
        stamp: true,
      },
    } satisfies WidgetEntry;
  });
}

/** 야근 중이면 그날 퇴근 이후를 썩어가는 방으로 바꾼다 (30분·1시간·2시간·3시간째마다 한 단계씩) */
function overtimeEntries(state: AppState & { settings: Settings }, name: string): WidgetEntry[] {
  const o = state.overtime;
  const day = o ? state.days[o.date] : undefined;
  if (!o || !day) return [];
  const prev = day.overtimeMs ?? 0;
  const wage = wageTypeOf(state.settings);
  const inclusive = wage === 'inclusive';
  const rate = (day.hourly * OVERTIME_RATE) / 60;
  const midnight = atTime(addDays(o.date, 1), '00:00');
  const steps: [number, WidgetTheme][] = [
    [0, 'rot1'],
    [30, 'rot2'],
    [60, 'rot3'],
    [120, 'rot4'],
  ];
  return steps
    .map(([m, theme]) => ({ t: o.startedAt + m * MIN, theme }))
    .filter(({ t }) => t < midnight)
    .map(({ t, theme }) => {
      const money = overtimeMoney(wage, day.hourly, prev + (t - o.startedAt));
      const base = inclusive ? money.owed : money.pay;
      return {
        at: t,
        theme,
        img: 'doom',
        label: '야근 중 · 영혼 퇴근함',
        chrono: { target: o.startedAt - prev, down: false },
        status: `${name} · 영혼이 빠져나가는 중`,
        side: {
          label: inclusive ? '벌었어야 할 돈' : '야근수당',
          money: { base, at: t, perMin: rate, cap: Number.MAX_SAFE_INTEGER },
          note: `분당 ₩${Math.round(rate).toLocaleString('ko-KR')} ${inclusive ? '날리는 중' : '쌓이는 중'}`,
          tone: inclusive ? 'red' : 'green',
        },
      } satisfies WidgetEntry;
    });
}

/** 오늘부터 days일 동안 위젯이 보여줄 상태 목록 (시각 순) */
export function buildWidgetTimeline(state: AppState, now: number, days = 14): WidgetEntry[] {
  const settings = state.settings;
  if (!settings) return [];
  const s = { ...state, settings };
  const name = settings.hamsterName || '햄스터';
  const today = dateKey(now);
  const out: WidgetEntry[] = [];
  for (let i = 0; i < days; i++) {
    const key = addDays(today, i);
    const day = state.days[key];
    if (!day && !isWorkday(key, settings)) {
      out.push(...offEntries(key, settings, name));
      continue;
    }
    const schedule = day?.schedule ?? scheduleOf(settings);
    const hourly = day?.hourly ?? hourlyWage(settings);
    out.push(...workdayEntries(key, schedule, hourly, name, settings.payday));
  }
  const ot = overtimeEntries(s, name);
  if (ot.length) {
    const from = ot[0].at;
    const until = atTime(addDays(state.overtime!.date, 1), '00:00');
    const kept = out.filter((e) => e.at < from || e.at >= until);
    // 야근 시작 직전 상태가 '퇴근 완료'면 그대로 두어도 야근 항목이 바로 덮는다
    return [...kept, ...ot].sort((a, z) => a.at - z.at);
  }
  return out;
}
