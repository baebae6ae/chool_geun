/**
 * 드래곤 변신: 화나거나 스트레스 풀고 싶을 때 누르는 아무 맥락 없는 기능.
 * 열받는 메시지 → 분노 게이지 999% → 정통 판타지 드래곤으로 변신해 본사를 부수고 → 결국 상상이었다.
 * 분노 원인·주문·부수기 장면·현실 복귀 엔딩은 할 때마다 랜덤으로 고른다.
 * 부수기 장면은 dragon.json 데이터라서 사이트에 올리면 앱 업데이트 없이 늘어난다 (썰 극장과 같은 방식).
 */
import { createRng } from './random';
import bundled from '../content/dragon.json';

/** 장면 위에 얹는 효과 */
export type Fx = 'fire' | 'debris' | 'rings' | 'glass' | 'lines' | 'embers' | 'flare';
const FX = new Set<string>(['fire', 'debris', 'rings', 'glass', 'lines', 'embers', 'flare']);

/**
 * 부수기 장면 하나. 그림과 연출은 데이터라서, 새 장면은 dragon.json에 더해 올리면 앱 업데이트 없이 받아진다.
 * img는 사이트 기준 경로(dragon/xxx.webp), cam은 카메라 시작·끝 transform, hit은 쾅 하는 순간(ms),
 * at은 효과가 터지는 화면 위치(%), fit이 frame이면 정사각형 그림을 영화처럼 띠를 두르고 가운데 둔다.
 */
export interface Attack {
  id: string;
  name: string;
  img: string;
  /** 화면에 크게 박히는 효과음 */
  sfx: string;
  /** 판타지 자막 (직장 개그) */
  caption: string;
  /** 칠 때 튀는 데미지 숫자 */
  damage: string;
  cam: [string, string];
  hit: number;
  fx: Fx[];
  at: [number, number];
  fit?: 'cover' | 'frame';
  /** 그림 주소 (불러올 때 채운다) */
  src?: string;
}

const isStr = (v: unknown, max = 80): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;
const isNum = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
/** 카메라는 scale·translate·rotate만 (숫자와 %·deg·px) */
const CAM = /^(\s*(scale|rotate|translate|translateX|translateY)\(\s*-?[\d.]+(%|deg|px)?(\s*,\s*-?[\d.]+(%|deg|px)?)?\s*\))+\s*$/;

/** 인터넷에서 받은 장면이 엔진이 그릴 수 있는 형태인지 확인한다 (틀린 장면은 건너뛴다) */
export function validAttack(x: unknown): x is Attack {
  const a = x as Attack;
  try {
    return (
      !!a &&
      isStr(a.id, 30) && /^[a-z0-9-]+$/.test(a.id) &&
      isStr(a.name, 30) &&
      isStr(a.img, 60) && /^dragon\/[a-z0-9-]+\.(webp|png|jpg)$/.test(a.img) &&
      isStr(a.sfx, 30) && isStr(a.caption, 60) && isStr(a.damage, 40) &&
      Array.isArray(a.cam) && a.cam.length === 2 && a.cam.every((c) => isStr(c) && CAM.test(c)) &&
      isNum(a.hit, 0, 3000) &&
      Array.isArray(a.fx) && a.fx.every((f) => FX.has(f)) &&
      Array.isArray(a.at) && a.at.length === 2 && a.at.every((v) => isNum(v, 0, 100)) &&
      (a.fit === undefined || a.fit === 'cover' || a.fit === 'frame')
    );
  } catch {
    return false;
  }
}

/** 사이트 주소: 장면 목록과 앱에 없는 새 그림을 여기서 받는다 */
export const DRAGON_SITE = 'https://baebae6ae.github.io/chool_geun/';
const CACHE_KEY = 'hamster-dragon:v1';
const BASE: string = import.meta.env.BASE_URL ?? './';

const BUNDLED: Attack[] = (bundled.attacks as unknown[]).filter(validAttack);
const BUNDLED_IMG = new Set(BUNDLED.map((a) => a.img));
/** 앱에 들어 있는 그림은 앱 안에서, 새로 받은 그림은 사이트에서 */
const withSrc = (a: Attack): Attack => ({ ...a, src: BUNDLED_IMG.has(a.img) ? `${BASE}${a.img}` : `${DRAGON_SITE}${a.img}` });

function readCache(): Attack[] {
  try {
    const d = JSON.parse(localStorage.getItem(CACHE_KEY) ?? 'null');
    return Array.isArray(d?.attacks) ? d.attacks.filter(validAttack) : [];
  } catch {
    return [];
  }
}
let remote: Attack[] = typeof localStorage === 'undefined' ? [] : readCache();

/** 앱에 든 장면 + 받아 둔 장면 (같은 id면 받아 둔 쪽이 최신) */
export function allAttacks(): Attack[] {
  const map = new Map(BUNDLED.map((a) => [a.id, a]));
  for (const a of remote) map.set(a.id, a);
  return [...map.values()].map(withSrc);
}

/** 사이트에서 장면 목록을 받아 기기에 저장한다. 실패하면 조용히 넘어간다. 새로 받았으면 true */
export async function refreshDragon(fetcher: typeof fetch = fetch): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetcher(`${DRAGON_SITE}dragon.json?h=${Math.floor(Date.now() / 3_600_000)}`, { cache: 'no-cache', signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return false;
    const d = await r.json();
    const list: Attack[] = Array.isArray(d?.attacks) ? d.attacks.filter(validAttack) : [];
    if (!list.length) return false;
    const changed = JSON.stringify(list) !== JSON.stringify(remote);
    remote = list;
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ attacks: list }));
    } catch {
      // 저장 못 해도 이번 실행 동안은 쓴다
    }
    return changed;
  } catch {
    return false;
  }
}

/** 테스트용: 받아 둔 장면 바꾸기 */
export function __setRemoteAttacks(list: Attack[]) {
  remote = list;
}

/** 변신 직전에 날아오는 열받는 메시지 */
export interface RageLine {
  from: string;
  time: string;
  text: string;
}

export const RAGE_LINES: RageLine[] = [
  { from: '팀장님', time: '오후 5:52', text: '이거 오늘까지 가능하죠? 아 퇴근 8분 전이구나 ㅎㅎ 화이팅~' },
  { from: '팀장님', time: '오전 10:14', text: '어제 김대리가 만든 거 내가 한 걸로 보고 올렸어 ㅎㅎ 반응 좋더라~ 고마워' },
  { from: '부장님', time: '오후 3:40', text: '연봉은 회사가 어려워서 동결이야. 아 참, 나 이번에 차 바꿨어 ㅎㅎ' },
  { from: '팀장님', time: '오후 11:47', text: '자니? 내일 아침 8시까지 보고서 수정 좀~ 별거 아니야' },
  { from: '팀장님', time: '오후 4:30', text: '내가 언제 A안으로 하랬어? 처음부터 다시 해 와. 오늘 안에' },
  { from: '부장님', time: '오후 6:01', text: '벌써 가? 요즘 애들은 참 칼퇴가 당연한 줄 알더라~' },
  { from: '팀장님', time: '오후 2:15', text: '연차? 그날은 좀… 다들 바쁜데 눈치 좀 챙기자 ㅎㅎ' },
  { from: '팀장님', time: '토요일 오전 9:03', text: '주말에 미안~ 진짜 잠깐만 확인해 줘. 5분이면 돼' },
  { from: '부장님', time: '오후 7:20', text: '야근 수당? 우리 포괄임금제인 거 몰랐어? ㅎㅎ' },
  { from: '옆팀 과장', time: '오전 11:02', text: '그거 그쪽 팀 일 아니었어요? 저희는 모르는 일인데요~ ^^' },
  { from: '팀장님', time: '오후 5:58', text: '아 맞다 오늘 회식이야! 다들 당연히 오는 거지? 빠지면 서운해~' },
  { from: '팀장님', time: '오전 9:01', text: '김대리 표정이 왜 그래? 웃어~ 회사는 가족 같은 곳이잖아 ㅎㅎ' },
];

/** 변신 주문 */
export const SPELLS: string[] = [
  '봉인 해제… 연봉 동결의 힘이여!',
  '깨어나라… 야근 1,000시간의 분노여!',
  '지금 이 순간, 나는 퇴사보다 강하다!',
  '포괄임금의 저주여… 불꽃이 되어라!',
];

/** 현실 복귀 엔딩 */
export type EndingId = 'boss' | 'keyboard' | 'cup' | 'loop' | 'fact';
export const ENDINGS: EndingId[] = ['boss', 'keyboard', 'cup', 'loop', 'fact'];

export interface DragonPlan {
  rage: RageLine;
  spell: string;
  attacks: Attack[];
  ending: EndingId;
}

/** 이번 변신에서 보여 줄 것들 (부수기 장면은 count개, 겹치지 않게) */
export function planDragon(seed: string, count = 3, list: Attack[] = allAttacks()): DragonPlan {
  const rng = createRng(`dragon:${seed}`);
  const pick = <T,>(items: T[]) => items[Math.floor(rng() * items.length)];
  const pool = [...list];
  const attacks: Attack[] = [];
  while (attacks.length < count && pool.length) attacks.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return { rage: pick(RAGE_LINES), spell: pick(SPELLS), attacks, ending: pick(ENDINGS) };
}

