import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { HamsterMood } from '../../domain/schedule';
import type { Customization } from '../../domain/types';
import { HamsterSprite, type Pose } from '../hamster/HamsterSprite';
import { ACTIVITY_LABEL, endDay, initialScene, planErrand, spotsFor, startDay, type Place, type Step } from './brain';
import { Bowl, DeskBack, DeskFront, Floor, Nest, WallClock, Wheel, Window } from './props';
import './habitat.css';

interface Props {
  custom: Customization;
  mood: HamsterMood;
  name: string;
  now: number;
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
export function Habitat({ custom, mood, name, now }: Props) {
  const box = useRef<HTMLDivElement>(null);
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
  spotsRef.current = spots;

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

  // 폭 측정
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => setW(el.clientWidth || 358);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 근무 상태 변화 → 할 일 다시 짜기
  useEffect(() => {
    const prev = moodRef.current;
    moodRef.current = mood;
    const W0 = box.current?.clientWidth || 358;
    const s = started.current ? spotsRef.current : spotsFor(W0);
    if (!started.current) {
      started.current = true;
      const snap = readSnapshot(mood, W0);
      queue.current = snap ? snap.queue : initialScene(mood, s);
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
  }, [mood]);

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
        if (queue.current.length === 0) {
          const plan = planErrand(moodRef.current, spotsRef.current, x.current, Math.random, lastErrand.current, viewRef.current.place);
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

  // 쓰다듬기: 하던 일을 잠깐 멈추고 손 흔들기
  const poke = () => {
    if (cur.current?.step.t === 'move') return;
    const place = viewRef.current.place;
    if (place === 'bed') {
      queue.current.unshift({ t: 'act', pose: { pose: 'front', action: 'yawn' }, ms: 2800, place: 'floor' });
    } else {
      queue.current.unshift({ t: 'act', pose: { pose: 'front', action: 'wave' }, ms: 1500, place });
    }
    cur.current = null;
    setHeart((h) => h + 1);
  };

  const { pose, place, facing } = view;
  const onWheel = place === 'wheel';
  const label =
    onWheel && pose.action === 'run'
      ? '쳇바퀴 도는 중'
      : pose.action === 'sleep'
        ? (SLEEP_LABEL[mood] ?? ACTIVITY_LABEL.sleep)
        : ACTIVITY_LABEL[pose.action];

  return (
    <div className="habitat-wrap">
      <div className="habitat" ref={box}>
        <Window x={spots.bowl + (spots.bed - spots.bowl) / 2} now={now} />
        <WallClock x={spots.desk} now={now} />
        <Floor />
        <Wheel x={spots.wheel} layer="back" spinning={onWheel && pose.action === 'run'} dir={facing} />
        <Nest x={spots.bed} layer="back" />
        <Bowl x={spots.bowl} />
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

        <Nest x={spots.bed} layer="front" />
        <DeskFront x={spots.desk} custom={custom} mugTaken={place === 'desk' && pose.action === 'sip'} />
        <Wheel x={spots.wheel} layer="front" spinning={onWheel && pose.action === 'run'} dir={facing} />
        {mood === 'oneMore' && <div className="habitat-speech">조금만 더...</div>}
      </div>
      <div className="habitat-status" aria-live="polite">
        {name || '햄스터'}
        {' · '}
        {label}
      </div>
    </div>
  );
}
