// 에뮬레이터 안에서 실행 중인 앱의 웹뷰에 크롬 개발자 도구 프로토콜(CDP)로 직접 붙어 화면을 눌러본다.
// (Playwright는 안드로이드 웹뷰의 브라우저 컨텍스트 관리 명령을 지원하지 않아 쓰지 않는다)
import CDP from 'chrome-remote-interface';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const OUT = 'e2e-out';
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
const errors = [];
const step = async (name, fn) => {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail: detail ?? '' });
    console.log(`PASS  ${name}`, detail ?? '');
  } catch (e) {
    results.push({ name, ok: false, detail: String(e.message ?? e).split('\n')[0] });
    console.log(`FAIL  ${name}: ${String(e.message ?? e).split('\n')[0]}`);
  }
};

const targets = await CDP.List({ port: 9222 });
const pageTarget = targets.find((t) => t.type === 'page') ?? targets[0];
if (!pageTarget) throw new Error('웹뷰 페이지를 찾지 못함: ' + JSON.stringify(targets));
console.log('target:', pageTarget.type, pageTarget.url);
// local: true → 웹뷰가 응답하지 않는 /json/protocol 요청을 건너뛰고 내장 명령 목록을 쓴다
let client;
for (let i = 0; i < 4 && !client; i++) {
  try {
    client = await CDP({ port: 9222, target: pageTarget.webSocketDebuggerUrl, local: true });
  } catch (e) {
    console.log(`연결 재시도 ${i + 1}: ${e.message}`);
    await sleep(2500);
  }
}
if (!client) throw new Error('웹뷰 연결 실패');
const { Runtime, Page } = client;
await Runtime.enable();
await Page.enable();
Runtime.exceptionThrown((e) => errors.push(`pageerror: ${e.exceptionDetails?.exception?.description ?? e.exceptionDetails?.text}`));
const show = (a) => {
  if (a.value !== undefined) return String(a.value);
  const props = a.preview?.properties?.map((p) => `${p.name}=${p.value}`).join(', ');
  return props ? `${a.description ?? ''}{${props}}` : (a.description ?? a.type);
};
// 점검 도구가 공유 창을 뒤로 가기로 닫으면 안드로이드가 'Share canceled'를 오류로 기록한다 — 앱 문제가 아님
const IGNORED = /Share canceled/;
Runtime.consoleAPICalled((e) => e.type === 'error' && !IGNORED.test(e.args.map(show).join(' ')) && errors.push(`console.error: ${e.args.map(show).join(' ').slice(0, 400)}`));

const ev = async (expression) => {
  const r = await Runtime.evaluate({ expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text);
  return r.result.value;
};
const waitFor = async (expr, timeout = 8000, what = expr) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    if (await ev(expr).catch(() => false)) return true;
    await sleep(300);
  }
  throw new Error(`시간 초과: ${what}`);
};
const hasText = (t) => `document.body.innerText.includes(${JSON.stringify(t)})`;
const click = (selector, re) =>
  ev(`(() => {
    const re = new RegExp(${JSON.stringify(re)});
    const el = [...document.querySelectorAll(${JSON.stringify(selector)})].find((e) => re.test((e.getAttribute('aria-label') || '') + ' ' + e.textContent));
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.click();
    return true;
  })()`).then((ok) => {
    if (!ok) throw new Error(`요소 없음: ${selector} /${re}/`);
  });
const setInput = (selector, value) =>
  ev(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, ${JSON.stringify(String(value))});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`).then((ok) => {
    if (!ok) throw new Error(`입력칸 없음: ${selector}`);
  });
const shot = async (n) => {
  try {
    const { data } = await Page.captureScreenshot({ format: 'png' });
    fs.writeFileSync(`${OUT}/${n}.png`, Buffer.from(data, 'base64'));
  } catch (e) {
    console.log('shot failed', n, e.message);
  }
};
const closeDialogs = async () => {
  for (let i = 0; i < 6; i++) {
    if (!(await ev(`!!document.querySelector('[role=dialog]')`))) return;
    await sleep(2400);
    await ev(`(() => { const b = [...document.querySelectorAll('[role=dialog] button')].pop(); b && b.click(); })()`);
    await sleep(500);
  }
};

await step('앱 안에서 실행 중 (Capacitor 네이티브)', async () => {
  await waitFor(`!!document.querySelector('#root *')`, 12000, '앱 화면 렌더링');
  const native = await ev(`window.Capacitor?.isNativePlatform?.()`);
  if (!native) throw new Error('Capacitor 네이티브 환경이 아님');
  return await ev(`location.href + ' · ' + innerWidth + 'x' + innerHeight`);
});
await sleep(1500);
await shot('10-first-screen');

await step('첫 설정 화면과 백업 불러오기 버튼', async () => {
  await waitFor(`!!document.querySelector('input[type=number]')`, 8000, '연봉 입력칸');
  await waitFor(hasText('백업 불러오기'), 3000, '백업 불러오기 버튼');
});

await step('연봉 입력 후 출근 시작', async () => {
  await setInput('input[type=number]', '42000000');
  await sleep(500);
  await click('button', '출근 시작하기');
  await sleep(2500);
  await closeDialogs();
  // 쉬는 날(공휴일)에 돌리면 '오늘 번 돈' 대신 쉬는 날 화면이 나온다
  await waitFor(`!!document.querySelector('nav.tabbar')`, 8000, '홈 화면');
});
await sleep(3500);
await shot('20-home');

await step('햄스터가 화면에 그려짐', async () => {
  const n = await ev(`document.querySelectorAll('.habitat svg').length`);
  if (n < 3) throw new Error(`서식지 svg가 ${n}개뿐`);
  return `svg ${n}개`;
});

await step('글꼴(Jua) 적용', async () => {
  const f = await ev(`getComputedStyle(document.querySelector('.hero-money-value') || document.querySelector('nav.tabbar')).fontFamily`);
  const ok = await ev(`document.fonts.check('16px Jua')`);
  return `${f.slice(0, 30)} · 로드 ${ok}`;
});

for (const [name, id] of [['사무실', 'office'], ['도감', 'dex'], ['기록', 'rec'], ['꾸미기', 'cust']]) {
  await step(`탭 이동: ${name}`, async () => {
    await click('nav.tabbar button', name);
    await sleep(1000);
    await shot(`3-${id}`);
  });
}

await step('설정 화면 열기와 백업 카드', async () => {
  await click('nav.tabbar button', '오늘');
  await sleep(700);
  await click('button', '^\\s*설정');
  await sleep(900);
  await waitFor(hasText('백업 저장'), 4000, '백업 저장 버튼');
  await ev(`document.querySelector('.backup-card')?.scrollIntoView({ block: 'center' })`);
  await sleep(400);
  await shot('40-settings-backup');
});

await step('백업 저장 (공유 창이 뜨고 오류 문구가 없음)', async () => {
  await click('.backup-card button', '백업 저장');
  await sleep(3500);
  try {
    fs.writeFileSync(`${OUT}/41-share-sheet.png`, execSync('adb exec-out screencap -p', { maxBuffer: 1e8 }));
  } catch {}
  try {
    execSync('adb shell input keyevent 4');
  } catch {}
  await sleep(900);
  if (await ev(hasText('저장하지 못했어요'))) throw new Error('백업 저장 오류 문구가 표시됨');
});

await step('새로고침해도 기록이 남음', async () => {
  await Page.reload();
  await sleep(3500);
  await waitFor(`!!document.querySelector('#root *')`, 10000, '다시 렌더링');
  const onboarding = await ev(`!!document.querySelector('input[type=number]')`);
  const home = await ev(`!!document.querySelector('nav.tabbar')`);
  if (!home || onboarding) throw new Error('기록이 사라져 첫 화면으로 돌아감');
});

// ---------- 홈 화면 위젯 ----------
await step('위젯에 상태 넘기기', async () => {
  await waitFor(`!!window.__widgetDebug`, 8000, '위젯 연결');
  await ev(`window.__widgetDebug.sync()`);
  return 'ok';
});

const widgetShots = [];
await step('위젯 미리보기 (상태별)', async () => {
  // 앞으로 2주 중 첫 근무일과 첫 쉬는 날을 골라 시각별로 그려 본다
  const plan = await ev(`(() => {
    const tl = JSON.parse(window.__widgetDebug.timeline(Date.now()));
    const work = tl.find((e) => e.label === '퇴근까지' && e.img === 'type');
    const off = tl.find((e) => e.theme === 'off');
    const day = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
    const H = 3600e3;
    const base = work ? day(work.at) : day(Date.now());
    const out = [
      ['before', base + 7 * H],
      ['morning', base + 9 * H + 10 * 60e3],
      ['work', base + 10 * H + 47 * 60e3],
      ['lunch', base + 12 * H + 30 * 60e3],
      ['almost', base + 17 * H + 45 * 60e3],
      ['done', base + 19 * H + 5 * 60e3],
    ].map(([k, t]) => ({ k, t, ot: 0 }));
    for (const [k, m] of [['overtime1', 20], ['overtime3', 75], ['overtime4', 143]]) out.push({ k, t: base + 18 * H + m * 60e3, ot: base + 18 * H });
    if (off) out.push({ k: 'off', t: off.at + 11 * H, ot: 0 });
    return out;
  })()`);
  for (const p of plan) {
    for (const size of ['wide', 'small']) {
      const png = await ev(`(async () => {
        const tl = window.__widgetDebug.timeline(${p.t}, ${p.ot || 0} || undefined);
        const r = await window.__widgetDebug.preview({ size: '${size}', now: ${p.t}, timeline: tl });
        return r.png;
      })()`);
      const name = `widget-${p.k}-${size}`;
      fs.writeFileSync(`${OUT}/${name}.png`, Buffer.from(png, 'base64'));
      widgetShots.push({ name, k: p.k, size, png });
    }
  }
  return `${widgetShots.length}장`;
});

await step('위젯 미리보기 모음 한 장으로', async () => {
  // 브라우저(웹뷰) 캔버스로 배경 위에 위젯들을 배치해 한 장으로 만든다
  const data = JSON.stringify(widgetShots.map(({ k, size, png }) => ({ k, size, png })));
  const out = await ev(`(async () => {
    const shots = ${data};
    const LABEL = { before: '출근 전', morning: '출근 직후', work: '근무 중', lunch: '점심시간', almost: '퇴근 30분 전', done: '퇴근 완료', overtime1: '야근 20분', overtime3: '야근 1시간 15분', overtime4: '야근 2시간 23분', off: '쉬는 날' };
    const load = (b) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b; });
    const keys = [...new Set(shots.map((s) => s.k))];
    const imgs = {};
    for (const s of shots) imgs[s.k + s.size] = await load(s.png);
    const w0 = imgs[keys[0] + 'wide'], s0 = imgs[keys[0] + 'small'];
    const pad = 40, rowH = Math.max(w0.height, s0.height) + 90;
    const W = pad * 3 + w0.width + s0.width, H = pad + keys.length * rowH;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    const grad = g.createLinearGradient(0, 0, W, H); grad.addColorStop(0, '#c9b8e8'); grad.addColorStop(1, '#9fc8e0');
    g.fillStyle = grad; g.fillRect(0, 0, W, H);
    keys.forEach((k, i) => {
      const y = pad + i * rowH;
      g.fillStyle = '#ffffff'; g.font = 'bold 34px sans-serif'; g.fillText(LABEL[k] || k, pad, y + 36);
      g.drawImage(imgs[k + 'wide'], pad, y + 60);
      g.drawImage(imgs[k + 'small'], pad * 2 + w0.width, y + 60);
    });
    return c.toDataURL('image/png').split(',')[1];
  })()`);
  fs.writeFileSync(`${OUT}/widget-sheet.png`, Buffer.from(out, 'base64'));
});

await step('홈 화면에 위젯 놓기 (런처가 허용하면)', async () => {
  const r = await ev(`window.__widgetDebug.pin({ size: 'wide' })`);
  if (!r?.ok) return '런처가 위젯 추가 요청을 지원하지 않음 (건너뜀)';
  await sleep(2500);
  try {
    fs.writeFileSync(`${OUT}/widget-pin-dialog.png`, execSync('adb exec-out screencap -p', { maxBuffer: 1e8 }));
    const xml = execSync('adb exec-out uiautomator dump /dev/tty', { maxBuffer: 1e8 }).toString();
    const m = [...xml.matchAll(/<node[^>]*text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g)].find((x) => /^(추가|자동으로 추가|홈 화면에 추가|Add|Add automatically|Add to home screen)$/i.test(x[1]));
    if (!m) {
      execSync('adb shell input keyevent 4');
      return '추가 버튼을 찾지 못함';
    }
    const x = (Number(m[2]) + Number(m[4])) >> 1, y = (Number(m[3]) + Number(m[5])) >> 1;
    execSync(`adb shell input tap ${x} ${y}`);
    await sleep(2000);
    execSync('adb shell input keyevent 3');
    await sleep(3000);
    fs.writeFileSync(`${OUT}/widget-home-screen.png`, execSync('adb exec-out screencap -p', { maxBuffer: 1e8 }));
    execSync('adb shell am start -n io.github.baebae6ae.hamsterworklog/.MainActivity');
    await sleep(3000);
    return `"${m[1]}" 눌러 추가`;
  } catch (e) {
    return '위젯 추가 시도 중 오류: ' + String(e.message || e).slice(0, 80);
  }
});

await step('웹 오류 없음', async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
});

fs.writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, errors }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
await client.close();
console.log('\n' + JSON.stringify({ results, errors }, null, 1));
process.exit(failed.length ? 1 : 0);
