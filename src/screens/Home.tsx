import { Fragment, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { markStorySeen, storyUnlocked, todaysStory, type Story } from '../domain/theater';

const Theater = lazy(() => import('../components/theater/Theater').then((m) => ({ default: m.Theater })));
import { Habitat } from '../components/habitat/Habitat';
import { dateKey, formatKoreanDate, formatRemaining } from '../domain/date';
import { daysUntilPayday } from '../domain/engine';
import { holidayName } from '../domain/holidays';
import { MILESTONES, milestoneIndex } from '../domain/milestones';
import { RARE_BY_ID, type RareId } from '../domain/rare';
import { careerStats, formatWon, itemOf } from '../domain/records';
import { careerTitle, REACTION_LINES, speciesWord } from '../domain/customization';
import { dayBounds, earnedAt, hamsterMood, progressAt } from '../domain/schedule';
import type { AppState, Settings } from '../domain/types';
import { endOvertime, hhmm, liveOvertime, pendingLeftAsk, recordLeft, startOvertime, wageTypeOf } from '../domain/overtime';
import { addDays } from '../domain/date';
import { LeftSheet } from '../components/LeftSheet';
import { now as clockNow } from '../store';
import { ItemIcon } from '../components/ItemIcon';
import { TabIcon } from '../components/TabIcon';
import { BigClock, QuoteCard } from '../components/AmbientExtras';
import { pickOvertimeBubble, pickOvertimeQuote, pickTimeBubble, quotePhase } from '../domain/quotes';
import { ShareSheet, type TimeBand } from '../components/ShareSheet';
import { restDailyPay, restEarnedAt } from '../domain/rest';
import { pinWidget, widgetAvailable } from '../widgetSync';
import { activeSeason, seasonRangeText } from '../domain/seasons';
import { recordVisit } from '../domain/visitors';
import { ignoreWorkMessage, IGNORE_BEATS, IGNORE_FINAL_LINE, IGNORE_TOTAL_MS, pendingWorkMessage, stressRelief, type WorkMessage } from '../domain/workMessage';
import { CIDER_BEATS, CIDER_FINAL_LINE, CIDER_TOTAL_MS, cleanStress, pendingChat, SLAM_HIT_MS, winChat, type ChatScene } from '../domain/chatScene';
import { buzz } from '../haptics';
import type { Species } from '../domain/types';
import { addHeart, bondLevel, bondLine, BOND_TITLES, bumpStat, bumpThing, clockLine, SNARK_PET, thingLine, type ClockPhase, type Thing } from '../domain/play';
import type { FrontAction } from '../components/hamster/HamsterSprite';

interface Props {
  state: AppState & { settings: Settings };
  now: number;
  onOpenSettings: () => void;
  /** 희귀 행동 목격 (처음이면 도감에 등록) */
  onRare: (id: RareId) => void;
  /** 가로로 눕힌 탁상시계 화면 */
  clock?: boolean;
  /** 상태를 바꾼다 (야근 시작·끝, 퇴근 시각 기록) */
  onState: (fn: (s: AppState) => AppState) => void;
}

/**
 * 번 돈을 시계의 1/100초처럼 촤라락 굴린다. requestAnimationFrame마다 지금 시각으로 다시 계산해
 * 글자만 바꾸므로(React 재렌더링 없음) 가볍다. 숫자 칸 너비를 고정해 흔들리지 않는다.
 * live가 없으면(퇴근 후·쉬는 날) 고정된 값을 보여준다. '동작 줄이기' 설정이면 1초에 한 번만 갱신.
 */
function MoneyTicker({ fixed, fn, depKey = '', label = '오늘 번 돈' }: { fixed: number; fn?: () => number; depKey?: string; label?: string }) {
  const box = useRef<HTMLSpanElement>(null);
  const sr = useRef<HTMLSpanElement>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const value = () => (fnRef.current ? fnRef.current() : fixed);
    let prev = '';
    const paint = () => {
      const str = formatWon(value(), 2);
      if (str === prev) return;
      prev = str;
      const dot = str.lastIndexOf('.');
      const cell = (c: string) => (/\d/.test(c) ? `<span class="mn-d">${c}</span>` : `<span class="mn-s">${c === ' ' ? '&nbsp;' : c}</span>`);
      el.innerHTML = [...str.slice(0, dot)].map(cell).join('') + `<span class="mn-cs">${[...str.slice(dot)].map(cell).join('')}</span>`;
    };
    paint();
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let timer: ReturnType<typeof setInterval> | undefined;
    if (fn) {
      if (reduce) timer = setInterval(paint, 1000);
      else {
        const loop = () => {
          paint();
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }
    }
    // 화면 낭독기용: 원 단위로만 가끔
    const speak = () => {
      if (sr.current) sr.current.textContent = `${label} ${Math.floor(value()).toLocaleString('ko-KR')}원`;
    };
    speak();
    const srTimer = setInterval(speak, 5000);
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearInterval(timer);
      clearInterval(srTimer);
    };
  }, [fixed, !!fn, depKey, label]);

  return (
    <>
      <span ref={box} aria-hidden className="money-live" />
      <span ref={sr} className="sr-only" />
    </>
  );
}

/** 야근 시간을 1/100초까지 굴린다 */
function OvertimeClock({ getMs }: { getMs: () => number }) {
  const el = useRef<HTMLSpanElement>(null);
  const ref = useRef(getMs);
  ref.current = getMs;
  useEffect(() => {
    let raf = 0;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const paint = () => {
      const ms = Math.max(0, ref.current());
      const h = Math.floor(ms / 3_600_000);
      const m = Math.floor(ms / 60_000) % 60;
      const sec = Math.floor(ms / 1000) % 60;
      const cs = Math.floor(ms / 10) % 100;
      const p = (n: number) => String(n).padStart(2, '0');
      if (el.current) el.current.textContent = `${h}:${p(m)}:${p(sec)}${reduce ? '' : '.' + p(cs)}`;
    };
    paint();
    if (reduce) {
      const t = setInterval(paint, 1000);
      return () => clearInterval(t);
    }
    const loop = () => {
      paint();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <span ref={el} className="ot-clock" aria-hidden />;
}

/** 안드로이드 크롬 등은 진짜 전체 화면 가능 (아이폰은 브라우저가 막음 → 홈 화면에 추가해야 함) */
const canFullscreen = typeof document !== 'undefined' && !!document.fullscreenEnabled;
const toggleFullscreen = () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
};

/**
 * "그냥 켜놓는" 화면. 사용자가 조작할 게 거의 없고, 시간이 흐르는 대로
 * 번 돈과 작업 진행률, 햄스터의 행동이 저절로 바뀐다.
 */
export function Home({ state, now, onOpenSettings, onRare, clock = false, onState }: Props) {
  const { settings, custom } = state;
  const key = dateKey(now);
  const day = state.days[key];
  const payD = daysUntilPayday(key, settings.payday);
  const override = settings.dayOverrides?.[key];
  const holiday =
    override === 'off' ? (holidayName(key) ?? '쉬는 날') : override === 'on' ? undefined : settings.holidaysOff !== false ? holidayName(key) : undefined;

  const mood = day ? hamsterMood(key, day.schedule, now, day.clockedOut) : 'holiday';
  const progress = day ? (day.clockedOut ? day.progress : progressAt(key, day.schedule, now)) : 0;
  const earned = day ? (day.clockedOut ? day.earned : earnedAt(key, day.schedule, day.hourly, now)) : 0;
  const bounds = day ? dayBounds(key, day.schedule) : null;
  const item = day ? itemOf(day) : null;
  const pct = Math.floor(progress * 100);

  // 오늘 완성한 작업물 → 그날 하루만 햄스터 책상 옆에 (지난 작업물은 사무실 탭에서 시즌별로 본다)
  const todayItem = day?.completed ? item : null;

  // 햄스터 말풍선: 번 돈 환산, 희귀 행동
  const [bubble, setBubble] = useState<{ key: string; text: string } | null>(null);
  const spRef = useRef(custom.species);
  spRef.current = custom.species;
  const say = (text: string) => setBubble({ key: `${Date.now()}`, text: speciesWord(text, spRef.current) });

  // 시간대에 맞는 혼잣말: 시간대가 바뀐 뒤 잠시 지나서, 그리고 가끔 한 번씩 말풍선으로
  const overtimeRef = useRef(false);
  const phaseRef = useRef(quotePhase(now, key, day && !holiday ? day.schedule : null, !!day?.clockedOut));
  const bubbleN = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const n = bubbleN.current++ + Math.floor(Date.now() / 600000);
      if (overtimeRef.current) {
        if (Math.random() < 0.6) say(pickOvertimeBubble(n));
      } else if (Math.random() < 0.35) say(pickTimeBubble(phaseRef.current, n));
    }, 70_000);
    return () => clearInterval(id);
  }, []);

  // 햄스터와 놀기
  const [comfort, setComfort] = useState(0);
  const [reaction, setReaction] = useState<{ id: number; action: 'hug' } | null>(null);
  const [sharing, setSharing] = useState(false);
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  const bond = bondLevel(state.bond?.hearts ?? 0);
  const handleInteract = (kind: 'pet' | 'feed' | 'hug', action?: FrontAction) => {
    const lines = REACTION_LINES[custom.species ?? 'hamster'];
    const snarky = kind === 'pet' && (action === 'smug' || action === 'tongue');
    // 친해질수록 마음을 털어놓는 말이 섞인다
    const fond = !snarky && Math.random() < 0.35 ? bondLine(bond) : null;
    say(snarky ? pick(SNARK_PET) : (fond ?? pick(lines[kind])));
    // 하트와 누적 기록 (하트는 하루 최대 10개)
    const r = addHeart(stateRef.current, clockNow());
    onState((s) => bumpStat(addHeart(s, clockNow()).state, kind));
    if (r.leveledUp) setTimeout(() => say(`💖 친밀도 ${r.leveledUp}단계! ${BOND_TITLES[r.leveledUp! - 1]}`), 2600);
  };
  // 퇴근 후 업무 연락(가짜): 읽씹하기 버튼을 누르면 캐릭터가 한바탕 얄밉게 군다
  const [fx, setFx] = useState<{ msg: WorkMessage; stress: number } | null>(null);
  const [moment, setMoment] = useState<{ id: number; beats: { action: FrontAction; ms: number }[] } | null>(null);
  const ignoreTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => ignoreTimers.current.forEach(clearTimeout), []);
  const ignoreIt = () => {
    const m = pendingWorkMessage(stateRef.current, key, clockNow(), { clockedOut: !!day?.clockedOut, overtime: !!stateRef.current.overtime });
    if (!m || fx) return;
    buzz([25, 45, 25]);
    setFx({ msg: m, stress: stressRelief() });
    setMoment({ id: Date.now(), beats: IGNORE_BEATS });
    // 동작이 시작될 때마다 한마디씩, 연기가 끝나면 마무리 한마디
    let at = 250;
    for (const beat of IGNORE_BEATS) {
      ignoreTimers.current.push(setTimeout(() => say(beat.line), at));
      at += beat.ms;
    }
    ignoreTimers.current.push(setTimeout(() => say(IGNORE_FINAL_LINE), at + 100));
    const r = addHeart(stateRef.current, clockNow());
    onState((s) => addHeart(ignoreWorkMessage(s, key, clockNow()), clockNow()).state);
    if (r.leveledUp) ignoreTimers.current.push(setTimeout(() => say(`💖 친밀도 ${r.leveledUp}단계! ${BOND_TITLES[r.leveledUp! - 1]}`), at + 2600));
    ignoreTimers.current.push(setTimeout(() => setFx(null), IGNORE_TOTAL_MS + 2400));
  };

  // 근무 중 어이없는 대화(가짜): 사이다 날리기! → 책상 쾅, 답변이 화면에 꽂히고, 사이다를 마신다
  const [chatFx, setChatFx] = useState<{ stage: 'wind' | 'hit'; stress: number; scene: ChatScene; stamp: string } | null>(null);
  const [shake, setShake] = useState(false);
  const cider = () => {
    const c = pendingChat(stateRef.current, key, clockNow(), { bounds, clockedOut: !!day?.clockedOut, overtime: !!stateRef.current.overtime });
    if (!c || chatFx) return;
    buzz(20);
    setChatFx({ stage: 'wind', stress: cleanStress(), scene: c.scene, stamp: c.stamp });
    setMoment({ id: Date.now(), beats: CIDER_BEATS });
    const later = (ms: number, fn: () => void) => ignoreTimers.current.push(setTimeout(fn, ms));
    let at = 250;
    for (const beat of CIDER_BEATS) {
      later(at, () => say(beat.line));
      at += beat.ms;
    }
    later(SLAM_HIT_MS, () => {
      setChatFx((f) => (f ? { ...f, stage: 'hit' } : f));
      setShake(true);
      buzz([70, 30, 110]);
    });
    later(SLAM_HIT_MS + 650, () => setShake(false));
    later(at + 100, () => say(CIDER_FINAL_LINE));
    // 기록(업적 알림 포함)은 쾅 한 뒤에 남긴다
    const r = addHeart(stateRef.current, clockNow());
    later(SLAM_HIT_MS + 900, () => onState((s) => addHeart(winChat(s, key, clockNow()), clockNow()).state));
    if (r.leveledUp) later(at + 2600, () => say(`💖 친밀도 ${r.leveledUp}단계! ${BOND_TITLES[r.leveledUp! - 1]}`));
    later(CIDER_TOTAL_MS + 3200, () => setChatFx(null));
  };

  // 썰 극장: 퇴근하면 오늘의 썰이 열린다
  const [theater, setTheater] = useState<Story | null>(null);
  const openStory = (st: Story) => {
    setTheater(st);
    onState((s) => markStorySeen(s, key, st.id, clockNow()));
  };

  // 다른 종의 손님이 놀러 왔다: 도감에 기록한다 (인사는 손님이 직접 말풍선으로 해서 따로 말하지 않는다)
  const handleVisit = (sp: Species) => onState((s) => recordVisit(s, sp, clockNow()));
  // 방 안 물건: 시계는 남은 시간을 얄밉게 알려 준다
  const handleTouch = (thing: Thing) => {
    if (thing === 'clock') {
      const phase: ClockPhase = !working || !bounds ? 'off' : now < bounds.start ? 'before' : now >= bounds.end || day?.clockedOut ? 'done' : 'working';
      say(clockLine(phase, bounds ? (bounds.end - now) / 60_000 : 0));
    } else {
      say(thingLine(thing));
    }
    onState((s) => bumpThing(s, thing));
  };
  const askComfort = () => {
    setComfort((n) => n + 1);
    setReaction({ id: Date.now(), action: 'hug' });
  };

  const mi = milestoneIndex(earned);
  const msKey = `hamster-milestone:${key}`;
  const lastMs = useRef<number | null>(null);
  useEffect(() => {
    if (lastMs.current === null) {
      // 앱을 켰을 때 이미 지난 단계는 조용히 넘긴다 ("방금"이 아니므로)
      let saved = -1;
      try {
        saved = Number(sessionStorage.getItem(msKey) ?? -1);
      } catch {
        // 무시
      }
      lastMs.current = Math.max(saved, mi);
    } else if (mi > lastMs.current) {
      const m = MILESTONES[mi];
      say(`${m.emoji} 방금 ${m.text} 벌었어요!`);
      lastMs.current = mi;
    }
    try {
      sessionStorage.setItem(msKey, String(lastMs.current));
    } catch {
      // 무시
    }
  }, [mi, msKey]);

  const rareSeen = useRef(state.rare ?? {});
  rareSeen.current = state.rare ?? {};
  const handleRare = (id: RareId) => {
    const r = RARE_BY_ID[id];
    say(rareSeen.current[id] ? `${r.emoji} ${r.name}!` : `✨ 희귀 행동 발견! ${r.emoji} ${r.name}`);
    onRare(id);
  };
  // 작업물이 막 100%가 된 순간만 한 번 축하
  const prevPct = useRef(pct);
  const [justDone, setJustDone] = useState(false);
  useEffect(() => {
    if (prevPct.current < 100 && pct >= 100) setJustDone(true);
    prevPct.current = pct;
  }, [pct]);

  // 야근
  const stateRef = useRef(state);
  stateRef.current = state;
  const otDate = state.overtime?.date;
  const otActive = !!state.overtime && !!otDate && !!state.days[otDate];
  overtimeRef.current = otActive;
  const otDay = otDate ? state.days[otDate] : undefined;
  const otNow = otActive && otDate ? liveOvertime(state, otDate, now) : null;
  const inclusive = wageTypeOf(settings) === 'inclusive';
  const canOvertime = !otActive && !!day && !!item && !!bounds && now >= bounds.end;
  const workMsg = pendingWorkMessage(state, key, now, { clockedOut: !!day?.clockedOut, overtime: otActive });
  const shownMsg = fx?.msg ?? workMsg;
  const pendChat = pendingChat(state, key, now, { bounds, clockedOut: !!day?.clockedOut, overtime: otActive });
  const shownChat = chatFx ? { scene: chatFx.scene, stamp: chatFx.stamp } : pendChat;
  const otLiveFn = () => (otDate ? (liveOvertime(stateRef.current, otDate, clockNow()) ?? { ms: 0, pay: 0, owed: 0 }) : { ms: 0, pay: 0, owed: 0 });
  useEffect(() => {
    const root = document.documentElement;
    if (otActive) root.setAttribute('data-overtime', '');
    else root.removeAttribute('data-overtime');
    return () => root.removeAttribute('data-overtime');
  }, [otActive]);

  // "어제 몇 시에 퇴근했어요?"
  const [askDismissed, setAskDismissed] = useState<string | null>(null);
  const askKey = settings.askLeftTime !== false && !otActive ? pendingLeftAsk(state, key) : null;
  const askDay = askKey ? state.days[askKey] : undefined;
  const [overlayOpen, setOverlayOpen] = useState(false);
  useEffect(() => {
    setOverlayOpen(!!document.querySelector('.overlay:not(.left-overlay)'));
  });
  const showAsk = !!askKey && !!askDay && askKey !== askDismissed && !sharing && !overlayOpen;
  const askWhen = askKey === addDays(key, -1) ? '어제' : askKey ? formatKoreanDate(askKey).replace(/ ?\(.*\)$/, '') : '';

  // 퇴근이 코앞이면 시간이 두근두근 (30분 전부터 점점 빨라진다)
  const toEnd = bounds ? bounds.end - now : Infinity;
  const BEAT_WINDOW = 30 * 60_000;
  const beat =
    day && bounds && !day.clockedOut && now >= bounds.start && toEnd > 0 && toEnd <= BEAT_WINDOW && !!item
      ? { k: 1 - toEnd / BEAT_WINDOW, dur: 1.5 - 1.1 * (1 - toEnd / BEAT_WINDOW) }
      : null;

  const working = !!day && !!item;
  // 공유 카드 띠: 상황에 맞는 시간 문구
  const timeBand: TimeBand =
    otActive && state.overtime
      ? { kind: 'up', at: state.overtime.startedAt, prefix: '야근', suffix: '째…' }
      : !working || !bounds
        ? { kind: 'text', text: holiday ? `오늘은 ${holiday}, 쉬는 날` : '오늘은 쉬는 날' }
        : now < bounds.end
          ? { kind: 'down', at: bounds.end, prefix: '퇴근까지' }
          : { kind: 'up', at: bounds.end, prefix: '퇴근한 지' };

  let timeInfo = '';
  if (day && bounds) {
    if (otActive) timeInfo = `야근 중 · 퇴근 시각 ${hhmm(now)} 지남`;
    else if (day.clockedOut) timeInfo = day.completed ? '오늘 업무 끝 · 푹 쉬어요' : '퇴근 완료';
    else if (now < bounds.start) timeInfo = `출근까지 ${formatRemaining(bounds.start - now)}`;
    else timeInfo = `퇴근까지 ${formatRemaining(bounds.end - now)}`;
  }

  const phase = quotePhase(now, key, day && !holiday ? day.schedule : null, !!day?.clockedOut);
  phaseRef.current = phase;

  // 공유 카드에 넣는 작은 정보 — 금액은 절대 넣지 않는다
  const career = careerStats(state.days, settings.dayOverrides);
  const shareChips = [
    career.completedDays > 0 ? `출근 ${career.completedDays}일째` : '',
    career.streak >= 3 ? `${career.streak}일 연속` : '',
    payD === 0 ? '오늘은 월급날!' : `월급날 D-${payD}`,
  ].filter(Boolean);
  const shareNameTag = `${settings.hamsterName || '햄스터'} · ${careerTitle(career.completedDays, custom.species)}`;

  // 안드로이드 앱: 위젯이 있다는 걸 한 번 알려 준다 (누르면 사라진다)
  const [widgetHint, setWidgetHint] = useState(() => {
    try {
      return widgetAvailable && !localStorage.getItem('hamster-widget-hint');
    } catch {
      return false;
    }
  });
  const addWidget = async () => {
    try {
      localStorage.setItem('hamster-widget-hint', '1');
    } catch {
      // 무시
    }
    setWidgetHint(false);
    if (!(await pinWidget('wide'))) say('홈 화면 빈 곳을 길게 눌러 위젯을 추가해 보세요!');
  };

  const quoteBlock = (
    <>
      <QuoteCard dateKey={key} off={!working} payday={payD === 0} comfort={comfort} species={custom.species} />
      <div className="chip-row">
        <button type="button" className="chip-btn" onClick={askComfort}>
          힘들어요
        </button>
        <button type="button" className="chip-btn" onClick={() => setSharing(true)}>
          카드 공유
        </button>
        {widgetHint && (
          <button type="button" className="chip-btn" onClick={addWidget}>
            🧩 위젯 달기
          </button>
        )}
        {canOvertime && (
          <button type="button" className="chip-btn overtime" onClick={() => onState((s) => startOvertime(s, key, clockNow()))}>
            🌙 야근하기
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="screen ambient">
      <header className="ambient-head">
        <div className="ambient-date">
          <span className="ambient-date-main">{formatKoreanDate(key)}</span>
          <span className="ambient-date-sub">
            {holiday && <b className="holiday-chip">{holiday}</b>}
            {activeSeason(key) && (
              <b className="holiday-chip season-chip" title="꾸미기에서 한정 아이템을 확인하세요">
                {activeSeason(key)!.event.emoji} {activeSeason(key)!.event.name} 이벤트 · ~{seasonRangeText(activeSeason(key)!.event).split('~')[1]}
              </b>
            )}
            {payD === 0 ? '오늘은 월급날' : `월급날까지 D-${payD}`}
          </span>
        </div>
        {clock && canFullscreen ? (
          <button className="icon-btn quiet" onClick={toggleFullscreen} aria-label="전체 화면">
            ⛶
          </button>
        ) : (
          <button className="icon-btn quiet" onClick={onOpenSettings} aria-label="설정"><TabIcon id="settings" /></button>
        )}
      </header>

      <div className={`ambient-body${shake ? ' shake' : ''}`}>
        <Habitat
          custom={custom}
          mood={mood}
          name={settings.hamsterName}
          now={now}
          fit={clock}
          today={todayItem}
          bubble={bubble}
          payday={payD === 0}
          onRare={handleRare}
          onInteract={handleInteract}
          onTouch={handleTouch}
          bond={bond}
          season={activeSeason(key)?.event.id ?? null}
          onVisit={handleVisit}
          moment={moment}
          reaction={reaction}
          overtimeMin={otNow ? Math.floor(otNow.ms / 60_000) : null}
        />

        {shownMsg && (
          <section
            className={`msg-card ${fx ? 'done' : ''}`}
            style={{ '--bye': `${(IGNORE_TOTAL_MS + 900) / 1000}s` } as React.CSSProperties}
            aria-label="퇴근 후 업무 연락 (가짜)"
          >
            <div className="msg-head">
              <span className="msg-bell" aria-hidden>📱</span>
              <b>퇴근 후 업무 연락</b>
              <small>앱이 만든 가짜예요</small>
            </div>
            <div className="msg-row">
              <span className="msg-from">{shownMsg.sender}</span>
              <span className="msg-time">{hhmm(shownMsg.at)}</span>
            </div>
            <p className="msg-text">{shownMsg.text}</p>
            {fx ? (
              <div className="msg-done" role="status">
                <span className="msg-stamp">읽씹 완료!</span>
                <span className="msg-meta">읽음 ✓✓ · 답장 안 함 · 스트레스 -{fx.stress}% (재미용)</span>
              </div>
            ) : (
              <button type="button" className="msg-btn" onClick={ignoreIt}>
                읽씹하기!
              </button>
            )}
          </section>
        )}

        {storyUnlocked(day) && (() => {
          const st = todaysStory(state, key);
          const fresh = !state.stories?.seen?.[st.id];
          return (
            <button type="button" className={`story-cta ${fresh ? 'fresh' : ''}`} onClick={() => openStory(st)}>
              <span className="story-cta-icon" aria-hidden>🎬</span>
              <span className="story-cta-text">
                <small>퇴근 기념 오늘의 썰{fresh ? ' 도착!' : ''}</small>
                <b>「{st.title}」</b>
              </span>
              {fresh && <span className="story-cta-new">NEW</span>}
            </button>
          );
        })()}
        {theater && (
          <Suspense fallback={null}>
            <Theater story={theater} me={custom} onClose={() => setTheater(null)} />
          </Suspense>
        )}

        {shownChat && (
          <section className={`msg-card chat-card ${chatFx ? 'done' : ''} ${chatFx?.stage === 'hit' ? 'hit' : ''}`} aria-label="근무 중 어이없는 대화 (가짜)">
            <div className="msg-head">
              <span className="msg-bell" aria-hidden>💬</span>
              <b>어이없는 대화</b>
              <small>앱이 만든 가짜예요</small>
            </div>
            <div className="chat-who">{shownChat.scene.who}</div>
            <div className="chat-log">
              {shownChat.scene.lines.map((l, i) => (
                <Fragment key={i}>
                  {i === shownChat.scene.lines.length - 1 && !chatFx && (
                    <span className="chat-dots" style={{ '--i': i } as React.CSSProperties} aria-hidden>
                      <i /><i /><i />
                    </span>
                  )}
                  <p className={l.sys ? 'chat-sys' : `chat-bub ${l.me ? 'me' : 'them'}`} style={{ '--i': i } as React.CSSProperties}>
                    {l.text}
                  </p>
                </Fragment>
              ))}
              {chatFx?.stage === 'hit' && <p className="chat-bub me retort">{shownChat.scene.retort}</p>}
            </div>
            {!chatFx ? (
              <button type="button" className="chat-btn" style={{ '--i': shownChat.scene.lines.length } as React.CSSProperties} onClick={cider}>
                🥤 사이다 날리기!
              </button>
            ) : chatFx.stage === 'wind' ? (
              <div className="chat-wait" role="status">…</div>
            ) : (
              <div className="msg-done" role="status">
                <span className="chat-note">상대방이 입력을 멈췄습니다</span>
                <span className="msg-stamp chat-stamp">{chatFx.stamp}</span>
                <span className="msg-meta">읽음 ✓✓ · 상대는 말이 없음 · 스트레스 -{chatFx.stress}% (재미용)</span>
              </div>
            )}
          </section>
        )}

        <BigClock
          now={now}
          dateText={formatKoreanDate(key)}
          info={timeInfo || undefined}
          beat={beat}
          countdown={
            day && bounds && !day.clockedOut && now < bounds.end
              ? now < bounds.start
                ? { label: '출근까지', target: bounds.start }
                : { label: '퇴근까지', target: bounds.end }
              : undefined
          }
        />

        {!day || !item ? (
          <>
            {/* 월급은 쉬는 날에도 흘러간다 (재미용 숫자 · 기록에는 더하지 않음) */}
            <div className="hero-money rest">
              <div className="hero-money-label">누워서 번 돈</div>
              <div className="hero-money-value" aria-live="off">
                <MoneyTicker
                  fixed={restEarnedAt(settings, key, now)}
                  fn={() => restEarnedAt(settings, key, clockNow())}
                  depKey={`rest|${key}|${restDailyPay(settings, key)}`}
                  label="누워서 번 돈"
                />
              </div>
              <div className="hero-money-sub">월급은 쉬는 날에도 흘러가요 · 하루치 {formatWon(Math.floor(restDailyPay(settings, key)))}</div>
            </div>
            <p className="rest-note">
              {holiday?.includes('추석')
                ? speciesWord('🎑 즐거운 추석! 햄스터도 송편 먹으며 쉬는 중.', custom.species)
                : holiday?.includes('설날')
                  ? speciesWord('🧧 새해 복 많이 받으세요! 햄스터도 떡국 먹으며 쉬는 중.', custom.species)
                  : holiday
                    ? speciesWord(`오늘은 ${holiday}, 쉬는 날! 햄스터도 맘껏 노는 중.`, custom.species)
                    : speciesWord('오늘은 쉬는 날! 햄스터도 맘껏 노는 중.', custom.species)}
            </p>
          </>
        ) : otActive && otNow ? (
          <>
            <div className="ot-panel">
              <div className="ot-title">🧟 야근 중… 영혼은 이미 퇴근했어요</div>
              <OvertimeClock getMs={() => otLiveFn().ms} />
              {inclusive ? (
                <>
                  <div className="ot-frozen">오늘 번 돈 {formatWon(Math.floor(otDay?.earned ?? 0))} (더 안 올라요…)</div>
                  <div className="ot-owed-label">벌었어야 할 돈</div>
                  <div className="ot-owed" aria-live="off">
                    <MoneyTicker fixed={0} fn={() => otLiveFn().owed} depKey={`owed|${otDate}`} label="벌었어야 할 돈" />
                  </div>
                  <p className="ot-note">포괄임금제라 이 돈은 안 들어와요 · 시급×1.5 참고용 계산</p>
                </>
              ) : (
                <>
                  <div className="ot-owed-label">야근수당 (시급×1.5)</div>
                  <div className="ot-owed pay" aria-live="off">
                    <MoneyTicker fixed={0} fn={() => otLiveFn().pay} depKey={`pay|${otDate}`} label="야근수당" />
                  </div>
                  <p className="ot-note">오늘 번 돈 {formatWon(Math.floor(otDay?.earned ?? 0))} 에 더해져요 · 참고용 계산</p>
                </>
              )}
            </div>
            <div className="quote-card" role="note">
              <span className="quote-label">야근 한마디</span>
              <span className="quote-text">{speciesWord(pickOvertimeQuote(otDate ?? key), custom.species)}</span>
            </div>
            <button type="button" className="btn homeward big-btn" onClick={() => onState((s) => endOvertime(s, clockNow()))}>
              🏃 진짜 퇴근하기
            </button>
            <div className="chip-row">
              <button type="button" className="chip-btn" onClick={() => setSharing(true)}>
                카드 공유
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="hero-money">
              <div className="hero-money-label">오늘 번 돈</div>
              <div className="hero-money-value" aria-live="off">
                <MoneyTicker fixed={earned} fn={day.clockedOut ? undefined : () => earnedAt(key, day.schedule, day.hourly, clockNow())} depKey={`${key}|${day.hourly}|${day.schedule.workStart}|${day.schedule.workEnd}|${day.schedule.lunchStart}|${day.schedule.lunchEnd}`} />
              </div>
              <div className="hero-money-sub">
                {settings.payMode === 'annual' ? (settings.showGross ? '세전 ' : '세후 ') : ''}시급 {formatWon(Math.round(day.hourly))} 기준
              </div>
            </div>

            <div className={`task-row ${pct >= 100 ? 'done' : ''}`} title={`시즌 ${day.season} · Day ${day.workItemIndex + 1}/20`}>
              <span className={`task-emoji ${justDone ? 'pop' : ''}`} aria-hidden onAnimationEnd={() => setJustDone(false)}>
                <ItemIcon item={item} />
              </span>
              <div className="task-body">
                <div className="task-name">{item.name}</div>
                <div className="task-bar">
                  <div className="task-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="task-pct">{pct}%</span>
            </div>

            {quoteBlock}
          </>
        )}
        {(!day || !item) && quoteBlock}
      </div>

      {showAsk && askKey && askDay && (
        <LeftSheet
          when={askWhen}
          workEnd={askDay.schedule.workEnd}
          onPick={(left) => onState((s) => recordLeft(s, askKey, left))}
          onLater={() => setAskDismissed(askKey)}
        />
      )}

      {sharing && (
        <ShareSheet
          custom={custom}
          dateKey={key}
          dateText={formatKoreanDate(key)}
          off={!working}
          payday={payD === 0}
          nameTag={shareNameTag}
          chips={shareChips}
          defaultTired={otActive}
          timeBand={timeBand}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
