import { useEffect, useState } from 'react';
import { COMPOSITIONS, drawLook, renderCard } from '../shareCard';
import { HamsterSprite, type FrontAction, type Pose, type SideAction } from '../components/hamster/HamsterSprite';
import { HANDS, HATS, OUTFITS } from '../domain/customization';
import { DEFAULT_CUSTOM } from '../domain/customization';
import type { Customization } from '../domain/types';
import { EventIcon } from '../components/EventIcon';
import { ItemIcon } from '../components/ItemIcon';
import { SEASONS } from '../domain/workItems';
import { GACHA_EVENTS, HOLIDAY_EVENTS } from '../domain/gacha';
import { RARE_BEHAVIORS } from '../domain/rare';

const FRONT: FrontAction[] = ['idle', 'sniff', 'groom', 'nibble', 'yawn', 'sip', 'look', 'type', 'typeFast', 'wave', 'stuff', 'sneeze', 'doze', 'dizzy', 'dance', 'cheer', 'heart', 'shy', 'hug', 'doom', 'meal', 'game', 'phone', 'read', 'shower', 'snack'];
const SIDE: SideAction[] = ['stand', 'walk', 'run', 'sleep'];

/** 개발용: `?gallery` 로 모든 자세를 한눈에 본다 */
export function Gallery() {
  const params = new URLSearchParams(location.search);
  if (params.has('icons')) return <IconSheet />;
  if (params.has('cards')) return <CardSheet />;
  if (params.has('gear')) return <GearSheet />;
  const size = Number(params.get('size') || 220);
  const custom: Customization = {
    ...DEFAULT_CUSTOM,
    species: (params.get('species') as Customization['species']) || 'hamster',
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
  const which = new URLSearchParams(location.search).get('icons');
  const items = which === 'items';
  const all = which === 'holiday'
    ? HOLIDAY_EVENTS.map((e) => ({ id: e.id, emoji: e.emoji, name: e.name }))
    : items
    ? SEASONS.flatMap((s) => s.items.map((i) => ({ id: i.name, emoji: i.emoji, name: i.name })))
    : [...GACHA_EVENTS.map((e) => ({ id: e.id, emoji: e.emoji, name: e.name })), ...RARE_BEHAVIORS.map((r) => ({ id: r.id, emoji: r.emoji, name: r.name }))];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: 10, padding: 12, background: '#fdf5e8', width: 1200 }}>
      {all.map((e) => (
        <div key={e.id} style={{ textAlign: 'center', fontSize: 12 }}>
          <div className="dex-emoji" style={{ fontSize: 64 }}>
            {items ? <ItemIcon item={{ emoji: e.emoji, name: e.name }} /> : <EventIcon id={e.id} emoji={e.emoji} />}
          </div>
          {items ? e.name : `${e.id} ${e.name}`}
        </div>
      ))}
    </div>
  );
}

/** ?gallery&cards — 공유 카드 구도 전체 보기 */
function CardSheet() {
  const [urls, setUrls] = useState<{ label: string; url: string }[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const out: { label: string; url: string }[] = [];
      for (let i = 0; i < COMPOSITIONS.length; i++) {
        const look = drawLook('2026-10-02', 0);
        const comp = COMPOSITIONS[i];
        const theme = drawLook('2026-10-0' + (i % 9), 3).theme;
        const blob = await renderCard({
          custom: { ...DEFAULT_CUSTOM },
          comp,
          theme,
          decor: look.decor,
          seed: i + 1,
          dateText: '10월 2일 금요일',
          nameTag: '햄찌 · 신입 햄스터',
          chips: ['출근 12일째', '월급날 D-21'],
          quote: '금요일엔 마음이 이미 주말에 가 있어요.',
        });
        out.push({ label: comp.label, url: URL.createObjectURL(blob) });
        if (!alive) return;
        setUrls([...out]);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, padding: 10, background: '#fdf5e8', width: 1300 }}>
      {urls.map((u) => (
        <figure key={u.label} style={{ margin: 0, textAlign: 'center', fontSize: 12 }}>
          <img src={u.url} alt={u.label} style={{ width: '100%', borderRadius: 8 }} />
          {u.label}
        </figure>
      ))}
    </div>
  );
}

/** ?gallery&gear — 사무용품 착용 아이템 전체 보기 */
function GearSheet() {
  const base = { ...DEFAULT_CUSTOM, outfit: 'none' as const };
  const cell = (key: string, label: string, custom: Customization, pose: Pose) => (
    <figure key={key} style={{ margin: 0, width: 150, textAlign: 'center', fontSize: 12 }}>
      <div style={{ width: 150, height: pose.pose === 'side' ? 110 : 150 }}>
        <HamsterSprite custom={custom} pose={pose} still />
      </div>
      {label}
    </figure>
  );
  const f = (a: FrontAction): Pose => ({ pose: 'front', action: a });
  const out: React.ReactNode[] = [];
  HATS.forEach((h) => out.push(cell('h' + h.id, '머리 ' + h.label, { ...base, hat: h.id }, f('idle'))));
  OUTFITS.forEach((o) => out.push(cell('o' + o.id, '몸 ' + o.label, { ...base, outfit: o.id }, f('idle'))));
  HANDS.forEach((o) => out.push(cell('n' + o.id, '손 ' + o.label, { ...base, hand: o.id }, f('idle'))));
  const mix: [string, Customization][] = [
    ['포스트잇+뽁뽁이', { ...base, hat: 'postit', outfit: 'bubble', hand: 'pencil' }],
    ['스테이플러+상자', { ...base, hat: 'stapler', outfit: 'box', hand: 'calculator' }],
    ['마우스+사원증', { ...base, hat: 'mouse', outfit: 'badge', hand: 'stamp' }],
  ];
  mix.forEach(([l, c]) => {
    out.push(cell('m' + l, l, c, f('idle')));
    out.push(cell('s' + l, l + ' (옆)', c, { pose: 'side', action: 'stand' }));
  });
  HATS.forEach((h) => out.push(cell('z' + h.id, '자는 ' + h.label, { ...base, hat: h.id }, { pose: 'side', action: 'sleep' })));
  return <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 10, background: '#fdf5e8', width: 1260 }}>{out}</div>;
}
