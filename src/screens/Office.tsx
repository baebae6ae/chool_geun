import { useState } from 'react';
import { OfficeRoom } from '../components/OfficeRoom';
import { completedCount } from '../domain/engine';
import { completedInSeason, itemOf, PART_SIZE, seasonParts } from '../domain/records';
import { SEASON_LENGTH, seasonDef, seasonTitle } from '../domain/workItems';
import type { AppState } from '../domain/types';
import { ItemIcon } from '../components/ItemIcon';
import { TabIcon } from '../components/TabIcon';

/** 기획서 6, 12. 누적 배치되는 사무실 + 주간 결과물 */
export function Office({ state }: { state: AppState }) {
  const total = completedCount(state.days);
  const currentSeason = Math.floor(total / SEASON_LENGTH) + 1;
  const [season, setSeason] = useState(currentSeason);
  const done = completedInSeason(state.days, season);
  const seasonDone = done.size >= SEASON_LENGTH;

  // 만든 순서대로 5개씩 파트로 묶기 (쉬는 날은 건너뛰고 다음 출근 때 이어서 채운다)
  const parts = seasonParts(state.days, season);
  const md = (date: string) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`;

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>{seasonDef(season).theme === 'office' ? <TabIcon id="office" /> : seasonDef(season).icon} 햄스터 {seasonDef(season).room}</h1>
        {currentSeason > 1 && (
          <select value={season} onChange={(e) => setSeason(Number(e.target.value))} aria-label="시즌 선택">
            {Array.from({ length: currentSeason }, (_, i) => (
              <option key={i} value={i + 1}>시즌 {i + 1}</option>
            ))}
          </select>
        )}
      </header>
      <p className="muted">시즌 {season} 「{seasonTitle(season)}」 · {done.size} / {SEASON_LENGTH}</p>

      <OfficeRoom done={done} season={season} />
      {seasonDone && <div className="banner">🎉 시즌 {season} 완성! 「{seasonTitle(season)}」을 모두 만들었어요.</div>}

      <section className="card">
        <div className="card-label">파트별 결과물</div>
        {parts.length === 0 && <p className="muted">첫 작업물을 완성하면 여기에 쌓여요.</p>}
        {parts.map((slots, i) => {
          const n = slots.filter(Boolean).length;
          return (
            <div key={i} className="week-result">
              <div className="week-result-title">
                파트 {i + 1} {n >= PART_SIZE ? '🏢 완성' : <span className="muted">({n}/{PART_SIZE})</span>}
              </div>
              <div className="week-result-items">
                {slots.map((d, j) =>
                  d ? (
                    <span key={j}>
                      <small>{md(d.date)}</small> <ItemIcon item={itemOf(d)} />
                    </span>
                  ) : (
                    <span key={j} className="part-empty" aria-label="아직 안 만든 작업물">❔</span>
                  ),
                )}
              </div>
            </div>
          );
        })}
      </section>

      <section className="card">
        <div className="card-label">작업물 목록</div>
        <ul className="item-list">
          {seasonDef(season).items.map((it, i) => (
            <li key={it.day} className={done.has(i) ? 'done' : ''}>
              <span className="item-day">Day {it.day}</span>
              <span className="item-emoji">{done.has(i) ? <ItemIcon item={it} /> : '❔'}</span>
              <span className="item-name">{done.has(i) ? it.name : '???'}</span>
              <span className="item-effect">{done.has(i) ? it.effect : ''}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
