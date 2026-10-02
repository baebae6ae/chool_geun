import { useState } from 'react';
import { DailyRecordCard } from '../components/Modals';
import { OfficeRoom } from '../components/OfficeRoom';
import { addDays, dateKey, formatDotDate, formatKoreanDate, mondayOf, MONTH_EN, WEEKDAY_KO, weekday } from '../domain/date';
import { careerStats, formatWon, itemOf, monthSummary, weekSlots } from '../domain/records';
import { careerTitle, nextUnlock } from '../domain/customization';
import { overtimeTotals } from '../domain/overtime';
import { LeftSheet } from '../components/LeftSheet';
import { playerProgress } from '../domain/engine';
import { holidayName } from '../domain/holidays';
import { dayBounds, isWorkday } from '../domain/schedule';
import type { AppState, DailyWork, Settings } from '../domain/types';
import { ItemIcon } from '../components/ItemIcon';
import { TabIcon } from '../components/TabIcon';

type Override = 'off' | 'on' | null;

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
            {(() => {
              const off = !worked(day, now) && !!state.settings && !isWorkday(date, state.settings);
              return (
                <span className={`stamp ${worked(day, now) ? 'on' : off ? 'off' : ''}`} title={holidayName(date)}>
                  {worked(day, now) ? '🐾' : off ? '휴' : ''}
                </span>
              );
            })()}
          </div>
        ))}
      </div>
    </section>
  );
}

/** 월간 출근 도장 달력 */
function StampCalendar({
  y,
  m,
  state,
  now,
  onPick,
}: {
  y: number;
  m: number;
  state: AppState;
  now: number;
  onPick?: (date: string) => void;
}) {
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
        const ov = state.settings?.dayOverrides?.[d];
        return (
          <button
            type="button"
            key={d}
            disabled={!inMonth || d < today || !onPick}
            onClick={() => onPick?.(d)}
            className={`stamp-cal-cell ${inMonth ? '' : 'out'} ${d === today ? 'today' : ''} ${
              holidayName(d) || weekday(d) === 0 ? 'red' : weekday(d) === 6 ? 'blue' : ''
            }`}
            title={holidayName(d)}
          >
            <small>{Number(d.slice(8))}</small>
            {on && <span className="stamp on">🐾</span>}
            {on && day?.completed && <i title={itemOf(day).name}><ItemIcon item={itemOf(day)} /></i>}
            {inMonth && !on && ov && <em className={`ov ${ov}`}>{ov === 'off' ? '쉼' : '출근'}</em>}
          </button>
        );
      })}
    </div>
  );
}

/** 기획서 11, 13. 일일 기록 + 월간 요약 */
export function Records({
  state,
  now,
  focusDate,
  onDayOverride,
  onLeft,
}: {
  state: AppState;
  now: number;
  focusDate?: string;
  onDayOverride?: (date: string, v: Override) => void;
  /** 퇴근 시각 기록·수정 (null이면 정시 퇴근) */
  onLeft?: (date: string, left: string | null) => void;
}) {
  const [editLeft, setEditLeft] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [tab, setTab] = useState<'daily' | 'monthly'>('daily');
  const d = new Date(now);
  const [ym, setYm] = useState({ y: d.getFullYear(), m: d.getMonth() + 1 });
  const [selected, setSelected] = useState<string | undefined>(focusDate);

  const records = Object.values(state.days)
    .filter((x) => x.clockedOut)
    .sort((a, b) => b.date.localeCompare(a.date));
  const current = records.find((r) => r.date === selected) ?? records[0];

  const summary = monthSummary(ym.y, ym.m, state.days);
  const monthOt = overtimeTotals(state.days, `${ym.y}-${String(ym.m).padStart(2, '0')}`);
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
        <h1><TabIcon id="records" /> 기록</h1>
      </header>
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={tab === 'daily'} className={tab === 'daily' ? 'on' : ''} onClick={() => setTab('daily')}>일일</button>
        <button role="tab" aria-selected={tab === 'monthly'} className={tab === 'monthly' ? 'on' : ''} onClick={() => setTab('monthly')}>월간</button>
      </div>

      <CareerCard state={state} />
      {tab === 'daily' && <StampWeek state={state} now={now} />}
      {tab === 'daily' &&
        (records.length === 0 ? (
          <div className="card center">
            <p className="big">📭</p>
            <p className="muted">첫 퇴근을 하면 오늘의 기록이 자동으로 저장돼요.</p>
          </div>
        ) : (
          <>
            {current && <DailyRecordCard day={current} hamsterName={state.settings?.hamsterName ?? ''} onEditLeft={onLeft ? () => setEditLeft(current.date) : undefined} />}
            <ul className="record-list">
              {records.map((r) => (
                <li key={r.date}>
                  <button className={r.date === current?.date ? 'on' : ''} onClick={() => setSelected(r.date)}>
                    <span>{formatDotDate(r.date)} ({WEEKDAY_KO[weekday(r.date)]})</span>
                    <span>{r.completed ? <ItemIcon item={itemOf(r)} /> : '⏸️'} {Math.floor(r.progress * 100)}%</span>
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
              {monthOt.days > 0 && (
                <>
                  <dt>야근</dt>
                  <dd>{monthOt.days}일 · {Math.round(monthOt.ms / 360_000) / 10}시간</dd>
                </>
              )}
              {monthOt.owed > 0 && (
                <>
                  <dt>벌었어야 할 돈</dt>
                  <dd className="owed">{formatWon(Math.floor(monthOt.owed))}</dd>
                </>
              )}
              {monthOt.pay > 0 && (
                <>
                  <dt>야근수당</dt>
                  <dd>{formatWon(Math.floor(monthOt.pay))}</dd>
                </>
              )}
            </dl>
            <StampCalendar y={ym.y} m={ym.m} state={state} now={now} onPick={onDayOverride ? setPicked : undefined} />
            {onDayOverride && <p className="muted small">오늘 이후 날짜를 누르면 연차·회사 휴무나 출근일을 직접 정할 수 있어요.</p>}
          </section>
          {lastSeason && <OfficeRoom done={officeDone} season={lastSeason} small />}
        </>
      )}

      {editLeft && state.days[editLeft] && onLeft && (
        <LeftSheet
          when={formatDotDate(editLeft)}
          workEnd={state.days[editLeft].schedule.workEnd}
          onPick={(left) => {
            onLeft(editLeft, left);
            setEditLeft(null);
          }}
          onLater={() => setEditLeft(null)}
        />
      )}

      {picked && state.settings && onDayOverride && (
        <DaySheet
          date={picked}
          settings={state.settings}
          locked={!!state.days[picked]?.clockedOut}
          onPick={(v) => {
            onDayOverride(picked, v);
            setPicked(null);
          }}
          onClose={() => setPicked(null)}
        />
      )}
    </div>
  );
}

/** 날짜를 눌렀을 때: 쉬는 날 / 출근하는 날 직접 정하기 */
function DaySheet({
  date,
  settings,
  locked,
  onPick,
  onClose,
}: {
  date: string;
  settings: Settings;
  locked: boolean;
  onPick: (v: Override) => void;
  onClose: () => void;
}) {
  const ov = settings.dayOverrides?.[date];
  const base = isWorkday(date, { ...settings, dayOverrides: undefined });
  const hol = holidayName(date);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="날짜 설정" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{formatKoreanDate(date)}</h3>
        <p className="muted">
          기본: {base ? '출근하는 날' : `쉬는 날${hol ? ` (${hol})` : ''}`}
          {ov && ` → 직접 ${ov === 'off' ? '쉬는 날' : '출근하는 날'}로 정함`}
        </p>
        {locked ? (
          <p className="muted small">이미 퇴근한 날은 바꿀 수 없어요.</p>
        ) : (
          <>
            {(ov ? ov === 'on' : base) ? (
              <button className="btn primary" onClick={() => onPick(base ? 'off' : null)}>
                🏖️ 이 날 쉬어요 (연차·회사 휴무)
              </button>
            ) : (
              <button className="btn primary" onClick={() => onPick(base ? null : 'on')}>
                💼 이 날 출근해요
              </button>
            )}
            {ov && (
              <button className="btn ghost" onClick={() => onPick(null)}>
                기본으로 되돌리기
              </button>
            )}
          </>
        )}
        <button className="btn ghost" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}

/** 지금까지의 누적 — 오래 쓸수록 쌓이는 숫자와 다음 해금 */
function CareerCard({ state }: { state: AppState }) {
  const c = careerStats(state.days, state.settings?.dayOverrides);
  const ot = overtimeTotals(state.days);
  const p = playerProgress(state);
  const next = nextUnlock(p);
  return (
    <section className="card career">
      <div className="career-title">🏅 {careerTitle(c.completedDays)}</div>
      <div className="career-grid">
        <div>
          <b>{c.completedDays}</b>
          <small>출근일</small>
        </div>
        <div>
          <b>{c.streak}</b>
          <small>연속 출근</small>
        </div>
        <div>
          <b>{Math.round(c.workedHours)}</b>
          <small>근무 시간</small>
        </div>
        <div className="wide">
          <b>{formatWon(Math.floor(c.earned))}</b>
          <small>지금까지 번 돈</small>
        </div>
        {ot.owed > 0 && (
          <div className="wide owed">
            <b>{formatWon(Math.floor(ot.owed))}</b>
            <small>벌었어야 할 돈 (야근 {Math.round(ot.ms / 360_000) / 10}시간)</small>
          </div>
        )}
        {ot.pay > 0 && (
          <div className="wide">
            <b>{formatWon(Math.floor(ot.pay))}</b>
            <small>야근수당 (야근 {Math.round(ot.ms / 360_000) / 10}시간)</small>
          </div>
        )}
      </div>
      {next && (
        <p className="muted small career-next">
          다음 해금: {next.emoji} {next.label} — {next.remaining}일 더 출근하면 열려요
        </p>
      )}
    </section>
  );
}
