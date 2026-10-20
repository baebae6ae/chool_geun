import { lazy, Suspense, useState } from 'react';
import { allStories, storyLength, type Story } from '../domain/theater';

const Theater = lazy(() => import('../components/theater/Theater').then((m) => ({ default: m.Theater })));
import { formatDotDate, dateKey } from '../domain/date';
import { GACHA_EVENTS, HOLIDAY_EVENTS, RARITIES, RARITY_LABEL, RARITY_RATE, type GachaEvent } from '../domain/gacha';
import { RARE_BEHAVIORS } from '../domain/rare';
import type { AppState } from '../domain/types';
import { TabIcon } from '../components/TabIcon';
import { EventIcon } from '../components/EventIcon';
import { useBackHandler } from '../backStack';
import { ACHIEVEMENTS, achievementContext, achievementCount, type Achievement } from '../domain/achievements';
import { Medal } from '../components/Medal';
import { HamsterSprite } from '../components/hamster/HamsterSprite';
import { DEFAULT_CUSTOM, SPECIES } from '../domain/customization';
import { VISITOR_COLOR } from '../domain/visitors';

/** 기획서 8. 직장인 가챠 도감 */
export function Collection({ state }: { state: AppState }) {
  const owned = GACHA_EVENTS.filter((e) => state.collection[e.id]).length;
  const [picked, setPicked] = useState<GachaEvent | null>(null);
  const [pickedAch, setPickedAch] = useState<Achievement | null>(null);
  useBackHandler(!!picked || !!pickedAch, () => {
    setPicked(null);
    setPickedAch(null);
  });
  const ach = achievementContext(state);
  const [achGot, achTotal] = achievementCount(state);
  const guests = SPECIES.filter((s) => !s.hidden);
  const visited = guests.filter((s) => state.visitors?.[s.id]).length;
  const [story, setStory] = useState<Story | null>(null);
  const stories = allStories();
  const seenStories = stories.filter((s) => state.stories?.seen?.[s.id]).length;

  return (
    <div className="screen">
      <header className="screen-head">
        <h1><TabIcon id="dex" /> 직장인 도감</h1>
        <span className="count-chip">{owned} / {GACHA_EVENTS.length}</span>
      </header>
      <p className="muted">근무 중 하루 1~3번, 랜덤으로 직장인 이벤트가 발생해요.</p>

      <details className="card dex ach-dex">
        <summary className="dex-head">
          <span className="rarity-badge">🏅 업적</span>
          <span className="muted small">{achGot}/{achTotal} · 눌러서 펼치기</span>
        </summary>
        <div className="dex-grid">
          {ACHIEVEMENTS.map((x) => {
            const at = state.achievements?.[x.id];
            const v = Math.min(x.goal, Math.floor(x.value(ach)));
            return (
              <button key={x.id} className={`dex-cell ${at ? 'got' : 'locked'}`} onClick={() => setPickedAch(x)}>
                <span className="dex-emoji"><Medal glyph={x.glyph} tier={x.tier} locked={!at} /></span>
                <span className="dex-name">{x.name}</span>
                <span className="dex-date">{at ? formatDotDate(dateKey(at)) : `${v}/${x.goal}`}</span>
              </button>
            );
          })}
        </div>
      </details>

      <section className="card dex story-dex">
        <div className="dex-head">
          <span className="rarity-badge">🎬 썰 모음</span>
          <span className="muted small">{seenStories}/{stories.length} · 퇴근하면 하루에 하나씩 열려요</span>
        </div>
        <div className="story-list">
          {stories.map((s) => {
            const at = state.stories?.seen?.[s.id];
            return (
              <button key={s.id} className={`story-item ${at ? 'got' : 'locked'}`} disabled={!at} onClick={() => setStory(s)}>
                <span className="story-no">#{s.no}</span>
                <span className="story-name">{at ? `「${s.title}」` : '???'}</span>
                <span className="muted small">{at ? `${Math.round(storyLength(s) / 1000)}초 · 다시 보기 ▶` : '아직 못 본 썰'}</span>
              </button>
            );
          })}
        </div>
      </section>
      {story && (
        <Suspense fallback={null}>
          <Theater story={story} me={state.custom} onClose={() => setStory(null)} />
        </Suspense>
      )}

      <section className="card dex visitor-dex">
        <div className="dex-head">
          <span className="rarity-badge">🚪 방문 손님</span>
          <span className="muted small">{visited}/{guests.length} · 가끔 다른 친구가 놀러 와요</span>
        </div>
        <div className="dex-grid visitor-grid">
          {guests.map((s) => {
            const v = state.visitors?.[s.id];
            return (
              <div key={s.id} className={`dex-cell ${v ? 'got' : 'locked'}`}>
                <span className="dex-emoji visitor-sprite">
                  <HamsterSprite custom={{ ...DEFAULT_CUSTOM, species: s.id, color: VISITOR_COLOR[s.id], outfit: 'none' }} pose={{ pose: 'front', action: v ? 'wave' : 'idle' }} still />
                </span>
                <span className="dex-name">{v ? s.label : '???'}</span>
                {v && <span className="dex-date">{v.count}번 · {formatDotDate(dateKey(v.first))}</span>}
              </div>
            );
          })}
        </div>
      </section>

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
                <span className="dex-emoji">{at ? <EventIcon id={r.id} emoji={r.emoji} /> : '❔'}</span>
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
                    <span className="dex-emoji">{c ? <EventIcon id={e.id} emoji={e.emoji} /> : '❔'}</span>
                    <span className="dex-name">{c ? e.name : '???'}</span>
                    {c && c.count > 1 && <span className="dex-count">×{c.count}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}

      <section className="card dex holiday-dex">
        <div className="dex-head">
          <span className="rarity-badge">🏖️ 휴일 이벤트</span>
          <span className="muted small">
            {HOLIDAY_EVENTS.filter((e) => state.collection[e.id]).length}/{HOLIDAY_EVENTS.length} · 쉬는 날 낮에 하루 1~3번
          </span>
        </div>
        <div className="dex-grid">
          {HOLIDAY_EVENTS.map((e) => {
            const c = state.collection[e.id];
            return (
              <button key={e.id} className={`dex-cell rarity-${e.rarity} ${c ? 'got' : 'locked'}`} onClick={() => c && setPicked(e)} disabled={!c}>
                <span className="dex-emoji">{c ? <EventIcon id={e.id} emoji={e.emoji} /> : '❔'}</span>
                <span className="dex-name">{c ? e.name : '???'}</span>
                {c && c.count > 1 && <span className="dex-count">×{c.count}</span>}
              </button>
            );
          })}
        </div>
      </section>

      {pickedAch && (
        <div className="overlay" role="dialog" aria-modal="true" onClick={() => setPickedAch(null)}>
          <div className="sheet gacha-card" onClick={(e) => e.stopPropagation()}>
            <div className="gacha-emoji"><Medal glyph={pickedAch.glyph} tier={pickedAch.tier} locked={!state.achievements?.[pickedAch.id]} /></div>
            <div className="gacha-name">{pickedAch.name}</div>
            <p className="gacha-desc">{pickedAch.desc}</p>
            <p className="muted small">
              {state.achievements?.[pickedAch.id]
                ? `달성 ${formatDotDate(dateKey(state.achievements[pickedAch.id]))}`
                : `진행 ${Math.min(pickedAch.goal, Math.floor(pickedAch.value(ach)))}/${pickedAch.goal}`}
            </p>
            <button className="btn primary" onClick={() => setPickedAch(null)}>닫기</button>
          </div>
        </div>
      )}

      {picked && (
        <div className="overlay" role="dialog" aria-modal="true" onClick={() => setPicked(null)}>
          <div className={`sheet gacha-card rarity-${picked.rarity}`} onClick={(e) => e.stopPropagation()}>
            <div className="rarity-badge">{picked.rarity}</div>
            <div className="gacha-emoji"><EventIcon id={picked.id} emoji={picked.emoji} /></div>
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
