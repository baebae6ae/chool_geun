import { WORK_ITEMS } from '../domain/workItems';

/**
 * 완성한 작업물이 누적 배치되는 햄스터 사무실.
 * 1번(벽)은 방 자체, 2번(책상)은 그려진 책상으로 표현하고 나머지는 이모지 오브젝트.
 */
export function OfficeRoom({ done, highlight, small = false }: { done: Set<number>; highlight?: number; small?: boolean }) {
  const hasWall = done.has(0);
  return (
    <div className={`office ${hasWall ? 'office-walled' : 'office-empty'} ${small ? 'office-small' : ''}`}>
      {!hasWall && <div className="office-hint">🧱 벽을 세우면 사무실이 생겨요</div>}
      {hasWall && <div className="office-floor" />}
      {done.has(1) && (
        <div className={`office-desk ${highlight === 1 ? 'pop' : ''}`} aria-label="책상">
          <div className="office-desk-top" />
        </div>
      )}
      {WORK_ITEMS.map((item, i) => {
        if (i < 2 || !done.has(i)) return null;
        return (
          <span
            key={item.day}
            className={`office-obj ${highlight === i ? 'pop' : ''}`}
            style={{ left: `${item.pos.x}%`, top: `${item.pos.y}%`, fontSize: `${item.pos.size}em` }}
            title={item.name}
          >
            {item.emoji}
          </span>
        );
      })}
    </div>
  );
}
