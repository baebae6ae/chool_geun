import { describe, expect, it } from 'vitest';
import { createInitialState } from './engine';
import { markWhatsNewSeen, NEWS, unseenNews, WHATS_NEW_VERSION, whatsNewPending } from './whatsNew';
import type { AppState } from './types';

const settled = (): AppState => ({ ...createInitialState(3), settings: {} as AppState['settings'] });

describe('업데이트 소식', () => {
  it('기존 사용자는 업데이트 후 한 번만 본다', () => {
    const s = settled();
    expect(whatsNewPending(s)).toBe(true);
    const seen = markWhatsNewSeen(s);
    expect(seen.whatsNew).toBe(WHATS_NEW_VERSION);
    expect(whatsNewPending(seen)).toBe(false);
    // 다시 켜도(저장 후 다시 읽어도) 안 뜬다
    expect(whatsNewPending(JSON.parse(JSON.stringify(seen)))).toBe(false);
    expect(markWhatsNewSeen(seen)).toBe(seen);
  });

  it('처음 설정 중인 사람에게는 안 뜬다', () => {
    expect(whatsNewPending(createInitialState(3))).toBe(false);
  });

  it('여러 버전을 건너뛰면 못 본 소식을 모두, 하나만 놓쳤으면 그것만 보여 준다', () => {
    const all = NEWS.flatMap((n) => n.items);
    expect(unseenNews(settled())).toEqual(all);
    const prev = { ...settled(), whatsNew: WHATS_NEW_VERSION - 1 };
    expect(unseenNews(prev)).toEqual(NEWS.find((n) => n.version === WHATS_NEW_VERSION)!.items);
    expect(unseenNews(markWhatsNewSeen(prev))).toEqual([]);
  });

  it('다음 업데이트에서 버전이 오르면 다시 한 번 뜬다', () => {
    const s = { ...settled(), whatsNew: WHATS_NEW_VERSION - 1 };
    expect(whatsNewPending(s)).toBe(true);
  });
});
