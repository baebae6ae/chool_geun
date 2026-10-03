import { createContext, useContext, useId } from 'react';
import { COLORS } from '../../domain/customization';
import type { Customization, Species } from '../../domain/types';
import { CAT, CAT_SIDE_HEAD, FRONT, FRONT_BY_SPECIES, LOAF, SIDE, SIDE_BY_SPECIES } from './shapes';
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
  | 'dance'
  // 반응·공유 카드용 자세
  | 'cheer'
  | 'heart'
  | 'shy'
  | 'hug'
  | 'doom';
export type SideAction = 'stand' | 'walk' | 'run' | 'sleep';
export type Pose = { pose: 'front'; action: FrontAction } | { pose: 'side'; action: SideAction };

interface Props {
  custom: Customization;
  pose: Pose;
  className?: string;
  /** 움직이지 않는 그림(공유 카드 등)이면 씨앗처럼 움직여야 어울리는 소품을 뺀다 */
  still?: boolean;
}

const INK = '#85594a';
const EYE = '#4d352b';
const PINK = '#f7b4b6';
const NOSE = '#f48f98';
const MOUTH = '#e0625f';
const TONGUE = '#ff9c96';
const BLUSH = '#ff98a0';
const LINE = 2.2;

const OUTFIT_COLOR: Record<Customization['outfit'], string> = {
  none: 'transparent',
  tie: '#3d6fd8',
  cardigan: '#f6c7d6',
  suit: '#3b3f4a',
  badge: 'transparent',
  bubble: '#cfe8f7',
  box: '#d9aa6e',
};

type Palette = (typeof COLORS)[number];

/** 손발 모양이 캐릭터마다 달라서 Paw·Arm이 알아야 한다 */
const SpeciesCtx = createContext<{ sp: Species; c: Palette }>({ sp: 'hamster', c: COLORS[0] });
const BEAK = '#f4a949';
const BIRD_FOOT = '#f2a64a';
/** 샴고양이의 포인트(귀·얼굴·발·꼬리) 색: 털 색상의 윤곽색을 쓴다 */
const points = (c: Palette) => c.line;
const footFill = (sp: Species, c: Palette) => (sp === 'bird' ? BIRD_FOOT : sp === 'cat' ? points(c) : PINK);
/** 몸통 색칠용 팔레트: 샴고양이는 연한 크림색 몸 */
const bodyPal = (sp: Species, c: Palette): Palette => (sp === 'cat' ? { ...c, body: c.cream, light: c.cream } : c);
const BLUE_EYE = '#62b4ea';

export function HamsterSprite({ custom, pose, className = '', still = false }: Props) {
  const clip = `hc-${useId().replace(/:/g, '')}`;
  const c = COLORS.find((x) => x.id === custom.color) ?? COLORS[0];
  return (
    <SpeciesCtx.Provider value={{ sp: custom.species ?? 'hamster', c }}>
      {pose.pose === 'side' ? (
        <SideView c={c} clip={clip} action={pose.action} custom={custom} className={className} />
      ) : (
        <FrontView c={c} clip={clip} action={pose.action} custom={custom} className={className} still={still} />
      )}
    </SpeciesCtx.Provider>
  );
}

interface ViewProps<A> {
  still?: boolean;
  c: Palette;
  clip: string;
  action: A;
  custom: Customization;
  className: string;
}

/** 색연필로 칠한 몸: 빗금 대신 번지는 음영(아래·옆은 진하게, 위는 종이색으로 밝게)과 칠하다 만 가장자리 */
function PencilBody({ d, c, uid }: { d: string; c: Palette; uid: string }) {
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-pb`}>
          <path d={d} />
        </clipPath>
        <radialGradient id={`${uid}-sh`} cx="0.36" cy="0.3" r="0.85">
          <stop offset="0.35" stopColor={c.shade} stopOpacity="0" />
          <stop offset="1" stopColor={c.shade} stopOpacity="0.5" />
        </radialGradient>
        <radialGradient id={`${uid}-hl`} cx="0.34" cy="0.26" r="0.4">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="0.8" />
          <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path d={d} fill={c.body} />
      <g clipPath={`url(#${uid}-pb)`}>
        <path d={d} fill={`url(#${uid}-sh)`} />
        <path d={d} fill={`url(#${uid}-hl)`} />
        <path d={d} fill="none" stroke="#fffaf0" strokeWidth="7" opacity=".5" />
      </g>
    </g>
  );
}

/* ============================ 정면 (앉은 자세) ============================ */

function FrontView({ c, clip, action, custom, className, still }: ViewProps<FrontAction>) {
  const sp = custom.species ?? 'hamster';
  const shape = FRONT_BY_SPECIES[sp];
  const bc = bodyPal(sp, c);
  const eyes: 'open' | 'closed' | 'sleepy' | 'happy' | 'spiral' | 'squeeze' | 'doom' =
    action === 'doom'
      ? 'doom'
      : action === 'groom' || action === 'yawn'
      ? 'closed'
      : action === 'doze'
        ? 'sleepy'
        : action === 'nibble' || action === 'sip' || action === 'dance' || action === 'cheer' || action === 'heart' || action === 'shy'
          ? 'happy'
          : action === 'dizzy'
            ? 'spiral'
            : action === 'sneeze'
              ? 'squeeze'
              : 'open';
  const lookUp = action === 'look';
  const mouth: 'yawn' | 'smile' | 'small' | 'wavy' | 'o' | 'frown' =
    action === 'doom'
      ? 'frown'
      : action === 'yawn'
      ? 'yawn'
      : action === 'dizzy'
        ? 'wavy'
        : action === 'sneeze'
          ? 'o'
          : (sp === 'rabbit' ? ['dance', 'cheer', 'wave'] : ['idle', 'sniff', 'look', 'type', 'wave', 'dance', 'cheer', 'heart', 'hug']).includes(action)
            ? 'smile'
            : 'small';
  const stuffed = action === 'stuff' && sp !== 'bird';
  /** 손(앞발)을 쓰는 동작인지: 이때 토끼는 바닥의 앞발을 들어 올린다 */
  const handsBusy = !['idle', 'sniff', 'look', 'doze', 'dizzy'].includes(action);
  const holding = custom.hand !== 'none' && sp !== 'bird' && ['idle', 'sniff', 'look', 'type', 'wave', 'cheer'].includes(action);
  return (
    <svg viewBox="0 0 120 120" className={`hs hs-front act-${action} ${className}`} aria-hidden>
      <clipPath id={clip}>
        <path d={shape.clip} />
      </clipPath>

      <ellipse className="hs-shadow" cx="60" cy="109" rx="38" ry="4" fill={INK} opacity=".1" />

      <g className="hs-bob" strokeLinecap="round" strokeLinejoin="round">
        {/* 다크 모드에서만 보이는 밝은 테두리 (어두운 배경에 윤곽이 묻히지 않게) */}
        <g className="hs-halo" fill="none" strokeWidth={LINE + 4}>
          {sp === 'hamster' && (
            <>
              <circle cx="31" cy="26" r="9.5" />
              <circle cx="89" cy="26" r="9.5" />
            </>
          )}
          <path d={shape.body} />
          {sp === 'cat' && <path d={CAT.head.body} />}
          <ellipse cx="45" cy="106.5" rx="7" ry="3.8" />
          <ellipse cx="75" cy="106.5" rx="7" ry="3.8" />
        </g>
        {/* 귀 */}
        <FrontBack sp={sp} c={c} />

        {/* 볼주머니 (몸 뒤에 먼저 그려서 바깥쪽 윤곽만 보이게) */}
        {stuffed && (
          <g className="hs-cheeks" fill={bc.body} stroke={INK} strokeWidth={LINE}>
            <circle cx="22" cy="70" r="14" />
            <circle cx="98" cy="70" r="14" />
          </g>
        )}

        {/* 몸 */}
        <PencilBody d={shape.body} c={bc} uid={clip} />
        <g clipPath={`url(#${clip})`}>
          <FrontOutfit id={custom.outfit} />
        </g>
        <path d={shape.body} fill="none" stroke={INK} strokeWidth={LINE} />
        {sp === 'cat' && (
          <>
            {/* 앉은 앞다리 (손을 쓰는 동작에선 들어 올린다) */}
            {!handsBusy && (
              <g stroke={INK} strokeWidth="1.8" fill="none" opacity=".7">
                <path d="M45 90 Q44 97 44 102 M57 88 Q58 96 58 103 M63 88 Q62 96 62 103 M75 90 Q76 97 76 102" />
              </g>
            )}
            <PencilBody d={CAT.head.body} c={bc} uid={`${clip}-h`} />
            <path d={CAT.head.body} fill="none" stroke={INK} strokeWidth={LINE} />
          </>
        )}
        <FrontOver sp={sp} c={c} uid={clip} />
        {stuffed ? (
          <g className="hs-cheeks" fill={bc.body}>
            <circle cx="22" cy="70" r="12.6" />
            <circle cx="98" cy="70" r="12.6" />
          </g>
        ) : (
          <g stroke={INK} strokeWidth="2" fill="none">
            {sp === 'hamster' && action !== 'yawn' && action !== 'dance' && <path d={FRONT.ticksL} />}
            {sp === 'hamster' && action !== 'yawn' && action !== 'wave' && action !== 'dance' && action !== 'sneeze' && <path d={FRONT.ticksR} />}
          </g>
        )}

        {/* 볼터치 · 주둥이 */}
        <ellipse cx={stuffed ? 24 : sp === 'rabbit' ? 38 : 34} cy="67" rx="5.5" ry="3" fill={BLUSH} opacity={stuffed ? 0.7 : sp === 'rabbit' ? 0.3 : 0.45} />
        <ellipse cx={stuffed ? 96 : sp === 'rabbit' ? 82 : 86} cy="67" rx="5.5" ry="3" fill={BLUSH} opacity={stuffed ? 0.7 : sp === 'rabbit' ? 0.3 : 0.45} />
        <FrontMuzzle sp={sp} c={c} />

        {/* 눈 */}
        {eyes === 'closed' || eyes === 'happy' || eyes === 'sleepy' ? (
          <g stroke={INK} strokeWidth="2.3" fill="none">
            <path d={eyes === 'happy' ? 'M39 59 q4 -5 8 0' : eyes === 'sleepy' ? 'M39 58 h8' : 'M39 57.5 q4 3.5 8 0'} />
            <path d={eyes === 'happy' ? 'M73 59 q4 -5 8 0' : eyes === 'sleepy' ? 'M73 58 h8' : 'M73 57.5 q4 3.5 8 0'} />
          </g>
        ) : eyes === 'doom' ? (
          <g className="hs-doom-eyes">
            <ellipse cx="43" cy="58" rx="6" ry="5" fill="#f4f1e4" stroke={INK} strokeWidth="1.6" />
            <ellipse cx="77" cy="58" rx="6" ry="5" fill="#f4f1e4" stroke={INK} strokeWidth="1.6" />
            <circle cx="42" cy="60" r="1.5" fill={EYE} />
            <circle cx="78" cy="60" r="1.5" fill={EYE} />
            <path d="M36 55.6 h14 M70 55.6 h14" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
            <path d="M37.5 65 q5.5 3.2 11 0 M71.5 65 q5.5 3.2 11 0" stroke="#7a5d8c" strokeWidth="2.2" fill="none" strokeLinecap="round" opacity=".75" />
            <path d="M36 51 l9 2.4 M84 51 l-9 2.4" stroke={INK} strokeWidth="1.6" strokeLinecap="round" />
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
          <OpenEyes sp={sp} y={(lookUp ? 55 : 57) + (sp === 'rabbit' ? 1 : 0)} />
        )}

        {/* 코 · 입 */}
        <FrontNose sp={sp} />
        {action === 'doze' && <circle className="hs-snot" cx="65" cy="63.5" r="3" fill="#d6efff" stroke="#8cc3e6" strokeWidth="1" />}
        {sp === 'bird' ? (
          <Beak open={mouth === 'yawn' || mouth === 'smile' || mouth === 'o'} />
        ) : sp === 'rabbit' && (mouth === 'small' || mouth === 'smile') ? (
          mouth === 'smile' ? (
            <path className="hs-mouth" d="M57.2 68.4 Q60 69.6 62.8 68.4 Q62.2 72.2 60 72.2 Q57.8 72.2 57.2 68.4Z" fill={MOUTH} stroke={INK} strokeWidth="1.5" />
          ) : (
            <path className="hs-mouth" d="M60 67 v1.4 M57.4 68.4 q1.3 1.5 2.6 0 q1.3 1.5 2.6 0" stroke={INK} strokeWidth="1.4" fill="none" />
          )
        ) : (
          <>
        {mouth === 'yawn' ? (
          <ellipse className="hs-yawn-mouth" cx="60" cy="69" rx="4.2" ry="5" fill={MOUTH} stroke={INK} strokeWidth="1.8" />
        ) : mouth === 'frown' ? (
          <g className="hs-mouth">
            <path d="M53.5 71.5 q6.5 -6 13 0" stroke={INK} strokeWidth="1.9" fill="none" strokeLinecap="round" />
            <path d="M66 67 q1.6 3 0 5" stroke="#8fd0ff" strokeWidth="1.2" fill="none" />
          </g>
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
          </>
        )}
        {sp === 'cat' && <Whiskers />}

        {custom.outfit === 'tie' || custom.outfit === 'suit' ? (
          <g stroke={INK} strokeWidth="1.3">
            <path d="M55.5 78 l4.5 3 4.5 -3z" fill="#fff" />
            <path d="M58 80.6 h4 l2 12 -4 4 -4 -4z" fill={custom.outfit === 'suit' ? '#d84b4b' : '#3d6fd8'} />
          </g>
        ) : null}

        <g transform={sp === 'cat' && ['yawn', 'dance', 'cheer', 'hug', 'wave'].includes(action) ? 'translate(0 14)' : undefined}>
          <FrontHands action={action} c={c} still={still} />
        </g>
        {holding && (
          <g transform={action === 'wave' ? 'translate(106 56)' : action === 'cheer' ? 'translate(111 34)' : 'translate(71 84)'}>
            <HandItem id={custom.hand} />
            {action !== 'wave' && action !== 'cheer' && <ellipse cx="0" cy="0" rx="5" ry="4.2" transform="rotate(20)" fill={sp === 'rabbit' ? c.body : footFill(sp, c)} stroke={INK} strokeWidth="2" />}
          </g>
        )}

        {/* 발 */}
        {sp === 'rabbit' ? (
          // 뒷발은 늘 바닥에. 앞발은 손을 쓰지 않을 때만 바닥에 내려놓는다 (발이 여섯 개가 되지 않게)
          <g fill={c.body} stroke={INK} strokeWidth="2">
            <ellipse cx="19" cy="103" rx="10" ry="5.4" />
            <ellipse cx="101" cy="103" rx="10" ry="5.4" />
            <path d="M14 101 v3 M106 101 v3" strokeWidth="1.2" opacity=".55" />
            {!handsBusy && (
              <>
                <ellipse cx="48" cy="104" rx="8.4" ry="5.2" />
                <path d="M45 101.6 v3 M50.6 101.6 v3" strokeWidth="1.2" opacity=".55" />
                {!holding && (
                  <>
                    <ellipse cx="72" cy="104" rx="8.4" ry="5.2" />
                    <path d="M69.4 101.6 v3 M75 101.6 v3" strokeWidth="1.2" opacity=".55" />
                  </>
                )}
              </>
            )}
          </g>
        ) : sp === 'cat' ? (
          <g fill={points(c)} stroke={INK} strokeWidth="2">
            <ellipse cx="31" cy="104.5" rx="8" ry="4" />
            <ellipse cx="89" cy="104.5" rx="8" ry="4" />
            {!handsBusy && (
              <>
                <ellipse cx="51" cy="104.5" rx="7.4" ry="4.4" />
                {!holding && <ellipse cx="69" cy="104.5" rx="7.4" ry="4.4" />}
              </>
            )}
          </g>
        ) : (
          <g fill={footFill(sp, c)} stroke={INK} strokeWidth="2">
            <ellipse cx="45" cy="106.5" rx="7" ry="3.8" />
            <ellipse cx="75" cy="106.5" rx="7" ry="3.8" />
          </g>
        )}

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
      {action === 'cheer' && (
        <g className="hs-sparkle" fill="#ffd23c" stroke={INK} strokeWidth="1.1" strokeLinejoin="round">
          <path d={star(14, 14, 5)} />
          <path d={star(106, 12, 4.4)} />
          <path d={star(60, 5, 3.4)} />
        </g>
      )}
      {(action === 'hug' || action === 'heart' || action === 'shy') && (
        <g className="hs-hearts" fill="#ff8fa8" stroke={INK} strokeWidth="1" strokeLinejoin="round">
          <path d="M101 24 c-6 -5 -7 -10 -3 -10 c2 0 3 1.2 3 2.6 c0 -1.4 1 -2.6 3 -2.6 c4 0 3 5 -3 10z" />
          <path d="M16 30 c-4.4 -3.6 -5 -7.4 -2.2 -7.4 c1.6 0 2.2 .9 2.2 1.9 c0 -1 .6 -1.9 2.2 -1.9 c2.8 0 2.2 3.8 -2.2 7.4z" />
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
      {action === 'doom' && (
        <g>
          <path className="hs-sweat" d="M100 34 q4 6 0 9 q-4 -3 0 -9z" fill="#8fd0ff" stroke={INK} strokeWidth="1" />
          <g className="hs-soul" fill="#f2f2ea" stroke={INK} strokeWidth="1.2" strokeLinejoin="round">
            <path d="M18 30 q-7 -2 -6 -9 q1 -7 7 -6 q6 -1 7 6 q1 5 -3 7 l1 5 l-3 -3 l-3 3z" />
            <circle cx="16.5" cy="20.5" r="1" fill={INK} stroke="none" />
            <circle cx="21.5" cy="20.5" r="1" fill={INK} stroke="none" />
          </g>
          <g stroke={INK} strokeWidth="1.1" fill="none" strokeLinecap="round" opacity=".7">
            <path d="M34 12 q2 -3 0 -6" className="hs-fume" />
            <path d="M86 12 q2 -3 0 -6" className="hs-fume" />
          </g>
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
  const { sp, c } = useContext(SpeciesCtx);
  const fill = sp === 'bird' ? c.ear : sp === 'cat' ? points(c) : sp === 'rabbit' ? c.body : PINK;
  return <ellipse cx={x} cy={y} rx="5" ry="4.2" transform={`rotate(${rot} ${x} ${y})`} fill={fill} stroke={INK} strokeWidth="2" />;
}

/** 몸 뒤에 그리는 부분: 귀(햄스터·고양이), 새의 날개와 머리깃 */
function FrontBack({ sp, c }: { sp: Species; c: Palette }) {
  if (sp === 'bird') {
    return (
      <g strokeLinejoin="round">
        <g fill={c.body} stroke={INK} strokeWidth="1.8" className="hs-ears">
          <path d="M60 24 C55 15 56 7 61 4 C64 9 64 17 60 24Z" />
          <path d="M53 25 C46 20 45 12 49 9 C54 13 57 19 53 25Z" />
          <path d="M67 25 C74 20 75 12 71 9 C66 13 63 19 67 25Z" />
        </g>
      </g>
    );
  }
  if (sp === 'cat') {
    const pc = points(c);
    return (
      <g strokeLinejoin="round">
        {/* 몸 오른쪽에서 말려 올라간 꼬리 */}
        <g className="hs-tail" fill="none" strokeLinecap="round">
          <path d="M84 100 Q108 104 108 82 Q108 70 100 68" stroke={INK} strokeWidth="10.4" />
          <path d="M84 100 Q108 104 108 82 Q108 70 100 68" stroke={pc} strokeWidth="6.4" />
        </g>
        <g className="hs-ears">
          <g className="hs-ear-l">
            <path d="M26 38 C23 26 23 14 26 5 C35 9 44 15 50 23Z" fill={pc} stroke={INK} strokeWidth={LINE} />
            <path d="M29.5 30 C28 23 28 16 30 11 C35 14 40 18 44 23Z" fill={PINK} opacity=".85" />
          </g>
          <g className="hs-ear-r">
            <path d="M94 38 C97 26 97 14 94 5 C85 9 76 15 70 23Z" fill={pc} stroke={INK} strokeWidth={LINE} />
            <path d="M90.5 30 C92 23 92 16 90 11 C85 14 80 18 76 23Z" fill={PINK} opacity=".85" />
          </g>
        </g>
      </g>
    );
  }
  if (sp === 'rabbit') return null;
  return (
    <g className="hs-ears" fill={c.ear} stroke={INK} strokeWidth={LINE}>
      <circle className="hs-ear-l" cx="31" cy="26" r="9.5" />
      <circle className="hs-ear-r" cx="89" cy="26" r="9.5" />
    </g>
  );
}

/** 몸 위에 얹는 부분: 롭이어 토끼의 축 처진 귀, 샴고양이의 얼굴 마스크 */
function FrontOver({ sp, c, uid }: { sp: Species; c: Palette; uid: string }) {
  if (sp === 'rabbit') {
    // 머리 위 양옆에서 볼을 따라 축 늘어진 가는 귀
    return (
      <g strokeLinejoin="round" fill={c.ear} stroke={INK} strokeWidth={LINE}>
        <g className="hs-lop-l">
          <path d="M37 26 C29 26 21 36 18 50 C15 62 15 72 20 76 C25 79 29 74 30 66 C31 56 33 44 40 31 Z" />
          <path d="M31 36 C26 44 23 56 23 68" fill="none" stroke="#fff" strokeWidth="2" opacity=".35" />
        </g>
        <g className="hs-lop-r">
          <path d="M83 26 C91 26 99 36 102 50 C105 62 105 72 100 76 C95 79 91 74 90 66 C89 56 87 44 80 31 Z" />
          <path d="M89 36 C94 44 97 56 97 68" fill="none" stroke="#fff" strokeWidth="2" opacity=".35" />
        </g>
      </g>
    );
  }
  if (sp === 'cat') {
    return (
      <g>
        <defs>
          <radialGradient id={`${uid}-mk`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={points(c)} stopOpacity="0.78" />
            <stop offset="0.6" stopColor={points(c)} stopOpacity="0.5" />
            <stop offset="1" stopColor={points(c)} stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="60" cy="61" rx="23" ry="16" fill={`url(#${uid}-mk)`} />
        <ellipse cx="60" cy="69.5" rx="8" ry="4.6" fill={c.cream} opacity=".92" />
      </g>
    );
  }
  return null;
}

/** 얼굴 아래쪽 주둥이 */
function FrontMuzzle({ sp, c }: { sp: Species; c: Palette }) {
  if (sp === 'bird' || sp === 'cat') return null;
  if (sp === 'rabbit') {
    return (
      <g fill="#fff" opacity=".7">
        <ellipse cx="56.4" cy="68.6" rx="4.4" ry="3.3" />
        <ellipse cx="63.6" cy="68.6" rx="4.4" ry="3.3" />
      </g>
    );
  }
  return <ellipse cx="60" cy="66" rx="10.5" ry="8" fill={c.cream} />;
}

function FrontNose({ sp }: { sp: Species }) {
  if (sp === 'bird') return null;
  if (sp === 'cat') return <path className="hs-nose" d="M56.6 59.6 h6.8 l-3.4 4.4z" fill="#e8899a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />;
  if (sp === 'rabbit') return <path className="hs-nose" d="M57.6 64.2 Q60 63 62.4 64.2 Q61.6 66.8 60 67 Q58.4 66.8 57.6 64.2Z" fill={NOSE} />;
  return <ellipse className="hs-nose" cx="60" cy="61.5" rx="2.9" ry="2.1" fill={NOSE} />;
}

/** 고양이·토끼 수염 (정면) */
function Whiskers({ short = false }: { short?: boolean }) {
  const e = short ? 36 : 25;
  return (
    <g stroke={INK} strokeWidth="1.4" strokeLinecap="round" opacity=".6" fill="none">
      <path d={`M46 64 L${e} ${short ? 62 : 60} M46 68 L${e} ${short ? 68 : 70}`} />
      <path d={`M74 64 L${120 - e} ${short ? 62 : 60} M74 68 L${120 - e} ${short ? 68 : 70}`} />
    </g>
  );
}

/** 새 부리 (정면). open이면 입을 벌린다 */
function Beak({ open }: { open: boolean }) {
  return open ? (
    <g className="hs-nose" stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M56 67 Q60 76 64 67 Q60 69.5 56 67Z" fill="#e8744f" />
      <path d="M56.8 70 Q60 67 63.2 70 Q60 73 56.8 70Z" fill="#ff9c96" stroke="none" />
      <path d="M55 62.5 Q60 56 65 62.5 Q60 67 55 62.5Z" fill={BEAK} />
    </g>
  ) : (
    <g className="hs-nose" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M55 62.5 Q60 56 65 62.5 Q60 69 55 62.5Z" fill={BEAK} />
      <path d="M56.6 63.8 Q60 65.4 63.4 63.8" fill="none" strokeWidth="1.2" />
    </g>
  );
}

/** 눈 동그라미 (샴고양이는 파란 눈에 세로 동공) */
function OpenEyes({ sp, y }: { sp: Species; y: number }) {
  if (sp === 'cat') {
    return (
      <g className="hs-blink">
        {[43, 77].map((x) => (
          <g key={x}>
            <circle cx={x} cy={y} r="4.7" fill={BLUE_EYE} stroke={INK} strokeWidth="0.9" />
            <ellipse cx={x} cy={y} rx="1.5" ry="3.5" fill={EYE} />
            <circle cx={x + 1.5} cy={y - 1.5} r="1.2" fill="#fff" />
          </g>
        ))}
      </g>
    );
  }
  const r = sp === 'bird' ? 3.9 : sp === 'rabbit' ? 3 : 3.5;
  const [x1, x2] = sp === 'rabbit' ? [41, 79] : [43, 77];
  return (
    <g className="hs-blink" fill={sp === 'rabbit' ? '#2d2427' : EYE}>
      <circle cx={x1} cy={y} r={r} />
      <circle cx={x2} cy={y} r={r} />
      <circle cx={x1 + 1.1} cy={y - 1.1} r="1" fill="#fff" />
      <circle cx={x2 + 1.1} cy={y - 1.1} r="1" fill="#fff" />
    </g>
  );
}

/** 몸 옆에서 뻗어 나온 짧은 팔 (몸 색 + 분홍 손) */
function Arm({ from, to, c }: { from: [number, number]; to: [number, number]; c: Palette }) {
  const { sp } = useContext(SpeciesCtx);
  const fill = sp === 'bird' ? c.ear : sp === 'cat' ? c.cream : c.body;
  const d = `M${from[0]} ${from[1]} L${to[0]} ${to[1]}`;
  return (
    <g>
      <path d={d} stroke={INK} strokeWidth="15" />
      <path d={d} stroke={fill} strokeWidth="10.4" />
      <circle cx={from[0]} cy={from[1]} r="6.4" fill={fill} />
      <Paw x={to[0]} y={to[1]} />
    </g>
  );
}

function FrontHands({ action, c, still = false }: { action: FrontAction; c: Palette; still?: boolean }) {
  const { sp } = useContext(SpeciesCtx);
  if (sp === 'bird') return <BirdWings action={action} c={c} still={still} />;
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
          {!still && <Seed x={60} y={74} />}
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
    case 'doom':
      return (
        <>
          <g className="hs-hand hs-tap-slow-l"><Paw x={47} y={97} rot={-8} /></g>
          <g className="hs-hand hs-tap-slow-r"><Paw x={73} y={97} rot={8} /></g>
        </>
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
    case 'cheer':
      return (
        <>
          <g className="hs-hand hs-cheer-l"><Arm from={[26, 62]} to={[9, 36]} c={c} /></g>
          <g className="hs-hand hs-cheer-r"><Arm from={[94, 62]} to={[111, 36]} c={c} /></g>
        </>
      );
    case 'hug':
      return (
        <>
          <g className="hs-hand hs-hug-l"><Arm from={[26, 68]} to={[5, 60]} c={c} /></g>
          <g className="hs-hand hs-hug-r"><Arm from={[94, 68]} to={[115, 60]} c={c} /></g>
        </>
      );
    case 'shy':
      return (
        <>
          <Paw x={38} y={68} rot={-30} />
          <Paw x={82} y={68} rot={30} />
        </>
      );
    case 'heart':
      return (
        <g className="hs-heart-hold">
          <path
            d="M60 99 C46 89 48 77 55 77 C58 77 60 79 60 81.5 C60 79 62 77 65 77 C72 77 74 89 60 99Z"
            fill="#ff8fa8"
            stroke={INK}
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M54 82 q-1.6 2 -.4 4" stroke="#fff" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <Paw x={49} y={89} rot={-25} />
          <Paw x={71} y={89} rot={25} />
        </g>
      );
    case 'wave':
      return (
        <>
          <Paw x={53} y={81} rot={-20} />
          <g className="hs-wave"><Arm from={[93, 73]} to={[106, 58]} c={c} /></g>
        </>
      );
    default:
      // 토끼는 앞발이 바닥에 있어서 가만히 있을 땐 손을 따로 그리지 않는다
      if (sp === 'rabbit' || sp === 'cat') return null;
      return (
        <>
          <Paw x={53} y={81} rot={-20} />
          <Paw x={67} y={81} rot={20} />
        </>
      );
  }
}

/**
 * 오목눈이는 손이 없다: 몸 옆의 날개만 쓴다.
 * 접고 있다가, 신나면 두 날개를 들어 파닥, 인사는 한쪽 날개, 안아줄 땐 활짝.
 */
function BirdWings({ action, c, still }: { action: FrontAction; c: Palette; still: boolean }) {
  const mode: 'fold' | 'up' | 'wave' | 'open' =
    action === 'cheer' || action === 'dance' || action === 'yawn'
      ? 'up'
      : action === 'wave'
        ? 'wave'
        : action === 'hug'
          ? 'open'
          : 'fold';
  const L = 'M24 60 C12 66 11 90 23 97 C32 99 37 88 35 76 C34 67 30 61 24 60Z';
  const R = 'M96 60 C108 66 109 90 97 97 C88 99 83 88 85 76 C86 67 90 61 96 60Z';
  const lines = (side: 'l' | 'r') =>
    side === 'l' ? 'M22 76 q6 3 10 0 M22 85 q6 3 10 0' : 'M98 76 q-6 3 -10 0 M98 85 q-6 3 -10 0';
  const wing = (side: 'l' | 'r', rot: number, flap: boolean) => (
    <g transform={`rotate(${rot} ${side === 'l' ? 30 : 90} 64)`}>
      <g className={flap ? `hs-flap-${side}` : undefined}>
        <path d={side === 'l' ? L : R} />
        <path d={lines(side)} fill="none" strokeWidth="1.3" opacity=".55" />
      </g>
    </g>
  );
  return (
    <g fill={c.ear} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
      {(action === 'nibble' || action === 'stuff') && !still && <Seed x={60} y={74} />}
      {mode === 'fold' && (
        <>
          {wing('l', 0, false)}
          {wing('r', 0, false)}
        </>
      )}
      {mode === 'up' && (
        <>
          {wing('l', 120, true)}
          {wing('r', -120, true)}
        </>
      )}
      {mode === 'wave' && (
        <>
          {wing('l', 0, false)}
          {wing('r', -115, true)}
        </>
      )}
      {mode === 'open' && (
        <>
          {wing('l', 70, false)}
          {wing('r', -70, false)}
        </>
      )}
    </g>
  );
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
    case 'badge':
      return (
        <g stroke={INK} strokeWidth="1.6" strokeLinejoin="round">
          <path d="M42 78 L60 98 M78 78 L60 98" stroke="#3d6fd8" strokeWidth="4" fill="none" />
          <rect x="46" y="96" width="28" height="22" rx="3.5" fill="#fff" />
          <rect x="46" y="96" width="28" height="7" rx="2.5" fill="#3d6fd8" />
          <circle cx="54" cy="110" r="3.4" fill="#f5c9a0" strokeWidth="1" />
          <path d="M60 108.5h10M60 113h7" stroke="#9aa3b2" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      );
    case 'bubble':
      return (
        <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
          <path d="M-2 80 Q60 100 122 80 L128 124 H-8Z" fill="#a9d6f0" opacity=".95" />
          <g fill="#e8f6ff" fillOpacity=".85" stroke="#6fa6c8" strokeWidth="1.3">
            {[[12, 96], [28, 102], [44, 106], [60, 108], [76, 106], [92, 102], [108, 96], [20, 112], [38, 116], [56, 118], [74, 116], [92, 112], [104, 108]].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="6.4" />
            ))}
          </g>
        </g>
      );
    case 'box':
      return (
        <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
          <path d="M8 88 L112 88 L116 124 H4Z" fill={col} />
          <path d="M8 88 L18 80 H102 L112 88Z" fill="#e8c18c" />
          <path d="M60 80 V124" stroke="#f3e2c0" strokeWidth="9" />
          <path d="M60 80 V124" stroke={INK} strokeWidth="1.2" opacity=".35" />
          <path d="M22 108 h12 M26 104 v8" stroke="#8d5d36" strokeWidth="2" strokeLinecap="round" />
        </g>
      );
    default:
      return null;
  }
}

/** 머리 위에 올리는 사무용품. (0,0)은 머리 꼭대기 가운데, 위쪽이 -y */
function Hat({ id, side }: { id: Customization['hat']; side: boolean }) {
  switch (id) {
    case 'postit':
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" transform="rotate(-7)">
          <path d="M-12 -17 H12 V4 L5 10 H-12Z" fill="#ffe56b" />
          <path d="M12 4 L5 4 L5 10Z" fill="#f2c94a" />
          <path d="M-7 -10 H7 M-7 -5 H5" stroke="#d9a63a" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      );
    case 'cup':
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
          <path d="M-10 -22 H10 L15 4 H-15Z" fill="#fff" />
          <path d="M-12.5 -9 H12.5 L13.8 -2 H-13.8Z" fill="#e8504b" stroke="none" />
          <path d="M-14 4 q14 5 28 0" fill="none" />
          <ellipse cx="0" cy="-22" rx="10" ry="2.4" fill="#f4efe6" />
        </g>
      );
    case 'stapler':
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" transform="translate(0 -4) rotate(-4)">
          <rect x="-17" y="-8" width="34" height="12" rx="4.5" fill="#e8504b" />
          <path d="M-17 -8 Q-16 -19 -4 -18 H17 L17 -9 Z" fill="#7a8190" />
          <path d="M-12 -14 H8" stroke="#c9cdd4" strokeWidth="2" strokeLinecap="round" />
          <rect x="-13" y="2" width="26" height="3.5" rx="1.7" fill="#d6d9e0" stroke="none" />
          <path d="M11 -4 L16 -4" stroke="#fff" strokeWidth="2" opacity=".6" strokeLinecap="round" />
        </g>
      );
    case 'mouse':
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" transform="translate(0 2) scale(1.25)">
          <path d="M0 -28 q10 -10 18 -2 q4 5 -2 9" fill="none" stroke="#6f7480" strokeWidth="2" />
          <path d="M-12 4 Q-14 -22 0 -22 Q14 -22 12 4 Q0 9 -12 4Z" fill="#f3f5fa" />
          <path d="M0 -22 V-9 M-12.5 -10 Q0 -6 12.5 -10" fill="none" />
          <path d="M-6 -21 Q-10 -14 -10 -10" fill="none" stroke="#fff" strokeWidth="2.4" opacity=".8" />
        </g>
      );
    case 'eraser':
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" transform="rotate(5)">
          <rect x="-16" y="-14" width="32" height="16" rx="4" fill="#ffb3c1" />
          <path d="M3 -14 H12 Q16 -14 16 -10 V-2 Q16 2 12 2 H3Z" fill="#7fb4ea" />
          <path d="M-10 -8 H-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".7" />
        </g>
      );
    case 'tape':
      return (
        <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
          <ellipse cx="0" cy="-8" rx="17" ry="11" fill="#f2d08a" />
          <ellipse cx="0" cy="-9" rx="9" ry="5.5" fill="#fff4dc" />
          <path d="M-17 -8 q-6 6 -3 14 l9 -1" fill="#f6dfa8" />
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
    default:
      return null;
  }
}

/** 손에 든 사무용품. (0,0)이 쥐는 곳, 위쪽이 -y */
function HandItem({ id }: { id: Customization['hand'] }) {
  switch (id) {
    case 'pencil':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round" transform="rotate(18)">
          <rect x="-3" y="-30" width="6" height="28" rx="1" fill="#ffd23c" />
          <path d="M-3 -30 L3 -30 L0 -37Z" fill="#f5d6b0" />
          <path d="M-1 -34.5 L1 -34.5 L0 -37Z" fill="#555" stroke="none" />
          <rect x="-3" y="-4" width="6" height="5" rx="1" fill="#ffb3c1" />
          <path d="M-3 -4 H3" stroke="#c9cdd4" strokeWidth="2" />
        </g>
      );
    case 'highlighter':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round" transform="rotate(14)">
          <rect x="-4.5" y="-26" width="9" height="24" rx="2" fill="#fff6a0" />
          <path d="M-4.5 -26 L4.5 -26 L2.6 -32 H-2.6Z" fill="#ff7aa8" />
          <rect x="-4.5" y="-8" width="9" height="8" rx="2" fill="#9aa3b2" />
        </g>
      );
    case 'calculator':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round" transform="rotate(-8)">
          <rect x="-10" y="-24" width="20" height="26" rx="3" fill="#dfe3ea" />
          <rect x="-7" y="-21" width="14" height="6" rx="1.2" fill="#b9e6c4" />
          {[-6, 0, 6].flatMap((x) => [-9, -3, 3].map((y) => <circle key={`${x}${y}`} cx={x} cy={y} r="1.7" fill="#7d8290" stroke="none" />))}
        </g>
      );
    case 'stamp':
      return (
        <g stroke={INK} strokeWidth="1.5" strokeLinejoin="round">
          <rect x="-4" y="-30" width="8" height="15" rx="3.5" fill="#c46a4a" />
          <rect x="-9" y="-15" width="18" height="7" rx="2" fill="#8d5d36" />
          <rect x="-8" y="-8" width="16" height="6" rx="1.5" fill="#e8504b" />
        </g>
      );
    default:
      return null;
  }
}

/* ============================ 옆모습 (걷기/달리기/자기) ============================ */

/** 옆모습·자는 자세의 캐릭터별 공통 조각 */
function SideMask({ uid, c, cx, cy, rx, ry }: { uid: string; c: Palette; cx: number; cy: number; rx: number; ry: number }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-smk`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={points(c)} stopOpacity="0.78" />
          <stop offset="0.6" stopColor={points(c)} stopOpacity="0.5" />
          <stop offset="1" stopColor={points(c)} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${uid}-smk)`} />
    </g>
  );
}

/** 자는 자세: 앞을 보고 납작 엎드려 눈 감고, 앞발은 턱 밑에 */
function SleepView({ c, clip, custom, className }: Omit<ViewProps<SideAction>, 'action'>) {
  const sp = custom.species ?? 'hamster';
  const bc = bodyPal(sp, c);
  const pc = points(c);
  return (
    <svg viewBox="0 0 140 100" className={`hs hs-side act-sleep ${className}`} aria-hidden>
      <clipPath id={clip}>
        <path d={LOAF.clip} />
      </clipPath>
      <ellipse className="hs-shadow" cx="70" cy="93" rx="48" ry="4" fill={INK} opacity=".1" />

      <g className="hs-bob" strokeLinecap="round" strokeLinejoin="round">
        <g className="hs-halo" fill="none" strokeWidth={LINE + 4}>
          {sp === 'hamster' && (
            <>
              <ellipse cx="35" cy="47" rx="9.5" ry="7.5" transform="rotate(-35 35 47)" />
              <ellipse cx="105" cy="47" rx="9.5" ry="7.5" transform="rotate(35 105 47)" />
            </>
          )}
          <path d={LOAF.body} />
        </g>
        {/* 귀는 살짝 눕힘 */}
        {sp === 'hamster' && (
          <g fill={c.ear} stroke={INK} strokeWidth={LINE}>
            <ellipse cx="35" cy="47" rx="9.5" ry="7.5" transform="rotate(-35 35 47)" />
            <ellipse cx="105" cy="47" rx="9.5" ry="7.5" transform="rotate(35 105 47)" />
          </g>
        )}
        {sp === 'cat' && (
          <g fill={pc} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
            <path d="M29 58 C25 44 27 33 32 27 C41 30 48 38 54 47Z" />
            <path d="M111 58 C115 44 113 33 108 27 C99 30 92 38 86 47Z" />
            <path d="M33 50 C31 42 32 37 35 33 C40 36 44 40 47 45Z M107 50 C109 42 108 37 105 33 C100 36 96 40 93 45Z" fill={PINK} stroke="none" opacity=".85" />
          </g>
        )}
        {sp === 'bird' && (
          <g fill={c.body} stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
            <path d="M70 41 C65 34 66 27 71 25 C74 30 74 36 70 41Z" />
            <path d="M63 42 C56 38 55 31 59 28 C64 32 67 37 63 42Z" />
            <path d="M77 42 C84 38 85 31 81 28 C76 32 73 37 77 42Z" />
          </g>
        )}

        <PencilBody d={LOAF.body} c={bc} uid={clip} />
        <g clipPath={`url(#${clip})`}>
          <SideOutfit id={custom.outfit} />
        </g>
        <path d={LOAF.body} fill="none" stroke={INK} strokeWidth={LINE} />
        {sp === 'rabbit' && (
          <g fill={c.ear} stroke={INK} strokeWidth={LINE} strokeLinejoin="round">
            <path d="M40 44 C30 43 22 54 21 66 C20 76 25 82 31 79 C35 76 36 68 38 60 C40 53 43 47 40 44Z" />
            <path d="M100 44 C110 43 118 54 119 66 C120 76 115 82 109 79 C105 76 104 68 102 60 C100 53 97 47 100 44Z" />
          </g>
        )}
        {sp === 'bird' && (
          <g fill={c.ear} stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
            <path d="M24 66 C16 70 18 82 28 84 C36 84 38 76 34 70Z" />
            <path d="M116 66 C124 70 122 82 112 84 C104 84 102 76 106 70Z" />
          </g>
        )}
        {sp === 'cat' && <SideMask uid={clip} c={c} cx={70} cy={68} rx={20} ry={11} />}

        {/* 얼굴 */}
        <ellipse cx={sp === 'rabbit' ? 50 : 47} cy="71" rx="5.5" ry="3" fill={BLUSH} opacity=".45" />
        <ellipse cx={sp === 'rabbit' ? 88 : 93} cy="71" rx="5.5" ry="3" fill={BLUSH} opacity=".45" />
        {sp === 'hamster' && <ellipse cx="70" cy="72" rx="10" ry="7" fill={c.cream} />}
        {sp === 'rabbit' && (
          <g fill="#fff" opacity=".7">
            <ellipse cx="66.6" cy="72.4" rx="4.2" ry="3.2" />
            <ellipse cx="73.4" cy="72.4" rx="4.2" ry="3.2" />
          </g>
        )}
        {sp === 'cat' && <ellipse cx="70" cy="75" rx="6.6" ry="3.8" fill={c.cream} opacity=".92" />}
        <g stroke={INK} strokeWidth="2.3" fill="none">
          <path d="M52 64 q5 4.5 10 0" />
          <path d="M78 64 q5 4.5 10 0" />
        </g>
        {sp === 'bird' ? (
          <path d="M64 68.5 Q70 62 76 68.5 Q70 76 64 68.5Z M65.6 70 Q70 72 74.4 70" fill={BEAK} stroke={INK} strokeWidth="1.6" strokeLinejoin="round" />
        ) : sp === 'cat' ? (
          <>
            <path d="M66.6 66.6 h6.8 l-3.4 4.2z" fill="#e8899a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M70 71 v1.6 M66.4 72.6 q1.8 1.8 3.6 .2 q1.8 1.6 3.6 -.2" stroke={INK} strokeWidth="1.4" fill="none" />
          </>
        ) : (
          <>
            <ellipse cx="70" cy="68.5" rx="2.7" ry="2" fill={NOSE} />
            <path d="M70 70.4 v1.4 M66.6 72 q1.7 1.8 3.4 .2 q1.7 1.6 3.4 -.2" stroke={INK} strokeWidth="1.5" fill="none" />
          </>
        )}
        {sp === 'cat' && (
          <g stroke={INK} strokeWidth="1.3" strokeLinecap="round" opacity=".55" fill="none">
            <path d="M57 70 L40 66 M57 73 L40 76 M83 70 L100 66 M83 73 L100 76" />
          </g>
        )}

        {/* 턱 밑에 모은 앞발 */}
        {sp !== 'bird' && (
          <g fill={sp === 'cat' ? pc : sp === 'rabbit' ? c.body : PINK} stroke={INK} strokeWidth="2">
            <ellipse cx="61" cy="85" rx="5.6" ry="4" />
            <ellipse cx="79" cy="85" rx="5.6" ry="4" />
          </g>
        )}

        {custom.glasses && (
          <g stroke={INK} strokeWidth="1.6" fill="#ffffff" fillOpacity=".25">
            <circle cx="61" cy="47" r="6" />
            <circle cx="79" cy="47" r="6" />
            <path d="M67 46.5 h6" fill="none" />
          </g>
        )}
        <g transform="translate(70 40) rotate(-8) scale(.8)">
          <Hat id={custom.hat} side={false} />
        </g>
      </g>

      <g className="hs-zzz" fill={INK} fontWeight="800" fontFamily="system-ui, sans-serif">
        <text x="104" y="36" fontSize="10">z</text>
        <text x="113" y="25" fontSize="14">Z</text>
      </g>
    </svg>
  );
}

function SideView({ c, clip, action, custom, className }: ViewProps<SideAction>) {
  if (action === 'sleep') return <SleepView c={c} clip={clip} custom={custom} className={className} />;
  const sp = custom.species ?? 'hamster';
  const shape = SIDE_BY_SPECIES[sp];
  const bc = bodyPal(sp, c);
  const pc = points(c);
  const legClass = action === 'walk' || action === 'run' ? 'hs-leg moving' : 'hs-leg';
  const farLeg = sp === 'bird' ? '#e0953c' : sp === 'cat' ? pc : sp === 'rabbit' ? c.shade : '#e89ea2';
  const nearLeg = sp === 'bird' ? BIRD_FOOT : sp === 'cat' ? pc : sp === 'rabbit' ? c.body : PINK;
  return (
    <svg viewBox="0 0 140 100" className={`hs hs-side act-${action} ${className}`} aria-hidden>
      <clipPath id={clip}>
        <path d={shape.clip} />
      </clipPath>

      <ellipse className="hs-shadow" cx="66" cy="94" rx="46" ry="4" fill={INK} opacity=".1" />

      <g className="hs-bob" strokeLinecap="round" strokeLinejoin="round">
        <g className="hs-halo" fill="none" strokeWidth={LINE + 4}>
          {sp === 'hamster' && <circle cx="80" cy="34" r="9.5" />}
          {sp === 'hamster' && <ellipse cx="31" cy="72" rx="4.4" ry="3.4" />}
          <path d={shape.body} />
          {sp === 'cat' && <path d={CAT_SIDE_HEAD.body} />}
        </g>
        {/* 먼 쪽 다리 */}
        <g fill={farLeg} stroke={INK} strokeWidth="2">
          <g className={`${legClass} leg-fb`}><ellipse cx="44" cy="91" rx="6" ry="3.4" /></g>
          <g className={`${legClass} leg-ff`}><ellipse cx="94" cy="91" rx="5.2" ry="3.2" /></g>
        </g>

        {/* 꼬리 · 귀 */}
        <SideTail sp={sp} c={c} />
        <SideEar sp={sp} c={c} />

        {/* 몸 */}
        <PencilBody d={shape.body} c={bc} uid={clip} />
        <g clipPath={`url(#${clip})`}>
          <SideOutfit id={custom.outfit} />
        </g>
        <path d={shape.body} fill="none" stroke={INK} strokeWidth={LINE} />
        {action === 'run' && sp === 'hamster' && <path d={SIDE.ticks} stroke={INK} strokeWidth="2" fill="none" opacity=".5" />}
        {sp === 'bird' && (
          <g fill={c.ear} stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
            <path className="hs-wing" d="M44 54 C32 60 32 80 46 86 C58 90 76 84 78 70 C70 66 62 52 44 54Z" />
            <path d="M44 66 q8 4 16 2 M46 75 q8 3 16 0" fill="none" strokeWidth="1.3" opacity=".6" />
          </g>
        )}
        {sp === 'rabbit' && <SideEar sp="rabbit-front" c={c} />}
        {sp === 'cat' && (
          <>
            <PencilBody d={CAT_SIDE_HEAD.body} c={bc} uid={`${clip}-h`} />
            <path d={CAT_SIDE_HEAD.body} fill="none" stroke={INK} strokeWidth={LINE} />
            <SideMask uid={clip} c={c} cx={116} cy={59} rx={8.5} ry={7.5} />
          </>
        )}

        {/* 눈 · 코 · 입 */}
        <ellipse cx={sp === 'cat' ? 101 : 92} cy={sp === 'cat' ? 62 : 66} rx="5" ry="2.8" fill={BLUSH} opacity=".45" />
        {sp === 'hamster' && <ellipse cx="105" cy="66" rx="8.5" ry="7" fill={c.cream} />}
        {sp === 'rabbit' && <ellipse cx="107" cy="67.5" rx="5" ry="3.6" fill="#fff" opacity=".7" />}
        {sp === 'cat' && <ellipse cx="112" cy="67.4" rx="4.6" ry="2.8" fill={c.cream} opacity=".92" />}
        {sp === 'cat' ? (
          <g className="hs-blink">
            <circle cx="104.6" cy="51" r="4.5" fill={BLUE_EYE} stroke={INK} strokeWidth="0.9" />
            <ellipse cx="105.4" cy="51" rx="1.4" ry="3.3" fill={EYE} />
            <circle cx="106.6" cy="49.6" r="1.1" fill="#fff" />
          </g>
        ) : (
          <g className="hs-blink" fill={EYE}>
            <circle cx="97" cy="55" r={sp === 'bird' ? 4 : 3.6} />
            <circle cx="98.3" cy="53.7" r="1.1" fill="#fff" />
          </g>
        )}
        {sp === 'bird' ? (
          <g className="hs-nose" stroke={INK} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
            <path d="M108 57.5 L125 64 L108 70Z" fill={BEAK} />
            <path d="M109 64 L123 64.3" fill="none" strokeWidth="1.3" />
          </g>
        ) : sp === 'cat' ? (
          <>
            <path className="hs-nose" d="M117.4 56.2 l3.8 1.2 -2.6 3.4z" fill="#e8899a" stroke={INK} strokeWidth="1.1" strokeLinejoin="round" />
            <path d="M118.2 61 q-.6 2.6 -3.4 2.4 M114.8 63.4 q-1 1.8 -3 1.4" stroke={INK} strokeWidth="1.4" fill="none" />
          </>
        ) : (
          <>
            <ellipse className="hs-nose" cx="110" cy="62.5" rx="2.6" ry="2.1" fill={NOSE} />
            <path d="M108.6 66.4 q-1.4 2.6 -4.6 1.6" stroke={INK} strokeWidth="1.6" fill="none" />
          </>
        )}
        {sp === 'cat' && (
          <g stroke={INK} strokeWidth="1.3" strokeLinecap="round" opacity=".55" fill="none">
            <path d="M113 62 L133 57 M113 64.5 L133 65.5" />
          </g>
        )}

        {(custom.outfit === 'tie' || custom.outfit === 'suit') && (
          <path d="M98 79 l3 -1 1.6 9 -2.6 2.6 -2 -2.4z" fill={custom.outfit === 'suit' ? '#d84b4b' : '#3d6fd8'} stroke={INK} strokeWidth="1.2" />
        )}

        {custom.hand !== 'none' && sp !== 'bird' && (action === 'stand' || action === 'walk') && (
          <g transform="translate(101 84) scale(.85)">
            <HandItem id={custom.hand} />
            <ellipse cx="0" cy="0" rx="5" ry="4.2" fill={sp === 'cat' ? pc : sp === 'rabbit' ? c.body : PINK} stroke={INK} strokeWidth="2" />
          </g>
        )}

        {/* 가까운 쪽 다리 */}
        <g fill={nearLeg} stroke={INK} strokeWidth="2">
          <g className={`${legClass} leg-nb`}><ellipse cx="53" cy="91.5" rx="6.6" ry="3.6" /></g>
          <g className={`${legClass} leg-nf`}><ellipse cx="86" cy="91.5" rx="5.6" ry="3.4" /></g>
        </g>

        {custom.glasses && (
          <g stroke={INK} strokeWidth="1.8" fill="#ffffff" fillOpacity=".2" transform={sp === 'cat' ? 'translate(9 -4)' : undefined}>
            <circle cx="97" cy="55" r="7.5" />
            <path d="M89.5 54 L78 50" fill="none" />
          </g>
        )}
        <g transform={sp === 'cat' ? 'translate(96 31) rotate(10) scale(.8)' : 'translate(86 32) rotate(12) scale(.8)'}>
          <Hat id={custom.hat} side />
        </g>
      </g>
    </svg>
  );
}

/** 옆모습 꼬리: 햄스터 점꼬리 / 토끼 솜꼬리 / 샴 긴 꼬리 / 오목눈이 꽁지깃 */
function SideTail({ sp, c }: { sp: Species; c: Palette }) {
  if (sp === 'rabbit') return <circle cx="29" cy="70" r="7.6" fill="#fffdf8" stroke={INK} strokeWidth="2" />;
  if (sp === 'cat') {
    const pc = points(c);
    return (
      <g className="hs-tail" fill="none" strokeLinecap="round">
        <path d="M36 78 Q6 84 8 52 Q9 42 19 44" stroke={INK} strokeWidth="10.4" />
        <path d="M36 78 Q6 84 8 52 Q9 42 19 44" stroke={pc} strokeWidth="6.4" />
      </g>
    );
  }
  if (sp === 'bird') {
    return (
      <g fill={c.ear} stroke={INK} strokeWidth="2" strokeLinejoin="round">
        <path d="M32 66 L6 60 Q4 66 8 70 L32 72Z" />
        <path d="M32 72 L8 76 Q8 82 14 82 L34 78Z" />
      </g>
    );
  }
  return <ellipse cx="31" cy="72" rx="4.4" ry="3.4" fill={c.body} stroke={INK} strokeWidth="2" />;
}

function SideEar({ sp, c }: { sp: Species | 'rabbit-front'; c: Palette }) {
  if (sp === 'bird') {
    return (
      <g fill={c.body} stroke={INK} strokeWidth="1.8" strokeLinejoin="round">
        <path d="M80 32 C76 24 78 17 83 15 C85 21 85 27 80 32Z" />
        <path d="M74 33 C68 29 67 22 71 19 C76 23 78 28 74 33Z" />
      </g>
    );
  }
  if (sp === 'rabbit') return null;
  if (sp === 'rabbit-front') {
    return (
      <g className="hs-ears" strokeLinejoin="round">
        <g className="hs-lop-s">
          <path d="M86 30 C77 28 70 40 68 54 C66 64 67 72 72 74 C77 75 80 68 81 60 C82 50 86 40 89 33Z" fill={c.ear} stroke={INK} strokeWidth={LINE} />
          <path d="M80 40 C76 48 73 58 73 68" fill="none" stroke="#fff" strokeWidth="2" opacity=".35" />
        </g>
      </g>
    );
  }
  if (sp === 'cat') {
    return (
      <g className="hs-ears">
        <g className="hs-ear-r">
          <path d="M85 41 C84 30 87 21 92 14 C99 19 104 27 106 36Z" fill={points(c)} stroke={INK} strokeWidth={LINE} strokeLinejoin="round" />
          <path d="M89 37 C89 30 91 24 93 20 C97 24 100 28 101 33Z" fill={PINK} opacity=".85" />
        </g>
      </g>
    );
  }
  return (
    <g className="hs-ears">
      <circle className="hs-ear-r" cx="80" cy="34" r="9.5" fill={c.ear} stroke={INK} strokeWidth={LINE} />
    </g>
  );
}

function SideOutfit({ id }: { id: Customization['outfit'] }) {
  if (id === 'none' || id === 'tie') return null;
  const col = OUTFIT_COLOR[id];
  if (id === 'badge') {
    return (
      <g stroke={INK} strokeWidth="1.4" strokeLinejoin="round">
        <path d="M96 74 L100 96" stroke="#3d6fd8" strokeWidth="3" fill="none" />
        <rect x="93" y="94" width="14" height="11" rx="2" fill="#fff" />
        <rect x="93" y="94" width="14" height="4" rx="1.5" fill="#3d6fd8" />
      </g>
    );
  }
  if (id === 'box') {
    return (
      <g stroke={INK} strokeWidth="2" strokeLinejoin="round">
        <path d="M22 70 H116 L120 100 H18Z" fill={col} />
        <path d="M22 70 L28 63 H110 L116 70Z" fill="#e8c18c" />
        <path d="M70 63 V100" stroke="#f3e2c0" strokeWidth="8" />
      </g>
    );
  }
  return (
    <g>
      <path d="M0 72 Q66 88 140 68 V100 H0Z" fill={col} stroke={INK} strokeWidth="2" opacity={id === 'bubble' ? 0.92 : 1} />
      {id === 'suit' && <path d="M94 74 L108 76 L102 94Z" fill="#fff" stroke={INK} strokeWidth="1.2" />}
      {id === 'bubble' && (
        <g fill="#fff" fillOpacity=".7" stroke="#8fb9d6" strokeWidth="1">
          {[[20, 82], [40, 86], [60, 88], [80, 86], [100, 82], [118, 78], [30, 94], [52, 96], [74, 95], [96, 92]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4.4" />
          ))}
        </g>
      )}
    </g>
  );
}
