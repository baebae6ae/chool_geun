import { useState } from 'react';
import { formatDotDate, dateKey } from '../domain/date';
import { GACHA_EVENTS, RARITIES, RARITY_LABEL, RARITY_RATE, type GachaEvent } from '../domain/gacha';
import { RARE_BEHAVIORS } from '../domain/rare';
import type { AppState } from '../domain/types';

/** 기획서 8. 직장인 가챠 도감 */
export function Collection({ state }: { state: AppState }) {
  const owned = GACHA_EVENTS.filter((e) => state.collection[e.id]).length;
  const [picked, setPicked] = useState<GachaEvent | null>(null);

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>📖 직장인 도감</h1>
        <span className="count-chip">{owned} / {GACHA_EVENTS.length}</span>
      </header>
      <p className="muted">근무 중 하루 1~3번, 랜덤으로 직장인 이벤트가 발생해요.</p>

      <section className="card dex rare-dex">
        <div className="dex-head">
          <span className="rarity-badge">✨ 희귀 행동</span>
          <span className="muted small">
            {RARE_BEHAVIORS.filter((r) => state.rare?.[r.id]).length}/{RARE_BEHAVIORS.length} · 켜두고 보고 있으면 아주 가끔
          </span>
        </div>
        <div className="dex-grid">
          {RARE_BEHAVIORS.map((r) => {
            const at = state.rare?.[r.id];
            return (
              <div key={r.id} className={`dex-cell ${at ? 'got' : 'locked'}`} title={at ? r.description : undefined}>
                <span className="dex-emoji">{at ? r.emoji : '❔'}</span>
                <span className="dex-name">{at ? r.name : '???'}</span>
                {at && <span className="dex-date">{formatDotDate(dateKey(at))}</span>}
              </div>
            );
          })}
        </div>
      </section>

      {RARITIES.map((r) => {
        const list = GACHA_EVENTS.filter((e) => e.rarity === r);
        const got = list.filter((e) => state.collection[e.id]).length;
        return (
          <section key={r} className={`card dex rarity-${r}`}>
            <div className="dex-head">
              <span className="rarity-badge">{r}</span>
              <span className="muted small">{RARITY_LABEL[r]} · {Math.round(RARITY_RATE[r] * 100)}% · {got}/{list.length}</span>
            </div>
            <div className="dex-grid">
              {list.map((e) => {
                const c = state.collection[e.id];
                return (
                  <button key={e.id} className={`dex-cell ${c ? 'got' : 'locked'}`} onClick={() => c && setPicked(e)} disabled={!c}>
                    <span className="dex-emoji">{c ? e.emoji : '❔'}</span>
                    <span className="dex-name">{c ? e.name : '???'}</span>
                    {c && c.count > 1 && <span className="dex-count">×{c.count}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      {picked && (
        <div className="overlay" role="dialog" aria-modal="true" onClick={() => setPicked(null)}>
          <div className={`sheet gacha-card rarity-${picked.rarity}`} onClick={(e) => e.stopPropagation()}>
            <div className="rarity-badge">{picked.rarity}</div>
            <div className="gacha-emoji">{picked.emoji}</div>
            <div className="gacha-name">{picked.name}</div>
            <p className="gacha-desc">{picked.description}</p>
            <p className="muted small">
              첫 획득 {formatDotDate(dateKey(state.collection[picked.id].firstObtainedAt))} · {state.collection[picked.id].count}회
            </p>
            <button className="btn primary" onClick={() => setPicked(null)}>닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}
