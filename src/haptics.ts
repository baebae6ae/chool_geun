/** 짧은 진동 (안드로이드 등 지원 기기만, iOS 사파리는 조용히 무시) */
export function buzz(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // 진동 미지원
  }
}
