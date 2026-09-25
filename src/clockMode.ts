import { useEffect, useState } from 'react';

/** 폰을 가로로 눕히면 탁상시계 화면으로 */
const CLOCK_QUERY = '(orientation: landscape) and (max-height: 540px)';

export function useClockMode(): boolean {
  const [on, setOn] = useState(() => typeof matchMedia !== 'undefined' && matchMedia(CLOCK_QUERY).matches);
  useEffect(() => {
    const m = matchMedia(CLOCK_QUERY);
    const sync = () => setOn(m.matches);
    m.addEventListener('change', sync);
    return () => m.removeEventListener('change', sync);
  }, []);
  return on;
}

/** 켜둔 동안 화면이 꺼지지 않게 (지원 브라우저만). 다른 앱에 갔다 오면 다시 요청 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let done = false;
    const request = () => {
      if (document.visibilityState !== 'visible') return;
      navigator.wakeLock
        .request('screen')
        .then((l) => {
          if (done) l.release().catch(() => {});
          else lock = l;
        })
        .catch(() => {});
    };
    request();
    document.addEventListener('visibilitychange', request);
    return () => {
      done = true;
      document.removeEventListener('visibilitychange', request);
      lock?.release().catch(() => {});
    };
  }, [active]);
}
