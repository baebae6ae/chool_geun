import type { WorkItem } from '../domain/workItems';
import { hasItemIcon, ITEM_ICONS } from './itemIcons';

/** 작업물 그림: 직접 그린 아이콘이 있으면 그것을, 없으면 이모지를 쓴다. */
export function ItemIcon({ item }: { item: Pick<WorkItem, 'emoji' | 'name'> }) {
  return <>{hasItemIcon(item.name) ? ITEM_ICONS[item.name] : item.emoji}</>;
}
