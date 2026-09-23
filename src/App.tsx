import { useEffect, useRef, useState } from 'react';
import { ClockOutModal, GachaModal } from './components/Modals';
import { dateKey } from './domain/date';
import { applySettings, clockOut, markCelebrated, markGachaSeen, reconcile, unseenGacha } from './domain/engine';
import { dayBounds } from './domain/schedule';
import type { AppState, Settings } from './domain/types';
import { sendNotification } from './notify';
import { Collection } from './screens/Collection';
import { Customize } from './screens/Customize';
import { Home } from './screens/Home';
import { Office } from './screens/Office';
import { Records } from './screens/Records';
import { SettingsForm } from './screens/SettingsForm';
import { getState, now as clockNow, resetState, setState, useAppState, useNow } from './store';

type Tab = 'home' | 'office' | 'dex' | 'records' | 'custom';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🐹', label: '오늘' },
  { id: 'office', icon: '🏢', label: '사무실' },
  { id: 'dex', icon: '📖', label: '도감' },
  { id: 'records', icon: '📒', label: '기록' },
  { id: 'custom', icon: '🎀', label: '꾸미기' },
];

export function App() {
  const state = useAppState();
  const now = useNow(1000);
  const [tab, setTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
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

  const openRecord = (date?: string) => {
    setRecordFocus(date);
    setTab('records');
    window.scrollTo(0, 0);
  };

  return (
    <div className="app">
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
          key={`${gacha.date}-${gacha.at}`}
          eventId={gacha.eventId}
          isNew={state.collection[gacha.eventId]?.firstObtainedAt === gacha.at}
          remaining={pending.length - 1}
          onClose={() => setState((s) => markGachaSeen(s, gacha.date, gacha.eventId, gacha.at))}
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
