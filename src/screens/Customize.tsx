import { DeskBack, DeskFront } from '../components/habitat/props';
import { HamsterSprite } from '../components/hamster/HamsterSprite';
import {
  COLORS,
  DECOS,
  GLASSES_UNLOCK,
  HATS,
  isUnlocked,
  OUTFITS,
  unlockText,
  type CatalogItem,
  type Unlock,
} from '../domain/customization';
import { playerProgress } from '../domain/engine';
import type { AppState, Customization } from '../domain/types';

/** 기획서 15. 햄스터 커스터마이징 (진행 보상으로 해금) */
export function Customize({ state, onChange }: { state: AppState; onChange: (c: Customization) => void }) {
  const p = playerProgress(state);
  const c = state.custom;
  const set = (patch: Partial<Customization>) => onChange({ ...c, ...patch });
  const open = (u: Unlock) => isUnlocked(u, p);

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>🎀 꾸미기</h1>
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
        작업물 {p.completed}개 완성 · 도감 {p.collected}종 — 더 모으면 새 아이템이 열려요
      </p>

      <Picker title="햄스터 색상" items={COLORS} value={c.color} isOpen={open} onPick={(color) => set({ color })} />
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
      <Picker title="헤어 / 모자" items={HATS} value={c.hat} isOpen={open} onPick={(hat) => set({ hat })} />
      <Picker title="업무복" items={OUTFITS} value={c.outfit} isOpen={open} onPick={(outfit) => set({ outfit })} />

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
        {items.map((it) => (
          <Chip
            key={it.id}
            label={`${it.emoji} ${it.label}`}
            on={value === it.id}
            locked={!isOpen(it.unlock) ? unlockText(it.unlock) : undefined}
            onClick={() => onPick(it.id)}
          />
        ))}
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
