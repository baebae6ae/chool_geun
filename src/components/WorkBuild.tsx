import { stageOf, STAGES, type WorkItem } from '../domain/workItems';

/** 작업물 제작 과정 시각화: 재료 블록이 쌓이고, 작업물이 흑백 → 컬러로 완성된다. */
export function WorkBuild({ item, progress }: { item: WorkItem; progress: number }) {
  const stage = stageOf(progress);
  const blocks = Math.min(10, Math.floor(progress * 10));
  const done = progress >= 1;
  return (
    <div className={`build ${done ? 'build-done' : ''}`} aria-label={`${item.name} ${Math.floor(progress * 100)}%`}>
      <div className="build-stage">
        {STAGES.slice(0, -1).map((s) => (
          <span key={s.label} className={progress >= s.from ? 'on' : ''} title={s.label}>
            {s.emoji}
          </span>
        ))}
      </div>
      <div className="build-area">
        <div className="build-blocks" aria-hidden>
          {Array.from({ length: blocks }, (_, i) => (
            <span key={i} style={{ animationDelay: `${i * 40}ms` }}>
              {stage.emoji === '✨' ? '✨' : '🧱'}
            </span>
          ))}
        </div>
        <div
          className="build-item"
          style={{
            filter: done ? 'none' : `grayscale(${1 - progress}) opacity(${0.25 + progress * 0.75})`,
            transform: `scale(${0.6 + progress * 0.4})`,
          }}
        >
          {item.emoji}
        </div>
      </div>
      <div className="build-label">
        {stage.emoji} {stage.label}
      </div>
    </div>
  );
}

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.floor(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
      <span className="progress-text">{pct}%</span>
    </div>
  );
}
