/**
 * 햄스터의 "뇌" — 근무 상태(mood)에 따라 다음에 할 일을 정한다. 순수 함수라 테스트 가능.
 * 결과는 Step 목록이며, Habitat이 하나씩 실행한다.
 */
import type { HamsterMood } from '../../domain/schedule';
import type { FrontAction, Pose, SideAction } from '../hamster/HamsterSprite';

export type Place = 'floor' | 'wheel' | 'desk' | 'bed';

export type Step =
  | { t: 'move'; to: number; gait: 'walk' | 'run' }
  | { t: 'act'; pose: Pose; ms: number; place: Place }
  | { t: 'set'; backpack?: boolean; bagOnFloor?: boolean; visible?: boolean; x?: number; facing?: 1 | -1 };

export interface Spots {
  W: number;
  wheel: number;
  bowl: number;
  eat: number;
  bed: number;
  desk: number;
  bag: number;
  exit: number;
  wanderMin: number;
  wanderMax: number;
}

export function spotsFor(W: number): Spots {
  const wheel = Math.max(52, W * 0.13);
  const bowl = W * 0.36;
  const bed = W * 0.58;
  const desk = W - Math.max(48, W * 0.15);
  return {
    W,
    wheel,
    bowl,
    eat: bowl + 30,
    bed,
    desk,
    bag: desk - 64,
    exit: W + 60,
    wanderMin: wheel + 78,
    wanderMax: desk - 100,
  };
}

type Rnd = () => number;
const between = (rnd: Rnd, a: number, b: number) => a + (b - a) * rnd();

const front = (action: FrontAction, ms: number, place: Place = 'floor'): Step => ({
  t: 'act',
  pose: { pose: 'front', action },
  ms,
  place,
});
const side = (action: SideAction, ms: number, place: Place = 'floor'): Step => ({
  t: 'act',
  pose: { pose: 'side', action },
  ms,
  place,
});

/**
 * 이동을 "뽈뽈뽈 — 멈칫, 킁킁 — 뽈뽈뽈" 로 쪼갠다.
 * 짧으면 종종걸음, 길면 빠르게 달리다 중간중간 멈춰 서서 주위를 살핀다.
 */
export function travel(from: number, to: number, rnd: Rnd, lazy = false): Step[] {
  const dist = Math.abs(to - from);
  if (dist < 4) return [];
  if (lazy || dist < 70) return [{ t: 'move', to, gait: 'walk' }];
  const steps: Step[] = [];
  const dir = Math.sign(to - from);
  let x = from;
  while (Math.abs(to - x) > 110) {
    x += dir * between(rnd, 60, 110);
    steps.push({ t: 'move', to: x, gait: 'run' });
    steps.push(rnd() < 0.5 ? side('stand', between(rnd, 250, 650)) : front('sniff', between(rnd, 500, 1100)));
  }
  steps.push({ t: 'move', to, gait: 'run' });
  return steps;
}

type Errand = (x: number) => Step[];
type Choice = [name: string, weight: number, errand: Errand];

/** 가중치 랜덤. 직전에 한 일은 연달아 고르지 않는다. */
function weighted(rnd: Rnd, list: Choice[], last?: string): [string, Errand] {
  const pool = list.length > 1 ? list.filter(([n]) => n !== last) : list;
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [n, w, e] of pool) {
    r -= w;
    if (r <= 0) return [n, e];
  }
  const [n, , e] = pool[pool.length - 1];
  return [n, e];
}

/** 다음 할 일 하나(여러 Step)를 고른다. name은 다음 호출에 last로 넘겨 반복을 피한다. */
export function planErrand(
  mood: HamsterMood,
  s: Spots,
  x: number,
  rnd: Rnd = Math.random,
  last?: string,
  here: Place = 'floor',
): { name: string; steps: Step[] } {
  const go = (to: number, lazy = false) => travel(x, to, rnd, lazy);
  const wanderTo = () => between(rnd, s.wanderMin, Math.max(s.wanderMin + 1, s.wanderMax));
  // 제자리 행동: 의자 위면 의자 위에서, 쳇바퀴/둥지면 살짝 비켜나서
  const inPlace = (step: Step): Step[] => {
    if (here === 'desk' && step.t === 'act') return [{ ...step, place: 'desk' }];
    if (here === 'wheel' || here === 'bed') return [...go(wanderTo()), step];
    return [step];
  };

  const typeAtDesk: Errand = () => [...go(s.desk), front('type', between(rnd, 6000, 11000), 'desk')];
  const sipAtDesk: Errand = () => [...go(s.desk), front('sip', between(rnd, 4000, 6500), 'desk')];
  const wheel: Errand = () => [...go(s.wheel), side('run', between(rnd, 5000, 9000), 'wheel'), side('stand', 800, 'wheel')];
  const eat: Errand = () => [...go(s.eat), front('nibble', between(rnd, 4000, 7500))];
  const groom: Errand = () => inPlace(front('groom', between(rnd, 2400, 3600)));
  const wander: Errand = () => [...go(wanderTo()), front('sniff', between(rnd, 1400, 2800))];
  const yawn: Errand = () => inPlace(front('yawn', 2800));
  const nap: Errand = () => [...go(s.bed, true), side('sleep', between(rnd, 7000, 12000), 'bed'), front('yawn', 2800)];
  const look: Errand = () => inPlace(front('look', between(rnd, 2500, 4000)));
  const pace: Errand = () => {
    const a = wanderTo();
    const b = wanderTo();
    return [...travel(x, a, rnd, true), side('stand', 500), ...travel(a, b, rnd, true), front('look', 2000)];
  };
  const sleepLong: Errand = () => [...go(s.bed, true), side('sleep', between(rnd, 15000, 30000), 'bed')];
  const wakeUp: Errand = () => [...go(s.bed, true), side('sleep', 6000, 'bed'), front('yawn', 2800), front('groom', 3000)];

  let list: Choice[];
  switch (mood) {
    case 'beforeWork':
    case 'holiday':
      list = [
        ['sleep', 4, sleepLong],
        ['wake', 1.2, wakeUp],
        ['eat', 0.8, eat],
      ];
      break;
    case 'arriving':
    case 'starting':
    case 'working':
      list = [
        ['type', 4, typeAtDesk],
        ['wheel', 2, wheel],
        ['eat', 2, eat],
        ['groom', 1.5, groom],
        ['wander', 2, wander],
        ['yawn', 0.7, yawn],
        ['sip', 1, sipAtDesk],
      ];
      break;
    case 'break':
      list = [
        ['eat', 4, eat],
        ['sip', 1.5, sipAtDesk],
        ['groom', 2, groom],
        ['wander', 2, wander],
        ['nap', 1.5, nap],
        ['wheel', 1, wheel],
      ];
      break;
    case 'almostDone':
      list = [
        ['type', 3, typeAtDesk],
        ['look', 3, look],
        ['pace', 3, pace],
        ['groom', 1, groom],
      ];
      break;
    case 'oneMore':
      return { name: 'typeFast', steps: [...go(s.desk), front('typeFast', 6000, 'desk')] };
    case 'off':
      return { name: 'gone', steps: [{ t: 'set', visible: false }, front('idle', 60000)] };
  }
  const [name, errand] = weighted(rnd, list, last);
  return { name, steps: errand(x) };
}

/** 처음 화면을 열었을 때 이미 하고 있던 일 */
export function initialScene(mood: HamsterMood, s: Spots, rnd: Rnd = Math.random): Step[] {
  switch (mood) {
    case 'beforeWork':
    case 'holiday':
      return [{ t: 'set', visible: true, x: s.bed, backpack: false, bagOnFloor: false }, side('sleep', between(rnd, 8000, 16000), 'bed')];
    case 'arriving':
      return entrance(s, rnd);
    case 'break':
      return [{ t: 'set', visible: true, x: s.eat, backpack: false, bagOnFloor: true }, front('nibble', between(rnd, 3000, 6000))];
    case 'off':
      return [{ t: 'set', visible: false, backpack: false, bagOnFloor: false }, front('idle', 60000)];
    default:
      return [{ t: 'set', visible: true, x: s.desk, backpack: false, bagOnFloor: true }, front(mood === 'oneMore' ? 'typeFast' : 'type', between(rnd, 3000, 7000), 'desk')];
  }
}

/** 출근: 가방 메고 문 쪽에서 들어와 책상 옆에 가방을 내려놓는다 */
export function entrance(s: Spots, rnd: Rnd = Math.random): Step[] {
  return [
    { t: 'set', visible: true, x: s.exit, backpack: true, bagOnFloor: false, facing: -1 },
    ...travel(s.exit, s.bag - 36, rnd),
    front('wave', 1600),
    { t: 'set', backpack: false, bagOnFloor: true },
    front('yawn', 2800),
  ];
}

/** 퇴근: 가방을 다시 메고 손 흔들고 문 밖으로 */
export function exitScene(s: Spots, x: number, rnd: Rnd = Math.random): Step[] {
  return [
    ...travel(x, s.bag - 36, rnd),
    { t: 'set', backpack: true, bagOnFloor: false },
    front('wave', 1600),
    ...travel(s.bag - 36, s.exit, rnd),
    { t: 'set', visible: false },
    front('idle', 60000),
  ];
}

export const ACTIVITY_LABEL: Record<FrontAction | SideAction, string> = {
  idle: '멍 때리는 중',
  sniff: '킁킁 탐색 중',
  groom: '세수하는 중',
  nibble: '해바라기씨 먹는 중',
  yawn: '하아암~',
  sip: '커피 마시는 중',
  look: '시계 보는 중',
  type: '열일 중',
  typeFast: '막판 스퍼트!',
  wave: '안녕!',
  stand: '두리번두리번',
  walk: '종종종 걷는 중',
  run: '뽈뽈뽈 달리는 중',
  sleep: '쿨쿨 자는 중',
};
