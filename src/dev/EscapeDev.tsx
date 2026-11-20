/** 개발용: ?escape&ep=copier&species=..&color=.. 로 퇴근 탈출 한 편을 바로 연다 */
import { lazy, Suspense, useState } from 'react';
import { DEFAULT_CUSTOM } from '../domain/customization';
import { ESCAPE_IDS, type EscapeId } from '../domain/escape';
import type { Customization } from '../domain/types';

const EscapeCinema = lazy(() => import('../components/escape/EscapeCinema').then((m) => ({ default: m.EscapeCinema })));

export function EscapeDev() {
  const p = new URLSearchParams(location.search);
  const me: Customization = {
    ...DEFAULT_CUSTOM,
    species: (p.get('species') as Customization['species']) || 'hamster',
    color: (p.get('color') as Customization['color']) || 'golden',
    outfit: (p.get('outfit') as Customization['outfit']) || 'tie',
  };
  const [ep, setEp] = useState<EscapeId>((p.get('ep') as EscapeId) || 'sideways');
  const [n, setN] = useState(0);
  const [open, setOpen] = useState(true);
  return open ? (
    <Suspense>
      <EscapeCinema key={`${ep}-${n}`} custom={me} episode={ep} onDone={() => setOpen(false)} />
    </Suspense>
  ) : (
    <div style={{ display: 'grid', gap: 8, padding: 20 }}>
      {ESCAPE_IDS.map((id) => (
        <button key={id} onClick={() => { setEp(id); setN((x) => x + 1); setOpen(true); }}>{id}</button>
      ))}
    </div>
  );
}
