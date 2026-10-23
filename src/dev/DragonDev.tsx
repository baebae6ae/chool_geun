/** 개발용: ?dragon&ending=fact&species=.. 로 드래곤 변신을 바로 연다 (엔딩을 골라 볼 수 있다) */
import { useState } from 'react';
import { Dragon } from '../components/dragon/Dragon';
import { DEFAULT_CUSTOM } from '../domain/customization';
import { planDragon } from '../domain/dragon';
import type { Customization } from '../domain/types';

export function DragonDev() {
  const p = new URLSearchParams(location.search);
  const ending = p.get('ending');
  let seed = p.get('seed') ?? 'dev';
  if (ending) for (let i = 0; i < 500 && planDragon(seed).ending !== ending; i++) seed = `dev-${i}`;
  const me: Customization = {
    ...DEFAULT_CUSTOM,
    species: (p.get('species') as Customization['species']) || 'hamster',
    color: (p.get('color') as Customization['color']) || 'golden',
    outfit: 'tie',
  };
  const [open, setOpen] = useState(true);
  return open ? <Dragon me={me} seed={seed} reality="퇴근까지 3시간 59분 남았습니다" onClose={() => setOpen(false)} /> : <button onClick={() => setOpen(true)}>다시 열기</button>;
}
