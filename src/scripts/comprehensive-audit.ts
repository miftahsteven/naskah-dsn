import { prisma } from '../lib/prisma.js';
import { DEFAULT_TEMPLATES, FOOTER_HTML } from '../modules/letter-template/default-templates.js';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve(process.cwd(), 'scratch/original_bismillah.svg');
let fullSvg = fs.readFileSync(svgPath, 'utf8');
fullSvg = fullSvg.replace(/viewBox="[^"]*"/, 'viewBox="-7650 250 15500 2600"');
fullSvg = fullSvg.replace(/width="[^"]*"/, '');
fullSvg = fullSvg.replace(/height="[^"]*"/, '');

// Sync SVG to all static image directories
const targets = [
  path.resolve(process.cwd(), 'public/images/bismillah.svg'),
  path.resolve(process.cwd(), '../frontend/public/images/bismillah.svg'),
  path.resolve(process.cwd(), '../web-public/public/images/bismillah.svg'),
  path.resolve(process.cwd(), '../web-public/dist/images/bismillah.svg'),
  path.resolve(process.cwd(), 'src/assets/bismillah.svg')
];

for (const t of targets) {
  try {
    fs.mkdirSync(path.dirname(t), { recursive: true });
    fs.writeFileSync(t, fullSvg, 'utf8');
    console.log(`Synced SVG to ${t}`);
  } catch (e) {
    console.error(`Error syncing to ${t}:`, e);
  }
}

const bismillahSvgBase64 = `data:image/svg+xml;base64,${Buffer.from(fullSvg).toString('base64')}`;

const STRICT_STYLES = `
    <style id="amanah-kop-styles">
      @page {
        size: A4;
        margin-top: 20mm !important;
        margin-bottom: 12mm !important;
        margin-left: 25mm !important;
        margin-right: 20mm !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 10.5pt !important;
        line-height: 1.35 !important;
        color: #111827 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Master Print Layout Table */
      table.master-page-table {
        width: 100% !important;
        border-collapse: collapse !important;
        border: none !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      table.master-page-table > tbody > tr > td {
        padding: 0 !important;
        border: none !important;
        vertical-align: top !important;
      }
      table.master-page-table > tfoot > tr > td {
        height: 20mm !important;
        padding: 0 !important;
        border: none !important;
      }

      /* Screen presentation: Clean centered A4 preview container with page dividers and footer at bottom */
      @media screen {
        body {
          background-color: #f1f5f9 !important;
          padding: 24px 12px !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .master-page-table {
          max-width: 794px !important;
          width: 100% !important;
          margin: 0 auto !important;
          padding: 32px 42px !important;
          background: #ffffff !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05) !important;
          border-radius: 4px !important;
          box-sizing: border-box !important;
          order: 1 !important;
        }
        .amanah-letter-footer {
          display: table !important;
          order: 2 !important;
          width: 100% !important;
          max-width: 794px !important;
          margin: 16px auto 24px auto !important;
          padding: 0 42px !important;
          box-sizing: border-box !important;
        }
        /* Clear Visual Page Break Divider on Screen Preview */
        div[style*="page-break-before: always"],
        div[style*="page-break-before:always"],
        div[style*="break-before: page"],
        .page-break {
          margin-top: 48px !important;
          margin-bottom: 32px !important;
          padding-top: 32px !important;
          border-top: 2px dashed #94a3b8 !important;
          position: relative !important;
        }
        div[style*="page-break-before: always"]::before,
        div[style*="page-break-before:always"]::before,
        div[style*="break-before: page"]::before,
        .page-break::before {
          content: "📄 HALAMAN BERIKUTNYA (LAMPIRAN)" !important;
          display: block !important;
          text-align: center !important;
          font-size: 8.5pt !important;
          font-weight: 700 !important;
          letter-spacing: 1.5px !important;
          color: #475569 !important;
          background: #e2e8f0 !important;
          border: 1px solid #cbd5e1 !important;
          border-radius: 9999px !important;
          padding: 4px 18px !important;
          width: fit-content !important;
          margin: -45px auto 24px auto !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06) !important;
        }
      }

      /* Print / PDF presentation */
      @media print {
        body {
          background: transparent !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .master-page-table {
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        tfoot {
          display: table-footer-group !important;
        }
        /* Repeating running footer fixed at bottom: 4mm on EVERY page */
        .amanah-letter-footer {
          display: table !important;
          position: fixed !important;
          bottom: 4mm !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          background: #ffffff !important;
          z-index: 99999 !important;
        }
        div[style*="page-break-before: always"]::before,
        div[style*="page-break-before:always"]::before,
        div[style*="break-before: page"]::before,
        .page-break::before {
          display: none !important;
          content: "" !important;
        }
        div[style*="page-break-before: always"],
        div[style*="page-break-before:always"],
        div[style*="break-before: page"],
        .page-break {
          border-top: none !important;
          padding-top: 0 !important;
          margin-top: 0 !important;
          page-break-before: always !important;
          break-before: page !important;
        }
      }

      /* Eliminate unwanted horizontal lines / borders on page break sections */
      hr { display: none !important; }
      div[style*="border-top: 1px solid #000000"],
      div[style*="border-top:1px solid #000000"],
      div[style*="border-top: 1px solid black"],
      div[style*="border-top:1px solid black"],
      div[style*="border-top: 1px solid #000"],
      div[style*="border-top:1px solid #000"] {
        border-top: none !important;
        padding-top: 0 !important;
      }

      /* Eliminate negative margins on kop surat header */
      div[style*="margin-left: -30px"],
      div[style*="margin-left:-30px"],
      div[style*="margin-left: -40px"],
      div[style*="margin-left:-40px"] {
        margin-left: 0 !important;
        margin-right: 0 !important;
        padding-top: 0 !important;
      }

      /* Standardize font size and line height across all letter elements */
      div, p, span, td, th, li, a, ol, ul, b, strong {
        font-family: Arial, Helvetica, sans-serif !important;
      }
      p, td, th, li, ol, ul {
        font-size: 10.5pt !important;
      }
      ol, ul {
        margin-top: 4px !important;
        margin-bottom: 8px !important;
        padding-left: 20px !important;
      }
      li {
        margin-bottom: 3px !important;
        font-size: 10.5pt !important;
        line-height: 1.3 !important;
      }
      p {
        margin-top: 0px !important;
        margin-bottom: 8px !important;
        font-size: 10.5pt !important;
        line-height: 1.35 !important;
      }

      /* Kop Surat Header */
      .kop-surat-img, img[alt*="Kop Surat"] {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
        margin: 0 auto 6px auto !important;
      }

      /* Bismillah - proper, elegant calligraphy */
      img[src*="bismillah"], img[alt*="Bismillah"], .bismillah-img {
        width: 260px !important;
        max-width: 45% !important;
        height: auto !important;
        max-height: 48px !important;
        display: block !important;
        margin: 8px auto 14px auto !important;
        object-fit: contain !important;
        filter: brightness(0) !important;
      }

      /* Spacing of meta table & date block */
      table[style*="calc(100% - 15px)"] td,
      table.meta-table td {
        padding: 2.5px 0 !important;
        line-height: 1.25 !important;
      }

      /* Jadwal table spacing and padding */
      table[style*="margin: 8px auto"],
      table[style*="margin: 15px auto"],
      table[style*="margin-left: 30px"] {
        margin-top: 6px !important;
        margin-bottom: 10px !important;
        font-size: 10.5pt !important;
      }
      table[style*="margin: 8px auto"] td,
      table[style*="margin: 15px auto"] td,
      table[style*="margin-left: 30px"] td {
        padding: 2.5px 0 !important;
        line-height: 1.25 !important;
      }

      /* Signature table spacing */
      table[style*="margin-top: 14px"],
      table[style*="margin-top: 15px"],
      table[style*="margin-top: 30px"] {
        margin-top: 14px !important;
        page-break-inside: avoid !important;
      }
      div[style*="width: 280px"] {
        width: 310px !important;
      }
      div[style*="font-size: 9.5pt"],
      div[style*="font-size: 10pt"][style*="margin-bottom: 6px"] {
        font-size: 9.5pt !important;
        line-height: 1.2 !important;
      }
      div[style*="height: 60px"],
      div[style*="height: 70px"] {
        height: 50px !important;
      }
      div[style*="width: 60px"] img[src*="logo-dsn"],
      div[style*="width: 70px"] img[src*="logo-dsn"] {
        width: 16px !important;
        height: 16px !important;
      }
      .kop-surat img:not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]), 
      td img:not(.qr-signature-img):not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]) {
        max-width: 75px !important;
        max-height: 90px !important;
        height: auto !important;
        width: auto !important;
        display: inline-block !important;
        vertical-align: middle !important;
      }
      img.qr-signature-img {
        width: 55px !important;
        height: 55px !important;
        max-width: 55px !important;
        max-height: 55px !important;
        min-width: 55px !important;
        min-height: 55px !important;
        display: inline-block !important;
        object-fit: contain !important;
      }
      div[style*="width: 60px"][style*="height: 60px"],
      div[style*="width: 70px"][style*="height: 70px"] {
        margin: 2px 0 2px 0 !important;
        width: 55px !important;
        height: 55px !important;
      }
      .amanah-letter-footer td {
        font-size: 7.5pt !important;
        line-height: 1.25 !important;
      }
    </style>
`;

function wrapWithMasterLayout(rawHtml: string): string {
  // Strip old styles, footers, borders
  let cleaned = rawHtml
    .replace(/<style id="amanah-kop-styles">[\s\S]*?<\/style>/gi, '')
    .replace(/<table class="amanah-letter-footer"[\s\S]*?<\/table>/gi, '')
    .replace(/\\?\${FOOTER_HTML}/g, '')
    .replace(/border-top:\s*1px\s*solid\s*#000000;\s*padding-top:\s*20px;/gi, 'padding-top: 0;')
    .replace(/border-top:\s*1px\s*solid\s*#000000;?/gi, 'border-top: none;')
    .replace(/border-top:\s*1px\s*solid\s*black;?/gi, 'border-top: none;')
    .replace(/border-top:\s*1px\s*solid\s*#000;?/gi, 'border-top: none;')
    .replace(/margin-left:\s*-30px;\s*margin-right:\s*-30px;/gi, 'margin-left: 0; margin-right: 0;')
    .replace(/margin-left:\s*-40px;\s*margin-right:\s*-40px;/gi, 'margin-left: 0; margin-right: 0;')
    .replace(/font-size:\s*11pt/gi, 'font-size: 10.5pt');

  // Replace Bismillah SVG with the full authentic vector Base64
  cleaned = cleaned.replace(/src=["']data:image\/svg\+xml;base64,[^"']*["']/gi, `src="${bismillahSvgBase64}"`);
  cleaned = cleaned.replace(/src=["'][^"']*bismillah\.svg["']/gi, `src="${bismillahSvgBase64}"`);

  // Standardize Bismillah inline styling in the letter body
  cleaned = cleaned.replace(/(<img[^>]*(?:bismillah|Bismillah)[^>]*style=["'])([^"']*)(["'])/gi, (match, p1, p2, p3) => {
    let cleanStyle = p2.replace(/height:\s*[^;]+;?/gi, '').replace(/max-height:\s*[^;]+;?/gi, '').replace(/width:\s*[^;]+;?/gi, '').replace(/max-width:\s*[^;]+;?/gi, '').trim();
    return `${p1}${cleanStyle ? cleanStyle + '; ' : ''}width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;${p3}`;
  });

  // Normalize closing greeting (salam penutup) to Wassalamu’alaikum
  cleaned = cleaned.replace(
    /(<!--\s*SALAM\s*PENUTUP\s*-->[\s\S]*?<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh[\.,]?)\s*(<\/p>)/gi,
    '$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3'
  );
  cleaned = cleaned.replace(
    /(<p[^>]*>)\s*[Aa]ssalamu([’'‘`]?alaikum\s+Warahmatullah\s+Wabarakatuh)\.\s*(<\/p>)/gi,
    '$1Wassalamu’alaikum Warahmatullah Wabarakatuh.$3'
  );

  let bodyContent = cleaned;
  if (cleaned.includes('<body')) {
    const start = cleaned.indexOf('>', cleaned.indexOf('<body')) + 1;
    const end = cleaned.lastIndexOf('</body>');
    bodyContent = cleaned.substring(start, end !== -1 ? end : undefined);
  }

  if (bodyContent.includes('master-page-table')) {
    bodyContent = bodyContent
      .replace(/<table class="master-page-table"[\s\S]*?<tbody>\s*<tr>\s*<td>/gi, '')
      .replace(/<\/td>\s*<\/tr>\s*<\/tbody>\s*<tfoot>[\s\S]*?<\/tfoot>\s*<\/table>/gi, '');
  }

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  ${STRICT_STYLES}
</head>
<body>
  ${FOOTER_HTML}
  <table class="master-page-table">
    <tbody>
      <tr>
        <td>
          ${bodyContent}
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td>
          <div style="height: 20mm;"></div>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

async function auditAndMigrate() {
  console.log('=== MEMULAI PENYELARASAN BISMILLAH LENGKAP & KONTEN SURAT ===\n');

  // 1. Update Database Templates
  console.log('1. Memperbarui Template Surat di Database...');
  let templateCount = 0;
  for (const tpl of DEFAULT_TEMPLATES) {
    await prisma.letterTemplate.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        htmlContent: tpl.htmlContent,
        variables: tpl.variables,
        isArchived: false,
      },
      create: {
        name: tpl.name,
        code: tpl.code,
        category: tpl.category,
        description: tpl.description,
        htmlContent: tpl.htmlContent,
        variables: tpl.variables,
        isArchived: false,
      },
    });
    templateCount++;
  }
  console.log(`   ✅ ${templateCount} Template Surat Resmi berhasil diselaraskan di Database.\n`);

  // 2. Update Custom / Existing Letter Templates in Database
  console.log('2. Memeriksa Template Kustom yang ada di Database...');
  const customTemplates = await prisma.letterTemplate.findMany();
  let customUpdated = 0;
  for (const ct of customTemplates) {
    if (ct.htmlContent) {
      let updated = ct.htmlContent
        .replace(/border-top:\s*1px\s*solid\s*#000000;\s*padding-top:\s*20px;/gi, 'padding-top: 0;')
        .replace(/border-top:\s*1px\s*solid\s*#000000;?/gi, 'border-top: none;')
        .replace(/border-top:\s*1px\s*solid\s*black;?/gi, 'border-top: none;')
        .replace(/margin-left:\s*-30px;\s*margin-right:\s*-30px;/gi, 'margin-left: 0; margin-right: 0;')
        .replace(/margin-left:\s*-40px;\s*margin-right:\s*-40px;/gi, 'margin-left: 0; margin-right: 0;')
        .replace(/font-size:\s*11pt/g, 'font-size: 10.5pt')
        .replace(/max-width:\s*750px;\s*margin:\s*auto;\s*padding:\s*0px\s*40px\s*10px\s*40px;/g, 'width: 100%; max-width: 100%; margin: 0; padding: 0;')
        .replace(/(<img[^>]*(?:bismillah|Bismillah)[^>]*style=["'])([^"']*)(["'])/gi, (match, p1, p2, p3) => {
          let cleanStyle = p2.replace(/height:\s*[^;]+;?/gi, '').replace(/max-height:\s*[^;]+;?/gi, '').replace(/width:\s*[^;]+;?/gi, '').replace(/max-width:\s*[^;]+;?/gi, '').trim();
          return `${p1}${cleanStyle ? cleanStyle + '; ' : ''}width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;${p3}`;
        });
      if (updated !== ct.htmlContent) {
        await prisma.letterTemplate.update({
          where: { id: ct.id },
          data: { htmlContent: updated }
        });
        customUpdated++;
      }
    }
  }
  console.log(`   ✅ ${customUpdated} Template Kustom diperbarui.\n`);

  // 3. Update Existing Letters on Disk (uploads/*.html)
  console.log('3. Memindai & Memperbarui Seluruh Berkas Surat yang Sudah Jadi (.html) di Disk...');
  const uploadDirs = [
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), 'backend/uploads'),
  ];

  let scannedFiles = 0;
  let updatedFiles = 0;

  for (const dir of uploadDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f.toLowerCase().endsWith('.html')) {
          scannedFiles++;
          const filePath = path.join(dir, f);
          const raw = fs.readFileSync(filePath, 'utf8');
          const finalHtml = wrapWithMasterLayout(raw);

          fs.writeFileSync(filePath, finalHtml, 'utf8');
          updatedFiles++;
        }
      }
    }
  }
  console.log(`   ✅ Dipindai ${scannedFiles} berkas surat HTML, berhasil disinkronkan ${updatedFiles} berkas surat.\n`);

  console.log('=== SEMUA TEMPLATE DAN SURAT JADI TELAH SELESAI DISINKRONKAN DENGAN BISMILLAH LENGKAP 100% ===');
}

auditAndMigrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
