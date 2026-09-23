import { describe, expect, it } from 'vitest';
import type { HamsterMood } from '../../domain/schedule';
import { entrance, exitScene, initialScene, planErrand, spotsFor, travel, type Step } from './brain';

const S = spotsFor(358);
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const MOODS: HamsterMood[] = ['holiday', 'beforeWork', 'arriving', 'starting', 'working', 'break', 'almostDone', 'oneMore', 'off'];

describe('habitat brain', () => {
  it('소품 위치가 왼쪽부터 쳇바퀴 → 돌아다닐 곳 → 가방 → 책상 순서', () => {
    for (const W of [300, 358, 448]) {
      const s = spotsFor(W);
      expect(s.wheel).toBeLessThan(s.wanderMin);
      expect(s.wanderMin).toBeLessThanOrEqual(s.wanderMax);
      expect(s.wanderMax).toBeLessThan(s.bag);
      expect(s.bag).toBeLessThan(s.desk);
      expect(s.desk).toBeLessThan(W);
    }
  });

  it('가까우면 종종걸음, 멀면 뽈뽈뽈 달리다 멈춰 두리번거리며 정확히 목적지에 도착', () => {
    expect(travel(100, 140, Math.random)).toEqual([{ t: 'move', to: 140, gait: 'walk' }]);
    const steps = travel(20, 330, seeded(3));
    const moves = steps.filter((s): s is Extract<Step, { t: 'move' }> => s.t === 'move');
    expect(moves.length).toBeGreaterThan(1);
    expect(moves.every((m) => m.gait === 'run')).toBe(true);
    expect(moves.at(-1)!.to).toBe(330);
    for (let i = 1; i < moves.length; i++) expect(moves[i].to).toBeGreaterThan(moves[i - 1].to);
    // 달리기 사이사이에 멈춰서 살피는 동작이 있다
    expect(steps.some((s) => s.t === 'act')).toBe(true);
  });

  it('모든 근무 상태에서 할 일을 만들고, 같은 일을 연달아 하지 않는다', () => {
    const rnd = seeded(42);
    for (const mood of MOODS) {
      let last: string | undefined;
      let x = S.desk;
      for (let i = 0; i < 60; i++) {
        const plan = planErrand(mood, S, x, rnd, last);
        expect(plan.steps.length).toBeGreaterThan(0);
        if (!['oneMore', 'off'].includes(mood)) expect(plan.name).not.toBe(last);
        for (const st of plan.steps) {
          if (st.t === 'move') {
            expect(st.to).toBeGreaterThanOrEqual(0);
            expect(st.to).toBeLessThanOrEqual(S.W);
            x = st.to;
          }
        }
        last = plan.name;
      }
    }
  });

  it('근무 중엔 책상·쳇바퀴·씨앗 그릇을 오가며 여러 가지를 한다', () => {
    const rnd = seeded(7);
    const names = new Set<string>();
    let last: string | undefined;
    for (let i = 0; i < 80; i++) {
      last = planErrand('working', S, S.desk, rnd, last).name;
      names.add(last);
    }
    expect([...names].sort()).toEqual(['eat', 'groom', 'sip', 'type', 'wander', 'wheel', 'yawn']);
  });

  it('의자 위에서 세수하면 의자에서 내려오지 않는다', () => {
    for (let i = 0; i < 40; i++) {
      const plan = planErrand('working', S, S.desk, seeded(i), undefined, 'desk');
      if (plan.name === 'groom' || plan.name === 'yawn') {
        expect(plan.steps).toHaveLength(1);
        expect(plan.steps[0]).toMatchObject({ t: 'act', place: 'desk' });
      }
    }
  });

  it('출근: 가방 메고 문밖에서 들어와 가방을 내려놓는다 / 퇴근: 다시 메고 나간다', () => {
    const inn = entrance(S, seeded(1));
    expect(inn[0]).toMatchObject({ t: 'set', visible: true, backpack: true, x: S.exit });
    expect(inn.some((s) => s.t === 'set' && s.backpack === false && s.bagOnFloor === true)).toBe(true);
    const out = exitScene(S, S.desk, seeded(1));
    const moves = out.filter((s) => s.t === 'move');
    expect(moves.at(-1)).toMatchObject({ to: S.exit });
    expect(out.some((s) => s.t === 'set' && s.visible === false)).toBe(true);
    expect(out.findIndex((s) => s.t === 'set' && s.backpack === true)).toBeLessThan(out.findIndex((s) => s.t === 'set' && s.visible === false));
  });

  it('처음 열었을 때: 출근 전엔 자고, 퇴근 후엔 없고, 근무 중엔 책상에 있다', () => {
    expect(initialScene('beforeWork', S)[1]).toMatchObject({ t: 'act', place: 'bed', pose: { pose: 'side', action: 'sleep' } });
    expect(initialScene('off', S)[0]).toMatchObject({ t: 'set', visible: false });
    expect(initialScene('working', S)[1]).toMatchObject({ t: 'act', place: 'desk', pose: { action: 'type' } });
  });
});
