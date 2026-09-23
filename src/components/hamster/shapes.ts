/**
 * 햄스터 도형 정의. 모두 모듈 로드 시 한 번만 계산된다.
 *  - FRONT: 앉아서 정면을 보는 자세 (viewBox 0 0 120 120, 바닥 y≈108)
 *  - SIDE : 오른쪽을 보는 옆모습, 걷기/달리기/자기 (viewBox 0 0 140 100, 바닥 y≈94)
 */
import { bell, rand01, sampleShape, smoothPath, tuftPath, type Pt } from './geometry';

const TAU = Math.PI * 2;
const thetaOf = (n: number) => (i: number) => -Math.PI / 2 + (i / n) * TAU;

/* ---------------- 정면 ---------------- */

const FN = 34;
const frontT = thetaOf(FN);
function frontBodyPt(t: number): Pt {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const rx = 41 + 6 * (1 - (s - 0.3) ** 2);
  const ry = s < 0 ? 48 : 44;
  return [60 + rx * c, Math.min(64 + ry * s, 107)];
}
const frontBodyPts = sampleShape(FN, frontBodyPt);

export const FRONT = {
  body: tuftPath(
    frontBodyPts,
    (i) => {
      const t = frontT(i);
      const base =
        1.1 +
        2.2 * (bell(t, 0.1, 0.35) + bell(t, Math.PI - 0.1, 0.35)) + // 볼 털
        1.2 * (bell(t, 0.9, 0.3) + bell(t, Math.PI - 0.9, 0.3)) - // 엉덩이 옆
        1.0 * bell(t, Math.PI / 2, 0.4) - // 바닥
        0.5 * bell(t, -Math.PI / 2, 0.5); // 정수리는 둥글게
      return Math.max(0.15, base * (0.55 + 0.9 * rand01(i)));
    },
    (i) => 0.45 * (Math.cos(frontT(i)) >= 0 ? 1 : -1),
  ),
  clip: smoothPath(frontBodyPts),
  belly: tuftPath(
    sampleShape(24, (t) => {
      const s = Math.sin(t);
      return [60 + 31 * Math.cos(t), 92 + (s < 0 ? 21 : 30) * s];
    }),
    (i) => (i <= 12 || i >= 22 ? 1.6 * (0.5 + rand01(i + 40)) : 0),
    (i) => (i < 6 || i > 18 ? 0.4 : -0.4),
  ),
  earL: tuftPath(sampleShape(14, (t) => [32 + 10.5 * Math.cos(t), 23 + 10.5 * Math.sin(t)]), (i) => 0.5 + 0.6 * rand01(i + 3), 0.2),
  earR: tuftPath(sampleShape(14, (t) => [88 + 10.5 * Math.cos(t), 23 + 10.5 * Math.sin(t)]), (i) => 0.5 + 0.6 * rand01(i + 9), 0.2),
};

/* ---------------- 옆모습 ---------------- */

const SN = 36;
const sideT = thetaOf(SN);
function sideBodyPt(t: number): Pt {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const rx = c > 0 ? 47 : 42;
  const ry = s < 0 ? 29 : 28;
  // 앞쪽 위(이마)를 크게 부풀려 머리를 둥글고 크게, 코 쪽은 살짝 뾰족하게
  const bump = 10 * bell(t, -1.0, 0.38) + 4 * bell(t, 0.15, 0.22) + 2 * bell(t, Math.PI + 0.3, 0.45) - 2.5 * bell(t, -1.45, 0.25);
  return [68 + (rx + bump) * c, Math.min(62 + (ry + bump) * s, 90)];
}
const sideBodyPts = sampleShape(SN, sideBodyPt);

export const SIDE = {
  body: tuftPath(
    sideBodyPts,
    (i) => {
      const t = sideT(i);
      const base =
        1.3 +
        1.8 * bell(t, Math.PI, 0.5) + // 엉덩이
        1.8 * bell(t, 0.8, 0.3) - // 볼주머니 아래
        1.1 * bell(t, 0.2, 0.18) - // 코끝은 매끈
        0.9 * bell(t, Math.PI / 2, 0.5); // 배 바닥
      return Math.max(0.15, base * (0.55 + 0.9 * rand01(i + 17)));
    },
    (i) => 0.45 * (Math.sin(sideT(i)) < 0 ? -1 : 1),
  ),
  clip: smoothPath(sideBodyPts),
  belly: tuftPath(
    sampleShape(26, (t) => {
      const s = Math.sin(t);
      return [66 + 44 * Math.cos(t), 89 + (s < 0 ? 14 : 10) * s];
    }),
    (i) => (i <= 13 || i >= 25 ? 1.6 * (0.5 + rand01(i + 60)) : 0),
    (i) => (i < 7 || i > 19 ? 0.4 : -0.4),
  ),
  cheek: tuftPath(
    sampleShape(16, (t) => [101 + 13 * Math.cos(t), 72 + 10 * Math.sin(t)]),
    (i) => 1 + 0.8 * rand01(i + 5),
    0.3,
  ),
  ear: tuftPath(sampleShape(14, (t) => [83 + 11 * Math.cos(t), 24 + 11 * Math.sin(t)]), (i) => 0.5 + 0.6 * rand01(i + 21), 0.2),
};
