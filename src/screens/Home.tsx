import { useEffect, useRef, useState } from 'react';
import { Habitat } from '../components/habitat/Habitat';
import { dateKey, formatClock, formatKoreanDate, formatRemaining } from '../domain/date';
import { completedCount, daysUntilPayday } from '../domain/engine';
import { holidayName } from '../domain/holidays';
import { MILESTONES, milestoneIndex } from '../domain/milestones';
import { RARE_BY_ID, type RareId } from '../domain/rare';
import { completedInSeason, formatWon, itemOf } from '../domain/records';
import { SEASON_LENGTH, WORK_ITEMS } from '../domain/workItems';
import { dayBounds, earnedAt, hamsterMood, progressAt } from '../domain/schedule';
import type { AppState, Settings } from '../domain/types';

interface Props {
  state: AppState & { settings: Settings };
  now: number;
  onClockOut: () => void;
  onOpenSettings: () => void;
  onOpenRecord: () => void;
  /** 희귀 행동 목격 (처음이면 도감에 등록) */
  onRare: (id: RareId) => void;
  /** 가로로 눕힌 탁상시계 화면 */
  clock?: boolean;
}

/** 바뀐 자릿수만 살짝 밝아지며 들어온다 — 돈이 '방금' 쌓였다는 걸 조용히 알려줌 */
function MoneyTicker({ value }: { value: string }) {
  const last = useRef({ value, keep: value.length });
  if (last.current.value !== value) {
    const p = last.current.value;
    let i = 0;
    while (i < p.length && i < value.length && p[i] === value[i]) i++;
    last.current = { value, keep: i };
  }
  const keep = last.current.keep;
  return (
    <>
      {value.slice(0, keep)}
      <span key={value} className="money-tick">
        {value.slice(keep)}
      </span>
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
export function Home({ state, now, onClockOut, onOpenSettings, onOpenRecord, onRare, clock = false }: Props) {
  const { settings, custom } = state;
  const key = dateKey(now);
  const day = state.days[key];
  const [confirming, setConfirming] = useState(false);
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
    .map((i) => ({ ...WORK_ITEMS[i], fresh: !!day?.completed && day.season === season && day.workItemIndex === i }));

  // 햄스터 말풍선: 번 돈 환산, 희귀 행동
  const [bubble, setBubble] = useState<{ key: string; text: string } | null>(null);
  const say = (text: string) => setBubble({ key: `${Date.now()}`, text });

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
          <button className="icon-btn quiet" onClick={onOpenSettings} aria-label="설정">⚙️</button>
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
                <MoneyTicker value={formatWon(earned, 2)} />
              </div>
              <div className="hero-money-sub">
                {settings.payMode === 'annual' ? (settings.showGross ? '세전 ' : '세후 ') : ''}시급 {formatWon(Math.round(day.hourly))} 기준
              </div>
            </div>

            <div className={`task-row ${pct >= 100 ? 'done' : ''}`} title={`시즌 ${day.season} · Day ${day.workItemIndex + 1}/20`}>
              <span className={`task-emoji ${justDone ? 'pop' : ''}`} aria-hidden onAnimationEnd={() => setJustDone(false)}>
                {item.emoji}
              </span>
              <div className="task-body">
                <div className="task-name">{item.name}</div>
                <div className="task-bar">
                  <div className="task-bar-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              <span className="task-pct">{pct}%</span>
            </div>

            <div className="time-row">
              <span className="time-now">{formatClock(now, true)}</span>
              <span className="time-left">{timeInfo}</span>
            </div>

            {day.clockedOut ? (
              <button className="btn ambient-btn" onClick={onOpenRecord}>
                오늘의 기록 보기
              </button>
            ) : (
              <button className="btn ambient-btn" onClick={() => (progress >= 1 ? onClockOut() : setConfirming(true))}>
                퇴근하기
              </button>
            )}
          </>
        )}
      </div>

      {confirming && bounds && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="sheet">
            <h3>벌써 퇴근할까요?</h3>
            <p>
              작업이 아직 {pct}%예요. 지금 퇴근하면 <b>{item?.name}</b>은 미완성으로 저장되고 내일 이어서 만들어요.
            </p>
            <button
              className="btn primary"
              onClick={() => {
                setConfirming(false);
                onClockOut();
              }}
            >
              네, 퇴근할래요
            </button>
            <button className="btn ghost" onClick={() => setConfirming(false)}>
              조금 더 일할게요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
