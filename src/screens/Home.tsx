import { useEffect, useRef, useState } from 'react';
import { Habitat } from '../components/habitat/Habitat';
import { dateKey, formatKoreanDate, formatRemaining } from '../domain/date';
import { completedCount, daysUntilPayday } from '../domain/engine';
import { holidayName } from '../domain/holidays';
import { MILESTONES, milestoneIndex } from '../domain/milestones';
import { RARE_BY_ID, type RareId } from '../domain/rare';
import { careerStats, completedInSeason, formatWon, itemOf } from '../domain/records';
import { careerTitle, REACTION_LINES, speciesWord } from '../domain/customization';
import { itemAt, SEASON_LENGTH } from '../domain/workItems';
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

  // 이번 시즌에 완성한 작업물 → 햄스터 방 선반
  const season = Math.floor(completedCount(state.days) / SEASON_LENGTH) + 1;
  const trophies = [...completedInSeason(state.days, season)]
    .sort((a, b) => a - b)
    .map((i) => ({ ...itemAt(season, i), index: i, fresh: !!day?.completed && day.season === season && day.workItemIndex === i }));

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
  const handleInteract = (kind: 'pet' | 'feed' | 'hug') => {
    const lines = REACTION_LINES[custom.species ?? 'hamster'];
    say(pick(lines[kind]));
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

      <div className="ambient-body">
        <Habitat
          custom={custom}
          mood={mood}
          name={settings.hamsterName}
          now={now}
          fit={clock}
          trophies={trophies}
          bubble={bubble}
          payday={payD === 0}
          onRare={handleRare}
          onInteract={handleInteract}
          reaction={reaction}
          overtimeMin={otNow ? Math.floor(otNow.ms / 60_000) : null}
        />

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
          <p className="rest-note">
            {holiday?.includes('추석')
              ? speciesWord('🎑 즐거운 추석! 햄스터도 송편 먹으며 쉬는 중.', custom.species)
              : holiday?.includes('설날')
                ? speciesWord('🧧 새해 복 많이 받으세요! 햄스터도 떡국 먹으며 쉬는 중.', custom.species)
                : holiday
                  ? speciesWord(`오늘은 ${holiday}, 쉬는 날이에요. 햄스터도 늦잠 자는 중.`, custom.species)
                  : speciesWord('오늘은 쉬는 날이에요. 햄스터도 해바라기씨 먹으며 쉬는 중.', custom.species)}
          </p>
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
