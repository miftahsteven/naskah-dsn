import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const doc = await prisma.document.findFirst({
    where: { documentNumber: { contains: '049/U-0643' } },
    include: { versions: { orderBy: { versionNum: 'desc' } } }
  });
  if (!doc || doc.versions.length === 0) return console.log("Doc not found");

  const version = doc.versions[0];
  let filePath = path.join(process.cwd(), 'uploads', path.basename(version.fileUrl));

  if (!fs.existsSync(filePath)) return console.log("File not found locally:", filePath);

  let htmlContent = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync('scratch/original_049.html', htmlContent);
  console.log("Wrote original_049.html");
}
main();
