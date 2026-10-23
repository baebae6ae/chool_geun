/**
 * 드래곤 변신: 화나거나 스트레스 풀고 싶을 때 누르는 아무 맥락 없는 기능.
 * 내 캐릭터가 정통 판타지 그림체의 드래곤으로 변해 회사를 부수고, 결국 상상이었다는 걸 보여 주며 끝난다.
 * 부수는 장면은 할 때마다 랜덤으로 몇 개를 골라 보여 준다.
 */
import { createRng } from './random';

export type AttackId = 'fire' | 'claw' | 'crush' | 'tail' | 'roar' | 'dive';

export interface Attack {
  id: AttackId;
  name: string;
  /** 화면에 크게 박히는 효과음 */
  sfx: string;
  /** 판타지 자막 */
  caption: string;
}

export const ATTACKS: Attack[] = [
  { id: 'fire', name: '불 뿜기', sfx: '화르르르륵!!', caption: '본사, 불바다.' },
  { id: 'claw', name: '발톱 내려찍기', sfx: '콰아앙!!', caption: '결재 서류 탑, 소멸.' },
  { id: 'crush', name: '쥐어 부수기', sfx: '우지끈!!', caption: '프린터, 이제 안 걸린다.' },
  { id: 'tail', name: '꼬리 휩쓸기', sfx: '휘이익—!!', caption: '회의실, 회의 종료.' },
  { id: 'roar', name: '포효 충격파', sfx: '크롸아아아!!', caption: '유리창, 전부 와장창.' },
  { id: 'dive', name: '급강하 박치기', sfx: '쿠콰콰쾅!!', caption: '본사, 붕괴.' },
];

/** 이번 변신에서 보여 줄 부수기 장면 count개 (겹치지 않게 랜덤) */
export function pickAttacks(seed: string, count = 3): Attack[] {
  const rng = createRng(`dragon:${seed}`);
  const pool = [...ATTACKS];
  const out: Attack[] = [];
  while (out.length < count && pool.length) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}
