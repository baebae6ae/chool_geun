/**
 * 퇴근 탈출 무대: 복셀(블록) 미니어처 사무실 + 종이 인형 캐릭터.
 * 사무실은 그림 파일이 아니라 상자를 쌓아 코드로 만든다. 캐릭터는 앱의 햄스터 그림을 흰 테두리로 오린 종이 인형이다.
 */
import * as THREE from 'three';

export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const eo = (x: number) => 1 - Math.pow(1 - x, 3);
export const ei = (x: number) => x * x * x;
export const eio = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const back = (x: number) => (x <= 0 ? 0 : 1 + 3.2 * Math.pow(x - 1, 3) + 2.2 * Math.pow(x - 1, 2));

/** 같은 색 상자를 한 번에 그리는 블록 묶음 */
export class Voxels {
  private boxes = new Map<string, [number, number, number, number, number, number][]>();
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string) {
    if (!this.boxes.has(color)) this.boxes.set(color, []);
    this.boxes.get(color)!.push([x, y, z, w, h, d]);
    return this;
  }
  build(): THREE.Group {
    const grp = new THREE.Group();
    const g = new THREE.BoxGeometry(1, 1, 1);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    for (const [color, list] of this.boxes) {
      const mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.85 }), list.length);
      list.forEach(([x, y, z, w, h, d], i) => {
        m4.compose(new THREE.Vector3(x + w / 2, y + h / 2, z + d / 2), q, new THREE.Vector3(w, h, d));
        mesh.setMatrixAt(i, m4);
      });
      mesh.castShadow = mesh.receiveShadow = true;
      grp.add(mesh);
    }
    return grp;
  }
}

/** 종이 인형 앞·뒤 그림 */
export interface PaperTex {
  front: THREE.Texture;
  back: THREE.Texture;
}

/** 캐릭터 그림을 흰 종이 테두리로 오리고, 뒷면(하얀 종이)도 만든다 */
export function paperTexture(img: CanvasImageSource): PaperTex {
  const S = 512, pad = 28, r = 11;
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = c.height = S;
    return [c, c.getContext('2d')!] as const;
  };
  const [tmp, tg] = mk();
  tg.drawImage(img, pad, pad, S - pad * 2, S - pad * 2);
  const [sil, sg] = mk();
  sg.drawImage(tmp, 0, 0);
  sg.globalCompositeOperation = 'source-in';
  sg.fillStyle = '#fffdf7';
  sg.fillRect(0, 0, S, S);
  const outline = (g: CanvasRenderingContext2D) => {
    for (let a = 0; a < 24; a++) g.drawImage(sil, Math.cos((a / 24) * Math.PI * 2) * r, Math.sin((a / 24) * Math.PI * 2) * r);
  };
  const [fc, fg] = mk();
  outline(fg);
  fg.drawImage(tmp, 0, 0);
  const [bc, bg] = mk();
  outline(bg);
  bg.globalCompositeOperation = 'source-in';
  bg.fillStyle = '#efe9dd';
  bg.fillRect(0, 0, S, S);
  const tex = (c: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  return { front: tex(fc), back: tex(bc) };
}

/** 종이 인형: grp(위치·방향) > inner(통통·까딱) > 앞면·뒷면 + 받침 */
export class Standee {
  grp = new THREE.Group();
  inner = new THREE.Group();
  edge: THREE.Mesh;
  private front: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private back: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private depth: THREE.MeshDepthMaterial;
  private current?: PaperTex;
  constructor(public size: number, scene: THREE.Object3D, base = true) {
    const geo = new THREE.PlaneGeometry(size, size);
    const mat = () => new THREE.MeshStandardMaterial({ transparent: true, alphaTest: 0.5, roughness: 0.9 });
    this.front = new THREE.Mesh(geo, mat());
    this.back = new THREE.Mesh(geo, mat());
    this.back.rotation.y = Math.PI;
    this.front.position.y = this.back.position.y = size / 2 - size * 0.04;
    this.depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaTest: 0.5 });
    for (const m of [this.front, this.back]) {
      m.castShadow = true;
      m.customDepthMaterial = this.depth;
    }
    // 옆에서 보면 보이는 종이 두께 (평소엔 숨김)
    this.edge = new THREE.Mesh(new THREE.BoxGeometry(0.22, size * 0.72, 0.22), new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.9 }));
    this.edge.position.y = size * 0.42;
    this.edge.visible = false;
    this.inner.add(this.front, this.back, this.edge);
    this.grp.add(this.inner);
    if (base) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(size * 0.42, 0.5, size * 0.26), new THREE.MeshStandardMaterial({ color: '#fffdf7', roughness: 0.9 }));
      b.position.y = 0.25;
      b.castShadow = b.receiveShadow = true;
      this.grp.add(b);
    }
    scene.add(this.grp);
  }
  set(tex: PaperTex) {
    if (this.current === tex) return;
    this.current = tex;
    this.front.material.map = tex.front;
    this.back.material.map = tex.back;
    this.depth.map = tex.front;
    this.front.material.needsUpdate = this.back.material.needsUpdate = this.depth.needsUpdate = true;
  }
  /** 걸을 때: 통통 튀며 좌우로 까딱 */
  hop(t: number, on: boolean, speed = 12, height = 1.2) {
    this.inner.position.y = on ? Math.abs(Math.sin(t * speed)) * height : 0;
    this.inner.rotation.z = on ? Math.sin(t * speed) * 0.12 : 0;
  }
}

/** 말풍선: 3D 위치를 따라다니는 글자 (DOM) */
export interface Bubble {
  text: string;
  from: number;
  to: number;
  at: () => THREE.Vector3;
  kind?: 'say' | 'think' | 'shout';
}

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  sun: THREE.DirectionalLight;
  bubbles: Bubble[] = [];
  private bubbleEls = new Map<Bubble, HTMLDivElement>();
  constructor(public canvas: HTMLCanvasElement, public overlay: HTMLDivElement, quality = 1) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: quality >= 1, preserveDrawingBuffer: false, powerPreference: 'low-power' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1) * (quality >= 1 ? 1 : 0.7));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color('#f5e3c6');
    this.camera = new THREE.PerspectiveCamera(24, 1, 1, 900);
    this.scene.add(new THREE.HemisphereLight('#fff4e2', '#caa27a', 1.5));
    this.sun = new THREE.DirectionalLight('#fff0d8', 2.4);
    this.sun.position.set(40, 70, 50);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(quality >= 1 ? 2048 : 1024, quality >= 1 ? 2048 : 1024);
    this.sun.shadow.radius = 4;
    this.sun.shadow.bias = -0.0008;
    this.sun.shadow.normalBias = 0.08;
    Object.assign(this.sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 220 });
    this.sun.target.position.set(20, 0, 14);
    this.scene.add(this.sun.target, this.sun);
  }
  resize(w: number, h: number) {
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // 화면이 넓으면 덜 당겨서 같은 범위가 보이게
    this.camera.fov = w / h > 0.75 ? 20 : 32;
    this.camera.updateProjectionMatrix();
  }
  /** 대상(tx,ty,tz)을 각도·거리·높이로 바라본다 */
  look(tx: number, ty: number, tz: number, ang: number, dist: number, hgt: number, shake = 0, t = 0) {
    this.camera.position.set(tx + Math.sin(ang) * dist + Math.sin(t * 97) * shake, ty + hgt * (dist / 100) + Math.cos(t * 83) * shake, tz + Math.cos(ang) * dist);
    this.camera.lookAt(tx, ty, tz);
  }
  say(b: Bubble) {
    this.bubbles.push(b);
  }
  render(t: number) {
    this.renderer.render(this.scene, this.camera);
    const w = this.overlay.clientWidth, h = this.overlay.clientHeight;
    for (const b of this.bubbles) {
      let el = this.bubbleEls.get(b);
      const on = t >= b.from && t < b.to;
      if (!on) {
        if (el) el.style.display = 'none';
        continue;
      }
      if (!el) {
        el = document.createElement('div');
        el.className = `esc-bubble ${b.kind ?? 'say'}`;
        el.textContent = b.text;
        this.overlay.appendChild(el);
        this.bubbleEls.set(b, el);
      }
      const p = b.at().clone().project(this.camera);
      const k = back(seg(t, b.from, b.from + 0.25));
      el.style.display = '';
      el.style.left = `${((p.x + 1) / 2) * w}px`;
      el.style.top = `${((1 - p.y) / 2) * h}px`;
      el.style.transform = `translate(-50%,-100%) scale(${k})`;
    }
  }
  dispose() {
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else mat?.dispose?.();
    });
  }
}

/** 공통 사무실: 책상 넷, 벽을 보고 앉은 팀장 자리(왼쪽 안), 비상구(오른쪽 안), 창문·시계 */
export const FW = 40, FD = 32;
export const DOOR = { x: 34, z: 0 };
export const BOSS_AT = { x: 8.5, z: 10 };
export const HAM_START = { x: 12, z: 29.5 };

export function buildOffice(v: Voxels) {
  for (let x = 0; x < FW; x += 4) for (let z = 0; z < FD; z += 4) v.box(x, -1, z, 4, 1, 4, ((x + z) / 4) % 2 ? '#e7c79c' : '#dcb98c');
  v.box(-1, -1, -1, FW + 1, 22, 1, '#f3dfc2').box(-1, -1, -1, 1, 22, FD + 1, '#efd8b8');
  v.box(-1, 20, -1, FW + 1, 1, 1, '#d8b98f').box(-1, 20, -1, 1, 1, FD + 1, '#d8b98f');
  v.box(0, 0, 0, FW, 1, 0.4, '#c99b6a').box(0, 0, 0, 0.4, 1, FD, '#c99b6a');
  // 창문
  v.box(4, 8, -0.5, 12, 9, 0.8, '#8a5a34').box(5, 9, -0.4, 10, 7, 0.85, '#a9dcff').box(9.6, 9, -0.3, 0.8, 7, 0.9, '#8a5a34').box(5, 12.2, -0.3, 10, 0.6, 0.9, '#8a5a34');
  v.box(6, 13.5, 0.2, 3, 1, 0.3, '#ffffff').box(11, 10.5, 0.2, 2.5, 0.8, 0.3, '#ffffff');
  // 시계 (6시 정각)
  v.box(20, 13, -0.5, 4, 4, 0.8, '#8a5a34').box(20.5, 13.5, -0.4, 3, 3, 0.95, '#fffaf0').box(21.8, 14.8, 0.4, 0.4, 1.3, 0.3, '#333').box(21.8, 13.6, 0.4, 0.4, 1.3, 0.3, '#e0533d');
  // 문틀
  v.box(30, 0, -0.5, 8, 15, 0.75, '#8a5a34');
  const desk = (x: number, z: number, chair: string) => {
    v.box(x, 6, z, 9, 1, 5, '#c98d5b');
    for (const [lx, lz] of [[0.4, 0.4], [7.8, 0.4], [0.4, 3.8], [7.8, 3.8]]) v.box(x + lx, 0, z + lz, 0.8, 6, 0.8, '#9c6a3f');
    v.box(x + 2.5, 7, z + 0.8, 4, 0.5, 1.5, '#5d6570').box(x + 4.2, 7.5, z + 1.1, 0.6, 2, 0.6, '#5d6570');
    v.box(x + 1.8, 9.2, z + 0.9, 5.4, 3.6, 0.6, '#4a5260').box(x + 2.2, 9.6, z + 1.3, 4.6, 2.8, 0.3, '#bfe6ff');
    v.box(x + 2.5, 7, z + 3, 4, 0.4, 1.4, '#e9edf2').box(x + 7.5, 7, z + 1, 1, 1.4, 1, '#ffffff');
    v.box(x + 3, 3.5, z + 6, 3.5, 0.8, 3.5, chair).box(x + 3, 4.3, z + 8.8, 3.5, 4, 0.8, chair).box(x + 4.4, 0.5, z + 7.4, 0.8, 3, 0.8, '#555b66').box(x + 3.2, 0, z + 6.6, 3, 0.5, 2.4, '#555b66');
  };
  desk(2, 14, '#ef8f6b');
  desk(14, 14, '#7fb3e8');
  desk(2, 22, '#9ad18b');
  desk(14, 22, '#f2c45a');
  // 팀장 자리 (벽을 보고 앉아 있다)
  v.box(3, 6, 3, 11, 1, 5, '#8f5a36');
  for (const [lx, lz] of [[0.4, 0.4], [9.8, 0.4], [0.4, 3.8], [9.8, 3.8]]) v.box(3 + lx, 0, 3 + lz, 0.8, 6, 0.8, '#6e4426');
  v.box(5, 7, 3.5, 6, 0.5, 1.5, '#3a3a3a').box(6, 7.5, 3.8, 4, 4, 0.6, '#2e3440').box(6.4, 7.9, 4.3, 3.2, 3.2, 0.2, '#bfe6ff');
  v.box(12, 7, 4.5, 1.2, 2.5, 1.2, '#2fa463').box(4, 7, 6, 1.6, 0.6, 1.2, '#ffd24a');
  const plant = (px: number, pz: number) => {
    v.box(px, 0, pz, 3, 3, 3, '#c9774b').box(px + 0.5, 3, pz + 0.5, 2, 3, 2, '#5bbf6a').box(px - 0.5, 5, pz, 4, 2, 3, '#4fae5d').box(px + 0.5, 7, pz + 0.5, 2, 1.5, 2, '#69c978');
  };
  plant(17, 1);
  plant(37, 28);
  v.box(38, 0, 8, 2, 8, 2, '#dfe6ee').box(38.2, 8, 8.2, 1.6, 3, 1.6, '#9fd3ff');
  v.box(26, 0, 12, 10, 0.2, 8, '#f0a9a0');
}

/** 비상구 문 (경첩에서 열린다) + 문 뒤 밝은 빛 + EXIT 등 */
export function buildDoor(scene: THREE.Object3D) {
  const door = new THREE.Group();
  door.position.set(31, 0, 0.62);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 0.6), new THREE.MeshStandardMaterial({ color: '#c2834f', roughness: 0.8 }));
  panel.position.set(3, 7, 0);
  panel.castShadow = true;
  const knob = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: '#ffd24a', metalness: 0.6, roughness: 0.3 }));
  knob.position.set(5.2, 7, 0.5);
  door.add(panel, knob);
  const light = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 0.1), new THREE.MeshBasicMaterial({ color: '#fff6c8' }));
  light.position.set(34, 7, 0.3);
  const exitMat = new THREE.MeshBasicMaterial({ color: '#2fd16f' });
  const exit = new THREE.Mesh(new THREE.BoxGeometry(5, 1.8, 0.4), exitMat);
  exit.position.set(34, 16.8, 0.1);
  scene.add(door, light, exit);
  return { door, knob, exitMat, light };
}

/** 느낌표 블록 */
export function buildBang(scene: THREE.Object3D, color = '#ff4a3d') {
  const g = new THREE.Group();
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const a = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1), m);
  a.position.y = 2;
  g.add(a, new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), m));
  g.visible = false;
  scene.add(g);
  return g;
}

/** 부서지는 블록 파편 */
export class Debris {
  mesh: THREE.InstancedMesh;
  private parts: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Vector3; t0: number; s: number }[] = [];
  constructor(scene: THREE.Object3D, n: number, color: string) {
    this.mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color, roughness: 0.8 }), n);
    this.mesh.castShadow = true;
    this.mesh.count = 0;
    scene.add(this.mesh);
  }
  burst(at: THREE.Vector3, t0: number, n: number, seed: number, power = 1) {
    let s = seed;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < n; i++)
      this.parts.push({ p: at.clone(), v: new THREE.Vector3((r() - 0.5) * 30 * power, (8 + r() * 18) * power, (r() - 0.2) * 24 * power), r: new THREE.Vector3(r() * 8, r() * 8, r() * 8), t0, s: 0.6 + r() * 0.9 });
  }
  update(t: number) {
    const m4 = new THREE.Matrix4();
    let n = 0;
    for (const q of this.parts) {
      const dt = t - q.t0;
      if (dt < 0) continue;
      const y = Math.max(0.3, q.p.y + q.v.y * dt - 25 * dt * dt);
      const k = y <= 0.3 ? 0.4 : 1;
      m4.compose(
        new THREE.Vector3(q.p.x + q.v.x * dt * k, y, q.p.z + q.v.z * dt * k),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(q.r.x * dt, q.r.y * dt, q.r.z * dt)),
        new THREE.Vector3(q.s, q.s, q.s),
      );
      this.mesh.setMatrixAt(n++, m4);
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
