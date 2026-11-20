/**
 * 월급날 연출 효과음: 소리 파일 없이 그 자리에서 합성한다 (펜 긁기·띠링·진동·휙·쿵·짤랑·반짝·쾅·낙서·시무룩).
 * 배경음악은 넣지 않는다. 소리를 낼 수 없는 환경이면 조용히 넘어간다.
 */
import type { Sfx } from '../../domain/paydayCinema';

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

function synth(ctx: Ctx, sfx: Sfx, dur = 0.4): AudioBuffer {
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
  }
}

/** 시간표대로 효과음을 예약한다. 멈출 때 부르는 함수를 돌려준다 */
export function playCues(cues: { at: number; sfx: Sfx; dur?: number }[], offset = 0): () => void {
  let ctx: AudioContext | null = null;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return () => {};
    ctx = new AC();
    void ctx.resume?.();
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
        buf = synth(ctx, c.sfx, c.dur);
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
