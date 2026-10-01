import { describe, expect, it } from 'vitest';
import { COMPOSITIONS, drawLook } from './shareCard';

describe('공유 카드 구도', () => {
  it('구도가 충분히 다양하고 id가 겹치지 않는다', () => {
    expect(COMPOSITIONS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(COMPOSITIONS.map((c) => c.id)).size).toBe(COMPOSITIONS.length);
  });
  it('같은 날·같은 번호면 항상 같은 컷, 날마다·다시 뽑으면 달라진다', () => {
    expect(drawLook('2026-10-02', 0).comp.id).toBe(drawLook('2026-10-02', 0).comp.id);
    const days = Array.from({ length: 40 }, (_, i) => drawLook(`2026-10-${String(i + 1).padStart(2, '0')}`, 0).comp.id);
    expect(new Set(days).size).toBeGreaterThan(8);
    const redraw = Array.from({ length: 30 }, (_, i) => drawLook('2026-10-02', i).comp.id);
    expect(new Set(redraw).size).toBeGreaterThan(6);
  });
});
