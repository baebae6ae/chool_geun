import { describe, expect, it } from 'vitest';
import { careerTitle, REACTION_LINES, speciesWord } from './customization';

describe('캐릭터별 말', () => {
  it('찍찍은 햄스터에게만 있다', () => {
    for (const sp of ['rabbit', 'bird', 'cat'] as const) {
      const all = [...REACTION_LINES[sp].pet, ...REACTION_LINES[sp].feed, ...REACTION_LINES[sp].hug].join(' ');
      expect(all).not.toContain('찍찍');
      expect(all).not.toContain('해바라기씨');
    }
    expect(REACTION_LINES.hamster.pet).toContain('찍찍!');
  });

  it('문구 속 햄스터를 캐릭터 이름으로 바꾼다', () => {
    expect(speciesWord('햄스터가 말합니다', 'cat')).toBe('고양이가 말합니다');
    expect(speciesWord('햄스터도 쉬는 중', 'bird')).toBe('오목눈이도 쉬는 중');
    expect(speciesWord('햄스터도 쉬는 중', 'hamster')).toBe('햄스터도 쉬는 중');
    expect(careerTitle(0, 'rabbit')).toBe('수습 토끼');
  });
});
