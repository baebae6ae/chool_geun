import { useId } from 'react';
import { COLORS } from '../../domain/customization';
import type { Customization } from '../../domain/types';
import { FRONT, SIDE } from './shapes';
import './hamster.css';

export type FrontAction =
  | 'idle'
  | 'sniff'
  | 'groom'
  | 'nibble'
  | 'yawn'
  | 'sip'
  | 'look'
  | 'type'
  | 'typeFast'
  | 'wave'
  // 희귀 행동
  | 'stuff'
  | 'sneeze'
  | 'doze'
  | 'dizzy'
  | 'dance';
export type SideAction = 'stand' | 'walk' | 'run' | 'sleep';
export type Pose = { pose: 'front'; action: FrontAction } | { pose: 'side'; action: SideAction };

interface Props {
  custom: Customization;
  pose: Pose;
  className?: string;
}

const INK = '#3a2a22';
const PINK = '#f7b4b6';
const NOSE = '#f48f98';
const MOUTH = '#e0625f';
const TONGUE = '#ff9c96';
const BLUSH = '#ff98a0';
const LINE = 2.6;

const OUTFIT_COLOR: Record<Customization['outfit'], string> = {
  none: 'transparent',
  tie: '#3d6fd8',
  hoodie: '#8fd1b2',
  cardigan: '#f6c7d6',
  suit: '#3b3f4a',
  apron: '#fffaf0',
};

type Palette = (typeof COLORS)[number];

export function HamsterSprite({ custom, pose, className = '' }: Props) {
  const clip = `hc-${useId().replace(/:/g, '')}`;
  const c = COLORS.find((x) => x.id === custom.color) ?? COLORS[0];
  return pose.pose === 'side' ? (
    <SideView c={c} clip={clip} action={pose.action} custom={custom} className={className} />
  ) : (
    <FrontView c={c} clip={clip} action={pose.action} custom={custom} className={className} />
  );
}

interface ViewProps<A> {
  c: Palette;
  clip: string;
  action: A;
  custom: Customization;
  className: string;
}

/* ============================ 정면 (앉은 자세) ============================ */

function FrontView({ c, clip, action, custom, className }: ViewProps<FrontAction>) {
  const eyes: 'open' | 'closed' | 'sleepy' | 'happy' | 'spiral' | 'squeeze' =
    action === 'groom' || action === 'yawn'
      ? 'closed'
      : action === 'doze'
        ? 'sleepy'
        : action === 'nibble' || action === 'sip' || action === 'dance'
          ? 'happy'
          : action === 'dizzy'
            ? 'spiral'
            : action === 'sneeze'
              ? 'squeeze'
              : 'open';
  const lookUp = action === 'look';
  const mouth: 'yawn' | 'smile' | 'small' | 'wavy' | 'o' =
    action === 'yawn'
      ? 'yawn'
      : action === 'dizzy'
        ? 'wavy'
        : action === 'sneeze'
          ? 'o'
          : ['idle', 'sniff', 'look', 'type', 'wave', 'dance'].includes(action)
            ? 'smile'
            : 'small';
  const stuffed = action === 'stuff';
  return (
    <svg viewBox="0 0 120 120" className={`hs hs-front act-${action} ${className}`} aria-hidden>
      <clipPath id={clip}>
        <path d={FRONT.clip} />
      </clipPath>

      <ellipse className="hs-shadow" cx="60" cy="109" rx="38" ry="4" fill={INK} opacity=".1" />

      <g className="hs-bob" strokeLinecap="round" strokeLinejoin="round">
        {/* 다크 모드에서만 보이는 밝은 테두리 (어두운 배경에 윤곽이 묻히지 않게) */}
        <g className="hs-halo" fill="none" strokeWidth={LINE + 4}>
          <circle cx="31" cy="26" r="9.5" />
          <circle cx="89" cy="26" r="9.5" />
          <path d={FRONT.body} />
          <ellipse cx="45" cy="106.5" rx="7" ry="3.8" />
          <ellipse cx="75" cy="106.5" rx="7" ry="3.8" />
        </g>
        {/* 귀 */}
        <g className="hs-ears" fill={c.ear} stroke={INK} strokeWidth={LINE}>
          <circle className="hs-ear-l" cx="31" cy="26" r="9.5" />
          <circle className="hs-ear-r" cx="89" cy="26" r="9.5" />
        </g>

        {/* 볼주머니 (몸 뒤에 먼저 그려서 바깥쪽 윤곽만 보이게) */}
        {stuffed && (
          <g className="hs-cheeks" fill={c.body} stroke={INK} strokeWidth={LINE}>
            <circle cx="22" cy="70" r="14" />
            <circle cx="98" cy="70" r="14" />
          </g>
        )}

        {/* 몸 */}
        <path d={FRONT.body} fill={c.body} />
        <g clipPath={`url(#${clip})`}>
          <FrontOutfit id={custom.outfit} />
        </g>
        <path d={FRONT.body} fill="none" stroke={INK} strokeWidth={LINE} />
        {stuffed ? (
          <g className="hs-cheeks" fill={c.body}>
            <circle cx="22" cy="70" r="12.6" />
            <circle cx="98" cy="70" r="12.6" />
          </g>
        ) : (
          <g stroke={INK} strokeWidth="2" fill="none">
            {action !== 'yawn' && action !== 'dance' && <path d={FRONT.ticksL} />}
            {action !== 'yawn' && action !== 'wave' && action !== 'dance' && action !== 'sneeze' && <path d={FRONT.ticksR} />}
          </g>
        )}

        {/* 볼터치 · 주둥이 */}
        <ellipse cx={stuffed ? 24 : 34} cy="67" rx="5.5" ry="3" fill={BLUSH} opacity={stuffed ? 0.7 : 0.45} />
        <ellipse cx={stuffed ? 96 : 86} cy="67" rx="5.5" ry="3" fill={BLUSH} opacity={stuffed ? 0.7 : 0.45} />
        <ellipse cx="60" cy="66" rx="10.5" ry="8" fill={c.cream} />

        {/* 눈 */}
        {eyes === 'closed' || eyes === 'happy' || eyes === 'sleepy' ? (
          <g stroke={INK} strokeWidth="2.3" fill="none">
            <path d={eyes === 'happy' ? 'M39 59 q4 -5 8 0' : eyes === 'sleepy' ? 'M39 58 h8' : 'M39 57.5 q4 3.5 8 0'} />
            <path d={eyes === 'happy' ? 'M73 59 q4 -5 8 0' : eyes === 'sleepy' ? 'M73 58 h8' : 'M73 57.5 q4 3.5 8 0'} />
          </g>
        ) : eyes === 'spiral' ? (
          <g stroke={INK} strokeWidth="1.6" fill="none">
            <path d="M43 57 m0 0 a1.2 1.2 0 1 1 1.2 1.2 a2.4 2.4 0 1 1 -2.4 -2.4 a3.6 3.6 0 1 1 3.6 3.6" />
            <path d="M77 57 m0 0 a1.2 1.2 0 1 1 1.2 1.2 a2.4 2.4 0 1 1 -2.4 -2.4 a3.6 3.6 0 1 1 3.6 3.6" />
          </g>
        ) : eyes === 'squeeze' ? (
          <g stroke={INK} strokeWidth="2.3" fill="none">
            <path d="M40 54 l6 3 -6 3" />
            <path d="M80 54 l-6 3 6 3" />
          </g>
        ) : (
          <g className="hs-blink" fill={INK}>
            <circle cx="43" cy={lookUp ? 55 : 57} r="3.5" />
            <circle cx="77" cy={lookUp ? 55 : 57} r="3.5" />
            <circle cx="44.2" cy={lookUp ? 53.8 : 55.8} r="1" fill="#fff" />
            <circle cx="78.2" cy={lookUp ? 53.8 : 55.8} r="1" fill="#fff" />
          </g>
        )}

        {/* 코 · 입 */}
        <ellipse className="hs-nose" cx="60" cy="61.5" rx="2.9" ry="2.1" fill={NOSE} />
        {action === 'doze' && <circle className="hs-snot" cx="65" cy="63.5" r="3" fill="#d6efff" stroke="#8cc3e6" strokeWidth="1" />}
        {mouth === 'yawn' ? (
          <ellipse className="hs-yawn-mouth" cx="60" cy="69" rx="4.2" ry="5" fill={MOUTH} stroke={INK} strokeWidth="1.8" />
        ) : mouth === 'wavy' ? (
          <path className="hs-mouth" d="M54.5 67 q2.75 -2.2 5.5 0 q2.75 2.2 5.5 0" stroke={INK} strokeWidth="1.7" fill="none" />
        ) : mouth === 'o' ? (
          <ellipse className="hs-mouth" cx="60" cy="67.5" rx="2.4" ry="2.8" fill={MOUTH} stroke={INK} strokeWidth="1.6" />
        ) : mouth === 'smile' ? (
          <g className="hs-mouth">
            <path d="M54.2 64.6 Q60 66.8 65.8 64.6 Q65 71.4 60 71.4 Q55 71.4 54.2 64.6Z" fill={MOUTH} />
            <path d="M56.6 69.6 Q60 67.6 63.4 69.6 Q62 71.2 60 71.2 Q58 71.2 56.6 69.6Z" fill={TONGUE} />
            <path d="M54.2 64.6 Q60 66.8 65.8 64.6 Q65 71.4 60 71.4 Q55 71.4 54.2 64.6Z" fill="none" stroke={INK} strokeWidth="1.8" />
          </g>
        ) : (
          <path className="hs-mouth" d="M60 64 v1.6 M56.4 65.4 q1.8 2 3.6 .2 q1.8 1.8 3.6 -.2" stroke={INK} strokeWidth="1.6" fill="none" />
        )}

        {custom.outfit === 'tie' || custom.outfit === 'suit' ? (
          <g stroke={INK} strokeWidth="1.3">
            <path d="M55.5 78 l4.5 3 4.5 -3z" fill="#fff" />
            <path d="M58 80.6 h4 l2 12 -4 4 -4 -4z" fill={custom.outfit === 'suit' ? '#d84b4b' : '#3d6fd8'} />
          </g>
        ) : null}

        <FrontHands action={action} c={c} />

        {/* 발 */}
        <g fill={PINK} stroke={INK} strokeWidth="2">
          <ellipse cx="45" cy="106.5" rx="7" ry="3.8" />
          <ellipse cx="75" cy="106.5" rx="7" ry="3.8" />
        </g>

        {custom.glasses && (
          <g stroke={INK} strokeWidth="1.8" fill="#ffffff" fillOpacity=".2">
            <circle cx="43" cy="57" r="8" />
            <circle cx="77" cy="57" r="8" />
            <path d="M51 56 q9 -3 18 0" fill="none" />
          </g>
        )}
        <g transform="translate(60 20)">
          <Hat id={custom.hat} side={false} />
        </g>
      </g>

      {action === 'dizzy' && (
        <g className="hs-stars" fill="#ffd23c" stroke={INK} strokeWidth="1.1" strokeLinejoin="round">
          <path d={star(42, 12, 5)} />
          <path d={star(78, 10, 4.2)} />
          <path d={star(60, 4, 3.6)} />
        </g>
      )}
      {action === 'dance' && (
        <g className="hs-notes" fill={INK} fontFamily="system-ui, sans-serif" fontWeight="700">
          <text x="96" y="30" fontSize="13">♪</text>
          <text x="10" y="24" fontSize="11">♫</text>
        </g>
      )}
      {action === 'sneeze' && (
        <g className="hs-achoo">
          <g fill="#fff" stroke={INK} strokeWidth="1.2">
            <circle cx="112" cy="72" r="4" />
            <circle cx="119" cy="66" r="5" />
            <circle cx="122" cy="76" r="3.6" />
          </g>
          <text x="98" y="12" fontSize="11" fontWeight="800" fill={INK} fontFamily="system-ui, sans-serif">에취!</text>
        </g>
      )}
      {action === 'typeFast' && <path className="hs-sweat" d="M98 30 q4 6 0 9 q-4 -3 0 -9z" fill="#8fd0ff" stroke={INK} strokeWidth="1" />}
      {action === 'sip' && (
        <g className="hs-steam" stroke="#c8c0b8" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M57 64 q-2 -4 0 -8" />
          <path d="M63 64 q-2 -4 0 -8" />
        </g>
      )}
    </svg>
  );
}

function star(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join(' L')}Z`;
}

function Paw({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return <ellipse cx={x} cy={y} rx="5" ry="4.2" transform={`rotate(${rot} ${x} ${y})`} fill={PINK} stroke={INK} strokeWidth="2" />;
}

/** 몸 옆에서 뻗어 나온 짧은 팔 (몸 색 + 분홍 손) */
function Arm({ from, to, c }: { from: [number, number]; to: [number, number]; c: Palette }) {
  const d = `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`;
  return (
    <g>
      <path d={d} stroke={INK} strokeWidth="15" />
      <path d={d} stroke={c.body} strokeWidth="10.4" />
      <circle cx={from[0]} cy={from[1]} r="6.4" fill={c.body} />
      <Paw x={to[0]} y={to[1]} />
    </g>
  );
}

function FrontHands({ action, c }: { action: FrontAction; c: Palette }) {
  switch (action) {
    case 'groom':
      return (
        <>
          <g className="hs-hand hs-groom-l"><Paw x={48} y={66} rot={-20} /></g>
          <g className="hs-hand hs-groom-r"><Paw x={72} y={66} rot={20} /></g>
        </>
      );
    case 'nibble':
    case 'stuff':
      return (
        <g className="hs-nibble">
          <Seed x={60} y={74} />
          <Paw x={54} y={78} rot={-30} />
          <Paw x={66} y={78} rot={30} />
        </g>
      );
    case 'sip':
      return (
        <g className="hs-sip">
          <g transform="translate(60 88)" stroke={INK} strokeWidth="1.8">
            <path d="M8 -4 q5.5 0 5.5 4 q0 4 -5.5 4" fill="none" />
            <path d="M-8 -7 h16 l-1.2 13 q-.3 2 -2.3 2 h-9 q-2 0 -2.3 -2z" fill="#9fcff0" />
            <ellipse cy="-7" rx="8" ry="2" fill="#7a4a2e" />
          </g>
          <Paw x={50} y={90} rot={-25} />
          <Paw x={70} y={90} rot={25} />
        </g>
      );
    case 'type':
    case 'typeFast':
      return (
        <>
          <g className="hs-hand hs-tap-l"><Paw x={47} y={97} rot={-8} /></g>
          <g className="hs-hand hs-tap-r"><Paw x={73} y={97} rot={8} /></g>
        </>
      );
    case 'yawn':
      return (
        <>
          <g className="hs-hand hs-stretch-l"><Arm from={[25, 60]} to={[15, 45]} c={c} /></g>
          <g className="hs-hand hs-stretch-r"><Arm from={[95, 60]} to={[105, 45]} c={c} /></g>
        </>
      );
    case 'dance':
      return (
        <>
          <g className="hs-hand hs-dance-l"><Arm from={[25, 64]} to={[13, 46]} c={c} /></g>
          <g className="hs-hand hs-dance-r"><Arm from={[95, 64]} to={[107, 46]} c={c} /></g>
        </>
      );
    case 'sneeze':
      return (
        <>
          <Paw x={51} y={74} rot={-25} />
          <Paw x={69} y={74} rot={25} />
        </>
      );
    case 'wave':
      return (
        <>
          <Paw x={53} y={81} rot={-20} />
          <g className="hs-wave"><Arm from={[93, 73]} to={[106, 58]} c={c} /></g>
        </>
      );
    default:
      return (
        <>
          <Paw x={53} y={81} rot={-20} />
          <Paw x={67} y={81} rot={20} />
        </>
      );
  }
}

function Seed({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-14) scale(1.3)`}>
      <path d="M0 -6.5 Q5 -1 0 6.5 Q-5 -1 0 -6.5Z" fill="#4a4540" stroke={INK} strokeWidth="1" />
      <path d="M-1.6 -4 Q-2.3 0 -1.4 4.2 M1.6 -4 Q2.3 0 1.4 4.2" stroke="#efe9df" strokeWidth=".8" fill="none" />
    </g>
  );
}

function FrontOutfit({ id }: { id: Customization['outfit'] }) {
  const col = OUTFIT_COLOR[id];
  switch (id) {
    case 'hoodie':
      return (
        <g>
          <path d="M0 84 Q60 98 120 84 V120 H0Z" fill={col} stroke={INK} strokeWidth="2" />
          <path d="M54 90 v9 M66 90 v9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        </g>
      );
    case 'cardigan':
      return (
        <g fill={col} stroke={INK} strokeWidth="2">
          <path d="M0 80 Q36 90 50 86 L52 120 H0Z" />
          <path d="M120 80 Q84 90 70 86 L68 120 H120Z" />
          <circle cx="50" cy="94" r="1.6" fill="#c47" stroke="none" />
          <circle cx="50" cy="102" r="1.6" fill="#c47" stroke="none" />
        </g>
      );
    case 'suit':
      return (
        <g fill={col} stroke={INK} strokeWidth="2">
          <path d="M0 78 Q34 88 52 80 L60 120 H0Z" />
          <path d="M120 78 Q86 88 68 80 L60 120 H120Z" />
        </g>
      );
    case 'apron':
      return (
        <g stroke={INK} strokeWidth="1.8">
          <path d="M42 80 Q60 74 78 80" fill="none" />
          <rect x="43" y="82" width="34" height="30" rx="7" fill={col} />
          <rect x="52" y="95" width="16" height="8" rx="2.5" fill="none" strokeWidth="1.3" />
        </g>
      );
    default:
      return null;
  }
}

function Hat({ id, side }: { id: Customization['hat']; side: boolean }) {
  switch (id) {
    case 'cap':
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
          <path d="M-21 2 Q0 -28 21 2Z" fill="#e8504b" />
          <path d={side ? 'M16 1 h14 q3 0 1 4 h-15z' : 'M0 1 h24 q3 0 1 4 h-25z'} fill="#c63d39" />
          <circle cy="-12" r="2.2" fill="#c63d39" stroke="none" />
        </g>
      );
    case 'beanie':
      return (
        <g stroke={INK} strokeWidth="1.8">
          <path d="M-21 3 Q0 -30 21 3Z" fill="#6b8cd6" />
          <rect x="-22" y="-3" width="44" height="7" rx="3.5" fill="#5775bb" />
          <circle cy="-18" r="5" fill="#fff" />
        </g>
      );
    case 'ribbon':
      return (
        <g transform={side ? 'translate(-2 -2)' : 'translate(20 2)'} stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
          <path d="M0 0 l-9 -6 v12z M0 0 l9 -6 v12z" fill="#ff7aa8" />
          <circle r="3" fill="#e0548a" />
        </g>
      );
    case 'headset':
      return side ? (
        <g stroke={INK} strokeWidth="1.4">
          <path d="M-18 16 Q-16 -14 10 -14" stroke="#333" strokeWidth="3.4" fill="none" />
          <rect x="-24" y="10" width="10" height="15" rx="4" fill="#555" />
        </g>
      ) : (
        <g stroke={INK} strokeWidth="1.4">
          <path d="M-34 24 Q-34 -12 0 -12 Q34 -12 34 24" stroke="#333" strokeWidth="3.6" fill="none" />
          <rect x="-40" y="20" width="10" height="16" rx="4" fill="#555" />
          <rect x="30" y="20" width="10" height="16" rx="4" fill="#555" />
        </g>
      );
    case 'crown':
      return <path d="M-13 2 l2.4 -15 7 7 3.6 -11 3.6 11 7 -7 2.4 15z" fill="#ffcd3c" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />;
    default:
      return null;
  }
}

/* ============================ 옆모습 (걷기/달리기/자기) ============================ */

function SideView({ c, clip, action, custom, className }: ViewProps<SideAction>) {
  const sleeping = action === 'sleep';
  const legClass = action === 'walk' || action === 'run' ? 'hs-leg moving' : 'hs-leg';
  return (
    <svg viewBox="0 0 140 100" className={`hs hs-side act-${action} ${className}`} aria-hidden>
      <clipPath id={clip}>
        <path d={SIDE.clip} />
      </clipPath>

      <ellipse className="hs-shadow" cx="66" cy="94" rx="46" ry="4" fill={INK} opacity=".1" />

      <g className="hs-bob" strokeLinecap="round" strokeLinejoin="round">
        <g className="hs-halo" fill="none" strokeWidth={LINE + 4}>
          <circle cx="80" cy="34" r="9.5" />
          <ellipse cx="31" cy="72" rx="4.4" ry="3.4" />
          <path d={SIDE.body} />
        </g>
        {/* 먼 쪽 다리 */}
        {!sleeping && (
          <g fill="#e89ea2" stroke={INK} strokeWidth="2">
            <g className={`${legClass} leg-fb`}><ellipse cx="44" cy="91" rx="6" ry="3.4" /></g>
            <g className={`${legClass} leg-ff`}><ellipse cx="94" cy="91" rx="5.2" ry="3.2" /></g>
          </g>
        )}

        {/* 꼬리 · 귀 */}
        <ellipse cx="31" cy="72" rx="4.4" ry="3.4" fill={c.body} stroke={INK} strokeWidth="2" />
        <g className="hs-ears">
          <circle className="hs-ear-r" cx="80" cy="34" r="9.5" fill={c.ear} stroke={INK} strokeWidth={LINE} />
        </g>

        {/* 몸 */}
        <path d={SIDE.body} fill={c.body} />
        <g clipPath={`url(#${clip})`}>
          <SideOutfit id={custom.outfit} />
        </g>
        <path d={SIDE.body} fill="none" stroke={INK} strokeWidth={LINE} />
        {action === 'run' && <path d={SIDE.ticks} stroke={INK} strokeWidth="2" fill="none" opacity=".5" />}

        {/* 눈 · 코 · 입 */}
        <ellipse cx="92" cy="66" rx="5" ry="2.8" fill={BLUSH} opacity=".45" />
        <ellipse cx="105" cy="66" rx="8.5" ry="7" fill={c.cream} />
        {sleeping ? (
          <path d="M93 55 q4 3.4 8 0" stroke={INK} strokeWidth="2.3" fill="none" />
        ) : (
          <g className="hs-blink" fill={INK}>
            <circle cx="97" cy="55" r="3.6" />
            <circle cx="98.2" cy="53.8" r="1" fill="#fff" />
          </g>
        )}
        <ellipse className="hs-nose" cx="110" cy="62.5" rx="2.6" ry="2.1" fill={NOSE} />
        <path d="M108.6 66.4 q-1.4 2.6 -4.6 1.6" stroke={INK} strokeWidth="1.6" fill="none" />

        {(custom.outfit === 'tie' || custom.outfit === 'suit') && (
          <path d="M98 79 l3 -1 1.6 9 -2.6 2.6 -2 -2.4z" fill={custom.outfit === 'suit' ? '#d84b4b' : '#3d6fd8'} stroke={INK} strokeWidth="1.2" />
        )}

        {/* 가까운 쪽 다리 */}
        {!sleeping && (
          <g fill={PINK} stroke={INK} strokeWidth="2">
            <g className={`${legClass} leg-nb`}><ellipse cx="53" cy="91.5" rx="6.6" ry="3.6" /></g>
            <g className={`${legClass} leg-nf`}><ellipse cx="86" cy="91.5" rx="5.6" ry="3.4" /></g>
          </g>
        )}

        {custom.glasses && !sleeping && (
          <g stroke={INK} strokeWidth="1.8" fill="#ffffff" fillOpacity=".2">
            <circle cx="97" cy="55" r="7.5" />
            <path d="M89.5 54 L78 50" fill="none" />
          </g>
        )}
        <g transform="translate(86 32) rotate(12) scale(.8)">
          <Hat id={custom.hat} side />
        </g>
      </g>

      {sleeping && (
        <g className="hs-zzz" fill={INK} fontWeight="700" fontFamily="system-ui, sans-serif">
          <text x="110" y="34" fontSize="10">z</text>
          <text x="118" y="24" fontSize="13">Z</text>
        </g>
      )}
    </svg>
  );
}

function SideOutfit({ id }: { id: Customization['outfit'] }) {
  if (id === 'none' || id === 'tie') return null;
  const col = OUTFIT_COLOR[id];
  if (id === 'apron') {
    return <path d="M78 74 Q94 72 108 78 L102 98 H70Z" fill={col} stroke={INK} strokeWidth="1.8" />;
  }
  return (
    <g>
      <path d="M0 72 Q66 88 140 68 V100 H0Z" fill={col} stroke={INK} strokeWidth="2" />
      {id === 'suit' && <path d="M94 74 L108 76 L102 94Z" fill="#fff" stroke={INK} strokeWidth="1.2" />}
    </g>
  );
}
