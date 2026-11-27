/**
 * 집 업그레이드 연출 (진짜 가챠와는 다른 전용 연출). 효과음 없음, 화면을 누르면 바로 결과로 넘어간다.
 * 1) 어두워지고 빛 알갱이가 가운데로 모여 빛 구슬이 된다
 * 2) 구슬이 빛나는 문이 되고, 문틈으로 빛이 새며 덜덜 떨린다
 * 3) 문 안으로 빨려 들어가듯 문이 확 커지며 화면이 하얗게 번쩍
 * 4) 하늘에서 빛기둥, 빙글 도는 빛줄기·충격파·반짝이 속에서 새 방이 튀어나오고 별이 하나씩 찍힌다
 * 단계가 높을수록 색이 파랑 → 보라 → 금빛(무지개)으로, 모으는 시간도 길어진다.
 */
import { useEffect, useState } from 'react';
import { Habitat } from './habitat/Habitat';
import { HOUSE_LEVELS } from '../domain/house';
import { useBackHandler } from '../backStack';
import { buzz } from '../haptics';
import type { Customization } from '../domain/types';

type Tier = 'blue' | 'purple' | 'gold';
const tierOf = (lv: number): Tier => (lv >= 7 ? 'gold' : lv >= 4 ? 'purple' : 'blue');
const STARS: Record<Tier, number> = { blue: 3, purple: 4, gold: 5 };
/** 단계별 시각 (ms): 문 등장, 문 열림(번쩍), 결과 */
const TIME: Record<Tier, [number, number, number]> = {
  blue: [1100, 2000, 2450],
  purple: [1200, 2300, 2750],
  gold: [1300, 2900, 3350],
};

const PARTICLES = Array.from({ length: 28 }, (_, i) => {
  const a = (i / 28) * Math.PI * 2 + (i % 3) * 0.4;
  const r = 46 + ((i * 37) % 30);
  return { x: Math.cos(a) * r, y: Math.sin(a) * r, d: (i % 7) * 0.09, s: 4 + (i % 4) * 2 };
});
const SPARKS = Array.from({ length: 22 }, (_, i) => ({ a: (i / 22) * 360 + (i % 2) * 8, r: 120 + ((i * 53) % 110), d: (i % 5) * 0.12, s: 6 + (i % 3) * 4 }));

export function HouseUpModal({ level, custom, name, now, onClose }: { level: number; custom: Customization; name: string; now: number; onClose: () => void }) {
  const tier = tierOf(level);
  const info = HOUSE_LEVELS[level - 1];
  const [stage, setStage] = useState(0);
  const [t1, t2, t3] = TIME[tier];
  useBackHandler(true, () => {
    if (stage >= 3) onClose();
  });
  useEffect(() => {
    const ids = [
      setTimeout(() => setStage(1), t1),
      setTimeout(() => {
        setStage(2);
        buzz(tier === 'gold' ? [40, 50, 40, 50, 120] : [30, 60, 60]);
      }, t2),
      setTimeout(() => setStage(3), t3),
    ];
    return () => ids.forEach(clearTimeout);
  }, [t1, t2, t3, tier]);
  if (!info) return null;
  const skip = () => {
    if (stage < 3) setStage(3);
  };
  return (
    <div className={`hu-cine tier-${tier} stage-${stage}`} role="dialog" aria-modal="true" aria-label="집 업그레이드" onClick={skip}>
      <div className="hu-bg" />
      {stage < 3 && (
        <div className="hu-center">
          {PARTICLES.map((p, i) => (
            <i key={i} className="hu-dot" style={{ '--x': `${p.x * 3}px`, '--y': `${p.y * 3}px`, animationDelay: `${p.d}s`, width: p.s, height: p.s } as React.CSSProperties} />
          ))}
          {stage < 2 && <div className="hu-orb" />}
          <svg className="hu-door" viewBox="0 0 100 140" aria-hidden>
            <defs>
              <linearGradient id="hu-door-g" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#fff" stopOpacity=".95" />
                <stop offset="1" stopColor="var(--hu-c)" stopOpacity=".85" />
              </linearGradient>
            </defs>
            <path d="M8 138 V50 a42 42 0 0 1 84 0 V138Z" fill="url(#hu-door-g)" stroke="#fff" strokeWidth="3" />
            <path d="M50 12 V138" stroke="var(--hu-c)" strokeWidth="2" opacity=".6" />
            <circle cx="40" cy="84" r="3.4" fill="var(--hu-c)" />
            <circle cx="60" cy="84" r="3.4" fill="var(--hu-c)" />
            <path d="M50 2 l4 8 l-4 6 l-4 -6z" fill="#fff" />
          </svg>
          <div className="hu-leak" />
        </div>
      )}
      {stage === 2 && <div className="hu-flash" />}
      {stage >= 3 && (
        <div className="hu-result">
          <div className="hu-beam" />
          <div className="hu-rays" />
          <div className="hu-ring" />
          <div className="hu-ring r2" />
          <div className="hu-sparks" aria-hidden>
            {SPARKS.map((s, i) => (
              <i key={i} style={{ '--a': `${s.a}deg`, '--r': `${s.r}px`, animationDelay: `${s.d}s`, width: s.s, height: s.s } as React.CSSProperties} />
            ))}
          </div>
          <div className="hu-stars" aria-label={`별 ${STARS[tier]}개`}>
            {Array.from({ length: STARS[tier] }, (_, i) => (
              <span key={i} style={{ animationDelay: `${0.5 + i * 0.12}s` }}>★</span>
            ))}
          </div>
          <div className="hu-room">
            <Habitat custom={custom} mood="working" name={name} now={now} house={level} />
          </div>
          <div className="hu-lv">LV.{level}</div>
          <div className="hu-name">{info.name}</div>
          <div className="hu-sub">출근 {info.at}일 달성{level < HOUSE_LEVELS.length ? ` · 다음 단계까지 ${HOUSE_LEVELS[level].at - info.at}일` : ' · 최고 단계!'}</div>
          <button
            className="btn primary hu-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            입주하기!
          </button>
        </div>
      )}
    </div>
  );
}
