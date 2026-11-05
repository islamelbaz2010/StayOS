// MAKAZOH coming-soon browser QA — reproducible, self-contained.
//
// Usage (from repo root):
//   cd apps/web && node scripts/coming-soon-qa.mjs
//
// Env:
//   QA_OUT=<dir>   screenshot output dir (default <repo>/.qa-screenshots/coming-soon-qa)
//   QA_PORT=<port> static server port    (default 8899)
//
// Requirements: `npm ci` inside apps/web (Playwright is a devDependency) and a
// browser — either system Chrome (`channel: "chrome"` is tried first) or the
// Playwright-managed chromium (`npx playwright install chromium`).
//
// The public lead API is stubbed at the network layer — this is a UI-level
// check only. Real API integration is verified separately (live runbook in
// docs/handoff/HOSTINGER_RUNBOOK.md).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(fileURLToPath(new URL('.', import.meta.url)), '..', '..', '..');
const SITE_DIR = join(REPO, 'infra', 'coming-soon');
const OUT = process.env.QA_OUT || join(REPO, '.qa-screenshots', 'coming-soon-qa');
const PORT = Number(process.env.QA_PORT || 8899);
const BASE = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });

const MIME = { '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  const pathname = req.url.split('?')[0];
  const path = pathname === '/' ? '/index.html' : pathname;
  const file = resolve(SITE_DIR, `.${path}`);
  if (!file.startsWith(resolve(SITE_DIR) + sep)) {
    res.writeHead(403); res.end(); return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404); res.end();
  }
});
await new Promise((r) => server.listen(PORT, r));

const results = [];
const record = (name, pass, detail = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

function stubApi(page, captured, opts = {}) {
  return page.route('**/api/v1/public/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const body = req.postData() ? JSON.parse(req.postData()) : null;
    captured.push({ url, body });
    if (url.includes('/leads/')) {
      await route.fulfill({
        status: opts.leadStatus ?? 201,
        contentType: 'application/json',
        body: JSON.stringify(opts.leadBody ?? { id: 'qa-lead-1', status: 'NEW', created: true }),
      });
    } else {
      await route.fulfill({ status: 202, contentType: 'application/json', body: '{"id":"e1"}' });
    }
  });
}

async function load(page, query = '') {
  const consoleErrors = [];
  const failedReqs = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (r) => failedReqs.push(`${r.url()} :: ${r.failure()?.errorText}`));
  page.on('response', (r) => { if (r.status() >= 400) failedReqs.push(`${r.url()} :: HTTP ${r.status()}`); });
  await page.goto(`${BASE}/${query}`, { waitUntil: 'networkidle' });
  return { consoleErrors, failedReqs };
}

const fontCheck = (page) => page.evaluate(() => ({
  dmSans: document.fonts.check('700 20px "DM Sans"'),
  cairo: document.fonts.check('700 20px "Cairo"'),
}));
const overflow = (page) => page.evaluate(() => ({
  scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth,
}));
const imgsOk = (page) => page.evaluate(() =>
  [...document.images].filter((i) => !(i.complete && i.naturalWidth > 0)).map((i) => i.src));

let browser;
try {
  browser = await chromium.launch({ channel: 'chrome' });
} catch {
  browser = await chromium.launch(); // fall back to playwright-managed chromium
}

const viewports = [
  ['desktop-1440', { width: 1440, height: 900 }],
  ['laptop-1280', { width: 1280, height: 800 }],
  ['tablet-768', { width: 768, height: 1024 }],
  ['mobile-390', { width: 390, height: 844 }],
  ['mobile-360', { width: 360, height: 800 }],
];

for (const [name, vp] of viewports) {
  const page = await browser.newPage({ viewport: vp });
  const captured = [];
  await stubApi(page, captured);
  const { consoleErrors, failedReqs } = await load(page);
  record(`${name} loads clean`, consoleErrors.length === 0 && failedReqs.length === 0,
    [...consoleErrors, ...failedReqs].join(' | ') || 'clean');
  const f = await fontCheck(page);
  record(`${name} DM Sans loaded`, f.dmSans === true, `check=${f.dmSans}`);
  const ov = await overflow(page);
  record(`${name} no horizontal overflow`, ov.scrollW <= ov.innerW, `${ov.scrollW}px`);
  const bad = await imgsOk(page);
  record(`${name} images render`, bad.length === 0, bad.join(',') || 'ok');
  record(`${name} page_view tracked`, captured.some((c) => c.body?.event === 'page_view'));
  await page.close();
}

// Desktop EN functional pass
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const captured = [];
  await stubApi(page, captured);
  await load(page);
  await page.screenshot({ path: `${OUT}/01-desktop-en-hero.png` });
  record('guest waitlist section removed',
    (await page.locator('#waitlist').count()) === 0 &&
    (await page.locator('#guestform').count()) === 0 &&
    (await page.locator('a[href="#waitlist"]').count()) === 0);
  await page.click('a[data-ev="host_cta_click"]');
  await page.waitForTimeout(700);
  record('host CTA scrolls to form',
    await page.evaluate(() => document.querySelector('#host').getBoundingClientRect().top < window.innerHeight));
  await page.screenshot({ path: `${OUT}/02-desktop-en-host-form.png` });
  // empty submit → field-level errors, zero API calls
  await page.click('#hostform button[type=submit]');
  await page.waitForTimeout(300);
  record('empty submit blocked client-side',
    !captured.some((c) => c.url.includes('/leads/')) &&
    (await page.locator('.ferr:visible').count()) >= 3);
  // invalid phone → field error, no request
  await page.fill('#hostform input[name=full_name]', 'QA Host');
  await page.fill('#hostform input[name=phone]', 'abc');
  await page.fill('#hostform input[name=city]', 'Cairo');
  await page.check('#hf-consent');
  await page.click('#hostform button[type=submit]');
  await page.waitForTimeout(300);
  record('invalid phone blocked client-side',
    !captured.some((c) => c.url.includes('/leads/')) &&
    (await page.locator('#ferr-phone:visible').count()) === 1);
  await page.fill('#hostform input[name=phone]', '+20 100 111 2223');
  await page.click('#hostform button[type=submit]');
  await page.waitForTimeout(500);
  const leadBody = captured.find((c) => c.url.includes('/leads/host'))?.body;
  record('host submit succeeds', (await page.locator('#hf-msg').textContent()).includes('registered'));
  record('host payload complete',
    leadBody?.full_name === 'QA Host' && leadBody?.consent === true &&
    leadBody?.property_type === 'apartment' && leadBody?.units_count === 1 && leadBody?.lang === 'en');
  record('funnel events tracked',
    captured.some((c) => c.body?.event === 'host_form_start') &&
    captured.some((c) => c.body?.event === 'host_form_submit') &&
    captured.some((c) => c.body?.event === 'host_form_success') &&
    !captured.some((c) => String(c.body?.event || '').startsWith('guest_')));
  await page.close();
}

// Duplicate registration (created:false) → honest "already registered" success
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await stubApi(page, [], { leadBody: { id: 'dup-1', status: 'NEW', created: false } });
  await load(page);
  await page.fill('#hostform input[name=full_name]', 'QA Host');
  await page.fill('#hostform input[name=phone]', '+201001112223');
  await page.fill('#hostform input[name=city]', 'Cairo');
  await page.check('#hf-consent');
  await page.click('#hostform button[type=submit]');
  await page.waitForTimeout(500);
  record('duplicate treated as already-registered',
    (await page.locator('#hf-msg').textContent()).includes('already registered'));
  await page.close();
}

// Validation error (422) state
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await stubApi(page, [], { leadStatus: 422 });
  await load(page);
  await page.fill('#hostform input[name=full_name]', 'QA Host');
  await page.fill('#hostform input[name=phone]', '+201001112223');
  await page.fill('#hostform input[name=city]', 'Cairo');
  await page.check('#hf-consent');
  await page.click('#hostform button[type=submit]');
  await page.waitForTimeout(500);
  record('422 shows error state',
    (await page.locator('#hf-msg').textContent()).length > 3);
  await page.close();
}

// Rate-limit (429) state
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await stubApi(page, [], { leadStatus: 429 });
  await load(page);
  await page.fill('#hostform input[name=full_name]', 'QA Host');
  await page.fill('#hostform input[name=phone]', '+201001112223');
  await page.fill('#hostform input[name=city]', 'Cairo');
  await page.check('#hf-consent');
  await page.click('#hostform button[type=submit]');
  await page.waitForTimeout(500);
  record('429 shows rate-limit message',
    (await page.locator('#hf-msg').textContent()).includes('Too many attempts'));
  await page.close();
}

// Arabic RTL pass
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const captured = [];
  await stubApi(page, captured);
  await load(page, '?lang=ar');
  const meta = await page.evaluate(() => ({
    dir: document.documentElement.dir, lang: document.documentElement.lang,
  }));
  record('AR dir+lang set', meta.dir === 'rtl' && meta.lang === 'ar', `dir=${meta.dir}`);
  const f = await fontCheck(page);
  record('AR Cairo font loaded', f.cairo === true, `check=${f.cairo}`);
  const ov = await overflow(page);
  record('AR no horizontal overflow', ov.scrollW <= ov.innerW, `${ov.scrollW}px`);
  await page.screenshot({ path: `${OUT}/03-desktop-ar-hero.png` });
  await page.fill('#hostform input[name=full_name]', 'مضيف تجربة');
  await page.fill('#hostform input[name=phone]', '+201001112223');
  await page.fill('#hostform input[name=city]', 'القاهرة');
  await page.check('#hf-consent');
  await page.click('#hostform button[type=submit]');
  await page.waitForTimeout(500);
  const arLead = captured.find((c) => c.url.includes('/leads/host'))?.body;
  record('AR host submit works', (await page.locator('#hf-msg').textContent()).length > 5);
  record('AR payload carries lang=ar', arLead?.lang === 'ar');
  record('AR doc title switched',
    (await page.title()).includes('مكازه'));
  await page.screenshot({ path: `${OUT}/04-desktop-ar-host-form.png` });
  await page.click('#l-en');
  await page.waitForTimeout(400);
  record('AR→EN switch restores LTR',
    (await page.evaluate(() => document.documentElement.dir)) === 'ltr' &&
    captured.some((c) => c.body?.event === 'lang_switch'));
  await page.close();
}

// Mobile EN→AR + remaining shots
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await stubApi(page, []);
  await load(page);
  await page.click('#l-ar');
  await page.waitForTimeout(400);
  const dir = await page.evaluate(() => document.documentElement.dir);
  const ov = await overflow(page);
  record('mobile EN→AR switch + no overflow', dir === 'rtl' && ov.scrollW <= ov.innerW);
  await page.screenshot({ path: `${OUT}/05-mobile-ar.png` });
  await page.click('#l-en');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/06-mobile-en-hero.png` });
  await page.evaluate(() => document.querySelector('.props').scrollIntoView());
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/07-mobile-en-props.png` });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/09-desktop-en-full.png`, fullPage: true });
  await page.goto(`${BASE}/?lang=ar`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUT}/10-desktop-ar-full.png`, fullPage: true });
  await page.close();
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed — shots: ${OUT}`);
process.exit(failed.length ? 1 : 0);
