/**
 * 오늘의 퇴근 탈출: 복셀 사무실에서 종이 인형 햄스터가 퇴근하는 8~12초 연출.
 * 끝나면(건너뛰면) onDone → 원래 있던 퇴근 정리 카드가 뜬다. 3D를 못 쓰는 기기면 바로 넘어간다.
 */
import { useEffect, useRef, useState } from 'react';
import type { Customization } from '../../domain/types';
import type { FrontAction } from '../hamster/HamsterSprite';
import { DEFAULT_CUSTOM } from '../../domain/customization';
import type { EscapeId } from '../../domain/escape';
import { hamsterSvg, loadImage } from '../../shareCard';
import { useBackHandler } from '../../backStack';
import { playCues } from '../payday/paydaySfx';
import { buildDoor, buildOffice, BOSS_AT, HAM_START, paperTexture, Stage, Standee, Voxels, type PaperTex } from './stage';
import { EPISODES } from './episodes';
import './escape.css';

/** 소리는 전부 종이로 낸 소리로: 통통·바스락·구깃·찢어짐·툭 */
const PAPER: Record<string, string> = { tick: 'ptap', whoosh: 'rustle', sting: 'crumple', creak: 'flap', chime: 'rustle', wind: 'rustle', pop: 'flap', shh: 'rustle', thump: 'pthud', crash: 'tear', rattle: 'ptap' };
const paperCues = (cues: { at: number; sfx: string; dur?: number }[]) =>
  cues.map((c) => ({ ...c, sfx: PAPER[c.sfx] ?? c.sfx, dur: c.sfx === 'chime' ? 0.5 : c.sfx === 'shh' ? 0.3 : c.dur }));

const HAM_POSES: FrontAction[] = ['type', 'idle', 'shock', 'cheer', 'smug', 'doze', 'shy'];
const BOSS_POSES: FrontAction[] = ['idle', 'smug', 'shock', 'think', 'shy'];
const BOSS: Customization = { ...DEFAULT_CUSTOM, species: 'cat', color: 'gray', outfit: 'suit', hat: 'none', glasses: false, hand: 'none' };

async function textures(custom: Customization): Promise<Record<string, PaperTex>> {
  const out: Record<string, PaperTex> = {};
  const one = async (key: string, c: Customization, action: FrontAction) => {
    const svg = hamsterSvg(c, { pose: 'front', action }, 480);
    const img = await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`);
    out[key] = paperTexture(img);
  };
  await Promise.all([...HAM_POSES.map((a) => one(`h:${a}`, custom, a)), ...BOSS_POSES.map((a) => one(`b:${a}`, BOSS, a))]);
  return out;
}

export function EscapeCinema({ custom, episode, onDone }: { custom: Customization; episode: EscapeId; onDone: () => void }) {
  const ep = EPISODES[episode];
  const canvas = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'load' | 'play'>('load');
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  useBackHandler(true, finish);

  useEffect(() => {
    let stage: Stage | null = null;
    let raf = 0, stop = () => {}, alive = true;
    (async () => {
      try {
        await document.fonts?.load?.('700 40px GaeguDiary');
        const tex = await textures(custom);
        if (!alive || !canvas.current || !overlay.current) return;
        stage = new Stage(canvas.current, overlay.current);
        const fit = () => stage && canvas.current && stage.resize(canvas.current.clientWidth, canvas.current.clientHeight);
        fit();
        window.addEventListener('resize', fit);
        const v = new Voxels();
        buildOffice(v);
        stage.scene.add(v.build());
        const door = buildDoor(stage.scene);
        const ham = new Standee(11, stage.scene);
        ham.grp.position.set(HAM_START.x, 0, HAM_START.z);
        const boss = new Standee(13, stage.scene);
        boss.grp.position.set(BOSS_AT.x, 0, BOSS_AT.z);
        boss.grp.rotation.y = Math.PI;
        const update = ep.setup({ stage, tex, ham, boss, door });
        update(0);
        stage.render(0);
        setPhase('play');
        stop = playCues(paperCues(ep.cues));
        const t0 = performance.now();
        let last = -1, slow = 0, frames = 0;
        const loop = () => {
          if (!stage) return;
          const now = performance.now();
          const s = (now - t0) / 1000;
          const f = Math.floor(s * 30);
          if (f !== last) {
            const a = performance.now();
            last = f;
            update(Math.min(s, ep.dur));
            stage.render(s);
            // 느린 기기: 처음 몇 장면이 무거우면 해상도를 낮춘다
            if (frames++ < 30 && performance.now() - a > 45 && ++slow === 5) stage.renderer.setPixelRatio(1);
          }
          if (s >= ep.dur + 0.9) return finish();
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
        return () => window.removeEventListener('resize', fit);
      } catch {
        finish();
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      stop();
      stage?.dispose();
    };
    // 한 번만 재생한다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="escape" role="dialog" aria-modal="true" aria-label="오늘의 퇴근 탈출">
      <canvas ref={canvas} className="esc-canvas" aria-hidden />
      <div className="esc-tilt top" aria-hidden />
      <div className="esc-tilt bottom" aria-hidden />
      <div ref={overlay} className="esc-overlay" aria-hidden />
      {phase === 'load' && <div className="esc-loading">🚪</div>}
      <button type="button" className="esc-skip" onClick={finish}>
        건너뛰기 ›
      </button>
    </div>
  );
}
