import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import dotenv from "dotenv";
import { DEFAULT_TEMPLATES } from "../modules/letter-template/default-templates.js";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function syncAllTemplates() {
  console.log("Synchronizing default templates into database...");
  for (const tpl of DEFAULT_TEMPLATES) {
    const updated = await prisma.letterTemplate.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        htmlContent: tpl.htmlContent,
        variables: tpl.variables as any,
        updatedAt: new Date(),
      },
      create: {
        name: tpl.name,
        code: tpl.code,
        category: tpl.category,
        description: tpl.description,
        htmlContent: tpl.htmlContent,
        variables: tpl.variables as any,
      }
    });
    console.log(`Synced template: ${updated.code} - ${updated.name}`);
  }
  console.log("Template synchronization completed successfully!");
}

syncAllTemplates()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
