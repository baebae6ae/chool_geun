/** 월급날 다이어리 그리기 도구: 시간 계산, 햄스터, 동전, 잔액 줄 */
import { memo } from 'react';
import { HamsterSprite } from '../hamster/HamsterSprite';
import type { FrontAction } from '../hamster/HamsterSprite';
import type { Customization } from '../../domain/types';

export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eo = (x: number) => 1 - Math.pow(1 - x, 3);
export const ei = (x: number) => x * x * x;
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const back = (x: number) => (x <= 0 ? 0 : 1 + 3.2 * Math.pow(x - 1, 3) + 2.2 * Math.pow(x - 1, 2));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const won = (n: number) => Math.max(0, Math.floor(n)).toLocaleString('ko-KR');
/** 글씨가 왼쪽부터 써지는 효과 */
export const write = (p: number): React.CSSProperties => ({ clipPath: `inset(-30px ${100 - p * 100}% -30px -30px)` });
/** 선이 그려지는 효과 (pathLength=1) */
export const drawn = (p: number): React.CSSProperties => ({ strokeDasharray: '1 1', strokeDashoffset: 1 - p });
export const INK = '#3a3a6a';

/** 햄스터 그림은 무거우니 동작이 바뀔 때만 다시 그린다 (위치·크기는 바깥 div가 움직인다) */
const Sprite = memo(function Sprite({ custom, action }: { custom: Customization; action: FrontAction }) {
  return <HamsterSprite custom={custom} pose={{ pose: 'front', action }} />;
});

export function Ham({ custom, action, x, y, sx = 1, sy = 1, rot = 0, opacity = 1 }: { custom: Customization; action: FrontAction; x: number; y: number; sx?: number; sy?: number; rot?: number; opacity?: number }) {
  return (
    <div className="pc-ham" style={{ left: x - 180, top: y - 340, opacity, transform: `rotate(${rot}deg) scale(${sx},${sy})` }}>
      <Sprite custom={custom} action={action} />
    </div>
  );
}

/** 바닥 그림자 */
export function Shadow({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <svg className="pc-layer" width="720" height="1280">
      <ellipse cx={x} cy={y + 2} rx={120 * s} ry={16 * s} fill={`rgba(90,70,40,${0.18 * s})`} />
    </svg>
  );
}

export type Coin = { x: number; y: number; ry: number; fill: number };

export function Coins({ list }: { list: Coin[] }) {
  if (!list.length) return null;
  return (
    <>
      <svg className="pc-layer" width="720" height="1280">
        <g fill="#f6c443">
          {list.map((c, i) => (
            <ellipse key={i} cx={c.x} cy={c.y} rx={28} ry={Math.max(2, c.ry - 2)} opacity={c.fill} />
          ))}
        </g>
      </svg>
      <svg className="pc-layer" width="720" height="1280">
        <g fill="none" stroke={INK} strokeWidth="5">
          {list.map((c, i) => (
            <ellipse key={i} cx={c.x} cy={c.y} rx={30} ry={Math.max(3, c.ry)} />
          ))}
        </g>
      </svg>
    </>
  );
}

/** 동전 하나가 a에서 b로 포물선을 그리며 날아간다 (k: 0~1) */
export function flyCoin(a: [number, number], b: [number, number], k: number, h = 200, spin = 14): Coin {
  const e = eo(k);
  return { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e) - Math.sin(k * Math.PI) * h, ry: 18 * Math.abs(Math.cos(k * spin)), fill: 1 };
}

/** 쾅! 하고 퍼지는 선 */
export function Burst({ x, y, p, r = 140, n = 10 }: { x: number; y: number; p: number; r?: number; n?: number }) {
  if (p <= 0 || p >= 1) return null;
  return (
    <svg className="pc-layer" width="720" height="1280">
      <g stroke={INK} strokeWidth="6" strokeLinecap="round" opacity={1 - p}>
        {[...Array(n)].map((_, i) => {
          const a = (i / n) * Math.PI * 2, r1 = r + 50 * eo(p), r2 = r1 + 40 * (1 - p);
          return <path key={i} d={`M${x + Math.cos(a) * r1} ${y + Math.sin(a) * r1 * 0.55} L${x + Math.cos(a) * r2} ${y + Math.sin(a) * r2 * 0.55}`} />;
        })}
      </g>
    </svg>
  );
}

/** 2쪽 머리: 날짜 + 그 편의 첫 줄 */
export function Heading({ u, date, text, size = 54 }: { u: number; date: string; text: string; size?: number }) {
  return (
    <>
      <div className="pc-hand" style={{ left: 100, top: 40, fontSize: 44 }}>{date} 날씨: 💰</div>
      <div className="pc-hand" style={{ left: 110, top: 140, fontSize: size, ...write(seg(u, 0, 0.6)) }}>{text}</div>
    </>
  );
}

/** 맨 아래 잔액 줄. spent(0~1)만큼 줄어들다가 reveal 시각에 남은 돈이 빨갛게 커지고 동그라미가 쳐진다 */
export function Balance({ u, total, leftover, spent, reveal }: { u: number; total: number; leftover: number; spent: number; reveal: number }) {
  const final = u > reveal;
  const bal = total - (total - leftover) * clamp(spent);
  const circle = seg(u, reveal + 0.05, reveal + 0.55);
  return (
    <>
      <div className="pc-hand" style={{ left: 90, top: 1060, fontSize: 48, ...write(seg(u, 0.35, 0.8)) }}>
        잔액:{' '}
        <span style={{ color: final ? '#e0533d' : INK, fontSize: final ? 64 : 48, display: 'inline-block', transform: final ? `scale(${1 + 0.35 * (1 - eo(seg(u, reveal, reveal + 0.35)))})` : undefined, transformOrigin: '0 70%' }}>
          {won(final ? leftover : Math.max(bal, leftover))}원
        </span>
      </div>
      {circle > 0 && (
        <svg className="pc-layer" width="720" height="1280">
          <path pathLength={1} style={drawn(circle)} d="M210 1100 C 160 1040, 330 1030, 450 1050 C 540 1065, 520 1150, 400 1158 C 290 1166, 190 1150, 205 1095" fill="none" stroke="#e0533d" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )}
    </>
  );
}

/** 마지막 한 줄 낙서 */
export function Note({ u, at, x, y, text, size = 38, rot = -6 }: { u: number; at: number; x: number; y: number; text: string; size?: number; rot?: number }) {
  if (u < at) return null;
  return <div className="pc-hand" style={{ left: x, top: y, fontSize: size, transform: `rotate(${rot}deg)`, ...write(seg(u, at, at + 0.7)) }}>{text}</div>;
}
