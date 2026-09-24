import { prisma } from '../src/lib/prisma.js';
import { AuthService } from '../src/modules/auth/auth.service.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function generateRandomPassword(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DsnMui2026!${rand}`;
}

async function main() {
  console.log('🚀 Starting DSN-MUI User Import & Update...');

  // 1. Load Plan
  const planPath = path.join(process.cwd(), 'scratch/final_plan.json');
  if (!fs.existsSync(planPath)) {
    throw new Error('scratch/final_plan.json does not exist. Run simulate_plan.py first.');
  }
  const { updates, creates } = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  console.log(`Loaded plan: ${updates.length} updates, ${creates.length} creates.`);

  // 2. Fetch or Create Departments
  console.log('\n--- 1. Ensuring Departments ---');
  const deptsToEnsure = [
    { name: 'Badan Pengawas DSN-MUI', code: 'PENGAWAS_DSN' },
    { name: 'Badan Pengurus DSN-MUI', code: 'PENGURUS_DSN' },
  ];

  const deptMap = new Map<string, string>();
  for (const d of deptsToEnsure) {
    const existing = await (prisma as any).department.findFirst({
      where: { name: d.name },
    });
    if (existing) {
      deptMap.set(d.name, existing.id);
      console.log(`  ✓ Department exists: ${d.name} (${existing.id})`);
    } else {
      const created = await (prisma as any).department.create({
        data: d,
      });
      deptMap.set(d.name, created.id);
      console.log(`  + Created Department: ${d.name} (${created.id})`);
    }
  }

  // 3. Fetch or Create Jabatans
  console.log('\n--- 2. Ensuring Jabatans ---');
  const allJabatanNames = new Set<string>();
  for (const item of [...updates, ...creates]) {
    if (item.jabatan) {
      allJabatanNames.add(item.jabatan);
    }
  }

  const jabatanMap = new Map<string, string>();
  for (const jabName of allJabatanNames) {
    const existing = await (prisma as any).jabatan.findFirst({
      where: { name: jabName },
    });
    if (existing) {
      jabatanMap.set(jabName, existing.id);
      console.log(`  ✓ Jabatan exists: ${jabName} (${existing.id})`);
    } else {
      const created = await (prisma as any).jabatan.create({
        data: { name: jabName },
      });
      jabatanMap.set(jabName, created.id);
      console.log(`  + Created Jabatan: ${jabName} (${created.id})`);
    }
  }

  // 4. Role & Org
  console.log('\n--- 3. Verifying Role & Organization ---');
  const approverRole = await prisma.role.findFirst({
    where: { name: 'APPROVER' },
  });
  if (!approverRole) {
    throw new Error('APPROVER role not found in database!');
  }
  console.log(`  ✓ Approver Role ID: ${approverRole.id}`);

  const org = await prisma.organization.findFirst();
  if (!org) {
    throw new Error('Organization not found in database!');
  }
  console.log(`  ✓ Organization ID: ${org.id} (${org.name})`);

  // 5. Execute Updates for Existing Users
  console.log(`\n--- 4. Executing ${updates.length} Updates ---`);
  const updateResults = [];
  for (const u of updates) {
    const targetDeptId = deptMap.get(u.dept);
    const targetJabId = jabatanMap.get(u.jabatan);

    const dataToUpdate: any = {
      ...(u.excel_email && { email: u.excel_email }),
      ...(u.excel_phone && { phone: u.excel_phone }),
      departmentId: targetDeptId,
      jabatanId: targetJabId,
      jobTitle: u.jabatan,
    };

    const updated = await prisma.user.update({
      where: { id: u.db_id },
      data: dataToUpdate,
      include: { department: true, jabatan: true, role: true },
    });

    console.log(`  ✓ Updated Row ${u.row}: "${u.current_name}" -> Email: ${updated.email}, Phone: ${updated.phone}, Dept: ${updated.department?.name}, Jab: ${updated.jabatan?.name}`);
    updateResults.push({
      row: u.row,
      userId: updated.id,
      name: updated.fullName,
      email: updated.email,
      phone: updated.phone,
      department: updated.department?.name,
      jabatan: updated.jabatan?.name,
      role: updated.role.name,
      status: 'UPDATED',
    });
  }

  // 6. Execute Creates for New Users
  console.log(`\n--- 5. Executing ${creates.length} Creates ---`);
  const createResults = [];
  for (const c of creates) {
    const targetDeptId = deptMap.get(c.dept);
    const targetJabId = jabatanMap.get(c.jabatan);
    const rawPassword = generateRandomPassword();
    const passwordHash = await AuthService.hashPassword(rawPassword);

    const newUser = await prisma.user.create({
      data: {
        email: c.excel_email || null,
        phone: c.excel_phone || null,
        fullName: c.excel_name,
        passwordHash,
        organizationId: org.id,
        roleId: approverRole.id,
        departmentId: targetDeptId,
        jabatanId: targetJabId,
        jobTitle: c.jabatan,
        isActive: true,
      },
      include: { department: true, jabatan: true, role: true },
    });

    console.log(`  + Created Row ${c.row}: "${c.excel_name}" | Email: ${newUser.email || '(None)'} | Phone: ${newUser.phone || '(None)'} | Password: ${rawPassword}`);
    createResults.push({
      row: c.row,
      userId: newUser.id,
      name: newUser.fullName,
      email: newUser.email,
      phone: newUser.phone,
      department: newUser.department?.name,
      jabatan: newUser.jabatan?.name,
      role: newUser.role.name,
      initialPassword: rawPassword,
      status: 'CREATED',
    });
  }

  // 7. Save credentials output report
  const report = {
    executedAt: new Date().toISOString(),
    summary: {
      totalExcelRows: updates.length + creates.length,
      usersUpdated: updateResults.length,
      usersCreated: createResults.length,
    },
    updatedUsers: updateResults,
    createdUsers: createResults,
  };

  const outputPath = '/Users/miftahsyarief/MyLab/amanah/data_akun_baru_dan_lama_dsn.json';
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(`\n✅ Successfully saved full report to ${outputPath}`);

  console.log('\n🎉 ALL OPERATIONS COMPLETED SUCCESSFULLY!');
}

main()
  .catch((err) => {
    console.error('❌ Error executing import:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
