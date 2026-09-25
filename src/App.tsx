import { useEffect, useRef, useState } from 'react';
import { useClockMode, useWakeLock } from './clockMode';
import { ClockOutModal, GachaModal, PaydayModal } from './components/Modals';
import { dateKey } from './domain/date';
import { applySettings, clockOut, daysUntilPayday, markCelebrated, markGachaSeen, reconcile, unseenGacha } from './domain/engine';
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

type Tab = 'home' | 'office' | 'dex' | 'records' | 'custom';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🐹', label: '오늘' },
  { id: 'office', icon: '🏢', label: '사무실' },
  { id: 'dex', icon: '📖', label: '도감' },
  { id: 'records', icon: '📒', label: '기록' },
  { id: 'custom', icon: '🎀', label: '꾸미기' },
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
    if (r.newGacha.length > 0) next = sendNotification(next, 'gacha', now);
    if (today && r.finalized.includes(today.date)) next = sendNotification(next, 'clockOut', now);
    setState(next);
  }, [now]);

  const saveSettings = (s: Settings) => {
    const t = clockNow();
    setState(reconcile(applySettings(getState(), s, t), t).state);
    setShowSettings(false);
  };

  if (!state.settings) {
    return (
      <div className="app">
        <StorageNotice />
        <SettingsForm initial={null} custom={state.custom} onSave={saveSettings} />
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
                onClockOut={() => setState(clockOut(getState(), key, clockNow()))}
                onOpenSettings={() => setShowSettings(true)}
                onOpenRecord={() => openRecord(key)}
                onRare={(id) =>
                  setState((s) => (s.rare?.[id] ? s : { ...s, rare: { ...s.rare, [id]: clockNow() } }))
                }
                clock={clock}
              />
            )}
            {tab === 'office' && <Office state={state} />}
            {tab === 'dex' && <Collection state={state} />}
            {tab === 'records' && <Records key={recordFocus} state={state} now={now} focusDate={recordFocus} />}
            {tab === 'custom' && <Customize state={state} onChange={(custom) => setState((s) => ({ ...s, custom }))} />}
          </>
        )}
      </main>

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
            <span className="tab-icon">{t.icon}</span>
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
