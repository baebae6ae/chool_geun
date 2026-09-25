import { HamsterSprite, type FrontAction, type SideAction } from '../components/hamster/HamsterSprite';
import { DEFAULT_CUSTOM } from '../domain/customization';
import type { Customization } from '../domain/types';

const FRONT: FrontAction[] = ['idle', 'sniff', 'groom', 'nibble', 'yawn', 'sip', 'look', 'type', 'typeFast', 'wave'];
const SIDE: SideAction[] = ['stand', 'walk', 'run', 'sleep'];

/** 개발용: `?gallery` 로 모든 자세를 한눈에 본다 */
export function Gallery() {
  const params = new URLSearchParams(location.search);
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
