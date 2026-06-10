const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:3000';
const OUT_DIR = path.join(__dirname, '..', '.github', 'screenshots');
const EMAIL = 'pedro@email.com';
const PASSWORD = '1234';

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  // Login
  console.log('Fazendo login...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.href.includes('/login'), { timeout: 10000 });
  console.log('Login OK. URL:', page.url());

  const shots = [
    { name: 'dashboard',      path: '/dashboard',      waitFor: 'networkidle' },
    { name: 'pilots',         path: '/pilots',         waitFor: 'networkidle' },
    { name: 'status',         path: '/status',         waitFor: 'networkidle' },
    { name: 'certifications', path: '/certifications', waitFor: 'networkidle' },
    { name: 'admin',          path: '/admin',          waitFor: 'networkidle' },
  ];

  for (const shot of shots) {
    console.log(`Capturando ${shot.name}...`);
    await page.goto(`${BASE_URL}${shot.path}`);
    await page.waitForLoadState(shot.waitFor);
    await page.waitForTimeout(800);
    const file = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: file, fullPage: false });
    console.log(`  -> ${file}`);
  }

  await browser.close();
  console.log('Pronto!');
}

run().catch(err => { console.error(err); process.exit(1); });
