/**
 * 대한민국 공휴일 — 연도에 상관없이 규칙으로 계산한다.
 *  - 양력 공휴일 (「관공서의 공휴일에 관한 규정」)
 *  - 음력 명절: 설날·부처님오신날·추석 (브라우저 내장 한국 음력 달력 `dangi`로 변환)
 *  - 대체공휴일 (2023년 개정 규칙)
 *  - 선거일 (공직선거법의 선거일 규칙)
 * 정부가 그때그때 지정하는 임시공휴일은 미리 알 수 없어서 알려진 것만 적어 두고,
 * 나머지는 사용자가 달력에서 직접 쉬는 날로 표시할 수 있다.
 */
import { addDays, weekday } from './date';

/** 이미 지정된 임시공휴일 */
const ONE_OFF: Record<string, string> = {
  '2025-01-27': '임시공휴일',
};

type SubRule = 'none' | 'weekend' | 'weekendOrOverlap' | 'sundayOrOverlap';
interface Group {
  name: string;
  days: string[];
  sub: SubRule;
}

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

/* ---------- 음력 → 양력 ---------- */

let lunarFmt: Intl.DateTimeFormat | null | undefined;
function lunarFormatter(): Intl.DateTimeFormat | null {
  if (lunarFmt !== undefined) return lunarFmt;
  for (const cal of ['dangi', 'chinese']) {
    try {
      const f = new Intl.DateTimeFormat(`en-u-ca-${cal}`, { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric' });
      if (f.resolvedOptions().calendar === cal) return (lunarFmt = f);
    } catch {
      // 지원 안 함
    }
  }
  return (lunarFmt = null);
}

/** 양력 날짜의 음력 월/일 (윤달이면 leap) */
export function lunarOf(key: string): { month: number; day: number; leap: boolean } | null {
  const f = lunarFormatter();
  if (!f) return null;
  const parts = f.formatToParts(new Date(`${key}T12:00:00+09:00`));
  const m = parts.find((p) => p.type === 'month')?.value ?? '';
  const d = parts.find((p) => p.type === 'day')?.value ?? '';
  return { month: parseInt(m, 10), day: parseInt(d, 10), leap: /bis|\D$/.test(m) };
}

/** 양력 from~to 사이에서 음력 month/day(평달)인 날 */
function findLunar(from: string, to: string, month: number, day: number): string | null {
  for (let k = from; k <= to; k = addDays(k, 1)) {
    const l = lunarOf(k);
    if (l && !l.leap && l.month === month && l.day === day) return k;
  }
  return null;
}

/* ---------- 선거일 ---------- */

/** 기준일 이후 첫 번째 수요일 */
function firstWedOnOrAfter(key: string): string {
  let k = key;
  while (weekday(k) !== 3) k = addDays(k, 1);
  return k;
}

/** 선거일이 공휴일이거나 그 전날·다음날이 공휴일이면 다음 주 수요일 */
function electionDay(nominal: string, isHoliday: (k: string) => boolean): string {
  let k = nominal;
  for (let i = 0; i < 4 && (isHoliday(k) || isHoliday(addDays(k, -1)) || isHoliday(addDays(k, 1))); i++) k = addDays(k, 7);
  return k;
}

function elections(y: number, isHoliday: (k: string) => boolean): Record<string, string> {
  const out: Record<string, string> = {};
  if (y === 2025) out['2025-06-03'] = '대통령 선거';
  if (y === 2026) out['2026-06-03'] = '지방선거';
  // 국회의원 선거: 임기만료일(5/29) 전 50일 이후 첫 수요일
  if (y >= 2028 && (y - 2028) % 4 === 0) out[electionDay(firstWedOnOrAfter(addDays(ymd(y, 5, 29), -50)), isHoliday)] = '국회의원 선거';
  // 지방선거: 임기만료일(6/30) 전 30일 이후 첫 수요일
  if (y >= 2030 && (y - 2030) % 4 === 0) out[electionDay(firstWedOnOrAfter(addDays(ymd(y, 6, 30), -30)), isHoliday)] = '지방선거';
  // 대통령 선거: 임기만료일(6/3) 전 70일 이후 첫 수요일
  if (y >= 2030 && (y - 2030) % 5 === 0) out[electionDay(firstWedOnOrAfter(addDays(ymd(y, 6, 3), -70)), isHoliday)] = '대통령 선거';
  return out;
}

/* ---------- 한 해의 공휴일 ---------- */

const cache = new Map<number, Record<string, string>>();

export function holidaysOf(y: number): Record<string, string> {
  const hit = cache.get(y);
  if (hit) return hit;

  const groups: Group[] = [
    { name: '신정', days: [ymd(y, 1, 1)], sub: 'none' },
    { name: '삼일절', days: [ymd(y, 3, 1)], sub: 'weekend' },
    { name: y >= 2026 ? '노동절' : '근로자의 날', days: [ymd(y, 5, 1)], sub: 'none' },
    { name: '어린이날', days: [ymd(y, 5, 5)], sub: 'weekendOrOverlap' },
    { name: '현충일', days: [ymd(y, 6, 6)], sub: 'none' },
    { name: '광복절', days: [ymd(y, 8, 15)], sub: 'weekend' },
    { name: '개천절', days: [ymd(y, 10, 3)], sub: 'weekend' },
    { name: '한글날', days: [ymd(y, 10, 9)], sub: 'weekend' },
    { name: '성탄절', days: [ymd(y, 12, 25)], sub: 'weekend' },
  ];
  if (y >= 2026) groups.push({ name: '제헌절', days: [ymd(y, 7, 17)], sub: 'weekend' });

  const seol = findLunar(ymd(y, 1, 19), ymd(y, 2, 21), 1, 1);
  if (seol) groups.push({ name: '설날', days: [addDays(seol, -1), seol, addDays(seol, 1)], sub: 'sundayOrOverlap' });
  const buddha = findLunar(ymd(y, 4, 18), ymd(y, 6, 1), 4, 8);
  if (buddha) groups.push({ name: '부처님오신날', days: [buddha], sub: 'weekend' });
  const chuseok = findLunar(ymd(y, 9, 5), ymd(y, 10, 10), 8, 15);
  if (chuseok) groups.push({ name: '추석', days: [addDays(chuseok, -1), chuseok, addDays(chuseok, 1)], sub: 'sundayOrOverlap' });

  // 이름 붙이기 (같은 날 여러 공휴일이면 함께 표시)
  const names: Record<string, string[]> = {};
  const add = (k: string, n: string) => (names[k] ??= []).includes(n) || names[k].push(n);
  for (const g of groups) {
    g.days.forEach((k, i) => add(k, g.days.length === 3 && i !== 1 ? `${g.name} 연휴` : g.name));
  }
  for (const [k, n] of Object.entries(ONE_OFF)) if (k.startsWith(`${y}-`)) add(k, n);
  const isBase = (k: string) => !!names[k];
  for (const [k, n] of Object.entries(elections(y, isBase))) add(k, n);

  // 대체공휴일: 토요일·공휴일이 아닌 첫 날
  const subs = new Set<string>();
  const nextFree = (after: string) => {
    let k = addDays(after, 1);
    while (weekday(k) === 0 || weekday(k) === 6 || names[k] || subs.has(k)) k = addDays(k, 1);
    return k;
  };
  const overlaps = (k: string) => (names[k]?.length ?? 0) > 1;
  for (const g of [...groups].sort((a, b) => a.days[0].localeCompare(b.days[0]))) {
    let need = 0;
    for (const k of g.days) {
      const wd = weekday(k);
      const overlap = overlaps(k);
      if (g.sub === 'weekend' && (wd === 0 || wd === 6)) need++;
      else if (g.sub === 'weekendOrOverlap' && (wd === 0 || wd === 6 || overlap)) need++;
      else if (g.sub === 'sundayOrOverlap' && (wd === 0 || overlap)) need++;
    }
    let last = g.days[g.days.length - 1];
    for (let i = 0; i < need; i++) {
      last = nextFree(last);
      subs.add(last);
    }
  }

  const out: Record<string, string> = {};
  for (const [k, n] of Object.entries(names)) out[k] = n.join('·');
  for (const k of subs) out[k] = '대체공휴일';
  cache.set(y, out);
  return out;
}

export function holidayName(key: string): string | undefined {
  return holidaysOf(Number(key.slice(0, 4)))[key];
}
