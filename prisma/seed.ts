import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // 1. Create Organization
  const org = await prisma.organization.upsert({
    where: { id: 'org-mui-001' },
    update: {},
    create: {
      id: 'org-mui-001',
      name: 'Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI)',
    },
  });

  // 2. Create Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'System Administrator with full access' },
    { name: 'ORG_ADMIN', description: 'Organization Administrator' },
    { name: 'APPROVER', description: 'Officer responsible for reviewing documents' },
    { name: 'SIGNATORY', description: 'Officer with digital signature authority' },
    { name: 'STAFF', description: 'General staff for document creation' },
    { name: 'EXTERNAL_VIEWER', description: 'Limited external access' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });

  // 3. Create Default Classifications
  const classifications = [
    { level: 'UMUM', name: 'Umum' },
    { level: 'INTERNAL', name: 'Internal' },
    { level: 'RAHASIA', name: 'Rahasia' },
    { level: 'SANGAT_RAHASIA', name: 'Sangat Rahasia' },
  ];

  for (const item of classifications) {
    await prisma.documentClassification.upsert({
      where: { level: item.level },
      update: { name: item.name },
      create: item,
    });
  }

  // 4. Create Default Categories
  const categories = ['Surat Official', 'Fatwa', 'Nota Dinas', 'Berita Acara', 'Keputusan'];
  for (const cat of categories) {
    await prisma.documentCategory.upsert({
      where: { name: cat },
      update: {},
      create: { name: cat },
    });
  }

  // 5. Create Super Admin User
  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@mui.or.id' },
    update: {},
    create: {
      email: 'admin@mui.or.id',
      passwordHash,
      fullName: 'Super Admin MUI',
      organizationId: org.id,
      roleId: superAdminRole!.id,
      isActive: true,
    },
  });

  console.log('Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
