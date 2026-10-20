/**
 * 썰 극장 배경: 사무실 · 회의실 · 탕비실 · 엘리베이터 · 퇴근길 지하철 · 화장실 · 복사실 · 바닷가 · 내 방.
 * 세트는 4:3(400×300) 기준으로 그리고, 바닥선은 y=228. 배우는 그 위에 선다.
 * 뒤 레이어(Backdrop)와 앞 레이어(Foreground)를 나눠 깊이감과 초점 이동을 만든다.
 */
import type { Bg } from '../../domain/theater';

const INK = '#5a4636';
/** 바닷가 앞쪽 물결의 윗선 */
const WAVES = 'q14 -6 28 0 t28 0 t28 0 t28 0 t28 0 t28 0 t28 0';
const SW = 3;

interface Props {
  door?: string;
  fridge?: string;
  lift?: string;
  printer?: string;
  stall?: string;
}

export function Backdrop({ bg, props }: { bg: Bg; props: Props }) {
  return (
    <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
      {bg === 'office' && <Office />}
      {bg === 'meeting' && <Meeting />}
      {bg === 'pantry' && <Pantry fridge={props.fridge} />}
      {bg === 'elevator' && <Elevator lift={props.lift} />}
      {bg === 'subway' && <Subway />}
      {bg === 'building' && <Building />}
      {bg === 'restroom' && <Restroom stall={props.stall} />}
      {bg === 'copyroom' && <CopyRoom printer={props.printer} />}
      {bg === 'beach' && <Beach />}
      {bg === 'home' && <Home />}
      {bg === 'wasteland' && <Wasteland />}
      {bg === 'halo' && <Halo />}
      {bg === 'rain' && <Rain />}
      {bg === 'space' && <Space />}
    </svg>
  );
}

export function Foreground({ bg }: { bg: Bg }) {
  if (bg === 'meeting') {
    return (
      <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <rect x="-400" y="246" width="1200" height="14" rx="4" fill="#c99a6b" stroke={INK} strokeWidth={SW} />
        <rect x="-400" y="260" width="1200" height="900" fill="#b8865a" stroke={INK} strokeWidth={SW} />
        <rect x="70" y="236" width="34" height="12" rx="2" fill="#fff" stroke={INK} strokeWidth="2" />
        <rect x="296" y="238" width="26" height="10" rx="2" fill="#e8f0ff" stroke={INK} strokeWidth="2" />
      </svg>
    );
  }
  if (bg === 'subway') {
    return (
      <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <rect x="-400" y="262" width="1200" height="60" rx="10" fill="#4f6fb0" stroke={INK} strokeWidth={SW} />
      </svg>
    );
  }
  if (bg === 'beach') {
    // 오른쪽 바다의 앞쪽 물결: 물에 들어간 배우의 아랫몸을 가린다 (잠기면 통째로)
    return (
      <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <path d={`M205 246 ${WAVES} V1200 H224 C221 300 214 268 205 246Z`} fill="#7cc8ef" />
        <path className="bd-wave" d={`M205 246 ${WAVES}`} fill="none" stroke="#4f97c4" strokeWidth="2.6" strokeLinecap="round" />
        <path className="bd-wave" d="M226 258 q14 -5 28 0 t28 0 t28 0 t28 0 t28 0 t28 0" fill="none" stroke="#e8f7ff" strokeWidth="3" strokeLinecap="round" />
        <path d="M240 284 q12 -5 24 0 M300 296 q12 -5 24 0 M352 278 q12 -5 24 0" fill="none" stroke="#bfe6fb" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  if (bg === 'home') {
    // 침대 위 이불: 누우면 몸을 덮는다
    return (
      <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <path d="M232 250 q30 -14 70 -6 q40 8 84 -4 L400 300 L224 300Z" fill="#ffb4a8" stroke={INK} strokeWidth={SW} />
        <path d="M250 268 h40 M310 262 h40 M268 286 h50" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".7" />
      </svg>
    );
  }
  if (bg === 'office') {
    // 앞쪽에 흐릿한 화분 잎: 깊이감
    return (
      <svg className="bd fore-leaf" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <path d="M-20 300 C-10 240 20 210 46 196 C40 232 22 268 8 300Z" fill="#6fbf86" stroke={INK} strokeWidth={SW} />
        <path d="M-6 300 C12 262 40 246 70 240 C58 268 36 290 24 300Z" fill="#86cf98" stroke={INK} strokeWidth={SW} />
      </svg>
    );
  }
  return null;
}

function Floor({ color = '#d8b183', line = '#c39a6d' }: { color?: string; line?: string }) {
  return (
    <g>
      <rect x="-400" y="228" width="1200" height="900" fill={color} />
      {Array.from({ length: 30 }, (_, i) => (
        <path key={i} d={`M${i * 40 - 400} 228 L${i * 40 - 560} 1100`} stroke={line} strokeWidth="2" />
      ))}
      <path d="M-400 228 H800" stroke={INK} strokeWidth={SW} />
    </g>
  );
}

function Clock({ x, y, r = 20 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#fffaf0" stroke={INK} strokeWidth={SW} />
      <path d={`M${x} ${y} v${-r * 0.6} M${x} ${y} l${r * 0.45} ${r * 0.2}`} stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path className="bd-tick" d={`M${x} ${y} l${-r * 0.1} ${-r * 0.75}`} stroke="#e8504b" strokeWidth="1.6" strokeLinecap="round" style={{ transformOrigin: `${x}px ${y}px` }} />
    </g>
  );
}

function Office() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#f6e6cc" />
      <rect x="-400" y="188" width="1200" height="40" fill="#ecd6b2" />
      <path d="M-400 188 H800" stroke={INK} strokeWidth="2" opacity=".5" />
      <path d="M-400 -60 H800" stroke={INK} strokeWidth="2" opacity=".25" />
      {/* 창문 */}
      <rect x="150" y="30" width="104" height="92" rx="4" fill="#bfe4ff" stroke={INK} strokeWidth={SW} />
      <path d="M202 30 V122 M150 76 H254" stroke={INK} strokeWidth={SW} />
      <path d="M162 108 q10 -14 20 0 q8 -10 16 0" fill="#fff" opacity=".8" />
      <Clock x={70} y={60} />
      {/* 실적 그래프 포스터 */}
      <rect x="292" y="34" width="62" height="50" rx="3" fill="#fffaf0" stroke={INK} strokeWidth={SW} />
      <path d="M302 74 L316 62 L328 68 L344 46" fill="none" stroke="#e8504b" strokeWidth="3" strokeLinecap="round" />
      {/* 서류함 */}
      <rect x="318" y="134" width="56" height="94" rx="3" fill="#cdd5df" stroke={INK} strokeWidth={SW} />
      <path d="M318 165 H374 M318 196 H374" stroke={INK} strokeWidth="2.4" />
      <path d="M340 150 h12 M340 181 h12 M340 212 h12" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <Floor />
    </g>
  );
}

function Meeting() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#e6edf5" />
      {/* 화이트보드 */}
      <rect x="110" y="26" width="180" height="112" rx="4" fill="#fff" stroke={INK} strokeWidth={SW} />
      <path d="M126 50 h70 M126 66 h104 M126 82 h56" stroke="#3b7fd8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="250" cy="96" r="22" fill="none" stroke="#e8504b" strokeWidth="3" />
      <path d="M126 106 q30 -20 60 0 t60 0" fill="none" stroke="#3b7fd8" strokeWidth="2.4" />
      <text x="232" y="62" fontSize="14" fontWeight="900" fill="#e8504b">???</text>
      <rect x="150" y="138" width="100" height="8" rx="2" fill="#cdd5df" stroke={INK} strokeWidth="2" />
      <Clock x={346} y={58} />
      <Floor color="#c9c3d8" line="#b5aecb" />
    </g>
  );
}

function Pantry({ fridge }: { fridge?: string }) {
  const open = fridge === 'open';
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#eef7f2" />
      {Array.from({ length: 30 }, (_, i) => (
        <path key={`v${i}`} d={`M${i * 40 - 400} 100 V228`} stroke="#d4e8dc" strokeWidth="2" />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <path key={`h${i}`} d={`M-400 ${100 + i * 32} H800`} stroke="#d4e8dc" strokeWidth="2" />
      ))}
      {/* 수납장 */}
      <rect x="-10" y="20" width="250" height="62" rx="3" fill="#f3e2c8" stroke={INK} strokeWidth={SW} />
      <path d="M72 20 V82 M156 20 V82" stroke={INK} strokeWidth="2.4" />
      {/* 조리대 + 커피 머신 */}
      <rect x="-10" y="168" width="230" height="60" fill="#d9c3a2" stroke={INK} strokeWidth={SW} />
      <rect x="-10" y="160" width="232" height="12" rx="3" fill="#bfa27c" stroke={INK} strokeWidth={SW} />
      <rect x="40" y="110" width="48" height="52" rx="5" fill="#5c5f6e" stroke={INK} strokeWidth={SW} />
      <rect x="52" y="124" width="24" height="12" rx="2" fill="#9fd8ff" />
      <rect x="56" y="146" width="16" height="14" rx="2" fill="#fff" stroke={INK} strokeWidth="2" />
      <path d="M60 140 q4 -8 0 -14 M68 140 q4 -8 0 -14" stroke="#c8c0b8" strokeWidth="2" fill="none" className="bd-steam" />
      <rect x="120" y="140" width="18" height="22" rx="3" fill="#fff" stroke={INK} strokeWidth="2" />
      <rect x="144" y="146" width="16" height="16" rx="3" fill="#ffe08a" stroke={INK} strokeWidth="2" />
      {/* 냉장고 */}
      <rect x="280" y="62" width="88" height="166" rx="6" fill={open ? '#f4f9ff' : '#f7f7f4'} stroke={INK} strokeWidth={SW} />
      {open ? (
        <g>
          <path d="M288 110 H360 M288 150 H360 M288 190 H360" stroke="#cfd8e6" strokeWidth="3" />
          <rect x="300" y="128" width="14" height="20" rx="2" fill="#bfe4ff" stroke={INK} strokeWidth="2" />
          {/* 활짝 열린 문 */}
          <path d="M280 62 L236 50 L236 238 L280 228Z" fill="#ececea" stroke={INK} strokeWidth={SW} />
          <rect x="243" y="92" width="26" height="22" fill="#ffe56b" stroke={INK} strokeWidth="1.6" transform="rotate(-8 256 103)" />
          <text x="244" y="106" fontSize="7" fontWeight="900" fill={INK} transform="rotate(-8 256 103)">내 거!</text>
        </g>
      ) : (
        <g>
          <path d="M280 120 H368" stroke={INK} strokeWidth="2.4" />
          <path d="M290 84 v22 M290 134 v36" stroke={INK} strokeWidth="4" strokeLinecap="round" />
          <rect x="316" y="140" width="34" height="30" fill="#ffe56b" stroke={INK} strokeWidth="1.6" transform="rotate(6 333 155)" />
          <text x="318" y="158" fontSize="8" fontWeight="900" fill={INK} transform="rotate(6 333 155)">푸딩 내 거</text>
        </g>
      )}
      <Floor color="#d9d2c4" line="#c7bfae" />
    </g>
  );
}

function Elevator({ lift }: { lift?: string }) {
  const open = lift === 'open';
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#ebe5da" />
      <path d="M-400 60 H800 M-400 140 H800" stroke="#ddd5c6" strokeWidth="2" />
      {/* 층 표시 */}
      <rect x="168" y="14" width="64" height="24" rx="4" fill="#2d2440" stroke={INK} strokeWidth={SW} />
      <text x="183" y="32" fontSize="15" fontWeight="900" fill={open ? '#7dffa8' : '#ffb347'}>1F ▼</text>
      {/* 문 틀 + 안쪽 */}
      <rect x="140" y="48" width="120" height="180" fill="#ffe9b8" stroke={INK} strokeWidth={SW} />
      <rect x="150" y="58" width="100" height="10" fill="#fff6d8" />
      {/* 문 두 짝 (열리면 양옆으로) */}
      <g className="lift-door" style={{ transform: open ? 'translateX(-48px)' : 'none' }}>
        <rect x="142" y="50" width="58" height="178" fill="#c9ced6" stroke={INK} strokeWidth="2.4" />
        <path d="M150 70 v140" stroke="#e8ecf1" strokeWidth="5" />
      </g>
      <g className="lift-door" style={{ transform: open ? 'translateX(48px)' : 'none' }}>
        <rect x="200" y="50" width="58" height="178" fill="#c9ced6" stroke={INK} strokeWidth="2.4" />
        <path d="M250 70 v140" stroke="#e8ecf1" strokeWidth="5" />
      </g>
      <rect x="134" y="44" width="132" height="8" fill="#a7adb6" stroke={INK} strokeWidth="2" />
      {/* 호출 버튼 */}
      <rect x="286" y="118" width="22" height="40" rx="4" fill="#d9dde3" stroke={INK} strokeWidth="2.4" />
      <circle cx="297" cy="130" r="5" fill="#fff" stroke={INK} strokeWidth="2" />
      <circle cx="297" cy="146" r="5" fill="#ffb347" stroke={INK} strokeWidth="2" />
      <Floor color="#cfc6b4" line="#bdb39f" />
    </g>
  );
}

function Subway() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#dfe6ee" />
      {/* 창문: 어두운 터널에 불빛이 휙휙 */}
      {[20, 160, 300].map((x) => (
        <g key={x}>
          <rect x={x} y="40" width="110" height="86" rx="10" fill="#273048" stroke={INK} strokeWidth={SW} />
          <rect className="bd-tunnel" x={x + 120} y="70" width="34" height="6" rx="3" fill="#ffd27a" opacity=".85" />
          <rect className="bd-tunnel slow" x={x + 140} y="96" width="22" height="4" rx="2" fill="#fff" opacity=".5" />
        </g>
      ))}
      {/* 손잡이 */}
      <path d="M-400 14 H800" stroke="#9aa6b8" strokeWidth="5" />
      {[50, 130, 210, 290, 370].map((x, i) => (
        <g key={x} className="bd-strap" style={{ transformOrigin: `${x}px 14px`, animationDelay: `${i * 0.2}s` }}>
          <path d={`M${x} 14 V34`} stroke="#9aa6b8" strokeWidth="3" />
          <circle cx={x} cy="42" r="8" fill="none" stroke="#f2a64a" strokeWidth="4" />
        </g>
      ))}
      {/* 의자 등받이 */}
      <rect x="-400" y="150" width="1200" height="80" rx="10" fill="#6f8fd0" stroke={INK} strokeWidth={SW} />
      <Floor color="#b8bfc9" line="#a6aeb9" />
    </g>
  );
}

/* ---------- 설정 샷: 회사 건물 밖 ---------- */
function Building() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#bfe4ff" />
      <circle cx="330" cy="-60" r="26" fill="#fff3b0" />
      <path d="M-40 -20 q30 -18 60 0 q20 -14 44 0z M250 40 q24 -14 48 0 q16 -10 34 0z" fill="#fff" opacity=".9" />
      <rect x="90" y="-260" width="220" height="490" fill="#cfd6e0" stroke={INK} strokeWidth={SW} />
      {Array.from({ length: 9 }, (_, r) =>
        Array.from({ length: 4 }, (_, c) => (
          <rect key={`${r}-${c}`} x={106 + c * 50} y={-240 + r * 50} width="36" height="30" rx="2" fill={r === 7 && c === 1 ? '#ffe9a3' : '#9fb7cf'} stroke={INK} strokeWidth="2" />
        )),
      )}
      <rect x="-60" y="60" width="130" height="170" fill="#e2c9a8" stroke={INK} strokeWidth={SW} />
      <rect x="330" y="20" width="130" height="210" fill="#d6c3e3" stroke={INK} strokeWidth={SW} />
      <rect x="-400" y="228" width="1200" height="900" fill="#b9b2a6" />
      <path d="M-400 228 H800" stroke={INK} strokeWidth={SW} />
    </g>
  );
}

/* ---------- 속마음 장소 ---------- */
/** 허무: 잿빛 갈라진 황무지 */
function Wasteland() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#8f97a3" />
      <path d="M-400 170 L-200 90 L-60 150 L60 70 L200 160 L320 80 L460 150 L800 110 V230 H-400Z" fill="#4e5562" stroke={INK} strokeWidth="2.4" />
      <rect x="-400" y="200" width="1200" height="900" fill="#a9aeb5" />
      <path d="M-400 200 H800" stroke={INK} strokeWidth="2.4" />
      <g stroke="#6f7680" strokeWidth="2.4" fill="none" strokeLinecap="round">
        <path d="M20 250 l40 10 l20 -8 l50 14 M210 240 l30 16 l40 -6 l30 20 M60 300 l60 -10 l30 16 l70 -6 M260 290 l40 14 l60 -10" />
        <path d="M-120 330 l80 -20 l40 24 M330 340 l60 -18 l70 20 M80 380 l90 10 l40 -22" />
      </g>
    </g>
  );
}

/** 깨달음·신성: 금빛 후광 */
function Halo() {
  return (
    <g>
      <rect x="-400" y="-900" width="1200" height="2000" fill="#fff4c2" />
      <g className="bd-rays" style={{ transformOrigin: '200px 170px' }}>
        {Array.from({ length: 24 }, (_, i) => (
          <path key={i} d="M200 170 L190 -700 L210 -700Z" fill="#ffd23c" opacity=".55" transform={`rotate(${i * 15} 200 170)`} />
        ))}
      </g>
      <circle cx="200" cy="170" r="90" fill="#fff9e0" opacity=".9" />
      <path d="M40 270 q40 -30 80 0 q30 -24 60 0 M240 280 q36 -26 72 0 q30 -22 60 0" fill="#fff" stroke="#e8d38a" strokeWidth="3" />
    </g>
  );
}

/** 우울: 머리 위에만 먹구름 비 */
function Rain() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#5d6577" />
      <rect x="-400" y="228" width="1200" height="900" fill="#474e5e" />
      <path d="M-400 228 H800" stroke="#2d2f3a" strokeWidth={SW} />
      <path d="M120 40 q-10 -40 40 -42 q16 -36 60 -20 q40 -20 60 20 q46 4 36 42z" fill="#3b4150" stroke="#2d2f3a" strokeWidth={SW} />
      <g className="bd-rain" stroke="#9fb4d8" strokeWidth="3" strokeLinecap="round" opacity=".8">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${140 + i * 13} ${50 + (i % 3) * 14} l-4 22`} />
        ))}
      </g>
    </g>
  );
}

/** 멍: 우주 */
function Space() {
  return (
    <g>
      <rect x="-400" y="-900" width="1200" height="2000" fill="#1d2140" />
      {Array.from({ length: 60 }, (_, i) => (
        <circle key={i} className={i % 4 ? undefined : 'bd-star'} cx={((i * 97) % 1200) - 400} cy={((i * 53) % 1100) - 700} r={i % 5 ? 1.6 : 2.8} fill="#fff" />
      ))}
      <circle cx="320" cy="60" r="34" fill="#f2a64a" stroke="#fff3" strokeWidth="2" />
      <ellipse cx="320" cy="60" rx="58" ry="12" fill="none" stroke="#ffd27a" strokeWidth="4" transform="rotate(-18 320 60)" />
    </g>
  );
}

/* ---------- 화장실: 칸마다 잠겨 있다 ---------- */
function Restroom({ stall }: { stall?: string }) {
  const open = stall === 'open';
  const doors = [154, 234, 314];
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#e3f1ee" />
      {Array.from({ length: 30 }, (_, i) => (
        <path key={`v${i}`} d={`M${i * 26 - 400} 0 V228`} stroke="#cfe3de" strokeWidth="2" />
      ))}
      {Array.from({ length: 9 }, (_, i) => (
        <path key={`h${i}`} d={`M-400 ${i * 26} H800`} stroke="#cfe3de" strokeWidth="2" />
      ))}
      {/* 세면대 + 거울 */}
      <rect x="-40" y="40" width="130" height="78" rx="6" fill="#d8eef8" stroke={INK} strokeWidth={SW} />
      <path d="M-20 60 l30 -12 M10 92 l50 -24" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity=".8" />
      <rect x="-50" y="150" width="150" height="16" rx="4" fill="#f7f7f4" stroke={INK} strokeWidth={SW} />
      <path d="M20 150 v-12 h14" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <rect x="10" y="166" width="30" height="62" fill="#e9e6df" stroke={INK} strokeWidth="2.4" />
      {/* 칸막이 세 칸 */}
      <rect x="146" y="46" width="250" height="182" fill="#ffe2b8" />
      {doors.map((x, i) => {
        const last = i === doors.length - 1;
        if (last && open) {
          return (
            <g key={x}>
              <rect x={x} y="56" width="72" height="166" fill="#f6efe2" stroke={INK} strokeWidth="2.4" />
              {/* 변기 */}
              <rect x={x + 24} y="150" width="30" height="34" rx="6" fill="#fff" stroke={INK} strokeWidth="2.4" />
              <ellipse cx={x + 39} cy="196" rx="20" ry="9" fill="#fff" stroke={INK} strokeWidth="2.4" />
              <path d={`M${x + 28} 206 h22 l-3 18 h-16z`} fill="#fff" stroke={INK} strokeWidth="2.4" />
              {/* 활짝 열린 문 */}
              <path d={`M${x} 56 L${x - 18} 48 L${x - 18} 230 L${x} 222Z`} fill="#f2a64a" stroke={INK} strokeWidth="2.4" />
              <rect x={x + 26} y="38" width="22" height="10" rx="2" fill="#7dd88f" stroke={INK} strokeWidth="1.6" />
            </g>
          );
        }
        return (
          <g key={x}>
            <rect x={x} y="56" width="72" height="166" rx="2" fill="#f2a64a" stroke={INK} strokeWidth="2.4" />
            <path d={`M${x + 6} 62 h60 v154 h-60z`} fill="none" stroke="#d98c34" strokeWidth="2" />
            <circle cx={x + 60} cy="140" r="4" fill="#cdd5df" stroke={INK} strokeWidth="1.6" />
            {/* 사용 중 표시 */}
            <rect x={x + 22} y="38" width="28" height="12" rx="2" fill="#e8504b" stroke={INK} strokeWidth="1.6" />
            <text x={x + 25} y="47.5" fontSize="7.4" fontWeight="900" fill="#fff">사용중</text>
            {/* 문 아래로 보이는 발 + 폰 불빛 */}
            <ellipse cx={x + 28} cy="226" rx="7" ry="3.4" fill="#5c5f6e" />
            <ellipse cx={x + 44} cy="226" rx="7" ry="3.4" fill="#5c5f6e" />
            <path className="bd-glow" d={`M${x + 20} 224 h32`} stroke="#9fd8ff" strokeWidth="2" opacity=".8" />
          </g>
        );
      })}
      <path d="M146 46 H396" stroke={INK} strokeWidth="2.4" />
      <Floor color="#cfd8d6" line="#bccac7" />
    </g>
  );
}

/* ---------- 복사실: 커다란 복합기 ---------- */
function CopyRoom({ printer }: { printer?: string }) {
  const jam = printer === 'jam';
  const ok = printer === 'ok';
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#eceff4" />
      <rect x="-400" y="188" width="1200" height="40" fill="#dfe3ea" />
      {/* 게시판: IT팀 연락처 */}
      <rect x="236" y="34" width="120" height="84" rx="4" fill="#d9b58a" stroke={INK} strokeWidth={SW} />
      <rect x="248" y="46" width="52" height="38" fill="#fff" stroke={INK} strokeWidth="1.6" transform="rotate(-4 274 65)" />
      <text x="252" y="62" fontSize="7" fontWeight="900" fill={INK} transform="rotate(-4 274 65)">용지 걸림 시</text>
      <text x="252" y="74" fontSize="7" fontWeight="900" fill="#e8504b" transform="rotate(-4 274 65)">IT팀 ☎1234</text>
      <rect x="308" y="58" width="36" height="44" fill="#ffe56b" stroke={INK} strokeWidth="1.6" transform="rotate(5 326 80)" />
      <text x="312" y="78" fontSize="6.4" fontWeight="900" fill={INK} transform="rotate(5 326 80)">A4 아껴 써</text>
      {/* 종이 상자 */}
      <rect x="300" y="186" width="70" height="42" fill="#d9b58a" stroke={INK} strokeWidth={SW} />
      <text x="318" y="212" fontSize="10" fontWeight="900" fill={INK}>A4</text>
      {/* 복합기 */}
      <g>
        <rect x="24" y="100" width="150" height="18" rx="4" fill="#d6dbe3" stroke={INK} strokeWidth={SW} />
        <rect x="20" y="116" width="158" height="112" rx="6" fill="#eef1f5" stroke={INK} strokeWidth={SW} />
        <path d="M20 168 H178 M20 198 H178" stroke={INK} strokeWidth="2.4" />
        <path d="M80 182 h40 M80 212 h40" stroke={INK} strokeWidth="3.4" strokeLinecap="round" />
        {/* 조작판 */}
        <rect x="120" y="124" width="50" height="34" rx="4" fill="#5c5f6e" stroke={INK} strokeWidth="2.4" />
        <rect x="125" y="129" width="40" height="13" rx="2" fill={jam ? '#ffd0cc' : ok ? '#c9f5d3' : '#cfe3ff'} />
        <text x="127" y="139" fontSize="7.6" fontWeight="900" fill={jam ? '#c0322d' : '#2d2018'}>{jam ? '용지 걸림' : ok ? '인쇄 중…' : '대기'}</text>
        <circle className={jam ? 'bd-blink' : undefined} cx="131" cy="150" r="3.6" fill={jam ? '#e8504b' : ok ? '#4fcf6d' : '#b5bcc7'} stroke={INK} strokeWidth="1.4" />
        <rect x="140" y="146" width="22" height="8" rx="2" fill="#7dd88f" stroke={INK} strokeWidth="1.4" />
        {/* 왼쪽 출력 받침 */}
        <path d="M20 150 L-10 158 L-10 164 L20 160Z" fill="#d6dbe3" stroke={INK} strokeWidth="2.4" />
        {ok && (
          <g className="bd-print">
            <rect x="-6" y="140" width="26" height="18" fill="#fff" stroke={INK} strokeWidth="1.6" transform="rotate(-8 7 150)" />
            <path d="M-2 146 h16 M-2 151 h12" stroke="#9aa6b8" strokeWidth="1.4" transform="rotate(-8 7 150)" />
          </g>
        )}
        {/* 오른쪽 아래 구멍에 걸린 종이 */}
        {jam && <path d="M176 200 L194 206 L188 214 L198 222 L182 230 L176 222Z" fill="#fff" stroke={INK} strokeWidth="2" />}
      </g>
      <Floor color="#c9ced8" line="#b6bcc8" />
    </g>
  );
}

/* ---------- 바닷가: 왼쪽은 모래, 오른쪽은 바다 ---------- */
function Beach() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1030" fill="#bfe8ff" />
      <circle cx="320" cy="20" r="28" fill="#fff3b0" stroke="#ffd23c" strokeWidth="4" />
      <path d="M-30 30 q30 -18 60 0 q20 -14 44 0z M150 -10 q24 -14 48 0 q16 -10 34 0z" fill="#fff" opacity=".95" />
      {/* 수평선 너머 바다 */}
      <rect x="-400" y="110" width="1200" height="1000" fill="#7cc8ef" />
      <path d="M-400 110 H800" stroke={INK} strokeWidth="2.4" />
      <g className="bd-wave" fill="none" stroke="#e8f7ff" strokeWidth="2.6" strokeLinecap="round">
        <path d="M-60 140 q10 -5 20 0 M60 132 q10 -5 20 0 M180 150 q10 -5 20 0 M290 136 q10 -5 20 0 M350 170 q10 -5 20 0 M250 196 q10 -5 20 0" />
      </g>
      {/* 모래사장 */}
      <path d="M-400 180 C-100 176 120 182 196 228 C214 260 220 300 224 1200 H-400Z" fill="#f5dfae" stroke={INK} strokeWidth={SW} />
      <path d="M-400 180 C-100 176 120 182 196 228" fill="none" stroke="#fff" strokeWidth="5" opacity=".7" />
      <g fill="#e2c387">
        <circle cx="30" cy="250" r="2.4" />
        <circle cx="110" cy="270" r="2" />
        <circle cx="-20" cy="290" r="2.4" />
        <circle cx="160" cy="300" r="2" />
      </g>
      {/* 파라솔 + 돗자리 */}
      <path d="M20 90 L32 236" stroke={INK} strokeWidth="4" strokeLinecap="round" />
      <path d="M-40 112 Q20 50 84 98 q-16 -10 -32 2 q-16 -12 -32 0 q-16 -12 -32 0 q-14 -10 -28 12Z" fill="#ff8b7a" stroke={INK} strokeWidth={SW} />
      <path d="M2 112 Q14 70 20 66 M36 104 Q30 70 20 66" fill="none" stroke="#fff" strokeWidth="3" opacity=".8" />
      <path d="M40 232 L150 226 L160 246 L46 254Z" fill="#9fd8ff" stroke={INK} strokeWidth="2.4" />
      <path d="M62 231 L68 252 M88 229 L96 251 M114 228 L124 249" stroke="#fff" strokeWidth="4" />
    </g>
  );
}

/* ---------- 내 방: 밤, 운동 가방, 침대 ---------- */
function Home() {
  return (
    <g strokeLinejoin="round">
      <rect x="-400" y="-900" width="1200" height="1130" fill="#efe2d2" />
      <rect x="-400" y="196" width="1200" height="32" fill="#e3d2bd" />
      {/* 방문 */}
      <rect x="-30" y="58" width="76" height="170" rx="3" fill="#c99a6b" stroke={INK} strokeWidth={SW} />
      <circle cx="34" cy="146" r="4.4" fill="#ffd23c" stroke={INK} strokeWidth="2" />
      {/* 창문: 밤하늘 */}
      <rect x="110" y="34" width="96" height="84" rx="4" fill="#2d3560" stroke={INK} strokeWidth={SW} />
      <path d="M158 34 V118 M110 76 H206" stroke={INK} strokeWidth={SW} />
      <circle cx="184" cy="54" r="10" fill="#fff3b0" />
      <circle cx="189" cy="51" r="9" fill="#2d3560" />
      <circle cx="128" cy="96" r="1.6" fill="#fff" />
      <circle cx="140" cy="50" r="1.4" fill="#fff" />
      {/* 벽의 결심 포스터 */}
      <rect x="236" y="40" width="62" height="54" fill="#fffaf0" stroke={INK} strokeWidth="2.4" transform="rotate(3 267 67)" />
      <text x="244" y="62" fontSize="9" fontWeight="900" fill="#e8504b" transform="rotate(3 267 67)">운동 D-1</text>
      <text x="246" y="80" fontSize="7" fontWeight="900" fill={INK} transform="rotate(3 267 67)">(매일 D-1)</text>
      {/* 운동 가방 */}
      <rect x="62" y="196" width="66" height="34" rx="12" fill="#5c7fd0" stroke={INK} strokeWidth={SW} />
      <path d="M78 196 q17 -20 34 0" fill="none" stroke={INK} strokeWidth="3" />
      <path d="M84 212 h22 M84 208 v8 M106 208 v8" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      {/* 침대 */}
      <rect x="352" y="140" width="40" height="96" rx="8" fill="#c99a6b" stroke={INK} strokeWidth={SW} />
      <rect x="214" y="222" width="182" height="22" rx="6" fill="#fffaf0" stroke={INK} strokeWidth={SW} />
      <rect x="214" y="242" width="182" height="20" fill="#c99a6b" stroke={INK} strokeWidth={SW} />
      <ellipse cx="330" cy="218" rx="26" ry="10" fill="#fff" stroke={INK} strokeWidth="2.4" />
      <Floor color="#d4b48c" line="#c09e74" />
    </g>
  );
}
