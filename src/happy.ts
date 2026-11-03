/** 기분 좋은 순간 알리기 (App이 받아서 가끔 리뷰를 부탁한다) */
const EVENT = 'hamster:happy';

export function happyMoment() {
  window.dispatchEvent(new Event(EVENT));
}

export function onHappy(fn: () => void): () => void {
  window.addEventListener(EVENT, fn);
  return () => window.removeEventListener(EVENT, fn);
}

/** Google Play 공식 별점 창 (안드로이드 앱에서만) */
export async function requestReview(): Promise<void> {
  const { isNative } = await import('./platform');
  if (!isNative) return;
  try {
    const { InAppReview } = await import('@capacitor-community/in-app-review');
    await InAppReview.requestReview();
  } catch {
    // 못 띄워도 그만
  }
}
