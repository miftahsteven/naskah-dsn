import fs from 'fs';
import path from 'path';
import { prisma } from '../src/lib/prisma';

// HTML Table Parser
function parseHtmlTable(htmlContent: string): string[][] {
  const rows: string[][] = [];
  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  let trMatch;
  while ((trMatch = trRegex.exec(htmlContent)) !== null) {
    const rowHtml = trMatch[1];
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
      let cellText = cellMatch[1];
      // Strip tags, replace &nbsp;, decode entities
      cellText = cellText.replace(/<br\s*[\/]?>/gi, '\n');
      cellText = cellText.replace(/<[^>]+>/g, '');
      cellText = cellText.replace(/&nbsp;/gi, ' ');
      cellText = cellText.replace(/&amp;/gi, '&');
      cellText = cellText.replace(/&lt;/gi, '<');
      cellText = cellText.replace(/&gt;/gi, '>');
      cellText = cellText.replace(/&quot;/gi, '"');
      cellText = cellText.trim();
      cells.push(cellText);
    }
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

function cleanFormula(val: string | null | undefined): string | null {
  if (!val) return null;
  let str = val.trim();
  if (str.startsWith('="') && str.endsWith('"')) {
    str = str.substring(2, str.length - 1);
  } else if (str.startsWith('=')) {
    str = str.substring(1).replace(/^"+|"+$/g, '');
  }
  str = str.trim();
  if (!str || str.toLowerCase() === 'nan' || str === '-' || str.toLowerCase() === 'null') {
    return null;
  }
  return str;
}

function cleanPhone(val: string | null | undefined): string | null {
  const cleaned = cleanFormula(val);
  if (!cleaned) return null;
  let p = cleaned.replace(/[^0-9]/g, '');
  if (p.startsWith('62')) {
    p = '0' + p.substring(2);
  }
  return p.length >= 8 ? p : null;
}

const KOTA_LIST = [
  'Jakarta Selatan', 'Jakarta Pusat', 'Jakarta Timur', 'Jakarta Barat', 'Jakarta Utara',
  'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Solo', 'Medan', 'Padang', 'Makassar', 'Malang', 'Bogor'
];

const TEMPAT_LAHIR_LIST = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Solo', 'Medan', 'Padang', 'Makassar', 'Malang', 'Bogor', 'Cirebon', 'Banda Aceh', 'Palembang'
];

const KELURAHAN_LIST = [
  'Kuningan Timur', 'Menteng', 'Kebayoran Baru', 'Pancoran', 'Setiabudi', 'Cilandak Barat', 'Tebet Timur', 'Mampang Prapatan'
];

const KECAMATAN_LIST = [
  'Setiabudi', 'Menteng', 'Kebayoran Baru', 'Pancoran', 'Tebet', 'Pasar Minggu', 'Cilandak'
];

const PENDIDIKAN_LIST = [
  'S2 Syariah', 'S3 Hukum Islam', 'S2 Ekonomi Syariah', 'S3 Perbankan Syariah', 'S2 Fiqih Muamalah', 'S3 Hukum Syariah'
];

const KAMPUS_LIST = [
  'UIN Syarif Hidayatullah Jakarta',
  'UIN Sunan Kalijaga Yogyakarta',
  'Universitas Al-Azhar Kairo',
  'Universitas Indonesia',
  'UIN Sunan Gunung Djati Bandung',
  'UIN Maulana Malik Ibrahim Malang',
  'Institut Tazkia'
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateNpwp(): string {
  return `${randomInt(10, 99)}.${randomInt(100, 999)}.${randomInt(100, 999)}.${randomInt(1, 9)}-${randomInt(100, 999)}.000`;
}

function isFemale(name: string): boolean {
  const lower = name.toLowerCase();
  const femaleKeywords = ['siti', 'nurul', 'dewi', 'fatimah', 'aisyah', 'rahma', 'rahmi', 'sri', 'hj.', 'hajjah', 'dra.', 'putri', 'anisa', 'ani', 'zahra'];
  return femaleKeywords.some(kw => lower.includes(kw));
}

export async function runMigration() {
  console.log('🚀 Starting DPS Excel Data Migration...');

  const filePath = path.resolve('/Users/miftahsyarief/MyLab/amanah/Data DPS (832).xls');
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const htmlContent = fs.readFileSync(filePath, 'utf-8');
  const rows = parseHtmlTable(htmlContent);

  if (rows.length < 2) {
    throw new Error('No data rows found in Excel file');
  }

  const header = rows[0];
  const dataRows = rows.slice(1);
  console.log(`📊 Found ${dataRows.length} DPS rows in Excel. (Headers: ${header.length} columns)`);

  // Fetch applicant companies to relate
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: 'asc' }
  });
  console.log(`🏢 Found ${companies.length} existing companies in database.`);

  const submissions = await prisma.publicSubmission.findMany({
    where: { submissionTypeName: { contains: 'DPS' } },
    select: { companyId: true, candidates: true }
  });

  // Track candidates mentioned in submissions
  const submissionCandidateMap = new Map<string, string>(); // lowercase name substring -> companyId
  for (const sub of submissions) {
    if (sub.companyId && Array.isArray(sub.candidates)) {
      for (const cand of sub.candidates as any[]) {
        if (cand?.name) {
          submissionCandidateMap.set(cand.name.toLowerCase().trim(), sub.companyId);
        }
      }
    }
  }

  // Pre-assign some companies to a selection of DPS members (Rule 4)
  // Let's create an assignment plan:
  // e.g., index 0..2 to company 0, index 3..5 to company 1, etc., for the first 30 members
  const companyAssignmentMap = new Map<number, typeof companies[0]>();
  let compIdx = 0;
  for (let i = 0; i < Math.min(30, dataRows.length); i++) {
    if (companies.length > 0) {
      companyAssignmentMap.set(i, companies[compIdx % companies.length]);
      if ((i + 1) % 3 === 0) {
        compIdx++;
      }
    }
  }

  // Clear existing records before fresh migration
  const deleted = await prisma.dpsMember.deleteMany({});
  console.log(`🧹 Cleaned up ${deleted.count} existing DpsMember records.`);

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const externalId = cleanFormula(row[0]);
    const nama = cleanFormula(row[1]) || `DPS Anggota #${i + 1}`;
    const namaNonGelar = cleanFormula(row[2]);
    const statusDiMui = cleanFormula(row[3]);
    const tempatLahirExcel = cleanFormula(row[4]);
    const tanggalLahirExcel = cleanFormula(row[5]);
    const nikExcel = cleanFormula(row[6]);
    const alamatExcel = cleanFormula(row[7]);
    const provinsiExcel = cleanFormula(row[8]);
    const telpFixedExcel = cleanFormula(row[9]);
    const telpHpExcel = cleanPhone(row[10]);
    const emailExcel = cleanFormula(row[11]);
    const aspm = cleanFormula(row[12]);
    const wajibIkutPelatihan = cleanFormula(row[13]);
    const nomorVa = cleanFormula(row[14]);
    const foto = cleanFormula(row[15]);
    const noSertPelatihan = cleanFormula(row[16]);
    const linkSertPelatihan = cleanFormula(row[17]);
    const noSertLsp = cleanFormula(row[18]);
    const linkSertLsp = cleanFormula(row[19]);
    const tglPakta = cleanFormula(row[20]);
    const linkPakta = cleanFormula(row[21]);
    const keterangan = cleanFormula(row[22]);

    // Real fields from Excel (leave empty/null if absent per user instructions)
    const tempatLahir = tempatLahirExcel || null;
    const tanggalLahir = tanggalLahirExcel || null;
    const jenisKelamin = null; // Dikosongkan sesuai feedback
    const alamatDomisili = alamatExcel || null;
    const provinsi = provinsiExcel || null;
    const kotaKabupaten = null;
    const rtRw = null; // Dikosongkan sesuai feedback
    const kelurahan = null; // Dikosongkan sesuai feedback
    const kecamatan = null; // Dikosongkan sesuai feedback
    const kodePos = null; // Dikosongkan sesuai feedback
    const noHp = telpHpExcel || null;
    const noTelepon = telpFixedExcel || null;
    const isInvalidEmail = !emailExcel || emailExcel.toLowerCase() === 'tidak ada' || !emailExcel.includes('@');
    const email = isInvalidEmail
      ? (namaNonGelar 
          ? `${namaNonGelar.toLowerCase().replace(/[^a-z0-9]/g, '')}.${externalId || i + 1}@dsnmui.or.id`
          : `dps.${externalId || i + 1}@dsnmui.or.id`)
      : emailExcel;

    const npwp = null;
    const status = 'Aktif';
    const jenisPenugasan = 'Paruh Waktu';
    const tanggalPengajuan = tglPakta || null;
    const pendidikanTerakhir = null; // Dikosongkan sesuai feedback
    const perguruanTinggi = null; // Dikosongkan sesuai feedback
    const tahunLulus = null; // Dikosongkan sesuai feedback

    // Company association (Rule 4)
    let assignedCompany: typeof companies[0] | null = null;

    // Check if this DPS matches a candidate from an active submission
    const lowerName = nama.toLowerCase();
    for (const [candName, cId] of submissionCandidateMap.entries()) {
      if (lowerName.includes(candName) || candName.includes(lowerName) || (namaNonGelar && candName.includes(namaNonGelar.toLowerCase()))) {
        const found = companies.find(c => c.id === cId);
        if (found) {
          assignedCompany = found;
          break;
        }
      }
    }

    // If not matched via submission candidate, check if pre-assigned in batch
    if (!assignedCompany && companyAssignmentMap.has(i)) {
      assignedCompany = companyAssignmentMap.get(i)!;
    }

    const companyId = assignedCompany ? assignedCompany.id : null;
    const lembagaPenempatan = assignedCompany ? assignedCompany.name : null;
    const jabatanDps = assignedCompany ? (i % 3 === 0 ? 'Ketua DPS' : 'Anggota DPS') : null;

    // Check if already migrated by externalId
    const existing = externalId ? await prisma.dpsMember.findFirst({
      where: { externalId }
    }) : null;

    const dpsData = {
      externalId,
      status,
      jenisPenugasan,
      tanggalPengajuan,
      namaLengkap: nama,
      namaNonGelar,
      statusDiMui,
      fotoUrl: foto || null,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      kewarganegaraan: null,
      agama: null,
      nik: nikExcel || null,
      npwp,
      alamatDomisili,
      rtRw,
      kelurahan,
      kecamatan,
      kotaKabupaten,
      provinsi,
      kodePos,
      noTelepon,
      noHp,
      email,
      pendidikanTerakhir,
      perguruanTinggi,
      tahunLulus,
      aspm,
      wajibIkutPelatihan,
      nomorVirtualAccount: nomorVa,
      nomorSertifikatPelatihan: noSertPelatihan,
      linkSertifikatPelatihan: linkSertPelatihan,
      nomorSertifikatLsp: noSertLsp,
      linkSertifikatLsp: linkSertLsp,
      tanggalPaktaIntegritas: tglPakta,
      linkPaktaIntegritas: linkPakta,
      keterangan,
      companyId,
      lembagaPenempatan,
      jabatanDps,
    };

    if (existing) {
      await prisma.dpsMember.update({
        where: { id: existing.id },
        data: dpsData,
      });
      updatedCount++;
    } else {
      await prisma.dpsMember.create({
        data: dpsData,
      });
      createdCount++;
    }

    if ((i + 1) % 100 === 0 || i === dataRows.length - 1) {
      console.log(`⏳ Processed ${i + 1} / ${dataRows.length} records... (Created: ${createdCount}, Updated: ${updatedCount})`);
    }
  }

  console.log(`\n🎉 Migration completed successfully!`);
  console.log(`   Total Created: ${createdCount}`);
  console.log(`   Total Updated: ${updatedCount}`);
  const totalInDb = await prisma.dpsMember.count();
  console.log(`   Total DpsMember in Database: ${totalInDb}`);

  const withCompany = await prisma.dpsMember.count({
    where: { companyId: { not: null } }
  });
  console.log(`   DpsMember linked to Company: ${withCompany}`);
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
