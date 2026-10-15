import { Medal } from '../components/Medal';
import type { Glyph, Tier } from '../domain/achievements';

const GLYPHS: Glyph[] = ['paw', 'flame', 'moon', 'coin', 'star', 'sparkle', 'heart', 'bubble', 'clock', 'gift'];

/** 개발용: ?gallery&medals — 업적 메달 전체 보기 */
export function MedalSheet() {
  const tiers: Tier[] = ['bronze', 'silver', 'gold'];
  return (
    <div style={{ padding: 12, background: '#fdf5e8', width: 900 }}>
      {tiers.map((t) => (
        <div key={t} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          {GLYPHS.map((g) => (
            <div key={g} style={{ width: 80, textAlign: 'center', fontSize: 11 }}>
              <div style={{ fontSize: 76, lineHeight: 1 }}>
                <Medal glyph={g} tier={t} />
              </div>
              {t} {g}
            </div>
          ))}
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10 }}>
        {GLYPHS.map((g) => (
          <div key={g} style={{ width: 80, fontSize: 76, lineHeight: 1 }}>
            <Medal glyph={g} tier="gold" locked />
          </div>
        ))}
      </div>
    </div>
  );
}
