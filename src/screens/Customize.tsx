import { DeskBack, DeskFront } from '../components/habitat/props';
import { HamsterSprite } from '../components/hamster/HamsterSprite';
import {
  BACKGROUNDS,
  COLORS,
  DECOS,
  GLASSES_UNLOCK,
  HANDS,
  HATS,
  isUnlocked,
  OUTFITS,
  SPECIES,
  unlockText,
  type CatalogItem,
  type Unlock,
} from '../domain/customization';
import { playerProgress } from '../domain/engine';
import type { AppState, Customization } from '../domain/types';
import { TabIcon } from '../components/TabIcon';
import { dateKey } from '../domain/date';
import { activeSeason, daysUntilSeason, nextSeasonItem, ownedSeasonItems, seasonDays, seasonRangeText, type SeasonItem } from '../domain/seasons';
import { now as clockNow } from '../store';

/** 기획서 15. 햄스터 커스터마이징 (진행 보상으로 해금) */
export function Customize({ state, onChange }: { state: AppState; onChange: (c: Customization) => void }) {
  const p = playerProgress(state);
  const c = state.custom;
  const set = (patch: Partial<Customization>) => onChange({ ...c, ...patch });
  const open = (u: Unlock) => isUnlocked(u, p);

  return (
    <div className="screen">
      <header className="screen-head">
        <h1><TabIcon id="custom" /> 꾸미기</h1>
      </header>
      <div className="stage-card custom-preview">
        <div className="custom-preview-solo">
          <HamsterSprite custom={c} pose={{ pose: 'front', action: 'wave' }} />
        </div>
        <div className="custom-preview-desk">
          <DeskBack x={60} />
          <div className="custom-preview-sitter">
            <HamsterSprite custom={c} pose={{ pose: 'front', action: 'type' }} className="no-shadow" />
          </div>
          <DeskFront x={60} custom={c} />
        </div>
      </div>
      <p className="muted small center-text">
        작업물 {p.completed}개 완성 · 도감 {p.collected}종 · 누적 {Math.floor(p.earned / 10000).toLocaleString('ko-KR')}만 원 — 더 모으면 새 아이템이 열려요
      </p>

      <SeasonCard state={state} onWear={set} />

      <Picker title="캐릭터" items={SPECIES} value={c.species ?? 'hamster'} isOpen={open} onPick={(species) => set({ species })} />
      <Picker title="서식지 배경 (시즌을 끝내면 열려요)" items={BACKGROUNDS} value={c.bg ?? 'default'} isOpen={open} onPick={(bg) => set({ bg })} />
      <Picker title="털 색상" items={COLORS} value={c.color} isOpen={open} onPick={(color) => set({ color })} />
      <section className="card">
        <div className="card-label">안경</div>
        <div className="chips">
          <Chip label="🚫 없음" on={!c.glasses} onClick={() => set({ glasses: false })} />
          <Chip
            label="👓 안경"
            on={c.glasses}
            locked={!open(GLASSES_UNLOCK) ? unlockText(GLASSES_UNLOCK) : undefined}
            onClick={() => set({ glasses: true })}
          />
        </div>
      </section>
      <Picker title="머리 위 (사무용품 · 이벤트)" items={HATS} value={c.hat} isOpen={open} onPick={(hat) => set({ hat })} />
      <Picker title="몸 (업무복 · 사무용품 · 이벤트)" items={OUTFITS} value={c.outfit} isOpen={open} onPick={(outfit) => set({ outfit })} />
      <Picker title="손에 든 것" items={HANDS} value={c.hand} isOpen={open} onPick={(hand) => set({ hand })} />

      <section className="card">
        <div className="card-label">책상</div>
        <div className="chips">
          <Chip label="💻 노트북" on={c.laptop} onClick={() => set({ laptop: !c.laptop })} />
          <Chip label="☕ 머그컵" on={c.mug} onClick={() => set({ mug: !c.mug })} />
        </div>
        <div className="card-label sub">장식품</div>
        <div className="chips">
          {DECOS.map((d) => (
            <Chip
              key={d.id}
              label={`${d.emoji} ${d.label}`}
              on={c.deco === d.id}
              locked={!open(d.unlock) ? unlockText(d.unlock) : undefined}
              onClick={() => set({ deco: d.id })}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

/** 계절 이벤트: 기간 중 앱을 켠 날이 쌓이면 한정 꾸미기 아이템이 열린다.
 * 받은 것과 지금 쓰고 있는 것을 구분해서 보여 주고, 여기서 바로 써 볼 수 있다. */
function SeasonCard({ state, onWear }: { state: AppState; onWear: (patch: Partial<Customization>) => void }) {
  const today = dateKey(clockNow());
  const now = activeSeason(today);
  const soon = daysUntilSeason(today);
  const owned = ownedSeasonItems(state);
  const days = seasonDays(state);
  const c = state.custom;
  // 지금 이벤트(또는 곧 시작할 이벤트)의 아이템 + 지난 이벤트에서 받아 둔 아이템
  const event = now?.event ?? (soon && soon.days <= 21 ? soon.event : null);
  const past = owned.filter((i) => i.event !== event?.id);
  if (!event && past.length === 0) return null;

  const worn = (i: SeasonItem) => (i.kind === 'hat' ? c.hat : i.kind === 'outfit' ? c.outfit : c.deco) === i.id;
  const toggle = (i: SeasonItem) => {
    const id = worn(i) ? 'none' : i.id;
    onWear(i.kind === 'hat' ? { hat: id as Customization['hat'] } : i.kind === 'outfit' ? { outfit: id as Customization['outfit'] } : { deco: id as Customization['deco'] });
  };
  const row = (i: SeasonItem, have: boolean, left: number) => {
    const on = have && worn(i);
    return (
      <li key={i.id} className={`season-item ${have ? 'have' : 'locked'} ${on ? 'worn' : ''}`}>
        <span className="season-item-icon" aria-hidden>
          {have ? i.emoji : '🔒'}
        </span>
        <span className="season-item-text">
          <b>{i.label}</b>
          <small>{KIND_LABEL[i.kind]}</small>
        </span>
        {have ? (
          <button className={`season-item-btn ${on ? 'on' : ''}`} onClick={() => toggle(i)} aria-pressed={on}>
            {on ? (i.kind === 'deco' ? '놓는 중 ✓' : '착용 중 ✓') : i.kind === 'deco' ? '책상에 놓기' : '써 보기'}
          </button>
        ) : (
          <span className="season-item-lock">{now ? `${left}일 더 켜면` : `${i.days}일째`}</span>
        )}
      </li>
    );
  };

  return (
    <section className="card season-card">
      {event && (
        <>
          <div className="card-label">
            {event.emoji} {event.name} 이벤트 · {seasonRangeText(event)}
            {!now && soon && <span className="season-soon"> · {soon.days}일 뒤 시작</span>}
          </div>
          {/* 출석 도장: 받는 날에는 아이템 그림 */}
          <ol className="season-stamps" aria-label={`이벤트 기간에 ${now ? days[event.id] : 0}일 접속`}>
            {Array.from({ length: Math.max(...event.items.map((i) => i.days)) }, (_, k) => {
              const d = k + 1;
              const prize = event.items.find((i) => i.days === d);
              const done = !!now && days[event.id] >= d;
              return (
                <li key={d} className={`${done ? 'done' : ''} ${prize ? 'prize' : ''}`}>
                  {prize ? (done ? prize.emoji : '🎁') : done ? '🐾' : d}
                </li>
              );
            })}
          </ol>
          <p className="muted small">
            {now
              ? (() => {
                  const next = nextSeasonItem(state, event.id);
                  return `이 기간에 앱을 켠 날 ${days[event.id]}일째. ${next ? `${next.remaining}일 더 켜면 "${next.item.label}"!` : '한정 아이템을 모두 모았어요!'}`;
                })()
              : '이 기간에 앱을 켠 날이 쌓이면 한정 아이템을 받아요.'}
          </p>
          <ul className="season-items">
            {event.items.map((i) => {
              const have = owned.some((o) => o.id === i.id);
              return row(i, have, i.days - (now ? days[event.id] : 0));
            })}
          </ul>
        </>
      )}
      {past.length > 0 && (
        <>
          <div className="card-label sub">🎁 지난 이벤트에서 받은 아이템</div>
          <ul className="season-items">{past.map((i) => row(i, true, 0))}</ul>
        </>
      )}
    </section>
  );
}

const KIND_LABEL: Record<SeasonItem['kind'], string> = { hat: '머리 위', outfit: '몸', deco: '책상 장식품' };

function Picker<T extends string>({
  title,
  items,
  value,
  isOpen,
  onPick,
}: {
  title: string;
  items: CatalogItem<T>[];
  value: T;
  isOpen: (u: Unlock) => boolean;
  onPick: (id: T) => void;
}) {
  return (
    <section className="card">
      <div className="card-label">{title}</div>
      <div className="chips">
        {items.map((it) => {
          const open = isOpen(it.unlock);
          // 히든은 열리기 전까지 이름을 감춘다
          const masked = it.hidden && !open;
          return (
            <Chip
              key={it.id}
              label={masked ? '❔ ???' : `${it.emoji} ${it.label}`}
              on={value === it.id}
              locked={!open ? `${masked ? '히든 · ' : ''}${unlockText(it.unlock)}` : undefined}
              onClick={() => onPick(it.id)}
            />
          );
        })}
      </div>
    </section>
  );
}

function Chip({ label, on, locked, onClick }: { label: string; on: boolean; locked?: string; onClick: () => void }) {
  return (
    <button className={`chip ${on ? 'on' : ''} ${locked ? 'locked' : ''}`} onClick={onClick} disabled={!!locked} aria-pressed={on}>
      {locked ? '🔒 ' : ''}
      {label}
      {locked && <small>{locked}</small>}
    </button>
  );
}
