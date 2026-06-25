import { prisma } from '../../src/lib/prisma.js';

async function main() {
  console.log('Seeding Disposisi Documents...');

  // Get a user and organization
  const admin = await prisma.user.findFirst({ where: { role: { name: 'ADMIN' } } });
  if (!admin) {
    console.log('No admin found, skipping disposisi seeder.');
    return;
  }
  const orgId = admin.organizationId;

  // Get users for flow
  const users = await prisma.user.findMany({ take: 3 });

  // Get category & classification
  const category = await prisma.documentCategory.findFirst();
  const classification = await prisma.documentClassification.findFirst();

  if (!category || !classification) {
    console.log('Category or Classification not found, skipping disposisi seeder.');
    return;
  }

  // 1. Document in BARU
  const docBaru = await prisma.document.create({
    data: {
      title: 'Surat Permohonan Kerjasama (Seed)',
      documentNumber: 'SRT/001/BARU/2026',
      organizationId: orgId,
      categoryId: category.id,
      classificationId: classification.id,
      creatorId: admin.id,
      status: 'DRAFT',
      disposisiStatus: 'BARU',
      versions: {
        create: {
          versionNum: 1,
          fileName: 'surat_kerjasama.pdf',
          fileSize: 1024,
          mimeType: 'application/pdf',
          fileUrl: '/dummy/url.pdf',
          createdBy: admin.id
        }
      },
      workflowInstances: {
        create: {
          status: 'PENDING',
          currentStep: 1,
          steps: {
            create: [
              { stepNumber: 1, userId: users[0]?.id || admin.id, status: 'PENDING' },
              { stepNumber: 2, userId: users[1]?.id || admin.id, status: 'WAITING' }
            ]
          }
        }
      }
    }
  });

  // 2. Document in DIPROSES (Unfinished TTE)
  const docProses = await prisma.document.create({
    data: {
      title: 'Surat Keputusan Direksi (Seed)',
      documentNumber: 'SK/002/PROS/2026',
      organizationId: orgId,
      categoryId: category.id,
      classificationId: classification.id,
      creatorId: admin.id,
      status: 'PENDING_APPROVAL',
      disposisiStatus: 'DIPROSES',
      versions: {
        create: {
          versionNum: 1,
          fileName: 'sk_direksi.pdf',
          fileSize: 2048,
          mimeType: 'application/pdf',
          fileUrl: '/dummy/sk.pdf',
          createdBy: admin.id
        }
      },
      workflowInstances: {
        create: {
          status: 'PENDING',
          currentStep: 1,
          steps: {
            create: [
              { stepNumber: 1, userId: users[0]?.id || admin.id, status: 'APPROVED', actionedAt: new Date() },
              { stepNumber: 2, userId: users[1]?.id || admin.id, status: 'PENDING' }
            ]
          }
        }
      }
    }
  });

  // 3. Document in DIPROSES (Finished TTE but not moved yet)
  const docProsesSelesai = await prisma.document.create({
    data: {
      title: 'Surat Edaran Internal (Seed)',
      documentNumber: 'SE/003/PROS/2026',
      organizationId: orgId,
      categoryId: category.id,
      classificationId: classification.id,
      creatorId: admin.id,
      status: 'SIGNED',
      disposisiStatus: 'DIPROSES',
      versions: {
        create: {
          versionNum: 1,
          fileName: 'se_internal.pdf',
          fileSize: 512,
          mimeType: 'application/pdf',
          fileUrl: '/dummy/se.pdf',
          createdBy: admin.id
        }
      },
      workflowInstances: {
        create: {
          status: 'COMPLETED',
          currentStep: 2,
          steps: {
            create: [
              { stepNumber: 1, userId: users[0]?.id || admin.id, status: 'APPROVED', actionedAt: new Date() },
              { stepNumber: 2, userId: users[1]?.id || admin.id, status: 'APPROVED', actionedAt: new Date() }
            ]
          }
        }
      }
    }
  });

  // 4. Document in SELESAI
  const docSelesai = await prisma.document.create({
    data: {
      title: 'Surat Undangan Rapat Umum (Seed)',
      documentNumber: 'UND/004/SEL/2026',
      organizationId: orgId,
      categoryId: category.id,
      classificationId: classification.id,
      creatorId: admin.id,
      status: 'SIGNED',
      disposisiStatus: 'SELESAI',
      versions: {
        create: {
          versionNum: 1,
          fileName: 'undangan_rapat.pdf',
          fileSize: 800,
          mimeType: 'application/pdf',
          fileUrl: '/dummy/undangan.pdf',
          createdBy: admin.id
        }
      },
      workflowInstances: {
        create: {
          status: 'COMPLETED',
          currentStep: 1,
          steps: {
            create: [
              { stepNumber: 1, userId: users[0]?.id || admin.id, status: 'APPROVED', actionedAt: new Date() }
            ]
          }
        }
      }
    }
  });

  console.log('✅ Seeding Disposisi Documents completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
