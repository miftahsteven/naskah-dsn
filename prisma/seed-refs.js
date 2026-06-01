import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
async function main() {
    console.log("🌱 Seeding Departments & Jabatan...");
    const departments = [
        { name: "Basyarnas MUI", code: "BASYARNAS" },
        { name: "DSN Dewan Syariah Nasional", code: "DSN" },
        { name: "BPPO MUI", code: "BPPO" },
        { name: "Ganas Annar MUI", code: "GANAS_ANNAR" },
        { name: "LPLH & SDA MUI", code: "LPLH_SDA" },
    ];
    for (const dept of departments) {
        await prisma.department.upsert({
            where: { name: dept.name },
            update: {},
            create: dept,
        });
        console.log(`  ✅ Department: ${dept.name}`);
    }
    const jabatanList = [
        "Ketua Umum", "Wakil Ketua", "Sekretaris Jenderal",
        "Wakil Sekretaris Jenderal", "Bendahara Umum", "Anggota",
        "Staf Administrasi", "Kepala Bagian", "Kepala Divisi",
        "Manager", "Direktur", "Kepala Sekretariat",
    ];
    for (const name of jabatanList) {
        await prisma.jabatan.upsert({
            where: { name },
            update: {},
            create: { name },
        });
        console.log(`  ✅ Jabatan: ${name}`);
    }
    console.log("\n✅ Seed selesai!");
}
main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
//# sourceMappingURL=seed-refs.js.map