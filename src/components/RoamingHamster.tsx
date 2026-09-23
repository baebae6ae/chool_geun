import { useEffect, useRef, useState } from 'react';
import type { HamsterMood } from '../domain/schedule';
import type { Customization } from '../domain/types';
import { Hamster, type HamsterActivity } from './Hamster';

interface Props {
  custom: Customization;
  mood: HamsterMood;
}

const MIN_X = 6;
const MAX_X = 88;

/**
 * 작은 햄스터가 서식지 안을 스스로 뽈뽈뽈 돌아다니는 컴포넌트.
 * 켜놓고 지켜보는 화면이므로 사용자 조작 없이 자체 타이머로 걷고, 멈추고, 가끔 씨앗을 먹는다.
 * 출근 전/쉬는 날은 자지 않고 자리에 가만히 있는다(자는 모습).
 */
export function RoamingHamster({ custom, mood }: Props) {
  const resting = mood === 'beforeWork' || mood === 'holiday';
  const [x, setX] = useState(46);
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [activity, setActivity] = useState<HamsterActivity>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    if (resting) {
      setActivity('idle');
      return;
    }
    let alive = true;
    const schedule = (fn: () => void, ms: number) => {
      if (!alive) return;
      timer.current = setTimeout(fn, ms);
    };
    const tick = () => {
      if (Math.random() < 0.55) {
        setX((prev) => {
          const next = Math.min(MAX_X, Math.max(MIN_X, prev + (Math.random() * 44 - 22)));
          setFacing(next >= prev ? 'right' : 'left');
          return next;
        });
        setActivity('walking');
        schedule(tick, 2400 + Math.random() * 1800);
      } else {
        setActivity(Math.random() < 0.4 ? 'nibble' : 'idle');
        schedule(tick, 2200 + Math.random() * 2600);
      }
    };
    schedule(tick, 1200);
    return () => {
      alive = false;
      clearTimeout(timer.current);
    };
  }, [resting]);

  return (
    <div
      className="habitat-pet"
      style={{ left: `${x}%`, transform: `translate(-50%, 0) scaleX(${facing === 'left' ? -1 : 1})` }}
    >
      <Hamster custom={custom} mood={mood} bare activity={activity} />
    </div>
  );
}
