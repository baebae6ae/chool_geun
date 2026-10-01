import { useEffect, useRef, useState } from 'react';
import { CARD_POSES, renderCard, shareCardImage, type CardData } from '../shareCard';
import { pickQuote, type QuotePhase } from '../domain/quotes';
import type { Customization } from '../domain/types';

interface Props {
  custom: Customization;
  dateKey: string;
  dateText: string;
  phase: QuotePhase;
  payday: boolean;
  label: string;
  amount: string;
  sub: string;
  onClose: () => void;
}

/** 오늘 번 돈 + 햄스터 + 한마디를 한 장의 카드로 만들어 공유 */
export function ShareSheet({ custom, dateKey, dateText, phase, payday, label, amount, sub, onClose }: Props) {
  const [poseIdx, setPoseIdx] = useState(() => Math.floor(Math.random() * 5));
  const [salt, setSalt] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const quote = pickQuote({ key: dateKey, phase, payday, salt });

  useEffect(() => {
    let alive = true;
    let objUrl: string | null = null;
    const data: CardData = { custom, pose: CARD_POSES[poseIdx].pose, dateText, label, amount, sub, quote };
    renderCard(data)
      .then((b) => {
        if (!alive) return;
        blobRef.current = b;
        objUrl = URL.createObjectURL(b);
        setUrl(objUrl);
        setError('');
      })
      .catch(() => alive && setError('카드를 만들지 못했어요. 잠시 후 다시 시도해 주세요.'));
    return () => {
      alive = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
    };
  }, [custom, poseIdx, dateText, label, amount, sub, quote]);

  const share = async () => {
    if (!blobRef.current || busy) return;
    setBusy(true);
    try {
      await shareCardImage(blobRef.current, `햄스터출근일지-${dateKey}.png`);
    } catch {
      setError('공유하지 못했어요. 이미지를 길게 눌러 저장해 보세요.');
    }
    setBusy(false);
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="공유 카드" onClick={onClose}>
      <div className="sheet share-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>오늘의 카드</h3>
        <div className="share-preview">{url ? <img src={url} alt="오늘 번 돈 카드 미리보기" /> : <span className="muted">그리는 중…</span>}</div>
        <div className="chips share-poses" role="group" aria-label="햄스터 자세">
          {CARD_POSES.map((p, i) => (
            <button key={p.id} type="button" className={`chip ${i === poseIdx ? 'on' : ''}`} aria-pressed={i === poseIdx} onClick={() => setPoseIdx(i)}>
              {p.label}
            </button>
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="share-actions">
          <button type="button" className="btn" onClick={() => setSalt((s) => s + 1)}>
            다른 한마디
          </button>
          <button type="button" className="btn primary" onClick={share} disabled={!url || busy}>
            {busy ? '여는 중…' : '공유하기'}
          </button>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
