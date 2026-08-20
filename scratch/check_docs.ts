import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';

async function run() {
  const docs = await prisma.document.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { versions: true }
  });
  for (const doc of docs) {
    console.log('DOC:', doc.id, doc.title, doc.documentNumber);
    for (const v of doc.versions) {
      console.log('  VERSION:', v.versionNum, v.fileUrl, v.fileName, v.mimeType);
      if (v.fileUrl.endsWith('.html')) {
        try {
          const filePath = v.fileUrl.startsWith('/') ? v.fileUrl.slice(1) : v.fileUrl;
          const content = fs.readFileSync(filePath, 'utf8');
          console.log('  FIRST 400 CHARS OF HTML:\n', content.slice(0, 400));
        } catch(e: any) {
          console.log('  FAILED TO READ FILE:', e.message);
        }
      }
    }
  }
}
run().finally(() => prisma.$disconnect());
