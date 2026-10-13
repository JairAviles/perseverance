import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright-core';

const CHECK_URL = process.env.CHECK_URL || 'http://localhost:5173';
const SCREENSHOT_PATH = 'screenshots/check.png';

const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
  args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });

const errors = [];
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});
page.on('pageerror', (error) => errors.push(error.message));

try {
  await page.goto(CHECK_URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 15000 });
  await page.waitForTimeout(1500);
} catch (error) {
  errors.push(`check: ${error.message}`);
}

mkdirSync('screenshots', { recursive: true });
await page.screenshot({ path: SCREENSHOT_PATH });
await browser.close();

console.log(`Screenshot: ${SCREENSHOT_PATH}`);
if (errors.length) {
  console.log(`Console errors (${errors.length}):`);
  errors.forEach((error) => console.log(`  - ${error}`));
  process.exit(1);
}
console.log('Console errors: none');
