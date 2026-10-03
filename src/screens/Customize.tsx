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
