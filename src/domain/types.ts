export type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

/** 하루의 근무 스케줄 (HH:mm). 기록마다 스냅샷으로 저장해 설정을 바꿔도 과거 기록이 변하지 않게 한다. */
export interface Schedule {
  workStart: string;
  workEnd: string;
  lunchStart: string;
  lunchEnd: string;
}

/** 기획서 17. User */
export interface Settings extends Schedule {
  /** 월급 (원) — 월급으로 입력할 때 */
  salary: number;
  /** 연봉으로 입력할지 월급으로 입력할지 (없으면 월급 — 예전 기록 호환) */
  payMode?: 'annual' | 'monthly';
  /** 연봉 (세전, 원) */
  annualSalary?: number;
  /** 부양가족 수 (본인 포함) */
  dependents?: number;
  /** 월 비과세 식대 (원) */
  mealAllowance?: number;
  /** 연봉에 퇴직금 포함 */
  severanceIncluded?: boolean;
  /** 사용자가 직접 고친 세후 월급 (없으면 자동 계산) */
  netOverride?: number | null;
  /** 번 돈을 세전으로 보기 */
  showGross?: boolean;
  /** 급여일 (1~31) */
  payday: number;
  /** 월 근무일수 */
  monthWorkDays: number;
  /** 주말 근무 여부 */
  weekendWork: boolean;
  hamsterName: string;
  /** 브라우저 알림 사용 */
  notifications: boolean;
}

export type HamsterColor = 'golden' | 'white' | 'gray' | 'choco';
export type HatId = 'none' | 'cap' | 'beanie' | 'ribbon' | 'headset' | 'crown';
export type OutfitId = 'none' | 'tie' | 'hoodie' | 'cardigan' | 'suit' | 'apron';
export type DecoId = 'none' | 'plant' | 'doll' | 'cactus';

export interface Customization {
  color: HamsterColor;
  glasses: boolean;
  hat: HatId;
  outfit: OutfitId;
  laptop: boolean;
  mug: boolean;
  deco: DecoId;
}

export interface GachaDraw {
  eventId: string;
  /** 발생 예정 시각 (epoch ms) */
  at: number;
  /** 발생 시각이 지나 도감에 반영됨 */
  obtained: boolean;
  /** 사용자가 팝업을 확인함 */
  seen: boolean;
}

/** 기획서 17. DailyWork (+ 일일 기록에 필요한 값) */
export interface DailyWork {
  date: string;
  season: number;
  /** 시즌 내 작업물 인덱스 (0~19) */
  workItemIndex: number;
  schedule: Schedule;
  /** 시간당 급여 (그날 기준) */
  hourly: number;
  /** 오늘 처음 앱을 연 시각 */
  openedAt: number;
  /** 퇴근 처리된 시각 (자동이면 퇴근시간) */
  endTime: number | null;
  progress: number;
  completed: boolean;
  clockedOut: boolean;
  /** 퇴근시간 전에 직접 퇴근함 */
  early: boolean;
  earned: number;
  workedMs: number;
  gacha: GachaDraw[];
  comment: string;
  /** 퇴근 연출을 이미 봤는지 */
  celebrated: boolean;
}

/** 기획서 17. Collection */
export interface CollectionEntry {
  firstObtainedAt: number;
  count: number;
}

export interface AppState {
  version: 1;
  /** 기기별 랜덤 시드 — 날짜와 합쳐 가챠 스케줄을 결정적으로 만든다 */
  seed: number;
  settings: Settings | null;
  custom: Customization;
  days: Record<string, DailyWork>;
  collection: Record<string, CollectionEntry>;
  /** 하루 최대 3회 알림 제한용 */
  notif: { date: string; count: number };
}
