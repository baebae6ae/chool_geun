/** 개발용: ?theater=<썰 id>&species=..&color=.. 로 썰 극장을 바로 연다 */
import { useState } from 'react';
import { Theater } from '../components/theater/Theater';
import { DEFAULT_CUSTOM } from '../domain/customization';
import { STORIES } from '../domain/theater';
import type { Customization } from '../domain/types';

export function TheaterDev() {
  const p = new URLSearchParams(location.search);
  const story = STORIES.find((s) => s.id === p.get('theater')) ?? STORIES[0];
  const me: Customization = {
    ...DEFAULT_CUSTOM,
    species: (p.get('species') as Customization['species']) || 'hamster',
    color: (p.get('color') as Customization['color']) || 'golden',
    outfit: 'tie',
  };
  const [open, setOpen] = useState(true);
  return open ? <Theater story={story} me={me} onClose={() => setOpen(false)} /> : <button onClick={() => setOpen(true)}>다시 열기</button>;
}
