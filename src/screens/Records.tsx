import { useState } from 'react';
import { DailyRecordCard } from '../components/Modals';
import { OfficeRoom } from '../components/OfficeRoom';
import { addDays, dateKey, formatDotDate, mondayOf, MONTH_EN, WEEKDAY_KO, weekday } from '../domain/date';
import { formatWon, itemOf, monthSummary, weekSlots } from '../domain/records';
import { dayBounds } from '../domain/schedule';
import type { AppState, DailyWork } from '../domain/types';

/** 출근한 날: 퇴근했거나, 출근시간이 지난 오늘 */
const worked = (d: DailyWork | undefined, now: number) => !!d && (d.clockedOut || now >= dayBounds(d.date, d.schedule).start);

/** 이번 주 출근 도장 — 빠진 날은 그냥 비어 있을 뿐, 벌칙 없음 */
function StampWeek({ state, now }: { state: AppState; now: number }) {
  const today = dateKey(now);
  const slots = weekSlots(today, state.days, state.settings?.weekendWork ?? false);
  const count = slots.filter((x) => worked(x.day, now)).length;
  return (
    <section className="card stamp-week">
      <div className="card-label">이번 주 출근 도장 · {count}개</div>
      <div className="stamp-row">
        {slots.map(({ date, day }) => (
          <div key={date} className={`stamp-cell ${date === today ? 'today' : ''} ${date > today ? 'future' : ''}`}>
            <span className="stamp-day">{WEEKDAY_KO[weekday(date)]}</span>
            <span className={`stamp ${worked(day, now) ? 'on' : ''}`}>{worked(day, now) ? '🐾' : ''}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** 월간 출근 도장 달력 */
function StampCalendar({ y, m, state, now }: { y: number; m: number; state: AppState; now: number }) {
  const first = `${y}-${String(m).padStart(2, '0')}-01`;
  const start = mondayOf(first);
  const last = new Date(y, m, 0).getDate();
  const cells: string[] = [];
  for (let d = start; ; d = addDays(d, 1)) {
    cells.push(d);
    if (cells.length % 7 === 0 && (d >= addDays(first, last - 1) || cells.length >= 42)) break;
  }
  const today = dateKey(now);
  return (
    <div className="stamp-cal">
      {['월', '화', '수', '목', '금', '토', '일'].map((w) => (
        <span key={w} className="stamp-cal-head">{w}</span>
      ))}
      {cells.map((d) => {
        const inMonth = d.slice(0, 7) === first.slice(0, 7);
        const day = state.days[d];
        const on = inMonth && worked(day, now);
        return (
          <span key={d} className={`stamp-cal-cell ${inMonth ? '' : 'out'} ${d === today ? 'today' : ''}`}>
            <small>{Number(d.slice(8))}</small>
            {on && <span className="stamp on">🐾</span>}
            {on && day?.completed && <i title={itemOf(day).name}>{itemOf(day).emoji}</i>}
          </span>
        );
      })}
    </div>
  );
}

/** 기획서 11, 13. 일일 기록 + 월간 요약 */
export function Records({ state, now, focusDate }: { state: AppState; now: number; focusDate?: string }) {
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const d = new Date(now);
  const [ym, setYm] = useState({ y: d.getFullYear(), m: d.getMonth() + 1 });
  const [selected, setSelected] = useState<string | undefined>(focusDate);

  const records = Object.values(state.days)
    .filter((x) => x.clockedOut)
    .sort((a, b) => b.date.localeCompare(a.date));
  const current = records.find((r) => r.date === selected) ?? records[0];

  const summary = monthSummary(ym.y, ym.m, state.days);
  const monthEnd = `${ym.y}-${String(ym.m).padStart(2, '0')}-31`;
  const lastSeason = summary.days.at(-1)?.season;
  const officeDone = new Set(
    Object.values(state.days)
      .filter((x) => x.completed && x.season === lastSeason && x.date <= monthEnd)
      .map((x) => x.workItemIndex),
  );
  const shiftMonth = (delta: number) =>
    setYm(({ y, m }) => {
      const t = new Date(y, m - 1 + delta, 1);
      return { y: t.getFullYear(), m: t.getMonth() + 1 };
    });

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>📒 기록</h1>
      </header>
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>일일</button>
        <button role="tab" aria-selected={tab === 'monthly'} className={tab === 'monthly' ? 'on' : ''} onClick={() => setTab('monthly')}>월간</button>
      </div>

      {tab === 'daily' && <StampWeek state={state} now={now} />}
      {tab === 'daily' &&
        (records.length === 0 ? (
          <div className="card center">
            <p className="big">📭</p>
            <p className="muted">첫 퇴근을 하면 오늘의 기록이 자동으로 저장돼요.</p>
          </div>
        ) : (
          <>
            {current && <DailyRecordCard day={current} hamsterName={state.settings?.hamsterName ?? ''} />}
            <ul className="record-list">
              {records.map((r) => (
                <li key={r.date}>
                  <button className={r.date === current?.date ? 'on' : ''} onClick={() => setSelected(r.date)}>
                    <span>{formatDotDate(r.date)} ({WEEKDAY_KO[weekday(r.date)]})</span>
                    <span>{r.completed ? itemOf(r).emoji : '⏸️'} {Math.floor(r.progress * 100)}%</span>
                    <span className="muted">{formatWon(Math.floor(r.earned))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ))}

      {tab === 'monthly' && (
        <>
          <div className="month-nav">
            <button className="icon-btn" onClick={() => shiftMonth(-1)} aria-label="이전 달">‹</button>
            <span>{ym.y}년 {ym.m}월</span>
            <button className="icon-btn" onClick={() => shiftMonth(1)} aria-label="다음 달">›</button>
          </div>
          <section className="card month">
            <div className="month-title">🐹 {MONTH_EN[ym.m - 1]}</div>
            <dl className="record-grid">
              <dt>근무일</dt>
              <dd>{summary.workDays}일</dd>
              <dt>근무시간</dt>
              <dd>{Math.round(summary.workedMs / 3_600_000)}시간</dd>
              <dt>완성한 작업</dt>
              <dd>{summary.completed}개</dd>
              <dt>가챠 획득</dt>
              <dd>{summary.gacha}개</dd>
              <dt>총 노동수익</dt>
              <dd>{formatWon(Math.floor(summary.earned))}</dd>
            </dl>
            <StampCalendar y={ym.y} m={ym.m} state={state} now={now} />
          </section>
          {lastSeason && <OfficeRoom done={officeDone} small />}
        </>
      )}
    </div>
  );
}
