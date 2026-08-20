import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';

async function run() {
  const docs = await prisma.document.findMany({
    where: {
      OR: [
        { documentNumber: { contains: '0643' } },
        { documentNumber: { contains: '0693' } },
        { title: { contains: 'Kesekretarisan' } }
      ]
    },
    include: { versions: true }
  });

  for (const doc of docs) {
    console.log('=== DOC ===');
    console.log('ID:', doc.id);
    console.log('Title:', doc.title);
    console.log('Doc Number:', doc.documentNumber);
    for (const v of doc.versions) {
      console.log('Version:', v.versionNum, v.fileUrl);
      try {
        const filePath = v.fileUrl.startsWith('/') ? v.fileUrl.slice(1) : v.fileUrl;
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          console.log('Content (first 1000 chars):\n', content.slice(0, 1000));
        } else {
          console.log('File does NOT exist on disk:', filePath);
        }
      } catch (e: any) {
        console.log('Error reading:', e.message);
      }
    }
  }
}

run().finally(() => prisma.$disconnect());
