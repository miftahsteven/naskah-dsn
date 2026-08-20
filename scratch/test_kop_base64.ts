import fs from 'fs';
import path from 'path';
import { getKopSuratBase64, getBismillahBase64, getLogoDsnBase64, getWqaUkasBase64 } from '../src/modules/documents/documents.router.js';

async function test() {
  console.log('Testing image Base64 loading...');
  const kop = getKopSuratBase64();
  const bismillah = getBismillahBase64();
  const logo = getLogoDsnBase64();
  const wqa = getWqaUkasBase64();

  console.log('Kop starts with:', kop.slice(0, 30), 'length:', kop.length);
  console.log('Bismillah starts with:', bismillah.slice(0, 30), 'length:', bismillah.length);
  console.log('Logo starts with:', logo.slice(0, 30), 'length:', logo.length);
  console.log('WQA starts with:', wqa.slice(0, 30), 'length:', wqa.length);

  // Test HTML with /images/kop-surat.png and ${HEADER_HTML}
  let sampleHtml = `
    <!DOCTYPE html>
    <html>
    <head><title>Test Letter</title></head>
    <body>
      <div style="text-align: center;">
        <img src="/images/kop-surat.png" alt="Kop Surat DSN-MUI" />
      </div>
      <div style="text-align: center;">
        <img src="/images/bismillah.svg" alt="Bismillah" />
      </div>
      <p>Isi surat...</p>
    </body>
    </html>
  `;

  let processed = sampleHtml
    .replace(/src=["'][^"']*kop-surat\.png["']/gi, `src="${kop}" class="kop-surat-img"`)
    .replace(/src=["'][^"']*bismillah\.svg["']/gi, `src="${bismillah}"`);

  console.log('\nProcessed HTML contains data:image/png;base64 for kop-surat:', processed.includes('src="data:image/png;base64'));
  console.log('Processed HTML contains data:image/svg+xml;base64 for bismillah:', processed.includes('src="data:image/svg+xml;base64'));
}

test();
