/** 기록 > 월간: 이달의 움직임 (근무 중 걸음 수 5단계 + 생활 팁) */
import { formatDotDate } from '../domain/date';
import { monthActivity, STEP_TIERS } from '../domain/steps';
import type { AppState } from '../domain/types';
import { HamsterSprite } from './hamster/HamsterSprite';

export function MonthActivityCard({ state, y, m }: { state: AppState; y: number; m: number }) {
  const a = monthActivity(state.days, y, m);
  if (!a.days || !a.main || !a.tip) return null;
  const max = Math.max(...a.counts, 1);
  return (
    <section className="card activity">
      <div className="card-label">👟 이달의 움직임</div>
      <div className="activity-main">
        <span className="activity-emoji" aria-hidden>{a.main.emoji}</span>
        <div>
          <small className="muted">이번 달은 주로</small>
          <b>{a.main.name}</b>
        </div>
      </div>
      <ul className="activity-bars">
        {STEP_TIERS.map((t, i) => (
          <li key={t.level} className={t.level === a.main!.level ? 'main' : ''}>
            <span className="activity-label">{t.emoji} {t.name}</span>
            <span className="activity-track">
              <i style={{ width: `${(a.counts[i] / max) * 100}%` }} />
            </span>
            <span className="activity-count">{a.counts[i]}일</span>
          </li>
        ))}
      </ul>
      <dl className="record-grid">
        <dt>근무 중 하루 평균</dt>
        <dd>{a.average.toLocaleString('ko-KR')}보</dd>
        <dt>이번 달 근무 중 걸음</dt>
        <dd>{a.total.toLocaleString('ko-KR')}보</dd>
        {a.best && (
          <>
            <dt>제일 많이 걸은 날</dt>
            <dd>
              {formatDotDate(a.best.date).slice(5)} · {a.best.steps.toLocaleString('ko-KR')}보
            </dd>
          </>
        )}
      </dl>
      <div className="activity-tip">
        <div className="activity-tip-pet">
          <HamsterSprite custom={state.custom} pose={{ pose: 'front', action: 'yawn' }} />
        </div>
        <div>
          <b>{a.tip.title}</b>
          <p>{a.tip.body}</p>
          <p className="activity-stretch">🙆 {a.tip.stretch}</p>
        </div>
      </div>
      <p className="muted small">근무 시간 동안 휴대폰이 센 걸음 수로 나눈 거예요. 의학적인 진단이 아니에요.</p>
    </section>
  );
}
