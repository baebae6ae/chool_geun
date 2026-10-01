import { useEffect, useRef, useState } from 'react';
import { now as clockNow } from '../store';
import { pickQuote, type QuotePhase } from '../domain/quotes';

const p2 = (n: number) => String(n).padStart(2, '0');

/**
 * 켜놓고 보는 큰 시계. 시·분·초와 1/100초까지 requestAnimationFrame으로 직접 그려서
 * 초 뒤의 작은 숫자가 정신없이 굴러간다. (React 재렌더링 없이 글자만 바꿔 가볍다)
 * '동작 줄이기' 설정이면 초 단위로만 갱신한다.
 */
export function BigClock({ now, info, dateText }: { now: number; info?: string; dateText?: string }) {
  const refs = useRef<(HTMLSpanElement | null)[]>([]);
  // 첫 렌더 값만 쓴다 — 이후 글자는 아래 requestAnimationFrame이 직접 바꾸므로 React가 덮어쓰지 않게 고정
  const [initDigits] = useState(() => {
    const d = new Date(now);
    return [p2(d.getHours()), p2(d.getMinutes()), p2(d.getSeconds()), '00'].join('');
  });

  useEffect(() => {
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const last: string[] = [];
    const paint = () => {
      const t = clockNow();
      const d = new Date(t);
      const cs = reduce ? '00' : p2(Math.floor((t % 1000) / 10));
      const str = `${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}${cs}`;
      for (let i = 0; i < 8; i++) {
        if (last[i] !== str[i]) {
          last[i] = str[i];
          const el = refs.current[i];
          if (el) el.textContent = str[i];
        }
      }
    };
    paint();
    if (reduce) {
      const id = setInterval(paint, 1000);
      return () => clearInterval(id);
    }
    let raf = 0;
    const loop = () => {
      paint();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const digit = (i: number) => (
    <span key={i} className="bc-d" ref={(el) => void (refs.current[i] = el)}>
      {initDigits[i]}
    </span>
  );
  const cur = new Date(now);
  const spoken = `현재 시각 ${cur.getHours()}시 ${cur.getMinutes()}분`;
  return (
    <section className="big-clock" aria-label={spoken}>
      {dateText && <div className="bc-date">{dateText}</div>}
      <div className="bc-time" aria-hidden>
        {digit(0)}
        {digit(1)}
        <span className="bc-colon">:</span>
        {digit(2)}
        {digit(3)}
        <span className="bc-sec">
          {digit(4)}
          {digit(5)}
          <span className="bc-cs">
            <span className="bc-dot">.</span>
            {digit(6)}
            {digit(7)}
          </span>
        </span>
      </div>
      {info && <div className="bc-info">{info}</div>}
    </section>
  );
}

/** 오늘의 한마디: 상황에 맞는 직장인 멘트. 누르면 다른 문구로 바뀐다. */
export function QuoteCard({ dateKey, phase, payday }: { dateKey: string; phase: QuotePhase; payday: boolean }) {
  const [salt, setSalt] = useState(0);
  const text = pickQuote({ key: dateKey, phase, payday, salt });
  return (
    <button type="button" className="quote-card" onClick={() => setSalt((s) => s + 1)} aria-label="오늘의 한마디, 누르면 다른 말로 바뀌어요">
      <span className="quote-label">오늘의 한마디</span>
      <span className="quote-text" key={`${phase}-${salt}`}>
        {text}
      </span>
    </button>
  );
}
