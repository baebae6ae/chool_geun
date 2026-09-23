/**
 * 털 윤곽 생성기.
 * 매끈한 도형 대신 바깥쪽으로 살짝 휘어진 작은 털 끝(tuft)을 촘촘히 이어 붙여
 * 가장자리가 보송보송해 보이는 path를 만든다. 결과는 결정적이라 매 렌더 동일하다.
 */

export type Pt = [number, number];

/** 극좌표 반지름 함수로 닫힌 도형의 점들을 샘플링 (y축 아래 방향, 시계방향) */
export function sampleShape(n: number, fn: (theta: number) => Pt): Pt[] {
  return Array.from({ length: n }, (_, i) => fn(-Math.PI / 2 + (i / n) * Math.PI * 2));
}

/**
 * @param pts   시계방향 점 목록 (닫힌 도형)
 * @param amp   i번째 털 끝이 바깥으로 삐져나오는 정도
 * @param lean  털이 한쪽으로 쓸린 정도 (접선 방향 비율)
 */
export function tuftPath(
  pts: Pt[],
  amp: (i: number, p: Pt) => number,
  leanOf: number | ((i: number, p: Pt) => number) = 0.35,
  closed = true,
): string {
  const n = pts.length;
  const segs = closed ? n : n - 1;
  const f = (v: number) => Math.round(v * 10) / 10;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1;
    const tx = dx / len;
    const ty = dy / len;
    // 시계방향(화면 좌표)에서 바깥쪽 법선
    const nx = ty;
    const ny = -tx;
    const A = amp(i, a);
    const lean = typeof leanOf === 'number' ? leanOf : leanOf(i, a);
    // 부드러운 털뭉치: 한 구간을 바깥으로 불룩한 3차 곡선 하나로. 꼭짓점을 접선 방향으로 밀어 털결을 만든다.
    const c1: Pt = [a[0] + dx * 0.15 + nx * A * 1.3 + tx * A * lean, a[1] + dy * 0.15 + ny * A * 1.3 + ty * A * lean];
    const c2: Pt = [
      a[0] + dx * 0.8 + nx * A * 1.1 + tx * A * lean * 1.6,
      a[1] + dy * 0.8 + ny * A * 1.1 + ty * A * lean * 1.6,
    ];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(b[0])} ${f(b[1])}`;
  }
  return closed ? d + 'Z' : d;
}

/** 매끈한 닫힌 path (Catmull-Rom → Bezier) — 클립 경로나 그림자용 */
export function smoothPath(pts: Pt[]): string {
  const n = pts.length;
  const f = (v: number) => Math.round(v * 10) / 10;
  let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return d + 'Z';
}

/** 0~1 사이 부드러운 종 모양 가중치 (각도 거리 기반) */
export function bell(theta: number, center: number, width: number): number {
  let d = Math.abs(theta - center) % (Math.PI * 2);
  if (d > Math.PI) d = Math.PI * 2 - d;
  return Math.exp(-(d * d) / (2 * width * width));
}

/** 약간의 결정적 흔들림 (-1 ~ 1) */
export function jitter(i: number): number {
  return Math.sin(i * 12.9898) * 0.5 + Math.sin(i * 4.1414) * 0.5;
}

/** 결정적 0~1 값 */
export function rand01(i: number): number {
  const x = Math.sin(i * 91.345 + 7.13) * 43758.5453;
  return x - Math.floor(x);
}
