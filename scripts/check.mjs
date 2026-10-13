import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHECK_URL = process.env.CHECK_URL || 'http://localhost:5173';
const SCREENSHOT_PATH = process.env.CHECK_SCREENSHOT || 'screenshots/check.png';
// Optional keys to hold before the screenshot, e.g. CHECK_HOLD=w,a CHECK_HOLD_MS=4000
const HOLD_KEYS = (process.env.CHECK_HOLD || '').split(',').filter(Boolean);
const HOLD_MS = Number(process.env.CHECK_HOLD_MS || 4000);

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const errors = [];
const logs = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
  if (message.type() === 'log') logs.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(CHECK_URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  for (const key of HOLD_KEYS) await page.keyboard.down(key);
  if (HOLD_KEYS.length) await page.waitForTimeout(HOLD_MS);
  for (const key of HOLD_KEYS) await page.keyboard.up(key);
  await page.waitForTimeout(1500);
} catch (error) {
  errors.push(`check: ${error.message}`);
}

mkdirSync('screenshots', { recursive: true });
await page.screenshot({ path: SCREENSHOT_PATH });
await browser.close();

console.log(`Screenshot: ${SCREENSHOT_PATH}`);
if (logs.length) {
  console.log(`Console logs (${logs.length}):`);
  logs.forEach((log) => console.log(`  - ${log}`));
}
if (errors.length) {
  console.log(`Console errors (${errors.length}):`);
  errors.forEach((error) => console.log(`  - ${error}`));
  process.exit(1);
}
console.log('Console errors: none');
