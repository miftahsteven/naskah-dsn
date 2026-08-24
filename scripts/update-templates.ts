import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { DEFAULT_TEMPLATES } from '../src/modules/letter-template/default-templates.js';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const tpl of DEFAULT_TEMPLATES) {
    console.log(`Updating/Upserting ${tpl.code}...`);
    await prisma.letterTemplate.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        htmlContent: tpl.htmlContent,
        variables: tpl.variables,
      },
      create: {
        name: tpl.name,
        code: tpl.code,
        category: tpl.category,
        description: tpl.description,
        htmlContent: tpl.htmlContent,
        variables: tpl.variables,
        createdBy: 'System Migration',
      },
    });
    console.log(`✅ ${tpl.code} updated/upserted`);
  }
  console.log('All templates successfully synchronized!');
}

main()
  .catch((e) => {
    console.error('Error updating templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
