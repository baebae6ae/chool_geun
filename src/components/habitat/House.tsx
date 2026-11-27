/**
 * 집 꾸미기 단계: 출근(작업물 완성) 일수가 쌓이면 방이 조금씩 좋아진다. 원룸 → … → 햄스터 궁전.
 * 단계는 앞 단계 위에 하나씩 더해진다. 배경(벽·바닥 색) 선택은 그대로 두고 소품만 얹는다.
 * 위쪽(천장·창·액자)은 위에 붙이고, 바닥·아래 벽은 아래에 붙여서 방 높이가 달라도 제자리에 있다.
 */
import type { CSSProperties } from 'react';
import type { Spots } from './brain';

export const HOUSE_LEVELS = [
  { at: 0, name: '원룸' },
  { at: 20, name: '러그 깐 원룸' },
  { at: 40, name: '액자 건 원룸' },
  { at: 70, name: '커튼 단 방' },
  { at: 100, name: '조명 단 방' },
  { at: 150, name: '몰딩 두른 방' },
  { at: 200, name: '샹들리에 저택' },
  { at: 300, name: '대리석 저택' },
  { at: 365, name: '햄스터 궁전' },
] as const;

export function houseLevel(completedDays: number): number {
  let lv = 1;
  HOUSE_LEVELS.forEach((l, i) => {
    if (completedDays >= l.at) lv = i + 1;
  });
  return lv;
}

const GOLD = '#e3b341';
const GOLD_D = '#b8862a';

export function HouseDecor({ level, spots }: { level: number; spots: Spots }) {
  if (level < 2) return null;
  const { W } = spots;
  const wx = spots.window;
  const palace = level >= 9;
  const lampX = Math.round((wx + 48 + spots.desk - 20) / 2);
  const frameX = Math.round(Math.max(spots.wheel + 34, wx - 82));
  const top: CSSProperties = { position: 'absolute', left: 0, top: 0, width: W, height: 120, zIndex: 0, pointerEvents: 'none' };
  const bottom: CSSProperties = { position: 'absolute', left: 0, bottom: 0, width: W, height: 120, zIndex: 0, pointerEvents: 'none' };
  const drape = palace ? '#b8333b' : '#f2b5b5';
  const drapeD = palace ? '#8f2430' : '#d98f92';
  return (
    <>
      {/* 아래쪽: 몰딩 · 바닥 · 러그 · 카펫 */}
      <svg viewBox={`0 0 ${W} 120`} style={bottom} aria-hidden>
        {level >= 6 && (
          <g>
            <rect x="0" y="34" width={W} height="56" fill={palace ? 'rgba(255,236,190,.35)' : 'rgba(255,255,255,.28)'} />
            <path d={`M0 34 H${W}`} stroke={palace ? GOLD : 'rgba(140,100,60,.35)'} strokeWidth="2.4" />
            {[...Array(Math.ceil(W / 56))].map((_, i) => (
              <rect key={i} x={10 + i * 56} y="44" width="40" height="36" rx="3" fill="none" stroke={palace ? 'rgba(184,134,42,.45)' : 'rgba(140,100,60,.2)'} strokeWidth="1.4" />
            ))}
          </g>
        )}
        {level >= 7 && (
          <g stroke={level >= 8 ? 'rgba(160,150,140,.35)' : 'rgba(120,80,40,.2)'} strokeWidth="1">
            {level >= 8 ? (
              // 대리석: 큰 타일 + 결
              <>
                <rect x="0" y="90" width={W} height="30" fill="rgba(255,255,255,.45)" stroke="none" />
                {[...Array(Math.ceil(W / 40))].map((_, i) => <path key={i} d={`M${i * 40} 90 l-10 30`} />)}
                <path d={`M20 104 q30 -6 60 2 M150 112 q40 -8 70 0 M${W - 90} 100 q30 6 60 -2`} stroke="rgba(150,150,170,.35)" fill="none" />
              </>
            ) : (
              // 원목 바닥
              <>
                {[98, 106, 114].map((y) => <path key={y} d={`M0 ${y} H${W}`} />)}
                {[...Array(Math.ceil(W / 30))].map((_, i) => <path key={i} d={`M${i * 30 + (i % 2) * 15} ${90 + (i % 3) * 8} v8`} />)}
              </>
            )}
          </g>
        )}
        {level >= 2 && !(level >= 8) && (
          <g>
            <ellipse cx={wx} cy="106" rx="74" ry="10" fill="#f0b9a6" />
            <ellipse cx={wx} cy="106" rx="60" ry="7" fill="none" stroke="#fff4e6" strokeWidth="2" strokeDasharray="5 4" />
          </g>
        )}
        {level >= 8 && (
          <g>
            <path d={`M0 100 H${W} V114 H0Z`} fill="#c8414a" />
            <path d={`M0 101.5 H${W} M0 112.5 H${W}`} stroke={GOLD} strokeWidth="1.6" />
          </g>
        )}
      </svg>

      {/* 위쪽: 천장 장식 · 액자 · 커튼 · 조명 · 깃발 */}
      <svg viewBox={`0 0 ${W} 120`} style={top} aria-hidden>
        {palace && (
          <g>
            <rect x="0" y="0" width={W} height="7" fill={GOLD} />
            <path d={`M0 7 ${[...Array(Math.ceil(W / 12))].map(() => `q6 7 12 0`).join(' ')}`} fill={GOLD} stroke={GOLD_D} strokeWidth=".8" />
          </g>
        )}
        {level >= 3 && (
          <g transform={`translate(${frameX} 30)`}>
            <path d="M15 -6 L0 -14 L-15 -6" fill="none" stroke="#8b6a4a" strokeWidth="1" />
            <rect x="-17" y="-6" width="34" height="28" rx="2" fill={level >= 8 ? GOLD : '#c99a6b'} stroke={level >= 8 ? GOLD_D : '#8b6a4a'} strokeWidth="1.4" />
            <rect x="-13" y="-2" width="26" height="20" fill="#fff8ec" />
            {/* 액자 속 햄스터 */}
            <circle cx="-5" cy="5" r="2.4" fill="#e7b07e" />
            <circle cx="5" cy="5" r="2.4" fill="#e7b07e" />
            <ellipse cx="0" cy="11" rx="7" ry="6" fill="#f2c79a" />
            <circle cx="-2.4" cy="10" r=".9" fill="#3a2a20" />
            <circle cx="2.4" cy="10" r=".9" fill="#3a2a20" />
          </g>
        )}
        {level >= 4 && (
          <g>
            <path d={`M${wx - 62} 19 H${wx + 62}`} stroke={palace ? GOLD_D : '#8b6a4a'} strokeWidth="2.4" strokeLinecap="round" />
            <circle cx={wx - 63} cy="19" r="2.6" fill={palace ? GOLD : '#8b6a4a'} />
            <circle cx={wx + 63} cy="19" r="2.6" fill={palace ? GOLD : '#8b6a4a'} />
            <path d={`M${wx - 60} 20 q-3 40 2 80 l16 0 q-6 -30 6 -56 q-4 -14 -2 -24z`} fill={drape} stroke={drapeD} strokeWidth="1" />
            <path d={`M${wx + 60} 20 q3 40 -2 80 l-16 0 q6 -30 -6 -56 q4 -14 2 -24z`} fill={drape} stroke={drapeD} strokeWidth="1" />
            <path d={`M${wx - 52} 26 v66 M${wx + 52} 26 v66`} stroke={drapeD} strokeWidth=".8" opacity=".6" />
            <path d={`M${wx - 58} 64 h18 M${wx + 58} 64 h-18`} stroke={palace ? GOLD : '#fff4e6'} strokeWidth="2.6" strokeLinecap="round" />
            {/* 커튼 위 주름 덮개 */}
            <path d={`M${wx - 62} 18 h124 v6 ${[...Array(8)].map(() => 'q-7.75 6 -15.5 0').join(' ')}z`} fill={drape} stroke={drapeD} strokeWidth="1" />
          </g>
        )}
        {palace && (
          // 창 위 왕관
          <g transform={`translate(${wx} 9)`}>
            <path d="M-11 6 L-11 -4 L-5 1 L0 -7 L5 1 L11 -4 L11 6Z" fill={GOLD} stroke={GOLD_D} strokeWidth="1" strokeLinejoin="round" />
            <circle cx="0" cy="-7" r="1.6" fill="#e0533d" />
          </g>
        )}
        {level >= 5 && level < 7 && (
          // 펜던트 조명
          <g>
            <path d={`M${lampX} 0 V30`} stroke="#6b5a4a" strokeWidth="1.2" />
            <ellipse cx={lampX} cy="46" rx="18" ry="14" fill="rgba(255,224,150,.35)" />
            <path d={`M${lampX - 11} 40 L${lampX - 6} 30 H${lampX + 6} L${lampX + 11} 40Z`} fill="#f4c56a" stroke="#c99a3a" strokeWidth="1" />
            <circle cx={lampX} cy="41.5" r="2.4" fill="#fff6d2" />
          </g>
        )}
        {level >= 7 && (
          // 샹들리에
          <g transform={`translate(${lampX} 0)`}>
            <path d="M0 0 V18" stroke={GOLD_D} strokeWidth="1.4" />
            <ellipse cx="0" cy="36" rx="30" ry="18" fill="rgba(255,226,150,.3)" />
            <path d="M-20 30 q20 12 40 0 M-13 26 q13 8 26 0" fill="none" stroke={GOLD} strokeWidth="2.2" />
            <circle cx="0" cy="22" r="3.6" fill={GOLD} stroke={GOLD_D} strokeWidth=".8" />
            {[-20, -10, 0, 10, 20].map((x) => (
              <g key={x}>
                <rect x={x - 1.4} y={x === 0 ? 30 : 22 + Math.abs(x) / 2.5} width="2.8" height="6" fill="#fffaf0" />
                <ellipse cx={x} cy={x === 0 ? 28.5 : 20.5 + Math.abs(x) / 2.5} rx="1.5" ry="2.4" fill="#ffcc4d" />
              </g>
            ))}
            {[-16, -6, 6, 16].map((x) => <circle key={x} cx={x} cy={37 - Math.abs(x) / 4} r="1.4" fill="#cfe9ff" stroke="#9cc5e8" strokeWidth=".5" />)}
          </g>
        )}
        {palace &&
          [16, W - 16].map((x) => (
            // 궁전 깃발
            <g key={x} transform={`translate(${x} 7)`}>
              <path d="M-11 0 H11 V46 L0 38 L-11 46Z" fill="#7b4bb3" stroke="#5a3388" strokeWidth="1" />
              <path d="M-11 4 H11" stroke={GOLD} strokeWidth="1.6" />
              <path d="M-6 22 L-6 15 L-3 18 L0 13 L3 18 L6 15 L6 22Z" fill={GOLD} />
            </g>
          ))}
      </svg>

      {/* 대리석 기둥 (양쪽 벽) */}
      {level >= 8 &&
        [0, 1].map((i) => (
          <div key={i} className={`house-pillar ${palace ? 'gold' : ''}`} style={i ? { right: 2 } : { left: 2 }} aria-hidden />
        ))}
    </>
  );
}
