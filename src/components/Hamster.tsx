import { COLORS, DECOS } from '../domain/customization';
import type { HamsterMood } from '../domain/schedule';
import type { Customization } from '../domain/types';

interface Props {
  custom: Customization;
  mood: HamsterMood;
  /** 책상 없이 햄스터만 */
  bare?: boolean;
  className?: string;
}

const INK = '#3a2a20';

/** 기획서 4. 햄스터 애니메이션은 장식이 아니라 시간의 시각화 수단 */
export function Hamster({ custom, mood, bare = false, className = '' }: Props) {
  const c = COLORS.find((x) => x.id === custom.color) ?? COLORS[0];
  const sleeping = mood === 'beforeWork' || mood === 'holiday';
  const typing = mood === 'working' || mood === 'almostDone' || mood === 'oneMore';
  const withBag = mood === 'arriving' || mood === 'off';
  const happyEyes = mood === 'break' || mood === 'off';
  const deco = DECOS.find((d) => d.id === custom.deco);

  return (
    <svg
      viewBox="0 0 200 170"
      className={`hamster mood-${mood} ${className}`}
      role="img"
      aria-label={`햄스터 (${mood})`}
    >
      {/* 머리 위 소품 */}
      {sleeping && (
        <g className="zzz" fill="currentColor" fontWeight="700">
          <text x="140" y="40" fontSize="14">z</text>
          <text x="152" y="28" fontSize="18">Z</text>
        </g>
      )}
      {mood === 'almostDone' && (
        <g className="bubble-clock">
          <circle cx="160" cy="30" r="15" fill="#fff" stroke={INK} strokeWidth="2" />
          <path d="M160 21 V30 L167 34" stroke={INK} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
      )}
      {mood === 'oneMore' && <path className="sweat" d="M146 52 q6 9 0 13 q-6 -4 0 -13z" fill="#8fd0ff" />}
      {mood === 'starting' && (
        <g className="sparkles" fill="#ffc83d">
          <path d="M40 40 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" />
          <path d="M160 36 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
        </g>
      )}

      <g className="hamster-body">
        {/* 귀 */}
        <circle cx="64" cy="54" r="15" fill={c.ear} />
        <circle cx="136" cy="54" r="15" fill={c.ear} />
        <circle cx="64" cy="54" r="8" fill="#f7b6b0" />
        <circle cx="136" cy="54" r="8" fill="#f7b6b0" />
        {/* 몸 */}
        <ellipse cx="100" cy="98" rx="50" ry="45" fill={c.body} />
        <ellipse cx="100" cy="116" rx="32" ry="26" fill={c.belly} />

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
                <path d="M78 82 q6 4 12 0" />
                <path d="M110 82 q6 4 12 0" />
              </>
            ) : (
              <>
                <path d="M78 84 q6 -7 12 0" />
                <path d="M110 84 q6 -7 12 0" />
              </>
            )}
          </g>
        ) : (
          <g className="eyes">
            <circle cx="84" cy="81" r="5.5" fill={INK} />
            <circle cx="116" cy="81" r="5.5" fill={INK} />
            <circle cx="86" cy="79" r="1.8" fill="#fff" />
            <circle cx="118" cy="79" r="1.8" fill="#fff" />
          </g>
        )}
        <ellipse cx="72" cy="94" rx="8" ry="5" fill="#f7a8a0" opacity=".75" />
        <ellipse cx="128" cy="94" rx="8" ry="5" fill="#f7a8a0" opacity=".75" />
        <ellipse cx="100" cy="89" rx="3" ry="2.2" fill="#d9776f" />
        <path d="M95 94 q5 4 10 0" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />

        {custom.glasses && (
          <g stroke={INK} strokeWidth="2" fill="rgba(255,255,255,.25)">
            <circle cx="84" cy="81" r="10" />
            <circle cx="116" cy="81" r="10" />
            <path d="M94 81 h12" fill="none" />
          </g>
        )}
        <Hat id={custom.hat} />
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
