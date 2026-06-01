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
  const rolesData = [
    { name: 'SUPER_ADMIN', description: 'System Administrator with full access' },
    { name: 'ORG_ADMIN', description: 'Organization Administrator' },
    { name: 'APPROVER', description: 'Officer responsible for reviewing documents' },
    { name: 'SIGNATORY', description: 'Officer with digital signature authority' },
    { name: 'STAFF', description: 'General staff for document creation' },
    { name: 'EXTERNAL_VIEWER', description: 'Limited external access' },
  ];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  // ── NEW: Create Permissions ──
  const permissionsData = [
    // MANAJEMEN DOKUMEN
    { code: 'DOC_UPLOAD', name: 'Upload Dokumen', description: 'Mampu mengunggah dokumen baru' },
    { code: 'DOC_EDIT', name: 'Edit Dokumen', description: 'Mampu merubah metadata dokumen' },
    { code: 'DOC_VIEW', name: 'Lihat Dokumen', description: 'Mampu melihat isi dokumen (Reader)' },
    { code: 'DOC_DELETE', name: 'Hapus Dokumen', description: 'Mampu menghapus versi dokumen' },
    { code: 'DOC_APPROVE', name: 'Approve Dokumen', description: 'Mampu menyetujui dokumen di workflow' },
    { code: 'DOC_REJECT', name: 'Reject Dokumen', description: 'Mampu menolak dokumen di workflow' },
    { code: 'DOC_REVISE', name: 'Revisi Dokumen', description: 'Mampu meminta revisi dokumen' },
    
    // MANAJEMEN USER
    { code: 'USER_ADD', name: 'Tambah User', description: 'Mampu menambah user baru' },
    { code: 'USER_EDIT', name: 'Edit User', description: 'Mampu mengubah data user' },
    { code: 'USER_DELETE', name: 'Hapus User', description: 'Mampu menghapus user' },
    
    // MANAJEMEN ROLE
    { code: 'ROLE_MANAGE', name: 'Kelola Role & Permission', description: 'Mampu mengatur hak akses role' },
  ];

  const createdPermissions = [];
  for (const perm of permissionsData) {
    const p = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { name: perm.name, description: perm.description },
      create: perm,
    });
    createdPermissions.push(p);
  }

  // ── NEW: Map Permissions to Roles ──
  const allRoles = await prisma.role.findMany();
  const permMap = createdPermissions.reduce((acc, p) => ({ ...acc, [p.code]: p.id }), {} as Record<string, string>);

  for (const role of allRoles) {
    let rolePerms: string[] = [];
    
    if (['SUPER_ADMIN', 'ORG_ADMIN'].includes(role.name)) {
      rolePerms = createdPermissions.map(p => p.id);
    } else if (role.name === 'APPROVER') {
      rolePerms = [permMap['DOC_VIEW'], permMap['DOC_APPROVE'], permMap['DOC_REJECT'], permMap['DOC_REVISE']];
    } else if (role.name === 'STAFF') {
      rolePerms = [permMap['DOC_UPLOAD'], permMap['DOC_VIEW']];
    }

    if (rolePerms.length > 0) {
      for (const pId of rolePerms) {
        await prisma.rolePermission.upsert({
          where: { 
            roleId_permissionId: { roleId: role.id, permissionId: pId } 
          },
          update: {},
          create: { roleId: role.id, permissionId: pId }
        });
      }
    }
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
