import { useState } from 'react';
import { Hamster } from '../components/Hamster';
import { formatWon } from '../domain/records';
import { hourlyWage, validateSchedule } from '../domain/schedule';
import type { Customization, Settings } from '../domain/types';

export const DEFAULT_SETTINGS: Settings = {
  salary: 3_000_000,
  payday: 25,
  monthWorkDays: 21,
  weekendWork: false,
  workStart: '09:00',
  workEnd: '18:00',
  lunchStart: '12:00',
  lunchEnd: '13:00',
  hamsterName: '햄찌',
  notifications: false,
};

interface Props {
  initial: Settings | null;
  custom: Customization;
  onSave: (s: Settings) => void;
  onCancel?: () => void;
  onReset?: () => void;
}

/** 기획서 14. 사용자 설정 (최초 실행 시 온보딩 겸용) */
export function SettingsForm({ initial, custom, onSave, onCancel, onReset }: Props) {
  const onboarding = !initial;
  const [s, setS] = useState<Settings>(initial ?? DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((prev) => ({ ...prev, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err =
      validateSchedule(s) ??
      (s.salary <= 0 ? '월급을 입력해 주세요.' : null) ??
      (s.payday < 1 || s.payday > 31 ? '급여일은 1~31일 사이예요.' : null) ??
      (s.monthWorkDays < 1 || s.monthWorkDays > 31 ? '월 근무일수는 1~31일 사이예요.' : null);
    if (err) return setError(err);
    let next = s;
    if (s.notifications && 'Notification' in window && Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') next = { ...s, notifications: false };
    }
    onSave(next);
  };

  const hourly = hourlyWage(s);

  return (
    <form className="screen settings" onSubmit={submit}>
      {onboarding ? (
        <div className="onboarding-hero">
          <Hamster custom={custom} mood="arriving" bare />
          <h1>햄스터 출근일지</h1>
          <p>
            출근해서 켜두면, 햄스터가 <b>내가 일한 시간만큼</b> 무언가를 만들고
            <br />
            퇴근할 때 하나가 완성돼요.
          </p>
        </div>
      ) : (
        <header className="screen-head">
          <h1>⚙️ 설정</h1>
          {onCancel && <button type="button" className="icon-btn" onClick={onCancel} aria-label="닫기">✕</button>}
        </header>
      )}

      <section className="card form">
        <div className="card-label">필수</div>
        <label>
          월급 (세후, 원)
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={10000}
            value={s.salary || ''}
            onChange={(e) => set('salary', Number(e.target.value))}
            required
          />
        </label>
        <label>
          급여일
          <select value={s.payday} onChange={(e) => set('payday', Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i} value={i + 1}>매월 {i + 1}일</option>
            ))}
          </select>
        </label>
        <div className="row">
          <label>
            출근시간
            <input type="time" value={s.workStart} onChange={(e) => set('workStart', e.target.value)} required />
          </label>
          <label>
            퇴근시간
            <input type="time" value={s.workEnd} onChange={(e) => set('workEnd', e.target.value)} required />
          </label>
        </div>
        <div className="row">
          <label>
            점심 시작
            <input type="time" value={s.lunchStart} onChange={(e) => set('lunchStart', e.target.value)} required />
          </label>
          <label>
            점심 끝
            <input type="time" value={s.lunchEnd} onChange={(e) => set('lunchEnd', e.target.value)} required />
          </label>
        </div>
      </section>

      <section className="card form">
        <div className="card-label">선택</div>
        <label>
          햄스터 이름
          <input type="text" maxLength={10} value={s.hamsterName} onChange={(e) => set('hamsterName', e.target.value)} />
        </label>
        <label>
          월 근무일수
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            value={s.monthWorkDays || ''}
            onChange={(e) => set('monthWorkDays', Number(e.target.value))}
          />
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.weekendWork} onChange={(e) => set('weekendWork', e.target.checked)} />
          주말에도 근무해요
        </label>
        <label className="toggle">
          <input type="checkbox" checked={s.notifications} onChange={(e) => set('notifications', e.target.checked)} />
          알림 받기 (출근·가챠·퇴근, 하루 최대 3회)
        </label>
        {hourly > 0 && Number.isFinite(hourly) && (
          <p className="muted small">시간당 급여 약 {formatWon(Math.round(hourly))} (월급 ÷ 월 근무시간)</p>
        )}
      </section>

      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="btn primary big-btn">{onboarding ? '🐹 출근 시작하기' : '저장'}</button>

      {onReset && (
        <button
          type="button"
          className="btn ghost danger"
          onClick={() => confirm('모든 기록과 도감이 삭제돼요. 정말 초기화할까요?') && onReset()}
        >
          데이터 초기화
        </button>
      )}
    </form>
  );
}
