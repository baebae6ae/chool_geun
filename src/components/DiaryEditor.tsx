/** 오늘의 한 줄 일기: 기분 이모지 + (원하면) 메모 */
import { useState } from 'react';
import { DIARY_MOODS, MEMO_MAX } from '../domain/diary';
import type { Diary } from '../domain/types';

export function DiaryEditor({ diary, onChange, label = '오늘 어땠어요?' }: { diary?: Diary; onChange: (patch: Partial<Diary>) => void; label?: string }) {
  const [open, setOpen] = useState(!!diary?.memo);
  const [memo, setMemo] = useState(diary?.memo ?? '');
  return (
    <div className="diary">
      <div className="diary-head">
        <span>{label}</span>
        {!open && (
          <button type="button" className="diary-memo-btn" onClick={() => setOpen(true)}>
            ✏️ 메모
          </button>
        )}
      </div>
      <div className="diary-moods" role="radiogroup" aria-label="오늘 기분">
        {DIARY_MOODS.map((m) => (
          <button
            key={m.emoji}
            type="button"
            role="radio"
            aria-checked={diary?.mood === m.emoji}
            aria-label={m.label}
            className={diary?.mood === m.emoji ? 'on' : ''}
            onClick={() => onChange({ mood: m.emoji })}
          >
            {m.emoji}
          </button>
        ))}
      </div>
      {open && (
        <textarea
          className="diary-memo"
          value={memo}
          maxLength={MEMO_MAX}
          rows={2}
          placeholder="오늘 있었던 일, 하고 싶은 말…"
          onChange={(e) => {
            setMemo(e.target.value);
            onChange({ memo: e.target.value });
          }}
        />
      )}
    </div>
  );
}
