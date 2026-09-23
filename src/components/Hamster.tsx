import { useId } from 'react';
import { COLORS, DECOS } from '../domain/customization';
import type { HamsterMood } from '../domain/schedule';
import type { Customization } from '../domain/types';

export type HamsterActivity = 'idle' | 'walking' | 'nibble';

interface Props {
  custom: Customization;
  mood: HamsterMood;
  /** 책상 없이 햄스터만 — 돌아다니는 작은 모습 */
  bare?: boolean;
  /** bare일 때의 작은 행동 (걷기 / 씨앗 냠냠) */
  activity?: HamsterActivity;
  className?: string;
}

const INK = '#3a2a20';

/** 타원 둘레에 보송한 털뭉치를 겹쳐 그려 매끈한 실루엣 대신 복슬복슬한 윤곽을 만든다. */
function furRing(cx: number, cy: number, rx: number, ry: number, count: number, bumpR: number, jitter = 0.14) {
  return Array.from({ length: count }, (_, i) => {
    const t = (i / count) * Math.PI * 2;
    const wob = 1 + jitter * Math.sin(t * 3.3 + i);
    return {
      x: cx + Math.cos(t) * rx * wob,
      y: cy + Math.sin(t) * ry * wob,
      r: bumpR * (0.82 + 0.32 * Math.abs(Math.sin(t * 2.1 + i * 0.7))),
    };
  });
}

const BODY_FUR = furRing(100, 98, 50, 45, 20, 13);
const EAR_FUR_L = furRing(66, 50, 16, 16, 9, 6.5);
const EAR_FUR_R = furRing(134, 50, 16, 16, 9, 6.5);

/** 기획서 4. 햄스터 애니메이션은 장식이 아니라 시간의 시각화 수단 — 복슬복슬한 털 질감의 햄스터 */
export function Hamster({ custom, mood, bare = false, activity = 'idle', className = '' }: Props) {
  const uid = useId().replace(/:/g, '');
  const c = COLORS.find((x) => x.id === custom.color) ?? COLORS[0];
  const sleeping = mood === 'beforeWork' || mood === 'holiday';
  const typing = mood === 'working' || mood === 'almostDone' || mood === 'oneMore';
  const withBag = mood === 'arriving' || mood === 'off';
  const happyEyes = mood === 'break' || mood === 'off';
  const deco = DECOS.find((d) => d.id === custom.deco);
  const act = bare ? activity : 'idle';
  const soft = `url(#soft-${uid})`;

  return (
    <svg
      viewBox="0 0 200 190"
      className={`hamster mood-${mood} activity-${act} ${className}`}
      role="img"
      aria-label={`햄스터 (${mood})`}
    >
      <defs>
        <filter id={`soft-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <radialGradient id={`body-${uid}`} cx="40%" cy="24%" r="82%">
          <stop offset="0%" stopColor={c.light} />
          <stop offset="55%" stopColor={c.body} />
          <stop offset="100%" stopColor={c.shade} />
        </radialGradient>
        <radialGradient id={`cream-${uid}`} cx="50%" cy="26%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={c.cream} />
        </radialGradient>
      </defs>

      {bare && <ellipse cx="100" cy="176" rx="42" ry="7" fill={INK} opacity=".1" />}

      {/* 머리 위 소품 */}
      {sleeping && (
        <g className="zzz" fill="currentColor" fontWeight="700">
          <text x="138" y="34" fontSize="13">z</text>
          <text x="150" y="21" fontSize="17">Z</text>
        </g>
      )}
      {mood === 'almostDone' && (
        <g className="bubble-clock">
          <circle cx="158" cy="26" r="14" fill="#fff" stroke={INK} strokeWidth="2" />
          <path d="M158 18 V26 L164 30" stroke={INK} strokeWidth="2.3" fill="none" strokeLinecap="round" />
        </g>
      )}
      {mood === 'oneMore' && <path className="sweat" d="M144 46 q6 8 0 12 q-6 -4 0 -12z" fill="#8fd0ff" />}
      {mood === 'starting' && (
        <g className="sparkles" fill="#ffc83d">
          <path d="M38 34 l3 6 6 3 -6 3 -3 6 -3 -6 -6 -3 6 -3z" />
          <path d="M158 30 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
        </g>
      )}

      <g className="hamster-body">
        {/* 은은한 솜털 후광 */}
        <ellipse cx="100" cy="100" rx="64" ry="58" fill={c.light} opacity=".3" filter={soft} />

        {/* 귀 뒤 잔털 */}
        <g fill={c.ear}>
          {EAR_FUR_L.map((b, i) => (
            <circle key={`efl${i}`} cx={b.x} cy={b.y} r={b.r} />
          ))}
          {EAR_FUR_R.map((b, i) => (
            <circle key={`efr${i}`} cx={b.x} cy={b.y} r={b.r} />
          ))}
        </g>
        {/* 귀 */}
        <circle cx="66" cy="50" r="17" fill={c.ear} />
        <circle cx="134" cy="50" r="17" fill={c.ear} />
        <circle cx="67" cy="52" r="9" fill="#f7b6b0" />
        <circle cx="133" cy="52" r="9" fill="#f7b6b0" />

        {/* 정수리 삐죽 털 */}
        <g stroke={c.shade} strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".8">
          <path d="M88 38 q3 -13 8 -3" />
          <path d="M98 35 q3 -14 8 -1" />
          <path d="M108 38 q4 -12 7 -1" />
        </g>

        {/* 몸 잔털 (겹친 털뭉치 → 그라디언트 몸통이 안쪽을 덮어 가장자리만 복슬하게 보임) */}
        <g fill={c.shade}>
          {BODY_FUR.map((b, i) => (
            <circle key={`bf${i}`} cx={b.x} cy={b.y} r={b.r} />
          ))}
        </g>
        <ellipse cx="100" cy="98" rx="50" ry="45" fill={`url(#body-${uid})`} />

        <ellipse cx="100" cy="60" rx="18" ry="10" fill={c.shade} opacity=".3" />
        <ellipse cx="100" cy="116" rx="32" ry="26" fill={`url(#cream-${uid})`} />
        {/* 볼주머니 */}
        <ellipse cx="67" cy="101" rx="13" ry="11" fill={`url(#cream-${uid})`} opacity=".92" />
        <ellipse cx="133" cy="101" rx="13" ry="11" fill={`url(#cream-${uid})`} opacity=".92" />

        <Outfit id={custom.outfit} />
        {withBag && (
          <g>
            <path d="M58 84 Q52 110 70 128" stroke="#7a4b2a" strokeWidth="5" fill="none" />
            <rect x="44" y="112" width="30" height="24" rx="5" fill="#b8733f" />
            <rect x="44" y="118" width="30" height="4" fill="#9a5b2d" />
          </g>
        )}

        {/* 얼굴 */}
        {sleeping || happyEyes ? (
          <g stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round">
            {sleeping ? (
              <>
                <path d="M77 83 q6 4 12 0" />
                <path d="M111 83 q6 4 12 0" />
              </>
            ) : (
              <>
                <path d="M77 85 q6 -7 12 0" />
                <path d="M111 85 q6 -7 12 0" />
              </>
            )}
          </g>
        ) : (
          <g className="eyes">
            <circle cx="83" cy="82" r="7" fill={INK} />
            <circle cx="117" cy="82" r="7" fill={INK} />
            <circle cx="85.5" cy="79" r="2.4" fill="#fff" />
            <circle cx="119.5" cy="79" r="2.4" fill="#fff" />
            <circle cx="80.3" cy="85.5" r="1.1" fill="#fff" opacity=".85" />
            <circle cx="114.3" cy="85.5" r="1.1" fill="#fff" opacity=".85" />
          </g>
        )}

        <ellipse cx="70" cy="96" rx="9" ry="5.5" fill="#f7a8a0" opacity=".65" filter={soft} />
        <ellipse cx="130" cy="96" rx="9" ry="5.5" fill="#f7a8a0" opacity=".65" filter={soft} />

        <path d="M96 92 q4 -3 8 0 q-4 5 -8 0z" fill="#e98585" />
        <path d="M93 98 q7 5 14 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />

        <g stroke={c.shade} strokeWidth="1.1" strokeLinecap="round" opacity=".5">
          <path d="M58 92 L34 88" />
          <path d="M58 98 L32 100" />
          <path d="M142 92 L166 88" />
          <path d="M142 98 L168 100" />
        </g>

        {custom.glasses && (
          <g stroke={INK} strokeWidth="2" fill="rgba(255,255,255,.22)">
            <circle cx="83" cy="82" r="11" />
            <circle cx="117" cy="82" r="11" />
            <path d="M94 82 h6" fill="none" />
          </g>
        )}
        <Hat id={custom.hat} />

        {bare && (
          <g className={`feet ${act === 'walking' ? 'walking' : ''}`} fill={c.ear}>
            <ellipse className="foot foot-l" cx="80" cy="140" rx="10" ry="6" />
            <ellipse className="foot foot-r" cx="120" cy="140" rx="10" ry="6" />
          </g>
        )}
        {bare && act === 'nibble' && (
          <g className="nibble" transform="rotate(18 108 90)">
            <ellipse cx="108" cy="90" rx="5" ry="3" fill="#e3c07f" stroke="#c29a52" strokeWidth="1" />
          </g>
        )}
      </g>

      {!bare && (
        <g className="desk">
          <rect x="18" y="128" width="164" height="12" rx="4" fill="#c98b5a" />
          <rect x="26" y="140" width="10" height="28" fill="#a86f45" />
          <rect x="164" y="140" width="10" height="28" fill="#a86f45" />
          {custom.laptop && (
            <g>
              <path d="M74 100 h52 l4 28 h-60z" fill="#c9ced6" />
              <circle cx="100" cy="114" r="4" fill="#fff" opacity=".8" />
              <rect x="64" y="126" width="72" height="4" rx="2" fill="#aeb4be" />
            </g>
          )}
          {custom.mug && mood !== 'break' && (
            <g>
              <rect x="146" y="112" width="16" height="16" rx="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
              <path d="M162 116 q7 0 7 5 q0 5 -7 5" stroke={INK} strokeWidth="1.5" fill="none" />
            </g>
          )}
          {deco && deco.id !== 'none' && (
            <text x="38" y="127" fontSize="20" textAnchor="middle">{deco.emoji}</text>
          )}
          {/* 앞발 */}
          {!withBag && (
            <g className={typing ? 'paws typing' : 'paws'} fill={c.body} stroke={c.ear} strokeWidth="1.5">
              <ellipse className="paw paw-l" cx="80" cy="127" rx="8" ry="5" />
              <ellipse className="paw paw-r" cx="120" cy="127" rx="8" ry="5" />
            </g>
          )}
          {mood === 'break' && (
            <g className="coffee">
              <rect x="112" y="104" width="18" height="18" rx="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
              <rect x="114" y="108" width="14" height="4" fill="#8b5a3c" />
              <path className="steam" d="M117 100 q-3 -5 0 -9 M124 100 q-3 -5 0 -9" stroke="#bbb" strokeWidth="2" fill="none" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}

function Outfit({ id }: { id: Customization['outfit'] }) {
  switch (id) {
    case 'tie':
      return (
        <g>
          <path d="M92 100 l8 6 8 -6 z" fill="#fff" />
          <path d="M97 104 h6 l3 22 -6 6 -6 -6z" fill="#3d6fd8" />
        </g>
      );
    case 'hoodie':
      return (
        <g>
          <path d="M54 110 Q100 150 146 110 L150 140 H50z" fill="#7cc6a4" />
          <path d="M62 104 Q100 126 138 104" stroke="#5aa885" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M92 112 v14 M108 112 v14" stroke="#fff" strokeWidth="2" />
        </g>
      );
    case 'cardigan':
      return (
        <g>
          <path d="M52 106 Q72 120 90 112 L92 142 H50z" fill="#f2c9d6" />
          <path d="M148 106 Q128 120 110 112 L108 142 H150z" fill="#f2c9d6" />
          <circle cx="94" cy="120" r="2" fill="#c47" />
          <circle cx="94" cy="130" r="2" fill="#c47" />
        </g>
      );
    case 'suit':
      return (
        <g>
          <path d="M52 108 Q74 116 90 104 L100 140 H50z" fill="#3b3f4a" />
          <path d="M148 108 Q126 116 110 104 L100 140 H150z" fill="#3b3f4a" />
          <path d="M96 104 h8 l2 24 -6 6 -6 -6z" fill="#d84b4b" />
        </g>
      );
    case 'apron':
      return (
        <g>
          <path d="M76 100 Q100 90 124 100" stroke="#fff" strokeWidth="3" fill="none" />
          <rect x="78" y="104" width="44" height="38" rx="8" fill="#fffaf0" stroke="#e7cfa9" strokeWidth="2" />
          <rect x="90" y="116" width="20" height="10" rx="3" fill="none" stroke="#e7cfa9" strokeWidth="2" />
        </g>
      );
    default:
      return null;
  }
}

function Hat({ id }: { id: Customization['hat'] }) {
  switch (id) {
    case 'cap':
      return (
        <g>
          <path d="M66 62 Q100 22 134 62 z" fill="#e8504b" />
          <path d="M100 62 h44 q4 0 2 4 h-46z" fill="#c63d39" />
          <circle cx="100" cy="40" r="3" fill="#c63d39" />
        </g>
      );
    case 'beanie':
      return (
        <g>
          <path d="M64 64 Q100 16 136 64 z" fill="#6b8cd6" />
          <rect x="62" y="58" width="76" height="10" rx="5" fill="#5775bb" />
          <circle cx="100" cy="28" r="7" fill="#fff" />
        </g>
      );
    case 'ribbon':
      return (
        <g transform="translate(128 50)">
          <path d="M0 0 l-14 -9 v18z M0 0 l14 -9 v18z" fill="#ff7aa8" />
          <circle r="4.5" fill="#e0548a" />
        </g>
      );
    case 'headset':
      return (
        <g>
          <path d="M58 76 Q58 30 100 30 Q142 30 142 76" stroke="#333" strokeWidth="6" fill="none" />
          <rect x="50" y="70" width="14" height="22" rx="6" fill="#444" />
          <rect x="136" y="70" width="14" height="22" rx="6" fill="#444" />
          <path d="M57 90 q4 16 22 16" stroke="#444" strokeWidth="3" fill="none" />
        </g>
      );
    case 'crown':
      return <path d="M76 58 l4 -22 12 12 8 -18 8 18 12 -12 4 22z" fill="#ffcd3c" stroke="#e0a800" strokeWidth="2" />;
    default:
      return null;
  }
}
