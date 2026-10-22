import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const screenshotsDir = '/Users/miftahsyarief/MyLab/amanah/manual-assets';

async function run() {
  console.log('Launching Puppeteer for detailed manual captures...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1.5 });

  // 1. Login
  console.log('Logging in...');
  await page.goto('http://localhost:3000/office/login', { waitUntil: 'networkidle2' });
  await page.type('input[type="email"]', 'miftahsteven@gmail.com');
  await page.type('input[type="password"]', 'B47054ii!');
  await page.click('button[type="submit"]');

  await page.waitForSelector('input[placeholder="000000"]', { timeout: 10000 });
  await page.type('input[placeholder="000000"]', '847054');
  await page.click('button[type="submit"]');

  await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 2000));
  console.log('Logged in successfully!');

  // 2. Capture Surat Keluar New with Template "Undangan Rapat Kesekretarisan"
  try {
    console.log('Navigating to Surat Keluar New...');
    await page.goto('http://localhost:3000/office/surat-keluar/new', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Click "Buat dari Template"
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Buat dari Template')) {
        await b.click();
        break;
      }
    }
    await new Promise(r => setTimeout(r, 1500));

    // Look for template select dropdown or click "Undangan Rapat Kesekretarisan"
    // In template mode, let's find the select dropdown for templates
    const selects = await page.$$('select');
    for (const s of selects) {
      const options = await page.evaluate(el => Array.from(el.options).map(o => ({ value: o.value, text: o.text })), s);
      const kesekretarisanOpt = options.find(o => o.text.includes('Kesekretarisan') || o.value.includes('KESEKRETARISAN'));
      if (kesekretarisanOpt) {
        await page.select('select', kesekretarisanOpt.value);
        console.log('Selected template:', kesekretarisanOpt.text);
        break;
      }
    }
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, 'screenshot_undangan_kesekretarisan.png') });
    console.log('Captured screenshot_undangan_kesekretarisan.png');
  } catch (err) {
    console.error('Error selecting Undangan Kesekretarisan template:', err);
  }

  // 3. Capture Send Email Modal on Surat Keluar
  try {
    console.log('Navigating to Surat Keluar list to open Send Invitation Modal...');
    await page.goto('http://localhost:3000/office/surat-keluar', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Look for the "Kirim Undangan Resmi" button (title="Kirim Undangan Resmi" or SVG Send)
    const sendBtn = await page.$('button[title="Kirim Undangan Resmi"]');
    if (sendBtn) {
      await sendBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(screenshotsDir, 'screenshot_kirim_email_surat_keluar.png') });
      console.log('Captured screenshot_kirim_email_surat_keluar.png');
    } else {
      console.log('Kirim Undangan button not found directly, checking row buttons...');
    }
  } catch (err) {
    console.error('Error capturing Send Email modal:', err);
  }

  // 4. Capture Surat Masuk Detail with Workflow Modals:
  // Detail URL: http://localhost:3000/office/surat-masuk/25105d36-bf55-4a46-8fa1-d332d5f1b29a
  try {
    console.log('Navigating to Surat Masuk detail...');
    await page.goto('http://localhost:3000/office/surat-masuk/25105d36-bf55-4a46-8fa1-d332d5f1b29a', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // 4a. Capture main detail page
    await page.screenshot({ path: path.join(screenshotsDir, 'screenshot_surat_masuk_detail_full.png') });
    console.log('Captured screenshot_surat_masuk_detail_full.png');

    // 4b. Click "Undang Instansi" button
    const buttons = await page.$$('button');
    let inviteBtn = null;
    let interviewBtn = null;

    for (const b of buttons) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && text.includes('Undang Instansi')) inviteBtn = b;
      if (text && text.includes('Interview DPS')) interviewBtn = b;
    }

    if (inviteBtn) {
      console.log('Clicking Undang Instansi button...');
      await inviteBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(screenshotsDir, 'screenshot_surat_masuk_flow_presentasi.png') });
      console.log('Captured screenshot_surat_masuk_flow_presentasi.png');

      // Close modal (look for X button or cancel)
      const closeBtn = await page.$('button[aria-label="Close"]') || await page.$('.modal-close') || await page.$('button svg.lucide-x');
      if (closeBtn) {
        await closeBtn.click().catch(() => {});
      } else {
        await page.keyboard.press('Escape');
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    // 4c. Click "Interview DPS" button
    if (interviewBtn) {
      console.log('Clicking Interview DPS button...');
      await interviewBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: path.join(screenshotsDir, 'screenshot_surat_masuk_flow_interview_dps.png') });
      console.log('Captured screenshot_surat_masuk_flow_interview_dps.png');
      await page.keyboard.press('Escape');
      await new Promise(r => setTimeout(r, 1000));
    }

    // 4d. Click Evidence Tab if exists
    console.log('Looking for Evidence tab...');
    for (const b of await page.$$('button')) {
      const text = await page.evaluate(el => el.textContent, b);
      if (text && (text.includes('Kelengkapan') || text.includes('Evidence') || text.includes('Dokumen Pendukung'))) {
        await b.click();
        await new Promise(r => setTimeout(r, 1500));
        await page.screenshot({ path: path.join(screenshotsDir, 'screenshot_surat_masuk_evidence_validasi.png') });
        console.log('Captured screenshot_surat_masuk_evidence_validasi.png');
        break;
      }
    }

  } catch (err) {
    console.error('Error capturing Surat Masuk detail flow:', err);
  }

  await browser.close();
  console.log('All detailed workflow screenshots captured successfully!');
}

run().catch(console.error);
