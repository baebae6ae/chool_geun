import { useState } from 'react';
import { Hamster } from '../components/Hamster';
import { ProgressBar, WorkBuild } from '../components/WorkBuild';
import { dateKey, formatClock, formatKoreanDate, formatRemaining, WEEKDAY_EN, weekday } from '../domain/date';
import { daysUntilPayday } from '../domain/engine';
import { GACHA_BY_ID } from '../domain/gacha';
import { formatWon, isWeekComplete, itemOf, weekSlots } from '../domain/records';
import { dayBounds, earnedAt, hamsterMood, MOOD_LABEL, progressAt } from '../domain/schedule';
import { SEASON_LENGTH, SEASON_TITLE } from '../domain/workItems';
import type { AppState, Settings } from '../domain/types';

interface Props {
  state: AppState & { settings: Settings };
  now: number;
  onClockOut: () => void;
  onOpenSettings: () => void;
  onOpenRecord: () => void;
}

export function Home({ state, now, onClockOut, onOpenSettings, onOpenRecord }: Props) {
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
  const slots = weekSlots(key, state.days, settings.weekendWork);

  let timeInfo = '';
  if (day && bounds) {
    if (day.clockedOut) timeInfo = day.completed ? '오늘 업무 끝! 푹 쉬어요' : '퇴근 완료';
    else if (now < bounds.start) timeInfo = `출근까지 ${formatRemaining(bounds.start - now)}`;
    else timeInfo = `퇴근까지 ${formatRemaining(bounds.end - now)}`;
  }

  return (
    <div className="screen home">
      <header className="home-head">
        <div>
          <div className="home-date">{formatKoreanDate(key)}</div>
          <div className="home-sub">
            {payD === 0 ? '💸 오늘은 월급날!' : `💸 월급날까지 D-${payD}`}
          </div>
        </div>
        <button className="icon-btn" onClick={onOpenSettings} aria-label="설정">⚙️</button>
      </header>

      <section className={`stage-card mood-bg-${mood}`}>
        {mood === 'oneMore' && <div className="speech">조금만 더...</div>}
        <Hamster custom={custom} mood={mood} />
        <div className="status-pill">
          {settings.hamsterName || '햄스터'} · {MOOD_LABEL[mood]}
        </div>
      </section>

      {!day || !item ? (
        <section className="card center">
          <p className="big">🛌 오늘은 쉬는 날</p>
          <p className="muted">햄스터도 해바라기씨 먹으며 쉬는 중이에요.</p>
        </section>
      ) : (
        <>
          <section className="card work">
            <div className="card-label">
              오늘의 작업 <span className="muted">· 시즌 {day.season} {SEASON_TITLE} Day {day.workItemIndex + 1}/{SEASON_LENGTH}</span>
            </div>
            <div className="work-name">
              {item.emoji} {item.name}
            </div>
            <WorkBuild item={item} progress={progress} />
            <ProgressBar value={progress} label="오늘의 작업 진행률" />
          </section>

          <section className="card money">
            <div className="card-label">💰 오늘 번 돈</div>
            <div className="money-value" aria-live="off">
              {formatWon(earned, 2)}
            </div>
            <div className="muted small">시급 {formatWon(Math.round(day.hourly))} 기준</div>
          </section>

          <section className="card clock">
            <div className="clock-now">{formatClock(now, true)}</div>
            <div className="clock-left">{timeInfo}</div>
            {day.gacha.some((g) => g.obtained) && (
              <div className="today-gacha">
                오늘의 가챠{' '}
                {day.gacha.filter((g) => g.obtained).map((g, i) => (
                  <span key={i} title={GACHA_BY_ID[g.eventId]?.name}>{GACHA_BY_ID[g.eventId]?.emoji}</span>
                ))}
              </div>
            )}
          </section>

          {day.clockedOut ? (
            <button className="btn primary big-btn" onClick={onOpenRecord}>📒 오늘의 기록 보기</button>
          ) : (
            <button
              className="btn primary big-btn"
              onClick={() => (progress >= 1 ? onClockOut() : setConfirming(true))}
            >
              퇴근하기
            </button>
          )}
        </>
      )}

      <section className="card week">
        <div className="card-label">이번 주</div>
        <div className="week-row">
          {slots.map((s) => (
            <div key={s.date} className={`week-slot ${s.date === key ? 'today' : ''}`}>
              <span className="week-day">{WEEKDAY_EN[weekday(s.date)]}</span>
              <span className="week-emoji">
                {s.day?.completed ? itemOf(s.day).emoji : s.day ? (s.day.clockedOut ? '⏸️' : '🔨') : '·'}
              </span>
            </div>
          ))}
        </div>
        {isWeekComplete(slots) && <div className="week-done">🏢 이번 주 사무실 완성!</div>}
      </section>

      {confirming && bounds && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="sheet">
            <h3>벌써 퇴근할까요?</h3>
            <p>
              작업이 아직 {Math.floor(progress * 100)}%예요. 지금 퇴근하면 <b>{item?.name}</b>은 미완성으로 저장되고 내일
              이어서 만들어요.
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
