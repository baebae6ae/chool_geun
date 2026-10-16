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
import { activeSeason, daysUntilSeason, nextSeasonItem, ownedSeasonItems, seasonDays, seasonRangeText, SEASON_EVENTS } from '../domain/seasons';
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

      <SeasonCard state={state} />

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
      <Picker title="머리 위 (사무용품)" items={HATS} value={c.hat} isOpen={open} onPick={(hat) => set({ hat })} />
      <Picker title="몸 (업무복·사무용품)" items={OUTFITS} value={c.outfit} isOpen={open} onPick={(outfit) => set({ outfit })} />
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

/** 계절 이벤트: 기간 중 앱을 켠 날이 쌓이면 한정 꾸미기 아이템이 열린다 */
function SeasonCard({ state }: { state: AppState }) {
  const today = dateKey(clockNow());
  const now = activeSeason(today);
  const soon = daysUntilSeason(today);
  const owned = ownedSeasonItems(state);
  const days = seasonDays(state);
  if (!now && !(soon && soon.days <= 21) && owned.length === 0) return null;
  return (
    <section className="card season-card">
      {now ? (
        <>
          <div className="card-label">
            {now.event.emoji} {now.event.name} 이벤트 · {seasonRangeText(now.event)}
          </div>
          <p className="muted small">
            이 기간에 앱을 켠 날이 쌓이면 한정 아이템이 열려요. 지금까지 {days[now.event.id]}일 접속했어요.
            {(() => {
              const next = nextSeasonItem(state, now.event.id);
              return next ? ` 다음 아이템 "${next.item.label}"까지 ${next.remaining}일!` : ' 한정 아이템을 모두 모았어요!';
            })()}
          </p>
        </>
      ) : soon && soon.days <= 21 ? (
        <>
          <div className="card-label">
            {soon.event.emoji} {soon.event.name} 이벤트가 {soon.days}일 뒤에 시작해요
          </div>
          <p className="muted small">{seasonRangeText(soon.event)} 동안 앱을 켜면 한정 꾸미기 아이템을 받을 수 있어요.</p>
        </>
      ) : (
        <div className="card-label">🎁 받은 한정 아이템 {owned.length}개 — 아래 목록에서 골라 입어 보세요</div>
      )}
      <div className="chips">
        {SEASON_EVENTS.flatMap((e) => e.items).map((i) => {
          const got = owned.some((o) => o.id === i.id);
          return (
            <span key={i.id} className={`chip ${got ? 'on' : 'locked'}`} aria-label={`${i.label} ${got ? '받음' : '아직'}`}>
              {got ? '' : '🔒 '}
              {i.emoji} {i.label}
            </span>
          );
        })}
      </div>
    </section>
  );
}

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
