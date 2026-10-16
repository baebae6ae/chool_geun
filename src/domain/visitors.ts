/** 놀러 오는 손님 — 내 캐릭터와 다른 종이 가끔 방에 들러 간식을 먹고 간다 */
import { SPECIES } from './customization';
import type { AppState, HamsterColor, Species } from './types';

/** 손님으로 올 때 입는 털 색 (내 꾸미기와 상관없이 늘 같은 모습) */
export const VISITOR_COLOR: Record<Species, HamsterColor> = { hamster: 'golden', rabbit: 'white', bird: 'white', cat: 'cream', lop: 'cream' };

/** 한 번의 할 일이 끝날 때마다 손님이 올 확률. 대략 한두 시간에 한 번꼴 */
export const VISIT_CHANCE = 0.012;

export const VISITOR_LINES: Record<Species, { hello: string[]; bye: string[] }> = {
  hamster: { hello: ['찍찍! 놀러 왔어요', '간식 냄새가 나서요!'], bye: ['찍찍, 또 올게요!', '볼주머니 가득 챙겼어요'] },
  rabbit: { hello: ['깡총! 놀러 왔어요', '당근 있어요? 아, 없구나'], bye: ['깡총깡총, 또 올게요!', '귀가 쫑긋, 즐거웠어요'] },
  bird: { hello: ['짹짹! 놀러 왔어요', '창문으로 들어왔어요 (농담)'], bye: ['포르르~ 또 올게요!', '모이 잘 먹었어요, 짹'] },
  lop: { hello: ['귀 펄럭! 놀러 왔어요', '당근 냄새 따라왔어요'], bye: ['깡총깡총, 또 올게요!', '귀가 펄럭, 즐거웠어요'] },
  cat: { hello: ['야옹~ 놀러 왔어요', '그냥 지나가던 길이에요. 아닌데요'], bye: ['골골~ 또 올게요', '간식값은 다음에 줄게요. 아마도'] },
};

/** 손님으로 올 수 있는 종: 내 캐릭터를 뺀 나머지 (히든 캐릭터는 손님으로 오지 않고, 롭이어를 키우면 토끼도 같은 종이라 빠진다) */
export function visitorChoices(main: Species | undefined): Species[] {
  const me = main === 'lop' ? 'rabbit' : (main ?? 'hamster');
  return SPECIES.filter((s) => !s.hidden && s.id !== me).map((s) => s.id);
}

export function pickVisitor(main: Species | undefined, rnd: () => number = Math.random): Species {
  const list = visitorChoices(main);
  return list[Math.floor(rnd() * list.length)];
}

export function recordVisit(state: AppState, species: Species, now: number): AppState {
  const prev = state.visitors?.[species];
  return { ...state, visitors: { ...state.visitors, [species]: { first: prev?.first ?? now, count: (prev?.count ?? 0) + 1 } } };
}
