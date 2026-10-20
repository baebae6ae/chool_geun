/**
 * 썰 극장 (세로 숏폼): 컷을 차례로 재생한다.
 * - 화면 위 진행 막대, 오른쪽 탭 = 다음 컷, 왼쪽 탭 = 이전 컷, 꾹 누르면 멈춤
 * - 캐릭터는 작고 배경은 넓게. 카메라는 천천히 다가가고 따라가며 계속 움직인다
 * - 캐릭터 이동은 1초에 12번만 갱신해서(2프레임 끊어 움직이기) 손그림 애니 느낌, 자막·효과는 매끄럽게
 * - 시간은 폰·시계·모니터 인서트와 조명으로, 속마음은 황무지·후광·먹구름·실루엣·생각 풍선으로 보여 준다
 */
import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { HamsterSprite, type Pose } from '../hamster/HamsterSprite';
import { castSpecies, type Act, type Bg, type Cut, type Ev, type Mark, type Panel, type Place, type Shot, type Story, type TextStyle } from '../../domain/theater';
import { DEFAULT_CUSTOM } from '../../domain/customization';
import type { Customization, HamsterColor } from '../../domain/types';
import { useBackHandler } from '../../backStack';
import { buzz } from '../../haptics';
import { Backdrop, Foreground } from './Backdrops';
import './theater.css';

const TICK = 1000 / 12;
/** 칸 너비 기준 확대 배율 (전체 샷은 캐릭터가 작고 배경이 넓게) */
const ZOOM: Record<Shot, number> = { wide: 1, medium: 1.55, close: 2.2, face: 3 };
/** 카메라가 향하는 높이 (세트 위에서부터 %) */
const FOCUS_Y: Record<Shot, number> = { wide: 60, medium: 64, close: 70, face: 73 };
/** 바닥선이 칸 높이의 몇 %에 오는지 */
const FLOOR_AT = 0.72;

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
  silhouette: boolean;
  /** 들썩 이동 중 몇 번째 걸음인지 (바뀔 때마다 통통 튄다) */
  hop: number;
  /** 물속에 잠겨 있음 */
  sunk: boolean;
}

interface Dream {
  who: string;
  count: number;
  action: Act;
  text?: string;
  popped: boolean;
}

/** 대본의 동작을 그림 자세로: 눕기는 옆으로 누워 자는 모습 */
const poseOf = (a: Act): Pose => (a === 'lie' ? { pose: 'side', action: 'sleep' } : { pose: 'front', action: a });

function fromPlace(c: Place): ActorState {
  return { x: c.x, pose: poseOf(c.action ?? 'idle'), facing: c.facing ?? 1, hidden: !!c.hidden, mark: null, burst: false, desk: !!c.desk, tag: !!c.tag, say: null, silhouette: false, hop: 0, sunk: !!c.sunk };
}

const ease = (k: number) => (k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);

/** 컷의 t(ms) 시점 상태를 대본에서 바로 계산한다 (멈춤·건너뛰기에 강하도록) */
function stateAt(cut: Cut, t: number) {
  const panels = cut.panels.map((p) => {
    const actors: Record<string, ActorState> = {};
    for (const c of p.cast) actors[c.who] = fromPlace(c);
    return {
      actors,
      shot: p.shot,
      focus: p.focus,
      blur: p.blur ?? null,
      camMs: 0,
      light: 0,
      lightMs: 0,
      glare: false,
      dream: null as Dream | null,
      door: 'closed',
      laptop: 'open',
      fridge: 'closed',
      lift: 'closed',
      printer: 'idle',
      stall: 'closed',
    };
  });
  let flash = -1;
  let shake: { at: number; power: number } | null = null;
  let glitchUntil = -1;
  let linesUntil = -1;
  const confetti: number[] = [];
  for (const e of cut.events ?? []) {
    if (e.at > t) continue;
    const targets = e.p === undefined ? panels.map((_, i) => i) : [e.p];
    for (const i of targets) {
      const P = panels[i];
      if (!P) continue;
      const a = 'who' in e ? P.actors[e.who] : undefined;
      switch (e.do) {
        case 'act':
          if (a) a.pose = poseOf(e.action);
          break;
        case 'show':
          if (a) a.hidden = false;
          break;
        case 'move':
          if (a) {
            const k = Math.min(1, (Math.floor((t - e.at) / TICK) * TICK) / e.ms);
            const from = a.x;
            a.facing = e.to >= from ? 1 : -1;
            a.x = from + (e.to - from) * ease(k);
            a.hidden = false;
            a.pose = k < 1 ? { pose: 'side', action: e.run ? 'run' : 'walk' } : poseOf(e.then ?? 'idle');
          }
          break;
        case 'inch':
          if (a) {
            const k = Math.min(1, (t - e.at) / e.ms);
            const step = Math.min(e.steps, Math.floor(k * e.steps + 0.5));
            a.x = a.x + ((e.to - a.x) * step) / e.steps;
            a.hop = step;
            a.hidden = false;
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
        case 'silhouette':
          if (a) a.silhouette = e.on;
          break;
        case 'sink':
          if (a) a.sunk = e.on;
          break;
        case 'focus':
          P.blur = e.blur;
          break;
        case 'snap':
          P.shot = e.shot;
          P.camMs = 0;
          if (e.focus) P.focus = e.focus;
          break;
        case 'cam':
          P.shot = e.shot;
          P.camMs = e.ms;
          if (e.focus) P.focus = e.focus;
          break;
        case 'light':
          P.light = e.level;
          P.lightMs = e.ms;
          break;
        case 'glare':
          P.glare = e.on;
          break;
        case 'dream':
          if (P.actors[e.who]) P.dream = { who: e.who, count: e.count, action: e.action ?? 'idle', text: e.text, popped: false };
          break;
        case 'dreamPop':
          if (P.dream) P.dream = { ...P.dream, popped: true };
          break;
        case 'prop':
          (P as Record<string, unknown>)[e.prop] = e.state;
          break;
      }
    }
    if (e.do === 'flash') flash = e.at;
    if (e.do === 'shake') shake = { at: e.at, power: e.power ?? 2 };
    if (e.do === 'glitch') glitchUntil = Math.max(glitchUntil, e.at + e.ms);
    if (e.do === 'lines') linesUntil = Math.max(linesUntil, e.at + e.ms);
    if (e.do === 'confetti') confetti.push(e.at);
  }
  // 번쩍이면 집중선이 잠깐, 쾅 확대로 들어온 컷은 첫머리에 집중선
  if (flash >= 0) linesUntil = Math.max(linesUntil, flash + 700);
  if (cut.enter === 'punch') linesUntil = Math.max(linesUntil, 450);
  return {
    panels,
    flash,
    shake,
    glitch: t < glitchUntil,
    lines: t < linesUntil,
    // 가장 센 흔들림 순간엔 흑백이 뒤집힌 임팩트 프레임 두 장
    impact: !!shake && shake.power === 3 && t - shake.at < 170,
    confetti: confetti.filter((at) => t - at < 2600),
  };
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
            className={`cut layout-${cut.layout} enter-${cut.enter ?? 'cut'} ${st.glitch ? 'glitch' : ''} ${st.impact ? 'impact' : ''}`}
            style={st.shake && t - st.shake.at < 450 ? { animation: `sh-shake-${st.shake.power} 0.45s linear` } : undefined}
          >
            {cut.panels.map((p, i) => (
              <PanelView key={i} i={i} panel={p} live={st.panels[i]} cast={cast} me={me} />
            ))}
            {(cut.events ?? []).map((e, i) => (e.at <= t ? <Overlay key={i} e={e} /> : null))}
            <Chat events={(cut.events ?? []).filter((e) => e.do === 'chat' && e.at <= t) as Extract<Ev, { do: 'chat' }>[]} />
            {st.lines && <SpeedLines />}
            {st.confetti.map((at) => (
              <Confetti key={at} />
            ))}
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

/** 칸 크기에 맞춘 카메라: 세트는 칸 너비에 맞추고, 바닥선을 칸 아래쪽에 둔다. 위아래는 벽과 바닥이 이어져 넓어 보인다 */
function camera(w: number, h: number, shot: Shot, fx: number) {
  const setW = w;
  const setH = w * 0.75;
  const top = h * FLOOR_AT - setH * 0.76;
  const z = ZOOM[shot];
  const fy = FOCUS_Y[shot];
  // 초점을 칸 가운데쯤으로 끌어온다 (전체 샷은 제자리)
  const px = (fx / 100) * setW;
  const py = top + (fy / 100) * setH;
  const tx = shot === 'wide' ? 0 : w / 2 - px;
  const ty = shot === 'wide' ? 0 : h * 0.5 - py;
  return { top, setW, setH, z, fx, fy, tx, ty };
}

function PanelView({ i, panel, live, cast, me }: { i: number; panel: Panel; live: Live; cast: Casting; me: Customization }) {
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
  const bg = panel.bg;
  const insert = /^(phone|clock|screen|scan):/.test(bg);
  const flat = bg.startsWith('flat:') ? bg.slice(5) : null;
  const focusActor = live.focus ? live.actors[live.focus] : undefined;
  const shown = Object.values(live.actors).filter((a) => !a.hidden);
  const fx = focusActor?.x ?? (shown.length ? shown.reduce((s, a) => s + a.x, 0) / shown.length : 50);
  const cam = camera(size.w, size.h, live.shot, fx);
  const drama = Object.values(live.actors).some((a) => a.silhouette && !a.hidden);
  return (
    <div
      ref={ref}
      className={`panel panel-${i} shot-${live.shot} ${live.blur ? `blur-${live.blur}` : ''} ${live.glare ? 'glare' : ''} ${insert ? 'insert' : ''} ${drama ? 'drama' : ''}`}
      style={flat ? { background: flat } : undefined}
    >
      {insert ? (
        <Insert bg={bg} me={me} />
      ) : (
        <div
          className="set"
          style={{
            top: cam.top,
            width: cam.setW,
            height: cam.setH,
            transformOrigin: `${cam.fx}% ${cam.fy}%`,
            transform: `translate(${cam.tx}px, ${cam.ty}px) scale(${cam.z})`,
            transition: `transform ${live.camMs}ms cubic-bezier(.45,0,.25,1)`,
            visibility: size.w ? 'visible' : 'hidden',
          }}
        >
          <div className="drift">
            {!flat && (
              <div className="layer back">
                <Backdrop bg={bg as Bg} props={live} />
              </div>
            )}
            {flat && <FlatBurst />}
            <div className="layer actors">
              {Object.entries(live.actors).map(([id, a]) => (
                <ActorView
                  key={id}
                  id={id}
                  a={a}
                  who={cast[id]}
                  zoom={cam.z}
                  big={live.shot === 'face' || live.shot === 'close'}
                  sx={size.w ? (((a.x / 100) * cam.setW - (cam.fx / 100) * cam.setW) * cam.z + (cam.fx / 100) * cam.setW + cam.tx) / size.w * 100 : a.x}
                  dream={live.dream?.who === id ? live.dream : null}
                  me={me}
                />
              ))}
            </div>
            {!flat && (
              <div className="layer fore">
                <Foreground bg={bg as Bg} />
              </div>
            )}
          </div>
        </div>
      )}
      {drama && <Lightning />}
      <div className="light" style={{ opacity: live.light, transition: `opacity ${live.lightMs}ms linear` }} aria-hidden />
      <div className="halftone" aria-hidden />
    </div>
  );
}

/** 화면 가득 소품 인서트: 폰 잠금화면 · 벽시계 · 모니터 */
function Insert({ bg, me }: { bg: string; me: Customization }) {
  const [kind, rest] = [bg.slice(0, bg.indexOf(':')), bg.slice(bg.indexOf(':') + 1)];
  if (kind === 'phone') {
    const [time, from, msg] = rest.split('|');
    return (
      <div className="insert-wrap">
        <div className={`phone ${from ? 'buzz' : ''}`}>
          <div className="phone-screen">
            <div className="phone-date">10월 20일 화요일</div>
            <div className="phone-time">{time}</div>
            {from && (
              <div className="phone-noti">
                <small>메신저 · {from}</small>
                <b>{msg}</b>
              </div>
            )}
            <div className="phone-wall">
              <HamsterSprite custom={me} pose={{ pose: 'front', action: 'idle' }} still />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (kind === 'scan') {
    const [time, msg] = rest.split('|');
    const ok = /인식되었|확인/.test(msg ?? '');
    return (
      <div className="insert-wrap scan-wrap">
        <div className={`scanner ${ok ? 'ok' : 'ng'}`}>
          <div className="scanner-lcd">
            <b>{time}</b>
            <span>{msg}</span>
          </div>
          <svg className="scanner-pad" viewBox="0 0 60 60" aria-hidden>
            <rect x="4" y="4" width="52" height="52" rx="12" fill="#2d2f3a" stroke="#4a3a2e" strokeWidth="3" />
            <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M22 44 q-6 -14 4 -24 q10 -6 16 4" />
              <path d="M26 46 q-6 -14 2 -20 q8 -4 10 6 q2 8 -2 14" />
              <path d="M31 47 q-4 -10 -1 -16 M35 44 q2 -6 0 -10" />
              <path d="M18 38 q-2 -10 4 -18" />
            </g>
          </svg>
          <div className="scanner-led" />
        </div>
      </div>
    );
  }
  if (kind === 'clock') {
    const [hh, mm] = rest.split(':').map(Number);
    return (
      <div className="insert-wrap clock-wrap">
        <svg className="big-clock" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="44" fill="#fffaf0" stroke="#4a3a2e" strokeWidth="5" />
          {Array.from({ length: 12 }, (_, i) => (
            <path key={i} d={`M50 ${i % 3 ? 12 : 10} V${i % 3 ? 16 : 19}`} stroke="#4a3a2e" strokeWidth={i % 3 ? 2 : 4} strokeLinecap="round" transform={`rotate(${i * 30} 50 50)`} />
          ))}
          <path d="M50 50 V27" stroke="#4a3a2e" strokeWidth="5" strokeLinecap="round" transform={`rotate(${((hh % 12) + mm / 60) * 30} 50 50)`} />
          <path d="M50 50 V16" stroke="#4a3a2e" strokeWidth="3" strokeLinecap="round" transform={`rotate(${mm * 6} 50 50)`} />
          <path className="big-clock-sec" d="M50 54 V14" stroke="#e8504b" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="50" cy="50" r="3.2" fill="#4a3a2e" />
        </svg>
        <div className="clock-digits">
          {String(hh).padStart(2, '0')}:{String(mm).padStart(2, '0')}
        </div>
      </div>
    );
  }
  return (
    <div className="insert-wrap screen-wrap">
      <div className="monitor">
        <div className="monitor-screen">
          <div className="win">
            <div className="win-bar">
              보고서_최종_진짜최종.docx <span>✕</span>
            </div>
            <div className="win-body">
              <b>⚠ {rest}</b>
              <div className="win-spin" />
            </div>
          </div>
        </div>
        <div className="monitor-stand" />
      </div>
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

function ActorView({ id, a, who, zoom, big, sx, dream, me }: { id: string; a: ActorState; who: Casting[string]; zoom: number; big: boolean; sx: number; dream: Dream | null; me: Customization }) {
  if (!who) return null;
  return (
    <div className={`actor ${a.hidden ? 'hidden' : ''} ${a.burst ? 'burst' : ''} ${a.silhouette ? 'silhouette' : ''} ${a.sunk ? 'sunk' : ''} mark-${a.mark ?? 'none'} actor-${id}`} style={{ left: `${a.x}%` }}>
      <div key={a.hop} className={`actor-flip ${a.hop ? 'hop' : ''}`} style={{ transform: `scaleX(${a.pose.pose === 'side' ? a.facing : 1})` }}>
        <Sprite custom={who.custom} pose={a.pose} />
      </div>
      {a.pose.pose === 'side' && a.pose.action === 'run' && !a.hidden && <Dust facing={a.facing} />}
      <Manpu mark={a.mark} />
      {a.desk && <Desk />}
      {a.tag && !big && <span className="actor-tag" style={{ scale: `${1 / zoom}` }}>{who.label}</span>}
      {a.say && (
        <div className={`bubble ${sx < 32 ? 'edge-l' : sx > 68 ? 'edge-r' : ''} ${big ? 'big' : ''}`} style={{ scale: `${1 / zoom}` }}>
          <Words text={a.say} />
        </div>
      )}
      {dream && <DreamBubble d={dream} me={me} />}
    </div>
  );
}

/** 생각 풍선: 분신이 하나둘 늘어난다 */
function DreamBubble({ d, me }: { d: Dream; me: Customization }) {
  return (
    <div className={`dream ${d.popped ? 'popped' : ''}`}>
      <div className="dream-cloud">
        <div className="dream-cast">
          {Array.from({ length: d.count }, (_, i) => (
            <div key={i} className="dream-clone" style={{ animationDelay: `${(i % 3) * 0.08}s` }}>
              <HamsterSprite custom={me} pose={poseOf(d.action)} />
            </div>
          ))}
        </div>
        {d.text && <div className="dream-text">{d.text}</div>}
      </div>
      <i className="dream-dot a" />
      <i className="dream-dot b" />
      {d.popped && (
        <div className="poof" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} style={{ '--a': `${i * 60}deg` } as React.CSSProperties} />
          ))}
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

function Overlay({ e }: { e: Ev }) {
  if (e.do === 'text') return <KText text={e.text} x={e.x} y={e.y} style={e.style} size={e.size} tilt={e.tilt} />;
  if (e.do === 'count') return <Counter from={e.from} to={e.to} x={e.x} y={e.y} ms={e.ms} />;
  return null;
}

function KText({ text, x, y, style, size = 1, tilt = 0 }: { text: string; x: number; y: number; style: TextStyle; size?: number; tilt?: number }) {
  return (
    <div className={`kt kt-${style} ${style === 'sfx' && size >= 1.2 ? 'pow' : ''}`} style={{ left: `${x}%`, top: `${y}%`, '--s': size, '--tilt': `${tilt}deg` } as React.CSSProperties}>
      {style === 'sfx' || style === 'stamp' || style === 'label' ? <span className="w">{text.replaceAll('*', '')}</span> : <Words text={text} />}
    </div>
  );
}

/** 숫자가 촤라락 굴러가다 멈춤 */
function Counter({ from, to, x, y, ms }: { from: string; to: string; x: number; y: number; ms: number }) {
  const [k, setK] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const id = setInterval(() => setK(Math.min(1, (performance.now() - start) / ms)), 60);
    return () => clearInterval(id);
  }, [ms]);
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
      {mark === 'sweat' && (
        <g fill="#9fd8ff" stroke="#3b7fb8" strokeWidth="2">
          <path className="sweat" d="M100 30 C94 40 92 46 96 50 C100 54 106 50 105 44 C104 39 102 35 100 30Z" />
          <path className="sweat b" d="M18 40 C14 47 13 51 16 54 C19 57 23 54 22 50 C21 46 20 43 18 40Z" />
          <path className="sweat c" d="M110 52 C107 57 106 60 108 62 C110 64 113 62 112 59 C112 56 111 54 110 52Z" />
        </g>
      )}
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
      {mark === 'idea' && (
        <g className="idea" strokeLinecap="round">
          <g stroke="#ffb800" strokeWidth="3.4">
            <path d="M60 -30 v-9 M38 -22 l-6 -6 M82 -22 l6 -6 M30 -4 h-9 M90 -4 h9" />
          </g>
          <path d="M60 -26 c-11 0 -18 8 -18 17 c0 7 4 11 7 14 v6 h22 v-6 c3 -3 7 -7 7 -14 c0 -9 -7 -17 -18 -17z" fill="#fff27a" stroke="#4a3a2e" strokeWidth="2.6" />
          <path d="M51 6 h18 M52 11 h16" stroke="#4a3a2e" strokeWidth="2.4" />
          <path d="M54 -8 q3 -6 6 0 q3 6 6 0" fill="none" stroke="#e89a00" strokeWidth="2" />
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

/** 만화 집중선: 화면 가장자리에서 가운데로 몰리는 선, 2프레임마다 바뀌며 부들부들 */
const LINES = Array.from({ length: 44 }, (_, i) => {
  const a = (i / 44) * Math.PI * 2 + (i % 3) * 0.03;
  const w = 0.012 + (i % 4) * 0.006;
  const r0 = 38 + ((i * 7) % 5) * 3;
  const p = (r: number, da: number) => `${50 + Math.cos(a + da) * r} ${50 + Math.sin(a + da) * r * 1.4}`;
  return `M${p(90, -w)} L${p(r0, 0)} L${p(90, w)}Z`;
}).join(' ');

function SpeedLines() {
  return (
    <svg className="speed-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <path d={LINES} />
      <path d={LINES} transform="rotate(4 50 50)" />
    </svg>
  );
}

/** 빵빠레 꽃가루 */
const CONFETTI_COLORS = ['#ffd23c', '#ff8b7a', '#7dd88f', '#9fc8ff', '#c9b8ff', '#fff'];
function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: 30 }, (_, i) => (
        <i
          key={i}
          style={
            {
              left: `${(i * 37) % 100}%`,
              background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${(i % 6) * 0.07}s`,
              '--dx': `${((i * 53) % 40) - 20}px`,
              '--r': `${(i % 2 ? 1 : -1) * (360 + i * 20)}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** 충격 실루엣 뒤로 치는 번개 */
function Lightning() {
  return (
    <svg className="lightning" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
      <path d="M14 -2 L6 22 L13 22 L3 46 L20 18 L12 18 L22 -2Z" />
      <path d="M86 -2 L80 16 L88 16 L76 40 L95 12 L86 12 L96 -2Z" />
    </svg>
  );
}

/** 뛰어갈 때 발밑에 피어오르는 흙먼지 */
function Dust({ facing }: { facing: 1 | -1 }) {
  return (
    <div className="dust" style={{ [facing === 1 ? 'right' : 'left']: '62%' }} aria-hidden>
      <i />
      <i />
      <i />
    </div>
  );
}
