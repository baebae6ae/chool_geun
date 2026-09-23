import { useId } from 'react';
import { COLORS } from '../../domain/customization';
import type { Customization } from '../../domain/types';
import { FRONT, SIDE } from './shapes';
import './hamster.css';

export type FrontAction = 'idle' | 'sniff' | 'groom' | 'nibble' | 'yawn' | 'sip' | 'look' | 'type' | 'typeFast' | 'wave';
export type SideAction = 'stand' | 'walk' | 'run' | 'sleep';
export type Pose = { pose: 'front'; action: FrontAction } | { pose: 'side'; action: SideAction };

interface Props {
  custom: Customization;
  pose: Pose;
  backpack?: boolean;
  className?: string;
}

const INK = '#2b1d16';
const SKIN = '#f7b9b0';
const SKIN_LINE = '#d88c83';
const BAG = '#b8733f';
const BAG_DARK = '#8a5129';

const OUTFIT_COLOR: Record<Customization['outfit'], string> = {
  none: 'transparent',
  tie: '#3d6fd8',
  hoodie: '#7cc6a4',
  cardigan: '#f2c9d6',
  suit: '#3b3f4a',
  apron: '#fffaf0',
};

export function HamsterSprite({ custom, pose, backpack = false, className = '' }: Props) {
  const uid = useId().replace(/:/g, '');
  const c = COLORS.find((x) => x.id === custom.color) ?? COLORS[0];
  const ids = {
    body: `hb-${uid}`,
    belly: `hw-${uid}`,
    eye: `he-${uid}`,
    clip: `hc-${uid}`,
    blur: `hbl-${uid}`,
  };
  const defs = (
    <defs>
      <radialGradient id={ids.body} cx="42%" cy="22%" r="85%">
        <stop offset="0%" stopColor={c.light} />
        <stop offset="50%" stopColor={c.body} />
        <stop offset="100%" stopColor={c.shade} />
      </radialGradient>
      <radialGradient id={ids.belly} cx="50%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor={c.cream} />
      </radialGradient>
      <radialGradient id={ids.eye} cx="45%" cy="70%" r="70%">
        <stop offset="0%" stopColor="#6b4632" />
        <stop offset="70%" stopColor={INK} />
      </radialGradient>
      <filter id={ids.blur} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="1.6" />
      </filter>
    </defs>
  );

  if (pose.pose === 'side') {
    return (
      <SideView c={c} ids={ids} defs={defs} action={pose.action} custom={custom} backpack={backpack} className={className} />
    );
  }
  return <FrontView c={c} ids={ids} defs={defs} action={pose.action} custom={custom} backpack={backpack} className={className} />;
}

type Palette = (typeof COLORS)[number];
interface ViewProps<A> {
  c: Palette;
  ids: Record<'body' | 'belly' | 'eye' | 'clip' | 'blur', string>;
  defs: React.ReactNode;
  action: A;
  custom: Customization;
  backpack: boolean;
  className: string;
}

/* ============================ 정면 (앉은 자세) ============================ */

function FrontView({ c, ids, defs, action, custom, backpack, className }: ViewProps<FrontAction>) {
  const eyesClosed = action === 'groom' || action === 'yawn';
  const happy = action === 'nibble' || action === 'sip';
  const lookUp = action === 'look';
  return (
    <svg viewBox="0 0 120 120" className={`hs hs-front act-${action} ${className}`} aria-hidden>
      {defs}
      <clipPath id={ids.clip}>
        <path d={FRONT.clip} />
      </clipPath>

      <ellipse cx="60" cy="109" rx="36" ry="4.5" fill={INK} opacity=".1" />

      <g className="hs-bob">
        {/* 귀 */}
        <g className="hs-ears">
          <path className="hs-ear-l" d={FRONT.earL} fill={c.ear} stroke={c.line} strokeWidth="1.6" strokeLinejoin="round" />
          <path className="hs-ear-r" d={FRONT.earR} fill={c.ear} stroke={c.line} strokeWidth="1.6" strokeLinejoin="round" />
          <ellipse cx="33" cy="24" rx="5.8" ry="6.2" fill={SKIN} />
          <ellipse cx="87" cy="24" rx="5.8" ry="6.2" fill={SKIN} />
        </g>

        {/* 몸 */}
        <path d={FRONT.body} fill={`url(#${ids.body})`} stroke={c.line} strokeWidth="1.8" strokeLinejoin="round" />
        <g clipPath={`url(#${ids.clip})`}>
          <ellipse cx="50" cy="30" rx="20" ry="11" fill="#fff" opacity=".22" />
          <path d={FRONT.belly} fill={`url(#${ids.belly})`} />
          <ellipse cx="60" cy="75" rx="11" ry="7.5" fill={`url(#${ids.belly})`} />
          <ellipse cx="20" cy="96" rx="14" ry="20" fill={c.shade} opacity=".22" />
          <ellipse cx="100" cy="96" rx="14" ry="20" fill={c.shade} opacity=".22" />
          <FrontOutfit id={custom.outfit} />
        </g>
        {/* 이마 줄무늬 & 옆 털결 */}
        <g stroke={c.shade} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".6">
          <path d="M56.5 21 q.8 3 0 6" />
          <path d="M60 19.5 v7" />
          <path d="M63.5 21 q-.8 3 0 6" />
        </g>
        <g stroke={c.line} strokeWidth="1" strokeLinecap="round" fill="none" opacity=".35">
          <path d="M18 60 q3 3 2 7" />
          <path d="M102 60 q-3 3 -2 7" />
          <path d="M16 78 q3 3 3 7" />
          <path d="M104 78 q-3 3 -3 7" />
        </g>

        {backpack && (
          <g stroke={BAG_DARK} strokeWidth="3.6" strokeLinecap="round" fill="none">
            <path d="M36 44 Q30 70 38 98" />
            <path d="M84 44 Q90 70 82 98" />
          </g>
        )}

        {/* 눈 */}
        <g className={eyesClosed ? 'hs-eyes closed' : 'hs-eyes'}>
          {eyesClosed ? (
            <g stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round">
              <path d="M37 64 q6 -5 12 0" />
              <path d="M71 64 q6 -5 12 0" />
            </g>
          ) : happy ? (
            <g stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round">
              <path d="M37 65 q6 -6 12 0" />
              <path d="M71 65 q6 -6 12 0" />
            </g>
          ) : (
            <g className="hs-blink">
              <Eye cx={43} cy={63} r={6} fill={`url(#${ids.eye})`} up={lookUp} />
              <Eye cx={77} cy={63} r={6} fill={`url(#${ids.eye})`} up={lookUp} />
            </g>
          )}
        </g>

        {/* 볼터치 */}
        <ellipse cx="33" cy="76" rx="7" ry="4" fill="#ff8e8e" opacity=".45" filter={`url(#${ids.blur})`} />
        <ellipse cx="87" cy="76" rx="7" ry="4" fill="#ff8e8e" opacity=".45" filter={`url(#${ids.blur})`} />

        {/* 코 · 입 */}
        <path className="hs-nose" d="M57 70.5 q3 -2 6 0 q-0.5 3 -3 3.6 q-2.5 -0.6 -3 -3.6z" fill="#ec8f8c" stroke={SKIN_LINE} strokeWidth=".6" />
        {action === 'yawn' ? (
          <ellipse className="hs-yawn-mouth" cx="60" cy="80" rx="4" ry="5" fill="#b8514f" stroke={INK} strokeWidth="1.2" />
        ) : (
          <path className="hs-mouth" d="M60 74 v2.2 M55.5 76 q2.2 2.6 4.5 0.2 q2.3 2.4 4.5 -0.2" stroke={INK} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        )}
        <g stroke={c.line} strokeWidth=".8" strokeLinecap="round" opacity=".5" className="hs-whiskers">
          <path d="M49 74 L35 71.5" />
          <path d="M49 77 L35 78" />
          <path d="M71 74 L85 71.5" />
          <path d="M71 77 L85 78" />
        </g>

        {custom.outfit === 'tie' || custom.outfit === 'suit' ? (
          <g>
            <path d="M56 84 l4 3 4 -3z" fill="#fff" />
            <path d="M58.2 86.5 h3.6 l2 13 -3.8 4 -3.8 -4z" fill={custom.outfit === 'suit' ? '#d84b4b' : '#3d6fd8'} />
          </g>
        ) : null}

        <FrontHands action={action} c={c} />

        {/* 발 */}
        <g fill={SKIN} stroke={SKIN_LINE} strokeWidth=".9">
          <ellipse cx="42" cy="106.5" rx="8" ry="3.8" />
          <ellipse cx="78" cy="106.5" rx="8" ry="3.8" />
        </g>
        <g stroke={SKIN_LINE} strokeWidth=".8" strokeLinecap="round">
          <path d="M37 105 v2.5 M41 104.6 v2.6 M45 105 v2.5" />
          <path d="M75 105 v2.5 M79 104.6 v2.6 M83 105 v2.5" />
        </g>

        {custom.glasses && (
          <g stroke={INK} strokeWidth="1.6" fill="#ffffff" fillOpacity=".15">
            <circle cx="43" cy="63" r="9" />
            <circle cx="77" cy="63" r="9" />
            <path d="M52 62 q8 -3 16 0" fill="none" />
          </g>
        )}
        <g transform="translate(60 17)">
          <Hat id={custom.hat} side={false} />
        </g>
      </g>

      {action === 'typeFast' && <path className="hs-sweat" d="M96 30 q4 6 0 9 q-4 -3 0 -9z" fill="#8fd0ff" />}
      {action === 'sip' && (
        <g className="hs-steam" stroke="#c8c0b8" strokeWidth="1.4" fill="none" strokeLinecap="round">
          <path d="M57 74 q-2 -4 0 -8" />
          <path d="M63 74 q-2 -4 0 -8" />
        </g>
      )}
    </svg>
  );
}

function Eye({ cx, cy, r, fill, up }: { cx: number; cy: number; r: number; fill: string; up: boolean }) {
  const dy = up ? -1.6 : 0;
  return (
    <g>
      <ellipse cx={cx} cy={cy + dy} rx={r} ry={r * 1.08} fill={fill} />
      <circle cx={cx + r * 0.32} cy={cy - r * 0.38 + dy} r={r * 0.4} fill="#fff" />
      <circle cx={cx - r * 0.35} cy={cy + r * 0.4 + dy} r={r * 0.17} fill="#fff" opacity=".85" />
    </g>
  );
}

function Paw({ x, y, rot = 0 }: { x: number; y: number; rot?: number; c?: Palette }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <ellipse rx="4.6" ry="3.8" fill={SKIN} stroke={SKIN_LINE} strokeWidth="1" />
      <path d="M-1.8 -3.4 v1.6 M0 -3.8 v1.8 M1.8 -3.4 v1.6" stroke={SKIN_LINE} strokeWidth=".7" strokeLinecap="round" />
    </g>
  );
}

function FrontHands({ action, c }: { action: FrontAction; c: Palette }) {
  switch (action) {
    case 'groom':
      return (
        <>
          <g className="hs-hand hs-groom-l"><Paw x={46} y={74} rot={-20} c={c} /></g>
          <g className="hs-hand hs-groom-r"><Paw x={74} y={74} rot={20} c={c} /></g>
        </>
      );
    case 'nibble':
      return (
        <g className="hs-nibble">
          <Seed x={60} y={80} />
          <Paw x={54.5} y={84} rot={-30} c={c} />
          <Paw x={65.5} y={84} rot={30} c={c} />
        </g>
      );
    case 'sip':
      return (
        <g className="hs-sip">
          <g transform="translate(60 88)">
            <path d="M8 -4 q5 0 5 4 q0 4 -5 4" stroke="#5b8fc4" strokeWidth="2" fill="none" />
            <path d="M-8 -7 h16 l-1.2 13 q-.3 2 -2.3 2 h-9 q-2 0 -2.3 -2z" fill="#8fc3e8" stroke="#5b8fc4" strokeWidth="1.1" />
            <ellipse cy="-7" rx="8" ry="2" fill="#7a4a2e" stroke="#5b8fc4" strokeWidth="1" />
            <path d="M-5 0 h10" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
          </g>
          <Paw x={50} y={90} rot={-25} c={c} />
          <Paw x={70} y={90} rot={25} c={c} />
        </g>
      );
    case 'type':
    case 'typeFast':
      return (
        <>
          <g className="hs-hand hs-tap-l"><Paw x={47} y={99} rot={-8} c={c} /></g>
          <g className="hs-hand hs-tap-r"><Paw x={73} y={99} rot={8} c={c} /></g>
        </>
      );
    case 'yawn':
      return (
        <>
          <g className="hs-hand hs-stretch-l"><Paw x={24} y={52} rot={-40} c={c} /></g>
          <g className="hs-hand hs-stretch-r"><Paw x={96} y={52} rot={40} c={c} /></g>
        </>
      );
    case 'wave':
      return (
        <>
          <Paw x={53} y={93} rot={-15} c={c} />
          <g className="hs-wave"><Paw x={92} y={60} rot={30} c={c} /></g>
        </>
      );
    default:
      return (
        <>
          <Paw x={52} y={93} rot={-15} c={c} />
          <Paw x={68} y={93} rot={15} c={c} />
        </>
      );
  }
}

function Seed({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(-14) scale(1.35)`}>
      <path d="M0 -6.5 Q5 -1 0 6.5 Q-5 -1 0 -6.5Z" fill="#4a4540" stroke="#2b2622" strokeWidth=".6" />
      <path d="M-1.6 -4 Q-2.3 0 -1.4 4.2 M1.6 -4 Q2.3 0 1.4 4.2 M0 -5 V5" stroke="#efe9df" strokeWidth=".75" fill="none" />
    </g>
  );
}

function FrontOutfit({ id }: { id: Customization['outfit'] }) {
  const col = OUTFIT_COLOR[id];
  switch (id) {
    case 'hoodie':
      return (
        <g>
          <path d="M0 88 Q60 102 120 88 V120 H0Z" fill={col} />
          <path d="M26 86 Q60 100 94 86" stroke="#5aa885" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M54 94 v9 M66 94 v9" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      );
    case 'cardigan':
      return (
        <g fill={col}>
          <path d="M0 82 Q36 92 50 88 L52 120 H0Z" />
          <path d="M120 82 Q84 92 70 88 L68 120 H120Z" />
          <circle cx="50" cy="96" r="1.6" fill="#c47" />
          <circle cx="50" cy="104" r="1.6" fill="#c47" />
        </g>
      );
    case 'suit':
      return (
        <g fill={col}>
          <path d="M0 80 Q34 90 52 84 L60 120 H0Z" />
          <path d="M120 80 Q86 90 68 84 L60 120 H120Z" />
        </g>
      );
    case 'apron':
      return (
        <g>
          <path d="M42 82 Q60 76 78 82" stroke="#e7cfa9" strokeWidth="1.6" fill="none" />
          <rect x="43" y="84" width="34" height="30" rx="7" fill={col} stroke="#e7cfa9" strokeWidth="1.4" />
          <rect x="52" y="97" width="16" height="8" rx="2.5" fill="none" stroke="#e7cfa9" strokeWidth="1.2" />
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
        <g>
          <path d="M-21 2 Q0 -28 21 2Z" fill="#e8504b" stroke="#a8322e" strokeWidth="1" />
          <path d={side ? 'M16 1 h14 q3 0 1 4 h-15z' : 'M0 1 h24 q3 0 1 4 h-25z'} fill="#c63d39" />
          <circle cy="-12" r="2.2" fill="#c63d39" />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M-21 3 Q0 -30 21 3Z" fill="#6b8cd6" />
          <rect x="-22" y="-3" width="44" height="7" rx="3.5" fill="#5775bb" />
          <circle cy="-18" r="5" fill="#fff" />
        </g>
      );
    case 'ribbon':
      return (
        <g transform={side ? 'translate(-2 -2)' : 'translate(20 2)'}>
          <path d="M0 0 l-9 -6 v12z M0 0 l9 -6 v12z" fill="#ff7aa8" stroke="#e0548a" strokeWidth=".8" />
          <circle r="3" fill="#e0548a" />
        </g>
      );
    case 'headset':
      return side ? (
        <g>
          <path d="M-18 16 Q-16 -14 10 -14" stroke="#333" strokeWidth="3.4" fill="none" />
          <rect x="-24" y="10" width="10" height="15" rx="4" fill="#444" />
        </g>
      ) : (
        <g>
          <path d="M-30 20 Q-30 -12 0 -12 Q30 -12 30 20" stroke="#333" strokeWidth="3.6" fill="none" />
          <rect x="-35" y="16" width="10" height="16" rx="4" fill="#444" />
          <rect x="25" y="16" width="10" height="16" rx="4" fill="#444" />
        </g>
      );
    case 'crown':
      return <path d="M-13 2 l2.4 -15 7 7 3.6 -11 3.6 11 7 -7 2.4 15z" fill="#ffcd3c" stroke="#d99a00" strokeWidth="1.2" strokeLinejoin="round" />;
    default:
      return null;
  }
}

/* ============================ 옆모습 (걷기/달리기/자기) ============================ */

function SideView({ c, ids, defs, action, custom, backpack, className }: ViewProps<SideAction>) {
  const sleeping = action === 'sleep';
  const legClass = action === 'walk' || action === 'run' ? 'hs-leg moving' : 'hs-leg';
  return (
    <svg viewBox="0 0 140 100" className={`hs hs-side act-${action} ${className}`} aria-hidden>
      {defs}
      <clipPath id={ids.clip}>
        <path d={SIDE.clip} />
      </clipPath>

      <ellipse className="hs-shadow" cx="68" cy="94" rx="46" ry="4" fill={INK} opacity=".1" />

      <g className="hs-bob">
        {/* 먼 쪽 다리 */}
        {!sleeping && (
          <g fill="#e7a39a" stroke={SKIN_LINE} strokeWidth=".9">
            <g className={`${legClass} leg-fb`}><ellipse cx="40" cy="90.5" rx="6" ry="3.4" /></g>
            <g className={`${legClass} leg-ff`}><ellipse cx="100" cy="90" rx="5" ry="3" /></g>
          </g>
        )}

        {/* 꼬리 · 귀 */}
        <ellipse cx="25" cy="66" rx="4" ry="3" fill={c.shade} stroke={c.line} strokeWidth="1.2" />
        <g className="hs-ears">
          <path className="hs-ear-r" d={SIDE.ear} fill={c.ear} stroke={c.line} strokeWidth="1.5" strokeLinejoin="round" />
          <ellipse cx="84" cy="25" rx="6" ry="6.4" fill={SKIN} />
        </g>

        {/* 몸 */}
        <path d={SIDE.body} fill={`url(#${ids.body})`} stroke={c.line} strokeWidth="1.8" strokeLinejoin="round" />
        <g clipPath={`url(#${ids.clip})`}>
          <ellipse cx="54" cy="38" rx="30" ry="9" fill="#fff" opacity=".2" />
          <path d="M22 44 Q54 26 84 40" stroke={c.shade} strokeWidth="9" fill="none" opacity=".25" strokeLinecap="round" />
          <path d={SIDE.belly} fill={`url(#${ids.belly})`} />
          <path d={SIDE.cheek} fill={`url(#${ids.belly})`} />
          <SideOutfit id={custom.outfit} />
        </g>
        <g stroke={c.line} strokeWidth="1" strokeLinecap="round" fill="none" opacity=".35">
          <path d="M34 50 q3 3 2 7" />
          <path d="M48 44 q3 3 2 7" />
          <path d="M28 70 q3 2 3 6" />
        </g>

        {/* 눈 · 코 · 입 */}
        {sleeping ? (
          <path d="M96 51 q5 4 10 0" stroke={INK} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        ) : (
          <g className="hs-blink">
            <Eye cx={101} cy={49} r={5.6} fill={`url(#${ids.eye})`} up={false} />
          </g>
        )}
        <ellipse cx="99" cy="62" rx="6" ry="3.4" fill="#ff8e8e" opacity=".45" filter={`url(#${ids.blur})`} />
        <path className="hs-nose" d="M115 61 q3.5 0.4 3.6 3 q-1.4 2.2 -4 1.7 q-1.3 -2.2 0.4 -4.7z" fill="#ec8f8c" stroke={SKIN_LINE} strokeWidth=".6" />
        <path d="M115 67.5 q-1.5 2.4 -4.4 1.8" stroke={INK} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <g stroke={c.line} strokeWidth=".8" strokeLinecap="round" opacity=".45" className="hs-whiskers">
          <path d="M112 64 L128 59.5" />
          <path d="M112 66 L129 66" />
          <path d="M111 68 L126 72" />
        </g>

        {custom.outfit === 'tie' && <path d="M104 78 l3 -1 1.6 9 -2.6 2.6 -2 -2.4z" fill="#3d6fd8" />}
        {custom.outfit === 'suit' && <path d="M104 78 l3 -1 1.6 9 -2.6 2.6 -2 -2.4z" fill="#d84b4b" />}

        {/* 가까운 쪽 다리 */}
        {!sleeping && (
          <g fill={SKIN} stroke={SKIN_LINE} strokeWidth=".9">
            <g className={`${legClass} leg-nb`}><ellipse cx="50" cy="91" rx="6.4" ry="3.6" /></g>
            <g className={`${legClass} leg-nf`}><ellipse cx="91" cy="91" rx="5.4" ry="3.2" /></g>
          </g>
        )}

        {backpack && (
          <g transform="translate(46 44) rotate(-10)">
            <path d="M16 2 Q34 14 40 34" stroke={BAG_DARK} strokeWidth="3" fill="none" strokeLinecap="round" />
            <rect x="-14" y="-14" width="30" height="30" rx="8" fill={BAG} stroke={BAG_DARK} strokeWidth="1.4" />
            <path d="M-14 -4 Q1 2 16 -4" stroke={BAG_DARK} strokeWidth="1.4" fill="none" />
            <rect x="-3" y="-2" width="6" height="5" rx="1.2" fill="#f2c14e" />
          </g>
        )}
        {custom.glasses && !sleeping && (
          <g stroke={INK} strokeWidth="1.5" fill="#ffffff" fillOpacity=".15">
            <circle cx="101" cy="49" r="8" />
            <path d="M93 48 L80 44" fill="none" />
          </g>
        )}
        <g transform="translate(94 27) rotate(12) scale(.8)">
          <Hat id={custom.hat} side />
        </g>
      </g>

      {sleeping && (
        <g className="hs-zzz" fill={INK} fontWeight="700" fontFamily="system-ui, sans-serif">
          <text x="112" y="30" fontSize="10">z</text>
          <text x="120" y="20" fontSize="13">Z</text>
        </g>
      )}
    </svg>
  );
}

function SideOutfit({ id }: { id: Customization['outfit'] }) {
  if (id === 'none' || id === 'tie') return null;
  const col = OUTFIT_COLOR[id];
  if (id === 'apron') {
    return <path d="M80 72 Q96 70 110 76 L104 98 H72Z" fill={col} stroke="#e7cfa9" strokeWidth="1.2" />;
  }
  return (
    <g>
      <path d="M0 70 Q66 86 140 66 V100 H0Z" fill={col} />
      {id === 'suit' && <path d="M96 72 L110 74 L104 92Z" fill="#fff" />}
    </g>
  );
}
