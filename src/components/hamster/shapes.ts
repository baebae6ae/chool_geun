/**
 * 햄스터 도형 정의. 모두 모듈 로드 시 한 번만 계산된다.
 * 머리와 몸이 하나로 이어진 동글동글한 찹쌀떡 실루엣 + 손그림처럼 살짝 울퉁불퉁한 털 윤곽.
 *  - FRONT: 앉아서 정면을 보는 자세 (viewBox 0 0 120 120, 바닥 y≈107)
 *  - SIDE : 오른쪽을 보는 옆모습, 걷기/달리기/자기 (viewBox 0 0 140 100, 바닥 y≈92)
 */
import { bell, rand01, sampleShape, smoothPath, tuftPath, type Pt } from './geometry';

const TAU = Math.PI * 2;
const thetaOf = (n: number) => (i: number) => -Math.PI / 2 + (i / n) * TAU;
const spow = (v: number, e: number) => Math.sign(v) * Math.abs(v) ** e;

/* ---------------- 정면 ---------------- */

const FN = 32;
const frontT = thetaOf(FN);
function frontBodyPt(t: number): Pt {
  const s = Math.sin(t);
  const c = Math.cos(t);
  // 위는 둥글고 아래로 갈수록 살짝 퍼지는 네모난 찹쌀떡
  const rx = 41 + 4 * Math.max(0, s);
  const ry = s < 0 ? 45 : 44;
  return [60 + rx * spow(c, s < 0 ? 0.9 : 0.74), Math.min(65 + ry * spow(s, s < 0 ? 0.88 : 0.7), 107)];
}
const frontBodyPts = sampleShape(FN, frontBodyPt);

export const FRONT = {
  body: tuftPath(
    frontBodyPts,
    (i) => {
      const t = frontT(i);
      const base =
        0.35 +
        2.1 * (bell(t, 0.0, 0.42) + bell(t, Math.PI, 0.42)) + // 볼 털
        1.0 * (bell(t, 0.85, 0.3) + bell(t, Math.PI - 0.85, 0.3)) - // 엉덩이 옆
        1.4 * bell(t, Math.PI / 2, 0.45) - // 바닥
        0.4 * bell(t, -Math.PI / 2, 0.6); // 정수리
      return Math.max(0, base * (0.35 + 1.1 * rand01(i + 3)));
    },
    0,
  ),
  clip: smoothPath(frontBodyPts),
  /** 볼 옆으로 삐죽 나온 털 몇 가닥 */
  ticksL: 'M13.4 56 l-4.2 -2.2 M12.8 61.5 l-4.8 -.2',
  ticksR: 'M106.6 56 l4.2 -2.2 M107.2 61.5 l4.8 -.2',
};

/* ---------------- 옆모습 ---------------- */

const SN = 34;
const sideT = thetaOf(SN);
function sideBodyPt(t: number): Pt {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const rx = c > 0 ? 39 : 36;
  const ry = s < 0 ? 31 : 29;
  // 앞쪽 위(이마)를 부풀려 머리를 동그랗게, 코끝은 살짝 뾰족하게
  const bump = 6 * bell(t, -0.9, 0.45) + 3 * bell(t, 0.1, 0.22) - 2 * bell(t, -1.6, 0.3);
  return [68 + (rx + bump) * spow(c, 0.88), Math.min(62 + (ry + bump) * spow(s, 0.82), 91)];
}
const sideBodyPts = sampleShape(SN, sideBodyPt);

export const SIDE = {
  body: tuftPath(
    sideBodyPts,
    (i) => {
      const t = sideT(i);
      const base =
        0.35 +
        1.8 * bell(t, Math.PI, 0.6) + // 엉덩이
        1.2 * bell(t, 0.75, 0.3) - // 볼 아래
        0.8 * bell(t, 0.1, 0.2) - // 코끝은 매끈
        1.2 * bell(t, Math.PI / 2, 0.5); // 배 바닥
      return Math.max(0, base * (0.35 + 1.1 * rand01(i + 17)));
    },
    0,
  ),
  clip: smoothPath(sideBodyPts),
  /** 달릴 때 뒤로 남는 속도선 */
  ticks: 'M26 56 l-6 -1.4 M24.6 63 l-7 .4 M26 70 l-5 1.6',
};

/* ---------------- 자는 자세 (앞을 보고 식빵처럼 엎드림, viewBox 0 0 140 100) ---------------- */

const LN = 34;
const loafT = thetaOf(LN);
function loafPt(t: number): Pt {
  const s = Math.sin(t);
  const c = Math.cos(t);
  const rx = 45 + 3 * Math.max(0, s);
  const ry = s < 0 ? 29 : 24;
  return [70 + rx * spow(c, s < 0 ? 0.85 : 0.6), Math.min(66 + ry * spow(s, s < 0 ? 0.9 : 0.55), 91)];
}
const loafPts = sampleShape(LN, loafPt);

export const LOAF = {
  body: tuftPath(
    loafPts,
    (i) => {
      const t = loafT(i);
      const base =
        0.35 +
        1.8 * (bell(t, 0.1, 0.4) + bell(t, Math.PI - 0.1, 0.4)) - // 옆구리 털
        1.4 * bell(t, Math.PI / 2, 0.5) - // 바닥
        0.3 * bell(t, -Math.PI / 2, 0.6);
      return Math.max(0, base * (0.35 + 1.1 * rand01(i + 29)));
    },
    0,
  ),
  clip: smoothPath(loafPts),
};
