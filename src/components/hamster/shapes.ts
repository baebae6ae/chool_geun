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

/* ================= 다른 캐릭터들: 햄스터 몸에 귀만 붙이지 않고 몸 윤곽부터 따로 그린다 ================= */

function fromPts(pts: Pt[], amp: (i: number, t: number) => number, seed: number) {
  const n = pts.length;
  const th = thetaOf(n);
  return {
    body: tuftPath(pts, (i) => Math.max(0, amp(i, th(i)) * (0.35 + 1.1 * rand01(i + seed))), 0),
    clip: smoothPath(pts),
  };
}

/** 롭이어 토끼: 둥근 머리가 그대로 옆으로 퍼진 엉덩이까지 이어지는 찹쌀떡 돔. 바닥은 넓고 평평하다 */
const RN = 36;
const rabbitFront = fromPts(
  sampleShape(RN, (t) => {
    const s = Math.sin(t);
    const c = Math.cos(t);
    if (s < 0) return [60 + 41 * spow(c, 0.95), 68 + 47 * spow(s, 0.98)];
    return [60 + (41 + 6 * Math.min(1, s * 1.6)) * spow(c, 0.7), Math.min(68 + 40 * spow(s, 0.72), 107)];
  }),
  (_i, t) => 0.55 + 0.6 * (bell(t, 0.3, 0.5) + bell(t, Math.PI - 0.3, 0.5)) - 0.5 * bell(t, Math.PI / 2, 0.45),
  41,
);

/**
 * 샴고양이: 햄스터처럼 한 덩어리가 아니라 "넓적한 머리 + 앉은 몸통"으로 나눠 그린다.
 * 머리는 볼 털이 옆으로 삐죽한 가로로 넓은 모양, 몸통은 아래로 퍼지는 앉은 자세.
 */
const catHeadPts = sampleShape(36, (t) => {
  const s = Math.sin(t);
  const c = Math.cos(t);
  if (s < 0) return [60 + 38 * spow(c, 0.82), 48 + 30 * spow(s, 0.9)];
  return [60 + 38 * spow(c, 0.66), 48 + 28 * spow(s, 0.85)];
});
const catHead = fromPts(
  catHeadPts,
  (_i, t) => 0.25 + 2.0 * (bell(t, 0.42, 0.22) + bell(t, Math.PI - 0.42, 0.22)) - 0.2 * bell(t, -Math.PI / 2, 0.6),
  57,
);
const catTorso = fromPts(
  sampleShape(30, (t) => {
    const s = Math.sin(t);
    const c = Math.cos(t);
    if (s < 0) return [60 + 27 * spow(c, 0.9), 86 + 22 * spow(s, 0.9)];
    return [60 + (27 + 9 * s ** 0.6) * spow(c, 0.7), Math.min(86 + 21 * spow(s, 0.8), 107)];
  }),
  () => 0.5,
  59,
);
export const CAT = { head: catHead, torso: catTorso };

/** 오목눈이: 거의 완벽한 공 모양에 보송한 솜털 */
const BN = 34;
const birdFront = fromPts(
  sampleShape(BN, (t) => [60 + 45 * spow(Math.cos(t), 0.95), Math.min(64 + 43 * spow(Math.sin(t), 0.95), 107)]),
  () => 0.9,
  73,
);

export const FRONT_BY_SPECIES = { hamster: { body: FRONT.body, clip: FRONT.clip }, rabbit: rabbitFront, cat: catTorso, bird: birdFront };

function sideShape(rxF: number, rxB: number, ryU: number, ryD: number, bumpK: number, yMax: number, cy: number, seed: number) {
  const pts = sampleShape(SN, (t) => {
    const s = Math.sin(t);
    const c = Math.cos(t);
    const rx = c > 0 ? rxF : rxB;
    const ry = s < 0 ? ryU : ryD;
    const bump = bumpK * (6 * bell(t, -0.9, 0.45) + 3 * bell(t, 0.1, 0.22) - 2 * bell(t, -1.6, 0.3));
    return [68 + (rx + bump) * spow(c, 0.88), Math.min(cy + (ry + bump) * spow(s, 0.82), yMax)];
  });
  return fromPts(pts, (_i, t) => 0.35 + 1.0 * bell(t, Math.PI, 0.6) - 0.8 * bell(t, 0.1, 0.2) - 1.2 * bell(t, Math.PI / 2, 0.5), seed);
}
export const SIDE_BY_SPECIES = {
  hamster: { body: SIDE.body, clip: SIDE.clip },
  rabbit: sideShape(37, 38, 31, 29, 0.9, 91, 62, 81),
  cat: fromPts(
    sampleShape(SN, (t) => [64 + (Math.cos(t) > 0 ? 34 : 36) * spow(Math.cos(t), 0.8), Math.min(70 + 20 * spow(Math.sin(t), 0.8), 91)]),
    (_i, t) => 0.4 + 0.8 * bell(t, Math.PI, 0.6) - 0.6 * bell(t, Math.PI / 2, 0.5),
    83,
  ),
  bird: sideShape(38, 37, 36, 33, 0.3, 91, 58, 89),
};

/** 샴고양이 옆모습 머리 (몸통 앞쪽 위에 얹는다) */
export const CAT_SIDE_HEAD = fromPts(
  sampleShape(30, (t) => [100 + 21 * spow(Math.cos(t), 0.9), 54 + 20 * spow(Math.sin(t), 0.9)]),
  (_i, t) => 0.25 + 1.6 * bell(t, 2.2, 0.3),
  97,
);
