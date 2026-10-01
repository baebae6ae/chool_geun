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
  await waitFor(hasText('오늘 번 돈'), 8000, '오늘 번 돈');
});
await sleep(3500);
await shot('20-home');

await step('햄스터가 화면에 그려짐', async () => {
  const n = await ev(`document.querySelectorAll('.habitat svg').length`);
  if (n < 3) throw new Error(`서식지 svg가 ${n}개뿐`);
  return `svg ${n}개`;
});

await step('글꼴(Jua) 적용', async () => {
  const f = await ev(`getComputedStyle(document.querySelector('.hero-money-value')).fontFamily`);
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
  const home = await ev(hasText('오늘 번 돈'));
  if (!home || onboarding) throw new Error('기록이 사라져 첫 화면으로 돌아감');
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
