/**
 * 상태 엔진 — 순수 함수. 현재 시각을 받아 상태를 "실제 시간 기준"으로 맞춘다.
 * 앱을 켜지 않았던 동안의 진행/가챠/퇴근도 다음 실행 때 한 번에 반영된다.
 */
import { addDays, dateKey } from './date';
import { GACHA_BY_ID, planDailyGacha } from './gacha';
import { createRng } from './random';
import { dayBounds, earnedAt, hourlyWage, isBankDay, isWorkday, progressAt, timeAtFraction, workedMs } from './schedule';
import { DEFAULT_CUSTOM, isUnlocked, rarityIndex, type Progress, type ProgressSource, type Unlock } from './customization';
import { itemForCompletedCount } from './workItems';
import type { AppState, DailyWork, Settings } from './types';

export const COMMENTS = [
  '오늘도 하나 만들었습니다.',
  '출근한 것만으로도 대단해요.',
  '작은 게 모여 사무실이 됩니다.',
  '오늘 치 성실함, 저장 완료.',
  '퇴근길은 언제나 옳아요.',
  '내일의 햄스터에게 바통 터치!',
  '해바라기씨 하나 추가요.',
  '무사히 퇴근, 그걸로 충분해요.',
];

export function createInitialState(seed = Math.floor(Math.random() * 2 ** 31)): AppState {
  return {
    version: 1,
    seed,
    settings: null,
    custom: { ...DEFAULT_CUSTOM },
    days: {},
    collection: {},
    notif: { date: '', count: 0 },
  };
}

export function completedCount(days: Record<string, DailyWork>, before?: string): number {
  let n = 0;
  for (const d of Object.values(days)) if (d.completed && (!before || d.date < before)) n++;
  return n;
}

export function createDay(state: AppState, settings: Settings, key: string, now: number): DailyWork {
  const schedule = {
    workStart: settings.workStart,
    workEnd: settings.workEnd,
    lunchStart: settings.lunchStart,
    lunchEnd: settings.lunchEnd,
  };
  const { season, index } = itemForCompletedCount(completedCount(state.days, key));
  const gacha = planDailyGacha(state.seed, key).map((p) => ({
    eventId: p.eventId,
    at: Math.round(timeAtFraction(key, schedule, p.fraction)),
    obtained: false,
    seen: false,
  }));
  const rng = createRng(`${state.seed}:${key}:comment`);
  return {
    date: key,
    season,
    workItemIndex: index,
    schedule,
    hourly: hourlyWage(settings),
    openedAt: now,
    endTime: null,
    progress: 0,
    completed: false,
    clockedOut: false,
    early: false,
    earned: 0,
    workedMs: 0,
    gacha,
    comment: COMMENTS[Math.floor(rng() * COMMENTS.length)],
    celebrated: false,
  };
}

/** 퇴근 처리. t가 퇴근시간 이후면 정상 퇴근(100%), 이전이면 조기 퇴근. */
export function finalizeDay(day: DailyWork, t: number): DailyWork {
  const { end } = dayBounds(day.date, day.schedule);
  const endTime = Math.min(t, end);
  const progress = progressAt(day.date, day.schedule, endTime);
  return {
    ...day,
    endTime,
    progress,
    completed: progress >= 1,
    clockedOut: true,
    early: t < end,
    earned: earnedAt(day.date, day.schedule, day.hourly, endTime),
    workedMs: workedMs(day.date, day.schedule, endTime),
    // 퇴근 이후 예정돼 있던 가챠는 사라진다
    gacha: day.gacha.filter((g) => g.obtained || g.at <= endTime),
  };
}

export interface ReconcileResult {
  state: AppState;
  changed: boolean;
  /** 이번에 새로 획득한 가챠 (알림용) */
  newGacha: { date: string; eventId: string }[];
  /** 이번에 새로 퇴근 처리된 날 */
  finalized: string[];
  /** 오늘 기록이 새로 생성됨 */
  createdToday: boolean;
}

export function reconcile(state: AppState, now: number): ReconcileResult {
  const result: ReconcileResult = { state, changed: false, newGacha: [], finalized: [], createdToday: false };
  const settings = state.settings;
  if (!settings) return result;

  const today = dateKey(now);
  const days = { ...state.days };
  const collection = { ...state.collection };
  let changed = false;

  const process = (key: string) => {
    let day = days[key];
    const limit = day.clockedOut ? (day.endTime ?? now) : now;

    // 1) 시간이 지난 가챠 획득
    if (day.gacha.some((g) => !g.obtained && g.at <= limit)) {
      day = {
        ...day,
        gacha: day.gacha.map((g) => {
          if (g.obtained || g.at > limit) return g;
          const prev = collection[g.eventId];
          collection[g.eventId] = prev
            ? { firstObtainedAt: Math.min(prev.firstObtainedAt, g.at), count: prev.count + 1 }
            : { firstObtainedAt: g.at, count: 1 };
          result.newGacha.push({ date: key, eventId: g.eventId });
          return { ...g, obtained: true };
        }),
      };
      changed = true;
    }

    // 2) 퇴근시간이 지난 날은 자동 퇴근 (지난 날은 무조건)
    if (!day.clockedOut) {
      const { end } = dayBounds(key, day.schedule);
      if (now >= end || key < today) {
        day = finalizeDay(day, Math.max(now, end));
        result.finalized.push(key);
        changed = true;
      }
    }
    days[key] = day;
  };

  // 쉬는 날(공휴일 등)인데 아직 일을 시작하지 않은 오늘 기록은 치운다
  const t = days[today];
  if (t && !t.clockedOut && !isWorkday(today, settings) && !t.gacha.some((g) => g.obtained)) {
    delete days[today];
    changed = true;
  }

  // 지난 날을 먼저 정리해야 오늘의 작업물 배정(완성 개수 기준)이 정확하다
  for (const key of Object.keys(days).sort()) process(key);
  if (isWorkday(today, settings) && !days[today]) {
    days[today] = createDay({ ...state, days }, settings, today, now);
    result.createdToday = true;
    changed = true;
    process(today);
  }

  if (!changed) return result;
  return { ...result, changed, state: { ...state, days, collection } };
}

/** 사용자가 직접 퇴근하기 버튼을 누름 */
export function clockOut(state: AppState, key: string, now: number): AppState {
  const day = state.days[key];
  if (!day || day.clockedOut) return state;
  const reconciled = reconcile(state, now).state;
  const fresh = reconciled.days[key];
  if (fresh.clockedOut) return reconciled;
  return { ...reconciled, days: { ...reconciled.days, [key]: finalizeDay(fresh, now) } };
}

export function markGachaSeen(state: AppState, key: string, eventId: string, at: number): AppState {
  const day = state.days[key];
  if (!day) return state;
  return {
    ...state,
    days: {
      ...state.days,
      [key]: { ...day, gacha: day.gacha.map((g) => (g.eventId === eventId && g.at === at ? { ...g, seen: true } : g)) },
    },
  };
}

export function markCelebrated(state: AppState, key: string): AppState {
  const day = state.days[key];
  if (!day) return state;
  return { ...state, days: { ...state.days, [key]: { ...day, celebrated: true } } };
}

/** 획득했지만 아직 확인하지 않은 가챠 (오래된 순) */
export function unseenGacha(state: AppState) {
  const out: { date: string; eventId: string; at: number }[] = [];
  for (const day of Object.values(state.days)) {
    for (const g of day.gacha) if (g.obtained && !g.seen) out.push({ date: day.date, eventId: g.eventId, at: g.at });
  }
  return out.sort((a, b) => a.at - b.at);
}

export function playerProgress(state: ProgressSource): Progress {
  let best = -1;
  for (const id of Object.keys(state.collection)) {
    const e = GACHA_BY_ID[id];
    if (e) best = Math.max(best, rarityIndex(e.rarity));
  }
  return {
    completed: completedCount(state.days),
    collected: Object.keys(state.collection).filter((id) => GACHA_BY_ID[id]).length,
    bestRarity: best,
  };
}

export function unlocked(state: ProgressSource, u: Unlock): boolean {
  return isUnlocked(u, playerProgress(state));
}

/** 급여일까지 남은 일수 (오늘이 급여일이면 0). 급여일이 말일보다 크면 말일로. */
/** 그 달의 실제 월급날: 급여일이 주말·공휴일이면 전 영업일로 당긴다 */
export function paydayOf(year: number, month: number, payday: number): string {
  const last = new Date(year, month, 0).getDate();
  let k = `${year}-${String(month).padStart(2, '0')}-${String(Math.min(payday, last)).padStart(2, '0')}`;
  for (let i = 0; i < 10 && !isBankDay(k); i++) k = addDays(k, -1);
  return k;
}

export function daysUntilPayday(key: string, payday: number): number {
  for (let i = 0; i < 62; i++) {
    const k = addDays(key, i);
    const [y, m] = k.split('-').map(Number);
    if (k === paydayOf(y, m, payday)) return i;
  }
  return 0;
}

/**
 * 설정 저장. 아직 퇴근하지 않은 오늘 기록은 새 스케줄로 다시 계산한다
 * (이미 획득한 가챠는 유지). 지난 기록은 그날의 스냅샷을 그대로 둔다.
 */
export function applySettings(state: AppState, settings: Settings, now: number): AppState {
  const next = { ...state, settings };
  const key = dateKey(now);
  const today = state.days[key];
  if (!today || today.clockedOut) return next;
  const rebuilt = createDay(next, settings, key, today.openedAt);
  const obtained = today.gacha.filter((g) => g.obtained);
  const days = { ...state.days };
  if (!isWorkday(key, settings) && obtained.length === 0) {
    delete days[key];
  } else {
    days[key] = {
      ...rebuilt,
      workItemIndex: today.workItemIndex,
      season: today.season,
      gacha: [...obtained, ...rebuilt.gacha.slice(obtained.length).filter((g) => g.at > now)],
    };
  }
  return { ...next, days };
}
