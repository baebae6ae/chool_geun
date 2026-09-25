import { useEffect, useRef, useState } from 'react';
import { Habitat } from '../components/habitat/Habitat';
import { dateKey, formatClock, formatKoreanDate, formatRemaining } from '../domain/date';
import { daysUntilPayday } from '../domain/engine';
import { formatWon, itemOf } from '../domain/records';
import { dayBounds, earnedAt, hamsterMood, progressAt } from '../domain/schedule';
import type { AppState, Settings } from '../domain/types';

interface Props {
  state: AppState & { settings: Settings };
  now: number;
  onClockOut: () => void;
  onOpenSettings: () => void;
  onOpenRecord: () => void;
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
export function Home({ state, now, onClockOut, onOpenSettings, onOpenRecord, clock = false }: Props) {
  const { settings, custom } = state;
  const key = dateKey(now);
  const day = state.days[key];
  const [confirming, setConfirming] = useState(false);
  const payD = daysUntilPayday(key, settings.payday);

  const mood = day ? hamsterMood(key, day.schedule, now, day.clockedOut) : 'holiday';
  const progress = day ? (day.clockedOut ? day.progress : progressAt(key, day.schedule, now)) : 0;
  const earned = day ? (day.clockedOut ? day.earned : earnedAt(key, day.schedule, day.hourly, now)) : 0;
  const bounds = day ? dayBounds(key, day.schedule) : null;
  const item = day ? itemOf(day) : null;
  const pct = Math.floor(progress * 100);
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
          <span className="ambient-date-sub">{payD === 0 ? '오늘은 월급날' : `월급날까지 D-${payD}`}</span>
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
        <Habitat custom={custom} mood={mood} name={settings.hamsterName} now={now} fit={clock} />

        {!day || !item ? (
          <p className="rest-note">오늘은 쉬는 날이에요. 햄스터도 해바라기씨 먹으며 쉬는 중.</p>
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
