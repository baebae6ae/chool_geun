/**
 * 썰 극장: 직장 썰을 지금 키우는 캐릭터가 주인공인 짧은 애니메이션으로 보여 준다.
 * 썰 하나는 "대본"(Beat 목록)이고, 극장 화면이 대본을 차례로 연기한다.
 * 쓰는 애니메이션 기법은 docs/animation-techniques.md 참고.
 */
import type { FrontAction } from '../components/hamster/HamsterSprite';
import type { HatId, OutfitId, Species } from './types';

/** 캐릭터 머리 옆에 붙는 만화 기호 */
export type Mark = 'sweat' | 'anger' | 'question' | 'exclaim' | 'gloom' | 'sparkle' | 'stone' | null;
/** 화면 전체에 씌우는 효과 */
export type Fx = 'focus' | 'speed' | 'spot';
export type Prop = 'door' | 'monitor' | 'clock';

export type Beat = (
  | { do: 'title'; text: string; sub?: string; ms: number }
  /** 아래쪽 내레이션 자막 (타자기 효과) */
  | { do: 'caption'; text: string | null; ms?: number }
  | { do: 'say'; who: string; text: string | null; ms?: number }
  /** 정면 동작 바꾸기 */
  | { do: 'act'; who: string; action: FrontAction; ms?: number }
  /** 걸어서/뛰어서 이동 (천천히 시작·끝, 뛰면 잔상) */
  | { do: 'move'; who: string; to: number; ms: number; run?: boolean; then?: FrontAction }
  /** 예비 동작 + 점프 (스쿼시 & 스트레치) */
  | { do: 'hop'; who: string; ms?: number }
  /** 털썩 주저앉기 */
  | { do: 'slump'; who: string; ms?: number }
  | { do: 'mark'; who: string; mark: Mark; ms?: number }
  /** 카메라: 확대·초점·기울기. crash = 순간 확대, push = 천천히 다가가기 */
  | { do: 'cam'; zoom: number; x?: number; y?: number; tilt?: number; ms: number; ease?: 'crash' | 'smooth' | 'push' }
  | { do: 'shake'; power?: 1 | 2 | 3; ms?: number }
  | { do: 'fx'; fx: Fx; on: boolean; x?: number; y?: number; ms?: number }
  /** 효과음 글자 */
  | { do: 'sfx'; text: string; x: number; y: number; color?: string; size?: number; tilt?: number; ms?: number }
  /** 임팩트 프레임 (섬광 → 반전 → 원래대로) */
  | { do: 'impact'; x: number; y: number; ms?: number }
  /** 히트 스톱: 모든 움직임 잠깐 정지 */
  | { do: 'hitstop'; ms: number }
  /** 프리즈 프레임: 정지 + 세피아 + 자막 */
  | { do: 'freeze'; text: string; ms: number }
  /** 타임랩스: 시계가 빨리 돌고 창밖이 어두워짐 */
  | { do: 'timelapse'; text: string; ms: number; sky?: 'day' | 'evening' | 'night' }
  | { do: 'prop'; prop: Prop; state: string; ms?: number }
  | { do: 'wait'; ms: number }
  /** 아이리스 아웃: 동그랗게 닫히며 끝 */
  | { do: 'iris'; x: number; y: number; ms: number }
) & {
  /** true면 바로 앞 동작과 동시에 시작한다 */
  with?: boolean;
};

export interface Cast {
  id: string;
  /** 'me'면 지금 키우는 캐릭터 그대로 */
  as: 'me' | 'coworker';
  label: string;
  x: number;
  facing?: 1 | -1;
  /** 무대 밖에서 시작하면 숨겨 둔다 */
  hidden?: boolean;
  outfit?: OutfitId;
  hat?: HatId;
  action?: FrontAction;
}

export interface Story {
  id: string;
  no: number;
  title: string;
  /** 제보자 닉네임 */
  credit: string;
  /** 시작할 때 시계가 가리키는 시각 */
  clock: string;
  sky?: 'day' | 'evening' | 'night';
  cast: Cast[];
  beats: Beat[];
}

/** 동료 역할을 맡을 종: 내 캐릭터와 다른 종 */
export function coworkerSpecies(me: Species | undefined): Species {
  const kind = me === 'lop' ? 'rabbit' : (me ?? 'hamster');
  return kind === 'cat' ? 'hamster' : 'cat';
}

/** 대본의 각 동작이 시작되는 시각(ms)과 전체 길이 */
export function timeline(beats: Beat[]): { at: number[]; total: number } {
  const at: number[] = [];
  let cursor = 0;
  let prevStart = 0;
  let end = 0;
  for (const b of beats) {
    const start = b.with ? prevStart : cursor;
    const dur = 'ms' in b && typeof b.ms === 'number' ? b.ms : 0;
    at.push(start);
    prevStart = start;
    if (!b.with) cursor = start + dur;
    else cursor = Math.max(cursor, start + dur);
    end = Math.max(end, start + dur);
  }
  return { at, total: Math.max(end, cursor) };
}

export const STORIES: Story[] = [
  {
    id: 'meeting-5min',
    no: 1,
    title: '5분이면 끝나는 회의',
    credit: '익명의 김대리',
    clock: '14:00',
    cast: [
      { id: 'me', as: 'me', label: '나', x: 30, action: 'type' },
      { id: 'boss', as: 'coworker', label: '팀장님', x: 115, facing: -1, outfit: 'tie', hidden: true },
    ],
    beats: [
      { do: 'title', text: '5분이면 끝나는 회의', sub: '썰 #1', ms: 2200 },
      { do: 'caption', text: '평화로운 오후 두 시', ms: 1600 },
      { do: 'move', who: 'boss', to: 68, ms: 1800, then: 'wave' },
      { do: 'say', who: 'boss', text: '잠깐 회의 5분만 하자~', ms: 1800 },
      { do: 'act', who: 'me', action: 'look', with: true },
      { do: 'mark', who: 'me', mark: 'sweat', ms: 700 },
      { do: 'say', who: 'me', text: '…5분이요?', ms: 1200 },
      { do: 'say', who: 'boss', text: null },
      { do: 'freeze', text: '그때까지만 해도 몰랐다. 그 5분이 어떻게 될지…', ms: 2800 },
      { do: 'say', who: 'me', text: null },
      { do: 'mark', who: 'me', mark: null },
      { do: 'act', who: 'me', action: 'idle' },
      { do: 'timelapse', text: '⏩ 2시간 47분 후', ms: 2600, sky: 'evening' },
      { do: 'act', who: 'me', action: 'doze' },
      { do: 'say', who: 'boss', text: '그래서 결론은… 다음에 다시 얘기하자!', ms: 2200 },
      { do: 'act', who: 'boss', action: 'cheer', with: true },
      { do: 'hitstop', ms: 250 },
      { do: 'act', who: 'me', action: 'doom' },
      { do: 'mark', who: 'me', mark: 'gloom', with: true },
      { do: 'cam', zoom: 1.7, x: 30, y: 68, ms: 2600, ease: 'push', with: true },
      { do: 'sfx', text: '털썩', x: 30, y: 30, color: '#6f7fb5', ms: 1600, with: true },
      { do: 'caption', text: '회의록: "다음에 다시 논의"', ms: 1800 },
      { do: 'iris', x: 30, y: 68, ms: 1400 },
    ],
  },
  {
    id: 'ctrl-s',
    no: 2,
    title: '저장 버튼의 소중함',
    credit: '익명의 박주임',
    clock: '17:40',
    cast: [{ id: 'me', as: 'me', label: '나', x: 42, action: 'typeFast' }],
    beats: [
      { do: 'title', text: '저장 버튼의 소중함', sub: '썰 #2', ms: 2200 },
      { do: 'fx', fx: 'speed', on: true },
      { do: 'caption', text: '마감 20분 전, 보고서 막바지', ms: 1800 },
      { do: 'sfx', text: '타다다닥', x: 66, y: 34, color: '#e8504b', size: 1.2, tilt: -8, ms: 1300 },
      { do: 'fx', fx: 'speed', on: false },
      { do: 'act', who: 'me', action: 'cheer' },
      { do: 'hop', who: 'me', with: true, ms: 700 },
      { do: 'say', who: 'me', text: '다 됐다…!', ms: 1300 },
      { do: 'say', who: 'me', text: null },
      { do: 'prop', prop: 'monitor', state: 'frozen', ms: 900 },
      { do: 'sfx', text: '띠링…', x: 70, y: 30, color: '#5a6b8c', size: 0.9, ms: 900, with: true },
      { do: 'act', who: 'me', action: 'look' },
      { do: 'caption', text: '(응답 없음)', ms: 1200 },
      { do: 'cam', zoom: 2.2, x: 42, y: 68, ms: 160, ease: 'crash' },
      { do: 'impact', x: 50, y: 45, ms: 200, with: true },
      { do: 'fx', fx: 'focus', on: true, x: 50, y: 45, with: true },
      { do: 'mark', who: 'me', mark: 'exclaim', with: true },
      { do: 'shake', power: 3, ms: 600, with: true },
      { do: 'sfx', text: '!!!', x: 74, y: 22, color: '#e8504b', size: 1.6, tilt: 10, ms: 1400, with: true },
      { do: 'hitstop', ms: 300 },
      { do: 'fx', fx: 'focus', on: false },
      { do: 'cam', zoom: 1, x: 50, ms: 900, ease: 'smooth' },
      { do: 'mark', who: 'me', mark: null, with: true },
      { do: 'act', who: 'me', action: 'dizzy', with: true },
      { do: 'caption', text: '마지막 저장: 3시간 전', ms: 2000 },
      { do: 'act', who: 'me', action: 'doom' },
      { do: 'mark', who: 'me', mark: 'gloom', with: true },
      { do: 'slump', who: 'me', with: true, ms: 900 },
      { do: 'say', who: 'me', text: '…Ctrl+S…', ms: 1800 },
      { do: 'iris', x: 42, y: 68, ms: 1400 },
    ],
  },
  {
    id: 'before-6',
    no: 3,
    title: '퇴근 10분 전의 그림자',
    credit: '익명의 이사원',
    clock: '17:50',
    cast: [
      { id: 'me', as: 'me', label: '나', x: 34, action: 'idle' },
      { id: 'boss', as: 'coworker', label: '팀장님', x: 112, facing: -1, outfit: 'suit', hidden: true },
    ],
    beats: [
      { do: 'title', text: '퇴근 10분 전의 그림자', sub: '썰 #3', ms: 2200 },
      { do: 'caption', text: '오후 5시 50분', ms: 1300 },
      { do: 'act', who: 'me', action: 'dance' },
      { do: 'mark', who: 'me', mark: 'sparkle', with: true },
      { do: 'say', who: 'me', text: '오늘은 칼퇴다~♪', ms: 1800, with: true },
      { do: 'say', who: 'me', text: null },
      { do: 'prop', prop: 'door', state: 'open', ms: 500 },
      { do: 'sfx', text: '삐걱…', x: 82, y: 30, color: '#7a6a5a', size: 1, ms: 900, with: true },
      { do: 'act', who: 'me', action: 'idle', with: true },
      { do: 'mark', who: 'me', mark: null, with: true },
      { do: 'cam', zoom: 1.5, x: 80, y: 55, tilt: -6, ms: 700, ease: 'smooth' },
      { do: 'fx', fx: 'spot', on: true, x: 80, y: 55, with: true },
      { do: 'move', who: 'boss', to: 78, ms: 1100, then: 'smug' },
      { do: 'sfx', text: '두둥', x: 62, y: 26, color: '#2d2440', size: 1.5, tilt: -6, ms: 1200 },
      { do: 'shake', power: 2, ms: 400, with: true },
      { do: 'fx', fx: 'focus', on: true, x: 80, y: 50, with: true },
      { do: 'hitstop', ms: 300, with: true },
      { do: 'say', who: 'boss', text: '아 퇴근 전에 잠깐 얘기 좀…', ms: 2000 },
      { do: 'fx', fx: 'focus', on: false },
      { do: 'fx', fx: 'spot', on: false, with: true },
      { do: 'say', who: 'boss', text: null },
      { do: 'cam', zoom: 2, x: 34, y: 68, tilt: 0, ms: 160, ease: 'crash' },
      { do: 'impact', x: 50, y: 45, ms: 200, with: true },
      { do: 'mark', who: 'me', mark: 'stone', with: true },
      { do: 'sfx', text: '쩌적', x: 60, y: 30, color: '#555', size: 1.4, tilt: 8, ms: 1400, with: true },
      { do: 'shake', power: 1, ms: 500, with: true },
      { do: 'wait', ms: 600 },
      { do: 'say', who: 'me', text: '…네.', ms: 1800 },
      { do: 'iris', x: 34, y: 68, ms: 1400 },
    ],
  },
];
