import { prisma } from '../src/lib/prisma.js';

async function main() {
  const versions = await prisma.documentVersion.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log('Latest 5 Document Versions:');
  console.log(JSON.stringify(versions, null, 2));

  await prisma.$disconnect();
}

main().catch(console.error);
