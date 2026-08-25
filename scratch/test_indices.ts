import fs from 'fs';
import { prisma } from '../src/lib/prisma.js';

async function test() {
  try {
    const rawHtml = fs.readFileSync('uploads/file-1787651553591-620447957.html', 'utf8');
    console.log('rawHtml length:', rawHtml.length);

    let pos = 0;
    while ((pos = rawHtml.indexOf('CHOLIL NAFIS', pos)) !== -1) {
      console.log('Found CHOLIL NAFIS at:', pos, 'ratio:', pos / rawHtml.length, 'context:', JSON.stringify(rawHtml.slice(Math.max(0, pos - 80), pos + 80)));
      pos += 12;
    }

    pos = 0;
    while ((pos = rawHtml.indexOf('AMIRSYAH TAMBUNAN', pos)) !== -1) {
      console.log('Found AMIRSYAH TAMBUNAN at:', pos, 'ratio:', pos / rawHtml.length, 'context:', JSON.stringify(rawHtml.slice(Math.max(0, pos - 80), pos + 80)));
      pos += 17;
    }

    pos = 0;
    while ((pos = rawHtml.indexOf('Adiwarman', pos)) !== -1) {
      console.log('Found Adiwarman at:', pos, 'ratio:', pos / rawHtml.length, 'context:', JSON.stringify(rawHtml.slice(Math.max(0, pos - 80), pos + 80)));
      pos += 9;
    }
  } catch (e) {
    console.error('Error in test:', e);
  }
}

test().finally(() => prisma.$disconnect());
