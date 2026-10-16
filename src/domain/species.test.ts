import { describe, expect, it } from 'vitest';
import { careerTitle, isUnlocked, REACTION_LINES, SPECIES, speciesWord } from './customization';

describe('캐릭터별 말', () => {
  it('찍찍은 햄스터에게만 있다', () => {
    for (const sp of ['rabbit', 'bird', 'cat', 'lop'] as const) {
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
    expect(speciesWord('햄스터가 말합니다', 'lop')).toBe('롭이어가 말합니다');
  });

  it('롭이어는 출근 50일에 열리는 히든 캐릭터다', () => {
    const lop = SPECIES.find((s) => s.id === 'lop')!;
    expect(lop.hidden).toBe(true);
    expect(lop.unlock).toEqual({ kind: 'completed', n: 50 });
    const p = { completed: 49 } as Parameters<typeof isUnlocked>[1];
    expect(isUnlocked(lop.unlock, { ...p })).toBe(false);
    expect(isUnlocked(lop.unlock, { ...p, completed: 50 })).toBe(true);
    // 다른 캐릭터는 처음부터 열려 있다
    expect(SPECIES.filter((s) => s.id !== 'lop').every((s) => s.unlock.kind === 'default')).toBe(true);
  });
});
