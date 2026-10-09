import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { HamsterMood } from '../../domain/schedule';
import type { Customization } from '../../domain/types';
import { HamsterSprite, type FrontAction, type Pose } from '../hamster/HamsterSprite';
import { ACTIVITY_LABEL, endDay, initialScene, planErrand, spotsFor, startDay, travel, type Place, type Step } from './brain';
import { buzz } from '../../haptics';
import type { RareId } from '../../domain/rare';
import { RotLayer, rotLevel } from './RotLayer';
import { Bowl, DeskBack, DeskFront, Floor, Nest, PlacedItems, WallClock, Wheel, Window, type Trophy } from './props';
import './habitat.css';

interface Props {
  custom: Customization;
  mood: HamsterMood;
  name: string;
  now: number;
  /** 탁상시계 화면: 주어진 칸 높이에 맞춰 방 전체를 확대 */
  fit?: boolean;
  /** 이번 시즌에 완성한 작업물 (벽 선반) */
  trophies?: Trophy[];
  /** 햄스터 머리 위 말풍선. key가 바뀔 때마다 새로 뜬다 */
  bubble?: { key: string; text: string } | null;
  /** 월급날엔 가끔 춤춘다 */
  payday?: boolean;
  /** 화면을 보고 있을 때 희귀 행동이 시작됨 */
  onRare?: (id: RareId) => void;
  /** 사용자가 햄스터와 논다: 쓰다듬기·간식 주기·위로(안아주기) */
  onInteract?: (kind: 'pet' | 'feed' | 'hug') => void;
  /** id가 바뀔 때마다 햄스터가 해당 반응을 한다 (위로 버튼) */
  reaction?: { id: number; action: 'hug' } | null;
  /** 야근 중이면 지금까지의 야근 시간(분). 햄스터는 죽상이 되고 방은 썩어간다 */
  overtimeMin?: number | null;
}

interface View {
  pose: Pose;
  place: Place;
  facing: 1 | -1;
}

/** 새로고침해도 하던 일을 이어가도록 잠깐 기억해 둔다 */
interface Snapshot {
  at: number;
  mood: HamsterMood;
  W: number;
  last?: string;
  queue: Step[];
}
const SNAP_KEY = 'hamster-habitat:v1';
const SNAP_TTL = 10 * 60_000;

function readSnapshot(mood: HamsterMood, W: number): Snapshot | null {
  try {
    const snap = JSON.parse(localStorage.getItem(SNAP_KEY) || 'null') as Snapshot | null;
    if (!snap || !Array.isArray(snap.queue) || snap.queue.length === 0) return null;
    if (Date.now() - snap.at > SNAP_TTL || snap.mood !== mood || Math.abs(snap.W - W) > 40) return null;
    return snap;
  } catch {
    return null;
  }
}

const SPEED = { walk: 44, run: 125 };
/** 장소별로 햄스터가 올라앉는 높이(px)와 크기 */
const LIFT: Record<Place, number> = { floor: 0, desk: 42, wheel: 16, bed: 5 };
const SCALE: Record<Place, number> = { floor: 1, desk: 1, wheel: 0.76, bed: 1 };
const IN_OFFICE: HamsterMood[] = ['arriving', 'starting', 'working', 'break', 'almostDone', 'oneMore'];
const SLEEP_LABEL: Partial<Record<HamsterMood, string>> = {
  off: '퇴근하고 꿀잠 중',
  beforeWork: '출근 전 쿨쿨',
  holiday: '쉬는 날 늦잠 중',
};

/** 개발용: `?hspeed=4` 로 햄스터 시간을 빠르게 */
const HSPEED = (() => {
  try {
    return Number(new URLSearchParams(location.search).get('hspeed')) || 1;
  } catch {
    return 1;
  }
})();

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * 햄스터가 사는 작은 사무실. 조작 없이 켜두면 햄스터가 알아서
 * 일하고, 쳇바퀴 돌고, 씨앗 먹고, 세수하고, 졸고, 출퇴근한다.
 */
/** 방의 기준 높이. 탁상시계 화면에선 이 높이를 칸에 맞춰 확대한다 */
const BASE_H = 236;

export function Habitat({ custom, mood, name, now, fit = false, trophies = [], bubble, payday = false, onRare, onInteract, reaction, overtimeMin = null }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const bubbleEl = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const actor = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(358);
  const spots = useMemo(() => spotsFor(W), [W]);

  const [view, setView] = useState<View>({
    pose: { pose: 'front', action: 'idle' },
    place: 'floor',
    facing: 1,
  });
  const [heart, setHeart] = useState(0);

  const x = useRef(spots.desk);
  const queue = useRef<Step[]>([]);
  const cur = useRef<{ step: Step; since: number } | null>(null);
  const moodRef = useRef(mood);
  const spotsRef = useRef(spots);
  const viewRef = useRef(view);
  const started = useRef(false);
  const lastErrand = useRef<string | undefined>(undefined);
  const paydayRef = useRef(payday);
  const hourRef = useRef(new Date(now).getHours());
  hourRef.current = new Date(now).getHours();
  const overtimeOn = overtimeMin !== null;
  const overtimeRef = useRef(overtimeOn);
  overtimeRef.current = overtimeOn;
  const onRareRef = useRef(onRare);
  const onInteractRef = useRef(onInteract);
  const taps = useRef<number[]>([]);
  const feedUntil = useRef(0);
  spotsRef.current = spots;
  paydayRef.current = payday;
  onRareRef.current = onRare;
  onInteractRef.current = onInteract;

  const patch = useCallback((p: Partial<View>) => {
    const next = { ...viewRef.current, ...p };
    const v = viewRef.current;
    if (
      next.pose.pose === v.pose.pose &&
      next.pose.action === v.pose.action &&
      next.place === v.place &&
      next.facing === v.facing
    )
      return;
    viewRef.current = next;
    setView(next);
  }, []);

  const placeActor = useCallback(() => {
    if (actor.current) actor.current.style.transform = `translateX(${x.current - 46}px)`;
    // 말풍선은 가구보다 앞 층에 따로 있어서 위치만 따라간다 (방 가장자리에선 안쪽으로)
    if (bubbleEl.current) {
      const W = spotsRef.current.W;
      const bx = Math.min(Math.max(x.current, 100), W - 100);
      bubbleEl.current.style.left = `${bx}px`;
      bubbleEl.current.style.setProperty('--tail', `${Math.max(-80, Math.min(80, x.current - bx))}px`);
    }
  }, []);

  /** 지금 하던 일 + 남은 할 일을 저장 */
  const saveSnapshot = useCallback(() => {
    const steps: Step[] = [{ t: 'set', x: x.current, facing: viewRef.current.facing }];
    const c = cur.current;
    if (c?.step.t === 'act') {
      const left = c.step.ms - (performance.now() - c.since) * HSPEED;
      if (left > 400) steps.push({ ...c.step, ms: left });
    } else if (c?.step.t === 'move') {
      steps.push(c.step);
    }
    steps.push(...queue.current);
    const snap: Snapshot = { at: Date.now(), mood: moodRef.current, W: spotsRef.current.W, last: lastErrand.current, queue: steps };
    try {
      localStorage.setItem(SNAP_KEY, JSON.stringify(snap));
    } catch {
      // 저장 못 해도 동작에는 지장 없음
    }
  }, []);

  /** 방의 논리 폭 (확대 전) */
  const logicalW = useCallback(() => {
    const f = frame.current;
    if (fit && f && f.clientHeight > 0) return f.clientWidth / Math.max(1, f.clientHeight / BASE_H);
    return box.current?.clientWidth || 358;
  }, [fit]);

  // 폭 측정
  useLayoutEffect(() => {
    const f = frame.current;
    if (!f) return;
    const measure = () => {
      setZoom(fit && f.clientHeight > 0 ? Math.max(1, f.clientHeight / BASE_H) : 1);
      setW(Math.round(logicalW()));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(f);
    return () => ro.disconnect();
  }, [fit, logicalW]);

  // 근무 상태 변화 → 할 일 다시 짜기
  useEffect(() => {
    const prev = moodRef.current;
    moodRef.current = mood;
    const W0 = logicalW();
    const s = started.current ? spotsRef.current : spotsFor(W0);
    if (!started.current) {
      started.current = true;
      const snap = readSnapshot(mood, W0);
      queue.current = snap ? snap.queue : initialScene(mood, s, Math.random, hourRef.current);
      lastErrand.current = snap?.last;
      cur.current = null;
      return;
    }
    if (prev === mood) return;
    const wasWorking = IN_OFFICE.includes(prev);
    const isWorking = IN_OFFICE.includes(mood);
    if (wasWorking && !isWorking) {
      queue.current = endDay(s, x.current, viewRef.current.place);
    } else if (!wasWorking && isWorking) {
      queue.current = startDay(s, x.current);
    } else {
      queue.current = [];
    }
    // 이동 중이면 멈추지 말고 목적지까지 가게 두고, 행동 중이면 바로 다음 할 일로
    if (cur.current?.step.t !== 'move') cur.current = null;
  }, [mood, logicalW]);

  // 야근 시작·끝 → 하던 일을 접고 새로 짠다
  const prevOvertime = useRef(overtimeOn);
  useEffect(() => {
    if (prevOvertime.current === overtimeOn) return;
    prevOvertime.current = overtimeOn;
    queue.current = [];
    if (cur.current?.step.t !== 'move') cur.current = null;
  }, [overtimeOn]);

  // 폭이 바뀌면 위치 보정
  useEffect(() => {
    x.current = Math.min(Math.max(x.current, -80), spots.W + 80);
    placeActor();
  }, [spots, placeActor]);

  // 메인 루프
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const instant = reducedMotion();

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * HSPEED;
      last = now;

      if (!cur.current) {
        if (queue.current.length === 0 && overtimeRef.current) {
          // 야근: 책상에 붙박이. 가끔 커피로 연명하거나 졸다 깬다
          const r = Math.random();
          const hold = (action: FrontAction, ms: number): Step => ({ t: 'act', pose: { pose: 'front', action }, ms, place: 'desk' });
          queue.current = [
            ...travel(x.current, spotsRef.current.desk, Math.random),
            r < 0.55 ? hold('doom', 7000 + Math.random() * 5000) : r < 0.72 ? hold('sip', 4500) : r < 0.88 ? hold('doze', 3200) : hold('dizzy', 2600),
            hold('doom', 5000),
          ];
          lastErrand.current = 'overtime';
        }
        if (queue.current.length === 0) {
          const plan = planErrand(
            moodRef.current,
            spotsRef.current,
            x.current,
            Math.random,
            lastErrand.current,
            viewRef.current.place,
            paydayRef.current,
            hourRef.current,
          );
          lastErrand.current = plan.name;
          queue.current = plan.steps;
        }
        const step = queue.current.shift()!;
        cur.current = { step, since: now };
        if (step.t === 'set') {
          if (step.x !== undefined) x.current = step.x;
          if (step.facing !== undefined) patch({ facing: step.facing });
          placeActor();
          cur.current = null;
          saveSnapshot();
        } else if (step.t === 'act') {
          patch({ pose: step.pose, place: step.place });
          if (step.rare && document.visibilityState === 'visible') onRareRef.current?.(step.rare);
          saveSnapshot();
        } else {
          const dir = step.to >= x.current ? 1 : -1;
          patch({ pose: { pose: 'side', action: step.gait }, place: 'floor', facing: dir });
        }
      } else {
        const { step, since } = cur.current;
        if (step.t === 'move') {
          const dir = step.to >= x.current ? 1 : -1;
          const nx = instant ? step.to : x.current + dir * SPEED[step.gait] * dt;
          if ((dir > 0 && nx >= step.to) || (dir < 0 && nx <= step.to)) {
            x.current = step.to;
            cur.current = null;
          } else {
            x.current = nx;
          }
          placeActor();
        } else if (step.t === 'act' && (now - since) * HSPEED >= step.ms) {
          cur.current = null;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const onHide = () => {
      if (document.visibilityState === 'hidden') saveSnapshot();
    };
    window.addEventListener('pagehide', saveSnapshot);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      cancelAnimationFrame(raf);
      saveSnapshot();
      window.removeEventListener('pagehide', saveSnapshot);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [patch, placeActor, saveSnapshot]);

  /** 하던 일을 (이동 중이 아니면) 멈추고 주어진 동작을 먼저 한다 */
  const inject = useCallback((steps: Step[]) => {
    queue.current.unshift(...steps);
    if (cur.current?.step.t !== 'move') cur.current = null;
  }, []);
  const act = (action: FrontAction, ms: number, pl: Place = 'floor'): Step => ({
    t: 'act',
    pose: { pose: 'front', action },
    ms,
    place: pl,
  });

  // 쓰다듬기: 누를 때마다 다른 반응 (손 흔들기·부끄·하트·응원). 연달아 누르면 신나서 춤
  const poke = () => {
    if (cur.current?.step.t === 'move') return;
    const pl = viewRef.current.place;
    const t = Date.now();
    taps.current = [...taps.current.filter((x) => t - x < 4000), t];
    if (pl === 'bed') {
      inject([act('yawn', 2800)]);
    } else if (taps.current.length >= 6) {
      taps.current = [];
      inject([act('dance', 3200, pl)]);
    } else {
      const picks = ['wave', 'shy', 'heart', 'cheer'] as const;
      let a: (typeof picks)[number];
      do a = picks[Math.floor(Math.random() * picks.length)];
      while (a === viewRef.current.pose.action && picks.length > 1);
      inject([act(a, a === 'wave' ? 1500 : 2000, pl)]);
    }
    setHeart((h) => h + 1);
    onInteractRef.current?.('pet');
    buzz(8);
  };

  // 간식 주기: 그릇 쪽으로 가서 냠냠 → 볼이 빵빵 → 고마워서 하트
  const feed = () => {
    const t = Date.now();
    if (t < feedUntil.current) return;
    feedUntil.current = t + 5000;
    const s = spotsRef.current;
    inject([
      ...travel(x.current, s.eat, Math.random),
      act('nibble', 3400),
      act('stuff', 2200),
      act('heart', 1800),
    ]);
    onInteractRef.current?.('feed');
    buzz(10);
  };

  // 위로 버튼: 두 팔을 벌려 안아주기
  const lastReaction = useRef(0);
  useEffect(() => {
    if (!reaction || reaction.id === lastReaction.current) return;
    lastReaction.current = reaction.id;
    inject([act('hug', 5200, viewRef.current.place === 'bed' ? 'floor' : viewRef.current.place)]);
    onInteractRef.current?.('hug');
  }, [reaction, inject]);

  const { pose, place, facing } = view;
  const onWheel = place === 'wheel';
  const hour = new Date(now).getHours();
  const label =
    onWheel && pose.action === 'run'
      ? '쳇바퀴 도는 중'
      : pose.action === 'sleep'
        ? mood === 'holiday' && hour >= 12
          ? hour < 19 ? '낮잠 자는 중' : ACTIVITY_LABEL.sleep
          : (SLEEP_LABEL[mood] ?? ACTIVITY_LABEL.sleep)
        : pose.action === 'meal'
          ? hour < 10
            ? '아침 먹는 중'
            : hour < 15
              ? mood === 'holiday' ? '브런치 먹는 중' : '점심 먹는 중'
              : '저녁 먹는 중'
          : ACTIVITY_LABEL[pose.action];

  return (
    <div className="habitat-wrap">
      <div className="habitat-frame" ref={frame}>
      <div
        className={overtimeOn ? 'habitat rotting' : 'habitat'}
        data-bg={custom.bg ?? 'default'}
        ref={box}
        style={{
          ...(fit ? { width: W, height: BASE_H, margin: 0, transform: `scale(${zoom})`, transformOrigin: '0 0' } : null),
          ...(overtimeOn ? ({ '--rot': rotLevel(overtimeMin ?? 0) } as React.CSSProperties) : null),
        }}
      >
        <Window x={spots.window} now={now} />
        {trophies.length > 0 && <PlacedItems items={trophies} />}
        <WallClock x={spots.desk} now={now} />
        <Floor />
        <Wheel x={spots.wheel} layer="back" spinning={onWheel && pose.action === 'run'} dir={facing} />
        <Nest x={spots.bed} layer="back" />
        <Bowl x={spots.bowl} />
        <button
          type="button"
          className="habitat-bowl-hit"
          style={{ left: spots.bowl - 24 }}
          onClick={feed}
          aria-label="해바라기씨 주기"
        />
        <DeskBack x={spots.desk} />

        <div
          ref={actor}
          className="habitat-actor"
          style={{ zIndex: place === 'bed' || place === 'desk' ? 3 : 5 }}
          onClick={poke}
          role="button"
          tabIndex={-1}
          aria-label={`${name || '햄스터'} 쓰다듬기`}
        >
          <div
            className="habitat-lift"
            style={{ transform: `translateY(${-LIFT[place]}px) scale(${SCALE[place]})` }}
          >
            <div className={`habitat-flip pose-${pose.pose}`} style={{ transform: `scaleX(${facing})` }}>
              <HamsterSprite
                custom={custom}
                pose={pose}
                className={place === 'floor' ? '' : 'no-shadow'}
              />
            </div>
          </div>
          {heart > 0 && (
            <span key={heart} className="habitat-heart" aria-hidden>
              ♥
            </span>
          )}
        </div>

        {bubble && (
          <div
            key={bubble.key}
            ref={(el) => {
              bubbleEl.current = el;
              placeActor();
            }}
            className="habitat-bubble"
            style={{ bottom: 10 + 70 * SCALE[place] + LIFT[place] + 4 }}
            role="status"
          >
            {bubble.text}
          </div>
        )}
        <Nest x={spots.bed} layer="front" />
        <DeskFront x={spots.desk} custom={custom} mugTaken={place === 'desk' && pose.action === 'sip'} />
        <Wheel x={spots.wheel} layer="front" spinning={onWheel && pose.action === 'run'} dir={facing} />
        {mood === 'oneMore' && <div className="habitat-speech">조금만 더...</div>}
        {overtimeOn && <RotLayer />}
      </div>
      </div>
      <div className="habitat-status" aria-live="polite">
        {name || '햄스터'}
        {' · '}
        {label}
      </div>
    </div>
  );
}
