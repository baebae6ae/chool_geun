/**
 * 월급날 다이어리 2쪽, 새 편 다섯 개. 1쪽(월급 들어온 날!!!)은 PaydayCinema가 그리고,
 * 여기서는 u(2쪽 시작부터 흐른 초)에 맞춰 2쪽만 그린다. 효과음 시간표도 편마다 같이 둔다 (u 기준).
 */
import type { FrontAction } from '../hamster/HamsterSprite';
import type { Customization } from '../../domain/types';
import { LEFTOVERS, PILE, splitPay, type Cue, type PaydayId } from '../../domain/paydayCinema';
import { Balance, Burst, back, Coins, eio, ei, eo, flyCoin, Ham, Heading, INK, lerp, Note, seg, Shadow, won, type Coin } from './kit';

export interface EpProps {
  u: number;
  custom: Customization;
  total: number;
  date: string;
}

export interface Episode {
  Page: (p: EpProps) => React.ReactElement;
  cues: (total: number) => Cue[];
}

/** 동전 더미를 dx만큼 옮겨서, 위 줄부터 i번째 동전의 자리 */
const pileTop = (i: number, dx: number): [number, number] => {
  const [x, y] = PILE[PILE.length - 1 - i];
  return [x + dx, y];
};
const N = PILE.length;

/* ---------------- 장바구니 편 ---------------- */
const CART_TAPS = [0.9, 1.4, 1.85, 2.25, 2.6, 2.9];
const CART_ITEMS = ['패딩', '이어폰', '간식', '키보드', '화분', '???'];
const CART_SLOTS: [number, number][] = [[125, 980], [252, 980], [188, 878], [128, 776], [248, 776], [190, 674]];
const CART_END = 4.7;
const CART_COLORS = ['#d9a86c', '#e3b77c', '#cf9c5e', '#dcae73', '#d4a265', '#e8c08a'];

function Cart({ u, custom, total, date }: EpProps) {
  const leftover = LEFTOVERS.cart;
  const amounts = splitPay(total, leftover, [0.3, 0.2, 0.12, 0.15, 0.08, 0.15]);
  const landed = CART_TAPS.filter((t) => u >= t + 0.45).length;
  const spentWon = amounts.slice(0, landed).reduce((a, b) => a + b, 0);
  const tapping = u >= 0.8 && u < 3.3;
  const action: FrontAction = u < 0.8 ? 'phone' : tapping ? 'typeFast' : u < CART_END ? 'heart' : u < 5.7 ? 'shock' : 'soul';
  const press = Math.max(0, ...CART_TAPS.map((t) => 1 - seg(u, t, t + 0.14)).map((k, i) => (u >= CART_TAPS[i] ? k : 0)));
  const shake = CART_TAPS.some((t) => u > t + 0.45 && u < t + 0.6) ? Math.sin(u * 130) * 5 : 0;
  return (
    <>
      <Heading u={u} date={date} text="장바구니를 열었다…" />
      {/* 폰 */}
      <svg className="pc-layer" width="720" height="1280">
        <g transform={`rotate(4 540 420)`}>
          <rect x="430" y="250" width="220" height="360" rx="30" fill="#fff" stroke={INK} strokeWidth="6" />
          <rect x="452" y="290" width="176" height="270" rx="10" fill="#f4f7fb" stroke={INK} strokeWidth="3" />
          <path d="M470 330 h70 M470 368 h110 M470 406 h90 M470 444 h120" stroke="#b9c3d6" strokeWidth="10" strokeLinecap="round" />
          <g transform={`translate(540 512) scale(${1 - 0.12 * press})`}>
            <rect x="-74" y="-28" width="148" height="56" rx="14" fill="#e0533d" stroke={INK} strokeWidth="4" />
          </g>
        </g>
      </svg>
      <div className="pc-hand" style={{ left: 488, top: 486, fontSize: 34, color: '#fff', transform: `rotate(4deg) scale(${1 - 0.12 * press})` }}>결제!</div>
      {CART_TAPS.map((t, i) => {
        const k = seg(u, t, t + 0.6);
        if (k <= 0 || k >= 1) return null;
        return (
          <div key={i} className="pc-hand" style={{ left: 470 + (i % 2) * 24, top: 420 - eo(k) * 120, fontSize: 30, color: '#1f9a5c', opacity: 1 - ei(k) }}>
            -{won(amounts[i])}
          </div>
        );
      })}
      <Shadow x={470} y={980} />
      <Ham custom={custom} action={action} x={470} y={980} sy={action === 'heart' ? 1 + 0.03 * Math.sin(u * 9) : 1} />
      {/* 택배 상자: 누를 때마다 하나씩 쿵 */}
      {CART_TAPS.map((t, i) => {
        const k = seg(u, t + 0.1, t + 0.45);
        if (k <= 0) return null;
        const [x, y] = CART_SLOTS[i];
        const by = lerp(-160, y, ei(k));
        const land = u - t - 0.45;
        const sq = land > 0 ? Math.exp(-land * 10) * Math.cos(land * 30) : 0;
        return (
          <div key={i} className="pc-bill" style={{ left: x - 62 + shake * (i < landed ? 1 : 0), top: by - 100, width: 124, height: 100, background: 'transparent', transformOrigin: '50% 100%', transform: `rotate(${((i % 3) - 1) * 3}deg) scale(${1 + 0.12 * sq},${1 - 0.15 * sq})` }}>
            <svg width="124" height="100" style={{ position: 'absolute', overflow: 'visible' }}>
              <rect x="3" y="3" width="118" height="94" rx="6" fill={CART_COLORS[i]} stroke={INK} strokeWidth="5" />
              <path d="M62 3 v94" stroke="#f1dcb5" strokeWidth="14" />
              <rect x="22" y="48" width="80" height="34" rx="4" fill="#fff" stroke={INK} strokeWidth="3" />
            </svg>
            <div className="pc-hand" style={{ left: 0, width: 124, top: 50, fontSize: 24, textAlign: 'center' }}>{CART_ITEMS[i]}</div>
          </div>
        );
      })}
      <Balance u={u} total={total} leftover={leftover} spent={spentWon / Math.max(1, total - leftover)} reveal={CART_END} />
      <Note u={u} at={5.4} x={50} y={420} text="그래도 설레…♡" size={42} />
    </>
  );
}

const cartCues = (): Cue[] => [
  { at: 0, sfx: 'pen', dur: 0.6 },
  { at: 0.45, sfx: 'pen', dur: 0.45 },
  ...CART_TAPS.flatMap((t): Cue[] => [{ at: t, sfx: 'pop' }, { at: t + 0.45, sfx: 'pthud' }]),
  { at: 3.5, sfx: 'twinkle' },
  { at: CART_END, sfx: 'scribble', dur: 0.5 },
  { at: CART_END + 0.15, sfx: 'sad' },
  { at: 5.4, sfx: 'pen', dur: 0.6 },
];

/* ---------------- 스쳐 가는 월급 편 ---------------- */
const BREEZE_END = 4.3;
const BREEZE_BILLS = [0, 1, 2, 3, 4].map((i) => ({ t0: 1.2 + i * 0.45, y: 330 + ((i * 173) % 380), rot: 14 + i * 9 }));

function Breeze({ u, custom, total, date }: EpProps) {
  const leftover = LEFTOVERS.breeze;
  const blowing = u > 0.8 && u < 3.8;
  const gust = seg(u, 0.8, 1.2) * (1 - seg(u, 3.4, 3.9));
  const action: FrontAction = u < 0.8 ? 'idle' : u < 3.9 ? 'shock' : 'soul';
  const coins: Coin[] = [];
  for (let i = 0; i < N; i++) {
    const [x, y] = pileTop(i, 0);
    const t0 = 1.0 + i * 0.14;
    const k = seg(u, t0, t0 + 0.75);
    if (k <= 0) coins.push({ x, y, ry: 18, fill: 1 });
    else if (k < 1) coins.push({ x: x + ei(k) * 700, y: y - Math.sin(k * Math.PI) * (160 + (i % 4) * 50) - k * 120, ry: 18 * Math.abs(Math.cos(k * 16)), fill: 1 });
  }
  return (
    <>
      <Heading u={u} date={date} text="월급이 지나갑니다~" />
      {/* 바람 줄 */}
      {blowing && (
        <svg className="pc-layer" width="720" height="1280">
          <g fill="none" stroke="#9ab8d6" strokeWidth="6" strokeLinecap="round" opacity={gust}>
            {[...Array(8)].map((_, i) => {
              const ph = ((u * 1.6 + i * 0.37) % 1) * 1300 - 300;
              const y = 290 + i * 88;
              return <path key={i} d={`M${ph} ${y} q60 -26 120 0 t120 0`} />;
            })}
          </g>
        </svg>
      )}
      <Shadow x={360} y={900} />
      <Ham custom={custom} action={action} x={360 + (blowing ? Math.sin(u * 40) * 3 * gust : 0)} y={900} rot={-9 * gust} sx={1 + 0.05 * gust} sy={1 - 0.04 * gust} />
      <Coins list={coins} />
      {/* 지폐도 날아간다 */}
      {BREEZE_BILLS.map((b, i) => {
        const k = seg(u, b.t0, b.t0 + 1.1);
        if (k <= 0 || k >= 1) return null;
        return (
          <div key={i} className="pc-bill" style={{ left: lerp(-200, 820, k), top: b.y + Math.sin(k * 9) * 40, width: 150, height: 74, background: 'transparent', transform: `rotate(${b.rot + k * 260}deg) scaleY(${0.6 + 0.4 * Math.abs(Math.cos(k * 8))})` }}>
            <svg width="150" height="74" style={{ position: 'absolute' }}>
              <rect x="3" y="3" width="144" height="68" rx="6" fill="#bfe3c4" stroke={INK} strokeWidth="4" />
              <circle cx="75" cy="37" r="18" fill="none" stroke="#3f8f57" strokeWidth="4" />
              <path d="M66 30 l9 16 l9 -16 M64 37 h22" fill="none" stroke="#3f8f57" strokeWidth="3" />
            </svg>
          </div>
        );
      })}
      <Balance u={u} total={total} leftover={leftover} spent={eo(seg(u, 1.0, 3.6))} reveal={BREEZE_END} />
      <Note u={u} at={5.3} x={70} y={520} text="…안녕" size={50} rot={-8} />
    </>
  );
}

const breezeCues = (): Cue[] => [
  { at: 0, sfx: 'pen', dur: 0.6 },
  { at: 0.45, sfx: 'pen', dur: 0.45 },
  { at: 0.8, sfx: 'wind', dur: 3.1 },
  ...[1.2, 1.65, 2.1, 2.55, 3.0].map((at): Cue => ({ at, sfx: 'rustle', dur: 0.4 })),
  ...[1.1, 1.6, 2.2, 2.8].map((at): Cue => ({ at, sfx: 'clink' })),
  { at: 3.5, sfx: 'whoosh', dur: 0.4 },
  { at: BREEZE_END, sfx: 'scribble', dur: 0.5 },
  { at: BREEZE_END + 0.15, sfx: 'sad' },
  { at: 5.3, sfx: 'pen', dur: 0.5 },
];

/* ---------------- 자동이체 열차 편 ---------------- */
const TRAIN_CARS = [
  { name: '카드값', color: '#e0533d' },
  { name: '월세', color: '#3b7be2' },
  { name: '보험', color: '#e8a23a' },
  { name: '통신비', color: '#2fa463' },
  { name: '구독료', color: '#9a5bd6' },
];
const TRACK = 610;
const CAR_W = 104;
const ENGINE_W = 150;
const TRAIN_END = 5.0;
const coinT0 = (i: number) => 2.2 + i * 0.09;

function trainX(u: number) {
  if (u < 2.0) return lerp(780, 0, eo(seg(u, 0.4, 2.0)));
  return -1500 * ei(seg(u, 3.95, 5.2));
}

function Train({ u, custom, total, date }: EpProps) {
  const leftover = LEFTOVERS.train;
  const ox = trainX(u) + 10;
  const moving = (u > 0.4 && u < 2.0) || u > 3.95;
  const bob = moving ? Math.abs(Math.sin(u * 22)) * 3 : 0;
  const carX = (c: number) => ox + ENGINE_W + 8 + c * (CAR_W + 8);
  const inCar = [0, 0, 0, 0, 0];
  const coins: Coin[] = [];
  for (let i = 0; i < N; i++) {
    const from = pileTop(i, -120);
    const c = i % 5;
    const k = seg(u, coinT0(i), coinT0(i) + 0.45);
    if (k <= 0) coins.push({ x: from[0], y: from[1], ry: 18, fill: 1 });
    else if (k < 1) coins.push(flyCoin(from, [carX(c) + CAR_W / 2, TRACK - 70], k, 220));
    else inCar[c]++;
  }
  const landed = inCar.reduce((a, b) => a + b, 0);
  const action: FrontAction = u < 2.1 ? 'look' : u < 3.7 ? 'shock' : u < 5.3 ? 'wave' : 'cry';
  const puff = (n: number) => {
    const ph = (u * 2.2 + n * 0.33) % 1;
    return { x: ox + 40 - ph * 60 * (u > 3.95 ? -1 : 1), y: TRACK - 150 - ph * 110, r: 14 + ph * 22, o: (1 - ph) * (moving ? 0.9 : 0.35) };
  };
  return (
    <>
      <Heading u={u} date={date} text="자동이체 열차 출발~" />
      <svg className="pc-layer" width="720" height="1280">
        <path d={`M-40 ${TRACK + 22} H760`} stroke={INK} strokeWidth="5" />
        {[...Array(16)].map((_, i) => <path key={i} d={`M${i * 50 - 20} ${TRACK + 22} v14`} stroke={INK} strokeWidth="4" strokeLinecap="round" />)}
        {[0, 1, 2].map((n) => { const p = puff(n); return <circle key={n} cx={p.x} cy={p.y} r={p.r} fill="#fff" stroke={INK} strokeWidth="3" opacity={p.o} />; })}
        <g transform={`translate(0 ${-bob})`}>
          {/* 기관차 */}
          <g transform={`translate(${ox} 0)`}>
            <rect x="0" y={TRACK - 80} width={ENGINE_W} height="80" rx="12" fill="#5d6b84" stroke={INK} strokeWidth="5" />
            <rect x="70" y={TRACK - 140} width="74" height="66" rx="8" fill="#7d8aa3" stroke={INK} strokeWidth="5" />
            <rect x="86" y={TRACK - 126} width="42" height="30" rx="4" fill="#fff6c9" stroke={INK} strokeWidth="3" />
            <rect x="26" y={TRACK - 124} width="26" height="46" fill="#5d6b84" stroke={INK} strokeWidth="5" />
            <path d={`M-12 ${TRACK - 6} l16 -22 v22z`} fill="#e0533d" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
            {[30, 110].map((x) => <circle key={x} cx={x} cy={TRACK + 4} r="16" fill="#fff" stroke={INK} strokeWidth="5" />)}
          </g>
          {TRAIN_CARS.map((c, i) => {
            const x = carX(i);
            return (
              <g key={c.name}>
                <path d={`M${x - 8} ${TRACK - 30} h8`} stroke={INK} strokeWidth="5" />
                {[...Array(inCar[i])].map((_, n) => <ellipse key={n} cx={x + 22 + (n % 3) * 30} cy={TRACK - 84 - Math.floor(n / 3) * 10} rx="16" ry="9" fill="#f6c443" stroke={INK} strokeWidth="3" />)}
                <rect x={x} y={TRACK - 80} width={CAR_W} height="80" rx="8" fill="#fff" stroke={INK} strokeWidth="5" />
                <rect x={x + 4} y={TRACK - 76} width={CAR_W - 8} height="18" fill={c.color} />
                {[x + 24, x + CAR_W - 24].map((wx) => <circle key={wx} cx={wx} cy={TRACK + 4} r="14" fill="#fff" stroke={INK} strokeWidth="5" />)}
              </g>
            );
          })}
        </g>
      </svg>
      {TRAIN_CARS.map((c, i) => (
        <div key={c.name} className="pc-hand" style={{ left: carX(i), width: CAR_W, top: TRACK - 56 - bob, fontSize: 26, color: c.color, textAlign: 'center' }}>{c.name}</div>
      ))}
      <Shadow x={520} y={970} />
      <Ham custom={custom} action={action} x={520} y={970} sy={action === 'cry' ? 1 - 0.03 * Math.abs(Math.sin(u * 4)) : 1} />
      <Coins list={coins} />
      <Balance u={u} total={total} leftover={leftover} spent={landed / N} reveal={TRAIN_END} />
      <Note u={u} at={5.5} x={60} y={760} text="잘 가… 또 와…" size={42} rot={-5} />
    </>
  );
}

const trainCues = (): Cue[] => [
  { at: 0, sfx: 'pen', dur: 0.6 },
  { at: 0.2, sfx: 'chime' },
  { at: 0.45, sfx: 'pen', dur: 0.45 },
  ...[0.5, 0.8, 1.1, 1.4, 1.7].map((at): Cue => ({ at, sfx: 'rattle' })),
  { at: 2.0, sfx: 'thump' },
  ...[...Array(N)].map((_, i): Cue => ({ at: coinT0(i) + 0.45, sfx: 'clink' })),
  ...[4.0, 4.25, 4.45, 4.6, 4.75].map((at): Cue => ({ at, sfx: 'rattle' })),
  { at: 4.6, sfx: 'whoosh', dur: 0.4 },
  { at: TRAIN_END, sfx: 'scribble', dur: 0.5 },
  { at: TRAIN_END + 0.15, sfx: 'sad' },
  { at: 5.5, sfx: 'pen', dur: 0.6 },
];

/* ---------------- 플렉스 편 ---------------- */
const FLEX_ITEMS = ['치킨', '떡볶이', '마라탕', '케이크', '택시', '커피', '새 옷', '새 신발'];
const LINE_H = 74;
const FLEX_PRINT = [0.7, 3.8] as const;
const FLEX_END = 4.6;
const flexLineAt = (i: number) => FLEX_PRINT[0] + ((i + 1) / (FLEX_ITEMS.length + 1)) * (FLEX_PRINT[1] - FLEX_PRINT[0]);

function Flex({ u, custom, total, date }: EpProps) {
  const leftover = LEFTOVERS.flex;
  const amounts = splitPay(total, leftover, [0.04, 0.03, 0.04, 0.05, 0.04, 0.02, 0.33, 0.45]);
  const len = eio(seg(u, FLEX_PRINT[0], FLEX_PRINT[1])) * (LINE_H * (FLEX_ITEMS.length + 1) + 20);
  const shown = FLEX_ITEMS.filter((_, i) => u >= flexLineAt(i)).length;
  const spentWon = amounts.slice(0, shown).reduce((a, b) => a + b, 0);
  const printing = u > FLEX_PRINT[0] && u < FLEX_PRINT[1];
  const jig = printing ? Math.sin(u * 70) * 2 : 0;
  const totalIn = seg(u, FLEX_PRINT[1], FLEX_PRINT[1] + 0.3);
  const action: FrontAction = u < 0.6 ? 'cheer' : u < 3.8 ? 'meal' : u < FLEX_END ? 'stuff' : u < 5.6 ? 'shock' : 'soul';
  const top = 300;
  return (
    <>
      <Heading u={u} date={date} text="오늘은 플렉스다!!" />
      {/* 영수증 */}
      <div style={{ position: 'absolute', left: 440 + jig, top, width: 220, height: len, overflow: 'hidden' }}>
        <svg width="220" height={Math.max(1, len)} style={{ position: 'absolute' }}>
          <path d={`M4 0 V${len - 10} ${[...Array(11)].map((_, i) => `L${4 + (i + 0.5) * 19.3} ${len - (i % 2 ? 10 : 0)}`).join(' ')} L216 ${len - 10} V0`} fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </svg>
        {FLEX_ITEMS.map((name, i) =>
          u >= flexLineAt(i) ? (
            <div key={name} className="pc-hand" style={{ left: 14, right: 14, top: 14 + i * LINE_H, fontSize: 28, display: 'flex', justifyContent: 'space-between', flexDirection: 'column', lineHeight: 1.05 }}>
              <span>{name}</span>
              <span style={{ fontSize: 25, alignSelf: 'flex-end' }}>{won(amounts[i])}</span>
            </div>
          ) : null,
        )}
        {totalIn > 0 && (
          <div className="pc-hand" style={{ left: 14, top: 14 + FLEX_ITEMS.length * LINE_H, fontSize: 30, color: '#e0533d', transform: `scale(${back(totalIn)})`, transformOrigin: '0 50%' }}>
            합계 {won(total - leftover)}
          </div>
        )}
      </div>
      {/* 영수증 기계 */}
      <svg className="pc-layer" width="720" height="1280">
        <g transform={`translate(${jig} 0)`}>
          <rect x="420" y={top - 74} width="260" height="84" rx="14" fill="#cfd8e6" stroke={INK} strokeWidth="5" />
          <rect x="436" y={top - 6} width="228" height="12" rx="6" fill={INK} />
          <circle cx="650" cy={top - 46} r="9" fill={printing ? '#2fa463' : '#e0533d'} stroke={INK} strokeWidth="3" />
        </g>
      </svg>
      <Shadow x={210} y={960} />
      <Ham custom={custom} action={action} x={210} y={960} sy={action === 'meal' ? 1 + 0.02 * Math.sin(u * 14) : 1} />
      <Burst x={550} y={top + 14 + FLEX_ITEMS.length * LINE_H} p={totalIn * 1.2 - 0.1} r={90} />
      <Balance u={u} total={total} leftover={leftover} spent={spentWon / Math.max(1, total - leftover)} reveal={FLEX_END} />
      <Note u={u} at={5.4} x={60} y={420} text="맛있었으면 됐어…" size={40} rot={-7} />
    </>
  );
}

const flexCues = (): Cue[] => [
  { at: 0, sfx: 'pen', dur: 0.6 },
  { at: 0.45, sfx: 'pen', dur: 0.45 },
  { at: FLEX_PRINT[0], sfx: 'print', dur: FLEX_PRINT[1] - FLEX_PRINT[0] },
  ...FLEX_ITEMS.map((_, i): Cue => ({ at: flexLineAt(i), sfx: 'pop' })),
  { at: FLEX_PRINT[1], sfx: 'slam' },
  { at: FLEX_END, sfx: 'scribble', dur: 0.5 },
  { at: FLEX_END + 0.15, sfx: 'sad' },
  { at: 5.4, sfx: 'pen', dur: 0.6 },
];

/* ---------------- 저금통 편 ---------------- */
const PIG_FIRST = [0.8, 1.25] as const;
const pigT0 = (i: number) => 1.9 + 1.6 * Math.pow(i / N, 0.75);
const PIG_RUN = [4.0, 5.0] as const;
const PIG_END = 5.0;

function Piggy({ u, custom, total, date }: EpProps) {
  const leftover = LEFTOVERS.piggy;
  const eaten = (u >= PIG_FIRST[1] ? 1 : 0) + [...Array(N)].filter((_, i) => u >= pigT0(i) + 0.4).length;
  const grow = 1 + 0.35 * (eaten / (N + 1));
  const run = seg(u, PIG_RUN[0], PIG_RUN[1]);
  const hop = run > 0 && run < 1 ? Math.abs(Math.sin(run * Math.PI * 4)) * 70 : 0;
  const px = 500 + ei(run) * 560;
  const py = 960 - hop;
  const burp = seg(u, 3.65, 3.95);
  const slot: [number, number] = [px, py - 175 * grow];
  const coins: Coin[] = [];
  const fk = seg(u, PIG_FIRST[0], PIG_FIRST[1]);
  if (fk > 0 && fk < 1) coins.push(flyCoin([260, 760], [500, 960 - 175 * (1 + 0.35 / (N + 1))], fk, 140));
  for (let i = 0; i < N; i++) {
    const from = pileTop(i, -120);
    const k = seg(u, pigT0(i), pigT0(i) + 0.4);
    if (k <= 0) coins.push({ x: from[0], y: from[1], ry: 18, fill: 1 });
    else if (k < 1) coins.push(flyCoin(from, slot, k, 120, 20));
  }
  const awake = u > 1.5;
  const action: FrontAction = u < 0.8 ? 'resolve' : u < 1.7 ? 'cheer' : u < 4.1 ? 'shock' : u < 5.0 ? 'headhold' : 'cry';
  return (
    <>
      <Heading u={u} date={date} text="이번 달은 저금한다!" />
      <Shadow x={230} y={960} />
      <Ham custom={custom} action={action} x={230} y={960} />
      {/* 돼지 저금통 */}
      <svg className="pc-layer" width="720" height="1280">
        <ellipse cx={px} cy={962} rx={110 * grow * (1 - hop / 200)} ry="14" fill="rgba(90,70,40,.16)" />
        <g transform={`translate(${px} ${py}) scale(${(run > 0 ? -1 : 1) * grow * (1 + 0.05 * burp * Math.sin(burp * Math.PI))},${grow * (1 + 0.05 * burp * Math.sin(burp * Math.PI))})`}>
          {[-60, -22, 22, 60].map((x) => <rect key={x} x={x - 13} y="-34" width="26" height="34" rx="8" fill="#f7a9bd" stroke={INK} strokeWidth="5" />)}
          <ellipse cx="0" cy="-100" rx="112" ry="82" fill="#f9bfd0" stroke={INK} strokeWidth="5" />
          <path d="M-64 -168 l-12 -38 l40 18z M30 -176 l22 -34 l14 40z" fill="#f7a9bd" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <rect x="-26" y="-182" width="52" height="10" rx="5" fill={INK} />
          <ellipse cx="-104" cy="-96" rx="26" ry="30" fill="#f7a9bd" stroke={INK} strokeWidth="5" />
          <circle cx="-110" cy="-104" r="5" fill={INK} />
          <circle cx="-110" cy="-86" r="5" fill={INK} />
          {awake ? (
            <>
              <circle cx="-58" cy="-128" r="9" fill={INK} />
              <circle cx="-55" cy="-131" r="3" fill="#fff" />
            </>
          ) : (
            <path d="M-68 -126 q10 8 20 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          )}
          <ellipse cx="-40" cy="-92" rx="12" ry="7" fill="#ff8fb0" opacity=".7" />
          <path d="M110 -108 q22 -6 14 14 q-8 14 10 12" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        </g>
      </svg>
      {burp > 0 && burp < 1 && (
        <div className="pc-hand" style={{ left: px - 290, top: py - 300 * grow, fontSize: 44, opacity: 1 - ei(burp), transform: `scale(${back(burp)})` }}>꺼억</div>
      )}
      <Coins list={coins} />
      <Burst x={500} y={830} p={seg(u, 1.5, 1.85)} r={150} />
      <Balance u={u} total={total} leftover={leftover} spent={eaten / (N + 1)} reveal={PIG_END} />
      <Note u={u} at={5.5} x={290} y={700} text="저금… 한 거 맞지…?" size={40} rot={-5} />
    </>
  );
}

const piggyCues = (): Cue[] => [
  { at: 0, sfx: 'pen', dur: 0.6 },
  { at: 0.45, sfx: 'pen', dur: 0.45 },
  { at: PIG_FIRST[1], sfx: 'clink' },
  { at: 1.5, sfx: 'pop' },
  ...[...Array(N)].map((_, i): Cue => ({ at: pigT0(i) + 0.4, sfx: 'clink' })),
  { at: 3.65, sfx: 'buzz', dur: 0.3 },
  ...[0, 1, 2, 3].map((n): Cue => ({ at: PIG_RUN[0] + (n + 0.5) * 0.25, sfx: 'pthud' })),
  { at: PIG_END, sfx: 'scribble', dur: 0.5 },
  { at: PIG_END + 0.15, sfx: 'sad' },
  { at: 5.5, sfx: 'pen', dur: 0.6 },
];

export const EPISODES: Record<Exclude<PaydayId, 'bills'>, Episode> = {
  cart: { Page: Cart, cues: cartCues },
  breeze: { Page: Breeze, cues: breezeCues },
  train: { Page: Train, cues: trainCues },
  flex: { Page: Flex, cues: flexCues },
  piggy: { Page: Piggy, cues: piggyCues },
};
