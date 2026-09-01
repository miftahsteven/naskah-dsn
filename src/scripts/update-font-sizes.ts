import { prisma } from '../lib/prisma.js';
import { DEFAULT_TEMPLATES } from '../modules/letter-template/default-templates.js';
import fs from 'fs';
import path from 'path';

const STRICT_STYLES = `
    <style id="amanah-kop-styles">
      @page {
        size: A4;
        margin-top: 20mm !important;
        margin-bottom: 28mm !important;
        margin-left: 25mm !important;
        margin-right: 20mm !important;
      }
      body {
        margin: 0 !important;
        padding: 0 !important;
        font-family: Arial, Helvetica, sans-serif !important;
        font-size: 10.5pt !important;
        line-height: 1.25 !important;
        color: #111827 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* Screen presentation: Clean centered A4 preview container */
      @media screen {
        body {
          background-color: #f8fafc;
          padding: 20px 10px !important;
        }
        div[style*="max-width: 750px"],
        div[style*="max-width:750px"],
        div[style*="max-width: 800px"],
        div[style*="max-width:800px"],
        div[style*="font-family: Arial"] {
          max-width: 750px !important;
          margin: 0 auto !important;
          padding: 20px 30px !important;
          background: #ffffff !important;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
          box-sizing: border-box !important;
        }
        .amanah-letter-footer {
          display: none !important;
        }
      }

      /* Print / PDF presentation */
      @media print {
        body {
          background: transparent !important;
          padding: 0 !important;
          margin: 0 !important;
        }
        div[style*="max-width: 750px"],
        div[style*="max-width:750px"],
        div[style*="max-width: 800px"],
        div[style*="max-width:800px"],
        div[style*="font-family: Arial"] {
          max-width: 100% !important;
          width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }
        .amanah-letter-footer {
          display: table !important;
          position: fixed !important;
          bottom: -22mm !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          background: transparent !important;
          z-index: 99999 !important;
        }
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
        line-height: 1.25 !important;
      }
      p, td, th, li, ol, ul {
        font-size: 10.5pt !important;
      }
      ol, ul {
        margin-top: 2px !important;
        margin-bottom: 4px !important;
        padding-left: 20px !important;
      }
      li {
        margin-bottom: 2px !important;
        font-size: 10.5pt !important;
      }
      p {
        margin-top: 0px !important;
        margin-bottom: 4px !important;
        font-size: 10.5pt !important;
      }
      /* Override any legacy larger font sizes */
      *[style*="font-size: 11pt"],
      *[style*="font-size:11pt"],
      *[style*="font-size: 12pt"],
      *[style*="font-size:12pt"],
      *[style*="font-size: 13pt"],
      *[style*="font-size:13pt"],
      *[style*="font-size: 14pt"],
      *[style*="font-size:14pt"] {
        font-size: 10.5pt !important;
      }

      /* Kop Surat Header */
      .kop-surat-img, img[alt*="Kop Surat"] {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        display: block !important;
        margin: 0 auto 4px auto !important;
      }

      /* Bismillah */
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

      /* Margins of meta/date blocks */
      div[style*="margin-bottom: 10px"],
      div[style*="margin-bottom: 12px"],
      div[style*="margin-bottom: 15px"],
      div[style*="margin-bottom: 20px"],
      table[style*="margin-bottom: 12px"],
      table[style*="margin-bottom: 20px"] {
        margin-bottom: 4px !important;
      }

      /* Jadwal table spacing and padding */
      table[style*="margin: 8px auto"],
      table[style*="margin: 15px auto"],
      table[style*="margin-left: 30px"] {
        margin-top: 2px !important;
        margin-bottom: 4px !important;
        font-size: 10.5pt !important;
      }
      table[style*="margin: 8px auto"] td,
      table[style*="margin: 15px auto"] td,
      table[style*="margin-left: 30px"] td {
        padding: 2px 0 !important;
      }

      /* Signature table spacing */
      table[style*="margin-top: 14px"],
      table[style*="margin-top: 15px"],
      table[style*="margin-top: 30px"] {
        margin-top: 8px !important;
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
      .kop-surat img:not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]):not(.bismillah-img), 
      td img:not(.qr-signature-img):not(.kop-surat-img):not([alt*="Kop Surat"]):not([alt*="Bismillah"]):not([src*="bismillah"]):not(.bismillah-img) {
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

async function main() {
  console.log('🚀 Updating Letter Templates in Database to official 10.5pt standard...');
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
  console.log(`✅ ${templateCount} Letter Templates updated in Database.`);

  // Update existing custom letter templates in DB as well
  const customTemplates = await prisma.letterTemplate.findMany();
  for (const ct of customTemplates) {
    if (ct.htmlContent) {
      let updated = ct.htmlContent
        .replace(/margin-left:\s*-30px;\s*margin-right:\s*-30px;/gi, 'margin-left: 0; margin-right: 0;')
        .replace(/margin-left:\s*-40px;\s*margin-right:\s*-40px;/gi, 'margin-left: 0; margin-right: 0;')
        .replace(/font-size:\s*11pt/g, 'font-size: 10.5pt')
        .replace(/max-width:\s*750px;\s*margin:\s*auto;\s*padding:\s*0px\s*40px\s*10px\s*40px;/g, 'width: 100%; max-width: 100%; margin: 0; padding: 0;')
        .replace(/line-height:\s*1\.35;/g, 'line-height: 1.25;')
        .replace(/line-height:\s*1\.5;/g, 'line-height: 1.25;');
      if (updated !== ct.htmlContent) {
        await prisma.letterTemplate.update({
          where: { id: ct.id },
          data: { htmlContent: updated }
        });
        console.log(`✅ Updated custom template: ${ct.name} (${ct.code})`);
      }
    }
  }

  // Update existing HTML files in uploads
  const uploadDirs = [
    path.resolve(process.cwd(), 'uploads'),
    path.resolve(process.cwd(), 'backend/uploads'),
  ];

  let fileCount = 0;
  for (const dir of uploadDirs) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      for (const f of files) {
        if (f.toLowerCase().endsWith('.html')) {
          const filePath = path.join(dir, f);
          let content = fs.readFileSync(filePath, 'utf8');
          let modified = false;

          // Replace old style tag with strict style tag
          if (content.includes('id="amanah-kop-styles"')) {
            content = content.replace(/<style id="amanah-kop-styles">[\s\S]*?<\/style>/i, STRICT_STYLES);
            modified = true;
          }

          // Clean up outer container padding and max-width
          if (content.includes('max-width: 750px') || content.includes('padding: 0px 40px')) {
            content = content.replace(/max-width:\s*750px;\s*margin:\s*auto;\s*padding:\s*0px\s*40px\s*10px\s*40px;/g, 'width: 100%; max-width: 100%; margin: 0; padding: 0;');
            modified = true;
          }

          if (content.includes('margin-left: -30px') || content.includes('margin-left: -40px')) {
            content = content.replace(/margin-left:\s*-30px;\s*margin-right:\s*-30px;/gi, 'margin-left: 0; margin-right: 0;');
            content = content.replace(/margin-left:\s*-40px;\s*margin-right:\s*-40px;/gi, 'margin-left: 0; margin-right: 0;');
            modified = true;
          }

          if (content.includes('font-size: 11pt') || content.includes('font-size:11pt')) {
            content = content.replace(/font-size:\s*11pt/gi, 'font-size: 10.5pt');
            modified = true;
          }

          if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            fileCount++;
          }
        }
      }
    }
  }
  console.log(`✅ ${fileCount} HTML files in uploads/ updated to standard official margins and 10.5pt.`);
  console.log('🎉 Migration completed successfully!');
}

main()
  .catch(err => {
    console.error('❌ Error updating font sizes and margins:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
