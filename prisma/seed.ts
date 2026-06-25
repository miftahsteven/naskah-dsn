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
  const categories = ['Surat Official', 'Fatwa', 'Nota Dinas', 'Berita Acara', 'Keputusan', 'Invoice'];
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

  // 6. Create Seed Data for Fatwas
  const fatwasData = [
    // PERMOHONAN (5)
    {
      title: "Permohonan Fatwa tentang Transaksi Emas Digital",
      agendaNumber: "045/PF/DSN-MUI/V/2026",
      status: "PERMOHONAN",
      applicant: "PT Emas Mulia",
      tanggal: new Date("2026-05-14T00:00:00Z"),
      keterangan: "Pengajuan awal untuk transaksi emas berbasis digital."
    },
    {
      title: "Permohonan Fatwa tentang Layanan Buy Now Pay Later (BNPL) Syariah",
      agendaNumber: "046/PF/DSN-MUI/V/2026",
      status: "PERMOHONAN",
      applicant: "PT FinTek Syariah",
      tanggal: new Date("2026-05-15T00:00:00Z"),
      keterangan: "Pengajuan skema beli sekarang bayar nanti yang disesuaikan dengan prinsip syariah."
    },
    {
      title: "Permohonan Fatwa tentang Token Kripto Riel Syariah",
      agendaNumber: "047/PF/DSN-MUI/V/2026",
      status: "PERMOHONAN",
      applicant: "PT Kripto Nusantara",
      tanggal: new Date("2026-05-16T00:00:00Z"),
      keterangan: "Kesesuaian token kripto riel dengan prinsip komoditas syariah."
    },
    {
      title: "Permohonan Fatwa Skema Multi-Level Marketing (MLM) Kosmetik Herbal",
      agendaNumber: "048/PF/DSN-MUI/V/2026",
      status: "PERMOHONAN",
      applicant: "CV Herbal Cantik",
      tanggal: new Date("2026-05-17T00:00:00Z"),
      keterangan: "Analisis kehalalan sistem pemasaran berjenjang kosmetik herbal."
    },
    {
      title: "Permohonan Fatwa Sistem Crowdfunding Perumahan Rakyat",
      agendaNumber: "049/PF/DSN-MUI/V/2026",
      status: "PERMOHONAN",
      applicant: "Koperasi Syariah Mandiri",
      tanggal: new Date("2026-05-18T00:00:00Z"),
      keterangan: "Penyusunan fatwa untuk pembiayaan kolektif perumahan bersubsidi."
    },

    // KAJIAN (7)
    {
      title: "Kajian Fatwa tentang Sukuk Linked Wakaf",
      agendaNumber: "039/KJ/DSN-MUI/V/2026",
      status: "KAJIAN",
      applicant: "Tim Kajian Ekonomi",
      tanggal: new Date("2026-05-13T00:00:00Z"),
      keterangan: "Analisis kesesuaian syariah investasi sukuk berbasis wakaf uang."
    },
    {
      title: "Kajian Fatwa Akad Musyarakah Mutanaqisah untuk Pembiayaan Alutsista",
      agendaNumber: "040/KJ/DSN-MUI/V/2026",
      status: "KAJIAN",
      applicant: "Tim Kajian Pertahanan",
      tanggal: new Date("2026-05-11T00:00:00Z"),
      keterangan: "Studi kelayakan akad MMQ pada pengadaan alutsista negara."
    },
    {
      title: "Kajian Aspek Syariah P2P Lending UMKM",
      agendaNumber: "041/KJ/DSN-MUI/V/2026",
      status: "KAJIAN",
      applicant: "Tim Kajian Finansial",
      tanggal: new Date("2026-05-10T00:00:00Z"),
      keterangan: "Kajian hukum syariah mengenai layanan pinjam meminjam berbasis teknologi."
    },
    {
      title: "Kajian Fatwa tentang Short Selling di Pasar Modal Syariah",
      agendaNumber: "042/KJ/DSN-MUI/V/2026",
      status: "KAJIAN",
      applicant: "Otoritas Jasa Keuangan",
      tanggal: new Date("2026-05-09T00:00:00Z"),
      keterangan: "Kajian risiko transaksi short selling berdasarkan kriteria syariah."
    },
    {
      title: "Kajian Penggunaan Dana Zakat untuk Modal Usaha Bergulir",
      agendaNumber: "043/KJ/DSN-MUI/V/2026",
      status: "KAJIAN",
      applicant: "Lembaga Amil Zakat Nasional",
      tanggal: new Date("2026-05-08T00:00:00Z"),
      keterangan: "Aspek fiqh mengenai produktivitas dana zakat untuk modal usaha."
    },
    {
      title: "Kajian Skema Transaksi Hedging Syariah Komoditas",
      agendaNumber: "044/KJ/DSN-MUI/V/2026",
      status: "KAJIAN",
      applicant: "Bursa Berjangka Jakarta",
      tanggal: new Date("2026-05-07T00:00:00Z"),
      keterangan: "Kajian lindung nilai syariah pada bursa komoditi berjangka."
    },
    {
      title: "Kajian Akad Istishna Paralel pada Proyek Tol Syariah",
      agendaNumber: "045/KJ/DSN-MUI/V/2026",
      status: "KAJIAN",
      applicant: "Kementerian PUPR",
      tanggal: new Date("2026-05-06T00:00:00Z"),
      keterangan: "Implementasi akad istishna paralel pada pembangunan infrastruktur jalan tol."
    },

    // BPH (6)
    {
      title: "Pembahasan BPH: Akad Murabahah BSI",
      agendaNumber: "032/BPH/DSN-MUI/V/2026",
      status: "BPH",
      applicant: "Bidang Muamalah",
      tanggal: new Date("2026-05-12T00:00:00Z"),
      keterangan: "Pembahasan tingkat Badan Pengurus Harian mengenai akad Murabahah di Bank Syariah Indonesia."
    },
    {
      title: "Pembahasan BPH: Akad Ijarah pada Layanan Cloud Computing",
      agendaNumber: "033/BPH/DSN-MUI/V/2026",
      status: "BPH",
      applicant: "Sub-Komite IT & Syariah",
      tanggal: new Date("2026-05-11T00:00:00Z"),
      keterangan: "Menunggu tindak lanjut pembahasan sewa-menyewa cloud computing."
    },
    {
      title: "Pembahasan BPH: Standar Margin Keuntungan Pembiayaan Murabahah Emas",
      agendaNumber: "034/BPH/DSN-MUI/V/2026",
      status: "BPH",
      applicant: "Asosiasi Bank Syariah",
      tanggal: new Date("2026-05-08T00:00:00Z"),
      keterangan: "Penentuan batas wajar margin pembiayaan emas."
    },
    {
      title: "Pembahasan BPH: Wakaf Polis Asuransi Jiwa Syariah",
      agendaNumber: "035/BPH/DSN-MUI/V/2026",
      status: "BPH",
      applicant: "Dewan Asuransi Indonesia",
      tanggal: new Date("2026-05-07T00:00:00Z"),
      keterangan: "Kesesuaian wakaf manfaat polis asuransi jiwa."
    },
    {
      title: "Pembahasan BPH: Skema Modal Ventura Syariah",
      agendaNumber: "036/BPH/DSN-MUI/V/2026",
      status: "BPH",
      applicant: "Otoritas Jasa Keuangan",
      tanggal: new Date("2026-05-05T00:00:00Z"),
      keterangan: "Perumusan panduan investasi bagi modal ventura syariah."
    },
    {
      title: "Pembahasan BPH: Akad Kafalah Bil Ujrah pada L/C Impor Syariah",
      agendaNumber: "037/BPH/DSN-MUI/V/2026",
      status: "BPH",
      applicant: "Bank DKI Syariah",
      tanggal: new Date("2026-05-04T00:00:00Z"),
      keterangan: "Pembahasan penjaminan letter of credit dengan imbal jasa (ujrah)."
    },

    // PLENO (4)
    {
      title: "Pleno DSN-MUI Bulan Mei 2026",
      agendaNumber: "028/PL/DSN-MUI/V/2026",
      status: "PLENO",
      applicant: "Rapat Pleno",
      tanggal: new Date("2026-05-11T00:00:00Z"),
      keterangan: "Pengambilan keputusan akhir fatwa-fatwa triwulan kedua tahun 2026."
    },
    {
      title: "Rapat Pleno Fatwa Pembiayaan Infrastruktur Daerah Syariah",
      agendaNumber: "029/PL/DSN-MUI/V/2026",
      status: "PLENO",
      applicant: "Pemerintah Provinsi Aceh",
      tanggal: new Date("2026-05-09T00:00:00Z"),
      keterangan: "Sidang pleno untuk pembiayaan obligasi daerah syariah."
    },
    {
      title: "Sidang Pleno Skema Kartu Kredit Syariah Co-Branding",
      agendaNumber: "030/PL/DSN-MUI/V/2026",
      status: "PLENO",
      applicant: "PT Bank Mega Syariah",
      tanggal: new Date("2026-05-08T00:00:00Z"),
      keterangan: "Pemberian fatwa untuk kartu pembiayaan berlabel bersama."
    },
    {
      title: "Sidang Pleno Standardisasi Akad Hawalah pada Factoring Syariah",
      agendaNumber: "031/PL/DSN-MUI/V/2026",
      status: "PLENO",
      applicant: "Asosiasi Perusahaan Pembiayaan",
      tanggal: new Date("2026-05-07T00:00:00Z"),
      keterangan: "Standardisasi akad anjak piutang berdasarkan syariah."
    },

    // TTE (2)
    {
      title: "TTE Ketum DSN-MUI",
      agendaNumber: "021/TTE/DSN-MUI/V/2026",
      status: "TTE",
      applicant: "Menunggu TTE",
      tanggal: new Date("2026-05-10T00:00:00Z"),
      keterangan: "Proses penandatanganan elektronik oleh Ketua Umum DSN-MUI."
    },
    {
      title: "TTE Ketua DSN-MUI: Fatwa tentang Crypto Asset berdasarkan Prinsip Syariah",
      agendaNumber: "022/TTE/DSN-MUI/V/2026",
      status: "TTE",
      applicant: "Menunggu TTE Ketua DSN-MUI",
      tanggal: new Date("2026-05-09T00:00:00Z"),
      keterangan: "Proses tanda tangan elektronik ketua umum mengenai aset kripto."
    },

    // PUBLIKASI (8)
    {
      title: "Fatwa No. 150/DSN-MUI/XII/2025 tentang Obligasi Negara Syariah Ritel",
      agendaNumber: "001/PB/DSN-MUI/I/2026",
      status: "PUBLIKASI",
      applicant: "Kementerian Keuangan",
      tanggal: new Date("2026-01-15T00:00:00Z"),
      keterangan: "Telah diterbitkan di Lembaran Fatwa DSN-MUI."
    },
    {
      title: "Fatwa No. 151/DSN-MUI/I/2026 tentang Syirkah Al-Wujuh",
      agendaNumber: "002/PB/DSN-MUI/I/2026",
      status: "PUBLIKASI",
      applicant: "Ikatan Ahli Ekonomi Islam",
      tanggal: new Date("2026-01-20T00:00:00Z"),
      keterangan: "Telah dipublikasikan dan disebarluaskan kepada seluruh anggota."
    },
    {
      title: "Fatwa No. 152/DSN-MUI/I/2026 tentang Asuransi Syariah Sosial",
      agendaNumber: "003/PB/DSN-MUI/I/2026",
      status: "PUBLIKASI",
      applicant: "BPJS Kesehatan",
      tanggal: new Date("2026-02-01T00:00:00Z"),
      keterangan: "Penerapan prinsip syariah pada jaminan sosial nasional."
    },
    {
      title: "Fatwa No. 153/DSN-MUI/II/2026 tentang Pembiayaan Likuiditas Jangka Pendek Syariah",
      agendaNumber: "004/PB/DSN-MUI/II/2026",
      status: "PUBLIKASI",
      applicant: "Bank Indonesia",
      tanggal: new Date("2026-02-15T00:00:00Z"),
      keterangan: "Pedoman penyediaan likuiditas bank sentral untuk perbankan syariah."
    },
    {
      title: "Fatwa No. 154/DSN-MUI/III/2026 tentang Skema KPR Syariah Sejahtera",
      agendaNumber: "005/PB/DSN-MUI/III/2026",
      status: "PUBLIKASI",
      applicant: "PT Bank Tabungan Negara",
      tanggal: new Date("2026-03-05T00:00:00Z"),
      keterangan: "Skema kepemilikan rumah subsidi bagi masyarakat berpenghasilan rendah."
    },
    {
      title: "Fatwa No. 155/DSN-MUI/III/2026 tentang Tabungan Qurban Syariah",
      agendaNumber: "006/PB/DSN-MUI/III/2026",
      status: "PUBLIKASI",
      applicant: "Lembaga Zakat & Wakaf DSN",
      tanggal: new Date("2026-03-20T00:00:00Z"),
      keterangan: "Tata kelola tabungan berjangka khusus untuk ibadah kurban."
    },
    {
      title: "Fatwa No. 156/DSN-MUI/IV/2026 tentang Investasi Emas Agunan Syariah",
      agendaNumber: "007/PB/DSN-MUI/IV/2026",
      status: "PUBLIKASI",
      applicant: "PT Pegadaian Syariah",
      tanggal: new Date("2026-04-10T00:00:00Z"),
      keterangan: "Kriteria syariah untuk gadai emas multiguna."
    },
    {
      title: "Fatwa No. 157/DSN-MUI/IV/2026 tentang Pembiayaan Pendidikan Syariah",
      agendaNumber: "008/PB/DSN-MUI/IV/2026",
      status: "PUBLIKASI",
      applicant: "Kementerian Agama",
      tanggal: new Date("2026-04-25T00:00:00Z"),
      keterangan: "Skema pembiayaan pinjam-meminjam khusus biaya pendidikan tinggi."
    }
  ];

  for (const fatwa of fatwasData) {
    await prisma.fatwa.upsert({
      where: { agendaNumber: fatwa.agendaNumber },
      update: {
        title: fatwa.title,
        status: fatwa.status,
        applicant: fatwa.applicant,
        tanggal: fatwa.tanggal,
        keterangan: fatwa.keterangan,
      },
      create: fatwa,
    });
  }

  // 7. Seed DSN-MUI Departments
  console.log('Seeding DSN-MUI Departments...');
  const dsnMuiDepts = [
    { name: "Pimpinan Harian", code: "PIMPINAN_HARIAN" },
    { name: "Bidang Fatwa", code: "BID_FATWA" },
    { name: "Bidang Layanan, Literasi, Relasi Industri & Regulasi", code: "BID_LAYANAN" },
    { name: "Anggota Pleno", code: "ANGGOTA_PLENO" },
    { name: "Kesekretariatan", code: "KESEKRETARIATAN" },
    { name: "Keuangan", code: "KEUANGAN" },
  ];

  const deptMap: Record<string, string> = {};
  for (const dept of dsnMuiDepts) {
    const d = await prisma.department.upsert({
      where: { name: dept.name },
      update: { code: dept.code },
      create: { name: dept.name, code: dept.code },
    });
    deptMap[dept.name] = d.id;
  }

  // 8. Seed DSN-MUI Jabatans
  console.log('Seeding DSN-MUI Jabatans...');
  const dsnMuiJabatans = [
    "Ketua", "Wakil Ketua", "Sekretaris", "Wakil Sekretaris", 
    "Bendahara", "Wakil Bendahara", "Koordinator", "Anggota Pleno", 
    "Staf Kesekretariatan", "Staf Keuangan"
  ];

  const jabMap: Record<string, string> = {};
  for (const name of dsnMuiJabatans) {
    const j = await prisma.jabatan.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    jabMap[name] = j.id;
  }

  // 9. Seed DSN-MUI Personnel Users
  console.log('Seeding DSN-MUI Personnel Users...');
  const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } });
  const approverRole = await prisma.role.findUnique({ where: { name: 'APPROVER' } });
  const defaultUserPassword = await bcrypt.hash('Password123!', 10);

  const muiPersonnel = [
    {
      email: "cholil.nafis@mui.or.id",
      fullName: "K.H. M. Cholil Nafis, Lc., Ph.D.",
      phone: "081234567801",
      deptName: "Pimpinan Harian",
      jabName: "Ketua",
      roleName: "APPROVER",
    },
    {
      email: "amirsyah@mui.or.id",
      fullName: "Dr. H. Amirsyah Tambunan, M.A.",
      phone: "081234567802",
      deptName: "Pimpinan Harian",
      jabName: "Sekretaris",
      roleName: "APPROVER",
    },
    {
      email: "trisna.ningsih@mui.or.id",
      fullName: "Hj. Trisna Ningsih Yuliati Djuwaeli, S.E., M.M.",
      phone: "081234567803",
      deptName: "Pimpinan Harian",
      jabName: "Bendahara",
      roleName: "APPROVER",
    },
    // Wakil Ketua
    {
      email: "hasanudin@mui.or.id",
      fullName: "Prof. Dr. K.H. Hasanudin, M.Ag.",
      phone: "081234567804",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Ketua",
      roleName: "APPROVER",
    },
    {
      email: "sholahudin@mui.or.id",
      fullName: "K.H. Sholahudin Al Aiyub",
      phone: "081234567805",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Ketua",
      roleName: "APPROVER",
    },
    {
      email: "asrorun.niam@mui.or.id",
      fullName: "Prof. Dr. K.H. M. Asrorun Niam Sholeh, M.A.",
      phone: "081234567806",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Ketua",
      roleName: "APPROVER",
    },
    {
      email: "adiwarman@mui.or.id",
      fullName: "Ir. H. Adiwarman A. Karim, S.E., M.B.A., M.A.E.P.",
      phone: "081234567807",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Ketua",
      roleName: "APPROVER",
    },
    // Wakil Sekretaris
    {
      email: "bukhori.muslim@mui.or.id",
      fullName: "Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.",
      phone: "081234567808",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Sekretaris",
      roleName: "APPROVER",
    },
    {
      email: "kanny.hidaya@mui.or.id",
      fullName: "Kanny Hidaya, S.E., M.A.",
      phone: "081234567809",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Sekretaris",
      roleName: "APPROVER",
    },
    {
      email: "muhammad.ziyad@mui.or.id",
      fullName: "Drs. H. Muhammad Ziyad, M.A.",
      phone: "081234567810",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Sekretaris",
      roleName: "APPROVER",
    },
    {
      email: "asrori.karni@mui.or.id",
      fullName: "Dr. Asrori S. Karni, S.Ag., M.H.",
      phone: "081234567811",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Sekretaris",
      roleName: "APPROVER",
    },
    // Wakil Bendahara
    {
      email: "gunawan.yasni@mui.or.id",
      fullName: "M. Gunawan Yasni, S.E., Ak., M.M., C.I.F.A., F.I.I.S.",
      phone: "081234567812",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Bendahara",
      roleName: "APPROVER",
    },
    {
      email: "dawud.arif@mui.or.id",
      fullName: "Dr. H. Dawud Arif Khan, S.E., Ak., M.Si., C.P.A.",
      phone: "081234567813",
      deptName: "Pimpinan Harian",
      jabName: "Wakil Bendahara",
      roleName: "APPROVER",
    },
    // Bidang Fatwa
    {
      email: "jaih.mubarok@mui.or.id",
      fullName: "Prof. Dr. H. Jaih Mubarok",
      phone: "081234567814",
      deptName: "Bidang Fatwa",
      jabName: "Koordinator",
      roleName: "STAFF",
    },
    {
      email: "asep.nurdin@mui.or.id",
      fullName: "Dr. H. Asep Nurdin, M.A.",
      phone: "081234567815",
      deptName: "Bidang Fatwa",
      jabName: "Anggota Pleno",
      roleName: "STAFF",
    },
    // Bidang Layanan, Literasi, dll.
    {
      email: "asep.supyadillah@mui.or.id",
      fullName: "Dr. Asep Supyadillah, M.Ag.",
      phone: "081234567816",
      deptName: "Bidang Layanan, Literasi, Relasi Industri & Regulasi",
      jabName: "Koordinator",
      roleName: "STAFF",
    },
    {
      email: "m.lutfi@mui.or.id",
      fullName: "Drs. H. M. Lutfi, M.M.",
      phone: "081234567817",
      deptName: "Bidang Layanan, Literasi, Relasi Industri & Regulasi",
      jabName: "Anggota Pleno",
      roleName: "STAFF",
    },
    // Anggota Pleno
    {
      email: "anwar.ibrahim@mui.or.id",
      fullName: "K.H. Dr. Anwar Ibrahim, M.A.",
      phone: "081234567818",
      deptName: "Anggota Pleno",
      jabName: "Anggota Pleno",
      roleName: "STAFF",
    },
    // Kesekretariatan
    {
      email: "siti.aminah@mui.or.id",
      fullName: "Siti Aminah, S.Pd.",
      phone: "081234567819",
      deptName: "Kesekretariatan",
      jabName: "Staf Kesekretariatan",
      roleName: "STAFF",
    },
    // Keuangan
    {
      email: "ahmad.fauzi@mui.or.id",
      fullName: "Ahmad Fauzi, S.E.",
      phone: "081234567820",
      deptName: "Keuangan",
      jabName: "Staf Keuangan",
      roleName: "STAFF",
    },
  ];

  for (const p of muiPersonnel) {
    const role = p.roleName === 'APPROVER' ? approverRole : staffRole;
    await prisma.user.upsert({
      where: { email: p.email },
      update: {
        fullName: p.fullName,
        phone: p.phone,
        departmentId: deptMap[p.deptName],
        jabatanId: jabMap[p.jabName],
        roleId: role!.id,
      },
      create: {
        email: p.email,
        fullName: p.fullName,
        phone: p.phone,
        passwordHash: defaultUserPassword,
        organizationId: "org-mui-001",
        roleId: role!.id,
        departmentId: deptMap[p.deptName],
        jabatanId: jabMap[p.jabName],
        isActive: true,
      },
    });
  }

  // 10. Seed Archived Documents
  console.log('Seeding Archived Documents...');
  const defaultCategory = await prisma.documentCategory.findFirst();
  const defaultClassification = await prisma.documentClassification.findFirst();
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@mui.or.id' } });

  if (defaultCategory && defaultClassification && adminUser) {
    await prisma.document.upsert({
      where: { documentNumber: 'ARSIP/2026/001' },
      update: {},
      create: {
        title: 'Laporan Pertanggungjawaban Tahunan DSN-MUI 2025',
        documentNumber: 'ARSIP/2026/001',
        organizationId: org.id,
        categoryId: defaultCategory.id,
        classificationId: defaultClassification.id,
        creatorId: adminUser.id,
        documentType: 'OUTGOING',
        status: 'ARCHIVED',
        createdAt: new Date('2026-01-10T09:00:00Z'),
        updatedAt: new Date('2026-01-15T10:30:00Z'),
        versions: {
          create: {
            versionNum: 1,
            fileName: 'lpj_tahunan_2025.pdf',
            fileSize: 4500000,
            mimeType: 'application/pdf',
            fileUrl: '/uploads/lpj_tahunan_2025.pdf',
            createdBy: adminUser.id
          }
        }
      }
    });

    await prisma.document.upsert({
      where: { documentNumber: 'ARSIP/2026/002' },
      update: {},
      create: {
        title: 'Surat Undangan Sosialisasi Pajak Lembaga Keagamaan',
        documentNumber: 'ARSIP/2026/002',
        organizationId: org.id,
        categoryId: defaultCategory.id,
        classificationId: defaultClassification.id,
        creatorId: adminUser.id,
        documentType: 'INCOMING',
        status: 'ARCHIVED',
        createdAt: new Date('2026-03-05T08:30:00Z'),
        updatedAt: new Date('2026-03-06T14:20:00Z'),
        versions: {
          create: {
            versionNum: 1,
            fileName: 'undangan_pajak_2026.pdf',
            fileSize: 1200000,
            mimeType: 'application/pdf',
            fileUrl: '/uploads/undangan_pajak_2026.pdf',
            createdBy: adminUser.id
          }
        }
      }
    });
  }

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
