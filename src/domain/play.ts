/**
 * 방 안 물건 누르기 · 친밀도 · 누적 기록.
 * 캐릭터가 사용자를 살짝 얄밉게 놀리고, 쓰다듬고 간식 줄수록 친해진다.
 */
import type { FrontAction } from '../components/hamster/HamsterSprite';
import type { AppState } from './types';

export type Thing = 'window' | 'clock' | 'wheel' | 'nest' | 'desk';
export const THINGS: Thing[] = ['window', 'clock', 'wheel', 'nest', 'desk'];
export const THING_LABEL: Record<Thing, string> = { window: '창문', clock: '시계', wheel: '쳇바퀴', nest: '이불', desk: '노트북' };

/** 물건을 누르면 캐릭터가 하는 얄미운 움직임 */
export const THING_ACTION: Record<Thing, FrontAction> = {
  window: 'shrug',
  clock: 'smug',
  wheel: 'tongue',
  nest: 'smug',
  desk: 'slowclap',
};

type Rnd = () => number;
const pick = <T,>(list: T[], rnd: Rnd) => list[Math.floor(rnd() * list.length)];

const LINES: Record<Exclude<Thing, 'clock'>, string[]> = {
  window: [
    '밖에 뭐 있나 보시게요? 아무것도 없어요.',
    '날씨 좋네요. 저는 일하는 중이라 몰라요~',
    '창문은 눌러도 안 열려요. 에어컨 전기세 나가요.',
    '구름 구경 중이에요. 방해하지 마세요.',
    '나가고 싶죠? 저도요. 근데 월급이 안 나가게 해요.',
  ],
  wheel: [
    '지금 저한테 운동하라는 거예요? 싫은데요.',
    '쳇바퀴는 도는 거지 누르는 게 아니에요.',
    '저 오늘 이미 엄청 뛰었어요. 거짓말이에요.',
    '돌고 싶으면 직접 도세요. 자리 있어요.',
    '그거 누른다고 칼로리 안 빠져요.',
  ],
  nest: [
    '이불 만지지 마세요. 개인 공간이에요.',
    '여기는 제 비밀 기지예요. 노크하세요.',
    '졸려요. 방해하면 월급 깎아요. (농담)',
    '눌러도 일어나지 않아요… 일어났네요. 아쉽다.',
    '이불 속이 제일 안전해요. 퇴근 후엔 더요.',
  ],
  desk: [
    '열심히 일하는 척하는 중이에요. 건드리지 마세요.',
    '그 파일 이름 "최종_진짜최종_수정본"이에요. 열지 마세요.',
    '메일 확인 안 하고 있어요. 진짜예요.',
    '업무 중입니다. 아마도.',
    '노트북 눌러서 일이 끝나면 저도 눌러 볼게요.',
  ],
};

export type ClockPhase = 'before' | 'working' | 'done' | 'off';

/** 시계를 누르면: 남은 시간을 얄밉게 알려 준다 */
export function clockLine(phase: ClockPhase, remainMin: number, rnd: Rnd = Math.random): string {
  if (phase === 'off') return pick(['쉬는 날에 시계는 왜 봐요? 늦잠이나 자요.', '오늘은 시간 안 봐도 돼요. 부럽죠?', '시계는 쉬는 날에도 돌아요. 저도 돌고 싶어요.'], rnd);
  if (phase === 'before') return pick(['출근 전에 시계부터 봐요? 부지런하네요… 아니, 불안하네요.', '아직 출근 전이에요. 마음의 준비나 하세요.'], rnd);
  if (phase === 'done') return pick(['퇴근했는데 시계는 왜 봐요? 습관이에요?', '퇴근했어요! 시계는 이제 자유예요.'], rnd);
  const h = Math.floor(remainMin / 60);
  const m = Math.max(0, Math.round(remainMin % 60));
  const left = h > 0 ? `${h}시간 ${m}분` : `${m}분`;
  return pick(
    [
      `아직 ${left}이나 남았네요~ 시계 그만 보세요.`,
      `${left} 남았어요. 그걸 왜 저한테 물어봐요.`,
      '시계 보면 시간이 빨리 가나요? 아니요.',
      '째깍째깍. 퇴근은 제가 정하는 게 아니에요.',
      '그렇게 보셔도 시간은 똑같이 가요.',
    ],
    rnd,
  );
}

export function thingLine(thing: Thing, rnd: Rnd = Math.random): string {
  if (thing === 'clock') return clockLine('working', 60, rnd);
  return pick(LINES[thing], rnd);
}

/** 캐릭터를 눌렀을 때 얄밉게 구는 말 */
export const SNARK_PET = [
  '또 눌러요? 일하게 두세요.',
  '그만 만지세요. 털 눌려요.',
  '네네~ 귀엽죠. 알아요.',
  '손 치워요. 아니, 조금만 더…',
  '그렇게 심심해요? 저는 바쁜데요.',
  '눌러도 월급은 안 올라요.',
];

/* ---------- 친밀도 ---------- */

export const BOND_LEVELS = [0, 20, 60, 120, 200];
export const BOND_TITLES = ['서먹서먹', '낯이 익어요', '친구', '단짝', '둘도 없는 사이'];
export const DAILY_HEART_CAP = 10;

/** 하트 누적 수 → 1~5단계 */
export function bondLevel(hearts: number): number {
  let lv = 1;
  BOND_LEVELS.forEach((n, i) => {
    if (hearts >= n) lv = i + 1;
  });
  return lv;
}

/** 다음 단계까지 남은 하트 (마지막이면 null) */
export function heartsToNext(hearts: number): number | null {
  const lv = bondLevel(hearts);
  return lv >= BOND_LEVELS.length ? null : BOND_LEVELS[lv] - hearts;
}

export const BOND_LINES: Record<number, string[]> = {
  2: ['오늘도 와줬네요. 기다렸어요.', '쓰다듬는 손이 익숙해졌어요.', '자주 오니까 좋네요. 자주 오세요.'],
  3: ['우리 이제 친구죠?', '당신이 오면 기분이 좋아져요.', '오늘 있었던 일 들어줄래요? 아, 제 얘기요.'],
  4: ['단짝이니까 말해줄게요. 퇴근 시간, 매일 세어요.', '당신 없으면 심심해요.', '비밀인데… 당신이 제일 좋아요.'],
  5: ['둘도 없는 사이! 평생 같이 출근해요.', '이 방의 주인은 사실 당신이에요.', '월급보다 당신이 좋아요. 월급도 좋아요.'],
};

/** 친밀도에 맞는 말 (1단계는 없음) */
export function bondLine(level: number, rnd: Rnd = Math.random): string | null {
  const lv = Math.min(5, level);
  if (lv < 2) return null;
  // 지금 단계와 그 아래 단계 문구를 섞는다
  const pool = Object.entries(BOND_LINES)
    .filter(([k]) => Number(k) <= lv)
    .flatMap(([, v]) => v);
  return pick(pool, rnd);
}

const pad = (n: number) => String(n).padStart(2, '0');
const todayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** 하트 하나 쌓기 (하루 최대 10개). 단계가 올랐으면 새 단계를 알려 준다 */
export function addHeart(state: AppState, now: number): { state: AppState; leveledUp: number | null } {
  const key = todayKey(now);
  const bond = state.bond ?? { hearts: 0 };
  const used = bond.today?.date === key ? bond.today.n : 0;
  if (used >= DAILY_HEART_CAP) return { state, leveledUp: null };
  const hearts = bond.hearts + 1;
  const before = bondLevel(bond.hearts);
  const after = bondLevel(hearts);
  return { state: { ...state, bond: { hearts, today: { date: key, n: used + 1 } } }, leveledUp: after > before ? after : null };
}

/* ---------- 누적 기록 (업적용) ---------- */

export type StatKey = 'pet' | 'feed' | 'hug';

export function bumpStat(state: AppState, key: StatKey): AppState {
  const stats = state.stats ?? {};
  return { ...state, stats: { ...stats, [key]: (stats[key] ?? 0) + 1 } };
}

export function bumpThing(state: AppState, thing: Thing): AppState {
  const stats = state.stats ?? {};
  return { ...state, stats: { ...stats, things: { ...stats.things, [thing]: (stats.things?.[thing] ?? 0) + 1 } } };
}
