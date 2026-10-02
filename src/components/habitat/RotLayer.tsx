/** 야근 시간이 길어질수록 방이 썩어간다 (0~1) */
export const rotLevel = (min: number) => Math.min(1, 0.35 + min / 120);

const MOLD = [
  { x: 8, y: 26, r: 9 },
  { x: 90, y: 40, r: 11 },
  { x: 47, y: 12, r: 7 },
  { x: 70, y: 70, r: 8 },
  { x: 24, y: 78, r: 10 },
  { x: 58, y: 84, r: 6 },
];

/** 곰팡이 얼룩 · 거미줄 · 파리 · 깜빡이는 형광등 · 어둠. 햄스터 방 위에 덮는다. */
export function RotLayer() {
  return (
    <div className="rot-layer" aria-hidden>
      <svg className="rot-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* 거미줄 */}
        <g stroke="#e8e4d8" strokeWidth=".45" fill="none" opacity=".75" vectorEffect="non-scaling-stroke">
          <path d="M0 0 L26 20 M0 0 L22 5 M0 0 L8 28 M0 0 L17 14" />
          <path d="M9 0 Q11 7 6 11 M17 0 Q18 12 9 19 M0 11 Q5 11 8 6 M0 20 Q7 19 12 11" />
          <path d="M100 0 L80 16 M100 0 L90 24 M100 0 L74 4" />
          <path d="M92 0 Q91 6 95 9 M84 0 Q85 10 92 15" />
        </g>
        {/* 천장에서 떨어지는 물 얼룩 */}
        <path d="M60 0 q-2 9 1 15" stroke="#6f8452" strokeWidth="1.6" fill="none" opacity=".35" strokeLinecap="round" />
      </svg>
      {MOLD.map((m, i) => (
        <span key={i} className="rot-spot" style={{ left: `${m.x}%`, top: `${m.y}%`, width: m.r * 3, height: m.r * 2.3, animationDelay: `${i * 0.7}s` }} />
      ))}
      <span className="rot-fly rot-fly-1">·ᵔ·</span>
      <span className="rot-fly rot-fly-2">·ᵔ·</span>
      <span className="rot-fly rot-fly-3">·ᵔ·</span>
      <span className="rot-drip" />
      <div className="rot-dark" />
    </div>
  );
}
