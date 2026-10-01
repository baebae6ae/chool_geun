import type { ReactNode } from 'react';
import { C, K, S, face } from './EventIcon';

/**
 * 사무실·카페·옥상 정원·캠핑장 물건 80개를 파스텔 색연필 느낌으로 직접 그린 그림.
 * 이름(WorkItem.name)으로 찾는다. 48×48 안에 갈색 연필선 + 연한 칠.
 */
const leaf = (d: string, fill: string = C.green) => <path d={d} fill={fill} />;

const Pot = (
  <S>
    <path d="M24 28C24 20 16 18 12 20c0 7 6 10 12 8zM24 28c0-9 8-12 13-9-1 8-7 11-13 9z" fill={C.green} />
    <path d="M24 40V26" />
    <path d="M13 31h22l-3 11H16z" fill={C.orange} />
    <rect x="11" y="28" width="26" height="5" rx="2" fill="#f2a86a" />
  </S>
);

const Rainbow = (
  <S>
    <path d="M5 38a19 19 0 0 1 38 0" stroke={C.red} strokeWidth="3.6" />
    <path d="M10 38a14 14 0 0 1 28 0" stroke={C.yellow} strokeWidth="3.6" />
    <path d="M15 38a9 9 0 0 1 18 0" stroke={C.blue} strokeWidth="3.6" />
    <path d="M2 42a5 5 0 0 1 3-9 6 6 0 0 1 11 1 4 4 0 0 1 0 8zM32 42a4 4 0 0 1 2-8 5 5 0 0 1 10 1 4 4 0 0 1-1 7z" fill={C.white} />
  </S>
);

const Cloud = (
  <S>
    <path d="M12 36a8 8 0 0 1 1-16 11 11 0 0 1 21 3 7 7 0 0 1 0 13z" fill={C.white} />
    <path d="M16 31q4 3 8 0" stroke={C.blue} />
  </S>
);

const Calendar = (
  <S>
    <rect x="7" y="9" width="34" height="32" rx="4" fill={C.white} />
    <path d="M7 19h34" />
    <rect x="7" y="9" width="34" height="10" rx="4" fill={C.red} />
    <path d="M15 5v8M33 5v8" />
    <path d="M14 25h4M22 25h4M30 25h4M14 31h4M22 31h4M30 31h4M14 36h4M22 36h4" stroke={C.dark} strokeWidth="2.4" />
  </S>
);

const Window = (
  <S>
    <rect x="7" y="6" width="34" height="36" rx="3" fill={C.blue} />
    <path d="M24 6v36M7 24h34" />
    <path d="M11 12l6 0M28 30l7 0" stroke={C.white} strokeWidth="2.6" />
    <rect x="4" y="39" width="40" height="5" rx="2" fill={C.cream} />
  </S>
);

const Frame = (
  <S>
    <rect x="6" y="8" width="36" height="32" rx="2" fill="#e8b878" />
    <rect x="11" y="13" width="26" height="22" fill={C.blue} />
    <circle cx="30" cy="20" r="3.6" fill={C.yellow} />
    <path d="M11 35l8-10 6 6 5-4 7 8z" fill={C.green} />
  </S>
);

const Coffee = (
  <S>
    <rect x="9" y="6" width="30" height="34" rx="4" fill={C.red} />
    <rect x="13" y="10" width="22" height="9" rx="2" fill={C.cream} />
    <circle cx="19" cy="14.5" r="2" fill={C.green} stroke="none" />
    <path d="M20 21h8v5h-8z" fill={C.dark} />
    <path d="M17 40v-8h14v8" fill={C.white} />
    <path d="M24 26v4" stroke={C.brown} strokeWidth="2.6" />
    <rect x="6" y="40" width="36" height="4" rx="2" fill={C.gray} />
  </S>
);

const Fridge = (
  <S>
    <rect x="11" y="4" width="26" height="40" rx="4" fill={C.blue} />
    <path d="M11 19h26" />
    <rect x="15" y="8" width="5" height="8" rx="2" fill={C.green} />
    <rect x="23" y="8" width="5" height="8" rx="2" fill={C.yellow} />
    <rect x="31" y="9" width="3.4" height="7" rx="1.5" fill={C.pink} />
    <path d="M16 24v8M16 28" strokeWidth="3" />
    <rect x="22" y="24" width="12" height="7" rx="2" fill={C.cream} />
    <path d="M16 36h18" stroke={C.cream} strokeWidth="2.4" />
  </S>
);

const Chair = (
  <S>
    <path d="M15 5h18l-2 17H17z" fill={C.blue} />
    <rect x="11" y="22" width="26" height="8" rx="4" fill={C.blue} />
    <path d="M24 30v9M13 41l11-3 11 3" />
    <circle cx="13" cy="42" r="2" fill={C.dark} />
    <circle cx="35" cy="42" r="2" fill={C.dark} />
  </S>
);

const Printer = (
  <S>
    <rect x="6" y="22" width="36" height="16" rx="4" fill={C.gray} />
    <path d="M13 22V9h22v13" fill={C.white} />
    <path d="M17 14h14M17 18h9" stroke={C.dark} />
    <path d="M12 38v5h24v-5" fill={C.white} />
    <circle cx="35" cy="28" r="2" fill={C.green} />
  </S>
);

const Basket = (
  <S>
    <path d="M6 22h36l-4 20H10z" fill="#e8b878" />
    <path d="M6 22h36" />
    <path d="M15 22l2 20M24 22v20M33 22l-2 20M8 30h32M10 36h28" stroke="#c99a58" strokeWidth="1.4" />
    <path d="M12 22q12-18 24 0" fill="none" />
    <circle cx="18" cy="17" r="4" fill={C.red} />
    <circle cx="28" cy="15" r="4" fill={C.orange} />
    <path d="M23 12q3-4 6-2" stroke={C.green} />
  </S>
);

const Sun = (
  <S>
    <circle cx="24" cy="24" r="10" fill={C.yellow} />
    <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M10 38l4-4" />
    <path d="M20 22h.1M28 22h.1" strokeWidth="2.6" />
    <path d="M21 27q3 3 6 0" strokeWidth="1.6" />
  </S>
);

const Notes = null;

export const ITEM_ICONS: Record<string, ReactNode> = {
  // ================= 시즌 1: 사무실 =================
  '사무실 벽': (
    <S>
      <rect x="4" y="9" width="40" height="30" rx="2" fill={C.orange} />
      <path d="M4 19h40M4 29h40M16 9v10M32 9v10M10 19v10M24 19v10M38 19v10M16 29v10M32 29v10" />
    </S>
  ),
  책상: (
    <S>
      <rect x="5" y="19" width="5" height="21" rx="2" fill="#d79d70" />
      <rect x="38" y="19" width="5" height="21" rx="2" fill="#d79d70" />
      <rect x="10" y="23" width="28" height="10" rx="2" fill="#e5b48a" />
      <path d="M21 28h6" strokeWidth="2.6" />
      <rect x="2" y="12" width="44" height="9" rx="3" fill="#f0c08f" />
    </S>
  ),
  컴퓨터: (
    <S>
      <rect x="8" y="9" width="32" height="22" rx="3" fill={C.blue} />
      <path d="M13 15h14M13 20h9" stroke={C.white} strokeWidth="2.4" />
      <path d="M4 36h40l-3 5H7z" fill={C.gray} />
      <path d="M20 31v5M28 31v5" />
    </S>
  ),
  의자: Chair,
  커피머신: Coffee,
  책장: (
    <S>
      <rect x="7" y="4" width="34" height="40" rx="2" fill="#e8b878" />
      <path d="M7 17h34M7 30h34" />
      <path d="M11 17V8h4v9M16 17V10h4v7M22 17V7h5v10" fill={C.red} />
      <path d="M12 30V21h5v9M18 30V19h4v11M29 30V22h4v8" fill={C.blue} />
      <path d="M11 43v-9h5v9M17 43v-7h5v7M28 43v-8h6v8" fill={C.green} />
    </S>
  ),
  화분: Pot,
  소파: (
    <S>
      <rect x="6" y="14" width="36" height="16" rx="6" fill={C.blue} />
      <rect x="2" y="22" width="10" height="16" rx="5" fill={C.blue} />
      <rect x="36" y="22" width="10" height="16" rx="5" fill={C.blue} />
      <rect x="10" y="26" width="28" height="12" rx="4" fill="#a7cdee" />
      <path d="M24 26v12" />
      <path d="M10 38v4M38 38v4" />
    </S>
  ),
  창문: Window,
  그림: Frame,
  서랍장: (
    <S>
      <rect x="7" y="8" width="34" height="34" rx="3" fill="#e8b878" />
      <path d="M7 19.5h34M7 31h34" />
      <path d="M21 14h6M21 25h6M21 36.5h6" strokeWidth="3" />
      <path d="M11 42v3M37 42v3" />
    </S>
  ),
  인형: (
    <S>
      <circle cx="12" cy="11" r="5" fill={C.brown} />
      <circle cx="36" cy="11" r="5" fill={C.brown} />
      <circle cx="24" cy="18" r="11" fill={C.brown} />
      <ellipse cx="24" cy="35" rx="11" ry="9" fill={C.brown} />
      <ellipse cx="24" cy="21" rx="5" ry="3.8" fill={C.cream} />
      <circle cx="19" cy="16" r="1.6" fill={K} stroke="none" />
      <circle cx="29" cy="16" r="1.6" fill={K} stroke="none" />
      <ellipse cx="24" cy="19.6" rx="1.8" ry="1.3" fill={K} stroke="none" />
      <ellipse cx="24" cy="36" rx="5.5" ry="5" fill={C.cream} stroke="none" />
    </S>
  ),
  스탠드: (
    <S>
      <path d="M14 5h18l6 14H8z" fill={C.yellow} />
      <path d="M22 19l-2 14 10 8" />
      <path d="M30 41l6 0M14 42h24" />
      <path d="M12 24l-4 4M24 24v5M36 24l4 4" stroke={C.yellow} strokeWidth="2.4" />
    </S>
  ),
  프린터: Printer,
  '음료 냉장고': Fridge,
  달력: Calendar,
  청소도구: (
    <S>
      <path d="M33 4l-12 24" strokeWidth="3" />
      <path d="M15 26l12 6 5 12H8z" fill={C.yellow} transform="translate(0 -4) rotate(-10 18 36)" />
      <path d="M14 36l-2 8M20 37l-1 7M26 36l1 7" stroke={C.brown} />
      <path d="M31 30h12v14H31z" fill={C.blue} />
      <ellipse cx="37" cy="30" rx="6" ry="2" fill={C.cream} />
    </S>
  ),
  게임기: (
    <S>
      <rect x="4" y="12" width="40" height="24" rx="9" fill={C.purple} />
      <rect x="15" y="16" width="18" height="13" rx="2" fill={C.green} />
      <path d="M9 24h6M12 21v6" strokeWidth="2.6" />
      <circle cx="36" cy="22" r="2" fill={C.red} />
      <circle cx="40" cy="27" r="2" fill={C.yellow} />
    </S>
  ),
  '대형 화분': (
    <S>
      <path d="M24 30C20 18 10 14 5 17c0 10 9 15 19 13zM24 30c0-14 9-22 18-20 1 12-8 21-18 20z" fill={C.green} />
      <path d="M24 30C28 24 31 18 34 16" />
      <path d="M24 42V28" />
      <path d="M11 32h26l-3 11H14z" fill="#e8a074" />
      <rect x="9" y="29" width="30" height="5" rx="2" fill="#f0b088" />
    </S>
  ),
  '사무실 문': (
    <S>
      <rect x="10" y="4" width="28" height="39" rx="2" fill="#e8b878" />
      <rect x="15" y="9" width="18" height="12" rx="1" fill={C.cream} />
      <rect x="15" y="26" width="18" height="12" rx="1" fill="#f0c898" />
      <circle cx="32" cy="27" r="2" fill={C.yellow} />
      <path d="M17 14h14" stroke={C.dark} strokeWidth="1.6" />
    </S>
  ),
  // ================= 시즌 2: 카페 =================
  '카페 간판': (
    <S>
      <path d="M24 30v14" strokeWidth="3" />
      <path d="M8 6h32v24H8z" fill={C.cream} />
      <path d="M8 6h32M8 11h32" />
      <path d="M17 16h12v6a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6z" fill={C.brown} />
      <path d="M29 18h3a3 3 0 0 1 0 6h-3" />
      <path d="M20 13v-2M25 13v-2" stroke={C.dark} />
    </S>
  ),
  '에스프레소 머신': Coffee,
  '컵케이크 진열대': (
    <S>
      <path d="M8 24a16 16 0 0 1 32 0z" fill={C.blue} opacity=".55" />
      <path d="M8 24a16 16 0 0 1 32 0z" />
      <path d="M17 34l2-9h10l2 9z" fill="#bde6f0" />
      <path d="M18 25q6-10 12 0z" fill={C.pink} />
      <circle cx="24" cy="15" r="2" fill={C.red} />
      <path d="M6 24h36M10 24v4h28v-4" fill={C.cream} />
      <path d="M12 30v14M36 30v14M8 44h32" />
    </S>
  ),
  '시그니처 케이크': (
    <S>
      <rect x="6" y="22" width="36" height="18" rx="4" fill={C.pink} />
      <path d="M6 28q4 5 9 0t9 0 9 0 9 0V22H6z" fill={C.white} />
      <circle cx="14" cy="18" r="4" fill={C.red} />
      <circle cx="24" cy="16" r="4" fill={C.red} />
      <circle cx="34" cy="18" r="4" fill={C.red} />
      <path d="M12 14l2 2M24 12l1 2M32 14l2 2" stroke={C.green} />
      <path d="M3 43h42" />
    </S>
  ),
  '쿠키 접시': (
    <S>
      <ellipse cx="24" cy="34" rx="20" ry="7" fill={C.white} />
      <circle cx="16" cy="28" r="8" fill={C.brown} />
      <circle cx="31" cy="27" r="8" fill="#d7a674" />
      <circle cx="24" cy="21" r="8" fill={C.brown} />
      <path d="M14 26h.1M18 31h.1M29 25h.1M33 30h.1M22 19h.1M26 23h.1" stroke="#7a4a2a" strokeWidth="2.6" />
    </S>
  ),
  '카페 의자': (
    <S>
      <path d="M13 4h22v18H13z" fill="#e8b878" />
      <path d="M19 4v18M24 4v18M30 4v18" />
      <rect x="9" y="22" width="30" height="7" rx="2" fill="#f0c898" />
      <path d="M12 29l-3 15M36 29l3 15M16 29v11M32 29v11" />
    </S>
  ),
  꽃병: (
    <S>
      <path d="M20 21h8q5 4 4 12-1 9-8 9t-8-9q-1-8 4-12z" fill={C.blue} />
      <path d="M24 21V10" />
      <path d="M24 12c-6 0-8-6-6-9 3 0 6 4 6 9zM24 12c6 0 8-6 6-9-3 0-6 4-6 9z" fill={C.pink} />
      <path d="M24 16c-6-1-9 4-8 8M24 16c5-2 9 3 8 8" stroke={C.green} />
    </S>
  ),
  메뉴판: (
    <S>
      <rect x="7" y="6" width="34" height="34" rx="3" fill="#5f7a6a" />
      <rect x="7" y="6" width="34" height="34" rx="3" stroke="#d2a066" strokeWidth="3.4" />
      <path d="M13 15h12M13 22h18M13 29h14" stroke={C.cream} strokeWidth="2.4" />
      <path d="M33 14l1 2.4 2.6.4-1.9 1.8.5 2.6-2.2-1.3-2.2 1.3.5-2.6-1.9-1.8 2.6-.4z" fill={C.yellow} strokeWidth="1.2" />
      <path d="M12 42h24" />
    </S>
  ),
  벽시계: (
    <S>
      <circle cx="24" cy="24" r="18" fill={C.cream} />
      <path d="M24 9v3M24 36v3M9 24h3M36 24h3" />
      <path d="M24 24V15M24 24l7 4" strokeWidth="2.6" />
      <circle cx="24" cy="24" r="2" fill={C.red} />
    </S>
  ),
  스피커: (
    <S>
      <rect x="10" y="4" width="28" height="40" rx="5" fill={C.dark} />
      <circle cx="24" cy="15" r="4" fill={C.gray} />
      <circle cx="24" cy="31" r="8.5" fill={C.gray} />
      <circle cx="24" cy="31" r="3.4" fill={C.dark} />
    </S>
  ),
  꿀단지: (
    <S>
      <rect x="13" y="5" width="22" height="8" rx="3" fill="#e8b878" />
      <path d="M12 13h24q5 6 4 17-1 12-16 12T8 30q-1-11 4-17z" fill={C.yellow} />
      <rect x="15" y="22" width="18" height="12" rx="3" fill={C.cream} />
      <path d="M19 28h10" stroke={C.orange} strokeWidth="2.6" />
      <path d="M20 13q0 5-2 6" stroke={C.orange} strokeWidth="2.4" />
    </S>
  ),
  크루아상: (
    <S>
      <path d="M4 32c0-12 8-20 20-20s20 8 20 20c-3 3-6 3-9 0-1-6-5-9-11-9s-10 3-11 9c-3 3-6 3-9 0z" fill="#f2b872" />
      <path d="M14 26l-3-8M20 22l-1-9M28 22l1-9M34 26l3-8" stroke="#b9854a" />
    </S>
  ),
  버블티: (
    <S>
      <path d="M13 14h22l-3 28H16z" fill={C.cream} />
      <path d="M14.5 26h19l-1.8 16H16.3z" fill={C.brown} />
      <path d="M11 14h26" />
      <path d="M26 14l7-11" />
      <circle cx="21" cy="36" r="2" fill={K} stroke="none" />
      <circle cx="28" cy="33" r="2" fill={K} stroke="none" />
      <circle cx="26" cy="39" r="2" fill={K} stroke="none" />
    </S>
  ),
  '도넛 탑': (
    <S>
      <ellipse cx="24" cy="34" rx="17" ry="8" fill="#f2b872" />
      <ellipse cx="24" cy="31" rx="17" ry="7" fill={C.pink} />
      <ellipse cx="24" cy="31" rx="5" ry="2.4" fill={C.cream} />
      <ellipse cx="24" cy="21" rx="14" ry="6" fill="#f2b872" />
      <ellipse cx="24" cy="19" rx="14" ry="6" fill={C.purple} />
      <ellipse cx="24" cy="19" rx="4" ry="2" fill={C.cream} />
      <path d="M12 30l2 1M33 29l2 1M17 18l2 1M30 17l2 1" stroke={C.white} strokeWidth="2" />
    </S>
  ),
  '얼음 냉동고': (
    <S>
      <rect x="4" y="12" width="40" height="28" rx="4" fill={C.blue} />
      <path d="M4 20h40" />
      <path d="M24 25v10M19 27l10 6M29 27L19 33" stroke={C.white} strokeWidth="2.4" />
      <path d="M10 15h3M35 15h3" strokeWidth="2.6" />
    </S>
  ),
  '펜던트 조명': (
    <S>
      <path d="M24 3v13" />
      <path d="M12 32a12 16 0 0 1 24 0z" fill={C.yellow} />
      <path d="M12 32h24" />
      <path d="M18 38l-3 5M24 38v6M30 38l3 5" stroke={C.yellow} strokeWidth="2.6" />
    </S>
  ),
  액자: Frame,
  '행잉 화분': (
    <S>
      <path d="M24 3v6M14 14l10-5 10 5" />
      <path d="M12 14h24l-2 11q-10 6-20 0z" fill="#e8a074" />
      <path d="M16 25q-5 6-3 14M22 26q-2 8 1 15M30 26q4 5 3 12M26 25q8 3 8 12" stroke={C.green} strokeWidth="2.6" />
      <circle cx="13" cy="39" r="2" fill={C.green} />
      <circle cx="34" cy="37" r="2" fill={C.green} />
    </S>
  ),
  '주문 벨': (
    <S>
      <path d="M8 34a16 16 0 0 1 32 0z" fill={C.yellow} />
      <rect x="4" y="34" width="40" height="7" rx="3" fill={C.gray} />
      <path d="M24 18v-6M20 12h8" />
      <path d="M14 28q2-8 8-9" stroke={C.white} strokeWidth="2.4" />
    </S>
  ),
  '개업 풍선': (
    <S>
      <path d="M12 26L24 44M24 25v19M36 26L24 44" />
      <ellipse cx="12" cy="17" rx="8" ry="10" fill={C.red} />
      <ellipse cx="24" cy="14" rx="8" ry="10" fill={C.yellow} />
      <ellipse cx="36" cy="17" rx="8" ry="10" fill={C.blue} />
      <path d="M8 12q1-3 4-4M20 9q1-3 4-3M32 12q1-3 4-4" stroke={C.white} strokeWidth="2.2" />
    </S>
  ),
  // ================= 시즌 3: 옥상 정원 =================
  새싹: (
    <S>
      <path d="M6 42q18-14 36 0z" fill="#c99a70" />
      <path d="M24 34V20" />
      <path d="M24 22C16 22 12 16 14 10c8 0 11 5 10 12zM24 24c1-7 6-11 12-10 1 7-4 11-12 10z" fill={C.green} />
    </S>
  ),
  해바라기: (
    <S>
      <path d="M24 28v16" strokeWidth="2.6" />
      <path d="M24 38c-8 1-12-4-12-8 7-1 11 3 12 8zM24 36c8 0 11-5 10-9-7 0-10 4-10 9z" fill={C.green} />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((a) => (
        <ellipse key={a} cx="24" cy="9" rx="3.4" ry="6.4" fill={C.yellow} transform={`rotate(${a} 24 17)`} />
      ))}
      <circle cx="24" cy="17" r="6.6" fill="#a8703e" />
      <path d="M21 15h.1M27 15h.1M24 19h.1" stroke={K} strokeWidth="2" />
    </S>
  ),
  '튤립 화단': (
    <S>
      <path d="M6 42q18-8 36 0z" fill="#c99a70" />
      <path d="M12 38V22M24 38V16M36 38V22" />
      <path d="M7 14q0 9 5 9t5-9l-2.5 3L12 12l-2.5 5z" fill={C.red} />
      <path d="M19 8q0 9 5 9t5-9l-2.5 3L24 6l-2.5 5z" fill={C.pink} />
      <path d="M31 14q0 9 5 9t5-9l-2.5 3L36 12l-2.5 5z" fill={C.yellow} />
      <path d="M12 38q-5-4-4-8M36 38q5-4 4-8" stroke={C.green} />
    </S>
  ),
  데이지: (
    <S>
      <path d="M16 44V26M34 44V30" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
        <ellipse key={a} cx="16" cy="13" rx="2.6" ry="5.2" fill={C.white} transform={`rotate(${a} 16 20)`} />
      ))}
      <circle cx="16" cy="20" r="3.6" fill={C.yellow} />
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <ellipse key={a} cx="34" cy="21" rx="2.4" ry="4.6" fill={C.pink} transform={`rotate(${a} 34 27)`} />
      ))}
      <circle cx="34" cy="27" r="3" fill={C.yellow} />
      <path d="M16 38c-6 0-8-4-7-7 5 0 7 3 7 7z" fill={C.green} />
    </S>
  ),
  '당근 밭': (
    <S>
      <path d="M4 30q20-6 40 0v14H4z" fill="#c99a70" />
      <path d="M12 30l4 14 4-14zM28 30l4 14 4-14z" fill={C.orange} />
      <path d="M12 31l8 0M29 31l6 0" stroke="#e08a3a" />
      <path d="M16 30c-4-8-1-12 0-14 1 2 4 6 0 14zM11 28c-4-4-4-8-3-10 3 2 5 5 3 10zM32 30c-4-8-1-12 0-14 1 2 4 6 0 14zM37 28c-4-4-4-8-3-10 3 2 5 5 3 10z" fill={C.green} />
    </S>
  ),
  방울토마토: (
    <S>
      <path d="M8 8q14 2 20 14t10 22" />
      <circle cx="30" cy="20" r="7" fill={C.red} />
      <circle cx="19" cy="31" r="7" fill={C.red} />
      <circle cx="35" cy="37" r="6.4" fill={C.red} />
      <path d="M27 14l3 3 3-3M16 25l3 3 3-3M32 32l3 3 3-3" stroke={C.green} strokeWidth="2.4" />
      <path d="M8 8c4 0 6 3 6 6-4 0-6-3-6-6z" fill={C.green} />
    </S>
  ),
  옥수수: (
    <S>
      <path d="M24 5c8 6 9 16 7 26-2 5-5 8-7 9-2-1-5-4-7-9-2-10-1-20 7-26z" fill={C.yellow} />
      <path d="M17 14h14M16 21h16M17 28h14M24 5v35" stroke="#d9a63a" strokeWidth="1.4" />
      <path d="M24 44c-10 0-15-8-14-17 5 3 9 8 14 17zM24 44c10 0 15-8 14-17-5 3-9 8-14 17z" fill={C.green} />
    </S>
  ),
  물뿌리개: (
    <S>
      <path d="M10 18h24l-2 22H12z" fill={C.blue} />
      <path d="M34 24l10-8M44 12l-2 10" />
      <path d="M10 22q-8 0-6 8t8 4" />
      <path d="M12 18q10-8 22 0" fill="none" />
      <path d="M43 25l3 3M40 28l2 4M45 21l3 1" stroke={C.blue} strokeWidth="2.4" />
    </S>
  ),
  '수확 바구니': Basket,
  꿀벌: (
    <S>
      <ellipse cx="17" cy="14" rx="7" ry="10" fill={C.white} transform="rotate(-25 17 14)" />
      <ellipse cx="31" cy="14" rx="7" ry="10" fill={C.white} transform="rotate(25 31 14)" />
      <ellipse cx="24" cy="30" rx="13" ry="10" fill={C.yellow} />
      <path d="M18 21v18M25 20v20M32 22v16" stroke={K} strokeWidth="3.4" />
      <circle cx="15" cy="29" r="1.8" fill={K} stroke="none" />
      <path d="M36 30l7 1" />
    </S>
  ),
  나비: (
    <S>
      <path d="M24 24C14 8 4 12 6 22s12 8 18 2zM24 24c10-16 20-12 18-2s-12 8-18 2z" fill={C.purple} />
      <path d="M24 26c-8 2-14 10-9 16 4 2 8-6 9-16zM24 26c8 2 14 10 9 16-4 2-8-6-9-16z" fill={C.pink} />
      <path d="M24 14v26" strokeWidth="3" />
      <path d="M22 13q-3-5-6-5M26 13q3-5 6-5" />
    </S>
  ),
  애벌레: (
    <S>
      <path d="M3 38q20-6 42 0-5 6-21 6T3 38z" fill={C.green} />
      <circle cx="12" cy="30" r="5.4" fill={C.green} />
      <circle cx="21" cy="26" r="5.4" fill="#cfeec2" />
      <circle cx="30" cy="26" r="5.4" fill={C.green} />
      <circle cx="39" cy="30" r="6.4" fill={C.yellow} />
      <path d="M37 28h.1M41 28h.1" stroke={K} strokeWidth="2.4" />
      <path d="M38 33q2 1.6 4 0M38 24l-2-4M42 24l2-4" />
    </S>
  ),
  햇살: Sun,
  구름: Cloud,
  무지개: Rainbow,
  연: (
    <S>
      <path d="M24 3l15 15-15 20L9 18z" fill={C.pink} />
      <path d="M24 3v35M9 18h30" />
      <path d="M24 3l15 15-15 5-15-5z" fill={C.yellow} />
      <path d="M24 38q-6 3 0 6t0 4M20 41l4-2M28 45l-4-2" stroke={C.red} />
    </S>
  ),
  새집: (
    <S>
      <path d="M24 44V30" strokeWidth="3" />
      <path d="M9 26l15-18 15 18z" fill={C.red} />
      <rect x="11" y="26" width="26" height="14" rx="2" fill="#e8b878" />
      <circle cx="24" cy="32" r="4.2" fill="#6b4a30" />
      <path d="M17 41h14" />
    </S>
  ),
  '딸기 화분': (
    <S>
      <path d="M13 32h22l-3 11H16z" fill="#e8a074" />
      <rect x="11" y="29" width="26" height="5" rx="2" fill="#f0b088" />
      <path d="M14 29c-4-6 0-10 3-10 1 4 0 7-3 10zM34 29c4-6 0-10-3-10-1 4 0 7 3 10zM24 29c-1-6 3-9 6-8 0 4-2 7-6 8z" fill={C.green} />
      <path d="M17 24c-4 0-5 5-3 8 3 0 6-3 3-8z" fill={C.red} />
      <path d="M31 22c-4 0-5 5-3 8 3 0 6-3 3-8z" fill={C.red} />
      <path d="M17 24l-1-3M31 22l1-3" stroke={C.green} />
    </S>
  ),
  '작은 분수': (
    <S>
      <path d="M24 34V16" strokeWidth="3" />
      <path d="M14 18q10 6 20 0" />
      <path d="M24 16q-8-4-9 6M24 16q8-4 9 6M24 16q0-8 0-10" stroke={C.blue} strokeWidth="2.6" />
      <path d="M13 30h22l-3 6H16z" fill={C.cream} />
      <path d="M5 34h38q-2 10-19 10T5 34z" fill={C.cream} />
      <path d="M9 37q15 5 30 0" stroke={C.blue} strokeWidth="2.4" />
    </S>
  ),
  // ================= 시즌 4: 캠핑장 =================
  텐트: (
    <S>
      <path d="M3 41L24 7l21 34z" fill={C.orange} />
      <path d="M24 7v34M24 41l-8 0" />
      <path d="M24 17L11 41h13zM24 17l13 24H24z" fill="#f4c98e" />
      <path d="M24 17l-9 24h9z" fill="#6b4a30" opacity=".35" stroke="none" />
      <path d="M24 7V3" />
    </S>
  ),
  모닥불: (
    <S>
      <path d="M24 5c3 6 10 9 10 18a10 10 0 0 1-20 0c0-4 2-6 4-8 0 3 2 4 3 4 0-6-1-9 3-14z" fill={C.orange} />
      <path d="M24 20c2 3 5 5 5 9a5 5 0 0 1-10 0c0-3 2-4 3-6z" fill={C.yellow} />
      <path d="M7 41l30-8M41 41L11 33" strokeWidth="3.4" />
      <path d="M7 41l30-8M41 41L11 33" stroke="#c99a70" strokeWidth="1.2" />
    </S>
  ),
  소나무: (
    <S>
      <path d="M24 3l11 14H13z" fill="#8fcf9a" />
      <path d="M24 12l13 16H11z" fill="#79c488" />
      <path d="M24 21l15 17H9z" fill="#68b97a" />
      <rect x="21" y="38" width="6" height="7" fill="#c99a70" />
    </S>
  ),
  장작: (
    <S>
      <rect x="4" y="24" width="40" height="9" rx="4.5" fill="#d2a066" />
      <rect x="4" y="34" width="40" height="9" rx="4.5" fill="#c99058" />
      <rect x="10" y="14" width="30" height="9" rx="4.5" fill="#dcae74" />
      <circle cx="41" cy="28.5" r="3" fill="#f0d2a0" />
      <circle cx="41" cy="38.5" r="3" fill="#f0d2a0" />
      <circle cx="36" cy="18.5" r="3" fill="#f0d2a0" />
    </S>
  ),
  달: (
    <S>
      <path d="M32 6a18 18 0 1 0 10 28A15 15 0 0 1 32 6z" fill={C.yellow} />
      <path d="M12 22h.1M18 34h.1" stroke="#e0b94a" strokeWidth="3" />
      <path d="M38 12l1 2.4 2.6.3-1.9 1.8.5 2.5-2.2-1.2-2.2 1.2.5-2.5-1.9-1.8 2.6-.3z" fill={C.cream} strokeWidth="1.2" />
    </S>
  ),
  별: (
    <S>
      <path d="M24 4l5.4 12 13 1.4-9.7 8.8 2.8 12.8L24 32l-11.5 7 2.8-12.8L5.6 17.4l13-1.4z" fill={C.yellow} />
      <path d="M20 22h.1M28 22h.1" strokeWidth="2.6" />
      <path d="M21.5 27q2.5 2 5 0" strokeWidth="1.6" />
    </S>
  ),
  등산화: (
    <S>
      <path d="M12 6h14v14q0 4 6 6l10 4q4 2 4 6v4H8V6z" fill="#c99058" />
      <path d="M8 38h38v5H8z" fill={C.dark} />
      <path d="M26 6v8M12 14h14M14 21l12 0" />
      <path d="M17 17l5 0M17 24l5 0" stroke={C.cream} strokeWidth="2.4" />
    </S>
  ),
  배낭: (
    <S>
      <path d="M17 8q7-6 14 0" fill="none" />
      <rect x="9" y="8" width="30" height="35" rx="10" fill={C.green} />
      <rect x="14" y="26" width="20" height="13" rx="3" fill="#9bd29a" />
      <path d="M14 26h20M24 26v13" />
      <path d="M9 22h-4v10h4M39 22h4v10h-4" />
      <path d="M16 15h16" stroke={C.cream} strokeWidth="2.6" />
    </S>
  ),
  나침반: (
    <S>
      <circle cx="24" cy="24" r="19" fill={C.cream} />
      <circle cx="24" cy="24" r="14" fill={C.white} />
      <path d="M24 10v3M24 35v3M10 24h3M35 24h3" />
      <g transform="rotate(38 24 24)">
        <path d="M24 9l5.2 15h-10.4z" fill={C.red} />
        <path d="M24 39l5.2-15h-10.4z" fill={C.blue} />
      </g>
      <circle cx="24" cy="24" r="1.8" fill={K} />
    </S>
  ),
  손전등: (
    <S>
      <path d="M8 18h16l2 4v4l-2 4H8z" fill={C.dark} />
      <path d="M24 16l6-5v22l-6-5z" fill={C.yellow} />
      <rect x="8" y="18" width="6" height="12" fill={C.red} stroke="none" />
      <path d="M33 14l9-5M34 22h10M33 30l9 5" stroke={C.yellow} strokeWidth="3" />
    </S>
  ),
  통조림: (
    <S>
      <path d="M9 12v26q0 5 15 5t15-5V12" fill={C.gray} />
      <ellipse cx="24" cy="12" rx="15" ry="5" fill={C.white} />
      <rect x="9" y="19" width="30" height="16" fill={C.red} stroke="none" />
      <path d="M9 19v16M39 19v16" />
      <path d="M17 27h14" stroke={C.cream} strokeWidth="2.6" />
      <path d="M28 12l6-2" stroke={K} />
    </S>
  ),
  꼬치구이: (
    <S>
      <path d="M5 42L42 5" strokeWidth="2.4" />
      <rect x="9" y="26" width="13" height="13" rx="4" fill={C.brown} transform="rotate(-45 15.5 32.5)" />
      <rect x="17" y="18" width="13" height="13" rx="4" fill={C.red} transform="rotate(-45 23.5 24.5)" />
      <rect x="25" y="10" width="13" height="13" rx="4" fill={C.orange} transform="rotate(-45 31.5 16.5)" />
    </S>
  ),
  마시멜로: (
    <S>
      <path d="M4 44L36 12" strokeWidth="2.6" />
      <rect x="28" y="4" width="16" height="14" rx="6" fill={C.white} transform="rotate(45 36 11)" />
      <path d="M31 8l4 4" stroke="#e8b878" strokeWidth="3" />
      <rect x="12" y="28" width="12" height="10" rx="4" fill={C.pink} transform="rotate(45 18 33)" />
    </S>
  ),
  부엉이: (
    <S>
      <path d="M10 8l5 5M38 8l-5 5" />
      <ellipse cx="24" cy="28" rx="15" ry="16" fill={C.brown} />
      <ellipse cx="24" cy="32" rx="9" ry="10" fill={C.cream} stroke="none" />
      <circle cx="17" cy="21" r="7" fill={C.white} />
      <circle cx="31" cy="21" r="7" fill={C.white} />
      <circle cx="17" cy="21" r="2.6" fill={K} stroke="none" />
      <circle cx="31" cy="21" r="2.6" fill={K} stroke="none" />
      <path d="M21 26l3 4 3-4z" fill={C.orange} />
      <path d="M18 36l1 3M24 37v3M30 36l-1 3" stroke="#c99058" />
    </S>
  ),
  다람쥐: (
    <S>
      <path d="M34 42c10-2 10-18 4-24-3-3-9-3-9 3 0 4 5 5 3 10-1 5-6 7-6 11z" fill="#d7a674" />
      <ellipse cx="20" cy="34" rx="10" ry="10" fill={C.brown} />
      <circle cx="17" cy="19" r="9" fill={C.brown} />
      <path d="M11 12l-1-6 6 3M22 11l3-5 2 6" fill={C.brown} />
      <circle cx="14" cy="18" r="1.6" fill={K} stroke="none" />
      <ellipse cx="11" cy="22" rx="2" ry="1.5" fill={K} stroke="none" />
      <ellipse cx="18" cy="38" rx="5" ry="5" fill={C.cream} stroke="none" />
    </S>
  ),
  카누: (
    <S>
      <path d="M3 28q21 14 42 0l-4 8q-17 8-34 0z" fill={C.red} />
      <path d="M3 28q21 8 42 0" />
      <path d="M12 22l26-14M38 8l4-1M35 11l5 4" />
      <path d="M3 41q5-3 10 0t10 0 10 0 10 0" stroke={C.blue} strokeWidth="2.6" />
    </S>
  ),
  낚싯대: (
    <S>
      <path d="M4 36L30 6q8 0 12 4" strokeWidth="2.6" />
      <path d="M42 10v14" />
      <path d="M34 30q-6 2-4 8 7 2 12-4 4 5 3 0-2-4-4-6z" fill={C.orange} />
      <circle cx="35" cy="33" r="1.2" fill={K} stroke="none" />
      <path d="M4 42q5-3 10 0t10 0" stroke={C.blue} strokeWidth="2.6" />
    </S>
  ),
  '호수 풍경': (
    <S>
      <rect x="4" y="8" width="40" height="34" rx="4" fill="#d6ecfb" />
      <circle cx="35" cy="17" r="4" fill={C.yellow} />
      <path d="M4 32l11-16 8 11 6-7 15 12z" fill="#9fc8a0" />
      <path d="M4 32q20-4 40 0v10H8a4 4 0 0 1-4-4z" fill={C.blue} />
      <path d="M12 36q4-2 8 0M26 38q4-2 8 0" stroke={C.white} strokeWidth="2" />
    </S>
  ),
  담요: (
    <S>
      <path d="M4 16h40v22H4z" fill={C.red} />
      <path d="M4 22h40M4 32h40M14 16v22M26 16v22M38 16v22" stroke="#fff0e0" strokeWidth="2.6" />
      <path d="M4 16l4-5h36l-4 5M4 38l4 5h36" fill={C.pink} />
      <path d="M4 38l4 5h36l-4-5" fill={C.pink} />
    </S>
  ),
  '캠프 완성': (
    <S>
      <path d="M2 40L18 12l16 28z" fill={C.orange} />
      <path d="M18 12v28M18 20l-7 20h7zM18 20l7 20h-7z" />
      <path d="M36 42l9-3M44 42l-9-3" strokeWidth="3" stroke="#c99058" />
      <path d="M40 38c1-3 4-4 3-9-3 1-6 4-3 9z" fill={C.orange} />
      <path d="M38 6l1.6 3.6 3.8.4-2.8 2.6.8 3.8-3.4-1.9-3.4 1.9.8-3.8-2.8-2.6 3.8-.4z" fill={C.yellow} strokeWidth="1.2" />
    </S>
  ),
};

void leaf;
void Notes;
void face;

export const hasItemIcon = (name: string) => name in ITEM_ICONS;
