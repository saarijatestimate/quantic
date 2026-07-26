import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle' });
  console.log('Opened browser to http://127.0.0.1:5173');
  await page.screenshot({ path: 'tests/browser-open.png', fullPage: true });
  console.log('Saved screenshot to tests/browser-open.png');
  await browser.close();
}

main().catch((error) => {
  console.error('Playwright test failed:', error);
  process.exit(1);
});
