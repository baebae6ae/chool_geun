import type { WorkItem } from '../domain/workItems';

/** 책상은 이모지가 없어서(🪑는 의자) 직접 그린 아이콘을 쓴다. 나머지는 이모지 그대로. */
function Desk() {
  return (
    <svg className="item-svg" viewBox="0 0 48 40" role="img" aria-label="책상">
      <rect x="6" y="19" width="5" height="19" rx="2" fill="#b07a4c" />
      <rect x="37" y="19" width="5" height="19" rx="2" fill="#b07a4c" />
      <rect x="11" y="30" width="26" height="3" rx="1.5" fill="#c9966a" />
      <rect x="9" y="22" width="30" height="8" rx="2" fill="#c08a5b" />
      <rect x="22" y="25" width="4" height="2.4" rx="1.2" fill="#8d5d36" />
      <rect x="2" y="13" width="44" height="8" rx="3" fill="#dba66f" />
      <rect x="2" y="18.5" width="44" height="2.5" rx="1.2" fill="#b8804f" />
      <rect x="6" y="14.6" width="14" height="1.6" rx="0.8" fill="#f0c898" opacity=".8" />
    </svg>
  );
}

export function ItemIcon({ item }: { item: Pick<WorkItem, 'emoji' | 'name'> }) {
  if (item.name === '책상') return <Desk />;
  return <>{item.emoji}</>;
}
