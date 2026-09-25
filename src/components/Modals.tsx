import { useEffect, useState } from 'react';
import { GACHA_BY_ID, RARITY_LABEL } from '../domain/gacha';
import { formatDotDate, formatDuration } from '../domain/date';
import { formatWon, itemOf } from '../domain/records';
import type { Customization, DailyWork, Rarity } from '../domain/types';
import { buzz } from '../haptics';
import { HamsterSprite } from './hamster/HamsterSprite';
import { ProgressBar } from './WorkBuild';

/** 등급이 높을수록 캡슐이 오래·세게 흔들리다 열린다 */
const REVEAL: Record<Rarity, { wait: number; buzz: number[] }> = {
  COMMON: { wait: 700, buzz: [] },
  UNCOMMON: { wait: 850, buzz: [] },
  RARE: { wait: 1100, buzz: [15] },
  EPIC: { wait: 1500, buzz: [20, 60, 30] },
  LEGENDARY: { wait: 2000, buzz: [30, 60, 30, 60, 80] },
};

/** 기획서 7. 근무 중 랜덤 발생한 직장인 가챠 */
export function GachaModal({ id, eventId, isNew, remaining, onClose }: { id: string; eventId: string; isNew: boolean; remaining: number; onClose: () => void }) {
  const e = GACHA_BY_ID[eventId];
  const [opened, setOpened] = useState(false);
  const tier = e ? REVEAL[e.rarity] : REVEAL.COMMON;
  useEffect(() => {
    setOpened(false);
    const t = setTimeout(() => setOpened(true), tier.wait);
    return () => clearTimeout(t);
  }, [id, tier.wait]);
  useEffect(() => {
    if (opened && tier.buzz.length) buzz(tier.buzz);
  }, [opened, tier.buzz]);
  if (!e) return null;
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="직장인 가챠">
      <div key={id} className={`sheet gacha-card rarity-${e.rarity}`}>
        <div className="gacha-title">🎰 직장인 이벤트 발생!</div>
        {!opened ? (
          <div className="capsule" onClick={() => setOpened(true)} style={{ '--wait': `${tier.wait}ms` } as React.CSSProperties} aria-label="캡슐 열기">
            <div className="capsule-top" />
            <div className="capsule-bottom" />
          </div>
        ) : (
          <div className="gacha-reveal">
            <div className="rarity-badge">{e.rarity} · {RARITY_LABEL[e.rarity]}</div>
            <div className="gacha-emoji-wrap">
              <div className="gacha-emoji">{e.emoji}</div>
            </div>
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
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    if (day.completed) buzz([20, 80, 40]);
  }, [day.completed]);
  const leave = (then: () => void) => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(then, 240);
  };
  return (
    <div className={`overlay ${leaving ? 'leaving' : ''}`} role="dialog" aria-modal="true" aria-label="퇴근">
      <div className={`sheet clockout ${day.completed ? 'done' : ''}`}>
        <div className="clockout-lane" aria-hidden>
          <div className="clockout-walker">
            <HamsterSprite custom={custom} pose={{ pose: 'side', action: 'walk' }} />
          </div>
        </div>
        {day.completed ? (
          <>
            <div className="confetti stagger" aria-hidden>🎉✨🎊✨🎉</div>
            <h2 className="stagger">✨ 오늘의 작업 완료! ✨</h2>
            <div className="clockout-item stagger pop-late">{item.emoji}</div>
            <p className="clockout-name stagger">{item.name} 완성</p>
          </>
        ) : (
          <>
            <h2>🐹 오늘은 여기까지!</h2>
            <div className="clockout-item muted">{item.emoji}</div>
            <p className="clockout-name">{item.name}은 내일 이어서 만들어요</p>
          </>
        )}
        <div className="stamp-slam" aria-label="출근 도장">
          <span>🐾</span>
          <small>출근 도장</small>
        </div>
        <div className="kv stagger">
          <span>오늘의 작업량</span>
          <ProgressBar value={day.progress} />
          <span>오늘 번 돈</span>
          <strong>{formatWon(Math.floor(day.earned))}</strong>
        </div>
        <button className="btn primary" onClick={() => leave(onRecord)}>오늘의 기록 보기</button>
        <button className="btn ghost" onClick={() => leave(onClose)}>닫기</button>
      </div>
    </div>
  );
}

/** 월급날: 한 달에 한 번 오는 가장 큰 순간 */
export function PaydayModal({
  custom,
  total,
  workDays,
  name,
  onClose,
}: {
  custom: Customization;
  total: number;
  workDays: number;
  name: string;
  onClose: () => void;
}) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => buzz([30, 60, 30, 60, 80]), []);
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onClose, 240);
  };
  return (
    <div className={`overlay ${leaving ? 'leaving' : ''}`} role="dialog" aria-modal="true" aria-label="월급날">
      <div className="sheet payday">
        <div className="payday-rain" aria-hidden>
          {Array.from({ length: 12 }, (_, i) => (
            <span key={i} style={{ left: `${(i * 8.3 + 4) % 100}%`, animationDelay: `${(i * 0.37) % 2}s` }}>
              {i % 3 === 0 ? '💰' : i % 3 === 1 ? '💵' : '✨'}
            </span>
          ))}
        </div>
        <div className="payday-hamster">
          <HamsterSprite custom={custom} pose={{ pose: 'front', action: 'dance' }} />
        </div>
        <h2 className="stagger">💰 오늘은 월급날!</h2>
        <p className="stagger">한 달 동안 {name || '햄스터'}랑 같이 정말 수고했어요.</p>
        {workDays > 0 && (
          <div className="kv stagger">
            <span>지난 월급날 이후 출근</span>
            <strong>{workDays}일</strong>
            <span>그동안 번 돈</span>
            <strong>{formatWon(Math.floor(total))}</strong>
          </div>
        )}
        <button className="btn primary" onClick={close}>
          야호! 🎉
        </button>
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
