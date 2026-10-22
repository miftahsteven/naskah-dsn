import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const screenshotsDir = '/Users/miftahsyarief/MyLab/amanah/manual-assets';

async function run() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // Login first
  await page.goto('http://localhost:3000/office/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'miftahsteven@gmail.com');
  await page.type('input[type="password"]', 'B47054ii!');
  await page.click('button[type="submit"]');

  await page.waitForSelector('input[placeholder="000000"]', { timeout: 10000 });
  await page.type('input[placeholder="000000"]', '847054');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));

  const extraPages = [
    { url: 'http://localhost:3000/office/surat-masuk/25105d36-bf55-4a46-8fa1-d332d5f1b29a', name: '11_surat_masuk_detail.png' },
    { url: 'http://localhost:3000/office/surat-keluar/3a0a4a79-ea64-42e3-a28b-73e1aa04ef4c', name: '12_surat_keluar_approval_workflow.png' },
    { url: 'http://localhost:3000/office/surat-keluar/ef82175c-b192-48de-b2a9-ed167a445554', name: '13_surat_keluar_signed_doc.png' },
    { url: 'http://localhost:3000/office/verify/document/ef82175c-b192-48de-b2a9-ed167a445554', name: '14_verifikasi_tte_publik.png' }
  ];

  for (const item of extraPages) {
    try {
      console.log(`Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'networkidle2', timeout: 20000 });
      await new Promise(r => setTimeout(r, 2500));
      await page.screenshot({ path: path.join(screenshotsDir, item.name) });
      console.log(`Captured ${item.name}`);
    } catch (err) {
      console.error(`Failed ${item.url}:`, err);
    }
  }

  await browser.close();
  console.log('Extra screenshots captured successfully!');
}

run().catch(console.error);
