/** 개발용: ?payday&total=2918960&species=..&color=.. 로 월급날 연출을 바로 연다 */
import { useState } from 'react';
import { PaydayCinema } from '../components/payday/PaydayCinema';
import { DEFAULT_CUSTOM } from '../domain/customization';
import type { Customization } from '../domain/types';

export function PaydayDev() {
  const p = new URLSearchParams(location.search);
  const me: Customization = {
    ...DEFAULT_CUSTOM,
    species: (p.get('species') as Customization['species']) || 'hamster',
    color: (p.get('color') as Customization['color']) || 'golden',
    outfit: 'tie',
  };
  const [n, setN] = useState(0);
  const [open, setOpen] = useState(true);
  return open ? (
    <PaydayCinema key={n} custom={me} total={Number(p.get('total') ?? 2_918_960)} dateKey={p.get('date') ?? '2026-11-25'} onDone={() => setOpen(false)} />
  ) : (
    <button onClick={() => { setN((x) => x + 1); setOpen(true); }}>다시 보기</button>
  );
}
