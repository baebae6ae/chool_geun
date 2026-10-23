/**
 * 드래곤 변신: 화가 쌓이면 캐릭터가 정통 판타지 드래곤으로 변해 회사를 부순다… 고 상상한다.
 * 1) 열받는 메시지 → 분노 게이지 999% → 변신 주문 → 화면이 쩍 갈라짐
 * 2) 판타지 일러스트로 그림체 전환 (영화 같은 검은 띠): 타이틀 → 등장 포효와 칭호 → 본사 체력바를 깎는 랜덤 부수기 3장면 → 본사 처치
 * 3) 하얗게 번쩍 → 다시 귀여운 사무실, 랜덤 엔딩 5종 중 하나로 상상이었음을 보여 준다
 * 화면을 누르면 다음 장면으로.
 */
import { useEffect, useRef, useState } from 'react';
import { HamsterSprite, type Pose } from '../hamster/HamsterSprite';
import { Backdrop } from '../theater/Backdrops';
import { castSpecies } from '../../domain/theater';
import { DEFAULT_CUSTOM } from '../../domain/customization';
import { planDragon, type Attack, type DragonPlan, type EndingId, type Fx, type RageLine } from '../../domain/dragon';
import type { Customization, HamsterColor } from '../../domain/types';
import { useBackHandler } from '../../backStack';
import { buzz } from '../../haptics';
import './dragon.css';

/** 변신 장면 그림 (앱 안 public/dragon) */
const BASE: string = import.meta.env.BASE_URL ?? './';
const face = `${BASE}dragon/face.webp`;
const rise = `${BASE}dragon/rise.webp`;
const fire = `${BASE}dragon/fire.webp`;

interface Shot {
  img: string;
  ms: number;
  /** 카메라: 시작 → 끝 (transform) */
  from: string;
  to: string;
  /** 쾅 하는 순간(ms): 번쩍 + 흔들림 + 진동 */
  hit?: number;
  fx: Fx[];
  sfx?: string;
  caption?: string;
  /** 효과가 터지는 곳 (화면 %) */
  at?: [number, number];
  /** 본사 체력: 시작 → 맞은 뒤 (0~1). 없으면 체력바를 안 그린다 */
  hp?: [number, number];
  damage?: string;
  combo?: number;
  /** 타이틀 · 시스템 메시지 */
  title?: boolean;
  system?: string[];
  /** frame: 정사각형 그림을 가운데 두고 뒤에 흐리게 깐다 */
  fit?: 'cover' | 'frame';
}

/** 데이터로 받은 부수기 장면 → 화면 연출 */
const attackShot = (a: Attack, k: number, n: number): Shot => ({
  img: a.src ?? `${BASE}${a.img}`,
  ms: 2600,
  from: a.cam[0],
  to: a.cam[1],
  hit: a.hit,
  fx: a.fx,
  at: a.at,
  fit: a.fit,
  sfx: a.sfx,
  caption: a.caption,
  damage: a.damage,
  combo: k + 1,
  hp: [1 - k / n, 1 - (k + 1) / n],
});

type Beat =
  | { kind: 'trigger' | 'rage' | 'shatter' | 'white' | 'dream' | 'ending'; ms: number }
  | { kind: 'shot'; shot: Shot }
  | { kind: 'victory'; ms: number; img: string; fit?: 'cover' | 'frame' }
  | { kind: 'end' };

function beatsOf(p: DragonPlan): Beat[] {
  const n = p.attacks.length;
  return [
    { kind: 'trigger', ms: 2800 },
    { kind: 'rage', ms: 3400 },
    { kind: 'shatter', ms: 650 },
    { kind: 'shot', shot: { img: face, ms: 2600, from: 'scale(1.05)', to: 'scale(1.3) translate(4%, 6%)', fx: ['flare', 'embers'], at: [42, 34], title: true } },
    {
      kind: 'shot',
      shot: { img: rise, ms: 3000, from: 'scale(1.3) translate(0, 8%)', to: 'scale(1.08)', hit: 400, fx: ['rings', 'embers'], sfx: '크와아아앙!!!', at: [55, 32], hp: [1, 1], system: ['[칭호 획득] 사무실의 재앙', '직급 변경: 대리 → 고대 흑룡'] },
    },
    ...p.attacks.map((a, k) => ({ kind: 'shot' as const, shot: attackShot(a, k, n) })),
    { kind: 'victory', ms: 2800, img: p.attacks[n - 1].src ?? `${BASE}${p.attacks[n - 1].img}`, fit: p.attacks[n - 1].fit },
    { kind: 'white', ms: 900 },
    { kind: 'dream', ms: 1900 },
    { kind: 'ending', ms: p.ending === 'loop' ? 2600 : 3400 },
    { kind: 'end' },
  ];
}

const msOf = (b: Beat) => (b.kind === 'shot' ? b.shot.ms : b.kind === 'end' ? 0 : b.ms);
const FANTASY = new Set(['shot', 'victory']);

export function Dragon({ me, reality, seed, onClose }: { me: Customization; reality: string; seed?: string; onClose: () => void }) {
  const [run, setRun] = useState(0);
  const [plan, setPlan] = useState(() => planDragon(seed ?? `${Date.now()}`));
  const [beats, setBeats] = useState(() => beatsOf(plan));
  const [i, setI] = useState(0);
  useBackHandler(true, onClose);
  const beat = beats[i];

  // 장면이 끝나면 다음 장면으로
  useEffect(() => {
    const ms = msOf(beat);
    if (!ms) return;
    const id = setTimeout(() => setI((n) => Math.min(n + 1, beats.length - 1)), ms);
    return () => clearTimeout(id);
  }, [beat, beats.length]);

  const next = () => beat.kind !== 'end' && setI((n) => Math.min(n + 1, beats.length - 1));
  const again = () => {
    const p = planDragon(`${Date.now()}:${run}`);
    setPlan(p);
    setBeats(beatsOf(p));
    setRun((n) => n + 1);
    setI(0);
  };
  const k = `${run}-${i}`;
  const loop = plan.ending === 'loop';

  return (
    <div className="dragon" role="dialog" aria-modal="true" aria-label="드래곤 변신">
      <div className="dr-screen" onClick={next}>
        {beat.kind === 'trigger' && <Trigger key={k} me={me} line={plan.rage} />}
        {beat.kind === 'rage' && <Rage key={k} me={me} spell={plan.spell} />}
        {beat.kind === 'shatter' && <Shatter key={k} me={me} />}
        {beat.kind === 'shot' && <ShotView key={k} shot={beat.shot} />}
        {beat.kind === 'victory' && <Victory key={k} img={beat.img} fit={beat.fit} />}
        {beat.kind === 'white' && <div key={k} className="dr-white" />}
        {beat.kind === 'dream' && <Dream key={k} me={me} />}
        {beat.kind === 'ending' && <Ending key={k} me={me} id={plan.ending} reality={reality} />}
        {beat.kind === 'end' && (
          <div className={`dr-end ${loop ? 'loop' : ''}`}>
            <p className="dr-end-title">{loop ? '…2차 변신 각' : '…상상이었다'}</p>
            <p className="dr-end-sub">{loop ? '스트레스 +100% (재미용)' : '스트레스 -100% (재미용)'}</p>
            <button type="button" className="btn primary" onClick={again}>
              {loop ? '🐉 2차 변신' : '🐉 한 번 더 변신'}
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              현실로 돌아가기
            </button>
          </div>
        )}
        {FANTASY.has(beat.kind) && (
          <>
            <i className="dr-bar top" aria-hidden />
            <i className="dr-bar bottom" aria-hidden />
          </>
        )}
      </div>
      {beat.kind !== 'end' && (
        <button type="button" className="dr-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      )}
    </div>
  );
}

/* ============================ 귀여운 세계 ============================ */

function Office({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`dr-office ${className}`}>
      <div className="dr-set">
        <Backdrop bg="office" props={{}} />
        {children}
      </div>
    </div>
  );
}

function Actor({ custom, pose, x, className = '' }: { custom: Customization; pose: Pose; x: number; className?: string }) {
  return (
    <div className={`dr-actor ${className}`} style={{ left: `${x}%` }}>
      <HamsterSprite custom={custom} pose={pose} />
    </div>
  );
}

/** 폰 알림처럼 날아드는 메시지 */
function Noti({ line, delay = 0.2 }: { line: RageLine; delay?: number }) {
  return (
    <div className="dr-noti" style={{ animationDelay: `${delay}s` }}>
      <small>
        💬 {line.from} · {line.time}
      </small>
      <b>{line.text}</b>
    </div>
  );
}

/** 열받는 메시지가 도착한다 */
function Trigger({ me, line }: { me: Customization; line: RageLine }) {
  const [mad, setMad] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => {
      setMad(true);
      buzz(40);
    }, 1500);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="dr-trigger">
      <Office>
        <Actor custom={me} pose={{ pose: 'front', action: mad ? 'rotten' : 'type' }} x={50} className={mad ? 'dr-twitch' : ''} />
        {mad && <span className="dr-anger" aria-hidden>💢</span>}
      </Office>
      <Noti line={line} />
    </div>
  );
}

/** 분노 게이지 999% → 변신 주문 → 금이 쩍쩍 */
function Rage({ me, spell }: { me: Customization; spell: string }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    buzz([20, 40, 20, 40, 60]);
    const start = performance.now();
    const id = setInterval(() => {
      const t = performance.now() - start;
      // 1.1초 동안 100%까지, 그다음 0.6초 만에 999%까지 촤라락
      setPct(t < 1100 ? Math.round((t / 1100) * 100) : Math.min(999, Math.round(100 + ((t - 1100) / 600) * 899)));
    }, 50);
    return () => clearInterval(id);
  }, []);
  const over = pct > 100;
  return (
    <div className="dr-rage">
      <Office>
        <Actor custom={me} pose={{ pose: 'front', action: 'quake' }} x={50} className="dr-boil" />
      </Office>
      <div className="dr-red" />
      <div className={`dr-gauge ${over ? 'over' : ''}`}>
        <span>분노 게이지</span>
        <div className="dr-gauge-bar">
          <i style={{ width: `${Math.min(100, pct)}%` }} />
        </div>
        <b>{pct}%</b>
      </div>
      <svg className="dr-cracks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path d="M50 46 L38 30 L30 34 L18 12 M38 30 L42 8 M50 46 L66 34 L74 40 L90 18 M66 34 L64 6 M50 46 L58 62 L76 70 L96 64 M58 62 L54 92 M50 46 L34 58 L20 56 L4 72 M34 58 L30 90" />
      </svg>
      <p className="dr-spell">{spell}</p>
    </div>
  );
}

/** 화면이 조각나 날아가며 판타지 세계가 드러난다 */
const SHARDS: [string, number, number, number][] = [
  ['50% 46%, 18% 12%, 42% 0, 64% 6%', -40, -60, -30],
  ['50% 46%, 64% 6%, 100% 0, 90% 18%', 50, -70, 40],
  ['50% 46%, 90% 18%, 100% 64%', 80, -10, 60],
  ['50% 46%, 100% 64%, 100% 100%, 54% 100%', 60, 70, -40],
  ['50% 46%, 54% 100%, 30% 100%', -10, 90, 30],
  ['50% 46%, 30% 100%, 0 100%, 4% 72%', -70, 70, -50],
  ['50% 46%, 4% 72%, 0 30%', -90, 10, 40],
  ['50% 46%, 0 30%, 0 0, 18% 12%', -60, -60, -60],
];
function Shatter({ me }: { me: Customization }) {
  useEffect(() => buzz([60, 30, 90]), []);
  return (
    <div className="dr-shatter">
      <img className="dr-img under" src={face} alt="" />
      {SHARDS.map(([poly, dx, dy, r], n) => (
        <div key={n} className="dr-shard" style={{ clipPath: `polygon(${poly})`, '--dx': `${dx}vw`, '--dy': `${dy}vh`, '--r': `${r}deg` } as React.CSSProperties}>
          <Office>
            <Actor custom={me} pose={{ pose: 'front', action: 'quake' }} x={50} />
          </Office>
        </div>
      ))}
      <div className="dr-flash" />
    </div>
  );
}

/** 하얀 빛이 걷히면 멍한 내 캐릭터. 머리 위 생각 풍선 속엔 방금 그 드래곤 */
function Dream({ me }: { me: Customization }) {
  return (
    <div className="dr-dream">
      <Office>
        <Actor custom={me} pose={{ pose: 'front', action: 'soul' }} x={50} />
        <div className="dr-bubble">
          <img src={fire} alt="" />
          <i className="dot a" />
          <i className="dot b" />
        </div>
      </Office>
      <p className="dr-cute-text c">(…멍)</p>
    </div>
  );
}

const BOSS_COLOR: Record<string, HamsterColor> = { cat: 'cream', hamster: 'golden', bird: 'white', rabbit: 'gray' };

/** 현실 복귀 엔딩 5종 */
function Ending({ me, id, reality }: { me: Customization; id: EndingId; reality: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const ts = [setTimeout(() => setStep(1), 700), setTimeout(() => setStep(2), 1600)];
    return () => ts.forEach(clearTimeout);
  }, []);
  if (id === 'boss') {
    const sp = castSpecies(me.species).boss;
    const boss: Customization = { ...DEFAULT_CUSTOM, species: sp, color: BOSS_COLOR[sp] ?? 'gray', outfit: 'tie', glasses: true };
    return (
      <Office>
        <Actor custom={me} pose={{ pose: 'front', action: step >= 2 ? 'shock' : 'soul' }} x={34} />
        <Actor custom={boss} pose={step ? { pose: 'front', action: 'look' } : { pose: 'side', action: 'walk' }} x={step ? 70 : 96} className="dr-boss-walk" />
        {step >= 1 && <div className="dr-say boss">김대리 뭐 해?</div>}
        {step >= 2 && <div className="dr-say me">넵! 아무것도요…</div>}
      </Office>
    );
  }
  if (id === 'keyboard') {
    return (
      <Office>
        <div className="dr-monitor">
          <div className="dr-monitor-screen">
            <small>보고서_최종.docx</small>
            <p className="dr-typed">ㅂㅂㅂㅂ부ㅅㅅ셔ㅕㅕ쾅ㅋ앙ㅇ</p>
          </div>
        </div>
        <Actor custom={me} pose={{ pose: 'front', action: step >= 2 ? 'shock' : 'typeFast' }} x={50} />
        {step >= 2 && <p className="dr-note">(상상 속 발톱질을 키보드로 하고 있었다)</p>}
      </Office>
    );
  }
  if (id === 'cup') {
    return (
      <Office>
        <Actor custom={me} pose={{ pose: 'front', action: step >= 2 ? 'shock' : 'soul' }} x={42} />
        <svg className={`dr-cup ${step >= 1 ? 'on' : ''}`} viewBox="0 0 60 60" aria-hidden>
          <path d="M14 22 L22 18 L30 24 L40 17 L47 23 L42 48 Q30 52 18 48Z" fill="#fff" stroke="#2d2018" strokeWidth="2.4" strokeLinejoin="round" />
          <path d="M20 30 L28 34 L36 29 L44 33" fill="none" stroke="#c9a27a" strokeWidth="2" />
          <path d="M18 48 Q24 56 34 54 Q44 56 48 50 Q40 46 30 50 Q24 47 18 48Z" fill="#7a4a2e" />
          <circle cx="50" cy="44" r="2.4" fill="#7a4a2e" />
          <circle cx="10" cy="40" r="1.8" fill="#7a4a2e" />
        </svg>
        {step >= 2 && <p className="dr-note">…작은 파괴는 진짜였다</p>}
      </Office>
    );
  }
  if (id === 'loop') {
    return (
      <div className="dr-loop">
        <Office>
          <Actor custom={me} pose={{ pose: 'front', action: step >= 1 ? 'quake' : 'soul' }} x={50} className={step >= 1 ? 'dr-boil' : ''} />
        </Office>
        {step >= 1 && <div className="dr-red" />}
        <Noti line={{ from: '팀장님', time: '방금', text: '아 그리고 하나만 더~ ㅎㅎ' }} delay={0.1} />
      </div>
    );
  }
  return (
    <div className="dr-fact">
      <p className="dr-fact-label">현실:</p>
      <p className="dr-fact-text">{reality}</p>
      <div className="dr-fact-me">
        <HamsterSprite custom={me} pose={{ pose: 'front', action: 'soul' }} />
      </div>
    </div>
  );
}

/* ============================ 판타지 세계 ============================ */

function HpBar({ hp, hit }: { hp: [number, number]; hit: boolean }) {
  const v = hit ? hp[1] : hp[0];
  return (
    <div className={`dr-hp ${v <= 0 ? 'dead' : ''}`}>
      <span>⚜ 주식회사 본사 ⚜</span>
      <div className="dr-hp-bar">
        <i className="lag" style={{ width: `${hp[0] * 100}%` }} />
        <i style={{ width: `${v * 100}%` }} />
      </div>
    </div>
  );
}

function ShotView({ shot }: { shot: Shot }) {
  const cam = useRef<HTMLDivElement>(null);
  const [hit, setHit] = useState(false);
  const [sys, setSys] = useState(0);
  useEffect(() => {
    cam.current?.animate([{ transform: shot.from }, { transform: shot.to }], { duration: shot.ms, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' });
    const ts: ReturnType<typeof setTimeout>[] = [];
    if (shot.hit !== undefined) {
      ts.push(
        setTimeout(() => {
          setHit(true);
          buzz([80, 40, 120]);
        }, shot.hit),
      );
    }
    shot.system?.forEach((_, n) => ts.push(setTimeout(() => setSys(n + 1), 1000 + n * 700)));
    return () => ts.forEach(clearTimeout);
  }, [shot]);
  const [x, y] = shot.at ?? [50, 50];
  return (
    <div className={`dr-shot ${hit ? 'hit' : ''} ${shot.fit === 'frame' ? 'framed' : ''}`} style={{ '--x': `${x}%`, '--y': `${y}%` } as React.CSSProperties}>
      {shot.fit === 'frame' && <img className="dr-img dr-backfill" src={shot.img} alt="" />}
      <div className="dr-cam" ref={cam}>
        <img className="dr-img" src={shot.img} alt="" />
      </div>
      <div className="dr-vignette" />
      {shot.fx.includes('flare') && <div className="dr-flare" />}
      {shot.fx.includes('embers') && <Embers />}
      {shot.fx.includes('fire') && <FireStream />}
      {hit && shot.fx.includes('rings') && <Rings />}
      {hit && shot.fx.includes('debris') && <Debris />}
      {hit && shot.fx.includes('glass') && <Glass />}
      {(shot.fx.includes('lines') || hit) && <Lines />}
      {hit && <div className="dr-hitflash" />}
      {shot.hp && <HpBar hp={shot.hp} hit={hit} />}
      {shot.title && (
        <div className="dr-title">
          <b>제3사업부의 흑룡</b>
          <small>THE BLACK DRAGON OF DEPT. 3</small>
        </div>
      )}
      {shot.sfx && <p className={`dr-sfx ${hit || shot.hit === undefined ? 'on' : ''}`}>{shot.sfx}</p>}
      {hit && shot.damage && <p className="dr-damage">{shot.damage}</p>}
      {hit && shot.combo && shot.combo > 1 && <p className="dr-combo">{shot.combo} HIT COMBO!</p>}
      {!!shot.system && (
        <div className="dr-systems">
          {shot.system.slice(0, sys).map((m) => (
            <p key={m} className="dr-system">
              {m}
            </p>
          ))}
        </div>
      )}
      {shot.caption && <p className="dr-caption">{shot.caption}</p>}
    </div>
  );
}

/** 본사 처치! */
function Victory({ img, fit }: { img: string; fit?: 'cover' | 'frame' }) {
  useEffect(() => buzz([40, 30, 40, 30, 120]), []);
  return (
    <div className={`dr-shot dr-victory ${fit === 'frame' ? 'framed' : ''}`}>
      {fit === 'frame' && <img className="dr-img dr-backfill" src={img} alt="" />}
      <div className="dr-cam">
        <img className="dr-img" src={img} alt="" />
      </div>
      <div className="dr-vignette" />
      <Embers />
      <HpBar hp={[0, 0]} hit />
      <div className="dr-win">
        <b>본사 처치!</b>
        <p>획득: 퇴근권 ×1 · 연차 ×∞</p>
      </div>
    </div>
  );
}

const R = (k: number, n: number) => (((k * 9301 + 49297) % 233280) / 233280) * n;

function Embers() {
  return (
    <div className="dr-embers" aria-hidden>
      {Array.from({ length: 26 }, (_, k) => (
        <i key={k} style={{ left: `${R(k, 100)}%`, animationDelay: `${R(k + 7, 1.6)}s`, animationDuration: `${1.4 + R(k + 3, 1.4)}s`, '--s': `${0.5 + R(k + 5, 1)}` } as React.CSSProperties} />
      ))}
    </div>
  );
}

function FireStream() {
  return (
    <div className="dr-fire" aria-hidden>
      {Array.from({ length: 22 }, (_, k) => (
        <i key={k} style={{ animationDelay: `${(k % 11) * 0.07}s`, '--j': `${R(k, 30) - 15}px`, '--s': `${0.7 + R(k + 2, 0.9)}` } as React.CSSProperties} />
      ))}
    </div>
  );
}

function Debris() {
  return (
    <div className="dr-debris" aria-hidden>
      {Array.from({ length: 24 }, (_, k) => {
        const a = (k / 24) * Math.PI * 2 + R(k, 0.4);
        const d = 30 + R(k + 1, 45);
        return <i key={k} style={{ '--dx': `${Math.cos(a) * d}vw`, '--dy': `${Math.sin(a) * d - 10}vh`, '--r': `${R(k + 4, 720) - 360}deg`, '--s': `${0.5 + R(k + 6, 1.2)}` } as React.CSSProperties} />;
      })}
    </div>
  );
}

function Glass() {
  return (
    <div className="dr-glass" aria-hidden>
      {Array.from({ length: 20 }, (_, k) => {
        const a = (k / 20) * Math.PI * 2;
        const d = 40 + R(k + 2, 40);
        return <i key={k} style={{ '--dx': `${Math.cos(a) * d}vw`, '--dy': `${Math.sin(a) * d}vh`, '--r': `${R(k, 540)}deg` } as React.CSSProperties} />;
      })}
    </div>
  );
}

function Rings() {
  return (
    <div className="dr-rings" aria-hidden>
      <i />
      <i />
      <i />
    </div>
  );
}

const LINES = Array.from({ length: 40 }, (_, k) => {
  const a = (k / 40) * Math.PI * 2;
  const w = 0.01 + (k % 4) * 0.006;
  const p = (r: number, da: number) => `${50 + Math.cos(a + da) * r} ${50 + Math.sin(a + da) * r * 1.5}`;
  return `M${p(95, -w)} L${p(36 + (k % 5) * 3, 0)} L${p(95, w)}Z`;
}).join(' ');
function Lines() {
  return (
    <svg className="dr-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <path d={LINES} />
    </svg>
  );
}
