/**
 * 썰 극장 무대: 대본(Beat 목록)을 시간에 맞춰 연기한다.
 * 기법: 레터박스·타이틀 카드·카메라(푸시 인/크래시 줌/기울기/흔들림)·임팩트 프레임·히트 스톱·
 * 프리즈 프레임·타임랩스·집중선·속도선·스포트라이트·잔상·스쿼시&스트레치·만화 기호·효과음 글자·아이리스 아웃.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { HamsterSprite, type FrontAction, type Pose } from '../hamster/HamsterSprite';
import { coworkerSpecies, timeline, type Beat, type Fx, type Mark, type Story } from '../../domain/theater';
import { DEFAULT_CUSTOM } from '../../domain/customization';
import type { Customization } from '../../domain/types';
import { useBackHandler } from '../../backStack';
import { buzz } from '../../haptics';
import './theater.css';

interface Actor {
  id: string;
  label: string;
  x: number;
  facing: 1 | -1;
  hidden: boolean;
  pose: Pose;
  mark: Mark;
  moveMs: number;
  run: boolean;
  anim: { kind: 'hop' | 'slump'; key: number } | null;
  say: { text: string; key: number } | null;
  custom: Customization;
}

interface Scene {
  actors: Actor[];
  cam: { zoom: number; x: number; y: number; tilt: number; ms: number; ease: 'crash' | 'smooth' | 'push' };
  fx: Partial<Record<Fx, { x: number; y: number }>>;
  sfx: { id: number; text: string; x: number; y: number; color: string; size: number; tilt: number }[];
  caption: { text: string; key: number } | null;
  title: { text: string; sub?: string } | null;
  freeze: { text: string; key: number } | null;
  timelapse: { text: string; key: number } | null;
  sky: 'day' | 'evening' | 'night';
  clockSpin: boolean;
  clockAdvance: number;
  door: string;
  monitor: string;
  impact: { key: number; x: number; y: number } | null;
  shake: { key: number; power: number; ms: number } | null;
  paused: boolean;
  iris: { x: number; y: number; ms: number } | null;
  ended: boolean;
}

const EASE = {
  crash: 'cubic-bezier(.15,.9,.25,1)',
  smooth: 'cubic-bezier(.45,0,.2,1)',
  push: 'cubic-bezier(.4,0,.6,1)',
};

function initial(story: Story, me: Customization): Scene {
  const co = coworkerSpecies(me.species);
  return {
    actors: story.cast.map((c) => ({
      id: c.id,
      label: c.label,
      x: c.x,
      facing: c.facing ?? 1,
      hidden: !!c.hidden,
      pose: { pose: 'front', action: c.action ?? 'idle' },
      mark: null,
      moveMs: 0,
      run: false,
      anim: null,
      say: null,
      custom:
        c.as === 'me'
          ? me
          : { ...DEFAULT_CUSTOM, species: co, color: co === 'cat' ? 'cream' : 'gray', outfit: c.outfit ?? 'tie', hat: c.hat ?? 'none', hand: 'none', glasses: true },
    })),
    cam: { zoom: 1, x: 50, y: 50, tilt: 0, ms: 0, ease: 'smooth' },
    fx: {},
    sfx: [],
    caption: null,
    title: null,
    freeze: null,
    timelapse: null,
    sky: story.sky ?? 'day',
    clockSpin: false,
    clockAdvance: 0,
    door: 'closed',
    monitor: 'on',
    impact: null,
    shake: null,
    paused: false,
    iris: null,
    ended: false,
  };
}

/** 글자가 한 자씩 찍히는 자막 */
function Typewriter({ text, speed = 45 }: { text: string; speed?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => setN((v) => (v >= text.length ? v : v + 1)), speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <span>
      {text.slice(0, n)}
      <span className="tw-ghost">{text.slice(n)}</span>
    </span>
  );
}

export function Theater({ story, me, onClose }: { story: Story; me: Customization; onClose: () => void }) {
  const [scene, setScene] = useState<Scene>(() => initial(story, me));
  const [run, setRun] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useBackHandler(true, onClose);

  const later = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
  const actor = (id: string, patch: Partial<Actor> | ((a: Actor) => Partial<Actor>)) =>
    setScene((s) => ({ ...s, actors: s.actors.map((a) => (a.id === id ? { ...a, ...(typeof patch === 'function' ? patch(a) : patch) } : a)) }));

  const play = useCallback(
    (b: Beat) => {
      const ms = 'ms' in b && typeof b.ms === 'number' ? b.ms : 0;
      switch (b.do) {
        case 'title':
          setScene((s) => ({ ...s, title: { text: b.text, sub: b.sub } }));
          later(ms - 350, () => setScene((s) => ({ ...s, title: null })));
          break;
        case 'caption': {
          const key = Date.now();
          setScene((s) => ({ ...s, caption: b.text ? { text: b.text, key } : null }));
          // 다음 자막이 없으면 잠시 뒤 스르르 사라진다
          if (b.text && ms) later(ms + 1800, () => setScene((s) => (s.caption?.key === key ? { ...s, caption: null } : s)));
          break;
        }
        case 'say':
          actor(b.who, { say: b.text ? { text: b.text, key: Date.now() } : null });
          break;
        case 'act':
          actor(b.who, { pose: { pose: 'front', action: b.action } });
          break;
        case 'move':
          actor(b.who, (a) => ({
            hidden: false,
            x: b.to,
            moveMs: ms,
            run: !!b.run,
            facing: b.to >= a.x ? 1 : -1,
            pose: { pose: 'side', action: b.run ? 'run' : 'walk' },
          }));
          later(ms, () => actor(b.who, { pose: { pose: 'front', action: (b.then ?? 'idle') as FrontAction }, run: false, moveMs: 0 }));
          break;
        case 'hop':
        case 'slump':
          actor(b.who, { anim: { kind: b.do, key: Date.now() } });
          break;
        case 'mark':
          actor(b.who, { mark: b.mark });
          if (b.mark === 'stone' || b.mark === 'exclaim') buzz([40, 30, 60]);
          break;
        case 'cam':
          setScene((s) => ({ ...s, cam: { zoom: b.zoom, x: b.x ?? 50, y: b.y ?? 50, tilt: b.tilt ?? s.cam.tilt, ms, ease: b.ease ?? 'smooth' } }));
          break;
        case 'shake':
          setScene((s) => ({ ...s, shake: { key: Date.now(), power: b.power ?? 2, ms: ms || 400 } }));
          buzz(b.power === 3 ? [60, 30, 80] : 30);
          break;
        case 'fx':
          setScene((s) => {
            const fx = { ...s.fx };
            if (b.on) fx[b.fx] = { x: b.x ?? 50, y: b.y ?? 50 };
            else delete fx[b.fx];
            return { ...s, fx };
          });
          break;
        case 'sfx': {
          const id = Date.now() + Math.random();
          setScene((s) => ({ ...s, sfx: [...s.sfx, { id, text: b.text, x: b.x, y: b.y, color: b.color ?? '#e8504b', size: b.size ?? 1, tilt: b.tilt ?? -6 }] }));
          later(ms || 1200, () => setScene((s) => ({ ...s, sfx: s.sfx.filter((x) => x.id !== id) })));
          break;
        }
        case 'impact':
          setScene((s) => ({ ...s, impact: { key: Date.now(), x: b.x, y: b.y } }));
          buzz([80]);
          break;
        case 'hitstop':
          setScene((s) => ({ ...s, paused: true }));
          later(ms, () => setScene((s) => ({ ...s, paused: false })));
          break;
        case 'freeze':
          setScene((s) => ({ ...s, freeze: { text: b.text, key: Date.now() }, paused: true }));
          later(ms, () => setScene((s) => ({ ...s, freeze: null, paused: false })));
          break;
        case 'timelapse':
          setScene((s) => ({ ...s, timelapse: { text: b.text, key: Date.now() }, clockSpin: true, sky: b.sky ?? s.sky }));
          later(ms, () => setScene((s) => ({ ...s, timelapse: null, clockSpin: false, clockAdvance: s.clockAdvance + 1 })));
          break;
        case 'prop':
          setScene((s) => ({ ...s, [b.prop]: b.state }));
          break;
        case 'iris':
          setScene((s) => ({ ...s, iris: { x: b.x, y: b.y, ms } }));
          later(ms + 200, () => setScene((s) => ({ ...s, ended: true })));
          break;
        case 'wait':
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    setScene(initial(story, me));
    const { at } = timeline(story.beats);
    // 레터박스가 내려온 뒤 시작
    story.beats.forEach((b, i) => later(at[i] + 500, () => play(b)));
    const list = timers.current;
    return () => {
      list.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story, run]);

  // 카메라 흔들림: 무대를 다시 그리지 않고 Web Animations로 흔든다 (진행 중인 이동이 끊기지 않게)
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = stageRef.current;
    if (!scene.shake || !el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const p = [0, 2, 5, 9][scene.shake.power];
    const frames = [0, 1, 2, 3, 4, 5, 6].map((i) => {
      const k = 1 - i / 7;
      const dx = (i % 2 ? 1 : -1) * p * k;
      const dy = (i % 3 === 0 ? 1 : -1) * p * 0.6 * k;
      return { transform: `translate(${dx}px, ${dy}px) rotate(${(i % 2 ? 0.8 : -0.8) * (p / 9) * k}deg)` };
    });
    el.animate([...frames, { transform: 'none' }], { duration: scene.shake.ms, easing: 'linear' });
  }, [scene.shake]);

  const { cam } = scene;
  const camStyle: React.CSSProperties = {
    transformOrigin: `${cam.x}% ${cam.y}%`,
    transform: `translate(${(50 - cam.x) * (cam.zoom > 1 ? 1 : 0)}%, ${(50 - cam.y) * (cam.zoom > 1 ? 0.6 : 0)}%) scale(${cam.zoom}) rotate(${cam.tilt}deg)`,
    transition: `transform ${cam.ms}ms ${EASE[cam.ease]}`,
  };
  const [hh, mm] = story.clock.split(':').map(Number);
  const minutes = hh * 60 + mm + scene.clockAdvance * 167;

  return (
    <div className="theater" role="dialog" aria-modal="true" aria-label={`썰 극장: ${story.title}`}>
      <div className="theater-frame">
        <div
          ref={stageRef}
          className={`stage ${scene.paused ? 'paused' : ''} ${scene.freeze ? 'frozen' : ''}`}
          style={{
            ...(scene.iris ? { clipPath: `circle(0% at ${scene.iris.x}% ${scene.iris.y}%)`, transition: `clip-path ${scene.iris.ms}ms cubic-bezier(.6,0,.4,1)` } : { clipPath: 'circle(150% at 50% 50%)' }),
          }}
        >
          <div className="cam" style={camStyle}>
            <Backdrop sky={scene.sky} minutes={minutes} spin={scene.clockSpin} door={scene.door} />
            {scene.actors.map((a) => (
              <ActorView key={a.id} a={a} desk={a.id === 'me' ? scene.monitor : null} />
            ))}
          </div>

          {/* 화면 효과 */}
          {scene.fx.speed && <SpeedLines />}
          {scene.fx.spot && <div className="fx-spot" style={{ '--sx': `${scene.fx.spot.x}%`, '--sy': `${scene.fx.spot.y}%` } as React.CSSProperties} aria-hidden />}
          {scene.fx.focus && <FocusLines x={scene.fx.focus.x} y={scene.fx.focus.y} />}
          {scene.impact && <div key={scene.impact.key} className="fx-impact" style={{ '--ix': `${scene.impact.x}%`, '--iy': `${scene.impact.y}%` } as React.CSSProperties} aria-hidden />}
          {scene.sfx.map((x) => (
            <span
              key={x.id}
              className="sfx"
              style={{ left: `${x.x}%`, top: `${x.y}%`, color: x.color, fontSize: `${2 * x.size}rem`, '--tilt': `${x.tilt}deg` } as React.CSSProperties}
            >
              {x.text}
            </span>
          ))}
          {scene.timelapse && (
            <div key={scene.timelapse.key} className="fx-timelapse">
              <b>{scene.timelapse.text}</b>
            </div>
          )}
          {scene.freeze && (
            <div key={scene.freeze.key} className="fx-freeze">
              <span className="freeze-tag">일시정지</span>
              <p>
                <Typewriter text={scene.freeze.text} speed={55} />
              </p>
            </div>
          )}
        </div>

        <div className="theater-caption" aria-live="polite">
          {scene.caption && <Typewriter key={scene.caption.key} text={scene.caption.text} />}
        </div>
      </div>

      {scene.title && (
        <div className="theater-title">
          <small>{scene.title.sub}</small>
          <h2>
            <Typewriter text={`「${scene.title.text}」`} speed={70} />
          </h2>
        </div>
      )}

      {scene.ended && (
        <div className="theater-end">
          <small>썰 #{story.no}</small>
          <h2>「{story.title}」</h2>
          <p className="muted">제보: {story.credit}님</p>
          <button className="btn primary" onClick={() => setRun((n) => n + 1)}>
            다시 보기
          </button>
          <button className="btn ghost" onClick={onClose}>
            닫기
          </button>
        </div>
      )}

      {!scene.ended && (
        <button className="theater-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      )}
    </div>
  );
}

function ActorView({ a, desk }: { a: Actor; desk: string | null }) {
  const edge = a.x < 24 ? 'edge-l' : a.x > 76 ? 'edge-r' : '';
  const sprite = (
    <div className="actor-flip" style={{ transform: `scaleX(${a.pose.pose === 'side' ? a.facing : 1})` }}>
      <HamsterSprite custom={a.custom} pose={a.pose} />
    </div>
  );
  const move = { left: `${a.x}%`, transition: `left ${a.moveMs}ms cubic-bezier(.45,.05,.35,1)` };
  return (
    <>
      {/* 뛸 때 뒤따라오는 잔상 (전환 시간을 조금씩 늦춰서) */}
      {a.run &&
        [1, 2].map((g) => (
          <div key={g} className="actor ghost" style={{ left: `${a.x}%`, transition: `left ${a.moveMs + g * 90}ms cubic-bezier(.45,.05,.35,1)`, opacity: 0.32 - g * 0.1 }} aria-hidden>
            <div className="actor-body">{sprite}</div>
          </div>
        ))}
      <div className={`actor ${a.hidden ? 'hidden' : ''} ${a.run ? 'running' : ''} mark-${a.mark ?? 'none'}`} style={move}>
        <div key={a.anim?.key} className={`actor-body ${a.anim ? `anim-${a.anim.kind}` : ''}`}>
          {sprite}
          <Manpu mark={a.mark} />
        </div>
        {desk && <Desk monitor={desk} />}
        <span className="actor-label">{a.label}</span>
        {a.say && (
          <div key={a.say.key} className={`bubble ${edge}`}>
            {a.say.text}
          </div>
        )}
      </div>
    </>
  );
}

/** 만화 기호: 땀방울·핏줄·물음표·느낌표·그늘선·반짝이·석화 금 */
function Manpu({ mark }: { mark: Mark }) {
  if (!mark) return null;
  return (
    <svg className={`manpu manpu-${mark}`} viewBox="0 0 120 120" aria-hidden>
      {mark === 'sweat' && <path className="sweat" d="M100 28 C94 38 92 44 96 48 C100 52 106 48 105 42 C104 37 102 33 100 28Z" fill="#9fd8ff" stroke="#3b7fb8" strokeWidth="2" />}
      {mark === 'anger' && (
        <g className="pop" stroke="#e8504b" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M92 14 q6 6 0 12 M108 14 q-6 6 0 12 M90 30 q6 -6 12 0 M90 10 q6 6 12 0" />
        </g>
      )}
      {mark === 'question' && <text className="pop" x="98" y="30" fontSize="30" fontWeight="900" fill="#5a6b8c">?</text>}
      {mark === 'exclaim' && <text className="pop" x="94" y="34" fontSize="38" fontWeight="900" fill="#e8504b" stroke="#fff" strokeWidth="3" paintOrder="stroke">!</text>}
      {mark === 'gloom' && (
        <g className="gloom" stroke="#6f7fb5" strokeWidth="3" strokeLinecap="round" opacity=".75">
          <path d="M30 6 v34 M44 2 v30 M58 6 v26 M72 2 v32 M86 6 v28" />
        </g>
      )}
      {mark === 'sparkle' && (
        <g className="twinkle" fill="#ffd23c" stroke="#a37a00" strokeWidth="1.5">
          <path d="M14 20 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
          <path d="M104 12 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" />
        </g>
      )}
      {mark === 'stone' && (
        <g className="crack" stroke="#3a3a3a" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M52 30 l6 10 -5 8 7 9 -4 10" />
          <path d="M80 60 l-8 6 4 8 -6 6" />
          <path d="M34 70 l8 4 -2 8 6 4" />
        </g>
      )}
    </svg>
  );
}

function Desk({ monitor }: { monitor: string }) {
  return (
    <div className="desk" aria-hidden>
      <svg viewBox="0 0 120 40">
        <rect x="26" y="0" width="54" height="22" rx="3" fill="#cfd6e0" stroke="#5a4636" strokeWidth="2.4" />
        <circle cx="53" cy="11" r="3" fill="#fff" opacity=".8" />
        <rect x="4" y="20" width="112" height="9" rx="3" fill="#dba76d" stroke="#5a4636" strokeWidth="2.4" />
        <rect x="8" y="29" width="104" height="11" fill="#c4854a" stroke="#5a4636" strokeWidth="2.4" />
      </svg>
      {monitor === 'frozen' && (
        <div className="frozen-pop">
          <b>⚠ 응답 없음</b>
          <small>프로그램이 응답하지 않습니다</small>
        </div>
      )}
    </div>
  );
}

/** 속도선: 가로로 휙휙 지나가는 줄 */
function SpeedLines() {
  const lines = Array.from({ length: 16 }, (_, i) => ({ y: 4 + ((i * 37) % 92), w: 20 + ((i * 53) % 45), d: (i * 0.11) % 0.6, t: 0.35 + ((i * 7) % 5) * 0.06 }));
  return (
    <div className="fx-speed" aria-hidden>
      {lines.map((l, i) => (
        <i key={i} style={{ top: `${l.y}%`, width: `${l.w}%`, animationDelay: `${l.d}s`, animationDuration: `${l.t}s` }} />
      ))}
    </div>
  );
}

function FocusLines({ x, y }: { x: number; y: number }) {
  const lines = Array.from({ length: 44 }, (_, i) => {
    const a = (i / 44) * Math.PI * 2 + (i % 3) * 0.03;
    const r1 = 38 + (i % 5) * 4;
    return { a, r1, w: 0.6 + (i % 4) * 0.5 };
  });
  return (
    <svg className="fx-focus" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      {lines.map((l, i) => (
        <line
          key={i}
          x1={x + Math.cos(l.a) * l.r1}
          y1={y + Math.sin(l.a) * l.r1}
          x2={x + Math.cos(l.a) * 90}
          y2={y + Math.sin(l.a) * 90}
          stroke="#1d1a24"
          strokeWidth={l.w}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** 사무실 배경: 벽·창문(하늘)·시계·문·바닥 */
function Backdrop({ sky, minutes, spin, door }: { sky: string; minutes: number; spin: boolean; door: string }) {
  const h = (minutes / 60) % 12;
  const m = minutes % 60;
  return (
    <div className={`backdrop sky-${sky}`} aria-hidden>
      <div className="wall" />
      <div className="window">
        <i />
        <i />
      </div>
      <div className={`clock ${spin ? 'spin' : ''}`}>
        <svg viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" fill="#fffaf0" stroke="#5a4636" strokeWidth="2.6" />
          {Array.from({ length: 12 }, (_, i) => (
            <circle key={i} cx={20 + Math.sin((i / 12) * Math.PI * 2) * 13.5} cy={20 - Math.cos((i / 12) * Math.PI * 2) * 13.5} r="0.9" fill="#5a4636" />
          ))}
          <line className="hand-h" x1="20" y1="20" x2="20" y2="11" stroke="#5a4636" strokeWidth="2.6" strokeLinecap="round" style={{ transform: `rotate(${h * 30}deg)` }} />
          <line className="hand-m" x1="20" y1="20" x2="20" y2="7" stroke="#e8504b" strokeWidth="1.8" strokeLinecap="round" style={{ transform: `rotate(${m * 6}deg)` }} />
          <circle cx="20" cy="20" r="1.6" fill="#5a4636" />
        </svg>
      </div>
      <div className={`door door-${door}`}>
        <div className="door-panel">
          <span className="door-knob" />
        </div>
      </div>
      <svg className="plant" viewBox="0 0 40 50">
        <path d="M20 30 C10 26 6 14 10 6 C18 10 21 20 20 30Z M20 30 C28 24 34 16 32 8 C24 12 20 22 20 30Z" fill="#7fc98f" stroke="#5a4636" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 30 h20 l-3 18 h-14z" fill="#e0895a" stroke="#5a4636" strokeWidth="2.2" strokeLinejoin="round" />
      </svg>
      <div className="floor" />
    </div>
  );
}
