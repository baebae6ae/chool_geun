import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { HamsterSprite, type FrontAction, type Pose, type SideAction } from './components/hamster/HamsterSprite';
import type { Customization } from './domain/types';
import { isNative } from './platform';

/**
 * 공유 카드의 구도. 같은 햄스터라도 날마다 다른 자세·크기·위치로 찍힌 사진처럼 나온다.
 * scale은 전신이 액자 높이의 약 80%일 때를 1로 본다. x·y는 액자 크기 대비 치우침.
 */
export interface Composition {
  id: string;
  label: string;
  pose: Pose;
  scale: number;
  x?: number;
  y?: number;
  rot?: number;
  flip?: boolean;
}
const F = (action: FrontAction): Pose => ({ pose: 'front', action });
const S = (action: SideAction): Pose => ({ pose: 'side', action });

export const COMPOSITIONS: Composition[] = [
  { id: 'wave', label: '안녕! 인사', pose: F('wave'), scale: 1 },
  { id: 'close-smile', label: '얼빡샷', pose: F('idle'), scale: 1.9, y: 0.11 },
  { id: 'side-stand', label: '옆모습', pose: S('stand'), scale: 1.2, y: 0.03 },
  { id: 'side-stand-flip', label: '반대쪽 옆모습', pose: S('stand'), scale: 1.2, y: 0.03, flip: true },
  { id: 'side-close', label: '옆얼굴 얼빡샷', pose: S('stand'), scale: 2.1, x: -0.22, y: 0.06 },
  { id: 'peek-shy', label: '부끄 빼꼼', pose: F('shy'), scale: 1.5, x: -0.2, y: 0.4 },
  { id: 'peek-wave', label: '빼꼼 인사', pose: F('wave'), scale: 1.5, x: 0.2, y: 0.4, flip: true },
  { id: 'tilt-cheer', label: '기운 넘침', pose: F('cheer'), scale: 1.05, x: 0.1, rot: -9 },
  { id: 'tiny', label: '작게 앉아서', pose: F('idle'), scale: 0.5, x: 0.27, y: 0.27 },
  { id: 'tiny-left', label: '구석에 쏙', pose: F('sniff'), scale: 0.55, x: -0.28, y: 0.25 },
  { id: 'heart', label: '마음을 전해요', pose: F('heart'), scale: 1.05 },
  { id: 'hug', label: '안아줘', pose: F('hug'), scale: 1.05 },
  { id: 'sleep', label: '꿀잠', pose: S('sleep'), scale: 1.2, y: 0.12 },
  { id: 'dance', label: '신나는 춤', pose: F('dance'), scale: 1.05, rot: 7 },
  { id: 'yawn-close', label: '하품 얼빡샷', pose: F('yawn'), scale: 1.7, y: 0.1 },
  { id: 'groom-tilt', label: '세수하는 중', pose: F('groom'), scale: 1.1, rot: -7, x: -0.08 },
  { id: 'look', label: '두리번', pose: F('look'), scale: 1.2, x: 0.1 },
  { id: 'walk', label: '산책', pose: S('walk'), scale: 0.8, y: 0.2, x: -0.05 },
];

const THEMES = [
  { bg: ['#ffe9d6', '#ffd3b3'], line: '#d9985f' },
  { bg: ['#e0f4e8', '#c5e9d3'], line: '#6fbb8c' },
  { bg: ['#dfeefb', '#c4dcf3'], line: '#78a6d6' },
  { bg: ['#ece2f9', '#d9caf0'], line: '#a284cf' },
  { bg: ['#fff3c9', '#ffe49c'], line: '#d6ad3f' },
  { bg: ['#ffe1e8', '#ffc9d6'], line: '#e48fa3' },
];
const DECORS = ['hearts', 'stars', 'dots', 'none'] as const;

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 날짜(+다시 뽑기 횟수)마다 구도·색·장식이 정해진다. 같은 날 같은 번호면 항상 같다. */
export function drawLook(dateKey: string, draws: number) {
  const seed = `${dateKey}|card|${draws}`;
  return {
    comp: COMPOSITIONS[hash(seed + '|c') % COMPOSITIONS.length],
    theme: THEMES[hash(seed + '|t') % THEMES.length],
    decor: DECORS[hash(seed + '|d') % DECORS.length],
    seed: hash(seed + '|s'),
  };
}

export interface CardData {
  custom: Customization;
  comp: Composition;
  theme: (typeof THEMES)[number];
  decor: (typeof DECORS)[number];
  seed: number;
  dateText: string;
  /** "햄찌 · 신입 햄스터" */
  nameTag: string;
  /** 돈과 상관없는 작은 칩들 ("출근 12일째" 등) */
  chips: string[];
  quote: string;
}

const W = 1080;
const H = 1350;
/** 저장 크기 배율: 그림은 1080×1350 좌표로 그리고 900×1125로 줄여 저장한다 (용량 절약) */
const OUT_SCALE = 900 / 1080;
const INK = '#362a20';
const INK2 = '#675842';
const PENCIL = '#c9985f';

const PENCIL_FILTER = `<defs><filter id="pencil-hs" x="-6%" y="-6%" width="112%" height="112%" color-interpolation-filters="sRGB">
<feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" result="w"/>
<feDisplacementMap in="SourceGraphic" in2="w" scale="4.2" xChannelSelector="R" yChannelSelector="G" result="wob"/>
<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11" result="g"/>
<feColorMatrix in="g" type="matrix" values="0 0 0 0 1  0 0 0 0 0.97  0 0 0 0 0.92  0 0 0 3.4 -1.6" result="specks"/>
<feComposite in="specks" in2="wob" operator="in" result="paper"/>
<feMerge><feMergeNode in="wob"/><feMergeNode in="paper"/></feMerge></filter></defs>`;

/** 햄스터 스프라이트를 화면 밖에서 그려 독립된 SVG 문자열로 만든다 */
function hamsterSvg(custom: Customization, pose: Pose, size: number): string {
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => root.render(<HamsterSprite custom={custom} pose={pose} className="no-shadow" still />));
  const svg = host.querySelector('svg');
  let out = '';
  if (svg) {
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const vb = svg.getAttribute('viewBox')!.split(' ').map(Number);
    const ratio = vb[2] / vb[3];
    svg.setAttribute('width', String(Math.round(ratio >= 1 ? size : size * ratio)));
    svg.setAttribute('height', String(Math.round(ratio >= 1 ? size / ratio : size)));
    svg.removeAttribute('class');
    const inner = svg.innerHTML;
    svg.innerHTML = `${PENCIL_FILTER}<g filter="url(#pencil-hs)">${inner}</g>`;
    out = svg.outerHTML;
  }
  root.unmount();
  return out;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 만들지 못했어요'));
    img.src = src;
  });
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** 종이 결: 작은 점을 흩뿌려 색연필 종이 느낌을 낸다 */
function grain(ctx: CanvasRenderingContext2D, seed = 7) {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.save();
  for (let i = 0; i < 1800; i++) {
    ctx.globalAlpha = 0.05 + rnd() * 0.07;
    ctx.fillStyle = rnd() < 0.5 ? '#b98a5a' : '#ffffff';
    ctx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 2, 2 + rnd() * 2);
  }
  ctx.restore();
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

function heart(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9);
  ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.4);
  ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.1, x, y + r * 0.9);
  ctx.fill();
}

function decorate(ctx: CanvasRenderingContext2D, kind: CardData['decor'], seed: number, fx: number, fy: number, fw: number, fh: number) {
  if (kind === 'none') return;
  let st = seed % 2147483647 || 1;
  const rnd = () => ((st = (st * 16807) % 2147483647) / 2147483647);
  ctx.save();
  for (let i = 0; i < 16; i++) {
    const x = fx + 40 + rnd() * (fw - 80);
    const y = fy + 40 + rnd() * (fh - 80);
    const r = 10 + rnd() * 16;
    ctx.globalAlpha = 0.35 + rnd() * 0.3;
    if (kind === 'hearts') {
      ctx.fillStyle = '#ff8fa8';
      heart(ctx, x, y, r * 0.8);
    } else if (kind === 'stars') {
      ctx.fillStyle = '#ffd54a';
      sparkle(ctx, x, y, r * 1.2);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

export async function renderCard(d: CardData): Promise<Blob> {
  try {
    await Promise.all([document.fonts.load('120px Jua'), document.fonts.load('700 40px Pretendard')]);
  } catch {
    // 폰트 로딩 실패 시 기본 글꼴로
  }
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * OUT_SCALE);
  canvas.height = Math.round(H * OUT_SCALE);
  const ctx = canvas.getContext('2d')!;
  ctx.scale(OUT_SCALE, OUT_SCALE);
  const sans = `"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`;

  // 바탕: 크림색 종이 + 번지는 파스텔
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fff7e8');
  bg.addColorStop(1, '#ffeedb');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, c] of [
    [W, 0, 520, 'rgba(190,230,208,0.6)'],
    [0, 700, 460, 'rgba(255,222,190,0.6)'],
    [W, H, 520, 'rgba(200,224,247,0.6)'],
  ] as [number, number, number, string][]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx);

  ctx.strokeStyle = PENCIL;
  ctx.lineWidth = 5;
  ctx.setLineDash([22, 14]);
  roundRect(ctx, 34, 34, W - 68, H - 68, 56);
  ctx.stroke();
  ctx.setLineDash([]);

  // 머리글
  ctx.fillStyle = INK2;
  ctx.font = `700 40px ${sans}`;
  ctx.textAlign = 'left';
  ctx.fillText(d.dateText, 84, 118);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#a9794f';
  ctx.fillText('햄스터 출근일지', W - 84, 118);

  // 사진 액자: 구도에 따라 햄스터를 크게 자르거나 구석에 놓는다
  const fx = 84;
  const fy = 150;
  const fw = W - 168;
  const fh = 640;
  ctx.save();
  roundRect(ctx, fx, fy, fw, fh, 64);
  ctx.clip();
  const fg = ctx.createLinearGradient(0, fy, 0, fy + fh);
  fg.addColorStop(0, d.theme.bg[0]);
  fg.addColorStop(1, d.theme.bg[1]);
  ctx.fillStyle = fg;
  ctx.fillRect(fx, fy, fw, fh);
  decorate(ctx, d.decor, d.seed, fx, fy, fw, fh);
  // 바닥 느낌의 연한 띠
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.fillRect(fx, fy + fh - 90, fw, 90);

  const c = d.comp;
  const side = c.pose.pose === 'side';
  const base = side ? 560 : 520;
  const size = Math.round(base * c.scale);
  const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(hamsterSvg(d.custom, c.pose, size)));
  ctx.translate(fx + fw / 2 + (c.x ?? 0) * fw, fy + fh / 2 + (c.y ?? 0) * fh + (side ? 20 : 0));
  if (c.rot) ctx.rotate((c.rot * Math.PI) / 180);
  if (c.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);
  ctx.restore();

  ctx.strokeStyle = d.theme.line;
  ctx.lineWidth = 7;
  ctx.setLineDash([26, 14]);
  roundRect(ctx, fx, fy, fw, fh, 64);
  ctx.stroke();
  ctx.setLineDash([]);

  // 이름표
  ctx.textAlign = 'center';
  ctx.font = `800 40px ${sans}`;
  const tagW = Math.min(W - 200, ctx.measureText(d.nameTag).width + 90);
  ctx.fillStyle = '#fff2c4';
  roundRect(ctx, W / 2 - tagW / 2, 820, tagW, 74, 37);
  ctx.fill();
  ctx.strokeStyle = '#dcb455';
  ctx.lineWidth = 5;
  roundRect(ctx, W / 2 - tagW / 2, 820, tagW, 74, 37);
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillText(d.nameTag, W / 2, 871);

  // 오늘의 한마디 (카드의 주인공)
  ctx.font = `800 54px ${sans}`;
  const lines = wrap(ctx, d.quote, W - 240).slice(0, 4);
  const lh = 76;
  const top = 950;
  ctx.fillStyle = INK;
  lines.forEach((l, i) => ctx.fillText(l, W / 2, top + 50 + i * lh));

  // 작은 칩들 (출근 일수, 월급날 등 — 금액 정보는 쓰지 않는다)
  if (d.chips.length) {
    ctx.font = `700 34px ${sans}`;
    const widths = d.chips.map((t) => ctx.measureText(t).width + 56);
    const total = widths.reduce((a, b) => a + b, 0) + 18 * (widths.length - 1);
    let x = W / 2 - total / 2;
    const y = 1215;
    d.chips.forEach((t, i) => {
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      roundRect(ctx, x, y, widths[i], 64, 32);
      ctx.fill();
      ctx.strokeStyle = PENCIL;
      ctx.lineWidth = 4;
      ctx.setLineDash([14, 9]);
      roundRect(ctx, x, y, widths[i], 64, 32);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = INK2;
      ctx.fillText(t, x + widths[i] / 2, y + 43);
      x += widths[i] + 18;
    });
  }

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했어요'))), 'image/jpeg', 0.86));
}

/** 만든 이미지를 공유(앱: 공유 창, 웹: 공유 창 또는 다운로드). 취소하면 false */
export async function shareCardImage(blob: Blob, name: string): Promise<boolean> {
  const file = new File([blob], name, { type: 'image/jpeg' });
  if (isNative) {
    try {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([import('@capacitor/filesystem'), import('@capacitor/share')]);
      const data = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result).split(',')[1]);
        r.onerror = () => rej(r.error);
        r.readAsDataURL(blob);
      });
      const w = await Filesystem.writeFile({ path: name, data, directory: Directory.Cache });
      await Share.share({ title: '햄스터 출근일지', url: w.uri, dialogTitle: '카드 공유' });
      return true;
    } catch (e) {
      if (/cancel/i.test(String((e as Error)?.message))) return false;
      throw e;
    }
  }
  const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: '햄스터 출근일지' });
      return true;
    } catch (e) {
      if ((e as DOMException)?.name === 'AbortError') return false;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return true;
}
