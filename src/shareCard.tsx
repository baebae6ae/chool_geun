import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { HamsterSprite, type Pose } from './components/hamster/HamsterSprite';
import type { Customization } from './domain/types';
import { isNative } from './platform';

/** 공유 카드 속 햄스터 자세. 앱 안에서 쓰는 자세 중 사진 찍기 좋은 것만 골랐다 */
export const CARD_POSES: { id: string; label: string; pose: Pose }[] = [
  { id: 'wave', label: '안녕!', pose: { pose: 'front', action: 'wave' } },
  { id: 'cheer', label: '힘내라 힘', pose: { pose: 'front', action: 'cheer' } },
  { id: 'heart', label: '하트', pose: { pose: 'front', action: 'heart' } },
  { id: 'shy', label: '부끄', pose: { pose: 'front', action: 'shy' } },
  { id: 'hug', label: '안아줘', pose: { pose: 'front', action: 'hug' } },
  { id: 'stuff', label: '볼 빵빵', pose: { pose: 'front', action: 'stuff' } },
  { id: 'dance', label: '신나는 춤', pose: { pose: 'front', action: 'dance' } },
  { id: 'yawn', label: '하품', pose: { pose: 'front', action: 'yawn' } },
  { id: 'sleep', label: '꿀잠', pose: { pose: 'side', action: 'sleep' } },
];

export interface CardData {
  custom: Customization;
  pose: Pose;
  dateText: string;
  label: string;
  amount: string;
  sub: string;
  quote: string;
}

const W = 1080;
const H = 1350;
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
  for (let i = 0; i < 9000; i++) {
    ctx.globalAlpha = 0.05 + rnd() * 0.07;
    ctx.fillStyle = rnd() < 0.5 ? '#b98a5a' : '#ffffff';
    ctx.fillRect(rnd() * W, rnd() * H, 2 + rnd() * 2, 2 + rnd() * 2);
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
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const sans = `"Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`;
  const jua = `"Jua", ${sans}`;

  // 배경: 크림색 종이 + 번지는 파스텔
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#fff7e8');
  bg.addColorStop(1, '#ffe9d2');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, c] of [
    [W, 0, 520, 'rgba(190,230,208,0.75)'],
    [0, 560, 460, 'rgba(255,222,190,0.75)'],
    [W, H, 520, 'rgba(200,224,247,0.75)'],
  ] as [number, number, number, string][]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  grain(ctx);

  // 바깥 점선 테두리
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
  ctx.fillText(d.dateText, 84, 120);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#a9794f';
  ctx.fillText('햄스터 출근일지', W - 84, 120);

  // 햄스터 스티커
  const cx = W / 2;
  const cy = 405;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath();
  ctx.arc(cx, cy, 275, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PENCIL;
  ctx.lineWidth = 6;
  ctx.setLineDash([26, 16]);
  ctx.stroke();
  ctx.setLineDash([]);
  const img = await loadImage('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(hamsterSvg(d.custom, d.pose, d.pose.pose === 'side' ? 560 : 500)));
  const sleeping = d.pose.pose === 'side';
  ctx.drawImage(img, cx - img.width / 2, cy - img.height / 2 + (sleeping ? 40 : 6), img.width, img.height);

  // 번 돈
  ctx.textAlign = 'center';
  ctx.fillStyle = INK2;
  ctx.font = `700 46px ${sans}`;
  ctx.fillText(d.label, cx, 765);
  const panel = { x: 90, y: 790, w: W - 180, h: 240 };
  ctx.fillStyle = '#fff2c4';
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 44);
  ctx.fill();
  ctx.strokeStyle = '#dcb455';
  ctx.lineWidth = 7;
  roundRect(ctx, panel.x, panel.y, panel.w, panel.h, 44);
  ctx.stroke();
  ctx.fillStyle = INK;
  let fs = 150;
  ctx.font = `${fs}px ${jua}`;
  while (ctx.measureText(d.amount).width > panel.w - 80 && fs > 60) {
    fs -= 6;
    ctx.font = `${fs}px ${jua}`;
  }
  ctx.fillText(d.amount, cx, panel.y + 145);
  ctx.fillStyle = INK2;
  ctx.font = `600 36px ${sans}`;
  ctx.fillText(d.sub, cx, panel.y + 210);

  // 한마디
  ctx.font = `700 42px ${sans}`;
  const lines = wrap(ctx, d.quote, W - 260).slice(0, 4);
  const lh = 58;
  const qh = 52 + lines.length * lh;
  const qy = 1062 + Math.max(0, 4 - lines.length) * 14;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  roundRect(ctx, 90, qy, W - 180, qh, 36);
  ctx.fill();
  ctx.strokeStyle = PENCIL;
  ctx.lineWidth = 5;
  ctx.setLineDash([20, 12]);
  roundRect(ctx, 90, qy, W - 180, qh, 36);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = INK;
  lines.forEach((l, i) => ctx.fillText(l, cx, qy + 60 + i * lh));

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('이미지를 만들지 못했어요'))), 'image/png'));
}

/** 만든 이미지를 공유(앱: 공유 창, 웹: 공유 창 또는 다운로드). 취소하면 false */
export async function shareCardImage(blob: Blob, name: string): Promise<boolean> {
  const file = new File([blob], name, { type: 'image/png' });
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
