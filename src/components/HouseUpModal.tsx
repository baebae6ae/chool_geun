/**
 * 집 업그레이드 연출: 가챠처럼 캡슐이 흔들리다 열리면 새 방이 빛줄기와 함께 나온다. 효과음 없음.
 * 단계가 높을수록 오래 흔들리고 빛이 화려하다 (2~3 RARE, 4~6 EPIC, 7~9 LEGENDARY).
 */
import { useEffect, useState } from 'react';
import { Habitat } from './habitat/Habitat';
import { HOUSE_LEVELS } from './habitat/House';
import { useBackHandler } from '../backStack';
import { buzz } from '../haptics';
import type { Customization, Rarity } from '../domain/types';

const tierOf = (lv: number): Rarity => (lv >= 7 ? 'LEGENDARY' : lv >= 4 ? 'EPIC' : 'RARE');
const WAIT: Record<string, number> = { RARE: 1100, EPIC: 1500, LEGENDARY: 2000 };

export function HouseUpModal({ level, custom, name, now, onClose }: { level: number; custom: Customization; name: string; now: number; onClose: () => void }) {
  const tier = tierOf(level);
  const info = HOUSE_LEVELS[level - 1];
  const [opened, setOpened] = useState(false);
  useBackHandler(true, () => {
    if (opened) onClose();
  });
  useEffect(() => {
    const t = setTimeout(() => setOpened(true), WAIT[tier]);
    return () => clearTimeout(t);
  }, [tier]);
  useEffect(() => {
    if (opened) buzz(tier === 'LEGENDARY' ? [30, 60, 30, 60, 80] : [20, 60, 30]);
  }, [opened, tier]);
  if (!info) return null;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="집 업그레이드">
      <div className={`sheet gacha-card house-up rarity-${tier}`}>
        <div className="gacha-title">🏠 집이 업그레이드됐어요!</div>
        {!opened ? (
          <div className="capsule" onClick={() => setOpened(true)} style={{ '--wait': `${WAIT[tier]}ms` } as React.CSSProperties} aria-label="캡슐 열기">
            <div className="capsule-top" />
            <div className="capsule-bottom" />
          </div>
        ) : (
          <div className="gacha-reveal">
            <div className="rarity-badge">LV.{level} · 출근 {info.at}일</div>
            <div className="gacha-emoji-wrap house-up-room">
              <div className="gacha-emoji">
                <Habitat custom={custom} mood="working" name={name} now={now} house={level} />
              </div>
            </div>
            <div className="gacha-name">{info.name}</div>
            {level < HOUSE_LEVELS.length && <p className="gacha-desc">다음 단계까지 출근 {HOUSE_LEVELS[level].at - info.at}일</p>}
          </div>
        )}
        <button className="btn primary" onClick={onClose} disabled={!opened}>
          입주하기!
        </button>
      </div>
    </div>
  );
}
