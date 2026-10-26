/**
 * 제보하기 · 개발자 응원하기 시트.
 * 제보를 보내면 고맙다는 인사 뒤에 살짝 응원을 부탁한다 (안 해도 그만, 기능은 똑같다).
 */
import { useEffect, useState } from 'react';
import { HamsterSprite } from './hamster/HamsterSprite';
import { useBackHandler } from '../backStack';
import { buzz } from '../haptics';
import { billingAvailable, buy, loadPrices } from '../billing';
import { TIERS, type Tier } from '../domain/support';
import { REPORT_KINDS, REPORT_MAX, reportProblem, sendReport, type ReportKind } from '../domain/report';
import type { AppState, Customization } from '../domain/types';

function Sheet({ label, onClose, children }: { label: string; onClose: () => void; children: React.ReactNode }) {
  const [leaving, setLeaving] = useState(false);
  const close = () => {
    if (leaving) return;
    setLeaving(true);
    setTimeout(onClose, 240);
  };
  useBackHandler(true, close);
  return (
    <div className={`overlay ${leaving ? 'leaving' : ''}`} role="dialog" aria-modal="true" aria-label={label}>
      <div className="sheet cheer-sheet">
        <button type="button" className="cheer-close" onClick={close} aria-label="닫기">
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

/** 응원 상품 고르기 → 결제 → 고마워하는 햄스터 */
function SupportPanel({ custom, count, onSupported, lead, onThanked }: { custom: Customization; count: number; onSupported: () => void; lead?: React.ReactNode; onThanked?: () => void }) {
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [thanks, setThanks] = useState<Tier | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    loadPrices(TIERS.map((t) => t.id)).then(setPrices);
  }, []);
  const pick = async (t: Tier) => {
    if (busy) return;
    setMsg(null);
    setBusy(t.id);
    const r = await buy(t.id);
    setBusy(null);
    if (r === 'ok') {
      onSupported();
      setThanks(t);
      onThanked?.();
      buzz([40, 30, 40, 30, 120]);
    } else if (r === 'fail') setMsg('결제를 진행하지 못했어요. 잠시 뒤에 다시 해 주세요.');
  };
  if (thanks) {
    return (
      <div className="cheer-thanks">
        <div className="cheer-confetti" aria-hidden>
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.08}s` }} />
          ))}
        </div>
        <div className="cheer-hamster">
          <HamsterSprite custom={custom} pose={{ pose: 'front', action: 'cheer' }} />
        </div>
        <h2>{thanks.emoji} 고마워요!!</h2>
        <p>{thanks.thanks}</p>
        <p className="muted small">도감에 💛 후원자 배지가 붙었어요</p>
      </div>
    );
  }
  return (
    <div className="cheer-support">
      {lead}
      <div className="cheer-hamster small">
        <HamsterSprite custom={custom} pose={{ pose: 'front', action: 'shy' }} />
      </div>
      <p className="cheer-copy">
        햄스터 출근일지는 광고 없이, 직장인 한 명이 퇴근하고 만들고 있어요.
        <br />
        재밌게 쓰고 계시다면 커피 한 잔으로 응원해 주세요.
      </p>
      <div className="cheer-tiers">
        {TIERS.map((t) => (
          <button key={t.id} type="button" className="cheer-tier" disabled={!billingAvailable || !!busy} onClick={() => pick(t)}>
            <span aria-hidden>{t.emoji}</span>
            <b>{t.name}</b>
            <small>{busy === t.id ? '…' : (prices[t.id] ?? t.price)}</small>
          </button>
        ))}
      </div>
      {!billingAvailable && <p className="muted small">응원은 안드로이드 앱(플레이스토어)에서 할 수 있어요.</p>}
      {msg && (
        <p className="muted small" role="status">
          {msg}
        </p>
      )}
      <p className="muted small">응원해도 기능은 똑같아요. 대신 햄스터가 엄청 고마워해요 🐹</p>
      {count > 0 && <p className="cheer-count">💛 지금까지 {count}번 응원해 주셨어요</p>}
    </div>
  );
}

export function SupportSheet({ state, onSupported, onClose }: { state: AppState; onSupported: () => void; onClose: () => void }) {
  return (
    <Sheet label="개발자 응원하기" onClose={onClose}>
      <h2 className="cheer-title">☕ 개발자 응원하기</h2>
      <SupportPanel custom={state.custom} count={state.support?.count ?? 0} onSupported={onSupported} />
    </Sheet>
  );
}

/** 제보 쓰기 → 보내기 → 고마워요 + 살짝 응원 부탁 */
export function ReportSheet({ state, onSent, onSupported, onClose }: { state: AppState; onSent: () => void; onSupported: () => void; onClose: () => void }) {
  const [kind, setKind] = useState<ReportKind>('chat');
  const [text, setText] = useState('');
  const [nick, setNick] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [step, setStep] = useState<'write' | 'sending' | 'done'>('write');
  const [err, setErr] = useState<string | null>(null);
  const [thanked, setThanked] = useState(false);
  const hint = REPORT_KINDS.find((k) => k.id === kind)!.hint;
  const submit = async () => {
    const r = { kind, text, nick };
    const problem = reportProblem(r, agreed);
    if (problem) return setErr(problem);
    setErr(null);
    setStep('sending');
    if (await sendReport(r)) {
      onSent();
      setStep('done');
      buzz(40);
    } else {
      setStep('write');
      setErr('보내지 못했어요. 인터넷 연결을 확인하고 다시 보내 주세요.');
    }
  };
  if (step === 'done') {
    return (
      <Sheet label="제보 고마워요" onClose={onClose}>
        <SupportPanel
          custom={state.custom}
          count={state.support?.count ?? 0}
          onSupported={onSupported}
          onThanked={() => setThanked(true)}
          lead={
            <div className="cheer-done">
              <h2>📮 제보 고마워요!</h2>
              <p>재밌게 각색해서 {kind === 'chat' ? '사이다 대화' : '오늘의 썰'}로 만들어 볼게요. 앱에 실리면 크레딧에 이름이 나가요!</p>
              <hr />
              <p className="cheer-ask">그리고… 혹시 개발자에게 커피 한 잔? ☕</p>
            </div>
          }
        />
        <button type="button" className={`btn ${thanked ? 'primary' : 'ghost'}`} onClick={onClose}>
          {thanked ? '닫기' : '다음에요'}
        </button>
      </Sheet>
    );
  }
  return (
    <Sheet label="제보하기" onClose={onClose}>
      <h2 className="cheer-title">📮 썰·대화 제보하기</h2>
      <p className="muted small">겪은 일을 보내 주시면 각색해서 앱에 실어 드려요. 회사 이름이나 실명은 빼 주세요.</p>
      <div className="cheer-kinds" role="radiogroup" aria-label="제보 종류">
        {REPORT_KINDS.map((k) => (
          <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} className={`chip ${kind === k.id ? 'on' : ''}`} onClick={() => setKind(k.id)}>
            {k.emoji} {k.label}
          </button>
        ))}
      </div>
      <label className="cheer-field">
        <span>내용</span>
        <textarea rows={6} maxLength={REPORT_MAX} placeholder={hint} value={text} onChange={(e) => setText(e.target.value)} />
        <small>
          {text.length} / {REPORT_MAX}
        </small>
      </label>
      <label className="cheer-field">
        <span>크레딧에 쓸 이름 (비우면 익명)</span>
        <input type="text" maxLength={20} placeholder="예: 김대리 → 「제보: 익명의 김대리님」" value={nick} onChange={(e) => setNick(e.target.value)} />
      </label>
      <label className="cheer-agree">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <span>제보한 내용이 재밌게 각색되어 앱에 실릴 수 있어요</span>
      </label>
      {err && (
        <p className="cheer-err" role="alert">
          {err}
        </p>
      )}
      <button type="button" className="btn primary" disabled={step === 'sending'} onClick={submit}>
        {step === 'sending' ? '보내는 중…' : '📮 제보 보내기'}
      </button>
    </Sheet>
  );
}
