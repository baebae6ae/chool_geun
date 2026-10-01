import { seasonDef } from '../domain/workItems';
import { ItemIcon } from './ItemIcon';
import { hasItemIcon } from './itemIcons';

/**
 * 완성한 작업물이 누적 배치되는 햄스터 사무실.
 * 1번(벽)은 방 자체, 2번(책상)은 그려진 책상으로 표현하고 나머지는 이모지 오브젝트.
 */
export function OfficeRoom({ done, highlight, small = false, season = 1 }: { done: Set<number>; highlight?: number; small?: boolean; season?: number }) {
  const def = seasonDef(season);
  const first = def.theme === 'office';
  const hasWall = !first || done.has(0);
  return (
    <div className={`office ${hasWall ? 'office-walled' : 'office-empty'} office-theme-${def.theme} ${small ? 'office-small' : ''}`}>
      {!hasWall && <div className="office-hint">🧱 벽을 세우면 사무실이 생겨요</div>}
      {hasWall && <div className="office-floor" />}
      {first && done.has(1) && (
        <div className={`office-desk ${highlight === 1 ? 'pop' : ''}`} aria-label="책상">
          <div className="office-desk-top" />
        </div>
      )}
      {def.items.map((item, i) => {
        if ((first && i < 2) || !done.has(i)) return null;
        return (
          <span
            key={item.day}
            className={`office-obj ${hasItemIcon(item.name) ? 'drawn' : ''} ${highlight === i ? 'pop' : ''}`}
            style={{ left: `${item.pos.x}%`, top: `${item.pos.y}%`, fontSize: `${item.pos.size}em` }}
            title={item.name}
          >
            <ItemIcon item={item} />
          </span>
        );
      })}
    </div>
  );
}
