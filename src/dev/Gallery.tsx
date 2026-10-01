import { HamsterSprite, type FrontAction, type SideAction } from '../components/hamster/HamsterSprite';
import { DEFAULT_CUSTOM } from '../domain/customization';
import type { Customization } from '../domain/types';
import { EventIcon } from '../components/EventIcon';
import { GACHA_EVENTS } from '../domain/gacha';
import { RARE_BEHAVIORS } from '../domain/rare';

const FRONT: FrontAction[] = ['idle', 'sniff', 'groom', 'nibble', 'yawn', 'sip', 'look', 'type', 'typeFast', 'wave', 'stuff', 'sneeze', 'doze', 'dizzy', 'dance'];
const SIDE: SideAction[] = ['stand', 'walk', 'run', 'sleep'];

/** 개발용: `?gallery` 로 모든 자세를 한눈에 본다 */
export function Gallery() {
  const params = new URLSearchParams(location.search);
  if (params.has('icons')) return <IconSheet />;
  const size = Number(params.get('size') || 220);
  const custom: Customization = {
    ...DEFAULT_CUSTOM,
    color: (params.get('color') as Customization['color']) || 'golden',
    outfit: (params.get('outfit') as Customization['outfit']) || 'none',
    hat: (params.get('hat') as Customization['hat']) || 'none',
    glasses: params.has('glasses'),
  };
  const only = params.get('only');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 12, background: '#faf6ef' }}>
      {FRONT.filter((a) => !only || only === a).map((a) => (
        <figure key={a} id={`f-${a}`} style={{ margin: 0, width: size, height: size }}>
          <HamsterSprite custom={custom} pose={{ pose: 'front', action: a }} />
          <figcaption style={{ fontSize: 12, textAlign: 'center' }}>{a}</figcaption>
        </figure>
      ))}
      {SIDE.filter((a) => !only || only === a).map((a) => (
        <figure key={a} id={`s-${a}`} style={{ margin: 0, width: size * 1.17, height: size * 0.83 }}>
          <HamsterSprite custom={custom} pose={{ pose: 'side', action: a }} />
          <figcaption style={{ fontSize: 12, textAlign: 'center' }}>{a}</figcaption>
        </figure>
      ))}
    </div>
  );
}

/** ?gallery&icons — 도감 이벤트 아이콘 전체 보기 */
function IconSheet() {
  const all = [...GACHA_EVENTS.map((e) => ({ id: e.id, emoji: e.emoji, name: e.name })), ...RARE_BEHAVIORS.map((r) => ({ id: r.id, emoji: r.emoji, name: r.name }))];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 10, padding: 12, background: '#fdf5e8', width: 1000 }}>
      {all.map((e) => (
        <div key={e.id} style={{ textAlign: 'center', fontSize: 12 }}>
          <div className="dex-emoji" style={{ fontSize: 64 }}>
            <EventIcon id={e.id} emoji={e.emoji} />
          </div>
          {e.id} {e.name}
        </div>
      ))}
    </div>
  );
}
