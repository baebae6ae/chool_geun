/**
 * 드래곤 변신: 화가 쌓이면 캐릭터가 정통 판타지 드래곤으로 변해 회사를 부순다… 고 상상한다.
 * 1) 귀여운 사무실에서 부들부들 → 화면이 쩍 갈라짐
 * 2) 판타지 일러스트로 그림체 전환: 눈 번쩍 → 등장 포효 → 랜덤 부수기 3장면
 * 3) 하얗게 번쩍 → 다시 귀여운 사무실, 상상이었다
 * 장면마다 카메라가 움직이고(줌·팬), 불길·잔해·충격파·집중선 효과를 얹는다. 화면을 누르면 다음 장면으로.
 */
import { useEffect, useRef, useState } from 'react';
import { HamsterSprite, type Pose } from '../hamster/HamsterSprite';
import { Backdrop } from '../theater/Backdrops';
import { castSpecies } from '../../domain/theater';
import { DEFAULT_CUSTOM } from '../../domain/customization';
import { pickAttacks, type Attack, type AttackId } from '../../domain/dragon';
import type { Customization, HamsterColor } from '../../domain/types';
import { useBackHandler } from '../../backStack';
import { buzz } from '../../haptics';
import face from '../../assets/dragon/face.webp';
import rise from '../../assets/dragon/rise.webp';
import fire from '../../assets/dragon/fire.webp';
import claw from '../../assets/dragon/claw.webp';
import crush from '../../assets/dragon/crush.webp';
import tail from '../../assets/dragon/tail.webp';
import roar from '../../assets/dragon/roar.webp';
import dive from '../../assets/dragon/dive.webp';
import './dragon.css';

type Fx = 'fire' | 'debris' | 'rings' | 'glass' | 'lines' | 'embers' | 'flare';

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
}

const ATTACK_SHOT: Record<AttackId, Omit<Shot, 'sfx' | 'caption'>> = {
  fire: { img: fire, ms: 2600, from: 'scale(1.25) translate(6%, 4%)', to: 'scale(1.1) translate(-5%, -2%)', hit: 300, fx: ['fire', 'embers', 'lines'], at: [70, 50] },
  claw: { img: claw, ms: 2400, from: 'scale(1.35) translate(0, -8%)', to: 'scale(1.12) translate(0, 2%)', hit: 450, fx: ['debris', 'embers'], at: [45, 78] },
  crush: { img: crush, ms: 2400, from: 'scale(1.1)', to: 'scale(1.45) translate(-2%, -6%)', hit: 600, fx: ['debris', 'embers'], at: [52, 72] },
  tail: { img: tail, ms: 2400, from: 'scale(1.3) translate(-12%, 0)', to: 'scale(1.3) translate(10%, 0)', hit: 500, fx: ['debris', 'lines'], at: [40, 70] },
  roar: { img: roar, ms: 2600, from: 'scale(1.05)', to: 'scale(1.3)', hit: 350, fx: ['rings', 'glass', 'embers'], at: [50, 30] },
  dive: { img: dive, ms: 2400, from: 'scale(1.5) translate(0, 10%)', to: 'scale(1.05) translate(0, -4%)', hit: 900, fx: ['lines', 'debris', 'embers'], at: [50, 80] },
};

const INTRO: Shot[] = [
  { img: face, ms: 1800, from: 'scale(1.05)', to: 'scale(1.3) translate(4%, 6%)', fx: ['flare', 'embers'], at: [42, 34] },
  { img: rise, ms: 2600, from: 'scale(1.3) translate(0, 8%)', to: 'scale(1.08) translate(0, 0)', hit: 400, fx: ['rings', 'embers'], sfx: '크와아아앙!!!', at: [55, 32] },
];

type Beat = { kind: 'rage'; ms: number } | { kind: 'shatter'; ms: number } | { kind: 'shot'; shot: Shot } | { kind: 'white'; ms: number } | { kind: 'dream'; ms: number } | { kind: 'boss'; ms: number } | { kind: 'end' };

function plan(attacks: Attack[]): Beat[] {
  return [
    { kind: 'rage', ms: 2200 },
    { kind: 'shatter', ms: 650 },
    ...INTRO.map((shot) => ({ kind: 'shot' as const, shot })),
    ...attacks.map((a) => ({ kind: 'shot' as const, shot: { ...ATTACK_SHOT[a.id], sfx: a.sfx, caption: a.caption } })),
    { kind: 'white', ms: 900 },
    { kind: 'dream', ms: 2600 },
    { kind: 'boss', ms: 3000 },
    { kind: 'end' },
  ];
}

const msOf = (b: Beat) => (b.kind === 'shot' ? b.shot.ms : b.kind === 'end' ? 0 : b.ms);

export function Dragon({ me, onClose }: { me: Customization; onClose: () => void }) {
  const [run, setRun] = useState(0);
  const [beats, setBeats] = useState(() => plan(pickAttacks(`${Date.now()}`)));
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
    setBeats(plan(pickAttacks(`${Date.now()}:${run}`)));
    setRun((n) => n + 1);
    setI(0);
  };

  return (
    <div className="dragon" role="dialog" aria-modal="true" aria-label="드래곤 변신">
      <div className="dr-screen" onClick={next}>
        {beat.kind === 'rage' && <Rage key={`${run}-${i}`} me={me} />}
        {beat.kind === 'shatter' && <Shatter key={`${run}-${i}`} me={me} />}
        {beat.kind === 'shot' && <ShotView key={`${run}-${i}`} shot={beat.shot} />}
        {beat.kind === 'white' && <div key={`${run}-${i}`} className="dr-white" />}
        {beat.kind === 'dream' && <Dream key={`${run}-${i}`} me={me} />}
        {beat.kind === 'boss' && <Boss key={`${run}-${i}`} me={me} />}
        {beat.kind === 'end' && (
          <div className="dr-end">
            <p className="dr-end-title">…상상이었다</p>
            <p className="dr-end-sub">스트레스 -100% (재미용)</p>
            <button type="button" className="btn primary" onClick={again}>
              🐉 한 번 더 변신
            </button>
            <button type="button" className="btn ghost" onClick={onClose}>
              현실로 돌아가기
            </button>
          </div>
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

function Office({ children }: { children: React.ReactNode }) {
  return (
    <div className="dr-office">
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

/** 부들부들 → 금이 쩍쩍 */
function Rage({ me }: { me: Customization }) {
  useEffect(() => buzz([20, 40, 20, 40, 60]), []);
  return (
    <div className="dr-rage">
      <Office>
        <Actor custom={me} pose={{ pose: 'front', action: 'quake' }} x={50} className="dr-boil" />
      </Office>
      <div className="dr-red" />
      <svg className="dr-cracks" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <path d="M50 46 L38 30 L30 34 L18 12 M38 30 L42 8 M50 46 L66 34 L74 40 L90 18 M66 34 L64 6 M50 46 L58 62 L76 70 L96 64 M58 62 L54 92 M50 46 L34 58 L20 56 L4 72 M34 58 L30 90" />
      </svg>
      <p className="dr-cute-text a">부들부들…</p>
      <p className="dr-cute-text b">더는… 못 참아!!</p>
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
      {SHARDS.map(([poly, dx, dy, r], k) => (
        <div key={k} className="dr-shard" style={{ clipPath: `polygon(${poly})`, '--dx': `${dx}vw`, '--dy': `${dy}vh`, '--r': `${r}deg` } as React.CSSProperties}>
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
function Boss({ me }: { me: Customization }) {
  const sp = castSpecies(me.species).boss;
  const boss: Customization = { ...DEFAULT_CUSTOM, species: sp, color: BOSS_COLOR[sp] ?? 'gray', outfit: 'tie', glasses: true };
  const [step, setStep] = useState(0);
  const t = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    t.current = [setTimeout(() => setStep(1), 700), setTimeout(() => setStep(2), 1500)];
    return () => t.current.forEach(clearTimeout);
  }, []);
  return (
    <div className="dr-boss">
      <Office>
        <Actor custom={me} pose={{ pose: 'front', action: step >= 2 ? 'shock' : 'soul' }} x={36} />
        <Actor custom={boss} pose={step ? { pose: 'front', action: 'look' } : { pose: 'side', action: 'walk' }} x={step ? 70 : 96} className="dr-boss-walk" />
        {step >= 1 && <div className="dr-say boss">김대리 뭐 해?</div>}
        {step >= 2 && <div className="dr-say me">넵! 아무것도요…</div>}
      </Office>
    </div>
  );
}

/* ============================ 판타지 세계 ============================ */

function ShotView({ shot }: { shot: Shot }) {
  const cam = useRef<HTMLDivElement>(null);
  const [hit, setHit] = useState(false);
  useEffect(() => {
    cam.current?.animate([{ transform: shot.from }, { transform: shot.to }], { duration: shot.ms, easing: 'cubic-bezier(.3,.1,.3,1)', fill: 'forwards' });
    if (shot.hit === undefined) return;
    const id = setTimeout(() => {
      setHit(true);
      buzz([80, 40, 120]);
    }, shot.hit);
    return () => clearTimeout(id);
  }, [shot]);
  const [x, y] = shot.at ?? [50, 50];
  return (
    <div className={`dr-shot ${hit ? 'hit' : ''}`} style={{ '--x': `${x}%`, '--y': `${y}%` } as React.CSSProperties}>
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
      {shot.sfx && <p className={`dr-sfx ${hit || shot.hit === undefined ? 'on' : ''}`}>{shot.sfx}</p>}
      {shot.caption && <p className="dr-caption">{shot.caption}</p>}
    </div>
  );
}

const R = (k: number, n: number) => ((k * 9301 + 49297) % 233280) / 233280 * n;

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
