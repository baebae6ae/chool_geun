/**
 * 썰 극장 (세로 숏폼): 컷을 차례로 재생한다.
 * - 화면 위 진행 막대, 오른쪽 탭 = 다음 컷, 왼쪽 탭 = 이전 컷, 꾹 누르면 멈춤
 * - 캐릭터 이동은 1초에 12번만 갱신해서(2프레임 끊어 움직이기) 손그림 애니 느낌을 낸다
 * - 자막·효과는 매끄럽게 움직여서 대비를 준다
 */
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HamsterSprite, type FrontAction, type Pose } from '../hamster/HamsterSprite';
import { castSpecies, type Bg, type Cut, type Ev, type Mark, type Panel, type Place, type Shot, type Story, type TextStyle } from '../../domain/theater';
import { DEFAULT_CUSTOM } from '../../domain/customization';
import type { Customization, HamsterColor } from '../../domain/types';
import { useBackHandler } from '../../backStack';
import { buzz } from '../../haptics';
import { Backdrop, Foreground } from './Backdrops';
import './theater.css';

const TICK = 1000 / 12;
/** 칸 너비에 세트 너비의 몇 %가 보이게 할지 (작을수록 가까이) */
const VISIBLE: Record<Shot, number> = { wide: 1, medium: 0.6, close: 0.38, face: 0.26 };
/** 세로로 긴 칸에서도 최소한 이만큼은 당긴다 */
const MIN_ZOOM: Record<Shot, number> = { wide: 1, medium: 1.1, close: 1.25, face: 1.4 };
/** 카메라가 향하는 높이 (세트 위에서부터 %) */
const FOCUS_Y: Record<Shot, number> = { wide: 60, medium: 62, close: 68, face: 72 };

/** 칸 크기에 맞춰 확대 배율과 카메라 중심을 정한다 (세트 가장자리가 보이지 않게) */
function framing(w: number, h: number, shot: Shot, fx: number, fy: number) {
  if (!w || !h) return { z: 1, x: fx, y: fy };
  const setW = Math.max(w, (h * 4) / 3);
  const setH = setW * 0.75;
  const z = Math.max(MIN_ZOOM[shot], w / (setW * VISIBLE[shot]));
  const vw = (w / (setW * z)) * 100;
  const vh = (h / (setH * z)) * 100;
  const clamp = (v: number, span: number) => Math.min(100 - span / 2, Math.max(span / 2, v));
  return { z, x: clamp(fx, vw), y: clamp(fy, vh) };
}

type Casting = Record<string, { custom: Customization; label: string }>;

function casting(story: Story, me: Customization): Casting {
  const sp = castSpecies(me.species);
  const color: Record<string, HamsterColor> = { cat: 'cream', hamster: 'golden', bird: 'white', rabbit: 'gray' };
  const out: Casting = {};
  for (const r of story.cast) {
    if (r.as === 'me') out[r.id] = { custom: me, label: r.label };
    else {
      const species = r.as === 'boss' ? sp.boss : sp.mate;
      out[r.id] = { custom: { ...DEFAULT_CUSTOM, species, color: color[species] ?? 'gray', outfit: r.outfit ?? 'tie', hat: r.hat ?? 'none', hand: 'none', glasses: r.as === 'boss' }, label: r.label };
    }
  }
  return out;
}

interface ActorState {
  x: number;
  pose: Pose;
  facing: 1 | -1;
  hidden: boolean;
  mark: Mark;
  burst: boolean;
  desk: boolean;
  tag: boolean;
  say: string | null;
}

/** 컷의 t(ms) 시점에서 각 칸의 배우 상태와 발생한 이벤트를 계산한다 (멈춤·건너뛰기에 강하도록 순수 계산) */
function stateAt(cut: Cut, t: number) {
  const panels = cut.panels.map((p) => {
    const actors: Record<string, ActorState> = {};
    for (const c of p.cast) actors[c.who] = fromPlace(c);
    return { actors, shot: p.shot, focus: p.focus, blur: p.blur ?? null, door: 'closed', laptop: 'open', fridge: 'closed', lift: 'closed' };
  });
  let flash = -1;
  let shake: { at: number; power: number } | null = null;
  let glitchUntil = -1;
  for (const e of cut.events ?? []) {
    if (e.at > t) continue;
    const targets = e.p === undefined ? panels.map((_, i) => i) : [e.p];
    for (const i of targets) {
      const P = panels[i];
      if (!P) continue;
      const a = 'who' in e ? P.actors[e.who] : undefined;
      switch (e.do) {
        case 'act':
          if (a) a.pose = { pose: 'front', action: e.action };
          break;
        case 'show':
          if (a) a.hidden = false;
          break;
        case 'move':
          if (a) {
            const k = Math.min(1, (Math.floor((t - e.at) / TICK) * TICK) / e.ms);
            const ease = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
            const from = a.x;
            a.facing = e.to >= from ? 1 : -1;
            a.x = from + (e.to - from) * ease;
            a.hidden = false;
            a.pose = k < 1 ? { pose: 'side', action: e.run ? 'run' : 'walk' } : { pose: 'front', action: (e.then ?? 'idle') as FrontAction };
          }
          break;
        case 'mark':
          if (a) a.mark = e.mark;
          break;
        case 'burst':
          if (a) a.burst = true;
          break;
        case 'say':
          if (a) a.say = e.text;
          break;
        case 'focus':
          P.blur = e.blur;
          break;
        case 'snap':
          P.shot = e.shot;
          if (e.focus) P.focus = e.focus;
          break;
        case 'prop':
          (P as Record<string, unknown>)[e.prop] = e.state;
          break;
      }
    }
    if (e.do === 'flash') flash = e.at;
    if (e.do === 'shake') shake = { at: e.at, power: e.power ?? 2 };
    if (e.do === 'glitch') glitchUntil = Math.max(glitchUntil, e.at + e.ms);
  }
  return { panels, flash, shake, glitch: t < glitchUntil };
}

function fromPlace(c: Place): ActorState {
  return { x: c.x, pose: { pose: 'front', action: c.action ?? 'idle' }, facing: c.facing ?? 1, hidden: !!c.hidden, mark: null, burst: false, desk: !!c.desk, tag: !!c.tag, say: null };
}

export function Theater({ story, me, onClose, onSeen }: { story: Story; me: Customization; onClose: () => void; onSeen?: () => void }) {
  const cast = useRef(casting(story, me)).current;
  const [idx, setIdx] = useState(-1); // -1 = 타이틀
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const [ended, setEnded] = useState(false);
  const clock = useRef({ idx: -1, t: 0, last: 0, paused: false });
  const seenOnce = useRef(false);
  useBackHandler(true, onClose);

  const TITLE_MS = 2000;
  const go = (i: number) => {
    const n = Math.max(-1, Math.min(story.cuts.length, i));
    if (n >= story.cuts.length) {
      setEnded(true);
      if (!seenOnce.current) {
        seenOnce.current = true;
        onSeen?.();
      }
      return;
    }
    clock.current.idx = n;
    clock.current.t = 0;
    setIdx(n);
    setT(0);
  };

  // 재생 시계: 1초에 12번 화면을 갱신한다 (2프레임 끊어 움직이기)
  useEffect(() => {
    if (ended) return;
    let raf = 0;
    let lastTick = 0;
    const loop = (now: number) => {
      const c = clock.current;
      const dt = c.last ? Math.min(100, now - c.last) : 0;
      c.last = now;
      if (!c.paused) {
        c.t += dt;
        const len = c.idx < 0 ? TITLE_MS : story.cuts[c.idx].ms;
        if (c.t >= len) {
          go(c.idx + 1);
        } else if (now - lastTick >= TICK) {
          lastTick = now;
          setT(c.t);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended, story]);

  // 꾹 누르면 멈춤, 짧게 누르면 좌우로 넘기기
  const press = useRef<{ at: number; x: number } | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const down = (e: React.PointerEvent) => {
    press.current = { at: Date.now(), x: e.clientX };
    hold.current = setTimeout(() => {
      clock.current.paused = true;
      setPaused(true);
    }, 220);
  };
  const up = (e: React.PointerEvent) => {
    clearTimeout(hold.current);
    const p = press.current;
    press.current = null;
    if (clock.current.paused) {
      clock.current.paused = false;
      setPaused(false);
      return;
    }
    if (!p || Date.now() - p.at > 220) return;
    const w = (e.currentTarget as HTMLElement).clientWidth;
    go(e.clientX < w * 0.3 ? clock.current.idx - 1 : clock.current.idx + 1);
  };

  const cut = idx >= 0 ? story.cuts[idx] : null;
  const st = cut ? stateAt(cut, t) : null;

  // 효과가 일어나는 순간 진동
  const lastBuzz = useRef('');
  useEffect(() => {
    if (!cut || !st) return;
    const k = `${idx}:${st.flash}:${st.shake?.at}`;
    if (k !== lastBuzz.current && (st.flash >= 0 || st.shake)) {
      lastBuzz.current = k;
      buzz(st.shake?.power === 3 ? [60, 30, 90] : 35);
    }
  });

  const replay = () => {
    setEnded(false);
    clock.current = { idx: -1, t: 0, last: 0, paused: false };
    setIdx(-1);
    setT(0);
  };

  return (
    <div className={`shorts ${paused ? 'paused' : ''}`} role="dialog" aria-modal="true" aria-label={`썰 극장: ${story.title}`}>
      <div className="shorts-bars" aria-hidden>
        {story.cuts.map((c, i) => (
          <i key={i}>
            <b style={{ width: ended || i < idx ? '100%' : i === idx ? `${Math.min(100, (t / c.ms) * 100)}%` : '0%' }} />
          </i>
        ))}
      </div>
      <div className="shorts-head">
        <span className="shorts-no">썰 #{story.no}</span>
        <span className="shorts-title">{story.title}</span>
        <button className="shorts-close" onClick={onClose} aria-label="닫기">
          ✕
        </button>
      </div>

      <div className="shorts-screen" onPointerDown={down} onPointerUp={up} onPointerCancel={() => clearTimeout(hold.current)}>
        {idx < 0 && !ended && <TitleCard story={story} />}
        {cut && st && !ended && (
          <div
            key={idx}
            className={`cut layout-${cut.layout} enter-${cut.enter ?? 'cut'} ${st.glitch ? 'glitch' : ''}`}
            style={st.shake && t - st.shake.at < 450 ? { animation: `sh-shake-${st.shake.power} 0.45s linear` } : undefined}
          >
            {cut.panels.map((p, i) => (
              <PanelView key={i} i={i} panel={p} live={st.panels[i]} cast={cast} />
            ))}
            {(cut.events ?? []).map((e, i) => (e.at <= t ? <Overlay key={i} e={e} t={t} /> : null))}
            <Chat events={(cut.events ?? []).filter((e) => e.do === 'chat' && e.at <= t) as Extract<Ev, { do: 'chat' }>[]} />
            {st.flash >= 0 && t - st.flash < 300 && <div className="cut-flash" />}
          </div>
        )}
        {ended && (
          <div className="shorts-end">
            <small>썰 #{story.no}</small>
            <h2>「{story.title}」</h2>
            <p>제보: {story.credit}님</p>
            <button className="btn primary" onClick={replay}>
              다시 보기
            </button>
            <button className="btn ghost" onClick={onClose}>
              닫기
            </button>
          </div>
        )}
        {paused && <div className="shorts-paused">❚❚</div>}
      </div>
    </div>
  );
}

function TitleCard({ story }: { story: Story }) {
  const words = story.title.split(' ');
  return (
    <div className="title-card">
      <span className="title-sticker">썰 #{story.no}</span>
      <h2>
        {words.map((w, i) => (
          <span key={i} style={{ animationDelay: `${0.15 + i * 0.12}s` }}>
            {w}
          </span>
        ))}
      </h2>
      <small>제보: {story.credit}님</small>
    </div>
  );
}

type Live = ReturnType<typeof stateAt>['panels'][number];

function PanelView({ i, panel, live, cast }: { i: number; panel: Panel; live: Live; cast: Casting }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const focusActor = live.focus ? live.actors[live.focus] : undefined;
  // 전체 샷은 보이는 배우들 가운데로, 나머지는 초점 배우에게
  const shown = Object.values(live.actors).filter((a) => !a.hidden);
  const fx = live.shot === 'wide' && !focusActor ? (shown.length ? shown.reduce((t, a) => t + a.x, 0) / shown.length : 50) : (focusActor?.x ?? 50);
  const f = framing(size.w, size.h, live.shot, fx, FOCUS_Y[live.shot]);
  const flat = panel.bg.startsWith('flat:') ? panel.bg.slice(5) : null;
  return (
    <div ref={ref} className={`panel panel-${i} shot-${live.shot} ${live.blur ? `blur-${live.blur}` : ''}`} style={flat ? { background: flat } : undefined}>
      <div className="set" style={{ transformOrigin: `${f.x}% ${f.y}%`, transform: `translate(${50 - f.x}%, ${50 - f.y}%) scale(${f.z})`, visibility: size.w ? 'visible' : 'hidden' }}>
        <div className="drift">
          {!flat && (
            <div className="layer back">
              <Backdrop bg={panel.bg as Bg} props={live} />
            </div>
          )}
          {flat && <FlatBurst />}
          <div className="layer actors">
            {Object.entries(live.actors).map(([id, a]) => (
              <ActorView key={id} id={id} a={a} who={cast[id]} zoom={f.z} big={live.shot === 'face' || live.shot === 'close'} sx={size.w ? 50 + ((a.x - f.x) * Math.max(size.w, (size.h * 4) / 3) * f.z) / size.w : a.x} />
            ))}
          </div>
          {!flat && (
            <div className="layer fore">
              <Foreground bg={panel.bg as Bg} />
            </div>
          )}
        </div>
      </div>
      <div className="halftone" aria-hidden />
    </div>
  );
}

/** 단색 배경 컷: 뒤에서 천천히 도는 햇살 무늬 */
function FlatBurst() {
  return <div className="flat-burst" aria-hidden />;
}

const Sprite = memo(function Sprite({ custom, pose }: { custom: Customization; pose: Pose }) {
  return <HamsterSprite custom={custom} pose={pose} />;
});

function ActorView({ id, a, who, zoom, big, sx }: { id: string; a: ActorState; who: Casting[string]; zoom: number; big: boolean; sx: number }) {
  if (!who) return null;
  return (
    <div className={`actor ${a.hidden ? 'hidden' : ''} ${a.burst ? 'burst' : ''} mark-${a.mark ?? 'none'} actor-${id}`} style={{ left: `${a.x}%` }}>
      <div className="actor-flip" style={{ transform: `scaleX(${a.pose.pose === 'side' ? a.facing : 1})` }}>
        <Sprite custom={who.custom} pose={a.pose} />
      </div>
      <Manpu mark={a.mark} />
      {a.desk && <Desk />}
      {a.tag && !big && <span className="actor-tag" style={{ scale: `${1 / zoom}` }}>{who.label}</span>}
      {a.say && (
        <div className={`bubble ${sx < 32 ? 'edge-l' : sx > 68 ? 'edge-r' : ''} ${big ? 'big' : ''}`} style={{ scale: `${1 / zoom}` }}>
          <Words text={a.say} />
        </div>
      )}
    </div>
  );
}

/** "*강조*" 표시가 있는 문장을 단어 단위로 하나씩 튀어나오게 */
function Words({ text, base = 0, step = 0.09 }: { text: string; base?: number; step?: number }) {
  const parts: { w: string; hot: boolean }[] = [];
  let hot = false;
  for (const chunk of text.split(/(\*)/)) {
    if (chunk === '*') {
      hot = !hot;
      continue;
    }
    for (const w of chunk.split(' ')) if (w) parts.push({ w, hot });
  }
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className={`w ${p.hot ? 'hot' : ''}`} style={{ animationDelay: `${base + i * step}s` }}>
          {p.w}
        </span>
      ))}
    </>
  );
}

function Overlay({ e, t }: { e: Ev; t: number }) {
  if (e.do === 'text') return <KText text={e.text} x={e.x} y={e.y} style={e.style} size={e.size} tilt={e.tilt} />;
  if (e.do === 'count') return <Counter from={e.from} to={e.to} x={e.x} y={e.y} k={Math.min(1, (t - e.at) / e.ms)} />;
  return null;
}

function KText({ text, x, y, style, size = 1, tilt = 0 }: { text: string; x: number; y: number; style: TextStyle; size?: number; tilt?: number }) {
  return (
    <div className={`kt kt-${style}`} style={{ left: `${x}%`, top: `${y}%`, '--s': size, '--tilt': `${tilt}deg` } as React.CSSProperties}>
      {style === 'sfx' || style === 'stamp' || style === 'label' ? <span className="w">{text.replaceAll('*', '')}</span> : <Words text={text} />}
    </div>
  );
}

/** 숫자가 촤라락 굴러가다 멈춤 */
function Counter({ from, to, x, y, k }: { from: string; to: string; x: number; y: number; k: number }) {
  const scramble = (s: string) => s.replace(/\d/g, () => String(Math.floor(Math.random() * 10)));
  const text = k <= 0.15 ? from : k >= 1 ? to : scramble(k < 0.5 ? from : to);
  return (
    <div className={`kt kt-count ${k >= 1 ? 'done' : ''}`} style={{ left: `${x}%`, top: `${y}%` } as React.CSSProperties}>
      {text}
    </div>
  );
}

function Chat({ events }: { events: Extract<Ev, { do: 'chat' }>[] }) {
  if (!events.length) return null;
  return (
    <div className="chat-stack">
      {events.map((e, i) => (
        <div key={i} className={`cs-row ${e.from}`}>
          {e.name && <small>{e.name}</small>}
          <p>{e.text}</p>
        </div>
      ))}
    </div>
  );
}

function Manpu({ mark }: { mark: Mark }) {
  if (!mark) return null;
  return (
    <svg className={`manpu manpu-${mark}`} viewBox="0 0 120 120" aria-hidden>
      {mark === 'sweat' && <path className="sweat" d="M100 30 C94 40 92 46 96 50 C100 54 106 50 105 44 C104 39 102 35 100 30Z" fill="#9fd8ff" stroke="#3b7fb8" strokeWidth="2" />}
      {mark === 'anger' && (
        <g className="pop" stroke="#e8504b" strokeWidth="5" fill="none" strokeLinecap="round">
          <path d="M92 14 q6 6 0 12 M108 14 q-6 6 0 12 M90 30 q6 -6 12 0 M90 10 q6 6 12 0" />
        </g>
      )}
      {mark === 'gloom' && (
        <g className="gloom" stroke="#6f7fb5" strokeWidth="3" strokeLinecap="round" opacity=".75">
          <path d="M30 8 v34 M44 4 v30 M58 8 v26 M72 4 v32 M86 8 v28" />
        </g>
      )}
      {mark === 'sparkle' && (
        <g className="twinkle" fill="#ffd23c" stroke="#a37a00" strokeWidth="1.5">
          <path d="M12 22 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" />
          <path d="M104 14 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" />
        </g>
      )}
    </svg>
  );
}

function Desk() {
  return (
    <div className="desk" aria-hidden>
      <svg viewBox="0 0 120 40">
        <rect x="28" y="0" width="52" height="22" rx="3" fill="#cfd6e0" stroke="#4a3a2e" strokeWidth="2.4" />
        <circle cx="54" cy="11" r="3" fill="#fff" opacity=".8" />
        <rect x="4" y="20" width="112" height="9" rx="3" fill="#dba76d" stroke="#4a3a2e" strokeWidth="2.4" />
        <rect x="8" y="29" width="104" height="11" fill="#c4854a" stroke="#4a3a2e" strokeWidth="2.4" />
      </svg>
    </div>
  );
}
