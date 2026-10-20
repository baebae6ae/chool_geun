/**
 * 썰 극장 배경: 사무실 · 회의실 · 탕비실 · 엘리베이터 · 퇴근길 지하철.
 * 세트는 4:3(400×300) 기준으로 그리고, 바닥선은 y=228. 배우는 그 위에 선다.
 * 뒤 레이어(Backdrop)와 앞 레이어(Foreground)를 나눠 깊이감과 초점 이동을 만든다.
 */
import type { Bg } from '../../domain/theater';

const INK = '#5a4636';
const SW = 3;

interface Props {
  door?: string;
  fridge?: string;
  lift?: string;
}

export function Backdrop({ bg, props }: { bg: Bg; props: Props }) {
  return (
    <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
      {bg === 'office' && <Office />}
      {bg === 'meeting' && <Meeting />}
      {bg === 'pantry' && <Pantry fridge={props.fridge} />}
      {bg === 'elevator' && <Elevator lift={props.lift} />}
      {bg === 'subway' && <Subway />}
    </svg>
  );
}

export function Foreground({ bg }: { bg: Bg }) {
  if (bg === 'meeting') {
    return (
      <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <rect x="-10" y="236" width="420" height="14" rx="4" fill="#c99a6b" stroke={INK} strokeWidth={SW} />
        <rect x="0" y="250" width="400" height="60" fill="#b8865a" stroke={INK} strokeWidth={SW} />
        <rect x="70" y="226" width="34" height="12" rx="2" fill="#fff" stroke={INK} strokeWidth="2" />
        <rect x="296" y="228" width="26" height="10" rx="2" fill="#e8f0ff" stroke={INK} strokeWidth="2" />
      </svg>
    );
  }
  if (bg === 'subway') {
    return (
      <svg className="bd" viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden>
        <rect x="-10" y="262" width="420" height="50" rx="10" fill="#4f6fb0" stroke={INK} strokeWidth={SW} />
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
      <rect x="-20" y="228" width="440" height="90" fill={color} />
      {Array.from({ length: 12 }, (_, i) => (
        <path key={i} d={`M${i * 40 - 10} 228 L${i * 40 - 30} 300`} stroke={line} strokeWidth="2" />
      ))}
      <path d="M-20 228 H420" stroke={INK} strokeWidth={SW} />
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
      <rect x="-20" y="-20" width="440" height="250" fill="#f6e6cc" />
      <rect x="-20" y="188" width="440" height="40" fill="#ecd6b2" />
      <path d="M-20 188 H420" stroke={INK} strokeWidth="2" opacity=".5" />
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
      <rect x="-20" y="-20" width="440" height="250" fill="#e6edf5" />
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
      <rect x="-20" y="-20" width="440" height="250" fill="#eef7f2" />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={`v${i}`} d={`M${i * 40} 100 V228`} stroke="#d4e8dc" strokeWidth="2" />
      ))}
      {Array.from({ length: 4 }, (_, i) => (
        <path key={`h${i}`} d={`M-20 ${100 + i * 32} H420`} stroke="#d4e8dc" strokeWidth="2" />
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
      <rect x="-20" y="-20" width="440" height="250" fill="#ebe5da" />
      <path d="M-20 60 H420 M-20 140 H420" stroke="#ddd5c6" strokeWidth="2" />
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
      <rect x="-20" y="-20" width="440" height="250" fill="#dfe6ee" />
      {/* 창문: 어두운 터널에 불빛이 휙휙 */}
      {[20, 160, 300].map((x) => (
        <g key={x}>
          <rect x={x} y="40" width="110" height="86" rx="10" fill="#273048" stroke={INK} strokeWidth={SW} />
          <rect className="bd-tunnel" x={x + 120} y="70" width="34" height="6" rx="3" fill="#ffd27a" opacity=".85" />
          <rect className="bd-tunnel slow" x={x + 140} y="96" width="22" height="4" rx="2" fill="#fff" opacity=".5" />
        </g>
      ))}
      {/* 손잡이 */}
      <path d="M-20 14 H420" stroke="#9aa6b8" strokeWidth="5" />
      {[50, 130, 210, 290, 370].map((x, i) => (
        <g key={x} className="bd-strap" style={{ transformOrigin: `${x}px 14px`, animationDelay: `${i * 0.2}s` }}>
          <path d={`M${x} 14 V34`} stroke="#9aa6b8" strokeWidth="3" />
          <circle cx={x} cy="42" r="8" fill="none" stroke="#f2a64a" strokeWidth="4" />
        </g>
      ))}
      {/* 의자 등받이 */}
      <rect x="-10" y="150" width="420" height="80" rx="10" fill="#6f8fd0" stroke={INK} strokeWidth={SW} />
      <Floor color="#b8bfc9" line="#a6aeb9" />
    </g>
  );
}
