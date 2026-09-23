import { useEffect, useState } from 'react';
import { GACHA_BY_ID, RARITY_LABEL } from '../domain/gacha';
import { formatDotDate, formatDuration } from '../domain/date';
import { formatWon, itemOf } from '../domain/records';
import type { Customization, DailyWork } from '../domain/types';
import { Hamster } from './Hamster';
import { ProgressBar } from './WorkBuild';

/** 기획서 7. 근무 중 랜덤 발생한 직장인 가챠 */
export function GachaModal({ eventId, isNew, remaining, onClose }: { eventId: string; isNew: boolean; remaining: number; onClose: () => void }) {
  const e = GACHA_BY_ID[eventId];
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    setOpened(false);
    const id = setTimeout(() => setOpened(true), 900);
    return () => clearTimeout(id);
  }, [eventId]);
  if (!e) return null;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="직장인 가챠">
      <div className={`sheet gacha-card rarity-${e.rarity}`}>
        <div className="gacha-title">🎰 직장인 이벤트 발생!</div>
        {!opened ? (
          <div className="capsule" onClick={() => setOpened(true)} aria-label="캡슐 열기">
            <div className="capsule-top" />
            <div className="capsule-bottom" />
          </div>
        ) : (
          <div className="gacha-reveal">
            <div className="rarity-badge">{e.rarity} · {RARITY_LABEL[e.rarity]}</div>
            <div className="gacha-emoji">{e.emoji}</div>
            <div className="gacha-name">{e.name}</div>
            <p className="gacha-desc">{e.description}</p>
            {isNew && <div className="new-badge">NEW! 도감 등록</div>}
          </div>
        )}
        <button className="btn primary" onClick={onClose} disabled={!opened}>
          {remaining > 0 ? `확인 (${remaining}개 더 있어요)` : '확인'}
        </button>
      </div>
    </div>
  );
}

/** 기획서 10. 퇴근 연출 */
export function ClockOutModal({ day, custom, onClose, onRecord }: { day: DailyWork; custom: Customization; onClose: () => void; onRecord: () => void }) {
  const item = itemOf(day);
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="퇴근">
      <div className="sheet clockout">
        <Hamster custom={custom} mood="off" bare className="leaving" />
        {day.completed ? (
          <>
            <div className="confetti" aria-hidden>🎉✨🎊✨🎉</div>
            <h2>✨ 오늘의 작업 완료! ✨</h2>
            <div className="clockout-item pop">{item.emoji}</div>
            <p className="clockout-name">{item.name} 완성</p>
          </>
        ) : (
          <>
            <h2>🐹 오늘은 여기까지!</h2>
            <div className="clockout-item muted">{item.emoji}</div>
            <p className="clockout-name">{item.name}은 내일 이어서 만들어요</p>
          </>
        )}
        <div className="kv">
          <span>오늘의 작업량</span>
          <ProgressBar value={day.progress} />
          <span>오늘 번 돈</span>
          <strong>{formatWon(Math.floor(day.earned))}</strong>
        </div>
        <button className="btn primary" onClick={onRecord}>오늘의 기록 보기</button>
        <button className="btn ghost" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

/** 기획서 11. Daily Record 카드 */
export function DailyRecordCard({ day, hamsterName }: { day: DailyWork; hamsterName: string }) {
  const item = itemOf(day);
  const gachaCount = day.gacha.filter((g) => g.obtained).length;
  return (
    <div className="card record">
      <div className="record-date">{formatDotDate(day.date)}</div>
      <div className="record-title">🐹 오늘의 {hamsterName || '햄스터'}</div>
      <dl className="record-grid">
        <dt>근무시간</dt>
        <dd>{formatDuration(day.workedMs)}</dd>
        <dt>오늘 번 돈</dt>
        <dd>{formatWon(Math.floor(day.earned))}</dd>
        <dt>작업물</dt>
        <dd>{item.emoji} {item.name}</dd>
        <dt>완성도</dt>
        <dd>{Math.floor(day.progress * 100)}%{day.early && !day.completed ? ' (조기 퇴근)' : ''}</dd>
        <dt>가챠 획득</dt>
        <dd>
          {gachaCount}개{' '}
          <span className="record-gacha">
            {day.gacha.filter((g) => g.obtained).map((g, i) => (
              <span key={i} title={GACHA_BY_ID[g.eventId]?.name}>{GACHA_BY_ID[g.eventId]?.emoji}</span>
            ))}
          </span>
        </dd>
      </dl>
      <div className="record-comment">
        <span>오늘의 한마디</span>
        <p>"{day.completed ? day.comment : '내일 마저 만들어요.'}"</p>
      </div>
    </div>
  );
}
