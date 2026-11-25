/**
 * 월급날 연출 효과음: 소리 파일 없이 그 자리에서 합성한다 (펜 긁기·띠링·진동·휙·쿵·짤랑·반짝·쾅·낙서·시무룩).
 * 배경음악은 넣지 않는다. 소리를 낼 수 없는 환경이면 조용히 넘어간다.
 */
import type { Sfx } from '../../domain/paydayCinema';

/** 월급날 + 퇴근 탈출에서 쓰는 소리 */
export type SfxKind = Sfx | 'tick' | 'sting' | 'flap' | 'creak' | 'chime' | 'wind' | 'pop' | 'print' | 'shh' | 'crash' | 'rattle' | 'snip' | 'ptap' | 'rustle' | 'crumple' | 'tear' | 'pthud';

type Ctx = AudioContext;
const SR = 22050;

function noiseGen(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647) * 2 - 1;
}

function make(ctx: Ctx, sec: number, f: (t: number, i: number) => number): AudioBuffer {
  const n = Math.max(1, Math.floor(sec * SR));
  const buf = ctx.createBuffer(1, n, SR);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = f(i / SR, i);
  return buf;
}

function synth(ctx: Ctx, sfx: SfxKind, dur = 0.4): AudioBuffer {
  const rnd = noiseGen(7 + sfx.length * 31);
  const sin = (fr: number, t: number) => Math.sin(2 * Math.PI * fr * t);
  switch (sfx) {
    case 'pen':
    case 'scribble': {
      let lp = 0;
      const rate = sfx === 'pen' ? 11 : 17;
      return make(ctx, dur, (t) => {
        lp = lp * 0.55 + rnd() * 0.45;
        const gate = 0.6 + 0.4 * sin(rate, t);
        return lp * 0.5 * gate * Math.min(1, t / 0.02) * Math.min(1, (dur - t) / 0.05);
      });
    }
    case 'ding':
      return make(ctx, 1.2, (t) => {
        const a = 0.45 * Math.exp(-t * 4) * (sin(1318.5, t) + 0.3 * sin(2650, t));
        const b = t > 0.12 ? 0.4 * Math.exp(-(t - 0.12) * 4) * (sin(1760, t) + 0.3 * sin(3537, t)) : 0;
        return a + b;
      });
    case 'buzz':
      return make(ctx, dur, (t) => 0.18 * Math.sign(sin(170, t)) * (0.5 + 0.5 * sin(18, t)) * Math.min(1, (dur - t) / 0.05));
    case 'whoosh': {
      let lp = 0;
      return make(ctx, dur, (t) => {
        const k = t / dur;
        const a = 0.05 + 0.6 * k;
        lp = lp * (1 - a) + rnd() * a;
        return lp * 0.8 * Math.sin(Math.PI * k);
      });
    }
    case 'thump':
    case 'slam':
      return make(ctx, 0.5, (t) => {
        const low = (sfx === 'slam' ? 0.9 : 0.8) * Math.exp(-t * 9) * sin(95 - 50 * t, t);
        const hit = t < 0.08 ? (sfx === 'slam' ? 0.5 : 0.3) * rnd() * Math.exp(-t * 60) : 0;
        return low + hit;
      });
    case 'clink': {
      const fr = 2600 + (rnd() + 1) * 500;
      return make(ctx, 0.3, (t) => 0.16 * Math.exp(-t * 14) * (sin(fr, t) + 0.6 * sin(fr * 1.48, t)));
    }
    case 'twinkle':
      return make(ctx, 0.8, (t) =>
        [2093, 2637, 3136, 4186].reduce((s, fr, i) => (t > i * 0.06 ? s + 0.09 * Math.exp(-(t - i * 0.06) * 7) * sin(fr, t) : s), 0),
      );
    case 'sad':
      // 시무룩하게 내려가는 두 음
      return make(ctx, 1.0, (t) => {
        const fr = t < 0.35 ? 392 : 330 - (t - 0.35) * 40;
        return 0.22 * Math.min(1, t / 0.02) * Math.exp(-t * 2.2) * (sin(fr, t) + 0.25 * sin(fr * 2, t));
      });
    case 'tick': {
      // 종이 인형 통통 걸음
      const fr = 900 + (rnd() + 1) * 150;
      return make(ctx, 0.08, (t) => 0.3 * Math.exp(-t * 60) * sin(fr, t) + 0.15 * rnd() * Math.exp(-t * 120));
    }
    case 'sting':
      // 들켰다! 두둥
      return make(ctx, 0.9, (t) =>
        [[196, 0], [185, 0.18]].reduce((s, [fr, d]) => (t > d ? s + 0.4 * Math.exp(-(t - d) * 4) * (sin(fr, t) + 0.5 * sin(fr * 1.5, t) + 0.3 * sin(fr * 2, t)) : s), 0),
      );
    case 'flap': {
      // 종이 접는 바스락
      let lp = 0;
      return make(ctx, 0.22, (t) => {
        lp = lp * 0.3 + rnd() * 0.7;
        return lp * 0.4 * Math.exp(-t * 14) * (0.6 + 0.4 * sin(55, t));
      });
    }
    case 'creak':
      return make(ctx, 0.5, (t) => 0.16 * Math.exp(-t * 3) * sin(220 + 120 * sin(7, t), t));
    case 'chime':
      return make(ctx, 1.0, (t) => [1047, 1319, 1568, 2093].reduce((s, fr, i) => (t > i * 0.09 ? s + 0.14 * Math.exp(-(t - i * 0.09) * 5) * sin(fr, t) : s), 0));
    case 'wind': {
      let lp = 0;
      return make(ctx, dur, (t) => {
        lp = lp * 0.97 + rnd() * 0.03;
        return lp * 2.2 * Math.min(1, t / 0.4) * Math.min(1, (dur - t) / 0.5) * (0.7 + 0.3 * sin(0.7, t));
      });
    }
    case 'pop':
      return make(ctx, 0.12, (t) => 0.3 * Math.exp(-t * 40) * sin(500 + 900 * t * 8, t));
    case 'print':
      return make(ctx, dur, (t) => 0.12 * Math.sign(sin(110, t)) * (0.6 + 0.4 * sin(9, t)) * Math.min(1, (dur - t) / 0.08) + 0.04 * rnd());
    case 'shh': {
      let lp = 0;
      return make(ctx, 0.5, (t) => {
        lp = lp * 0.2 + rnd() * 0.8;
        return lp * 0.25 * Math.min(1, t / 0.08) * Math.min(1, (0.5 - t) / 0.15);
      });
    }
    case 'crash':
      return make(ctx, 0.35, (t) => 0.45 * rnd() * Math.exp(-t * 12) + 0.5 * Math.exp(-t * 10) * sin(120 - 60 * t, t));
    case 'rattle':
      return make(ctx, 0.3, (t) => (Math.floor(t * 30) % 2 ? 0.25 * Math.exp(-((t * 30) % 1) * 9) : 0) * rnd());
    case 'ptap': {
      // 종이 인형이 바닥을 톡: 짧고 마른 바스락
      let lp = 0;
      return make(ctx, 0.06, (t) => {
        lp = lp * 0.35 + rnd() * 0.65;
        return lp * 0.32 * Math.exp(-t * 70);
      });
    }
    case 'rustle': {
      // 종이가 휙 스치는 바스락 (군데군데 탁탁 튄다)
      let lp = 0;
      const d = dur || 0.4;
      return make(ctx, d, (t) => {
        lp = lp * 0.45 + rnd() * 0.55;
        const crack = rnd() > 0.985 ? 2.2 : 1;
        return lp * 0.32 * crack * Math.sin(Math.PI * Math.min(1, t / d));
      });
    }
    case 'crumple':
      // 깜짝! 종이를 구기는 소리 (딱딱 터지는 잔소리가 촘촘)
      return make(ctx, 0.5, (t) => (rnd() > 0.9 ? rnd() * 0.9 : rnd() * 0.12) * Math.exp(-t * 5));
    case 'tear': {
      // 종이 찢어지는 소리: 잔소리가 점점 빨라진다
      let lp = 0;
      return make(ctx, 0.4, (t) => {
        lp = lp * 0.3 + rnd() * 0.7;
        const dens = 0.85 - t * 0.6;
        return (rnd() > dens ? lp * 0.8 : lp * 0.15) * Math.min(1, (0.4 - t) / 0.06);
      });
    }
    case 'pthud': {
      // 두꺼운 종이가 툭 떨어지는 소리
      let lp = 0;
      return make(ctx, 0.25, (t) => {
        lp = lp * 0.85 + rnd() * 0.15;
        return (lp * 1.6 + 0.35 * sin(80 - 60 * t, t)) * Math.exp(-t * 16);
      });
    }
    case 'snip':
      return make(ctx, 0.09, (t) => 0.35 * Math.exp(-t * 50) * (rnd() * 0.6 + sin(2400, t) * 0.4));
  }
}

/** 시간표대로 효과음을 예약한다. 멈출 때 부르는 함수를 돌려준다 */
export function playCues(cues: { at: number; sfx: SfxKind | string; dur?: number }[], offset = 0): () => void {
  let ctx: AudioContext | null = null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return () => {};
    ctx = new AC();
    ctx.resume?.()?.catch(() => {});
    const master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    const cache = new Map<string, AudioBuffer>();
    const start = ctx.currentTime + 0.05;
    for (const c of cues) {
      if (c.at < offset) continue;
      const key = `${c.sfx}:${c.dur ?? ''}${c.sfx === 'clink' ? Math.round(c.at * 10) % 4 : ''}`;
      let buf = cache.get(key);
      if (!buf) {
        buf = synth(ctx, c.sfx as SfxKind, c.dur);
        cache.set(key, buf);
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(master);
      src.start(start + c.at - offset);
    }
  } catch {
    // 소리를 못 내도 연출은 그대로
  }
  return () => {
    try {
      void ctx?.close();
    } catch {
      // 무시
    }
  };
}
