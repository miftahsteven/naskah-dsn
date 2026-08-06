import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const doc = await prisma.document.findFirst({
    where: { documentNumber: { contains: '0643' } }
  });
  if (!doc) return console.log("Doc not found");
  
  const token = 'test-token'; // We don't have token, but /render needs auth.
  // Actually, I can just call the router logic directly or authenticate.
  // Wait, I can generate a token.
}
main();
