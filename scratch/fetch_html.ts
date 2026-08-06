import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const docVersion = await prisma.documentVersion.findFirst({
    where: { mimeType: 'text/html' },
    orderBy: { createdAt: 'desc' },
    include: { document: { include: { signatures: { include: { user: true } }, workflowInstances: { include: { steps: { include: { user: true } } } } } } }
  });
  if (!docVersion) return console.log("Doc not found");

  let filePath = path.join(process.cwd(), docVersion.fileUrl);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), docVersion.fileUrl.replace('uploads/', ''));
    if (!fs.existsSync(filePath)) {
        return console.log("File not found locally:", filePath);
    }
  }

  let htmlContent = fs.readFileSync(filePath, 'utf8');
  fs.writeFileSync('scratch/original.html', htmlContent);
  console.log("Wrote original.html for doc", docVersion.document.documentNumber);
}
main();
