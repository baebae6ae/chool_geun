import { useState } from 'react';
import { pickQuote, type QuotePhase } from '../domain/quotes';

const p2 = (n: number) => String(n).padStart(2, '0');

/** 켜놓고 멀리서도 보이는 큰 시계. 숫자 칸 너비를 고정해 초가 바뀌어도 흔들리지 않는다. */
export function BigClock({ now, info, dateText }: { now: number; info?: string; dateText?: string }) {
  const d = new Date(now);
  const hh = p2(d.getHours());
  const mm = p2(d.getMinutes());
  const ss = p2(d.getSeconds());
  const digits = (s: string) =>
    [...s].map((c, i) => (
      <span key={i} className="bc-d">
        {c}
      </span>
    ));
  return (
    <section className="big-clock" aria-label={`현재 시각 ${hh}시 ${mm}분`}>
      {dateText && <div className="bc-date">{dateText}</div>}
      <div className="bc-time" aria-hidden>
        {digits(hh)}
        <span className="bc-colon">:</span>
        {digits(mm)}
        <span className="bc-sec">{digits(ss)}</span>
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
