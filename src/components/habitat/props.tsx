/** 서식지 소품. 각각 bottom-center 기준으로 absolute 배치된다. */
import type { CSSProperties } from 'react';
import { sampleShape, tuftPath, rand01 } from '../hamster/geometry';
import type { Customization } from '../../domain/types';

const place = (x: number, w: number, bottom = 14, z = 1): CSSProperties => ({
  position: 'absolute',
  left: 0,
  bottom,
  width: w,
  transform: `translateX(${x - w / 2}px)`,
  zIndex: z,
  pointerEvents: 'none',
});
/** 벽에 거는 물건은 위쪽 기준 */
const hang = (x: number, w: number, top: number): CSSProperties => ({
  position: 'absolute',
  left: 0,
  top,
  width: w,
  transform: `translateX(${x - w / 2}px)`,
  zIndex: 0,
  pointerEvents: 'none',
});

/* ---------- 쳇바퀴 ---------- */
const RUNGS = Array.from({ length: 18 }, (_, i) => (i / 18) * Math.PI * 2);

export function Wheel({ x, layer, spinning, dir }: { x: number; layer: 'back' | 'front'; spinning: boolean; dir: 1 | -1 }) {
  const cls = `wheel-rot ${spinning ? 'spin' : ''} ${dir < 0 ? 'ccw' : ''}`;
  return (
    <svg viewBox="0 0 100 108" style={place(x, 100, 14, layer === 'back' ? 1 : 7)} aria-hidden>
      {layer === 'back' ? (
        <g>
          <path d="M50 52 L26 106 M50 52 L74 106" stroke="#b58d63" strokeWidth="5" strokeLinecap="round" />
          <rect x="18" y="102" width="64" height="6" rx="3" fill="#a07a52" />
          <circle cx="50" cy="52" r="45" fill="#f3eadc" opacity=".75" />
          <g className={cls}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <path
                key={i}
                d={`M50 52 L${50 + 42 * Math.cos((i * Math.PI) / 3)} ${52 + 42 * Math.sin((i * Math.PI) / 3)}`}
                stroke="#d9c3a5"
                strokeWidth="2"
              />
            ))}
          </g>
          <circle cx="50" cy="52" r="4.5" fill="#b58d63" />
        </g>
      ) : (
        <g>
          <circle cx="50" cy="52" r="45" fill="none" stroke="#d6b48c" strokeWidth="4" />
          <g className={cls}>
            {RUNGS.map((a, i) => (
              <circle key={i} cx={50 + 45 * Math.cos(a)} cy={52 + 45 * Math.sin(a)} r="2.2" fill="#a47c52" />
            ))}
          </g>
        </g>
      )}
    </svg>
  );
}

/* ---------- 책상 (의자 = 뒤, 책상·노트북 = 앞) ---------- */
export function DeskBack({ x }: { x: number }) {
  return (
    <svg viewBox="0 0 90 100" style={place(x, 90, 14, 2)} aria-hidden>
      <rect x="27" y="22" width="36" height="34" rx="9" fill="#9dbcd6" />
      <rect x="31" y="26" width="28" height="26" rx="7" fill="#b7d0e4" />
    </svg>
  );
}

export function DeskFront({ x, custom, mugTaken = false }: { x: number; custom: Customization; mugTaken?: boolean }) {
  return (
    <svg viewBox="0 0 96 100" style={place(x, 96, 14, 6)} aria-hidden>
      {/* 다리 */}
      <rect x="8" y="58" width="6" height="42" rx="2" fill="#b07a4c" />
      <rect x="82" y="58" width="6" height="42" rx="2" fill="#b07a4c" />
      <rect x="10" y="80" width="76" height="4" rx="2" fill="#c08a5b" opacity=".6" />
      {/* 상판 */}
      <rect x="2" y="52" width="92" height="8" rx="3" fill="#d49a66" />
      <rect x="2" y="58" width="92" height="3" fill="#b8804f" />
      {/* 노트북 뒷면 */}
      {custom.laptop && (
        <g>
          <rect x="26" y="35" width="44" height="18" rx="3.5" fill="#cfd4db" stroke="#aeb5bf" strokeWidth="1.2" />
          <g transform="translate(48 44) rotate(-14)">
            <path d="M0 -5 Q4 -1 0 5 Q-4 -1 0 -5Z" fill="#aeb5bf" />
          </g>
        </g>
      )}
      {/* 머그 */}
      {custom.mug && !mugTaken && (
        <g>
          <path d="M81 42 q5 0 5 4 q0 4 -5 4" stroke="#5b8fc4" strokeWidth="1.8" fill="none" />
          <path d="M71 40 h11 l-1 11 q-.2 1.6 -1.8 1.6 h-5.4 q-1.6 0 -1.8 -1.6z" fill="#8fc3e8" stroke="#5b8fc4" strokeWidth="1" />
          <g className="prop-steam" stroke="#c9c1b8" strokeWidth="1.3" fill="none" strokeLinecap="round">
            <path d="M74 36 q-2 -4 0 -8" />
            <path d="M79 36 q-2 -4 0 -8" />
          </g>
        </g>
      )}
      <Deco id={custom.deco} />
    </svg>
  );
}

function Deco({ id }: { id: Customization['deco'] }) {
  switch (id) {
    case 'plant':
      return (
        <g>
          <path d="M14 36 C6 30 6 20 12 16 C16 22 16 30 14 36Z" fill="#7fb77e" />
          <path d="M14 36 C22 28 26 20 22 14 C16 18 13 28 14 36Z" fill="#95c994" />
          <path d="M7 36 h14 l-2 16 h-10z" fill="#e8894a" />
          <rect x="6" y="35" width="16" height="4" rx="2" fill="#d9712f" />
        </g>
      );
    case 'doll':
      return (
        <g>
          <circle cx="9" cy="30" r="3.2" fill="#c98a55" />
          <circle cx="19" cy="30" r="3.2" fill="#c98a55" />
          <circle cx="14" cy="37" r="8" fill="#d9a06f" />
          <ellipse cx="14" cy="50" rx="8" ry="5" fill="#d9a06f" />
          <circle cx="11" cy="36" r="1.2" fill="#3a2a20" />
          <circle cx="17" cy="36" r="1.2" fill="#3a2a20" />
          <ellipse cx="14" cy="39.5" rx="2.6" ry="2" fill="#f1d3b3" />
        </g>
      );
    case 'cactus':
      return (
        <g>
          <rect x="10" y="22" width="9" height="24" rx="4.5" fill="#6fae73" />
          <rect x="4" y="30" width="7" height="5" rx="2.5" fill="#6fae73" />
          <rect x="4" y="26" width="5" height="9" rx="2.5" fill="#6fae73" />
          <path d="M7 44 h15 l-2 8 h-11z" fill="#d9c3a5" />
        </g>
      );
    default:
      return null;
  }
}

/* ---------- 해바라기씨 그릇 ---------- */
const SEEDS = Array.from({ length: 9 }, (_, i) => ({
  x: 12 + (i % 5) * 5 + rand01(i) * 2,
  y: 6 + Math.floor(i / 5) * 3 + rand01(i + 9) * 1.5,
  r: -40 + rand01(i + 20) * 80,
}));

export function Bowl({ x }: { x: number }) {
  return (
    <svg viewBox="0 0 46 22" style={place(x, 46, 12, 2)} aria-hidden>
      <ellipse cx="23" cy="8" rx="20" ry="5" fill="#f0b8c0" />
      {SEEDS.map((s, i) => (
        <g key={i} transform={`translate(${s.x} ${s.y}) rotate(${s.r})`}>
          <ellipse rx="1.6" ry="2.8" fill="#4a4540" />
          <path d="M0 -2.2 V2.2" stroke="#efe9df" strokeWidth=".5" />
        </g>
      ))}
      <path d="M3 8 Q4 20 23 20 Q42 20 43 8 Q23 14 3 8Z" fill="#f4a6b3" stroke="#d9848f" strokeWidth="1" />
      <path d="M8 13 Q23 17 38 13" stroke="#fff" strokeWidth="1.4" fill="none" opacity=".6" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- 솜 이불 둥지 ---------- */
const NEST_BACK = tuftPath(
  sampleShape(22, (t) => [45 + 42 * Math.cos(t), 26 + (Math.sin(t) < 0 ? 16 : 6) * Math.sin(t)]),
  (i) => 1.2 + 1.4 * rand01(i + 77),
  0.3,
);
const NEST_FRONT = tuftPath(
  sampleShape(18, (t) => [45 + 44 * Math.cos(t), 32 + (Math.sin(t) < 0 ? 5 : 3) * Math.sin(t)]),
  (i) => 1 + 1.2 * rand01(i + 90),
  0.3,
);

export function Nest({ x, layer }: { x: number; layer: 'back' | 'front' }) {
  return (
    <svg viewBox="0 0 90 38" style={place(x, 90, 8, layer === 'back' ? 1 : 4)} aria-hidden>
      {layer === 'back' ? (
        <path d={NEST_BACK} fill="#fbf4e8" stroke="#e3d5bf" strokeWidth="1.2" />
      ) : (
        <path d={NEST_FRONT} fill="#fffaf2" stroke="#e3d5bf" strokeWidth="1.2" />
      )}
    </svg>
  );
}

/* ---------- 바닥 (톱밥) ---------- */
const SHAVINGS = Array.from({ length: 70 }, (_, i) => ({
  x: rand01(i) * 100,
  y: 3 + rand01(i + 300) * 20,
  r: rand01(i + 600) * 180,
  l: 1.5 + rand01(i + 900) * 2.5,
}));

export function Floor() {
  return (
    <svg className="habitat-floor" viewBox="0 0 100 26" preserveAspectRatio="none" aria-hidden>
      <rect width="100" height="26" fill="var(--floor)" />
      {SHAVINGS.map((s, i) => (
        <path
          key={i}
          d={`M${s.x} ${s.y} l${s.l * Math.cos(s.r)} ${s.l * 0.4 * Math.sin(s.r)}`}
          stroke="var(--floor-2)"
          strokeWidth=".9"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      <rect width="100" height="1" fill="var(--line)" />
    </svg>
  );
}

/* ---------- 벽: 시간 따라 바뀌는 창밖 + 진짜 시계 ---------- */
type Sky = { top: string; bottom: string; night: boolean; sun?: string };
function skyAt(h: number): Sky {
  if (h < 5 || h >= 20) return { top: '#1f2a4d', bottom: '#3b4a7a', night: true };
  if (h < 7) return { top: '#f6b9a8', bottom: '#fde3c4', night: false, sun: '#ffd18a' };
  if (h < 16) return { top: '#9fd0f0', bottom: '#dff1fb', night: false, sun: '#ffe38a' };
  if (h < 18) return { top: '#f7c78d', bottom: '#fde9c8', night: false, sun: '#ffc46b' };
  return { top: '#e98a7a', bottom: '#f6c49a', night: false, sun: '#ffb36b' };
}

export function Window({ x, now }: { x: number; now: number }) {
  const d = new Date(now);
  const h = d.getHours() + d.getMinutes() / 60;
  const sky = skyAt(h);
  // 해/달이 시간에 따라 창 안을 가로지른다
  const dayT = Math.min(1, Math.max(0, (h - 6) / 13));
  const nightT = h >= 20 ? (h - 20) / 9 : (h + 4) / 9;
  const t = sky.night ? nightT : dayT;
  const bx = 12 + 68 * t;
  const by = 44 - 30 * Math.sin(Math.PI * t);
  return (
    <svg viewBox="0 0 96 70" style={hang(x, 96, 24)} aria-hidden>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky.top} />
          <stop offset="1" stopColor={sky.bottom} />
        </linearGradient>
        <clipPath id="win">
          <rect x="6" y="6" width="84" height="56" rx="3" />
        </clipPath>
      </defs>
      <rect x="1" y="1" width="94" height="66" rx="7" fill="#e7d5bd" />
      <g clipPath="url(#win)">
        <rect x="6" y="6" width="84" height="56" fill="url(#sky)" />
        {sky.night ? (
          <g>
            {[
              [18, 16],
              [34, 28],
              [58, 14],
              [74, 30],
              [46, 44],
              [80, 12],
            ].map(([sx, sy], i) => (
              <circle key={i} cx={sx} cy={sy} r={i % 2 ? 0.9 : 1.3} fill="#fff" className="win-star" style={{ animationDelay: `${i * 0.7}s` }} />
            ))}
            <circle cx={bx} cy={by} r="7" fill="#fdf3c8" />
            <circle cx={bx + 3.5} cy={by - 2} r="6" fill={sky.top} />
          </g>
        ) : (
          <g>
            <circle cx={bx} cy={by} r="7.5" fill={sky.sun} />
            <g className="win-cloud" fill="#fff" opacity=".9">
              <ellipse cx="30" cy="24" rx="10" ry="4" />
              <ellipse cx="36" cy="21" rx="7" ry="4.5" />
            </g>
            <g className="win-cloud slow" fill="#fff" opacity=".75">
              <ellipse cx="66" cy="40" rx="9" ry="3.4" />
              <ellipse cx="71" cy="37.5" rx="6" ry="3.6" />
            </g>
          </g>
        )}
        <path d="M6 54 Q30 46 50 52 T90 48 V62 H6Z" fill={sky.night ? '#2c3558' : '#bfdcae'} opacity=".8" />
      </g>
      <path d="M48 6 V62 M6 34 H90" stroke="#e7d5bd" strokeWidth="3" />
      <rect x="-2" y="63" width="100" height="6" rx="3" fill="#d9c3a5" />
    </svg>
  );
}

export function WallClock({ x, now }: { x: number; now: number }) {
  const d = new Date(now);
  const m = d.getMinutes() + d.getSeconds() / 60;
  const hr = (d.getHours() % 12) + m / 60;
  const hand = (deg: number, len: number) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return `M20 20 L${20 + len * Math.cos(a)} ${20 + len * Math.sin(a)}`;
  };
  return (
    <svg viewBox="0 0 40 40" style={hang(x, 36, 20)} aria-hidden>
      <circle cx="20" cy="20" r="18" fill="#fffaf2" stroke="#c9a57c" strokeWidth="3" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return <circle key={i} cx={20 + 13.5 * Math.cos(a)} cy={20 + 13.5 * Math.sin(a)} r={i % 3 === 0 ? 1.3 : 0.7} fill="#b59a7c" />;
      })}
      <path d={hand(hr * 30, 8)} stroke="#3a2a20" strokeWidth="2.4" strokeLinecap="round" />
      <path d={hand(m * 6, 12)} stroke="#3a2a20" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="20" cy="20" r="1.8" fill="#e8894a" />
    </svg>
  );
}

/* ---------- 완성품 선반 (이번 시즌에 만든 작업물이 하나씩 올라간다) ---------- */
export interface Trophy {
  emoji: string;
  name: string;
  /** 오늘 막 완성한 것 */
  fresh: boolean;
}

const SHELF_COLS = 7;
const SHELF_ROWS = 3;

export function TrophyShelf({ items }: { items: Trophy[] }) {
  return (
    <div className="shelf" aria-label={`완성한 작업물 ${items.length}개`}>
      {Array.from({ length: SHELF_ROWS }, (_, r) => (
        <div key={r} className="shelf-row">
          <div className="shelf-items">
            {items.slice(r * SHELF_COLS, (r + 1) * SHELF_COLS).map((it) => (
              <span key={it.name} className={it.fresh ? 'fresh' : ''} title={it.name}>
                {it.emoji}
              </span>
            ))}
          </div>
          <div className="shelf-plank" />
        </div>
      ))}
    </div>
  );
}
