import { useState } from 'react';
import { toMinutes } from '../domain/date';

const pad = (n: number) => String(n).padStart(2, '0');
const plus = (hhmm: string, min: number) => {
  const m = (toMinutes(hhmm) + min) % (24 * 60);
  return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
};

interface Props {
  /** 예: "어제" · "10월 1일" */
  when: string;
  workEnd: string;
  /** left가 null이면 정시 퇴근 */
  onPick: (left: string | null) => void;
  onLater: () => void;
}

/** "어제 몇 시에 퇴근했어요?" — 정시 이후 퇴근 시각을 알려주면 야근 시간과 못 받은 돈을 계산한다 */
export function LeftSheet({ when, workEnd, onPick, onLater }: Props) {
  const [custom, setCustom] = useState(plus(workEnd, 60));
  const quick = [30, 60, 120, 180].map((m) => ({ label: m < 60 ? `${m}분 뒤` : `${m / 60}시간 뒤`, at: plus(workEnd, m) }));
  return (
    <div className="overlay left-overlay" role="dialog" aria-modal="true" aria-label="퇴근 시각 기록">
      <div className="sheet left-sheet" onClick={(e) => e.stopPropagation()}>
        <h3>{when} 몇 시에 퇴근했어요?</h3>
        <p className="muted small">정시({workEnd})가 넘었다면 알려주세요. 야근한 시간만큼 계산해 둘게요.</p>
        <button type="button" className="btn primary" onClick={() => onPick(null)}>
          정시에 퇴근했어요
        </button>
        <div className="left-quick">
          {quick.map((q) => (
            <button key={q.at} type="button" className="chip-btn" onClick={() => onPick(q.at)}>
              {q.label}
              <small>{q.at}</small>
            </button>
          ))}
        </div>
        <div className="left-custom">
          <label>
            직접 입력
            <input type="time" value={custom} onChange={(e) => setCustom(e.target.value)} />
          </label>
          <button type="button" className="btn" disabled={!custom} onClick={() => onPick(custom)}>
            이 시각에 퇴근했어요
          </button>
        </div>
        <button type="button" className="btn ghost" onClick={onLater}>
          나중에
        </button>
      </div>
    </div>
  );
}
