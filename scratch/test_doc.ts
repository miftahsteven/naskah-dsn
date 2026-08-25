import { prisma } from '../src/lib/prisma.js';

async function main() {
  const docs = await prisma.document.findMany({
    where: { documentNumber: { contains: 'U-0713' } },
    include: {
      signatures: { include: { user: true } },
      workflowInstances: { include: { steps: { include: { user: true } } } },
      versions: true,
    }
  });
  console.log('FOUND DOCS:', docs.length);
  for (const d of docs) {
    console.log('Document:', d.id, d.title, d.documentNumber, d.status);
    console.log('Signatures:', d.signatures.map(s => ({ id: s.id, userId: s.userId, name: s.user?.fullName, job: s.user?.jobTitle, signedAt: s.signedAt })));
    for (const wi of d.workflowInstances) {
      console.log('Workflow status:', wi.status);
      console.log('Steps:', wi.steps.map(st => ({ id: st.id, stepNumber: st.stepNumber, roleId: st.roleId, status: st.status, userId: st.userId, name: st.user?.fullName })));
    }
  }
  process.exit(0);
}

main().catch(console.error);
