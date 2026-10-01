import { useEffect, useRef, useState } from 'react';
import { drawLook, renderCard, shareCardImage, type CardData } from '../shareCard';
import { pickQuote, type QuotePhase } from '../domain/quotes';
import type { Customization } from '../domain/types';

interface Props {
  custom: Customization;
  dateKey: string;
  dateText: string;
  phase: QuotePhase;
  payday: boolean;
  nameTag: string;
  chips: string[];
  onClose: () => void;
}

/** 오늘의 카드: 구도·색·장식이 날마다 랜덤. 돈 정보는 담지 않는다. */
export function ShareSheet({ custom, dateKey, dateText, phase, payday, nameTag, chips, onClose }: Props) {
  const [draws, setDraws] = useState(0);
  const [salt, setSalt] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const look = drawLook(dateKey, draws);
  const quote = pickQuote({ key: dateKey, phase, payday, salt });
  const chipsKey = chips.join('|');

  useEffect(() => {
    let alive = true;
    let objUrl: string | null = null;
    const data: CardData = { custom, ...drawLook(dateKey, draws), dateText, nameTag, chips: chipsKey ? chipsKey.split('|') : [], quote };
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
  }, [custom, dateKey, draws, dateText, nameTag, chipsKey, quote]);

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
    <div className="overlay" role="dialog" aria-modal="true" aria-label="오늘의 카드" onClick={onClose}>
      <div className="sheet share-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>오늘의 카드</h3>
        <div className="share-preview">{url ? <img src={url} alt="오늘의 햄스터 카드 미리보기" /> : <span className="muted">그리는 중…</span>}</div>
        <p className="muted small center-text">오늘의 컷: {look.comp.label}</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="share-actions">
          <button type="button" className="btn" onClick={() => setDraws((n) => n + 1)}>
            한 번 더 뽑기
          </button>
          <button type="button" className="btn" onClick={() => setSalt((n) => n + 1)}>
            다른 한마디
          </button>
        </div>
        <button type="button" className="btn primary" onClick={share} disabled={!url || busy}>
          {busy ? '여는 중…' : '공유하기'}
        </button>
        <button type="button" className="btn ghost" onClick={onClose}>
          닫기
        </button>
      </div>
    </div>
  );
}
