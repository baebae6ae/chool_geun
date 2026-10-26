import { useEffect, useRef, useState } from 'react';
import { useClockMode, useWakeLock } from './clockMode';
import { ClockOutModal, GachaModal, PaydayModal, WhatsNewModal } from './components/Modals';
import { addDays, atTime, dateKey } from './domain/date';
import { endOvertime, recordLeft } from './domain/overtime';
import { applySettings, completedCount, daysUntilPayday, markCelebrated, markGachaSeen, reconcile, unseenGacha } from './domain/engine';
import { LOP_DAYS } from './domain/customization';
import { paydaySummary } from './domain/records';
import { dayBounds } from './domain/schedule';
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
import { ownedSeasonItems, SEASON_BY_ID, visitSeason } from './domain/seasons';
import { markWhatsNewSeen, unseenNews, whatsNewPending } from './domain/whatsNew';
import { refreshStories } from './domain/theater';
import { refreshDragon } from './domain/dragon';
import { ReportSheet, SupportSheet } from './components/Cheer';
import { onSheet, type SheetKind } from './sheets';
import { recordSupport, TIERS } from './domain/support';
import { settlePending } from './billing';

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
  // 알림은 줄을 서서 하나씩 뜬다 (업적·한정 아이템·히든 캐릭터가 한꺼번에 와도 덮어쓰지 않게)
  const [toasts, setToasts] = useState<{ key: number; text: string }[]>([]);
  const toast = toasts[0] ?? null;
  const pushToast = (text: string) => setToasts((q) => [...q, { key: Date.now() + Math.random(), text }]);
  useEffect(() => {
    if (!hasSettings) return;
    const before = ownedSeasonItems(getState()).map((i) => i.id);
    setState((s) => visitSeason(s, dayKey));
    // 오늘 켜서 새로 받은 한정 아이템이 있으면 알려 준다 (화면이 다 뜬 뒤에, 다른 알림 다음 차례로)
    const got = ownedSeasonItems(getState()).filter((i) => !before.includes(i.id));
    if (got.length) {
      const i = got[got.length - 1];
      setTimeout(() => pushToast(`${i.emoji} ${SEASON_BY_ID[i.event].name} 한정 「${i.label}」 받았어요! 꾸미기에서 ${i.kind === 'deco' ? '놓아' : '써'} 보세요`), 1200);
    }
  }, [dayKey, hasSettings]);
  useEffect(() => {
    if (!state.settings) return;
    const fresh = newAchievements(state);
    if (!fresh.length) return;
    setState((s) => grantAchievements(s, fresh.map((x) => x.id), clockNow()));
    pushToast(fresh.length > 2 ? `🏅 업적 ${fresh.length}개를 한꺼번에 달성했어요!` : `🏅 업적 달성! ${fresh.map((x) => x.name).join(' · ')}`);
  }, [state]);
  // 썰 극장: 새 썰은 앱 업데이트 없이 인터넷에서 받아온다 (받으면 화면을 다시 그린다)
  const [, setStoriesTick] = useState(0);
  useEffect(() => {
    refreshStories().then((changed) => changed && setStoriesTick((n) => n + 1));
    // 드래곤 변신 장면도 같은 방식으로 받아온다 (다음 변신부터 새 장면이 섞인다)
    refreshDragon();
    // 결제는 됐는데 앱이 꺼져서 마무리 못 한 응원이 있으면 마저 처리하고 기록한다
    settlePending(TIERS.map((t) => t.id)).then((n) => {
      for (let i = 0; i < n; i++) setState((s) => recordSupport(s, clockNow()));
    });
  }, []);

  // 히든 캐릭터 롭이어: 출근 50일을 채우면 한 번 알려 준다 (다른 알림 다음 차례로)
  const lopReady = !!state.settings && !state.revealed?.lop && completedCount(state.days) >= LOP_DAYS;
  useEffect(() => {
    if (!lopReady) return;
    setState((s) => ({ ...s, revealed: { ...s.revealed, lop: clockNow() } }));
    // 기록하자마자 lopReady가 false로 바뀌므로 타이머는 정리하지 않는다
    setTimeout(() => pushToast('🐇 히든 캐릭터 롭이어가 열렸어요! 꾸미기에서 바꿔 보세요'), 1200);
  }, [lopReady]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToasts((q) => q.slice(1)), 3700);
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
  // 띄울 때의 소식 목록을 붙잡아 둔다 (본 것으로 기록하면 목록이 비기 때문)
  const [whatsNewOpen, setWhatsNewOpen] = useState<ReturnType<typeof unseenNews> | null>(null);
  // 제보·응원 시트: 어느 화면에서든 openSheet()로 연다
  const [sheet, setSheet] = useState<SheetKind | null>(null);
  useEffect(() => onSheet(setSheet), []);
  const newsPending = whatsNewPending(state);
  useEffect(() => {
    if (newsPending) setWhatsNewOpen(unseenNews(getState()));
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
    ? paydaySummary(state.days, key, settings)
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
          salary={pay.salary}
          overtime={pay.overtime}
          workDays={pay.workDays}
          name={settings.hamsterName}
          onClose={() => setState((s) => ({ ...s, paydaySeen: key }))}
        />
      )}
      {sheet === 'report' && (
        <ReportSheet
          state={state}
          onSent={() => setState((s) => ({ ...s, reports: (s.reports ?? 0) + 1 }))}
          onSupported={() => setState((s) => recordSupport(s, clockNow()))}
          onClose={() => setSheet(null)}
        />
      )}
      {sheet === 'support' && <SupportSheet state={state} onSupported={() => setState((s) => recordSupport(s, clockNow()))} onClose={() => setSheet(null)} />}
      {whatsNewOpen && !gacha && !pay && !showClockOut && !showSettings && (
        <WhatsNewModal custom={state.custom} items={whatsNewOpen} onShown={() => setState((s) => markWhatsNewSeen(s))} onClose={() => setWhatsNewOpen(null)} />
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
