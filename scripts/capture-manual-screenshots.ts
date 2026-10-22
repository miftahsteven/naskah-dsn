import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const screenshotsDir = '/Users/miftahsyarief/MyLab/amanah/manual-assets';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function run() {
  console.log('Launching Puppeteer browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  console.log('Navigating to http://localhost:3000/office/login ...');
  await page.goto('http://localhost:3000/office/login', { waitUntil: 'networkidle2', timeout: 20000 });
  await new Promise(r => setTimeout(r, 1500));

  // 1. Capture Login Form
  await page.screenshot({ path: path.join(screenshotsDir, '01_login_credentials.png') });
  console.log('Captured 01_login_credentials.png');

  // Fill in credentials
  console.log('Filling in login credentials...');
  await page.type('input[type="email"]', 'miftahsteven@gmail.com', { delay: 30 });
  await page.type('input[type="password"]', 'B47054ii!', { delay: 30 });
  
  // Submit login
  await page.click('button[type="submit"]');
  console.log('Submitted credentials, waiting for 2FA screen...');

  // Wait for 2FA input
  await page.waitForSelector('input[placeholder="000000"]', { timeout: 10000 });
  await new Promise(r => setTimeout(r, 1000));

  // 2. Capture 2FA Screen
  await page.screenshot({ path: path.join(screenshotsDir, '02_login_2fa.png') });
  console.log('Captured 02_login_2fa.png');

  // Fill OTP
  console.log('Filling 2FA OTP 847054...');
  await page.type('input[placeholder="000000"]', '847054', { delay: 50 });
  await page.click('button[type="submit"]');

  // Wait for dashboard to load
  console.log('Submitted 2FA, waiting for dashboard navigation...');
  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 3000));

  // 3. Capture Dashboard
  await page.screenshot({ path: path.join(screenshotsDir, '03_dashboard.png') });
  console.log('Captured 03_dashboard.png');

  // List of other internal correspondence pages
  const routes = [
    { url: 'http://localhost:3000/office/surat-masuk', name: '04_surat_masuk.png' },
    { url: 'http://localhost:3000/office/surat-masuk/new', name: '05_surat_masuk_catat.png' },
    { url: 'http://localhost:3000/office/surat-keluar', name: '06_surat_keluar.png' },
    { url: 'http://localhost:3000/office/surat-keluar/new', name: '07_surat_keluar_baru.png' },
    { url: 'http://localhost:3000/office/disposisi', name: '08_disposisi.png' },
    { url: 'http://localhost:3000/office/arsip-surat', name: '09_arsip_surat.png' },
    { url: 'http://localhost:3000/office/template-surat', name: '10_katalog_template.png' },
  ];

  for (const item of routes) {
    try {
      console.log(`Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: path.join(screenshotsDir, item.name) });
      console.log(`Captured ${item.name}`);
    } catch (err) {
      console.error(`Failed to capture ${item.url}:`, err);
    }
  }

  // Also capture Template Mode in Surat Keluar New if possible
  try {
    console.log('Navigating to Surat Keluar New to toggle Template Mode...');
    await page.goto('http://localhost:3000/office/surat-keluar/new', { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 1500));
    // Look for template mode toggle button or tabs
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Template')) {
        await b.click();
        await new Promise(r => setTimeout(r, 1500));
        break;
      }
    }
    await page.screenshot({ path: path.join(screenshotsDir, '07b_surat_keluar_template_editor.png') });
    console.log('Captured 07b_surat_keluar_template_editor.png');
  } catch (err) {
    console.error('Failed to capture template editor mode:', err);
  }

  await browser.close();
  console.log('Puppeteer capture finished successfully!');
}

run().catch(console.error);
