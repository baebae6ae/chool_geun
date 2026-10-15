import type { ReactNode } from 'react';
import type { Glyph, Tier } from '../domain/achievements';
import { C, K, S } from './EventIcon';

const TIER: Record<Tier, { rim: string; face: string; ribbon: string }> = {
  bronze: { rim: '#c98a55', face: '#f0c9a0', ribbon: '#e8894a' },
  silver: { rim: '#9aa6b5', face: '#e9eef5', ribbon: '#6fa6d8' },
  gold: { rim: '#d9a11f', face: '#ffe48a', ribbon: '#e8504b' },
};

/** 메달 안에 들어가는 작은 그림 (중심 24,26 · 반지름 약 10) */
function Symbol({ glyph }: { glyph: Glyph }): ReactNode {
  switch (glyph) {
    case 'paw':
      return (
        <g fill={C.brown}>
          <ellipse cx="24" cy="30" rx="5" ry="4.2" />
          <ellipse cx="17.6" cy="25" rx="2.2" ry="2.8" />
          <ellipse cx="22" cy="21" rx="2.2" ry="2.8" />
          <ellipse cx="26.6" cy="21" rx="2.2" ry="2.8" />
          <ellipse cx="30.8" cy="25" rx="2.2" ry="2.8" />
        </g>
      );
    case 'flame':
      return (
        <g>
          <path d="M24 17 C28 22 31 24 31 29 A7 7 0 0 1 17 29 C17 25 20 24 21 20 C22 22 22 23 24 23 C23 21 23 19 24 17Z" fill={C.orange} />
          <path d="M24 25 C26 27 27 28 27 30 A3 3 0 0 1 21 30 C21 28 23 27 24 25Z" fill={C.yellow} strokeWidth="1.4" />
        </g>
      );
    case 'moon':
      return <path d="M29 18 A10 10 0 1 0 31 33 A8 8 0 0 1 29 18Z" fill={C.yellow} />;
    case 'coin':
      return (
        <g>
          <circle cx="24" cy="26" r="9" fill={C.yellow} />
          <path d="M19.4 22 l2.2 8.4 l2.4 -6.6 l2.4 6.6 l2.2 -8.4 M18.2 25.2 h11.6 M18.6 27.8 h10.8" fill="none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case 'star':
      return <path d="M24 17 l2.7 5.6 6.1 .8 -4.5 4.2 1.1 6 -5.4 -3 -5.4 3 1.1 -6 -4.5 -4.2 6.1 -.8z" fill={C.yellow} />;
    case 'sparkle':
      return (
        <g fill={C.yellow}>
          <path d="M24 16 q1.6 7 8 8 q-6.4 1.2 -8 8 q-1.6 -6.8 -8 -8 q6.4 -1 8 -8z" />
          <path d="M32 17 q.6 2.4 3 3 q-2.4 .6 -3 3 q-.6 -2.4 -3 -3 q2.4 -.6 3 -3z" strokeWidth="1.2" />
        </g>
      );
    case 'heart':
      return <path d="M24 33 C14 27 15 18 20.5 18 C22.6 18 24 19.4 24 21 C24 19.4 25.4 18 27.5 18 C33 18 34 27 24 33Z" fill={C.pink} />;
    case 'bubble':
      return (
        <g>
          <path d="M16 19 h16 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -3 3 h-8 l-5 4 v-4 h-3 a3 3 0 0 1 -3 -3 v-6 a3 3 0 0 1 3 -3z" fill={C.white} />
          <path d="M19 24 h10 M19 27.4 h6" strokeWidth="1.6" />
        </g>
      );
    case 'clock':
      return (
        <g>
          <circle cx="24" cy="26" r="9" fill={C.cream} />
          <path d="M24 20.6 V26 L28 28.4" fill="none" strokeWidth="1.8" />
        </g>
      );
    case 'gift':
      return (
        <g>
          <rect x="16" y="24" width="16" height="10" rx="1.8" fill={C.pink} />
          <rect x="14.5" y="20.5" width="19" height="5" rx="1.8" fill={C.red} />
          <path d="M24 20.5 v13.5" strokeWidth="2.4" stroke={C.yellow} />
          <path d="M24 20.5 q-6 -7 -8 -3 q1 3 8 3 q7 0 8 -3 q-2 -4 -8 3" fill="none" strokeWidth="1.6" />
        </g>
      );
  }
}

/** 업적 메달. 잠겨 있으면 회색 실루엣으로 보인다 */
export function Medal({ glyph, tier, locked = false }: { glyph: Glyph; tier: Tier; locked?: boolean }) {
  const t = locked ? { rim: '#b9b2a8', face: '#e7e2da', ribbon: '#cfc8bd' } : TIER[tier];
  return (
    <S>
      <path d="M14 3 L20 24 L25 22 L22 3z M34 3 L28 24 L23 22 L26 3z" fill={t.ribbon} strokeWidth="1.6" />
      <circle cx="24" cy="29" r="15" fill={t.face} stroke={K} strokeWidth="2" />
      <circle cx="24" cy="29" r="11.6" fill="none" stroke={t.rim} strokeWidth="1.6" strokeDasharray="2.6 2.2" />
      <g transform="translate(0 3)" opacity={locked ? 0.35 : 1}>
        <Symbol glyph={glyph} />
      </g>
    </S>
  );
}
