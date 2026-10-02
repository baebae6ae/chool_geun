import { useEffect, useRef, useState } from 'react';
import { drawLook, renderCard, shareCardImage, type CardData } from '../shareCard';
import { now as clockNow } from '../store';
import { pickQuote, pickTiredQuote } from '../domain/quotes';
import type { Customization } from '../domain/types';

export type TimeBand =
  | { kind: 'down' | 'up'; at: number; prefix: string; suffix?: string }
  | { kind: 'text'; text: string };

interface Props {
  custom: Customization;
  dateKey: string;
  dateText: string;
  off: boolean;
  payday: boolean;
  nameTag: string;
  chips: string[];
  /** 야근 중이면 녹초 버전부터 보여준다 */
  defaultTired?: boolean;
  /** 카드 띠에 넣는 시간 문구. down: 남은 시간, up: 지난 시간, text: 그대로 */
  timeBand?: TimeBand | null;
  onClose: () => void;
}

/** 오늘의 카드: 구도·색·장식이 날마다 랜덤. 돈 정보는 담지 않는다. */
export function ShareSheet({ custom, dateKey, dateText, off, payday, nameTag, chips, defaultTired = false, timeBand = null, onClose }: Props) {
  const [draws, setDraws] = useState(0);
  const [tired, setTired] = useState(defaultTired);
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const blobRef = useRef<Blob | null>(null);
  const look = drawLook(dateKey, draws, tired);
  const quote = tired ? pickTiredQuote(dateKey) : pickQuote({ key: dateKey, off, payday });
  const chipsKey = chips.join('|');

  useEffect(() => {
    let alive = true;
    let objUrl: string | null = null;
    let remaining: string | undefined;
    if (timeBand?.kind === 'text') remaining = timeBand.text;
    else if (timeBand) {
      const ms = Math.abs(timeBand.at - clockNow());
      const cs = Math.floor(ms / 10);
      remaining = `${timeBand.prefix} ${Math.floor(cs / 360000)}시간${Math.floor(cs / 6000) % 60}분${Math.floor(cs / 100) % 60}.${String(cs % 100).padStart(2, '0')}초${timeBand.suffix ?? ''}`;
    }
    const data: CardData = { remaining, custom, ...drawLook(dateKey, draws, tired), tired, dateText, nameTag, chips: chipsKey ? chipsKey.split('|') : [], quote };
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
  }, [custom, dateKey, draws, tired, timeBand, dateText, nameTag, chipsKey, quote]);

  const share = async () => {
    if (!blobRef.current || busy) return;
    setBusy(true);
    try {
      await shareCardImage(blobRef.current, `햄스터출근일지-${dateKey}.jpg`);
    } catch {
      setError('공유하지 못했어요. 이미지를 길게 눌러 저장해 보세요.');
    }
    setBusy(false);
  };

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="오늘의 카드" onClick={onClose}>
      <div className="sheet share-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>오늘의 카드</h3>
        <div className="seg" role="radiogroup" aria-label="카드 버전">
          <button type="button" role="radio" aria-checked={!tired} className={!tired ? 'on' : ''} onClick={() => setTired(false)}>
            🐹 기본 버전
          </button>
          <button type="button" role="radio" aria-checked={tired} className={tired ? 'on' : ''} onClick={() => setTired(true)}>
            😵 녹초 버전
          </button>
        </div>
        <div className="share-preview">{url ? <img src={url} alt="오늘의 햄스터 카드 미리보기" /> : <span className="muted">그리는 중…</span>}</div>
        <p className="muted small center-text">오늘의 컷: {look.comp.label}</p>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="share-actions">
          <button type="button" className="btn" onClick={() => setDraws((n) => n + 1)}>
            한 번 더 뽑기
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
