import type { ReactNode } from 'react';

/**
 * 도감 이벤트·희귀 행동 아이콘 — 이모지 대신 파스텔 색연필 느낌으로 직접 그린 그림.
 * 48×48 안에서 갈색 연필선 + 연한 칠. 없는 id는 이모지로 대체한다.
 */
const K = '#8b5e3c';
const C = {
  peach: '#ffd2a1',
  cream: '#fff4dc',
  white: '#ffffff',
  gray: '#d9dde3',
  blue: '#bcdcf5',
  green: '#bfe5b4',
  yellow: '#ffe08a',
  red: '#f59a90',
  pink: '#ffc2d0',
  brown: '#c89268',
  purple: '#d5c4f2',
  orange: '#ffbb7a',
  dark: '#7d8290',
};

function S({ children }: { children: ReactNode }) {
  return (
    <svg className="ev-svg" viewBox="0 0 48 48" fill="none" stroke={K} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {children}
    </svg>
  );
}

const face = (cx: number, cy: number, r: number, fill: string = C.peach) => <circle cx={cx} cy={cy} r={r} fill={fill} />;

const Sneeze = (
  <S>
    {face(22, 26, 14)}
    <path d="M13 22l5 2-5 2M31 22l-5 2 5 2" />
    <ellipse cx="22" cy="33" rx="3" ry="2.4" fill={C.red} />
    <path d="M34 30l7-2M35 35l7 1M34 25l6-4" stroke={C.blue} strokeWidth="2.4" />
    <circle cx="8" cy="12" r="1.2" fill={C.yellow} stroke="none" />
  </S>
);
const Notes = (
  <S>
    <path d="M18 34V12l18-4v22" />
    <ellipse cx="14" cy="34" rx="5" ry="4" fill={C.pink} />
    <ellipse cx="32" cy="30" rx="5" ry="4" fill={C.pink} />
    <path d="M18 18l18-4" />
  </S>
);

const ICONS: Record<string, ReactNode> = {
  // ---- COMMON ----
  c01: (
    <S>
      <path d="M9 19h23v11a9 9 0 0 1-9 9h-5a9 9 0 0 1-9-9z" fill={C.cream} />
      <path d="M32 22h3a5 5 0 0 1 0 10h-3" />
      <ellipse cx="20.5" cy="19" rx="11.5" ry="3" fill={C.brown} />
      <path d="M16 13q-2-3 0-6M23 13q-2-3 0-6" stroke={C.dark} />
      <path d="M6 41h30" />
    </S>
  ),
  c02: (
    <S>
      <rect x="6" y="20" width="32" height="20" rx="5" fill={C.yellow} />
      <path d="M22 20v20M6 30h32" />
      <circle cx="14" cy="26" r="3" fill={C.white} />
      <circle cx="30" cy="26" r="3.2" fill={C.orange} />
      <path d="M12 34q3 3 6 0M26 35q3-3 8 0" stroke={C.green} strokeWidth="2.6" />
      <path d="M33 8q0-4 5-4t5 4q0 3-4 4v2" fill="none" />
      <circle cx="39" cy="18" r=".9" fill={K} />
    </S>
  ),
  c03: (
    <S>
      <rect x="6" y="22" width="36" height="16" rx="4" fill={C.gray} />
      <path d="M13 22V10h22v12" fill={C.white} />
      <path d="M16 15h14M16 19h9" stroke={C.dark} />
      <path d="M12 38v4h24v-4" fill={C.white} />
      <path d="M17 41l3-3 3 3 3-3 3 3" stroke={C.dark} strokeWidth="1.5" />
      <circle cx="35" cy="28" r="2.4" fill={C.red} />
    </S>
  ),
  c04: (
    <S>
      <path d="M17 35V14a7 7 0 0 1 14 0v22a4 4 0 0 1-8 0V17" stroke={C.dark} strokeWidth="3.4" />
      <path d="M17 35V14a7 7 0 0 1 14 0v22a4 4 0 0 1-8 0V17" stroke={K} strokeWidth="1.2" />
    </S>
  ),
  c05: (
    <S>
      {face(22, 26, 15)}
      <path d="M12 23q3-3 6 0M26 23q3-3 6 0" />
      <ellipse cx="22" cy="34" rx="4" ry="5" fill={C.red} />
      <path d="M33 10h6l-6 7h6" stroke={C.purple} strokeWidth="2.4" />
    </S>
  ),
  c06: (
    <S>
      <path d="M12 10h24l-3 30H15z" fill={C.cream} />
      <path d="M13.5 22h21l-1.6 18H15.1z" fill={C.blue} />
      <circle cx="21" cy="28" r="1.8" fill={C.white} />
      <circle cx="27" cy="33" r="1.3" fill={C.white} />
    </S>
  ),
  c07: (
    <S>
      <path d="M8 10h32a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H26l-8 8v-8H8a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z" fill={C.yellow} />
      <circle cx="16" cy="21" r="1.8" fill={K} />
      <circle cx="24" cy="21" r="1.8" fill={K} />
      <circle cx="32" cy="21" r="1.8" fill={K} />
      <circle cx="41" cy="9" r="5" fill={C.red} />
    </S>
  ),
  c08: (
    <S>
      <path d="M14 8h18l-2 18H16z" fill={C.blue} />
      <rect x="10" y="26" width="26" height="7" rx="3" fill={C.blue} />
      <path d="M23 33v8M14 41l9-4 9 4" />
      <path d="M38 14l4-2M39 20l4 1" stroke={C.dark} />
    </S>
  ),
  c09: (
    <S>
      <path d="M24 12c-8 0-12 6-12 14v4c0 7 5 12 12 12s12-5 12-12v-4c0-8-4-14-12-14z" fill={C.gray} />
      <path d="M24 12v13M12 25h24" />
      <rect x="29" y="3" width="14" height="8" rx="2" fill={C.white} />
      <rect x="31" y="5" width="3" height="4" fill={C.red} stroke="none" />
    </S>
  ),
  c10: (
    <S>
      <circle cx="19" cy="19" r="8" fill={C.yellow} />
      <path d="M19 4v4M19 30v4M4 19h4M30 19h4M8 8l3 3M30 8l-3 3M8 30l3-3" />
      <path d="M22 38a6 6 0 0 1 2-11 8 8 0 0 1 15 2 5 5 0 0 1-1 9z" fill={C.white} />
    </S>
  ),
  c11: (
    <S>
      <rect x="9" y="8" width="26" height="33" rx="3" fill={C.cream} />
      <rect x="16" y="5" width="12" height="7" rx="2" fill={C.dark} />
      <path d="M14 20h16M14 26h16M14 32h10" stroke={C.dark} />
      <path d="M32 36l8-8 3 3-8 8-4 1z" fill={C.pink} />
    </S>
  ),
  c12: (
    <S>
      <path d="M17 3l7 12 7-12" stroke={C.red} strokeWidth="2.6" />
      <rect x="10" y="15" width="28" height="26" rx="4" fill={C.white} />
      <circle cx="20" cy="26" r="4.4" fill={C.peach} />
      <path d="M13 36q7-6 14 0" />
      <path d="M30 24h5M30 29h5" stroke={C.dark} />
    </S>
  ),
  c13: (
    <S>
      <rect x="8" y="10" width="28" height="32" rx="3" fill={C.brown} />
      <path d="M8 21h28M8 32h28M22 10v32" />
      <path d="M30 10h12v8h-8" fill={C.yellow} />
      <path d="M12 14h6M26 25h6" stroke={C.cream} strokeWidth="1.6" />
    </S>
  ),
  c14: (
    <S>
      <rect x="9" y="10" width="30" height="21" rx="3" fill={C.blue} />
      <path d="M4 36h40l-3 4H7z" fill={C.gray} />
      <path d="M30 20a6 6 0 1 1-2.5-4.9M30 11v5h-5" stroke={C.white} strokeWidth="2.4" />
    </S>
  ),
  c15: (
    <S>
      <path d="M5 14a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z" fill={C.yellow} />
      <rect x="12" y="19" width="22" height="16" fill={C.white} />
      <path d="M16 24h14M16 29h9" stroke={C.dark} />
      <path d="M33 33l3 3 5-7" stroke={C.green} strokeWidth="3" />
    </S>
  ),
  c16: (
    <S>
      <rect x="5" y="10" width="38" height="14" rx="4" fill={C.white} />
      <path d="M10 19h28" />
      <path d="M12 30q4 3 0 7M22 30q4 3 0 7M32 30q4 3 0 7" stroke={C.blue} strokeWidth="2.6" />
    </S>
  ),
  c17: (
    <S>
      <path d="M9 28V24a15 15 0 0 1 30 0v4" />
      <rect x="5" y="26" width="9" height="14" rx="4" fill={C.pink} />
      <rect x="34" y="26" width="9" height="14" rx="4" fill={C.pink} />
    </S>
  ),
  c18: (
    <S>
      <path d="M9 17c0-5 8-9 15-9s15 4 15 9v3h-8v-4q-7-3-14 0v4H9z" fill={C.red} />
      <path d="M13 20q-2 8 1 16h20q3-8 1-16" fill={C.red} />
      <circle cx="24" cy="30" r="4" fill={C.white} />
      <path d="M36 6q2-3 5 0M37 11q4-4 8 0" stroke={C.dark} />
    </S>
  ),
  c19: (
    <S>
      <rect x="8" y="22" width="26" height="18" rx="3" fill={C.blue} />
      <path d="M14 22c0-8 5-10 9-14 4 4 9 6 9 14" fill={C.white} />
      <path d="M17 31h10" stroke={C.white} strokeWidth="2.6" />
      <path d="M38 12l3-3M40 18h4M37 24l4 2" stroke={C.dark} />
    </S>
  ),
  c20: (
    <S>
      <path d="M12 5h24v36l-4-3-4 3-4-3-4 3-4-3-4 3z" fill={C.white} />
      <path d="M17 13h14M17 19h14M17 25h8" stroke={C.dark} />
      <path d="M28 27h3" stroke={C.red} strokeWidth="2.6" />
    </S>
  ),
  // ---- UNCOMMON ----
  u01: (
    <S>
      <path d="M6 36l8-22 28 10-3 12z" fill={C.cream} />
      <path d="M6 36h33" />
      <path d="M14 14l28 10v4L12 20z" fill={C.pink} />
      <circle cx="24" cy="12" r="3" fill={C.red} />
    </S>
  ),
  u02: (
    <S>
      <path d="M8 20h8l16-9v26l-16-9H8z" fill={C.red} />
      <path d="M14 29l3 9h5l-3-9" fill={C.red} />
      <path d="M37 17q4 4 0 12M41 13q7 8 0 20" stroke={C.yellow} strokeWidth="2.6" />
    </S>
  ),
  u03: (
    <S>
      <path d="M9 8h30v26l-8 8H9z" fill={C.yellow} />
      <path d="M31 42v-8h8" fill={C.orange} />
      <path d="M24 15v14M17 22h14" stroke={C.red} strokeWidth="3.4" />
    </S>
  ),
  u04: (
    <S>
      <rect x="7" y="24" width="34" height="16" rx="3" fill={C.pink} />
      <path d="M7 29q4 4 8 0t8 0 8 0 8 0" fill={C.white} />
      <path d="M24 24v-8" />
      <path d="M24 8q-3 4 0 7 3-3 0-7z" fill={C.orange} />
      <path d="M13 24v-5M35 24v-5" />
    </S>
  ),
  u05: (
    <S>
      <path d="M24 42L7 12q17-8 34 0z" fill={C.yellow} />
      <path d="M7 12q17-8 34 0" fill={C.orange} />
      <circle cx="18" cy="17" r="3" fill={C.red} />
      <circle cx="29" cy="19" r="3" fill={C.red} />
      <circle cx="24" cy="28" r="2.6" fill={C.red} />
    </S>
  ),
  u06: (
    <S>
      <path d="M13 14h22l-3 28H16z" fill={C.cream} />
      <path d="M14.5 26h19l-1.8 16H16.3z" fill={C.brown} />
      <path d="M11 14h26" />
      <path d="M26 14l6-10" />
      <circle cx="21" cy="35" r="1.6" fill={K} stroke="none" />
      <circle cx="27" cy="32" r="1.6" fill={K} stroke="none" />
      <circle cx="26" cy="38" r="1.6" fill={K} stroke="none" />
    </S>
  ),
  u07: (
    <S>
      <path d="M6 20q18-16 36 0M13 27q11-9 22 0M20 34q4-4 8 0" stroke={C.dark} strokeWidth="3" />
      <circle cx="24" cy="40" r="2.2" fill={C.dark} stroke="none" />
      <path d="M33 33l10 10M43 33L33 43" stroke={C.red} strokeWidth="3.4" />
    </S>
  ),
  u08: (
    <S>
      <path d="M6 16l18-9 18 9v22l-18 8-18-8z" fill={C.orange} />
      <path d="M6 16l18 8 18-8M24 24v22" />
      <path d="M15 11l18 8v6l-6-3v-6" fill={C.cream} stroke={K} strokeWidth="1.6" />
    </S>
  ),
  u09: (
    <S>
      <path d="M8 8h32a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H27l-9 8v-8H8a3 3 0 0 1-3-3V11a3 3 0 0 1 3-3z" fill={C.pink} />
      <path d="M24 28c-8-6-9-10-6-13 3-2 6 0 6 2 0-2 3-4 6-2 3 3 2 7-6 13z" fill={C.red} />
    </S>
  ),
  u10: (
    <S>
      <ellipse cx="24" cy="28" rx="13" ry="14" fill={C.red} />
      <path d="M24 14v28" />
      <circle cx="24" cy="12" r="6" fill={C.dark} />
      <circle cx="18" cy="26" r="2.4" fill={K} stroke="none" />
      <circle cx="30" cy="26" r="2.4" fill={K} stroke="none" />
      <circle cx="19" cy="35" r="2" fill={K} stroke="none" />
      <circle cx="29" cy="35" r="2" fill={K} stroke="none" />
      <path d="M19 7l-4-4M29 7l4-4" />
    </S>
  ),
  u11: (
    <S>
      <rect x="9" y="6" width="30" height="34" rx="3" fill={C.blue} />
      <path d="M24 6v34M9 23h30" />
      <path d="M3 44l6-8M11 46l8-10M2 36l6-4" stroke={C.yellow} strokeWidth="3" />
      <rect x="6" y="39" width="36" height="5" rx="2" fill={C.cream} />
    </S>
  ),
  u12: (
    <S>
      <rect x="7" y="10" width="34" height="32" rx="4" fill={C.white} />
      <path d="M7 20h34" />
      <path d="M15 6v8M33 6v8" />
      <path d="M16 31l5 5 11-12" stroke={C.green} strokeWidth="4" />
    </S>
  ),
  u13: (
    <S>
      <path d="M8 20h7l9-8v24l-9-8H8z" fill={C.purple} />
      <path d="M30 18q5 6 0 12M35 13q9 11 0 22" stroke={C.pink} strokeWidth="2.8" />
    </S>
  ),
  // ---- RARE ----
  r01: (
    <S>
      <rect x="6" y="12" width="36" height="26" rx="3" fill={C.white} />
      <path d="M6 14l18 13 18-13" />
      <path d="M35 4h6l-6 7h6" stroke={C.purple} strokeWidth="2.4" />
    </S>
  ),
  r02: (
    <S>
      <rect x="22" y="6" width="19" height="34" rx="2" fill={C.peach} />
      <path d="M22 6l-12 4v32l12-4z" fill={C.brown} />
      <circle cx="19" cy="25" r="1.6" fill={K} stroke="none" />
      <path d="M5 26h-1" />
      <path d="M44 24l-8 0M40 20l4 4-4 4" stroke={C.green} strokeWidth="3" />
    </S>
  ),
  r03: (
    <S>
      <rect x="4" y="12" width="40" height="26" rx="4" fill={C.purple} />
      <rect x="4" y="18" width="40" height="6" fill={C.dark} />
      <rect x="10" y="29" width="12" height="4" rx="1" fill={C.yellow} />
      <path d="M32 31h6" stroke={C.cream} />
    </S>
  ),
  r04: (
    <S>
      {face(24, 14, 7)}
      <path d="M10 40q2-14 14-14t14 14z" fill={C.green} />
      <path d="M12 36q12 6 24 0" />
      <path d="M21 14h.1M27 14h.1" strokeWidth="2.6" />
      <path d="M36 8q4 3 0 7" stroke={C.blue} />
    </S>
  ),
  r05: (
    <S>
      <rect x="9" y="5" width="26" height="36" rx="3" fill={C.white} />
      <path d="M15 13h14M15 19h14M15 25h8" stroke={C.dark} />
      <circle cx="33" cy="33" r="10" fill={C.green} />
      <path d="M28 33l4 4 7-8" stroke={C.white} strokeWidth="3.4" />
    </S>
  ),
  r06: (
    <S>
      <rect x="7" y="20" width="34" height="22" rx="3" fill={C.pink} />
      <rect x="5" y="14" width="38" height="8" rx="3" fill={C.red} />
      <path d="M24 14v28" stroke={C.yellow} strokeWidth="5" />
      <path d="M24 14q-10-12-12-5t12 5q10-12 12-5t-12 5z" fill={C.yellow} />
    </S>
  ),
  r07: (
    <S>
      <rect x="15" y="8" width="18" height="34" rx="4" fill={C.green} />
      <rect x="20" y="4" width="8" height="5" rx="1.5" fill={C.gray} />
      <path d="M26 17l-6 9h6l-3 9 8-12h-6z" fill={C.yellow} strokeWidth="1.6" />
    </S>
  ),
  r08: (
    <S>
      <path d="M5 24h38a19 17 0 0 1-38 0z" fill={C.orange} />
      <path d="M8 24q16-6 32 0" fill={C.yellow} />
      <path d="M14 22q4-4 8 0t8 0" stroke={C.red} />
      <path d="M30 4l-8 19M36 5l-9 18" />
      <path d="M14 12q-2-3 0-6M20 14q-2-3 0-7" stroke={C.dark} />
    </S>
  ),
  r09: (
    <S>
      {face(24, 25, 16, C.yellow)}
      <path d="M16 22q3-3 6 0M26 22q3-3 6 0" />
      <path d="M16 30q8 8 16 0" fill={C.red} />
      <ellipse cx="13" cy="29" rx="3" ry="2" fill={C.pink} stroke="none" />
      <ellipse cx="35" cy="29" rx="3" ry="2" fill={C.pink} stroke="none" />
      <path d="M40 6l1.4 3.4 3.4 1.4-3.4 1.4L40 15.6l-1.4-3.4-3.4-1.4 3.4-1.4z" fill={C.yellow} strokeWidth="1.4" />
    </S>
  ),
  // ---- EPIC ----
  e01: (
    <S>
      <rect x="7" y="8" width="34" height="34" rx="4" fill={C.white} />
      <path d="M7 18h34" />
      <path d="M15 4v8M33 4v8" />
      <path d="M16 24l16 14M32 24L16 38" stroke={C.red} strokeWidth="4" />
    </S>
  ),
  e02: (
    <S>
      <circle cx="24" cy="26" r="15" fill={C.cream} />
      <path d="M10 10q-4 4-3 9M38 10q4 4 3 9" stroke={C.red} strokeWidth="3" />
      <path d="M24 26V16M24 26l7 3" />
      <path d="M17 41l-3 4M31 41l3 4" />
    </S>
  ),
  e03: (
    <S>
      <path d="M17 12h14l-3 7c9 4 12 11 12 17 0 5-5 8-16 8S8 41 8 36c0-6 3-13 12-17z" fill={C.green} />
      <path d="M17 12q7 4 14 0" />
      <path d="M24 26v10M20 29q4-3 8 0t-8 5q4 2 8-1" stroke={C.cream} strokeWidth="2.2" />
    </S>
  ),
  e04: (
    <S>
      <path d="M6 22q18-22 36 0z" fill={C.red} />
      <path d="M17 22q7-14 14 0" fill={C.white} />
      <path d="M24 22v20" />
      <path d="M4 42q10-4 20 0t20 0" stroke={C.blue} strokeWidth="3" />
      <circle cx="40" cy="9" r="4" fill={C.yellow} />
    </S>
  ),
  e05: (
    <S>
      <rect x="3" y="12" width="22" height="16" rx="2" fill={C.blue} />
      <rect x="23" y="16" width="22" height="16" rx="2" fill={C.cream} />
      <path d="M14 28v6M8 34h12M34 32v5M28 37h12" />
      <path d="M8 18h10M8 22h6" stroke={C.white} />
    </S>
  ),
  // ---- LEGENDARY ----
  l01: (
    <S>
      {face(25, 9, 5)}
      <path d="M25 14v13l-7 9M25 27l7 8M25 18l-9 4M25 18l8 5" />
      <rect x="33" y="22" width="9" height="7" rx="2" fill={C.brown} />
      <path d="M4 20h8M2 28h9M5 36h7" stroke={C.yellow} strokeWidth="2.6" />
    </S>
  ),
  l02: (
    <S>
      <path d="M8 40l8-22 14 14z" fill={C.yellow} />
      <path d="M26 20q8-8 6-16M30 24q10-2 14-10M32 30q8 0 12 6" stroke={C.pink} strokeWidth="2.6" />
      <circle cx="36" cy="10" r="2" fill={C.blue} stroke="none" />
      <circle cx="42" cy="22" r="2" fill={C.green} stroke="none" />
      <circle cx="22" cy="8" r="2" fill={C.red} stroke="none" />
      <path d="M13 31l4 4M18 25l4 4" strokeWidth="1.6" />
    </S>
  ),
  l03: (
    <S>
      <path d="M6 38a18 18 0 0 1 36 0" stroke={C.red} strokeWidth="3.4" />
      <path d="M11 38a13 13 0 0 1 26 0" stroke={C.yellow} strokeWidth="3.4" />
      <path d="M16 38a8 8 0 0 1 16 0" stroke={C.blue} strokeWidth="3.4" />
      <path d="M2 41a5 5 0 0 1 3-9 6 6 0 0 1 11 1 4 4 0 0 1 0 8zM30 41a4 4 0 0 1 2-8 5 5 0 0 1 10 1 4 4 0 0 1-1 7z" fill={C.white} />
    </S>
  ),
  // ---- 희귀 행동 ----
  stuff: (
    <S>
      <path d="M24 28c-3-6-9-4-9 2s9 10 9 10 9-4 9-10-6-8-9-2z" fill={C.yellow} stroke="none" />
      <circle cx="24" cy="20" r="14" fill={C.peach} />
      <circle cx="10" cy="26" r="8" fill={C.peach} />
      <circle cx="38" cy="26" r="8" fill={C.peach} />
      <circle cx="19" cy="17" r="1.8" fill={K} stroke="none" />
      <circle cx="29" cy="17" r="1.8" fill={K} stroke="none" />
      <ellipse cx="24" cy="23" rx="2.4" ry="1.8" fill={C.red} />
    </S>
  ),
  sneeze: Sneeze,
  doze: (
    <S>
      <circle cx="18" cy="30" r="12" fill={C.cream} />
      <circle cx="32" cy="14" r="7" fill={C.blue} />
      <circle cx="40" cy="7" r="3.4" fill={C.blue} />
      <path d="M10 28q3 3 6 0M20 28q3 3 6 0" />
      <path d="M32 11h5l-5 6h5" strokeWidth="1.6" />
    </S>
  ),
  dizzy: (
    <S>
      <path d="M24 24m0 0a2 2 0 1 1 2 2 5 5 0 1 1-5-5 9 9 0 1 1 9 9 13 13 0 1 1-13-13" stroke={C.purple} strokeWidth="2.6" />
      <path d="M10 8l1.6 3.4 3.4.6-2.6 2.4.8 3.6L10 16l-3.2 2 .8-3.6L5 12l3.4-.6zM40 38l1.4 3 3 .5-2.2 2.2.6 3-2.8-1.6-2.8 1.6.6-3-2.2-2.2 3-.5z" fill={C.yellow} strokeWidth="1.4" />
    </S>
  ),
  dance: Notes,
};
export const hasEventIcon = (id: string) => id in ICONS;

export function EventIcon({ id, emoji }: { id: string; emoji: string }) {
  return <>{ICONS[id] ?? emoji}</>;
}
