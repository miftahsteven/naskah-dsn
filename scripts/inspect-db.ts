import { prisma } from '../src/lib/prisma.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const orgs = await prisma.organization.findMany();
  const roles = await prisma.role.findMany();
  const depts = await (prisma as any).department.findMany();
  const jabatans = await (prisma as any).jabatan.findMany();
  const users = await prisma.user.findMany({
    include: {
      department: true,
      jabatan: true,
      role: true,
    }
  });

  const dump = { orgs, roles, depts, jabatans, users };
  fs.mkdirSync('scratch', { recursive: true });
  fs.writeFileSync('scratch/db_dump.json', JSON.stringify(dump, null, 2));
  console.log('Saved scratch/db_dump.json successfully!');
  console.log('Orgs:', orgs.map(o => ({ id: o.id, name: o.name })));
  console.log('Roles:', roles.map(r => ({ id: r.id, name: r.name })));
  console.log('Depts count:', depts.length, depts.map((d: any) => ({ id: d.id, name: d.name })));
  console.log('Jabatans count:', jabatans.length, jabatans.map((j: any) => ({ id: j.id, name: j.name })));
  console.log('Users count:', users.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
