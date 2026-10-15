/**
 * 알림 예약 (안드로이드 앱).
 * 앱이 꺼져 있어도 알림이 오도록, 출근·퇴근·가챠 시각을 며칠 치 미리 기기에 예약해 둔다.
 * - 앱을 내릴 때(화면이 안 보이게 될 때) 예약하고, 앱이 다시 보이면 지운다 (앱을 보고 있는 동안엔 화면에서 알려주므로).
 * - 하루 최대 3개: 월급날 → 출근 → 퇴근 → 가챠 순으로 우선한다.
 */
import { addDays, atTime, dateKey } from './domain/date';
import { daysUntilPayday } from './domain/engine';
import { planDailyGacha, planHolidayGacha, HOLIDAY_GACHA_FROM, HOLIDAY_GACHA_TO } from './domain/gacha';
import { dayBounds, isWorkday, timeAtFraction } from './domain/schedule';
import type { AppState, Settings } from './domain/types';
import { DAILY_LIMIT, MESSAGES } from './notify';
import { isNative } from './platform';

export type PlannedKind = 'payday' | 'clockIn' | 'clockOut' | 'gacha' | 'holidayGacha';
export interface PlannedNotification {
  at: number;
  kind: PlannedKind;
}

const scheduleOf = (s: Settings) => ({ workStart: s.workStart, workEnd: s.workEnd, lunchStart: s.lunchStart, lunchEnd: s.lunchEnd });

/** 오늘부터 days일 동안 앞으로 보낼 알림 목록 (시각 순). 하루 최대 3개: 월급날 → 출근 → 퇴근 → 가챠 순으로 우선 */
export function planNotifications(state: AppState, now: number, days = 3): PlannedNotification[] {
  const settings = state.settings;
  if (!settings) return [];
  const today = dateKey(now);
  const out: PlannedNotification[] = [];
  const future = (at: number) => at > now + 5_000;

  for (let i = 0; i < days; i++) {
    const key = addDays(today, i);
    const day = state.days[key];
    const dayItems: PlannedNotification[] = [];
    // 월급날 아침: 출근하는 날은 출근 30분 전, 쉬는 날은 10시
    if (daysUntilPayday(key, settings.payday) === 0) {
      const at = day || isWorkday(key, settings) ? dayBounds(key, day?.schedule ?? scheduleOf(settings)).start - 30 * 60_000 : atTime(key, '10:00');
      if (future(at)) dayItems.push({ at, kind: 'payday' });
    }

    if (day || isWorkday(key, settings)) {
      const schedule = day?.schedule ?? scheduleOf(settings);
      const b = dayBounds(key, schedule);
      const leftEarly = !!day?.clockedOut;
      if (!leftEarly && future(b.start)) dayItems.push({ at: b.start, kind: 'clockIn' });
      if (!leftEarly && future(b.end)) dayItems.push({ at: b.end, kind: 'clockOut' });
      const draws = day
        ? day.gacha.filter((g) => !g.obtained).map((g) => g.at)
        : planDailyGacha(state.seed, key).map((p) => Math.round(timeAtFraction(key, schedule, p.fraction)));
      for (const at of draws) if (future(at)) dayItems.push({ at, kind: 'gacha' });
    } else {
      const holiday = state.holidays?.[key];
      const start = atTime(key, `${String(HOLIDAY_GACHA_FROM).padStart(2, '0')}:00`);
      const span = (HOLIDAY_GACHA_TO - HOLIDAY_GACHA_FROM) * 3_600_000;
      const draws = holiday
        ? holiday.gacha.filter((g) => !g.obtained).map((g) => g.at)
        : planHolidayGacha(state.seed, key, !isWorkday(addDays(key, 1), settings)).map((p) => Math.round(start + p.fraction * span));
      for (const at of draws) if (future(at)) dayItems.push({ at, kind: 'holidayGacha' });
    }

    // 우선순위(출근 → 퇴근 → 가챠)로 하루 최대 개수만 남기고 시각 순으로
    const rank: Record<PlannedKind, number> = { payday: 0, clockIn: 1, clockOut: 2, gacha: 3, holidayGacha: 3 };
    dayItems.sort((a, z) => rank[a.kind] - rank[z.kind] || a.at - z.at);
    out.push(...dayItems.slice(0, DAILY_LIMIT));
  }
  return out.sort((a, z) => a.at - z.at);
}

/**
 * 기기에 예약된 알림을 모두 지우고, hidden이고 알림이 켜져 있으면 앞으로 3일 치를 다시 예약한다.
 * 실패해도 앱에는 영향이 없다.
 */
export async function syncNotifications(state: AppState, now: number, hidden: boolean, force = false): Promise<number> {
  if (!isNative) return 0;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const pending = await LocalNotifications.getPending();
    // 우리가 예약한 것(번호 1000 미만)만 지운다
    const ours = pending.notifications.filter((n) => n.id < 1000);
    if (ours.length) await LocalNotifications.cancel({ notifications: ours });
    if (!hidden || !(force || state.settings?.notifications)) return 0;
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') return 0;
    const plan = planNotifications(state, now);
    if (!plan.length) return 0;
    await LocalNotifications.schedule({
      notifications: plan.map((p, i) => ({
        id: i + 1,
        title: MESSAGES[p.kind].title,
        body: MESSAGES[p.kind].body,
        schedule: { at: new Date(p.at), allowWhileIdle: true },
        // 정확한 시각을 요구하면 안드로이드 12 이상에서 "알람 및 리마인더" 설정 화면이 열려 버린다.
        // 몇 분쯤 늦을 수 있어도 사용자를 설정 화면으로 보내지 않는 쪽을 택한다.
        isExactNotification: false,
      })),
    });
    return plan.length;
  } catch (e) {
    console.warn('notification schedule failed', e);
    return 0;
  }
}

/** 점검용 */
declare global {
  interface Window {
    __notifDebug?: {
      sync: (hidden: boolean) => Promise<number>;
      pending: () => Promise<number>;
      fireIn: (seconds: number) => Promise<void>;
      plan: () => PlannedNotification[];
    };
  }
}

export function installNotifDebug(getState: () => AppState, now: () => number) {
  if (!isNative) return;
  window.__notifDebug = {
    sync: (hidden) => syncNotifications(getState(), now(), hidden, true),
    pending: async () => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      return (await LocalNotifications.getPending()).notifications.filter((n) => n.id < 1000).length;
    },
    fireIn: async (seconds) => {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [{ id: 9001, title: MESSAGES.clockOut.title, body: MESSAGES.clockOut.body, schedule: { at: new Date(Date.now() + seconds * 1000), allowWhileIdle: true }, isExactNotification: false }],
      });
    },
    plan: () => planNotifications(getState(), now()),
  };
}
