/**
 * 썰 극장: 직장 썰을 지금 키우는 캐릭터가 주인공인 세로 숏폼 애니메이션으로 보여 준다.
 * 썰 하나는 컷(Cut)의 목록이고, 컷마다 웹툰처럼 칸(Panel)을 나누고 시간에 맞춰 이벤트가 일어난다.
 * 연출 문법: 세로 꽉 찬 화면 + 진행 막대, 웹툰 컷 분할, 점프컷·휙 넘기기·스크롤 전환,
 * 단어 단위로 튀어나오는 자막(키네틱 타이포), 2프레임 끊어 움직이기, 망점·색 어긋남, 레이어 깊이감과 초점 이동.
 */
import type { FrontAction } from '../components/hamster/HamsterSprite';
import type { AppState, DailyWork, HatId, OutfitId, Species } from './types';
import { createRng } from './random';

/**
 * 배경: 장소 · 속마음 장소(황무지·후광·먹구름·우주) · 설정 샷(건물 밖) · 단색,
 * 그리고 화면 가득 소품을 보여 주는 인서트(폰 잠금화면 `phone:19:40|보낸 사람|알림`, 벽시계 `clock:16:47`, 모니터 `screen:문구`)
 */
export type Bg =
  | 'office'
  | 'meeting'
  | 'pantry'
  | 'elevator'
  | 'subway'
  | 'building'
  | 'wasteland'
  | 'halo'
  | 'rain'
  | 'space'
  | `flat:${string}`
  | `phone:${string}`
  | `clock:${string}`
  | `screen:${string}`;
/** 카메라 거리: 전체 → 중간 → 가까이 → 얼굴 */
export type Shot = 'wide' | 'medium' | 'close' | 'face';
/** 칸 나누기: 한 칸 / 위아래 / 좌우 대치 / 위 하나 + 아래 둘 */
export type Layout = 'full' | 'stack' | 'versus' | 'trio';
/** 컷 전환: 점프컷 / 휙 넘기기 / 웹툰 스크롤 / 쾅 확대 */
export type Enter = 'cut' | 'whip' | 'scroll' | 'punch';
export type Mark = 'sweat' | 'anger' | 'sparkle' | 'gloom' | null;
export type TextStyle = 'narr' | 'shout' | 'whisper' | 'label' | 'sfx' | 'stamp';

export interface Role {
  id: string;
  /** me = 지금 키우는 캐릭터, boss·mate = 다른 종 동료 */
  as: 'me' | 'boss' | 'mate';
  label: string;
  outfit?: OutfitId;
  hat?: HatId;
}

export interface Place {
  who: string;
  x: number;
  action?: FrontAction;
  facing?: 1 | -1;
  hidden?: boolean;
  /** 책상에 앉아 있음 (앞에 노트북 책상) */
  desk?: boolean;
  /** 이름표 스티커 */
  tag?: boolean;
}

export interface Panel {
  bg: Bg;
  shot: Shot;
  /** 카메라가 따라갈 배우 */
  focus?: string;
  cast: Place[];
  /** 초점: 앞(fg)이나 뒤(bg)를 흐리게 */
  blur?: 'fg' | 'bg';
}

export type Ev = { at: number; p?: number } & (
  | { do: 'act'; who: string; action: FrontAction }
  | { do: 'move'; who: string; to: number; ms: number; run?: boolean; then?: FrontAction }
  | { do: 'show'; who: string }
  | { do: 'say'; who: string; text: string }
  | { do: 'text'; text: string; x: number; y: number; style: TextStyle; size?: number; tilt?: number }
  /** 숫자가 촤라락 바뀌는 자막 */
  | { do: 'count'; from: string; to: string; x: number; y: number; ms: number }
  | { do: 'chat'; from: 'them' | 'me'; name?: string; text: string }
  | { do: 'mark'; who: string; mark: Mark }
  | { do: 'flash' }
  | { do: 'shake'; power?: 1 | 2 | 3 }
  /** 색 어긋남(망점 인쇄가 어긋난 듯한 글리치) */
  | { do: 'glitch'; ms: number }
  /** 칸 밖으로 튀어나오기 */
  | { do: 'burst'; who: string }
  /** 초점 이동 */
  | { do: 'focus'; blur: 'fg' | 'bg' | null }
  /** 칸 안에서 한 번에 확 당기기 (점프 줌) */
  | { do: 'snap'; shot: Shot; focus?: string }
  | { do: 'prop'; prop: 'door' | 'laptop' | 'fridge' | 'lift'; state: string }
  /** 카메라를 천천히 옮기기 (다가가기·따라가기) */
  | { do: 'cam'; shot: Shot; focus?: string; ms: number }
  /** 조명: 0 = 그대로, 1 = 완전 암전 */
  | { do: 'light'; level: number; ms: number }
  /** 과하게 밝아지며 번지는 패닉 화면 */
  | { do: 'glare'; on: boolean }
  /** 새까만 실루엣으로 */
  | { do: 'silhouette'; who: string; on: boolean }
  /** 머리 위 생각 풍선: 내 분신 count명이 action을 한다 */
  | { do: 'dream'; who: string; count: number; action?: FrontAction; text?: string }
  | { do: 'dreamPop' }
  /** 한 번에 가지 않고 들썩들썩 조금씩 다가가기 */
  | { do: 'inch'; who: string; to: number; steps: number; ms: number }
);

export interface Cut {
  ms: number;
  layout: Layout;
  enter?: Enter;
  panels: Panel[];
  events?: Ev[];
}

export interface Story {
  id: string;
  no: number;
  title: string;
  credit: string;
  cast: Role[];
  cuts: Cut[];
}

/** 동료 역할을 맡을 종 두 가지: 내 캐릭터와 다른 종 */
export function castSpecies(me: Species | undefined): { boss: Species; mate: Species } {
  const kind = me === 'lop' ? 'rabbit' : (me ?? 'hamster');
  const others = (['cat', 'hamster', 'bird', 'rabbit'] as Species[]).filter((s) => s !== kind);
  return { boss: others[0], mate: others[1] };
}

export const STORIES: Story[] = [
  {
    id: 'meeting-5min',
    no: 1,
    title: '5분이면 끝나는 회의',
    credit: '익명의 김대리',
    cast: [
      { id: 'me', as: 'me', label: '나' },
      { id: 'boss', as: 'boss', label: '팀장님', outfit: 'tie' },
    ],
    cuts: [
      {
        ms: 2000,
        layout: 'full',
        panels: [{ bg: 'building', shot: 'wide', cast: [] }],
        events: [
          { at: 0, do: 'cam', shot: 'medium', ms: 2000 },
          { at: 200, do: 'text', text: 'PM 2:00', x: 22, y: 12, style: 'label', tilt: -4 },
          { at: 600, do: 'text', text: '평화로운 *오후 두 시*', x: 50, y: 86, style: 'narr' },
        ],
      },
      {
        ms: 3200,
        layout: 'full',
        enter: 'cut',
        panels: [
          {
            bg: 'office',
            shot: 'wide',
            cast: [
              { who: 'me', x: 34, action: 'type', desk: true, tag: true },
              { who: 'boss', x: 118, facing: -1, tag: true },
            ],
          },
        ],
        events: [
          { at: 200, do: 'move', who: 'boss', to: 66, ms: 1100, then: 'wave' },
          { at: 300, do: 'cam', shot: 'medium', focus: 'boss', ms: 1200 },
          { at: 1500, do: 'say', who: 'boss', text: '회의 *5분만* 하자~' },
        ],
      },
      {
        ms: 2200,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'office', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 34, action: 'look', desk: true }] }],
        events: [
          { at: 1300, do: 'mark', who: 'me', mark: 'sweat' },
          { at: 1400, do: 'text', text: '…5분?', x: 74, y: 30, style: 'whisper' },
        ],
      },
      {
        ms: 1300,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'clock:14:00', shot: 'wide', cast: [] }],
      },
      {
        ms: 3000,
        layout: 'full',
        enter: 'cut',
        panels: [
          {
            bg: 'meeting',
            shot: 'wide',
            cast: [
              { who: 'boss', x: 64, action: 'cheer' },
              { who: 'me', x: 32, action: 'idle' },
            ],
          },
        ],
        events: [
          { at: 0, do: 'light', level: 0.45, ms: 2800 },
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2800 },
          { at: 900, do: 'act', who: 'me', action: 'doze' },
          { at: 1900, do: 'act', who: 'me', action: 'soul' },
          { at: 600, do: 'text', text: '회의는 *계속되었다*', x: 50, y: 86, style: 'narr' },
        ],
      },
      {
        ms: 1600,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'clock:16:47', shot: 'wide', cast: [] }],
        events: [
          { at: 300, do: 'shake', power: 2 },
          { at: 300, do: 'text', text: '*2시간 47분*째', x: 50, y: 84, style: 'shout', size: 0.9 },
        ],
      },
      {
        ms: 2800,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'wasteland', shot: 'wide', cast: [{ who: 'me', x: 50, action: 'soul' }] }],
        events: [
          { at: 0, do: 'cam', shot: 'close', focus: 'me', ms: 2800 },
          { at: 1300, do: 'silhouette', who: 'me', on: true },
          { at: 700, do: 'text', text: '5분은 *어디로 갔을까*', x: 50, y: 86, style: 'narr' },
        ],
      },
      {
        ms: 2400,
        layout: 'versus',
        enter: 'cut',
        panels: [
          { bg: 'flat:#ffb4a8', shot: 'face', focus: 'boss', cast: [{ who: 'boss', x: 50, action: 'smug' }] },
          { bg: 'flat:#9fc8ff', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 50, action: 'shock' }] },
        ],
        events: [
          { at: 100, p: 0, do: 'say', who: 'boss', text: '결론은 *다음에* 다시!' },
          { at: 1100, do: 'flash' },
        ],
      },
      {
        ms: 3000,
        layout: 'full',
        enter: 'scroll',
        panels: [{ bg: 'subway', shot: 'wide', cast: [{ who: 'me', x: 50, action: 'soul' }] }],
        events: [
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 3000 },
          { at: 0, do: 'light', level: 0.25, ms: 1500 },
          { at: 100, do: 'text', text: 'PM 7:40 퇴근길', x: 24, y: 12, style: 'label', tilt: -3 },
          { at: 700, do: 'text', text: '회의록: *“다음에 다시 논의”*', x: 50, y: 86, style: 'narr' },
        ],
      },
    ],
  },
  {
    id: 'ctrl-s',
    no: 2,
    title: '저장 버튼의 소중함',
    credit: '익명의 박주임',
    cast: [{ id: 'me', as: 'me', label: '나' }],
    cuts: [
      {
        ms: 2600,
        layout: 'full',
        panels: [{ bg: 'office', shot: 'wide', cast: [{ who: 'me', x: 46, action: 'typeFast', desk: true, tag: true }] }],
        events: [
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2600 },
          { at: 100, do: 'text', text: '마감 20분 전', x: 22, y: 12, style: 'label', tilt: -4 },
          { at: 500, do: 'text', text: '타다다닥', x: 72, y: 40, style: 'sfx', tilt: -8 },
          { at: 1000, do: 'text', text: '보고서 *마지막 한 줄*', x: 50, y: 86, style: 'narr' },
        ],
      },
      {
        ms: 2400,
        layout: 'stack',
        enter: 'scroll',
        panels: [
          { bg: 'office', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 46, action: 'resolve', desk: true }] },
          { bg: 'office', shot: 'medium', focus: 'me', cast: [{ who: 'me', x: 46, action: 'typeFast', desk: true }], blur: 'bg' },
        ],
        events: [
          { at: 900, p: 1, do: 'act', who: 'me', action: 'cheer' },
          { at: 900, p: 1, do: 'mark', who: 'me', mark: 'sparkle' },
          { at: 1000, do: 'text', text: '다 됐다…!', x: 50, y: 60, style: 'shout', size: 0.9 },
        ],
      },
      {
        ms: 1800,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'screen:응답 없음', shot: 'wide', cast: [] }],
        events: [
          { at: 600, do: 'glitch', ms: 1100 },
          { at: 600, do: 'shake', power: 1 },
        ],
      },
      {
        ms: 2000,
        layout: 'full',
        enter: 'punch',
        panels: [{ bg: 'office', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 46, action: 'look', desk: true }] }],
        events: [
          { at: 900, do: 'act', who: 'me', action: 'shock' },
          { at: 900, do: 'flash' },
          { at: 900, do: 'shake', power: 3 },
          { at: 1000, do: 'text', text: '!!!', x: 76, y: 24, style: 'sfx', size: 1.6, tilt: 12 },
        ],
      },
      {
        ms: 1500,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'screen:마지막 저장: 3시간 전', shot: 'wide', cast: [] }],
      },
      {
        ms: 2600,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'wasteland', shot: 'wide', cast: [{ who: 'me', x: 50, action: 'quake' }] }],
        events: [
          { at: 0, do: 'cam', shot: 'close', focus: 'me', ms: 2600 },
          { at: 1100, do: 'silhouette', who: 'me', on: true },
          { at: 1100, do: 'shake', power: 1 },
        ],
      },
      {
        ms: 2800,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'office', shot: 'wide', cast: [{ who: 'me', x: 46, action: 'kneel' }] }],
        events: [
          { at: 0, do: 'light', level: 0.5, ms: 2400 },
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2600 },
          { at: 300, do: 'mark', who: 'me', mark: 'gloom' },
          { at: 900, do: 'text', text: '…Ctrl+S…', x: 50, y: 86, style: 'narr' },
        ],
      },
    ],
  },
  {
    id: 'before-6',
    no: 3,
    title: '퇴근 10분 전의 그림자',
    credit: '익명의 이사원',
    cast: [
      { id: 'me', as: 'me', label: '나' },
      { id: 'boss', as: 'boss', label: '팀장님', outfit: 'suit' },
    ],
    cuts: [
      {
        ms: 1500,
        layout: 'full',
        panels: [{ bg: 'phone:17:50', shot: 'wide', cast: [] }],
      },
      {
        ms: 2600,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'office', shot: 'wide', cast: [{ who: 'me', x: 40, action: 'dance', desk: true, tag: true }] }],
        events: [
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2400 },
          { at: 200, do: 'mark', who: 'me', mark: 'sparkle' },
          { at: 400, do: 'dream', who: 'me', count: 1, action: 'snack', text: '치킨…' },
          { at: 1300, do: 'dream', who: 'me', count: 3, action: 'dance', text: '치킨…!' },
        ],
      },
      {
        ms: 2600,
        layout: 'full',
        enter: 'whip',
        panels: [{ bg: 'elevator', shot: 'wide', cast: [{ who: 'me', x: 8, action: 'idle' }] }],
        events: [
          { at: 0, do: 'inch', who: 'me', to: 34, steps: 4, ms: 1800 },
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2400 },
          { at: 300, do: 'text', text: '살금살금', x: 30, y: 30, style: 'sfx', tilt: -6 },
          { at: 1900, do: 'text', text: '엘리베이터 *도착*', x: 50, y: 86, style: 'narr' },
        ],
      },
      {
        ms: 2800,
        layout: 'stack',
        enter: 'cut',
        panels: [
          { bg: 'elevator', shot: 'medium', focus: 'boss', cast: [{ who: 'boss', x: 50, action: 'smug', hidden: true }] },
          { bg: 'elevator', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 34, action: 'cheer' }] },
        ],
        events: [
          { at: 200, p: 0, do: 'prop', prop: 'lift', state: 'open' },
          { at: 200, do: 'text', text: '띵—', x: 74, y: 12, style: 'sfx', tilt: 8 },
          { at: 800, p: 0, do: 'show', who: 'boss' },
          { at: 800, do: 'flash' },
          { at: 1000, p: 1, do: 'act', who: 'me', action: 'shock' },
          { at: 1000, do: 'glitch', ms: 500 },
          { at: 1000, do: 'shake', power: 2 },
        ],
      },
      {
        ms: 2800,
        layout: 'versus',
        enter: 'cut',
        panels: [
          { bg: 'flat:#ffb4a8', shot: 'face', focus: 'boss', cast: [{ who: 'boss', x: 50, action: 'smug' }] },
          { bg: 'flat:#b7f0d0', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 50, action: 'rotten' }] },
        ],
        events: [
          { at: 200, p: 0, do: 'say', who: 'boss', text: '아 마침 잘 만났다~' },
          { at: 1300, p: 1, do: 'mark', who: 'me', mark: 'sweat' },
          { at: 1500, p: 1, do: 'say', who: 'me', text: '네…ㅎㅎ' },
        ],
      },
      {
        ms: 2600,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'rain', shot: 'wide', cast: [{ who: 'me', x: 50, action: 'cry' }] }],
        events: [
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2600 },
          { at: 500, do: 'text', text: '퇴근 취소', x: 50, y: 82, style: 'stamp', tilt: -8 },
        ],
      },
      {
        ms: 1400,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'phone:19:40|팀장님|아 그리고 하나만 더…', shot: 'wide', cast: [] }],
      },
      {
        ms: 2600,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'office', shot: 'wide', cast: [{ who: 'me', x: 40, action: 'soul', desk: true }] }],
        events: [
          { at: 0, do: 'light', level: 0.55, ms: 2200 },
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2600 },
          { at: 600, do: 'text', text: '“잠깐”은 *1시간 50분*이었다', x: 50, y: 86, style: 'narr' },
        ],
      },
    ],
  },
  {
    id: 'pudding',
    no: 4,
    title: '탕비실 푸딩 실종 사건',
    credit: '익명의 최주임',
    cast: [
      { id: 'me', as: 'me', label: '나' },
      { id: 'mate', as: 'mate', label: '옆 팀 대리', outfit: 'badge' },
    ],
    cuts: [
      {
        ms: 3000,
        layout: 'full',
        panels: [{ bg: 'pantry', shot: 'wide', cast: [{ who: 'me', x: 6, action: 'idle', tag: true }] }],
        events: [
          { at: 0, do: 'move', who: 'me', to: 46, ms: 1300, then: 'heart' },
          { at: 0, do: 'cam', shot: 'medium', focus: 'me', ms: 2600 },
          { at: 100, do: 'text', text: 'PM 1:10 탕비실', x: 26, y: 12, style: 'label', tilt: -3 },
          { at: 1400, do: 'dream', who: 'me', count: 1, action: 'snack', text: '푸딩~♪' },
          { at: 1600, do: 'text', text: '아껴 둔 *푸딩* 먹을 시간', x: 50, y: 86, style: 'narr' },
        ],
      },
      {
        ms: 2800,
        layout: 'stack',
        enter: 'scroll',
        panels: [
          { bg: 'pantry', shot: 'medium', focus: 'me', cast: [{ who: 'me', x: 48, action: 'look' }] },
          { bg: 'pantry', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 48, action: 'look' }], blur: 'bg' },
        ],
        events: [
          { at: 200, p: 0, do: 'prop', prop: 'fridge', state: 'open' },
          { at: 600, do: 'text', text: '텅—', x: 74, y: 22, style: 'sfx', tilt: 6 },
          { at: 1500, p: 1, do: 'act', who: 'me', action: 'shock' },
          { at: 1500, do: 'shake', power: 2 },
        ],
      },
      {
        ms: 3000,
        layout: 'full',
        enter: 'whip',
        panels: [{ bg: 'halo', shot: 'wide', cast: [{ who: 'mate', x: 50, action: 'snack', tag: true }] }],
        events: [
          { at: 0, do: 'cam', shot: 'medium', focus: 'mate', ms: 2800 },
          { at: 400, do: 'say', who: 'mate', text: '이거 주인 없는 거죠? *맛있네요~*' },
          { at: 1600, do: 'mark', who: 'mate', mark: 'sparkle' },
        ],
      },
      {
        ms: 2600,
        layout: 'versus',
        enter: 'cut',
        panels: [
          { bg: 'flat:#9fc8ff', shot: 'face', focus: 'me', cast: [{ who: 'me', x: 50, action: 'quake' }] },
          { bg: 'flat:#ffe08a', shot: 'face', focus: 'mate', cast: [{ who: 'mate', x: 50, action: 'snack' }] },
        ],
        events: [
          { at: 0, do: 'flash' },
          { at: 400, do: 'chat', from: 'me', text: '그거 이름 써 놨는데요…' },
          { at: 1300, do: 'chat', from: 'them', name: '옆 팀 대리', text: '아 진짜요? 몰랐네 ㅎㅎ' },
        ],
      },
      {
        ms: 2600,
        layout: 'full',
        enter: 'cut',
        panels: [{ bg: 'wasteland', shot: 'wide', cast: [{ who: 'me', x: 50, action: 'cry' }] }],
        events: [
          { at: 0, do: 'cam', shot: 'close', focus: 'me', ms: 2600 },
          { at: 600, do: 'text', text: '포스트잇은 *방패가 되지 못했다*', x: 50, y: 86, style: 'narr' },
        ],
      },
    ],
  },
];

/** 오늘의 썰: 날짜와 기기 시드로 정해져 하루 종일 같다. 아직 안 본 썰을 먼저 고른다. */
export function storyOfDay(seed: number, key: string, seen: Record<string, number> = {}): Story {
  const fresh = STORIES.filter((s) => !seen[s.id]);
  const pool = fresh.length ? fresh : STORIES;
  const rng = createRng(`${seed}:${key}:story`);
  return pool[Math.floor(rng() * pool.length)];
}

/** 오늘의 썰 (한 번 정해지면 그날은 바뀌지 않는다) */
export function todaysStory(state: AppState, key: string): Story {
  const id = state.stories?.days?.[key];
  return STORIES.find((s) => s.id === id) ?? storyOfDay(state.seed, key, state.stories?.seen);
}

/** 썰을 봤다고 기록 (그날의 썰로 고정하고, 도감 썰 모음에 열린다) */
export function markStorySeen(state: AppState, key: string, id: string, now: number): AppState {
  const st = state.stories ?? {};
  return {
    ...state,
    stories: {
      seen: { ...st.seen, [id]: st.seen?.[id] ?? now },
      days: { ...st.days, [key]: st.days?.[key] ?? id },
    },
  };
}

/** 오늘의 썰을 볼 수 있는지: 출근한 날 퇴근한 뒤 */
export function storyUnlocked(day: Pick<DailyWork, 'clockedOut'> | undefined): boolean {
  return !!day?.clockedOut;
}

/** 썰 한 편의 전체 길이 */
export function storyLength(s: Story): number {
  return s.cuts.reduce((t, c) => t + c.ms, 0);
}
