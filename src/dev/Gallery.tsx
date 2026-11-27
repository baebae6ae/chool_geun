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
import { OfficeRoom } from '../components/OfficeRoom';
import { RARE_BEHAVIORS } from '../domain/rare';
import { MedalSheet } from './MedalSheet';
import { Habitat } from '../components/habitat/Habitat';
import { HOUSE_LEVELS } from '../components/habitat/House';
import { ClockOutModal } from '../components/Modals';
import { setDiary } from '../domain/diary';
import type { AppState, DailyWork } from '../domain/types';
import { DeskFront, SeasonDecor } from '../components/habitat/props';

const FRONT: FrontAction[] = ['idle', 'sniff', 'groom', 'nibble', 'yawn', 'sip', 'look', 'type', 'typeFast', 'wave', 'stuff', 'sneeze', 'doze', 'dizzy', 'dance', 'cheer', 'heart', 'shy', 'hug', 'doom', 'meal', 'game', 'phone', 'read', 'shower', 'snack', 'smug', 'tongue', 'shrug', 'slowclap', 'phoneShow', 'earplug', 'phoneToss', 'hipsway', 'blowkiss', 'slam', 'cider', 'ahh', 'shock', 'cry', 'quake', 'rotten', 'resolve', 'headhold', 'kneel', 'soul', 'think', 'aha', 'tug', 'poke'];
const SIDE: SideAction[] = ['stand', 'walk', 'run', 'sleep'];

/** 개발용: `?gallery` 로 모든 자세를 한눈에 본다 */
export function Gallery() {
  const params = new URLSearchParams(location.search);
  if (params.has('medals')) return <MedalSheet />;
  if (params.has('icons')) return <IconSheet />;
  if (params.has('cards')) return <CardSheet />;
  if (params.has('gear')) return <GearSheet />;
  if (params.has('newseason')) return <NewSeasonSheet />;
  if (params.has('diary')) return <DiaryPreview />;
  // ?gallery&house — 집 꾸미기 9단계
  if (params.has('house')) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: 10, width: 1180, background: '#faf6ef' }}>
        {HOUSE_LEVELS.map((l, i) => (
          <figure key={i} style={{ margin: 0, width: 380 }}>
            <Habitat custom={{ ...DEFAULT_CUSTOM, outfit: 'tie' }} mood="working" name={`${i + 1}단계 · ${l.name} (${l.at}일)`} now={new Date('2026-11-27T14:00:00').getTime()} house={i + 1} />
          </figure>
        ))}
      </div>
    );
  }
  // ?gallery&vibe=monday|friday — 요일 분위기 방
  if (params.has('vibe')) {
    const v = params.get('vibe');
    return (
      <div style={{ width: 390, padding: 16, background: '#faf6ef' }}>
        <Habitat custom={{ ...DEFAULT_CUSTOM, outfit: 'tie' }} mood="working" name="햄찌" now={Date.now()} vibe={v === 'monday' || v === 'friday' ? v : null} />
      </div>
    );
  }
  // ?gallery&room=5 — 그 시즌 방을 작업물 전부 완성한 모습으로
  if (params.has('room')) return <div style={{ width: 360, padding: 12 }}><OfficeRoom season={Number(params.get('room'))} done={new Set(Array.from({ length: 20 }, (_, i) => i))} /></div>;
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

/** ?gallery&newseason — 새해·설날 한정 아이템 확인 */
function NewSeasonSheet() {
  const base = { ...DEFAULT_CUSTOM, outfit: 'none' as const };
  const looks: [string, Customization][] = [
    ['고깔모자', { ...base, hat: 'partyhat' }],
    ['해돋이 머리띠', { ...base, hat: 'sunband' }],
    ['어깨띠', { ...base, outfit: 'sash' }],
    ['복건+한복', { ...base, hat: 'bokgeon', outfit: 'hanbok' }],
    ['한복', { ...base, outfit: 'hanbok' }],
  ];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: 10, background: '#fdf5e8', width: 960 }}>
      {looks.map(([l, c]) => (
        <figure key={l} style={{ margin: 0, width: 180, textAlign: 'center', fontSize: 12 }}>
          <div style={{ width: 180, height: 180 }}><HamsterSprite custom={c} pose={{ pose: 'front', action: 'idle' }} still /></div>
          <div style={{ width: 180, height: 130 }}><HamsterSprite custom={c} pose={{ pose: 'side', action: 'stand' }} still /></div>
          {l}
        </figure>
      ))}
      {(['tteokguk', 'bokjumeoni', 'kite'] as const).map((d) => (
        <div key={d} style={{ position: 'relative', width: 200, height: 150, background: '#f3e6d0' }}>
          <DeskFront x={100} custom={{ ...base, deco: d }} />
        </div>
      ))}
      {(['newyear', 'seollal'] as const).map((id) => (
        <div key={id} style={{ position: 'relative', width: 420, height: 80, background: '#f6ead6' }}>
          <SeasonDecor id={id} W={420} />
        </div>
      ))}
    </div>
  );
}

/** ?gallery&diary — 퇴근 카드의 한 줄 일기 */
function DiaryPreview() {
  const base = { date: '2026-11-27', season: 1, workItemIndex: 3, schedule: { workStart: '09:00', workEnd: '18:00', lunchStart: '12:00', lunchEnd: '13:00' }, hourly: 12000, openedAt: 0, endTime: 0, progress: 1, completed: true, clockedOut: true, early: false, earned: 96000, workedMs: 8 * 3600e3, gacha: [], comment: '', celebrated: false } as unknown as DailyWork;
  const [st, setSt] = useState({ days: { [base.date]: base } } as unknown as AppState);
  return <ClockOutModal day={st.days[base.date]} custom={DEFAULT_CUSTOM} onClose={() => {}} onRecord={() => {}} onDiary={(p) => setSt((s) => setDiary(s, base.date, p))} />;
}
