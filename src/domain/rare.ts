/** 켜두면 아주 가끔 볼 수 있는 희귀 행동 (화면을 보고 있을 때 일어나야 도감에 등록) */
export type RareId = 'stuff' | 'sneeze' | 'doze' | 'dizzy' | 'dance';

export interface RareBehavior {
  id: RareId;
  emoji: string;
  name: string;
  description: string;
  /** 희귀 행동 중 상대적인 빈도 */
  weight: number;
}

export const RARE_BEHAVIORS: RareBehavior[] = [
  { id: 'stuff', emoji: '🌻', name: '볼주머니 빵빵', description: '해바라기씨를 양 볼에 가득 채웠어요.', weight: 3 },
  { id: 'sneeze', emoji: '🤧', name: '에취!', description: '씨앗 가루에 코가 간질간질했나 봐요.', weight: 3 },
  { id: 'doze', emoji: '🫧', name: '창가에서 꾸벅꾸벅', description: '햇살 아래서 콧방울을 불며 졸았어요.', weight: 2 },
  { id: 'dizzy', emoji: '💫', name: '쳇바퀴 멀미', description: '쳇바퀴를 너무 신나게 돌다가 어질어질.', weight: 1.5 },
  { id: 'dance', emoji: '🎵', name: '혼자 추는 춤', description: '아무도 안 보는 줄 알고 신나게 춤을 췄어요.', weight: 0.6 },
];

export const RARE_BY_ID = Object.fromEntries(RARE_BEHAVIORS.map((r) => [r.id, r])) as Record<RareId, RareBehavior>;
