/**
 * 오늘의 퇴근 탈출 6편. 각 편은 시간(초)을 받아 장면을 맞추는 함수를 돌려준다.
 * 모두 같은 복셀 사무실에서, 종이 인형이라서 가능한 방법으로 빠져나간다.
 */
import * as THREE from 'three';
import type { EscapeId } from '../../domain/escape';
import { back, BOSS_AT, buildBang, buildDoor, Debris, DOOR, eio, eo, HAM_START, lerp, seg, Standee, Voxels, type PaperTex, type Stage } from './stage';

export interface EpisodeCtx {
  stage: Stage;
  tex: Record<string, PaperTex>;
  ham: Standee;
  boss: Standee;
  door: ReturnType<typeof buildDoor>;
}

export type Cue = { at: number; sfx: string; dur?: number };

export interface Episode {
  id: EscapeId;
  title: string;
  /** 마지막에 뜨는 한 줄 */
  ending: string;
  dur: number;
  cues: Cue[];
  setup(c: EpisodeCtx): (t: number) => void;
}

type P = [number, number];
/** 꺾은선 경로 위의 위치 (k: 0~1) */
function along(path: P[], k: number): P {
  const n = path.length - 1;
  const f = Math.max(0, Math.min(0.9999, k)) * n, i = Math.floor(f), r = f - i;
  return [lerp(path[i][0], path[i + 1][0], r), lerp(path[i][1], path[i + 1][1], r)];
}
const ticks = (from: number, to: number, step = 0.25): Cue[] => {
  const out: Cue[] = [];
  for (let t = from; t < to; t += step) out.push({ at: t, sfx: 'tick' });
  return out;
};
const v3 = (x: number, y: number, z: number) => () => new THREE.Vector3(x, y, z);
const above = (s: Standee, h: number) => () => s.grp.position.clone().add(new THREE.Vector3(0, h, 0));

/** 기본 카메라: 오른쪽 위에서 사무실 전체 */
const WIDE = { tx: 20, ty: 4, tz: 16, ang: 0.5, dist: 108, hgt: 78 };
type Cam = typeof WIDE;
const mix = (a: Cam, b: Cam, k: number): Cam => ({
  tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k), tz: lerp(a.tz, b.tz, k), ang: lerp(a.ang, b.ang, k), dist: lerp(a.dist, b.dist, k), hgt: lerp(a.hgt, b.hgt, k),
});
const shot = (s: Stage, c: Cam, shake = 0, t = 0) => s.look(c.tx, c.ty, c.tz, c.ang, c.dist, c.hgt, shake, t);
/** 시작: 높은 데서 내려오며 돈다 */
const opening = (t: number): Cam => mix({ ...WIDE, ang: 0.75, dist: 130, hgt: 95 }, WIDE, eio(seg(t, 0, 2)));
const AT_DOOR: Cam = { tx: 32, ty: 6, tz: 6, ang: 0.15, dist: 72, hgt: 50 };

function bossLook(c: EpisodeCtx, t: number, a: number, b: number, face = 'b:idle', away = 'b:smug') {
  // a~b 동안 팀장이 돌아본다 (0.2초 회전, 종이라 휙)
  const k = t < a ? 0 : t < a + 0.2 ? seg(t, a, a + 0.2) : t < b ? 1 : t < b + 0.2 ? 1 - seg(t, b, b + 0.2) : 0;
  c.boss.grp.rotation.y = Math.PI * (1 - k);
  c.boss.set(c.tex[k > 0.5 ? face : away]);
  c.boss.inner.position.y = k > 0 && k < 1 ? Math.sin(k * Math.PI) * 1.2 : 0;
  return k;
}
const exitBlink = (c: EpisodeCtx, t: number) => c.door.exitMat.color.set(Math.floor(t * 4) % 2 ? '#2fd16f' : '#1aa955');

// ───────────────────────── 1. 옆으로 서면 안 보인다 ─────────────────────────
const sideways: Episode = {
  id: 'sideways',
  title: '옆으로 서면 안 보인다',
  ending: '퇴근 성공. 얇아서.',
  dur: 10.5,
  cues: [...ticks(1.6, 3.4), { at: 3.35, sfx: 'whoosh', dur: 0.25 }, { at: 3.55, sfx: 'sting' }, { at: 3.75, sfx: 'flap' }, { at: 5.05, sfx: 'flap' }, { at: 7.0, sfx: 'whoosh', dur: 1.5 }, { at: 8.0, sfx: 'creak' }, { at: 8.3, sfx: 'pop' }, { at: 8.9, sfx: 'chime' }],
  setup(c) {
    const bang = buildBang(c.stage.scene);
    const path: P[] = [[HAM_START.x, HAM_START.z], [22, 28], [24, 19]];
    const out: P[] = [[24, 19], [27, 9], [33, 3], [34, -4]];
    c.stage.say({ text: '…?', from: 3.9, to: 4.9, at: above(c.boss, 14), kind: 'think' });
    c.stage.say({ text: '……', from: 5.6, to: 6.6, at: above(c.ham, 11.5), kind: 'think' });
    c.stage.say({ text: '……', from: 6.0, to: 6.9, at: above(c.boss, 14), kind: 'think' });
    c.stage.say({ text: '방금 뭐가 지나갔는데…', from: 8.9, to: 10.5, at: above(c.boss, 14), kind: 'think' });
    return (t) => {
      const walking = t > 1.6 && t < 3.4;
      const [x, z] = t < 7 ? along(path, seg(t, 1.6, 3.4)) : along(out, eio(seg(t, 7.0, 9.0)));
      c.ham.grp.position.set(x, 0, z);
      c.ham.hop(t, walking);
      // 3.6초: 몸을 90도 틀어 얇은 선이 된다
      // 문 앞에서 다시 정면으로 돌아 '짠'
      const side = eo(seg(t, 3.6, 3.8)) * (1 - eo(seg(t, 8.25, 8.45)));
      c.ham.grp.rotation.y = (Math.PI / 2) * side;
      c.ham.edge.visible = side > 0.9;
      c.ham.set(c.tex[t < 1.6 ? 'h:type' : t < 3.6 ? 'h:idle' : t < 8.25 ? 'h:shock' : 'h:cheer']);
      // 팀장: 돌아보고 의심 → 5초에 팀장도 옆으로
      const k = t < 3.35 ? 0 : t < 3.55 ? seg(t, 3.35, 3.55) : 1;
      const bside = eo(seg(t, 5.0, 5.2));
      c.boss.grp.rotation.y = Math.PI * (1 - k) + (Math.PI / 2) * bside;
      c.boss.edge.visible = bside > 0.9;
      c.boss.set(c.tex[k > 0.5 ? (t > 3.9 ? 'b:think' : 'b:shock') : 'b:smug']);
      bang.visible = t > 3.55 && t < 4.4;
      bang.position.set(BOSS_AT.x, 16, BOSS_AT.z);
      bang.scale.setScalar(1 + 0.4 * (1 - eo(seg(t, 3.55, 3.8))));
      c.door.door.rotation.y = -Math.PI * 0.55 * eo(seg(t, 8.0, 8.4));
      exitBlink(c, t);
      // 카메라: 전체 → 둘 사이 → 옆에서 본 두 줄 → 문
      let cam = opening(t);
      const mid: Cam = { tx: 16, ty: 6, tz: 15, ang: 0.42, dist: 92, hgt: 60 };
      const sideCam: Cam = { tx: 16, ty: 6, tz: 15, ang: -0.2, dist: 85, hgt: 42 };
      cam = mix(cam, mid, eo(seg(t, 3.5, 3.9)));
      cam = mix(cam, sideCam, eio(seg(t, 5.3, 6.6)));
      cam = mix(cam, AT_DOOR, eio(seg(t, 7.0, 8.4)));
      shot(c.stage, cam, t > 3.55 && t < 3.9 ? 0.6 : 0, t);
    };
  },
};

// ───────────────────────── 2. 종이비행기 퇴근 ─────────────────────────
const airplane: Episode = {
  id: 'airplane',
  title: '종이비행기 퇴근',
  ending: '퇴근 완료. 내일은 비행기 모드.',
  dur: 11.5,
  cues: [{ at: 1.9, sfx: 'flap' }, { at: 2.3, sfx: 'flap' }, { at: 2.7, sfx: 'flap' }, { at: 3.2, sfx: 'whoosh', dur: 0.6 }, { at: 4.3, sfx: 'whoosh', dur: 0.3 }, { at: 4.6, sfx: 'wind', dur: 3.6 }, { at: 8.4, sfx: 'whoosh', dur: 0.3 }, { at: 8.9, sfx: 'pop' }, { at: 9.1, sfx: 'chime' }],
  setup(c) {
    const s = c.stage.scene;
    // 종이비행기
    const plane = new THREE.Group();
    const paper = new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.9, side: THREE.DoubleSide });
    const wing = new THREE.BufferGeometry();
    wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, -3, -2.6, 0, 2, 0, 0, 1.4, 0, 0, -3, 0, 0, 1.4, 2.6, 0, 2, 0, 0, -3, 0, -1, 1.6, 0, 0, 1.4], 3));
    wing.computeVertexNormals();
    const pm = new THREE.Mesh(wing, paper);
    pm.castShadow = true;
    plane.add(pm);
    plane.scale.setScalar(1.3);
    plane.visible = false;
    s.add(plane);
    // 바깥 세상: 노을 아래 복셀 도시 (사무실에서 멀리 떨어진 곳)
    const city = new Voxels();
    const OX = 300;
    city.box(OX - 60, -1, -80, 160, 1, 160, '#8fbf7a');
    let sd = 5;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const lit: [number, number, number][] = [];
    for (let i = 0; i < 46; i++) {
      const bx = OX - 50 + Math.floor(r() * 12) * 12, bz = -70 + Math.floor(r() * 10) * 12;
      if (Math.abs(bx - OX) < 8 && bz > -40) continue;
      const h = 8 + Math.floor(r() * 5) * 6, col = ['#e8d3b8', '#d9c3e6', '#c9dceb', '#f0c9b4'][i % 4];
      city.box(bx, 0, bz, 8, h, 8, col);
      for (let y = 3; y < h - 2; y += 4) for (let xx = 1; xx < 8; xx += 3) if (r() > 0.35) lit.push([bx + xx, y, bz + 8]);
    }
    for (const [x, y, z] of lit) city.box(x, y, z, 1.5, 1.6, 0.3, '#ffd88a');
    // 집: 앞이 뚫린 작은 방 (침대)
    const HX = OX + 4, HZ = 40;
    city.box(HX - 10, 0, HZ - 8, 20, 0.5, 14, '#e9c9a0').box(HX - 10, 0, HZ - 8, 20, 14, 1, '#f6e2c8').box(HX - 10, 0, HZ - 8, 1, 14, 14, '#f0d6b6');
    city.box(HX - 7, 0.5, HZ - 6, 12, 2.5, 7, '#b98a5c').box(HX - 7, 3, HZ - 6, 12, 1.2, 7, '#ffffff').box(HX - 7, 4.2, HZ - 6, 3.5, 1, 7, '#ffd0d6').box(HX - 2, 4.2, HZ - 5.6, 7, 0.8, 6.2, '#9ec5ff');
    city.box(HX + 6, 6, HZ - 7.6, 3, 4, 0.4, '#ffe8a3');
    const cityGrp = city.build();
    s.add(cityGrp);
    const homeHam = new Standee(8, s, false);
    homeHam.set(c.tex['h:doze']);
    homeHam.grp.visible = false;
    const flash = document.createElement('div');
    flash.className = 'esc-flash';
    c.stage.overlay.appendChild(flash);
    const sky = new THREE.Color('#f5e3c6'), dusk = new THREE.Color('#f6a77e');
    c.stage.say({ text: '17:59', from: 0.4, to: 1.6, at: v3(22, 18.5, 0.5), kind: 'shout' });
    c.stage.say({ text: '접는다…', from: 1.7, to: 2.8, at: above(c.ham, 17), kind: 'say' });
    c.stage.say({ text: '퇴근 완료~', from: 9.3, to: 11.5, at: () => homeHam.grp.position.clone().add(new THREE.Vector3(0, 13, 0)), kind: 'say' });
    // 책상 위에 올라선 햄스터
    const desk = { x: 6.5, y: 7, z: 16.5 };
    return (t) => {
      const outside = t >= 4.5;
      cityGrp.visible = outside;
      // 접기: 1.8~3.0 납작해지며 비행기로
      const fold = seg(t, 1.8, 3.0);
      c.ham.grp.visible = t < 3.0;
      c.ham.grp.position.set(desk.x, desk.y, desk.z);
      c.ham.set(c.tex[t < 1.6 ? 'h:type' : 'h:smug']);
      c.ham.inner.scale.set(1 - 0.5 * fold, 1 - 0.8 * fold, 1);
      c.ham.inner.rotation.z = Math.sin(fold * Math.PI * 6) * 0.25 * fold;
      plane.visible = t >= 3.0 && t < 8.6;
      if (t >= 3.0 && t < 4.5) {
        // 책상에서 날아올라 한 바퀴 돌고 창문으로
        const k = seg(t, 3.0, 4.5);
        const x = lerp(desk.x, 10, k) + Math.sin(k * Math.PI * 2) * 6, y = desk.y + 1 + Math.sin(k * Math.PI) * 6 + k * 4, z = lerp(desk.z, -2, eio(k));
        plane.position.set(x, y, z);
        plane.rotation.set(-0.2, Math.PI + Math.sin(k * Math.PI * 2) * 0.8, Math.sin(k * Math.PI * 2) * 0.6);
      } else if (outside && t < 8.6) {
        // 도시 위를 날아 집으로
        const k = seg(t, 4.5, 8.4);
        const x = OX + Math.sin(k * Math.PI * 1.5) * 18, y = lerp(40, 9, eio(k)) + Math.sin(t * 3) * 1.2, z = lerp(-70, HZ - 2, eio(k));
        plane.position.set(x, y, z);
        plane.rotation.set(Math.sin(t * 3) * 0.1, Math.PI + Math.cos(k * Math.PI * 1.5) * 0.6, -Math.cos(k * Math.PI * 1.5) * 0.5);
      }
      homeHam.grp.visible = t >= 8.6;
      homeHam.grp.position.set(HX + 1, 4.2, HZ - 2.5);
      const pop = back(seg(t, 8.6, 9.0));
      homeHam.inner.scale.set(pop, pop, 1);
      c.stage.scene.background = outside ? dusk : sky;
      c.stage.sun.color.set(outside ? '#ffc79a' : '#fff0d8');
      // 화면 하얗게 번쩍 (창문 통과, 집 도착)
      const f1 = t > 4.2 && t < 4.8 ? 1 - Math.abs(t - 4.5) / 0.3 : 0;
      const f2 = t > 8.3 && t < 8.9 ? 1 - Math.abs(t - 8.6) / 0.3 : 0;
      flash.style.opacity = String(Math.max(f1, f2));
      exitBlink(c, t);
      bossLook(c, t, 99, 99);
      if (!outside) {
        const clockCam: Cam = { tx: 22, ty: 14, tz: 0, ang: 0.15, dist: 40, hgt: 10 };
        const deskCam: Cam = { tx: desk.x, ty: desk.y + 4, tz: desk.z, ang: 0.35, dist: 55, hgt: 30 };
        let cam = mix(clockCam, deskCam, eio(seg(t, 1.3, 1.9)));
        cam = mix(cam, { tx: 10, ty: 12, tz: 4, ang: 0.3, dist: 60, hgt: 25 }, eio(seg(t, 3.0, 4.4)));
        shot(c.stage, cam);
      } else if (t < 8.6) {
        // 비행기 뒤를 따라간다
        const p = plane.position;
        c.stage.camera.position.set(p.x + 6, p.y + 7, p.z - 22);
        c.stage.camera.lookAt(p.x, p.y, p.z + 6);
      } else {
        shot(c.stage, { tx: HX, ty: 6, tz: HZ - 2, ang: 0.1, dist: 48, hgt: 22 });
      }
    };
  },
};

// ───────────────────────── 3. 복사기 위장술 ─────────────────────────
const copier: Episode = {
  id: 'copier',
  title: '복사기 위장술',
  ending: '퇴근 성공. 30부 중 1부.',
  dur: 11.5,
  cues: [...ticks(1.5, 3.0), { at: 3.0, sfx: 'whoosh', dur: 0.3 }, { at: 3.5, sfx: 'print', dur: 0.9 }, ...Array.from({ length: 12 }, (_, i) => ({ at: 4.3 + i * 0.12, sfx: 'pop' })), { at: 6.0, sfx: 'whoosh', dur: 0.25 }, { at: 6.2, sfx: 'sting' }, ...ticks(7.0, 8.4, 0.22), { at: 7.8, sfx: 'creak' }, { at: 8.6, sfx: 'chime' }, { at: 9.0, sfx: 'whoosh', dur: 0.4 }],
  setup(c) {
    const s = c.stage.scene;
    const v = new Voxels();
    // 복사기 (오른쪽 벽 쪽)
    const CX = 35, CZ = 17;
    v.box(CX - 2.5, 0, CZ - 2.5, 5, 6, 5, '#d9dee5').box(CX - 2.5, 6, CZ - 2.5, 5, 0.6, 5, '#aab2bd').box(CX - 2.4, 3, CZ + 2.5, 4.8, 0.5, 1.6, '#c3cad3').box(CX + 0.6, 6.6, CZ + 1.2, 1.6, 0.4, 1, '#2fa463');
    s.add(v.build());
    const scan = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.25, 0.6), new THREE.MeshBasicMaterial({ color: '#7dffb0' }));
    scan.visible = false;
    s.add(scan);
    const bang = buildBang(s);
    // 복사본 24장
    const copies = Array.from({ length: 24 }, () => {
      const st = new Standee(9, s);
      st.set(c.tex['h:idle']);
      st.grp.visible = false;
      return st;
    });
    let sd = 9;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const spots = copies.map(() => ({ x: 6 + r() * 28, z: 12 + r() * 18, ph: r() * 6, sp: 0.6 + r() * 0.8, t0: 4.3 + r() * 1.4 }));
    const seats: P[] = [[7.5, 22], [19.5, 22], [7.5, 30], [19.5, 30]];
    c.stage.say({ text: '복사 30부!', from: 3.3, to: 4.3, at: v3(CX, 10, CZ), kind: 'shout' });
    c.stage.say({ text: '누가 진짜야?!', from: 6.3, to: 7.9, at: above(c.boss, 14), kind: 'shout' });
    c.stage.say({ text: '다음 날 아침…', from: 9.2, to: 10.4, at: v3(14, 16, 20), kind: 'think' });
    c.stage.say({ text: '오늘따라 다들 열심히네?', from: 10.0, to: 11.5, at: above(c.boss, 14), kind: 'say' });
    return (t) => {
      // 복사기로 가서 쏙
      const [x, z] = along([[HAM_START.x, HAM_START.z], [26, 28], [CX - 1, CZ + 5]], seg(t, 1.5, 3.0));
      const dive = seg(t, 3.0, 3.4);
      c.ham.grp.visible = t < 3.4 || (t > 6.9 && t < 8.7);
      if (t < 3.4) {
        c.ham.grp.position.set(lerp(x, CX, dive), Math.sin(dive * Math.PI) * 8 + dive * 6, lerp(z, CZ, dive));
        c.ham.inner.scale.setScalar(1 - 0.7 * dive);
        c.ham.hop(t, t > 1.5 && t < 3.0);
        c.ham.set(c.tex[t < 1.5 ? 'h:type' : 'h:smug']);
      } else {
        // 진짜는 복사본 사이에 섞여 있다가 문으로
        const [ex, ez] = along([[24, 20], [28, 8], [34, 3], [34, -4]], seg(t, 7.0, 8.7));
        c.ham.grp.position.set(ex, 0, ez);
        c.ham.inner.scale.setScalar(1);
        c.ham.hop(t, true, 14);
        c.ham.set(c.tex['h:cheer']);
      }
      scan.visible = t > 3.4 && t < 4.3;
      scan.position.set(CX, 6.7, lerp(CZ - 2, CZ + 2, (t * 3) % 1));
      // 복사본: 튀어나와 사방으로 뛰어다닌다 → 다음 날엔 자리에 앉아 일한다
      const nextDay = t > 9.2;
      copies.forEach((cp, i) => {
        const sp = spots[i];
        if (t < sp.t0) return;
        cp.grp.visible = !nextDay || i < seats.length;
        if (nextDay && i >= seats.length) return;
        if (nextDay) {
          cp.grp.position.set(seats[i][0], 0, seats[i][1]);
          cp.set(c.tex['h:type']);
          cp.hop(t, false);
          return;
        }
        const k = seg(t, sp.t0, sp.t0 + 0.6);
        const wx = sp.x + Math.sin(t * sp.sp + sp.ph) * 4, wz = sp.z + Math.cos(t * sp.sp * 0.8 + sp.ph) * 3;
        cp.grp.position.set(lerp(CX, wx, eo(k)), Math.sin(k * Math.PI) * 6, lerp(CZ + 3, wz, eo(k)));
        cp.grp.rotation.y = Math.sin(t + sp.ph) * 0.4;
        cp.hop(t + sp.ph, k >= 1, 11 + (i % 3));
        cp.set(c.tex[i % 3 === 0 ? 'h:cheer' : 'h:idle']);
      });
      const k = bossLook(c, t, 6.0, nextDay ? 99 : 8.8, 'b:shock');
      if (nextDay) { c.boss.grp.rotation.y = 0; c.boss.set(c.tex['b:idle']); }
      bang.visible = t > 6.2 && t < 7.0;
      bang.position.set(BOSS_AT.x, 16, BOSS_AT.z);
      void k;
      c.door.door.rotation.y = -Math.PI * 0.55 * eo(seg(t, 7.8, 8.2)) * (nextDay ? 0 : 1);
      exitBlink(c, t);
      let cam = opening(t);
      cam = mix(cam, { tx: CX - 4, ty: 6, tz: CZ, ang: 0.6, dist: 70, hgt: 45 }, eio(seg(t, 2.4, 3.2)));
      cam = mix(cam, { tx: 20, ty: 4, tz: 18, ang: 0.45, dist: 100, hgt: 75 }, eio(seg(t, 4.3, 5.2)));
      cam = mix(cam, AT_DOOR, eio(seg(t, 7.2, 8.4)));
      cam = mix(cam, { tx: 14, ty: 5, tz: 22, ang: 0.35, dist: 85, hgt: 60 }, nextDay ? 1 : 0);
      shot(c.stage, cam, t > 6.2 && t < 6.5 ? 0.5 : 0, t);
    };
  },
};

// ───────────────────────── 4. 팀장도 탈출 중 ─────────────────────────
const bossToo: Episode = {
  id: 'bossToo',
  title: '팀장도 탈출 중',
  ending: '퇴근 성공. 둘 다.',
  dur: 10.5,
  cues: [...ticks(1.5, 4.4), { at: 4.5, sfx: 'sting' }, { at: 5.4, sfx: 'shh' }, { at: 5.9, sfx: 'shh' }, ...ticks(6.6, 8.0, 0.2), { at: 6.6, sfx: 'creak' }, { at: 7.9, sfx: 'chime' }, { at: 8.9, sfx: 'thump' }],
  setup(c) {
    const s = c.stage.scene;
    // 문 옆에 쪼그린 진짜 팀장 + 가방
    const real = new Standee(11, s);
    real.set(c.tex['b:shy']);
    const bag = new Voxels().box(0, 0, 0, 3, 2.6, 1.4, '#6b4a33').box(0.8, 2.6, 0.5, 1.4, 0.6, 0.4, '#6b4a33').build();
    s.add(bag);
    const bangs = [buildBang(s), buildBang(s)];
    c.stage.say({ text: '!!', from: 4.5, to: 5.3, at: above(c.ham, 11.5), kind: 'shout' });
    c.stage.say({ text: '쉿…!', from: 5.3, to: 6.4, at: above(real, 12.5), kind: 'say' });
    c.stage.say({ text: '쉿…!', from: 5.8, to: 6.6, at: above(c.ham, 11.5), kind: 'say' });
    c.stage.say({ text: '팀장 자리엔 등신대만 남았다', from: 9.0, to: 10.5, at: above(c.boss, 9), kind: 'think' });
    return (t) => {
      const [x, z] = t < 6.6 ? along([[HAM_START.x, HAM_START.z], [24, 26], [26, 12], [30.5, 5.5]], seg(t, 1.5, 4.4)) : along([[30.5, 5.5], [33, 2], [33, -4]], seg(t, 6.6, 8.0));
      c.ham.grp.position.set(x, 0, z);
      c.ham.hop(t, (t > 1.5 && t < 4.4) || (t > 6.6 && t < 8.0));
      c.ham.set(c.tex[t < 1.5 ? 'h:type' : t < 4.5 ? 'h:idle' : t < 6.6 ? 'h:shock' : 'h:cheer']);
      // 진짜 팀장: 화분 뒤에 쪼그려 있다가 함께 나간다
      const [bx, bz] = t < 6.6 ? [36.5, 6] : along([[36.5, 6], [35.5, 2], [35.5, -4]], seg(t, 6.75, 8.1));
      real.grp.position.set(bx, 0, bz);
      real.grp.rotation.y = -0.5;
      real.inner.scale.y = t < 6.6 ? 0.82 : 1;
      real.hop(t + 0.2, t > 6.75 && t < 8.1);
      real.set(c.tex[t < 4.5 ? 'b:shy' : t < 6.6 ? 'b:shock' : 'b:smug']);
      real.grp.visible = t < 8.1;
      bag.position.set(bx + 1.5, 0.2 + real.inner.position.y, bz + 0.8);
      bag.visible = t < 8.1;
      bangs.forEach((b, i) => {
        b.visible = t > 4.5 && t < 5.2;
        const p = i ? real.grp.position : c.ham.grp.position;
        b.position.set(p.x, 14 + i, p.z);
      });
      // 자리에 남은 팀장(등신대)이 9초에 꽈당
      c.boss.set(c.tex['b:smug']);
      c.boss.grp.rotation.y = Math.PI;
      c.boss.grp.rotation.x = (Math.PI / 2) * eo(seg(t, 8.7, 9.0));
      c.door.door.rotation.y = -Math.PI * 0.55 * eo(seg(t, 6.6, 7.0));
      exitBlink(c, t);
      let cam = opening(t);
      cam = mix(cam, { tx: 32, ty: 6, tz: 7, ang: 0.3, dist: 62, hgt: 40 }, eio(seg(t, 3.6, 4.6)));
      cam = mix(cam, { tx: BOSS_AT.x, ty: 4, tz: BOSS_AT.z, ang: 0.4, dist: 60, hgt: 45 }, eio(seg(t, 8.2, 8.8)));
      shot(c.stage, cam, t > 8.95 && t < 9.2 ? 0.4 : 0, t);
    };
  },
};

// ───────────────────────── 5. '잠깐만' 벽 부수기 ─────────────────────────
const WALL_WORDS = ['잠깐만~', '이것만 보고 가', '내일 아침까지', '회의 5분만', '자료 하나만', '벌써 가?'];
function wordTexture(text: string) {
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 160;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 256, 160);
  g.strokeStyle = '#3a3a6a';
  g.lineWidth = 10;
  g.strokeRect(5, 5, 246, 150);
  g.fillStyle = '#3a3a6a';
  g.font = `700 ${text.length > 6 ? 38 : 48}px GaeguDiary, Jua, sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 128, 82);
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
}
const wallBreak: Episode = {
  id: 'wallBreak',
  title: "'잠깐만' 벽 부수기",
  ending: '퇴근 성공. 잠깐만은 내일의 나에게.',
  dur: 11.5,
  cues: [...ticks(1.5, 3.0), ...WALL_WORDS.map((_, i) => ({ at: 3.0 + i * 0.32 + 0.3, sfx: 'thump' })), ...WALL_WORDS.map((_, i) => ({ at: 5.9 + i * 0.42, sfx: 'crash' })), { at: 8.6, sfx: 'creak' }, { at: 9.3, sfx: 'chime' }],
  setup(c) {
    const s = c.stage.scene;
    const debris = new Debris(s, 200, '#f4f1ea');
    const side = new THREE.MeshStandardMaterial({ color: '#f4f1ea', roughness: 0.9 });
    const blocks = WALL_WORDS.map((w, i) => {
      const face = new THREE.MeshStandardMaterial({ map: wordTexture(w), roughness: 0.9 });
      const m = new THREE.Mesh(new THREE.BoxGeometry(4.6, 3, 2.4), [side, side, side, side, face, side]);
      m.castShadow = m.receiveShadow = true;
      s.add(m);
      const col = i % 2, row = Math.floor(i / 2);
      return { m, x: DOOR.x - 2.6 + col * 4.8, y: 1.5 + row * 3, z: 4.6 };
    });
    blocks.forEach((b, i) => debris.burst(new THREE.Vector3(b.x, b.y, b.z), 5.9 + (blocks.length - 1 - i) * 0.42, 22, 30 + i));
    c.stage.say({ text: '…좋아.', from: 5.1, to: 5.9, at: above(c.ham, 11.5), kind: 'say' });
    return (t) => {
      // 블록이 쿵쿵 떨어져 벽이 된다
      blocks.forEach((b, i) => {
        const t0 = 3.0 + i * 0.32;
        const k = seg(t, t0, t0 + 0.3);
        const broken = t > 5.9 + (blocks.length - 1 - i) * 0.42;
        b.m.visible = t > t0 && !broken;
        b.m.position.set(b.x, lerp(b.y + 30, b.y, k * k), b.z);
        b.m.rotation.z = (1 - k) * (i % 2 ? 0.3 : -0.3);
      });
      debris.update(t);
      // 햄스터: 다가가다 멈칫 → 위 블록부터 박치기 → 문으로
      let x = 0, y = 0, z = 0;
      if (t < 5.8) [x, z] = along([[HAM_START.x, HAM_START.z], [26, 24], [30, 12]], seg(t, 1.5, 3.0));
      else if (t < 8.4) {
        const n = Math.min(blocks.length - 1, Math.floor((t - 5.8) / 0.42));
        const b = blocks[blocks.length - 1 - n];
        const k = ((t - 5.8) % 0.42) / 0.42;
        x = lerp(30, b.x, Math.sin(k * Math.PI));
        z = lerp(12, b.z + 1.5, Math.sin(k * Math.PI));
        y = Math.sin(k * Math.PI) * (b.y - 1);
      } else [x, z] = along([[30, 12], [33, 4], [34, -4]], seg(t, 8.4, 9.3));
      c.ham.grp.position.set(x, Math.max(0, y), z);
      c.ham.hop(t, (t > 1.5 && t < 3.0) || t > 8.4);
      c.ham.set(c.tex[t < 1.5 ? 'h:type' : t < 5.0 ? 'h:shock' : t < 8.4 ? 'h:smug' : 'h:cheer']);
      bossLook(c, t, 99, 99);
      c.door.door.rotation.y = -Math.PI * 0.55 * eo(seg(t, 8.6, 9.0));
      exitBlink(c, t);
      let cam = opening(t);
      cam = mix(cam, { tx: 32, ty: 6, tz: 8, ang: 0.32, dist: 72, hgt: 38 }, eio(seg(t, 2.6, 3.4)));
      let shake = 0;
      for (let i = 0; i < blocks.length; i++) if (t > 3.3 + i * 0.32 && t < 3.5 + i * 0.32) shake = 0.5;
      for (let i = 0; i < blocks.length; i++) if (t > 5.9 + i * 0.42 && t < 6.1 + i * 0.42) shake = 0.7;
      shot(c.stage, cam, shake, t);
    };
  },
};

// ───────────────────────── 6. 가위로 문 만들기 ─────────────────────────
const scissors: Episode = {
  id: 'scissors',
  title: '가위로 문 만들기',
  ending: '퇴근 성공. 종이 세상에선 벽도 오려진다.',
  dur: 11,
  cues: [...ticks(1.5, 3.0), { at: 3.1, sfx: 'rattle' }, { at: 3.5, sfx: 'rattle' }, { at: 4.7, sfx: 'pop' }, ...Array.from({ length: 14 }, (_, i) => ({ at: 5.1 + i * 0.18, sfx: 'snip' })), { at: 7.9, sfx: 'thump' }, ...ticks(8.4, 9.4, 0.2), { at: 9.4, sfx: 'chime' }],
  setup(c) {
    const s = c.stage.scene;
    // 오려 낼 벽 조각 (문 왼쪽), 그 뒤엔 바깥 노을빛
    const CUT = { x0: 22, x1: 28.5, y1: 10 };
    const outside = new THREE.Mesh(new THREE.BoxGeometry(CUT.x1 - CUT.x0, CUT.y1, 0.1), new THREE.MeshBasicMaterial({ color: '#ffc58f' }));
    outside.position.set((CUT.x0 + CUT.x1) / 2, CUT.y1 / 2, 0.08);
    const flapPivot = new THREE.Group();
    flapPivot.position.set((CUT.x0 + CUT.x1) / 2, 0, 0.2);
    const flap = new THREE.Mesh(new THREE.BoxGeometry(CUT.x1 - CUT.x0, CUT.y1, 0.3), new THREE.MeshStandardMaterial({ color: '#f3dfc2', roughness: 0.9 }));
    flap.position.y = CUT.y1 / 2;
    flap.castShadow = flap.receiveShadow = true;
    flapPivot.add(flap);
    s.add(outside, flapPivot);
    // 점선 (잘린 자리)
    const cutPath: P[] = [[CUT.x1, 0], [CUT.x1, CUT.y1], [CUT.x0, CUT.y1], [CUT.x0, 0]];
    const dashes = Array.from({ length: 24 }, () => {
      const d = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.2), new THREE.MeshBasicMaterial({ color: '#3a3a6a' }));
      d.visible = false;
      s.add(d);
      return d;
    });
    // 큰 가위 (복셀)
    const sc = new THREE.Group();
    const steel = new THREE.MeshStandardMaterial({ color: '#c9d1da', metalness: 0.5, roughness: 0.35 });
    const red = new THREE.MeshStandardMaterial({ color: '#e0533d', roughness: 0.6 });
    const blades = [0, 1].map((i) => {
      const g = new THREE.Group();
      const bl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 3.2), steel);
      bl.position.z = -1.6;
      const hd = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 1.2), red);
      hd.position.z = 0.9;
      g.add(bl, hd);
      g.rotation.y = i ? 0.25 : -0.25;
      sc.add(g);
      return g;
    });
    sc.visible = false;
    s.add(sc);
    c.stage.say({ text: '잠겼다…', from: 3.6, to: 4.6, at: above(c.ham, 11.5), kind: 'think' });
    c.stage.say({ text: '그럼…', from: 4.6, to: 5.2, at: above(c.ham, 11.5), kind: 'say' });
    c.stage.say({ text: '…어디서 바람이 들어오지?', from: 9.5, to: 11, at: above(c.boss, 14), kind: 'think' });
    return (t) => {
      let x: number, z: number;
      if (t < 3.0) [x, z] = along([[HAM_START.x, HAM_START.z], [26, 24], [33, 4]], seg(t, 1.5, 3.0));
      else if (t < 5.0) [x, z] = [33 + (t > 3.0 && t < 3.8 ? Math.sin(t * 60) * 0.3 : 0), 4];
      else if (t < 8.4) [x, z] = [lerp(33, 26, eo(seg(t, 5.0, 5.4))), 4];
      else [x, z] = along([[26, 4], [25.2, 0.5], [25.2, -5]], seg(t, 8.4, 9.4));
      c.ham.grp.position.set(x, 0, z);
      c.ham.hop(t, (t > 1.5 && t < 3.0) || (t > 8.4 && t < 9.4));
      c.ham.set(c.tex[t < 1.5 ? 'h:type' : t < 3.0 ? 'h:idle' : t < 4.6 ? 'h:shock' : t < 8.4 ? 'h:smug' : 'h:cheer']);
      c.door.knob.rotation.z = t > 3.0 && t < 3.9 ? Math.sin(t * 50) * 0.5 : 0;
      // 가위가 점선을 따라 싹둑싹둑
      const cut = seg(t, 5.1, 7.6);
      sc.visible = t > 4.7 && t < 7.9;
      const n = cutPath.length - 1, f = cut * n, i = Math.min(n - 1, Math.floor(f)), r = f - i;
      const cx = lerp(cutPath[i][0], cutPath[i + 1][0], r), cy = lerp(cutPath[i][1], cutPath[i + 1][1], r);
      const pop = back(seg(t, 4.7, 5.0));
      sc.position.set(t < 5.1 ? x + 1.5 : cx, t < 5.1 ? 6 : Math.max(0.6, cy), 1.4);
      sc.scale.setScalar(pop * 1.4);
      sc.rotation.set(Math.PI / 2, 0, i === 1 ? Math.PI / 2 : i === 0 ? 0 : Math.PI);
      const snip = Math.abs(Math.sin(t * 17)) * 0.35;
      blades[0].rotation.y = -0.1 - snip;
      blades[1].rotation.y = 0.1 + snip;
      dashes.forEach((d, k) => {
        const p = k / (dashes.length - 1);
        d.visible = p <= cut && t < 7.8;
        const ff = p * n, ii = Math.min(n - 1, Math.floor(ff)), rr = ff - ii;
        d.position.set(lerp(cutPath[ii][0], cutPath[ii + 1][0], rr), Math.max(0.3, lerp(cutPath[ii][1], cutPath[ii + 1][1], rr)), 0.35);
      });
      // 벽 조각이 앞으로 꽈당
      flapPivot.rotation.x = (Math.PI / 2) * eo(seg(t, 7.6, 7.95)) * 0.98;
      bossLook(c, t, 99, 99);
      exitBlink(c, t);
      let cam = opening(t);
      cam = mix(cam, { tx: 28, ty: 6, tz: 5, ang: 0.2, dist: 72, hgt: 38 }, eio(seg(t, 2.4, 3.4)));
      cam = mix(cam, { tx: 14, ty: 5, tz: 10, ang: 0.45, dist: 95, hgt: 65 }, eio(seg(t, 9.4, 10.2)));
      shot(c.stage, cam, t > 7.9 && t < 8.15 ? 0.5 : 0, t);
    };
  },
};

export const EPISODES: Record<EscapeId, Episode> = { sideways, airplane, copier, bossToo, wallBreak, scissors };
