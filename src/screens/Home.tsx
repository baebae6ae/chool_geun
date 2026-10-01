import { useEffect, useRef, useState } from 'react';
import { Habitat } from '../components/habitat/Habitat';
import { dateKey, formatKoreanDate, formatRemaining } from '../domain/date';
import { completedCount, daysUntilPayday } from '../domain/engine';
import { holidayName } from '../domain/holidays';
import { MILESTONES, milestoneIndex } from '../domain/milestones';
import { RARE_BY_ID, type RareId } from '../domain/rare';
import { careerStats, completedInSeason, formatWon, itemOf } from '../domain/records';
import { careerTitle } from '../domain/customization';
import { itemAt, SEASON_LENGTH } from '../domain/workItems';
import { dayBounds, earnedAt, hamsterMood, progressAt } from '../domain/schedule';
import type { AppState, Schedule, Settings } from '../domain/types';
import { now as clockNow } from '../store';
import { ItemIcon } from '../components/ItemIcon';
import { TabIcon } from '../components/TabIcon';
import { BigClock, QuoteCard } from '../components/AmbientExtras';
import { pickTimeBubble, quotePhase } from '../domain/quotes';
import { ShareSheet } from '../components/ShareSheet';

interface Props {
  state: AppState & { settings: Settings };
  now: number;
  onOpenSettings: () => void;
  /** 희귀 행동 목격 (처음이면 도감에 등록) */
  onRare: (id: RareId) => void;
  /** 가로로 눕힌 탁상시계 화면 */
  clock?: boolean;
}

/**
 * 번 돈을 시계의 1/100초처럼 촤라락 굴린다. requestAnimationFrame마다 지금 시각으로 다시 계산해
 * 글자만 바꾸므로(React 재렌더링 없음) 가볍다. 숫자 칸 너비를 고정해 흔들리지 않는다.
 * live가 없으면(퇴근 후·쉬는 날) 고정된 값을 보여준다. '동작 줄이기' 설정이면 1초에 한 번만 갱신.
 */
function MoneyTicker({ fixed, live }: { fixed: number; live?: { key: string; schedule: Schedule; hourly: number } }) {
  const box = useRef<HTMLSpanElement>(null);
  const sr = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let prev = '';
    const paint = () => {
      const v = live ? earnedAt(live.key, live.schedule, live.hourly, clockNow()) : fixed;
      const str = formatWon(v, 2);
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
    if (live) {
      if (reduce) timer = setInterval(paint, 1000);
      else {
        const loop = () => {
          paint();
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      }
    }
    // 화면 낭독기용: 원 단위로만 1초에 한 번
    const speak = () => {
      if (!sr.current) return;
      const v = live ? earnedAt(live.key, live.schedule, live.hourly, clockNow()) : fixed;
      sr.current.textContent = `오늘 번 돈 ${Math.floor(v).toLocaleString('ko-KR')}원`;
    };
    speak();
    const srTimer = setInterval(speak, 5000);
    return () => {
      cancelAnimationFrame(raf);
      if (timer) clearInterval(timer);
      clearInterval(srTimer);
    };
  }, [fixed, live?.key, live?.hourly, live?.schedule.workStart, live?.schedule.workEnd, live?.schedule.lunchStart, live?.schedule.lunchEnd]);

  return (
    <>
      <span ref={box} aria-hidden className="money-live" />
      <span ref={sr} className="sr-only" />
    </>
  );
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
export function Home({ state, now, onOpenSettings, onRare, clock = false }: Props) {
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
  const say = (text: string) => setBubble({ key: `${Date.now()}`, text });

  // 시간대에 맞는 혼잣말: 시간대가 바뀐 뒤 잠시 지나서, 그리고 가끔 한 번씩 말풍선으로
  const phaseRef = useRef(quotePhase(now, key, day && !holiday ? day.schedule : null, !!day?.clockedOut));
  const bubbleN = useRef(0);
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (Math.random() < 0.35) say(pickTimeBubble(phaseRef.current, bubbleN.current++ + Math.floor(Date.now() / 600000)));
    }, 70_000);
    return () => clearInterval(id);
  }, []);

  // 햄스터와 놀기
  const [comfort, setComfort] = useState(0);
  const [reaction, setReaction] = useState<{ id: number; action: 'hug' } | null>(null);
  const [sharing, setSharing] = useState(false);
  const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];
  const handleInteract = (kind: 'pet' | 'feed' | 'hug') => {
    if (kind === 'feed') say(pick(['냠냠! 해바라기씨 최고예요', '볼주머니에 쏙 넣어둘게요', '바삭바삭… 고마워요!', '더 주세요… 는 농담이에요']));
    else if (kind === 'hug') say('꼬옥 안아줄게요 🤍');
    else say(pick(['헤헤, 간지러워요', '더 쓰다듬어 주세요', '오늘도 고생했어요', '손이 따뜻해요', '찍찍!']));
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

  let timeInfo = '';
  if (day && bounds) {
    if (day.clockedOut) timeInfo = day.completed ? '오늘 업무 끝 · 푹 쉬어요' : '퇴근 완료';
    else if (now < bounds.start) timeInfo = `출근까지 ${formatRemaining(bounds.start - now)}`;
    else timeInfo = `퇴근까지 ${formatRemaining(bounds.end - now)}`;
  }

  const phase = quotePhase(now, key, day && !holiday ? day.schedule : null, !!day?.clockedOut);
  phaseRef.current = phase;

  const working = !!day && !!item;
  // 공유 카드에 넣는 작은 정보 — 금액은 절대 넣지 않는다
  const career = careerStats(state.days, settings.dayOverrides);
  const shareChips = [
    career.completedDays > 0 ? `출근 ${career.completedDays}일째` : '',
    career.streak >= 3 ? `${career.streak}일 연속` : '',
    payD === 0 ? '오늘은 월급날!' : `월급날 D-${payD}`,
  ].filter(Boolean);
  const shareNameTag = `${settings.hamsterName || '햄스터'} · ${careerTitle(career.completedDays)}`;

  const quoteBlock = (
    <>
      <QuoteCard dateKey={key} off={!working} payday={payD === 0} comfort={comfort} />
      <div className="chip-row">
        <button type="button" className="chip-btn" onClick={askComfort}>
          힘들어요
        </button>
        <button type="button" className="chip-btn" onClick={() => setSharing(true)}>
          카드 공유
        </button>
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
        />

        <BigClock
          now={now}
          dateText={formatKoreanDate(key)}
          info={timeInfo || undefined}
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
              ? '🎑 즐거운 추석! 햄스터도 송편 먹으며 쉬는 중.'
              : holiday?.includes('설날')
                ? '🧧 새해 복 많이 받으세요! 햄스터도 떡국 먹으며 쉬는 중.'
                : holiday
                  ? `오늘은 ${holiday}, 쉬는 날이에요. 햄스터도 늦잠 자는 중.`
                  : '오늘은 쉬는 날이에요. 햄스터도 해바라기씨 먹으며 쉬는 중.'}
          </p>
        ) : (
          <>
            <div className="hero-money">
              <div className="hero-money-label">오늘 번 돈</div>
              <div className="hero-money-value" aria-live="off">
                <MoneyTicker fixed={earned} live={day.clockedOut ? undefined : { key, schedule: day.schedule, hourly: day.hourly }} />
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

      {sharing && (
        <ShareSheet
          custom={custom}
          dateKey={key}
          dateText={formatKoreanDate(key)}
          off={!working}
          payday={payD === 0}
          nameTag={shareNameTag}
          chips={shareChips}
          onClose={() => setSharing(false)}
        />
      )}
    </div>
  );
}
