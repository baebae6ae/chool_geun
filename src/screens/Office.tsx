import { useState } from 'react';
import { OfficeRoom } from '../components/OfficeRoom';
import { mondayOf, WEEKDAY_EN, weekday } from '../domain/date';
import { completedCount } from '../domain/engine';
import { completedInSeason, itemOf } from '../domain/records';
import { SEASON_LENGTH, SEASON_TITLE, WORK_ITEMS } from '../domain/workItems';
import type { AppState, DailyWork } from '../domain/types';

/** 기획서 6, 12. 누적 배치되는 사무실 + 주간 결과물 */
export function Office({ state }: { state: AppState }) {
  const total = completedCount(state.days);
  const currentSeason = Math.floor(total / SEASON_LENGTH) + 1;
  const [season, setSeason] = useState(currentSeason);
  const done = completedInSeason(state.days, season);
  const seasonDone = done.size >= SEASON_LENGTH;

  // 주 단위로 완성한 작업물 묶기
  const weeks = new Map<string, DailyWork[]>();
  for (const d of Object.values(state.days).sort((a, b) => a.date.localeCompare(b.date))) {
    if (!d.completed || d.season !== season) continue;
    const m = mondayOf(d.date);
    weeks.set(m, [...(weeks.get(m) ?? []), d]);
  }
  const weekList = [...weeks.entries()];

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>🏢 햄스터 사무실</h1>
        {currentSeason > 1 && (
          <select value={season} onChange={(e) => setSeason(Number(e.target.value))} aria-label="시즌 선택">
            {Array.from({ length: currentSeason }, (_, i) => (
              <option key={i} value={i + 1}>시즌 {i + 1}</option>
            ))}
          </select>
        )}
      </header>
      <p className="muted">시즌 {season} 「{SEASON_TITLE}」 · {done.size} / {SEASON_LENGTH}</p>

      <OfficeRoom done={done} />
      {seasonDone && <div className="banner">🎉 시즌 {season} 완성! 완성된 햄스터 사무실이에요.</div>}

      <section className="card">
        <div className="card-label">주간 결과물</div>
        {weekList.length === 0 && <p className="muted">첫 작업물을 완성하면 여기에 쌓여요.</p>}
        {weekList.map(([mon, list], i) => (
          <div key={mon} className="week-result">
            <div className="week-result-title">
              {i + 1}주차 {list.length >= 5 ? '🏢 완성' : <span className="muted">({list.length}/5)</span>}
            </div>
            <div className="week-result-items">
              {list.map((d) => (
                <span key={d.date}>
                  <small>{WEEKDAY_EN[weekday(d.date)]}</small> {itemOf(d).emoji}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-label">작업물 목록</div>
        <ul className="item-list">
          {WORK_ITEMS.map((it, i) => (
            <li key={it.day} className={done.has(i) ? 'done' : ''}>
              <span className="item-day">Day {it.day}</span>
              <span className="item-emoji">{done.has(i) ? it.emoji : '❔'}</span>
              <span className="item-name">{done.has(i) ? it.name : '???'}</span>
              <span className="item-effect">{done.has(i) ? it.effect : ''}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
