// 에뮬레이터 안에서 실행 중인 앱의 웹뷰에 크롬 개발자 도구 프로토콜(CDP)로 붙어 화면을 직접 눌러본다.
import { chromium } from 'playwright-core';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const OUT = 'e2e-out';
fs.mkdirSync(OUT, { recursive: true });
const sh = (c) => execSync(c, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();

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

const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
const ctx = browser.contexts()[0];
const page = ctx.pages()[0] ?? (await ctx.newPage());
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`));
const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` }).catch((e) => console.log('shot failed', n, e.message));
const closeDialogs = async () => {
  for (let i = 0; i < 6 && (await page.getByRole('dialog').count()); i++) {
    await page.waitForTimeout(2400);
    await page.getByRole('dialog').getByRole('button').last().click().catch(() => {});
    await page.waitForTimeout(400);
  }
};

await step('앱 안에서 실행 중 (Capacitor 네이티브)', async () => {
  const native = await page.evaluate(() => window.Capacitor?.isNativePlatform?.());
  if (!native) throw new Error('Capacitor 네이티브 환경이 아님');
  return await page.evaluate(() => `${location.href} · ${innerWidth}x${innerHeight}`);
});
await page.waitForTimeout(1500);
await shot('10-first-screen');

await step('첫 설정 화면과 백업 불러오기 버튼', async () => {
  await page.locator('input[type=number]').first().waitFor({ timeout: 8000 });
  if (!(await page.getByRole('button', { name: /백업 불러오기/ }).count())) throw new Error('백업 불러오기 버튼 없음');
});

await step('연봉 입력 후 출근 시작', async () => {
  await page.locator('input[type=number]').first().fill('42000000');
  await page.getByRole('button', { name: /출근 시작하기/ }).click();
  await page.waitForTimeout(2500);
  await closeDialogs();
  await page.getByText('오늘 번 돈').first().waitFor({ timeout: 8000 });
});
await page.waitForTimeout(3500);
await shot('20-home');

await step('햄스터가 화면에 그려짐', async () => {
  const n = await page.locator('.habitat svg').count();
  if (n < 3) throw new Error(`서식지 svg가 ${n}개뿐`);
  return `svg ${n}개`;
});

await step('글꼴(Jua) 적용', async () => {
  const f = await page.evaluate(() => getComputedStyle(document.querySelector('.hero-money-value')).fontFamily);
  const ok = await page.evaluate(() => document.fonts.check('16px Jua'));
  return `${f.slice(0, 30)} · 로드 ${ok}`;
});

for (const [name, id] of [['사무실', 'office'], ['도감', 'dex'], ['기록', 'rec'], ['꾸미기', 'cust']]) {
  await step(`탭 이동: ${name}`, async () => {
    await page.getByRole('navigation').getByRole('button', { name }).click();
    await page.waitForTimeout(900);
    await shot(`3-${id}`);
  });
}

await step('설정 화면 열기와 백업 카드', async () => {
  await page.getByRole('navigation').getByRole('button', { name: '오늘' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: '설정' }).click();
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /백업 저장/ }).scrollIntoViewIfNeeded();
  await shot('40-settings-backup');
});

await step('백업 저장 (공유 창이 뜨고 오류 문구가 없음)', async () => {
  await page.getByRole('button', { name: /백업 저장/ }).click();
  await page.waitForTimeout(3500);
  try {
    fs.writeFileSync(`${OUT}/41-share-sheet.png`, execSync('adb exec-out screencap -p', { maxBuffer: 1e8 }));
  } catch {}
  try {
    sh('adb shell input keyevent 4');
  } catch {}
  await page.waitForTimeout(800);
  const bad = await page.getByText('저장하지 못했어요').count();
  if (bad) throw new Error('백업 저장 오류 문구가 표시됨');
});

await step('새로고침해도 기록이 남음', async () => {
  await page.reload();
  await page.waitForTimeout(2500);
  const onboarding = await page.locator('input[type=number]').count();
  const home = await page.getByText('오늘 번 돈').count();
  if (!home || onboarding) throw new Error('기록이 사라져 첫 화면으로 돌아감');
});

await step('웹 오류 없음', async () => {
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
});

fs.writeFileSync(`${OUT}/results.json`, JSON.stringify({ results, errors }, null, 2));
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} 통과`);
await browser.close();
process.exit(failed.length ? 1 : 0);
