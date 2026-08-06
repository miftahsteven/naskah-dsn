import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const doc = await prisma.document.findFirst({
    where: { documentNumber: { contains: '050/U-0643' } },
    include: { versions: { orderBy: { versionNum: 'desc' } } }
  });
  if (!doc || !doc.versions[0]) return console.log("Doc not found");

  const filePath = path.join(process.cwd(), doc.versions[0].fileUrl);
  if (!fs.existsSync(filePath)) return console.log("File missing");

  const html = fs.readFileSync(filePath, 'utf8');
  const match = html.match(/.{0,200}CHOLIL.{0,200}/i);
  if (match) console.log("CHOLIL Context:\n", match[0]);

  const match2 = html.match(/.{0,200}AMIRSYAH.{0,200}/i);
  if (match2) console.log("AMIRSYAH Context:\n", match2[0]);
}
main();
