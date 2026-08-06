import { prisma } from '../src/lib/prisma.js';
async function main() {
  const doc = await prisma.document.findFirst({
    where: { documentNumber: { contains: '050/U-0643' } }
  });
  console.log("ID:", doc?.id);
}
main();
