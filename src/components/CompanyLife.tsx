/** 기록 > 회사생활: 근속·예상 퇴직금·연차, 그리고 월간 리포트 블록 */
import { useState } from 'react';
import { useBackHandler } from '../backStack';
import { daysBetween, leaveYear, monthReport, severance, tenure, type MonthReport } from '../domain/career';
import { dateKey, formatDotDate, WEEKDAY_KO, weekday } from '../domain/date';
import { formatWon } from '../domain/records';
import type { AppState, Settings } from '../domain/types';

type Patch = Partial<Pick<Settings, 'hireDate' | 'leaveTotal'>>;

const fmtDays = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/** 근속 + 예상 퇴직금 */
export function TenureCard({ state, now, onPatch }: { state: AppState; now: number; onPatch: (p: Patch) => void }) {
  const [edit, setEdit] = useState(false);
  const s = state.settings;
  if (!s) return null;
  const today = dateKey(now);
  const hire = s.hireDate;
  return (
    <section className="card company">
      <div className="card-label">🏢 내 근속</div>
      {!hire ? (
        <div className="company-empty">
          <p>입사일을 알려 주면 <b>근속 기간, 연차, 예상 퇴직금</b>을 계산해 드려요.</p>
          <button className="btn primary" onClick={() => setEdit(true)}>입사일 입력하기</button>
        </div>
      ) : (
        (() => {
          const t = tenure(hire, today);
          const sv = severance(s, hire, today);
          const dDay = daysBetween(today, t.nextAnniversary);
          return (
            <>
              <div className="tenure-head">
                <div className="tenure-big">
                  {t.years > 0 && <><b>{t.years}</b>년 </>}
                  <b>{t.months}</b>개월째
                </div>
                <small className="muted">
                  {formatDotDate(hire)} 입사 · D+{t.days}
                </small>
              </div>
              {t.anniversaryToday ? (
                <div className="tenure-anniv">🎉 오늘은 입사 {t.anniversaryToday}주년이에요! 버텨 낸 나 자신, 칭찬해요.</div>
              ) : (
                <div className="tenure-next">🎂 입사 {t.nextYears}주년까지 D-{dDay}</div>
              )}
              <div className="severance">
                <span className="muted">지금 그만두면 받을 예상 퇴직금</span>
                <strong>{formatWon(sv.amount)}</strong>
                <small className="muted">
                  {sv.included
                    ? '연봉에 퇴직금이 포함돼 있어 매달 나눠 받고 있어요 (참고용 숫자)'
                    : sv.eligible
                      ? `세전 월급 ${formatWon(Math.round(sv.monthly))} 기준 · 참고용 계산이에요`
                      : `1년을 채우면 받을 수 있어요 · D-${sv.daysToEligible}`}
                </small>
              </div>
              <button className="btn ghost small-btn" onClick={() => setEdit(true)}>입사일 바꾸기</button>
            </>
          );
        })()
      )}
      {edit && (
        <DateSheet
          title="입사일"
          initial={hire ?? today}
          max={today}
          onSave={(v) => {
            onPatch({ hireDate: v });
            setEdit(false);
          }}
          onClear={hire ? () => {
            onPatch({ hireDate: null });
            setEdit(false);
          } : undefined}
          onClose={() => setEdit(false)}
        />
      )}
    </section>
  );
}

/** 연차: 이번 연차 기간에 생긴 연차와 쓴 연차 */
export function LeaveCard({ state, now, onPatch }: { state: AppState; now: number; onPatch: (p: Patch) => void }) {
  const [edit, setEdit] = useState(false);
  const s = state.settings;
  if (!s?.hireDate) return null;
  const l = leaveYear(s.hireDate, dateKey(now), s.leave, s.leaveTotal);
  const left = Math.max(0, l.total - l.used);
  const pct = l.total > 0 ? Math.min(1, l.used / l.total) : 0;
  return (
    <section className="card company">
      <div className="card-label">🏖️ 연차</div>
      <div className="leave-head">
        <div>
          남은 연차 <b className="leave-left">{fmtDays(left)}</b>일
        </div>
        <small className="muted">
          {fmtDays(l.used)}일 씀 / {fmtDays(l.total)}일 {s.leaveTotal != null ? '(직접 정함)' : l.firstYear ? '(1년 미만: 한 달마다 1일)' : ''}
        </small>
      </div>
      <div className="leave-bar" role="progressbar" aria-valuenow={Math.round(pct * 100)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${pct * 100}%` }} />
      </div>
      <small className="muted">
        {formatDotDate(l.from)} ~ {formatDotDate(daysBefore(l.to))}
      </small>
      {l.dates.length > 0 && (
        <div className="leave-dates">
          {l.dates.map((d) => (
            <span key={d.date} className={`chip ${d.amount < 1 ? 'half' : ''}`}>
              {Number(d.date.slice(5, 7))}/{Number(d.date.slice(8))}({WEEKDAY_KO[weekday(d.date)]}) {d.amount < 1 ? '반차' : '연차'}
            </span>
          ))}
        </div>
      )}
      <p className="muted small">월간 달력에서 날짜를 누르면 연차·반차를 기록할 수 있어요.</p>
      <button className="btn ghost small-btn" onClick={() => setEdit(true)}>연차 개수 직접 정하기</button>
      {edit && (
        <NumberSheet
          title="이번 연차 기간에 받은 연차 개수"
          initial={l.total}
          onSave={(n) => {
            onPatch({ leaveTotal: n });
            setEdit(false);
          }}
          onClear={s.leaveTotal != null ? () => {
            onPatch({ leaveTotal: null });
            setEdit(false);
          } : undefined}
          onClose={() => setEdit(false)}
        />
      )}
    </section>
  );
}

function daysBefore(key: string) {
  const d = new Date(Number(key.slice(0, 4)), Number(key.slice(5, 7)) - 1, Number(key.slice(8)) - 1);
  return dateKey(d);
}

/** 월간 탭의 "이달의 리포트" */
export function MonthReportBlock({ state, y, m }: { state: AppState; y: number; m: number }) {
  const r = monthReport(state.days, y, m);
  if (!r.days) return null;
  const pm = m === 1 ? { y: y - 1, m: 12 } : { y, m: m - 1 };
  const prev: MonthReport = monthReport(state.days, pm.y, pm.m);
  const drop = r.contractHourly > 0 ? Math.round((1 - r.realHourly / r.contractHourly) * 100) : 0;
  const diff = Math.round((r.overtimeHours - prev.overtimeHours) * 10) / 10;
  return (
    <section className="card month-report">
      <div className="card-label">📊 이달의 리포트</div>
      <div className="real-wage">
        <span className="muted">내 진짜 시급</span>
        <strong>{formatWon(Math.round(r.realHourly))}</strong>
        <small className={drop > 0 ? 'owed' : 'muted'}>
          {drop > 0 ? `야근 때문에 계약 시급(${formatWon(Math.round(r.contractHourly))})보다 ${drop}% 낮아요` : '야근 없이 계약 시급 그대로예요 👏'}
        </small>
      </div>
      <dl className="record-grid">
        <dt>평균 퇴근 시각</dt>
        <dd>{r.avgLeave}</dd>
        <dt>칼퇴 / 야근</dt>
        <dd>
          {r.onTimeDays}일 / {r.overtimeDays}일
        </dd>
        {r.overtimeHours > 0 && (
          <>
            <dt>야근 시간</dt>
            <dd>{Math.round(r.overtimeHours * 10) / 10}시간</dd>
          </>
        )}
        {r.worstWeekday != null && (
          <>
            <dt>야근 많은 요일</dt>
            <dd>{WEEKDAY_KO[r.worstWeekday]}요일</dd>
          </>
        )}
        {prev.days > 0 && (
          <>
            <dt>지난달보다 야근</dt>
            <dd className={diff > 0 ? 'owed' : ''}>{diff === 0 ? '똑같아요' : diff > 0 ? `▲ ${diff}시간` : `▼ ${-diff}시간`}</dd>
          </>
        )}
      </dl>
    </section>
  );
}

function DateSheet({ title, initial, max, onSave, onClear, onClose }: { title: string; initial: string; max: string; onSave: (v: string) => void; onClear?: () => void; onClose: () => void }) {
  const [v, setV] = useState(initial);
  useBackHandler(true, onClose);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <input className="date-input" type="date" value={v} max={max} onChange={(e) => setV(e.target.value)} />
        <p className="muted small">기기 안에만 저장되고 어디에도 보내지지 않아요.</p>
        <button className="btn primary" disabled={!v || v > max} onClick={() => onSave(v)}>저장</button>
        {onClear && <button className="btn ghost" onClick={onClear}>입사일 지우기</button>}
        <button className="btn ghost" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

function NumberSheet({ title, initial, onSave, onClear, onClose }: { title: string; initial: number; onSave: (n: number) => void; onClear?: () => void; onClose: () => void }) {
  const [v, setV] = useState(String(initial));
  useBackHandler(true, onClose);
  const n = Number(v);
  const ok = v !== '' && Number.isFinite(n) && n >= 0 && n <= 60;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <input className="date-input" type="number" inputMode="decimal" step="0.5" min="0" max="60" value={v} onChange={(e) => setV(e.target.value)} />
        <p className="muted small">회사마다 기준(회계연도 등)이 다르면 직접 정해 주세요.</p>
        <button className="btn primary" disabled={!ok} onClick={() => onSave(n)}>저장</button>
        {onClear && <button className="btn ghost" onClick={onClear}>법정 기준으로 되돌리기</button>}
        <button className="btn ghost" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}
