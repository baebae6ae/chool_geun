import { useEffect, useRef, useState } from 'react';
import { useClockMode, useWakeLock } from './clockMode';
import { ClockOutModal, GachaModal, PaydayModal, WhatsNewModal } from './components/Modals';
import { addDays, atTime, dateKey } from './domain/date';
import { endOvertime, recordLeft } from './domain/overtime';
import { applySettings, daysUntilPayday, markCelebrated, markGachaSeen, reconcile, unseenGacha } from './domain/engine';
import { paydaySummary } from './domain/records';
import { dayBounds, earnedAt } from './domain/schedule';
import type { AppState, Settings } from './domain/types';
import { sendNotification } from './notify';
import { Collection } from './screens/Collection';
import { Customize } from './screens/Customize';
import { Home } from './screens/Home';
import { Office } from './screens/Office';
import { Records } from './screens/Records';
import { SettingsForm } from './screens/SettingsForm';
import { getState, inAppBrowser, now as clockNow, resetState, setState, storageOk, useAppState, useNow } from './store';
import { TabIcon, type IconId } from './components/TabIcon';
import { installWidgetDebug, syncWidget } from './widgetSync';
import { isHolidayEvent } from './domain/gacha';
import { installBackButton, useBackHandler } from './backStack';
import { installNotifDebug, syncNotifications } from './notifySchedule';
import { grantAchievements, newAchievements } from './domain/achievements';
import { visitSeason } from './domain/seasons';
import { markWhatsNewSeen, whatsNewPending } from './domain/whatsNew';

type Tab = 'home' | 'office' | 'dex' | 'records' | 'custom';

const TABS: { id: Tab; icon: IconId; label: string }[] = [
  { id: 'home', icon: 'home', label: '오늘' },
  { id: 'office', icon: 'office', label: '사무실' },
  { id: 'dex', icon: 'dex', label: '도감' },
  { id: 'records', icon: 'records', label: '기록' },
  { id: 'custom', icon: 'custom', label: '꾸미기' },
];

const TAB_KEY = 'hamster-tab';
const initialTab = (): Tab => {
  try {
    const t = sessionStorage.getItem(TAB_KEY) as Tab | null;
    return t && TABS.some((x) => x.id === t) ? t : 'home';
  } catch {
    return 'home';
  }
};

function StorageNotice() {
  const [hidden, setHidden] = useState(false);
  if (hidden || (storageOk && !inAppBrowser)) return null;
  return (
    <div className="storage-notice" role="alert">
      <span>
        {!storageOk
          ? '이 브라우저에서는 기록이 저장되지 않아요 (시크릿 모드·쿠키 차단). 새로고침하면 처음부터 시작돼요. 일반 모드의 사파리·크롬에서 열어주세요.'
          : `${inAppBrowser} 안에서 열면 창을 닫을 때 기록이 지워질 수 있어요. ⋯ 메뉴에서 '다른 브라우저로 열기'를 눌러주세요.`}
      </span>
      <button className="icon-btn quiet" onClick={() => setHidden(true)} aria-label="닫기">
        ✕
      </button>
    </div>
  );
}

export function App() {
  const state = useAppState();
  const now = useNow(1000);
  const [tab, setTabState] = useState<Tab>(initialTab);
  const setTab = (t: Tab) => {
    setTabState(t);
    try {
      sessionStorage.setItem(TAB_KEY, t);
    } catch {
      // 무시
    }
  };
  const [showSettings, setShowSettings] = useState(false);
  const landscape = useClockMode();
  const clock = landscape && !!state.settings && tab === 'home' && !showSettings;
  useWakeLock(clock);
  const [recordFocus, setRecordFocus] = useState<string>();
  const prevTick = useRef(now);

  // 매 초: 실제 시간 기준으로 상태 맞추기 + 알림
  useEffect(() => {
    const prev = prevTick.current;
    prevTick.current = now;
    const r = reconcile(getState(), now);
    let next: AppState = r.state;
    const today = next.days[dateKey(now)];
    if (today) {
      const { start } = dayBounds(today.date, today.schedule);
      if (prev < start && now >= start) next = sendNotification(next, 'clockIn', now);
    }
    if (r.newGacha.length > 0) next = sendNotification(next, r.newGacha.every((g) => isHolidayEvent(g.eventId)) ? 'holidayGacha' : 'gacha', now);
    if (today && r.finalized.includes(today.date)) next = sendNotification(next, 'clockOut', now);
    // 야근은 자정에 자동으로 끝낸다
    if (next.overtime && now >= atTime(addDays(next.overtime.date, 1), '00:00')) next = endOvertime(next, now);
    setState(next);
  }, [now]);

  // 홈 화면 위젯(안드로이드): 위젯에 보이는 내용이 바뀌는 상태가 달라질 때마다 다시 넘긴다
  const todayRec = state.days[dateKey(now)];
  const widgetSig = JSON.stringify([
    state.settings,
    state.custom,
    state.overtime ?? null,
    dateKey(now),
    todayRec?.clockedOut ?? null,
    todayRec?.hourly ?? null,
    todayRec?.overtimeMs ?? null,
  ]);
  useEffect(() => {
    const id = setTimeout(() => syncWidget(getState(), clockNow()), 800);
    return () => clearTimeout(id);
  }, [widgetSig]);
  useEffect(() => {
    installWidgetDebug(getState, clockNow);
    installNotifDebug(getState, clockNow);
    // 앱을 내리면 앞으로의 알림을 기기에 예약하고, 다시 보이면 지운다 (안드로이드 앱)
    syncNotifications(getState(), clockNow(), document.visibilityState === 'hidden');
    const onHide = () => {
      const hidden = document.visibilityState === 'hidden';
      if (hidden) syncWidget(getState(), clockNow());
      syncNotifications(getState(), clockNow(), hidden);
    };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, []);

  // 계절 이벤트 기간에 앱을 켠 날 기록 + 새 업적 달성 확인
  const dayKey = dateKey(now);
  const hasSettings = !!state.settings;
  useEffect(() => {
    if (hasSettings) setState((s) => visitSeason(s, dayKey));
  }, [dayKey, hasSettings]);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  useEffect(() => {
    if (!state.settings) return;
    const fresh = newAchievements(state);
    if (!fresh.length) return;
    setState((s) => grantAchievements(s, fresh.map((x) => x.id), clockNow()));
    setToast({ key: Date.now(), text: fresh.length > 2 ? `🏅 업적 ${fresh.length}개를 한꺼번에 달성했어요!` : `🏅 업적 달성! ${fresh.map((x) => x.name).join(' · ')}` });
  }, [state]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 3700);
    return () => clearTimeout(id);
  }, [toast]);

  // 안드로이드 뒤로가기: 설정 화면 → 닫기, 다른 탭 → 오늘 탭, 그다음엔 앱 내리기
  useEffect(installBackButton, []);
  useBackHandler(showSettings, () => setShowSettings(false));
  useBackHandler(!showSettings && tab !== 'home', () => {
    setRecordFocus(undefined);
    setTab('home');
    window.scrollTo(0, 0);
  });

  // 업데이트 소식: 화면에 뜨는 순간 본 것으로 기록해서, 창을 닫지 않고 앱을 꺼도 다음에 또 뜨지 않는다
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const newsPending = whatsNewPending(state);
  useEffect(() => {
    if (newsPending) setWhatsNewOpen(true);
  }, [newsPending]);

  const saveSettings = (s: Settings) => {
    const t = clockNow();
    const first = !getState().settings;
    // 처음 시작한 사람은 지난 업데이트 소식을 볼 필요가 없다
    const base = first ? markWhatsNewSeen(getState()) : getState();
    setState(reconcile(applySettings(base, s, t), t).state);
    setShowSettings(false);
  };

  if (!state.settings) {
    return (
      <div className="app">
        <StorageNotice />
        <main>
          <SettingsForm initial={null} custom={state.custom} onSave={saveSettings} />
        </main>
      </div>
    );
  }

  const settings = state.settings;
  const key = dateKey(now);
  const today = state.days[key];
  const pending = unseenGacha(state);
  const gacha = pending[0];
  const showClockOut = !gacha && today?.clockedOut && !today.celebrated;
  const isPayday = daysUntilPayday(key, settings.payday) === 0;
  const showPayday = !gacha && !showClockOut && !showSettings && isPayday && state.paydaySeen !== key;
  const pay = showPayday
    ? paydaySummary(
        state.days,
        key,
        settings.payday,
        today && !today.clockedOut ? earnedAt(key, today.schedule, today.hourly, now) : 0,
      )
    : null;

  const openRecord = (date?: string) => {
    setRecordFocus(date);
    setTab('records');
    window.scrollTo(0, 0);
  };

  return (
    <div className={clock ? 'app clock' : 'app'}>
      <StorageNotice />
      <main className="content">
        {showSettings ? (
          <SettingsForm
            initial={settings}
            custom={state.custom}
            onSave={saveSettings}
            onCancel={() => setShowSettings(false)}
            onReset={() => {
              resetState();
              setShowSettings(false);
              setTab('home');
            }}
          />
        ) : (
          <>
            {tab === 'home' && (
              <Home
                state={{ ...state, settings }}
                now={now}
                onOpenSettings={() => setShowSettings(true)}
                onRare={(id) =>
                  setState((s) => (s.rare?.[id] ? s : { ...s, rare: { ...s.rare, [id]: clockNow() } }))
                }
                clock={clock}
                onState={(fn) => setState(fn)}
              />
            )}
            {tab === 'office' && <Office state={state} />}
            {tab === 'dex' && <Collection state={state} />}
            {tab === 'records' && (
              <Records
                key={recordFocus}
                state={state}
                now={now}
                focusDate={recordFocus}
                onLeft={(date, left) => setState((s) => recordLeft(s, date, left))}
                onDayOverride={(date, v) =>
                  setState((s) => {
                    if (!s.settings) return s;
                    const dayOverrides = { ...s.settings.dayOverrides };
                    if (v) dayOverrides[date] = v;
                    else delete dayOverrides[date];
                    return { ...s, settings: { ...s.settings, dayOverrides } };
                  })
                }
              />
            )}
            {tab === 'custom' && <Customize state={state} onChange={(custom) => setState((s) => ({ ...s, custom }))} />}
          </>
        )}
      </main>

      {toast && (
        <div key={toast.key} className="toast" role="status">
          {toast.text}
        </div>
      )}

      <nav className="tabbar" aria-label="메뉴">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id && !showSettings ? 'on' : ''}
            onClick={() => {
              setShowSettings(false);
              setRecordFocus(undefined);
              setTab(t.id);
              window.scrollTo(0, 0);
            }}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="tab-icon"><TabIcon id={t.icon} /></span>
            <span className="tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      {gacha && (
        <GachaModal
          id={`${gacha.date}-${gacha.at}`}
          eventId={gacha.eventId}
          isNew={state.collection[gacha.eventId]?.firstObtainedAt === gacha.at}
          remaining={pending.length - 1}
          onClose={() => setState((s) => markGachaSeen(s, gacha.date, gacha.eventId, gacha.at))}
        />
      )}
      {pay && (
        <PaydayModal
          custom={state.custom}
          total={pay.total}
          workDays={pay.workDays}
          name={settings.hamsterName}
          onClose={() => setState((s) => ({ ...s, paydaySeen: key }))}
        />
      )}
      {whatsNewOpen && !gacha && !pay && !showClockOut && !showSettings && (
        <WhatsNewModal custom={state.custom} onShown={() => setState((s) => markWhatsNewSeen(s))} onClose={() => setWhatsNewOpen(false)} />
      )}
      {showClockOut && today && (
        <ClockOutModal
          day={today}
          custom={state.custom}
          onClose={() => setState((s) => markCelebrated(s, key))}
          onRecord={() => {
            setState((s) => markCelebrated(s, key));
            setShowSettings(false);
            openRecord(key);
          }}
        />
      )}
    </div>
  );
}
