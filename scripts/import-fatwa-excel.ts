import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma.ts';

interface FatwaItem {
  no: number;
  nomorFatwa: string;
  tanggal: string;
  pleno: string | number | null;
  penandatangan1: string | null;
  penandatangan2: string | null;
  applicant: string;
  judul: string;
  tahun: number;
  keterangan: string;
}

async function main() {
  console.log('📖 Loading fatwa data from Excel JSON...');
  const jsonPath = path.resolve(process.cwd(), 'prisma/seeds/fatwa_excel_data.json');
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`File not found: ${jsonPath}`);
  }

  const raw = fs.readFileSync(jsonPath, 'utf8');
  const fatwas: FatwaItem[] = JSON.parse(raw);
  console.log(`Found ${fatwas.length} fatwas to import into local database.`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of fatwas) {
    const agendaNumber = item.nomorFatwa;
    const tglDate = new Date(item.tanggal);
    const plenoStr = item.pleno !== null && item.pleno !== undefined ? String(item.pleno) : null;

    const existing = await prisma.fatwa.findUnique({
      where: { agendaNumber },
    });

    if (existing) {
      await prisma.fatwa.update({
        where: { id: existing.id },
        data: {
          title: item.judul,
          status: 'PUBLIKASI',
          applicant: item.applicant,
          tanggal: tglDate,
          keterangan: item.keterangan,
          nomorFatwa: item.nomorFatwa,
          pleno: plenoStr,
          tahun: item.tahun,
          penandatangan1: item.penandatangan1,
          penandatangan2: item.penandatangan2,
          noUrut: item.no,
        },
      });
      updatedCount++;
    } else {
      await prisma.fatwa.create({
        data: {
          title: item.judul,
          agendaNumber,
          status: 'PUBLIKASI',
          applicant: item.applicant,
          tanggal: tglDate,
          keterangan: item.keterangan,
          nomorFatwa: item.nomorFatwa,
          pleno: plenoStr,
          tahun: item.tahun,
          penandatangan1: item.penandatangan1,
          penandatangan2: item.penandatangan2,
          noUrut: item.no,
        },
      });
      insertedCount++;
    }
  }

  console.log(`\n🎉 Local Database Import Completed!`);
  console.log(`   - Total Processed : ${fatwas.length}`);
  console.log(`   - New Inserted    : ${insertedCount}`);
  console.log(`   - Updated         : ${updatedCount}`);

  // Now, let's also sync to production API (if live)
  console.log('\n🌐 Syncing to production API (https://amanah.dsnmui.or.id/api/fatwa)...');
  try {
    // 1. Login to get fresh token
    const loginRes = await fetch('https://amanah.dsnmui.or.id/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'miftahsteven@gmail.com', password: 'B47054ii!' })
    });
    const loginData = await loginRes.json();
    
    let token = '';
    if (loginData.requires2FA) {
      const v2faRes = await fetch('https://amanah.dsnmui.or.id/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loginData.userId, token: '847054' })
      });
      const v2faData = await v2faRes.json();
      token = v2faData?.data?.accessToken || '';
    } else if (loginData?.data?.accessToken) {
      token = loginData.data.accessToken;
    }

    if (token) {
      console.log('   ✅ Authenticated with production API! Checking existing production fatwas...');
      const listRes = await fetch('https://amanah.dsnmui.or.id/api/fatwa', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const listData = await listRes.json();
      const existingAgendaNumbers = new Set((listData?.data || []).map((f: any) => f.agendaNumber));
      console.log(`   Existing production fatwas count: ${existingAgendaNumbers.size}`);

      let prodNew = 0;
      for (const item of fatwas) {
        if (!existingAgendaNumbers.has(item.nomorFatwa)) {
          const createRes = await fetch('https://amanah.dsnmui.or.id/api/fatwa', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              title: item.judul,
              agendaNumber: item.nomorFatwa,
              status: 'PUBLIKASI',
              applicant: item.applicant,
              tanggal: `${item.tanggal}T00:00:00.000Z`,
              keterangan: item.keterangan,
            })
          });
          if (createRes.ok) prodNew++;
        }
      }
      console.log(`   ✅ Synced ${prodNew} new fatwas to production API!`);
    } else {
      console.log('   ⚠️ Could not obtain production token, skipped production API sync.');
    }
  } catch (err: any) {
    console.log(`   ⚠️ Production API sync error: ${err.message}`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
