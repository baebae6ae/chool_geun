/**
 * 월급날 다이어리 연출 (약 12초). 노트 위 손그림처럼 선이 꿈틀거리고, 카메라가 당기고 흔들린다.
 * 1쪽: 월급 알림 띠링 → 움츠렸다 점프 → 동전이 쏟아져 더미가 된다 → "부자다~♡"
 * 2쪽: "그리고 30분 뒤…" 청구서 넷이 쾅쾅 들이닥쳐 동전을 쓸어 가고 잔액 3,200원 → "다음 달에 봐…ㅠ"
 * 사용자가 꾸민 햄스터와 실제 금액·날짜가 그대로 들어간다. 1초에 30번만 다시 그려서 가볍게 한다.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { HamsterSprite } from '../hamster/HamsterSprite';
import type { FrontAction } from '../hamster/HamsterSprite';
import type { Customization } from '../../domain/types';
import { useBackHandler } from '../../backStack';
import { buzz } from '../../haptics';
import { BURST, CINEMA_END, diaryDate, GRAB_DUR, grabAt, LEFTOVER, PAGE2, PAGE_FLIP, paydayBills, PILE, sfxCues, type CinemaBill } from '../../domain/paydayCinema';
import { playCues } from './paydaySfx';
import './payday.css';

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eo = (x: number) => 1 - Math.pow(1 - x, 3);
const ei = (x: number) => x * x * x;
const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const back = (x: number) => (x <= 0 ? 0 : 1 + 3.2 * Math.pow(x - 1, 3) + 2.2 * Math.pow(x - 1, 2));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const won = (n: number) => Math.max(0, Math.floor(n)).toLocaleString('ko-KR');
/** 글씨가 왼쪽부터 써지는 효과 */
const write = (p: number): React.CSSProperties => ({ clipPath: `inset(-30px ${100 - p * 100}% -30px -30px)` });
/** 선이 그려지는 효과 (pathLength=1) */
const drawn = (p: number): React.CSSProperties => ({ strokeDasharray: '1 1', strokeDashoffset: 1 - p });

function Ham({ custom, action, x, y, sx, sy, rot, opacity = 1 }: { custom: Customization; action: FrontAction; x: number; y: number; sx: number; sy: number; rot: number; opacity?: number }) {
  return (
    <div className="pc-ham" style={{ left: x - 180, top: y - 340, opacity, transform: `rotate(${rot}deg) scale(${sx},${sy})` }}>
      <HamsterSprite custom={custom} pose={{ pose: 'front', action }} />
    </div>
  );
}

function Coins({ list }: { list: { x: number; y: number; ry: number; fill: number }[] }) {
  return (
    <>
      <svg className="pc-layer pc-crayon" width="720" height="1280">
        <g fill="#f6c443">
          {list.map((c, i) => (
            <ellipse key={i} cx={c.x} cy={c.y} rx={28} ry={Math.max(2, c.ry - 2)} opacity={c.fill} />
          ))}
        </g>
      </svg>
      <svg className="pc-layer pc-doodle" width="720" height="1280">
        <g fill="none" stroke="#3a3a6a" strokeWidth="5">
          {list.map((c, i) => (
            <ellipse key={i} cx={c.x} cy={c.y} rx={30} ry={Math.max(3, c.ry)} />
          ))}
        </g>
      </svg>
    </>
  );
}

const star = (x: number, y: number, s: number) =>
  `M${x} ${y - s}L${x + s * 0.3} ${y - s * 0.3}L${x + s} ${y}L${x + s * 0.3} ${y + s * 0.3}L${x} ${y + s}L${x - s * 0.3} ${y + s * 0.3}L${x - s} ${y}L${x - s * 0.3} ${y - s * 0.3}Z`;
const STARS = [...Array(9)].map((_, i) => ({ x: 120 + ((i * 197) % 480), y: 330 + ((i * 131) % 450), t0: 2.2 + ((i * 0.37) % 1.3) }));

/** 1쪽: 월급 들어온 날 */
function Page1({ t, custom, total, date }: { t: number; custom: Customization; total: number; date: string }) {
  let action: FrontAction = t < 1.1 ? 'type' : t < 2.0 ? 'phone' : 'cheer';
  let sx = 1, sy = 1, rot = 0, jx = 0, air = 0;
  if (t < 1.1) { sy = 1 + 0.025 * Math.sin(t * 7); sx = 1 - 0.012 * Math.sin(t * 7); }
  if (t >= 1.1 && t < 1.45) jx = Math.sin(t * 160) * 5 * (1 - seg(t, 1.1, 1.45));
  if (t >= 1.75 && t < 2.0) { const k = eo(seg(t, 1.75, 1.98)); sy = 1 - 0.24 * k; sx = 1 + 0.15 * k; }
  if (t >= 2.0 && t < 2.85) {
    if (t < 2.38) air = eo(seg(t, 2.0, 2.38)) * 260;
    else if (t < 2.52) air = 260 + Math.sin(seg(t, 2.38, 2.52) * Math.PI) * 10;
    else air = 260 * (1 - ei(seg(t, 2.52, 2.85)));
    if (t < 2.25) { const up = seg(t, 2.0, 2.2); sy = lerp(1.25, 1, up); sx = lerp(0.86, 1, up); }
    if (t > 2.6) { const dn = seg(t, 2.6, 2.85); sy = 1 + 0.12 * dn; sx = 1 - 0.07 * dn; }
    rot = Math.sin(seg(t, 2.0, 2.85) * Math.PI * 2) * 5;
  }
  if (t >= 2.85) { const k = t - 2.85; const d = Math.exp(-k * 7) * Math.cos(k * 26); sy = 1 - 0.22 * d; sx = 1 + 0.14 * d; rot = Math.sin(k * 20) * 3 * Math.exp(-k * 5); }
  if (t >= 3.2) air = Math.abs(Math.sin((t - 3.2) * 6)) * 14;
  if (t >= 3.2 && action !== 'cheer') action = 'cheer';
  const fx = 360 + jx, fy = 900 - air;
  const coins = BURST.filter((c) => t >= c.t0).map((c) => {
    const k = seg(t, c.t0, c.t0 + c.dur);
    let y = lerp(c.sy, c.y, k) - Math.sin(k * Math.PI) * c.h;
    if (k >= 1) { const b = t - c.t0 - c.dur; y -= Math.abs(Math.sin(b * 18)) * 14 * Math.exp(-b * 9); }
    return { x: lerp(c.sx, c.x, k), y, ry: k < 1 ? 18 * Math.abs(Math.cos((t - c.t0) * c.spin)) : 18, fill: k < 1 ? 0.35 : 0.35 + 0.65 * seg(t, c.t0 + c.dur, c.t0 + c.dur + 0.25) };
  });
  const shS = 1 - air / 420;
  const ham = <Ham custom={custom} action={action} x={fx} y={fy} sx={sx} sy={sy} rot={rot} />;
  const ck = back(seg(t, 1.12, 1.4)), mv = eio(seg(t, 1.8, 2.1));
  const burst = seg(t, 1.14, 1.5);
  return (
    <>
      <div className="pc-hand" style={{ left: 100, top: 40, fontSize: 44, ...write(seg(t, 0, 0.55)) }}>{date} 날씨: 💰</div>
      {t >= 2.04 && (
        <div className="pc-hand" style={{ left: 110, top: 140, fontSize: 62, color: '#e0533d', transformOrigin: '40% 50%', opacity: clamp(seg(t, 2.04, 2.26) * 3), transform: `scale(${lerp(2.4, 1, back(seg(t, 2.04, 2.26)))}) rotate(${lerp(-10, -3, seg(t, 2.04, 2.26))}deg)` }}>
          월급 들어온 날!!!
        </div>
      )}
      <svg className="pc-layer" width="720" height="1280">
        <ellipse cx={fx} cy={902} rx={120 * shS * sx} ry={16 * shS} fill={`rgba(90,70,40,${0.18 * shS})`} />
      </svg>
      {t >= 2.0 && t < 2.22 && [3, 2, 1].map((g) => <Ham key={g} custom={custom} action="cheer" x={fx} y={900 - eo(seg(t - g * 0.03, 2.0, 2.38)) * 260} sx={sx} sy={sy * 1.05} rot={0} opacity={0.14 * (4 - g)} />)}
      {t < 2.6 ? <><Coins list={coins} />{ham}</> : <>{ham}<Coins list={coins} /></>}
      {t >= 1.12 && (
        <div className="pc-note" style={{ left: lerp(390, 410, mv), top: lerp(395, 245, mv), transform: `scale(${ck * lerp(1, 0.72, mv)}) rotate(${7 - 4 * ck}deg)` }}>
          <svg className="pc-doodle" width="300" height="150" style={{ position: 'absolute', overflow: 'visible' }}>
            <rect x="4" y="4" width="290" height="140" rx="22" fill="#fff" stroke="#3a3a6a" strokeWidth="5" />
            <path d="M40 144 L20 178 L80 144" fill="#fff" stroke="#3a3a6a" strokeWidth="5" strokeLinejoin="round" />
          </svg>
          <div className="pc-hand" style={{ left: 26, top: 14, fontSize: 40, color: '#e0533d' }}>띠링!</div>
          <div className="pc-hand" style={{ left: 26, top: 66, fontSize: total >= 10_000_000 ? 40 : 50, color: '#1f9a5c' }}>+{won(total)}원</div>
        </div>
      )}
      {burst > 0 && burst < 1 && (
        <svg className="pc-layer pc-doodle" width="720" height="1280">
          <g stroke="#3a3a6a" strokeWidth="6" strokeLinecap="round" opacity={1 - burst}>
            {[...Array(12)].map((_, i) => {
              const a = (i / 12) * Math.PI * 2, r1 = 170 + 60 * eo(burst), r2 = r1 + 50 * (1 - burst);
              return <path key={i} d={`M${540 + Math.cos(a) * r1} ${470 + Math.sin(a) * r1 * 0.6} L${540 + Math.cos(a) * r2} ${470 + Math.sin(a) * r2 * 0.6}`} />;
            })}
          </g>
        </svg>
      )}
      <svg className="pc-layer pc-doodle" width="720" height="1280">
        <g fill="#ffd84a" stroke="#3a3a6a" strokeWidth="3">
          {STARS.filter((s) => t >= s.t0).map((s, i) => (
            <path key={i} d={star(s.x, s.y, 18 * back(seg(t, s.t0, s.t0 + 0.5)) * (0.7 + 0.3 * Math.sin((t - s.t0) * 12)))} />
          ))}
        </g>
      </svg>
      <div className="pc-hand" style={{ left: 80, top: 430 - (t > 3.2 ? air * 0.5 : 0), fontSize: 46, transform: 'rotate(-8deg)', ...write(seg(t, 3.15, 3.6)) }}>부자다~♡</div>
    </>
  );
}

const SLOTS = [0, 1, 2, 3].map((i) => ({ x: 384 + (i % 2) * 16, y: 240 + i * 150, rot: i % 2 ? 4 : -4 }));

/** 2쪽: 그리고 30분 뒤… (u = 2쪽 시작부터 흐른 시간) */
function Page2({ u, custom, total, bills, date }: { u: number; custom: Customization; total: number; bills: CinemaBill[]; date: string }) {
  const last = bills[bills.length - 1];
  const end = last.at + 1.1;
  let action: FrontAction = u < bills[0].at ? 'idle' : u < end ? 'shock' : 'cry';
  // 동전: 청구서마다 위쪽부터 4개씩 날아간다
  const flying: { x: number; y: number; ry: number; fill: number }[] = [];
  const staying: { x: number; y: number; ry: number; fill: number }[] = [];
  let gone = 0;
  PILE.forEach(([x, y], idx) => {
    const order = PILE.length - 1 - idx; // 위 줄부터
    const b = bills[Math.floor(order / 4)];
    const j = order % 4;
    const k = seg(u, grabAt(b, j), grabAt(b, j) + GRAB_DUR);
    const slot = SLOTS[bills.indexOf(b)];
    if (k <= 0) staying.push({ x: x - 120, y, ry: 18, fill: 1 });
    else if (k < 1) flying.push({ x: lerp(x - 120, slot.x + 130, eo(k)), y: lerp(y, slot.y + 60, eo(k)) - Math.sin(k * Math.PI) * 160, ry: 18 * Math.abs(Math.cos(k * 14)), fill: 1 });
    else gone++;
  });
  const feet = 900 + 88 * eio(gone / PILE.length);
  // 흔들림
  let jit = 0;
  for (const b of bills) if (u > b.at && u < b.at + 0.3) jit = Math.sin(u * 140) * 7;
  if (action === 'cry') jit = Math.sin(u * 30) * 1.5;
  // 잔액: 청구서가 내려앉을 때마다 쭉 줄어든다
  let bal = total;
  for (const b of bills) bal -= b.amount * eo(seg(u, b.at + 0.1, b.at + 0.6));
  const final = u > end;
  const circle = seg(u, end + 0.05, end + 0.55);
  return (
    <>
      <div className="pc-hand" style={{ left: 100, top: 40, fontSize: 44 }}>{date} 날씨: 💰</div>
      <div className="pc-hand" style={{ left: 110, top: 140, fontSize: 54, ...write(seg(u, 0, 0.6)) }}>그리고 30분 뒤…</div>
      {bills.map((b, i) => {
        if (u < b.at - 0.25) return null;
        const s = SLOTS[i];
        const k = seg(u, b.at - 0.25, b.at);
        const x = lerp(760, s.x, eo(k)), r = lerp(-18, s.rot, back(k));
        const land = seg(u, b.at, b.at + 0.4);
        return (
          <div key={b.name} className="pc-bill" style={{ left: x, top: s.y, transform: `rotate(${r}deg) scale(${1 + 0.12 * (1 - eo(land)) * (land > 0 ? 1 : 0)})` }}>
            <svg className="pc-crayon" width="260" height="120" style={{ position: 'absolute' }}>
              <rect x="6" y="6" width="248" height="26" fill={b.color} />
            </svg>
            <svg className="pc-doodle" width="260" height="120" style={{ position: 'absolute', overflow: 'visible' }}>
              <rect x="4" y="4" width="252" height="112" rx="8" fill="none" stroke="#3a3a6a" strokeWidth="5" />
              <path d="M196 84 l22 8 M246 84 l-22 8" stroke="#3a3a6a" strokeWidth="5" strokeLinecap="round" />
              <circle cx="206" cy="100" r="4" fill="#3a3a6a" /><circle cx="236" cy="100" r="4" fill="#3a3a6a" />
            </svg>
            <div className="pc-hand" style={{ left: 20, top: 30, fontSize: 44, color: b.color }}>{b.name}</div>
            <div className="pc-hand" style={{ left: 22, top: 76, fontSize: 28 }}>-{won(b.amount)}</div>
          </div>
        );
      })}
      {bills.map((b, i) => {
        const p = seg(u, b.at, b.at + 0.35);
        if (p <= 0 || p >= 1) return null;
        const s = SLOTS[i];
        return (
          <svg key={i} className="pc-layer pc-doodle" width="720" height="1280">
            <g stroke="#3a3a6a" strokeWidth="6" strokeLinecap="round" opacity={1 - p}>
              {[...Array(10)].map((_, n) => {
                const a = (n / 10) * Math.PI * 2, r1 = 140 + 50 * eo(p), r2 = r1 + 40 * (1 - p);
                return <path key={n} d={`M${s.x + 130 + Math.cos(a) * r1} ${s.y + 60 + Math.sin(a) * r1 * 0.55} L${s.x + 130 + Math.cos(a) * r2} ${s.y + 60 + Math.sin(a) * r2 * 0.55}`} />;
              })}
            </g>
          </svg>
        );
      })}
      <svg className="pc-layer" width="720" height="1280">
        <ellipse cx={240 + jit} cy={feet + 2} rx={120} ry={16} fill="rgba(90,70,40,.18)" />
      </svg>
      <Ham custom={custom} action={action} x={240 + jit} y={feet} sx={1} sy={action === 'cry' ? 1 - 0.03 * Math.abs(Math.sin(u * 4)) : 1} rot={0} />
      <Coins list={staying} />
      <Coins list={flying} />
      <div className="pc-hand" style={{ left: 90, top: 1060, fontSize: 48, ...write(seg(u, 0.35, 0.8)) }}>
        잔액: <span style={{ color: final ? '#e0533d' : '#3a3a6a', fontSize: final ? 64 : 48, display: 'inline-block', transform: final ? `scale(${1 + 0.35 * (1 - eo(seg(u, end, end + 0.35)))})` : undefined, transformOrigin: '0 70%' }}>{final ? won(LEFTOVER) : won(bal)}원</span>
      </div>
      {circle > 0 && (
        <svg className="pc-layer pc-doodle" width="720" height="1280">
          <path pathLength={1} style={drawn(circle)} d="M210 1100 C 160 1040, 330 1030, 450 1050 C 540 1065, 520 1150, 400 1158 C 290 1166, 190 1150, 205 1095" fill="none" stroke="#e0533d" strokeWidth="5" strokeLinecap="round" />
        </svg>
      )}
      <div className="pc-hand" style={{ left: 392, top: 880, fontSize: 38, transform: 'rotate(-6deg)', ...write(seg(u, 5.3, 6.0)) }}>다음 달에 봐…ㅠ</div>
    </>
  );
}

export function PaydayCinema({ custom, total, dateKey, onDone }: { custom: Customization; total: number; dateKey: string; onDone: () => void }) {
  const bills = useMemo(() => paydayBills(total), [total]);
  const date = useMemo(() => diaryDate(dateKey), [dateKey]);
  const [t, setT] = useState(0);
  const [boil, setBoil] = useState(1);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  useBackHandler(true, finish);
  const [fit, setFit] = useState(1);
  useEffect(() => {
    const onResize = () => setFit(Math.min(window.innerWidth / 720, window.innerHeight / 1280));
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  useEffect(() => {
    const stop = playCues(sfxCues(bills));
    buzz([30, 60, 30]);
    const t0 = performance.now();
    let raf = 0, last = -1;
    const loop = () => {
      const s = (performance.now() - t0) / 1000;
      const f = Math.floor(s * 30);
      if (f !== last) {
        last = f;
        setT(s);
        setBoil((Math.floor(s * 8) % 4) + 1);
      }
      if (s >= CINEMA_END) return finish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      stop();
    };
    // 한 번만 재생한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- 카메라 (1쪽) ----
  let z = lerp(1.32, 1.16, eio(seg(t, 0, 1.0))), cx = 360, cy = lerp(690, 610, eio(seg(t, 0, 1.0)));
  const pz = eo(seg(t, 1.12, 1.32)) * (1 - eio(seg(t, 1.72, 2.05)));
  z = lerp(z, 1.75, pz); cx = lerp(cx, 520, pz); cy = lerp(cy, 470, pz);
  cy -= Math.sin(clamp((t - 2.0) / 0.85) * Math.PI) * 60;
  let shx = 0, shy = 0;
  const shake = (a: number, b: number, amp: number) => {
    if (t > a && t < b) { const k = 1 - seg(t, a, b); shx += Math.sin(t * 97) * amp * k; shy += Math.cos(t * 83) * amp * k; }
  };
  shake(1.12, 1.45, 5); shake(2.04, 2.4, 14); shake(2.84, 3.05, 6);
  for (const b of bills) shake(PAGE2 + b.at, PAGE2 + b.at + 0.35, 16);
  const cam = (zz: number, x: number, y: number) => ({ transform: `translate(${360 - x * zz + shx}px,${640 - y * zz + shy}px) scale(${zz})` });
  // ---- 카메라 (2쪽): 끝에 햄스터와 잔액 쪽으로 천천히 다가간다 ----
  const u = t - PAGE2;
  const endZ = eio(seg(u, 5.0, 6.0));
  const cam2 = cam(lerp(1.1, 1.16, endZ), 360, lerp(640, 720, endZ));
  const flip = eio(seg(t, PAGE_FLIP, PAGE2));

  return (
    <div className="pcine" role="dialog" aria-modal="true" aria-label="월급날">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
        <filter id="pc-wob"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves={2} seed={boil} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="7" /></filter>
        <filter id="pc-wob2"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves={1} seed={boil} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale="3" /></filter>
        <filter id="pc-crayon"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves={1} seed={2} result="t" /><feColorMatrix in="t" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.6 1.15" result="m" /><feComposite in="SourceGraphic" in2="m" operator="in" /></filter>
      </svg>
      <div className="pc-stage" style={{ transform: `translate(-50%,-50%) scale(${fit})` }} aria-hidden>
        {u > -0.6 && (
          <div className="pc-cam" style={cam2}>
            <div className="pc-page" />
            <Page2 u={Math.max(0, u)} custom={custom} total={total} bills={bills} date={date} />
          </div>
        )}
        {flip < 1 && (
          <div className="pc-flip" style={{ transform: `perspective(1600px) rotateY(${-flip * 100}deg)` }}>
            <div className="pc-cam" style={cam(z, cx, cy)}>
              <div className="pc-page" />
              <Page1 t={Math.min(t, PAGE_FLIP)} custom={custom} total={total} date={date} />
            </div>
            <div className="pc-shade" style={{ opacity: flip }} />
          </div>
        )}
        <div className="pc-vig" />
      </div>
      <button type="button" className="pc-skip" onClick={finish}>
        건너뛰기 ›
      </button>
      <p className="sr-only">오늘은 월급날! {won(total)}원이 들어왔어요.</p>
    </div>
  );
}
