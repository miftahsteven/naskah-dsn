import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

async function checkAllDocuments() {
  console.log('=== CHECKING ALL DOCUMENTS IN DATABASE & DISK ===');

  const versions = await prisma.documentVersion.findMany({
    include: {
      document: true,
    }
  });

  console.log(`Total Document Versions in DB: ${versions.length}`);
  for (const v of versions) {
    console.log(`- Doc: "${v.document.title}" (DocNumber: ${v.document.documentNumber}), FileUrl: ${v.fileUrl}, Mime: ${v.mimeType}`);
  }

  // Check upload files on disk
  const uploadDir = path.resolve(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadDir).filter(f => f.endsWith('.html'));
  console.log(`\nTotal HTML files in uploads/: ${files.length}`);

  let smallBismillahCount = 0;
  for (const f of files) {
    const content = fs.readFileSync(path.join(uploadDir, f), 'utf8');
    const bismillahMatches = content.match(/<img[^>]*bismillah[^>]*>/gi) || [];
    const bismillahStyles = content.match(/img\[src\*="bismillah"\][\s\S]*?\}/gi) || [];

    const isSmall = content.includes('height: 32px') || content.includes('height: 35px') || content.includes('height: 48px') || content.includes('height:35px') || content.includes('height:48px');
    if (isSmall) {
      smallBismillahCount++;
      console.log(`File ${f} still has smaller Bismillah size!`);
    }
  }

  console.log(`\nSmall Bismillah count: ${smallBismillahCount} of ${files.length}`);
}

checkAllDocuments().catch(console.error).finally(() => prisma.$disconnect());
