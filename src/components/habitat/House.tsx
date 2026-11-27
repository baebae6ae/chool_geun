/**
 * 집 꾸미기 단계: 작업물을 완성한 날(진짜 출근)이 쌓이면 방이 점점 터무니없이 호화로워진다.
 * 원룸 → 러그 → 갤러리 → 커튼 → 벽난로 → 샹들리에 → 대리석 → 황금 → 햄스터 궁전.
 * 단계는 앞 단계 위에 계속 쌓이고, 몇몇은 더 비싼 걸로 갈아 끼운다 (러그 → 페르시안 융단 등).
 * - HouseWall: 벽지 (창문·시계보다 뒤)
 * - HouseDecor: 소품 (가구보다 뒤, 바닥·벽 위)
 * - 쳇바퀴·밥그릇·이불·의자는 props.tsx에서 단계에 맞춰 금색·왕실용으로 바뀐다
 * 위쪽 소품은 위에, 바닥 소품은 아래에 붙여서 방 높이가 달라도 제자리에 있다.
 */
import type { CSSProperties } from 'react';
import type { Spots } from './brain';

export const HOUSE_LEVELS = [
  { at: 0, name: '원룸' },
  { at: 20, name: '러그 깐 원룸' },
  { at: 40, name: '갤러리 원룸' },
  { at: 70, name: '커튼 달린 방' },
  { at: 100, name: '벽난로 하우스' },
  { at: 150, name: '샹들리에 맨션' },
  { at: 200, name: '대리석 저택' },
  { at: 300, name: '황금 저택' },
  { at: 365, name: '햄스터 궁전' },
] as const;

export function houseLevel(completedDays: number): number {
  let lv = 1;
  HOUSE_LEVELS.forEach((l, i) => {
    if (completedDays >= l.at) lv = i + 1;
  });
  return lv;
}

/** 가구가 바뀌는 단계 */
export const LUX = { goldWheel: 7, royalBed: 8, goldBowl: 8, throne: 9 } as const;

const GOLD = '#f2c14e';
const GOLD_D = '#b8862a';
const INK = '#7a5a3c';

/** 벽지: 땡땡이(3) → 줄무늬(4) → 다마스크(6) → 금빛(8) → 궁전(9) */
export function HouseWall({ level }: { level: number }) {
  if (level < 3) return null;
  const kind = level >= 9 ? 'palace' : level >= 8 ? 'gold' : level >= 6 ? 'damask' : level >= 4 ? 'stripe' : 'dots';
  return <div className={`house-wall ${kind}`} aria-hidden />;
}

/** 위·아래 svg의 공통 모양 */
const layer = (W: number, edge: 'top' | 'bottom'): CSSProperties => ({ position: 'absolute', left: 0, [edge]: 0, width: W, height: 130, zIndex: 0, pointerEvents: 'none' });

function Frame({ x, y, w, h, gold, children }: { x: number; y: number; w: number; h: number; gold: boolean; children: React.ReactNode }) {
  return (
    <g transform={`translate(${x - w / 2} ${y})`}>
      <path d={`M${w / 2 - 8} 0 L${w / 2} -8 L${w / 2 + 8} 0`} fill="none" stroke={INK} strokeWidth="1" />
      <rect x="0" y="0" width={w} height={h} rx="2" fill={gold ? GOLD : '#c99a6b'} stroke={gold ? GOLD_D : INK} strokeWidth="1.6" />
      <rect x="3.5" y="3.5" width={w - 7} height={h - 7} fill="#fff8ec" />
      <g transform={`translate(${w / 2} ${h / 2})`}>{children}</g>
    </g>
  );
}

/** 액자 속 햄스터 얼굴 */
const HamFace = ({ s = 1, crown = false }: { s?: number; crown?: boolean }) => (
  <g transform={`scale(${s})`}>
    <circle cx="-6" cy="-6" r="3.4" fill="#d89a63" />
    <circle cx="6" cy="-6" r="3.4" fill="#d89a63" />
    <ellipse cx="0" cy="1" rx="9" ry="8" fill="#f2c79a" />
    <ellipse cx="0" cy="4" rx="4" ry="3" fill="#fff4e4" />
    <circle cx="-3.2" cy="-0.4" r="1.2" fill="#3a2a20" />
    <circle cx="3.2" cy="-0.4" r="1.2" fill="#3a2a20" />
    <circle cx="0" cy="2.6" r=".9" fill="#ff8fa3" />
    {crown && <path d="M-6 -9 L-6 -14 L-3 -11 L0 -15 L3 -11 L6 -14 L6 -9Z" fill={GOLD} stroke={GOLD_D} strokeWidth=".6" />}
  </g>
);

export function HouseDecor({ level, spots }: { level: number; spots: Spots }) {
  if (level < 2) return null;
  const { W } = spots;
  const wx = spots.window;
  const gold = level >= 6;
  const palace = level >= 9;
  // 창문 오른쪽 ~ 시계 왼쪽 빈 벽
  const bL = wx + 50, bR = spots.desk - 24;
  const bx = Math.round((bL + bR) / 2);
  const bw = Math.max(40, bR - bL);
  // 벽난로: 쳇바퀴와 이불 사이 (창문 아래)
  const fL = spots.wheel + 52, fR = spots.bed - 46;
  const fx = Math.round((fL + fR) / 2);
  const fw = Math.max(44, Math.min(70, fR - fL));
  const curtain = palace ? ['#b8333b', '#8f2430'] : level >= 8 ? ['#7b4bb3', '#5a3388'] : ['#f2b5b5', '#d98f92'];
  return (
    <>
      {/* ---------- 아래: 몰딩 · 바닥 · 벽난로 · 러그 · 카펫 · 보물 ---------- */}
      <svg viewBox={`0 0 ${W} 130`} style={layer(W, 'bottom')} aria-hidden>
        {level >= 6 && (
          <g>
            <rect x="0" y="48" width={W} height="52" fill={level >= 8 ? 'rgba(242,193,78,.22)' : 'rgba(255,255,255,.3)'} />
            <path d={`M0 48 H${W}`} stroke={gold && level >= 8 ? GOLD_D : 'rgba(140,100,60,.4)'} strokeWidth="3" />
            {[...Array(Math.ceil(W / 46))].map((_, i) => (
              <rect key={i} x={8 + i * 46} y="57" width="32" height="34" rx="3" fill="none" stroke={level >= 8 ? 'rgba(184,134,42,.55)' : 'rgba(140,100,60,.22)'} strokeWidth="1.5" />
            ))}
          </g>
        )}
        {/* 바닥: 원목(5) → 대리석(7) → 금 테두리 대리석(8) */}
        {level >= 5 && level < 7 && (
          <g>
            <rect x="0" y="100" width={W} height="30" fill="#e2b98a" />
            <g stroke="rgba(120,75,35,.3)" strokeWidth="1">
              {[107.5, 115, 122.5].map((y) => <path key={y} d={`M0 ${y} H${W}`} />)}
              {[...Array(Math.ceil(W / 34))].map((_, i) => <path key={i} d={`M${i * 34 + (i % 2) * 17} ${100 + (i % 4) * 7.5} v7.5`} />)}
            </g>
          </g>
        )}
        {level >= 7 && (
          <g>
            <rect x="0" y="100" width={W} height="30" fill="#f6f3ef" />
            {[...Array(Math.ceil(W / 30) + 1)].flatMap((_, i) =>
              [0, 1].map((r) => <rect key={`${i}-${r}`} x={i * 30} y={100 + r * 15} width="30" height="15" fill={(i + r) % 2 ? '#e7e1da' : '#fbfaf8'} />),
            )}
            <path d={`M10 108 q24 -5 50 2 M${W * 0.5} 122 q30 -7 64 0 M${W - 80} 106 q20 6 50 -2`} stroke="rgba(150,150,170,.4)" fill="none" strokeWidth="1" />
            <path d={`M0 100.5 H${W}`} stroke={level >= 8 ? GOLD : '#d8d0c6'} strokeWidth="2" />
          </g>
        )}
        {/* 벽난로 (5) — 7부터 대리석, 8부터 금 */}
        {level >= 5 && (
          <g transform={`translate(${fx} 0)`}>
            <rect x={-fw / 2} y="44" width={fw} height="56" rx="2" fill={level >= 7 ? '#f3efe9' : '#c7714f'} stroke={level >= 8 ? GOLD_D : level >= 7 ? '#cfc6ba' : '#8e4b33'} strokeWidth="1.6" />
            {level < 7 && (
              <g stroke="rgba(110,50,30,.45)" strokeWidth=".9">
                {[54, 64, 74, 84, 94].map((y) => <path key={y} d={`M${-fw / 2} ${y} H${fw / 2}`} />)}
              </g>
            )}
            <rect x={-fw / 2 - 6} y="38" width={fw + 12} height="7" rx="2" fill={level >= 8 ? GOLD : level >= 7 ? '#fbfaf8' : '#8e5a3a'} stroke={level >= 8 ? GOLD_D : INK} strokeWidth="1.2" />
            <path d={`M${-fw / 2 + 9} 100 V72 a${fw / 2 - 9} ${fw / 2 - 9} 0 0 1 ${fw - 18} 0 V100Z`} fill="#3b2a24" />
            <g className="house-fire">
              <path d="M-14 100 q-2 -14 8 -22 q-2 9 5 12 q0 -12 8 -18 q-1 12 7 16 q5 -6 2 -12 q10 10 -2 24z" fill="#ff8a3d" />
              <path d="M-7 100 q-1 -8 5 -12 q0 6 4 8 q2 -6 6 -8 q-1 7 2 12z" fill="#ffd54a" />
            </g>
            {/* 벽난로 위: 촛대(5) → 금 햄스터 동상(7) → 보물상자(8) */}
            {level < 7 && (
              <g>
                {[-fw / 2 + 4, fw / 2 - 4].map((x) => (
                  <g key={x}>
                    <rect x={x - 2} y="27" width="4" height="11" fill="#fffaf0" stroke="#d8cbb8" strokeWidth=".6" />
                    <ellipse className="house-flame" cx={x} cy="25" rx="1.8" ry="3" fill="#ffcc4d" />
                  </g>
                ))}
              </g>
            )}
            {level >= 7 && (
              <g transform="translate(-10 38)">
                <rect x="-8" y="-6" width="16" height="6" fill={GOLD_D} />
                <g transform="translate(0 -15)">
                  <circle cx="-5" cy="-6" r="2.6" fill={GOLD} />
                  <circle cx="5" cy="-6" r="2.6" fill={GOLD} />
                  <ellipse cx="0" cy="1" rx="7.5" ry="8" fill={GOLD} stroke={GOLD_D} strokeWidth=".8" />
                  <path d="M-3 -1 h.1 M3 -1 h.1" stroke={GOLD_D} strokeWidth="1.6" strokeLinecap="round" />
                </g>
              </g>
            )}
            {level >= 8 && (
              <g transform="translate(14 38)">
                <rect x="-11" y="-12" width="22" height="12" rx="1.5" fill="#9b5a2e" stroke={GOLD_D} strokeWidth="1" />
                <path d="M-11 -12 q11 -10 22 0" fill="#b06a37" stroke={GOLD_D} strokeWidth="1" />
                {[-7, -2, 3, 8].map((x, i) => <circle key={x} cx={x} cy={-14 - (i % 2) * 2} r="2.6" fill={GOLD} stroke={GOLD_D} strokeWidth=".5" />)}
                <path d="M-1 -19 l2 -3 l2 3 l-2 2z" fill="#4fc3f7" />
              </g>
            )}
          </g>
        )}
        {/* 바닥 앞쪽 레드카펫 (7) */}
        {level >= 7 && (
          <g>
            <path d={`M0 116 H${W} V130 H0Z`} fill="#c8414a" />
            <path d={`M0 117.6 H${W} M0 128.4 H${W}`} stroke={GOLD} strokeWidth="1.6" />
          </g>
        )}
        {/* 러그(2) → 페르시안 융단(6) */}
        {level >= 2 && (
          <g transform={`translate(${(spots.bowl + spots.bed) / 2} 112)`}>
            {level >= 6 ? (
              <g>
                <path d="M-84 -6 h168 M-84 6 h168" stroke="#e9d6a6" strokeWidth="1" />
                {[...Array(17)].map((_, i) => <path key={i} d={`M${-88 + i * 11} -7 v-3 M${-88 + i * 11} 7 v3`} stroke="#e9d6a6" strokeWidth="1.2" />)}
                <rect x="-86" y="-8" width="172" height="16" rx="2" fill="#8e2433" stroke={GOLD} strokeWidth="1.6" />
                <rect x="-78" y="-4.5" width="156" height="9" fill="none" stroke="#e9c46a" strokeWidth="1" />
                <path d="M-20 0 l10 -4 l10 4 l-10 4z M0 0 l10 -4 l10 4 l-10 4z" fill="#e9c46a" />
                <circle cx="-50" cy="0" r="2.4" fill="#3f6fb5" />
                <circle cx="50" cy="0" r="2.4" fill="#3f6fb5" />
              </g>
            ) : (
              <g>
                <ellipse cx="0" cy="0" rx="78" ry="9" fill="#f3b7c2" />
                {[...Array(26)].map((_, i) => {
                  const a = (i / 26) * Math.PI * 2;
                  return <circle key={i} cx={Math.cos(a) * 77} cy={Math.sin(a) * 8.6} r="2.6" fill="#f3b7c2" />;
                })}
                <ellipse cx="0" cy="0" rx="62" ry="6" fill="none" stroke="#fff4e6" strokeWidth="2" strokeDasharray="5 4" />
                {level >= 4 && <ellipse cx="0" cy="0" rx="40" ry="3.6" fill="none" stroke="#e98aa0" strokeWidth="1.4" />}
              </g>
            )}
          </g>
        )}
        {/* 황금 저택(8): 바닥에 금화 더미 */}
        {level >= 8 && (
          <g>
            {[[spots.desk - 62, 114], [spots.desk - 54, 111], [spots.desk - 70, 112], [spots.desk - 62, 108], [14, 114], [22, 112], [18, 108]].map(([x, y], i) => (
              <ellipse key={i} cx={x} cy={y} rx="6" ry="3" fill={GOLD} stroke={GOLD_D} strokeWidth=".8" />
            ))}
            <path d={`M${spots.desk - 58} 104 l3 -4 l3 4 l-3 3z`} fill="#e0533d" />
          </g>
        )}
        {/* 왕실 침대 헤드보드 (8) */}
        {level >= LUX.royalBed && (
          <g transform={`translate(${spots.bed} 0)`}>
            <path d="M-40 92 V62 q0 -24 40 -26 q40 2 40 26 V92Z" fill="#7b4bb3" stroke={GOLD_D} strokeWidth="2" />
            <path d="M-34 90 V64 q0 -20 34 -22 q34 2 34 22 V90" fill="none" stroke={GOLD} strokeWidth="1.6" />
            {[[-18, 60], [0, 54], [18, 60], [-18, 76], [0, 70], [18, 76]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill={GOLD} />)}
            <path d="M-8 34 L-8 26 L-4 30 L0 24 L4 30 L8 26 L8 34Z" fill={GOLD} stroke={GOLD_D} strokeWidth=".8" />
          </g>
        )}
      </svg>

      {/* ---------- 위: 천장 · 액자 · 선반 · 커튼 · 샹들리에 · 깃발 ---------- */}
      <svg viewBox={`0 0 ${W} 130`} style={layer(W, 'top')} aria-hidden>
        {level >= 8 && (
          <g>
            <rect x="0" y="0" width={W} height={palace ? 9 : 5} fill={GOLD} />
            {palace && <path d={`M0 9 ${[...Array(Math.ceil(W / 14))].map(() => 'q7 8 14 0').join(' ')}`} fill={GOLD} stroke={GOLD_D} strokeWidth=".8" />}
          </g>
        )}
        {/* 빈 벽: 선반(2) + 초상화(3, 6부터 금, 9엔 왕관) */}
        {level >= 2 && (
          <g transform={`translate(${bx} 0)`}>
            <rect x={-bw / 2 + 2} y="84" width={bw - 4} height="4" rx="1" fill={gold ? GOLD : '#b9875a'} stroke={gold ? GOLD_D : INK} strokeWidth="1" />
            <path d={`M${-bw / 2 + 8} 88 l4 6 M${bw / 2 - 8} 88 l-4 6`} stroke={gold ? GOLD_D : INK} strokeWidth="1.4" />
            {/* 화분 */}
            <g transform={`translate(${-bw / 2 + 13} 84)`}>
              <path d="M-6 0 h12 l-2 -10 h-8z" fill={level >= 7 ? GOLD : '#e8894a'} stroke={level >= 7 ? GOLD_D : '#b8642c'} strokeWidth=".8" />
              <path d="M0 -10 q-8 -6 -6 -14 q5 4 6 14 q1 -12 7 -16 q2 8 -7 16" fill="#7fb77e" />
            </g>
            {/* 책 */}
            <g transform={`translate(${bw / 2 - 16} 84)`}>
              <rect x="-6" y="-14" width="5" height="14" fill="#3b7be2" />
              <rect x="-1" y="-12" width="5" height="12" fill="#e0533d" />
              <rect x="4" y="-15" width="5" height="15" fill={gold ? GOLD : '#2fa463'} transform="rotate(8 6 0)" />
            </g>
          </g>
        )}
        {level >= 3 && (
          <Frame x={bx} y={26} w={Math.min(40, bw - 8)} h={44} gold={gold}>
            <HamFace s={1.2} crown={palace} />
          </Frame>
        )}
        {level >= 3 && (
          <g>
            <Frame x={wx - 72} y={36} w={22} h={18} gold={gold}>
              <ellipse rx="3" ry="4.4" fill="#4a4540" />
            </Frame>
            <Frame x={wx - 72} y={62} w={22} h={18} gold={gold}>
              <path d="M0 4 l-5 -5 a3 3 0 0 1 5 -3 a3 3 0 0 1 5 3z" fill="#ff8fa3" />
            </Frame>
          </g>
        )}
        {/* 창문: 화단(4) · 커튼(4) · 스테인드글라스+왕관(9) */}
        {palace && (
          <g opacity=".5">
            <rect x={wx - 44} y="28" width="43" height="31" fill="#e05a5a" />
            <rect x={wx + 1} y="28" width="43" height="31" fill="#4f8de0" />
            <rect x={wx - 44} y="60" width="43" height="31" fill="#f2c14e" />
            <rect x={wx + 1} y="60" width="43" height="31" fill="#5bbf7a" />
          </g>
        )}
        {palace && <rect x={wx - 48} y="24" width="96" height="70" fill="none" stroke={GOLD} strokeWidth="4" />}
        {level >= 4 && (
          <g transform={`translate(${wx} 94)`}>
            <rect x="-40" y="0" width="80" height="12" rx="2" fill={level >= 8 ? GOLD : '#b9875a'} stroke={level >= 8 ? GOLD_D : INK} strokeWidth="1.2" />
            {[-30, -18, -6, 6, 18, 30].map((x, i) => (
              <g key={x}>
                <path d={`M${x} 0 v-6`} stroke="#6aa84f" strokeWidth="1.4" />
                <circle cx={x} cy="-8" r="3.2" fill={['#ff8fa3', '#ffd54a', '#9ab8ff', '#ff8fa3', '#ffd54a', '#c39bff'][i]} />
              </g>
            ))}
          </g>
        )}
        {level >= 4 && (
          <g>
            <path d={`M${wx - 62} 19 H${wx + 62}`} stroke={level >= 8 ? GOLD_D : INK} strokeWidth="2.6" strokeLinecap="round" />
            {[-63, 63].map((d) => <circle key={d} cx={wx + d} cy="19" r="3" fill={level >= 8 ? GOLD : INK} />)}
            <path d={`M${wx - 60} 20 q-4 44 2 86 l17 0 q-7 -32 6 -60 q-4 -14 -2 -26z`} fill={curtain[0]} stroke={curtain[1]} strokeWidth="1" />
            <path d={`M${wx + 60} 20 q4 44 -2 86 l-17 0 q7 -32 -6 -60 q4 -14 2 -26z`} fill={curtain[0]} stroke={curtain[1]} strokeWidth="1" />
            <path d={`M${wx - 52} 26 v72 M${wx + 52} 26 v72`} stroke={curtain[1]} strokeWidth=".8" opacity=".6" />
            <path d={`M${wx - 59} 66 h19 M${wx + 59} 66 h-19`} stroke={level >= 8 ? GOLD : '#fff4e6'} strokeWidth="3" strokeLinecap="round" />
            <path d={`M${wx - 62} 18 h124 v6 ${[...Array(8)].map(() => 'q-7.75 7 -15.5 0').join(' ')}z`} fill={curtain[0]} stroke={curtain[1]} strokeWidth="1" />
            {level >= 8 && <path d={`M${wx - 62} 24 ${[...Array(8)].map(() => 'q7.75 7 15.5 0').join(' ')}`} fill="none" stroke={GOLD} strokeWidth="1.4" />}
          </g>
        )}
        {palace && (
          <g transform={`translate(${wx} 6)`}>
            <path d="M-16 10 L-16 -2 L-8 4 L0 -8 L8 4 L16 -2 L16 10Z" fill={GOLD} stroke={GOLD_D} strokeWidth="1.2" strokeLinejoin="round" />
            <circle cx="0" cy="-8" r="2.4" fill="#e0533d" />
            <circle cx="-16" cy="-2" r="1.8" fill="#4fc3f7" />
            <circle cx="16" cy="-2" r="1.8" fill="#4fc3f7" />
          </g>
        )}
        {/* 샹들리에 (6) — 창문 앞에 매달린다. 8부터 두 배 */}
        {level >= 6 &&
          (level >= 8 ? [wx - 30, wx + 30] : [wx]).map((cx) => (
            <g key={cx} transform={`translate(${cx} 0)`}>
              <path d="M0 0 V14" stroke={GOLD_D} strokeWidth="1.4" />
              <ellipse cx="0" cy="30" rx="30" ry="16" fill="rgba(255,226,150,.28)" />
              <path d="M-22 26 q22 13 44 0 M-14 22 q14 9 28 0" fill="none" stroke={GOLD} strokeWidth="2.4" />
              <circle cx="0" cy="17" r="4" fill={GOLD} stroke={GOLD_D} strokeWidth=".8" />
              {[-22, -11, 0, 11, 22].map((x) => (
                <g key={x}>
                  <rect x={x - 1.5} y={(x === 0 ? 26 : 17 + Math.abs(x) / 2.5) + 2} width="3" height="6" fill="#fffaf0" />
                  <ellipse className="house-flame" cx={x} cy={(x === 0 ? 26 : 17 + Math.abs(x) / 2.5) + 0.5} rx="1.6" ry="2.6" fill="#ffcc4d" />
                </g>
              ))}
              {[-17, -6, 6, 17].map((x, i) => (
                <path key={x} className="house-twinkle" style={{ animationDelay: `${i * 0.35}s` }} d={`M${x} ${36 - Math.abs(x) / 4} l1.8 3 l-1.8 3 l-1.8 -3z`} fill="#dff3ff" stroke="#9cc5e8" strokeWidth=".5" />
              ))}
            </g>
          ))}
        {/* 궁전 깃발 */}
        {palace &&
          [26, W - 26].map((x) => (
            <g key={x} transform={`translate(${x} 9)`}>
              <path d="M-12 0 H12 V52 L0 43 L-12 52Z" fill="#7b4bb3" stroke="#5a3388" strokeWidth="1" />
              <path d="M-12 5 H12" stroke={GOLD} strokeWidth="2" />
              <path d="M-7 26 L-7 17 L-3.5 21 L0 15 L3.5 21 L7 17 L7 26Z" fill={GOLD} />
            </g>
          ))}
      </svg>

      {/* 대리석 기둥 (7) */}
      {level >= 7 && [0, 1].map((i) => <div key={i} className={`house-pillar ${level >= 8 ? 'gold' : ''}`} style={i ? { right: 3 } : { left: 3 }} aria-hidden />)}
      {/* 궁전: 반짝이 + 금화 비 */}
      {palace && (
        <div className="house-rain" aria-hidden>
          {[...Array(9)].map((_, i) => (
            <i key={i} className={i % 3 ? 'spark' : 'coin'} style={{ left: `${6 + ((i * 37) % 88)}%`, animationDelay: `${(i * 0.73) % 4}s`, animationDuration: `${3.2 + (i % 4) * 0.6}s` }} />
          ))}
        </div>
      )}
    </>
  );
}
