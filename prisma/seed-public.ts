import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedPublicPortal() {
  console.log('🌱 Seeding Amanah Public Portal Master Data...');

  // 1. Official 9 DSN-MUI Services & Requirements Master Data
  const submissionTypes = [
    {
      code: 'FATWA',
      name: 'Permohonan Fatwa',
      description: 'Permohonan fatwa hukum syariah baru atau fatwa turunan terkait inovasi akad, produk, atau skema transaksi keuangan dan bisnis syariah.',
      icon: 'BookOpen',
      sortOrder: 1,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Resmi Direksi', description: 'Surat resmi bertanda tangan direksi dan stempel basah/TTE perusahaan.', isMandatory: true, sortOrder: 1 },
        { code: 'KAJIAN_AKADEMIS', name: 'Dokumen Kajian / Latar Belakang Kebutuhan Fatwa', description: 'Penjelasan latar belakang, dasar kebutuhan fatwa, dan analisis muamalah.', isMandatory: true, sortOrder: 2 },
        { code: 'DRAFT_KONSEP_AKAD', name: 'Draf Usulan Akad / Skema Produk', description: 'Rancangan klausul akad dan alur transaksi yang dimohonkan fatwanya.', isMandatory: true, sortOrder: 3 },
        { code: 'OPINI_DPS', name: 'Opini Awal DPS / Rekomendasi Ahli Syariah', description: 'Pendapat atau telaah awal dari DPS internal pemohon.', isMandatory: false, sortOrder: 4 },
      ],
    },
    {
      code: 'REKOMENDASI_DPS',
      name: 'Permohonan Rekomendasi DPS',
      description: 'Permohonan rekomendasi penempatan, perpanjangan masa tugas, atau pergantian anggota Dewan Pengawas Syariah (DPS) pada lembaga.',
      icon: 'Users',
      sortOrder: 2,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Rekomendasi DPS dari Direksi', description: 'Surat permohonan resmi pengusulan nama calon DPS.', isMandatory: true, sortOrder: 1 },
        { code: 'CV_CALON_DPS', name: 'Daftar Riwayat Hidup / CV Lengkap Calon DPS', description: 'Curriculum Vitae memuat latar belakang pendidikan syariah dan pengalaman muamalah.', isMandatory: true, sortOrder: 2 },
        { code: 'SERTIFIKAT_KOMPETENSI', name: 'Sertifikat Kompetensi DPS / Pelatihan DSN-MUI', description: 'Salinan sertifikat pelatihan atau sertifikasi kompetensi DPS yang masih berlaku.', isMandatory: true, sortOrder: 3 },
        { code: 'PAKTA_INTEGRITAS', name: 'Surat Pernyataan Kesediaan & Pakta Integritas', description: 'Surat pernyataan tidak merangkap jabatan melebihi batas regulasi dan bersedia bertugas aktif.', isMandatory: true, sortOrder: 4 },
        { code: 'SK_RUPS_STRUKTUR', name: 'SK RUPS / Rencana Struktur Organisasi', description: 'Dokumen keputusan pemegang saham terkait penunjukan DPS.', isMandatory: false, sortOrder: 5 },
      ],
    },
    {
      code: 'REKOMENDASI_TAS',
      name: 'Permohonan Rekomendasi TAS',
      description: 'Permohonan rekomendasi penunjukan Tim Ahli Syariah (TAS) dalam penerbitan efek syariah, sukuk, reksa dana syariah, atau konsultasi bisnis.',
      icon: 'Award',
      sortOrder: 3,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Penunjukan Tim Ahli Syariah (TAS)', description: 'Surat permohonan resmi diajukan oleh emiten atau manajer investasi.', isMandatory: true, sortOrder: 1 },
        { code: 'IZIN_AHLI_SYARIAH', name: 'Izin / Sertifikasi Ahli Syariah Pasar Modal (ASPM)', description: 'Tanda daftar atau izin profesi ahli syariah dari otoritas berwenang (OJK).', isMandatory: true, sortOrder: 2 },
        { code: 'PORTOFOLIO_TAS', name: 'Profil & Portofolio Pengalaman Calon TAS', description: 'Rekam jejak pengalaman telaah efek syariah atau konsultasi syariah.', isMandatory: true, sortOrder: 3 },
        { code: 'DRAFT_KONTRAK_KERJA', name: 'Draf Kontrak / Ruang Lingkup Penugasan', description: 'Perjanjian kerja sama penugasan telaah kepatuhan syariah.', isMandatory: false, sortOrder: 4 },
      ],
    },
    {
      code: 'KESESUAIAN_SYARIAH',
      name: 'Permohonan Pernyataan Kesesuaian Syariah',
      description: 'Permohonan surat pernyataan kesesuaian syariah (Shariah Compliance Statement) atas produk baru, skema pembiayaan, atau layanan institusi.',
      icon: 'ShieldCheck',
      sortOrder: 4,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Pernyataan Kesesuaian Syariah', description: 'Surat permohonan resmi dari direksi instansi pemohon.', isMandatory: true, sortOrder: 1 },
        { code: 'PROFIL_PRODUK', name: 'Deskripsi Produk, Flowchart Transaksi & Simulasi', description: 'Penjelasan fitur, skema akad, alur dana, serta simulasi perhitungan margin/ujrah.', isMandatory: true, sortOrder: 2 },
        { code: 'DRAFT_AKAD', name: 'Draf Dokumen Perjanjian / Kontrak Nasabah', description: 'Format akad baku yang akan ditandatangani oleh para pihak.', isMandatory: true, sortOrder: 3 },
        { code: 'OPINI_DPS', name: 'Opini / Rekomendasi Dewan Pengawas Syariah Internal', description: 'Persetujuan atau kajian kesesuaian syariah dari DPS internal lembaga.', isMandatory: true, sortOrder: 4 },
        { code: 'SOP_PRODUK', name: 'Standar Operasional Prosedur (SOP) Terkait', description: 'Manual operasional penerapan prinsip syariah pada produk.', isMandatory: false, sortOrder: 5 },
      ],
    },
    {
      code: 'KESELARASAN_SYARIAH',
      name: 'Permohonan Pernyataan Keselarasan Syariah',
      description: 'Permohonan evaluasi keselarasan implementasi prinsip syariah terhadap fatwa DSN-MUI dan ketentuan regulasi otoritas pengawas (OJK/BI).',
      icon: 'GitMerge',
      sortOrder: 5,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Evaluasi Keselarasan Syariah', description: 'Surat resmi permohonan keselarasan dari pengurus instansi.', isMandatory: true, sortOrder: 1 },
        { code: 'MATRIKS_REGULASI', name: 'Matriks Keselarasan Regulasi OJK/BI vs Fatwa DSN', description: 'Tabel komparasi klausul regulasi terhadap fatwa terkait.', isMandatory: true, sortOrder: 2 },
        { code: 'SELF_ASSESSMENT', name: 'Laporan Self-Assessment Kepatuhan Syariah', description: 'Hasil audit/penilaian mandiri kepatuhan syariah.', isMandatory: true, sortOrder: 3 },
        { code: 'CATATAN_DPS', name: 'Catatan & Telaah Dewan Pengawas Syariah', description: 'Rekomendasi tertulis dari DPS pemohon.', isMandatory: false, sortOrder: 4 },
      ],
    },
    {
      code: 'SERTIFIKASI_KESESUAIAN_SYARIAH',
      name: 'Sertifikasi Kesesuaian Syariah',
      description: 'Pengajuan sertifikasi formal kesesuaian syariah untuk institusi, entitas usaha halal, rumah sakit syariah, perhotelan, atau platform digital.',
      icon: 'FileCheck2',
      sortOrder: 6,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Sertifikasi Kesesuaian Syariah', description: 'Surat resmi permohonan sertifikasi dari pimpinan tertinggi instansi.', isMandatory: true, sortOrder: 1 },
        { code: 'LEGALITAS_USAHA', name: 'Akta Pendirian, NIB & Izin Operasional Instansi', description: 'Dokumen legalitas hukum dan izin operasional lengkap.', isMandatory: true, sortOrder: 2 },
        { code: 'MANUAL_SYARIAH', name: 'Pedoman Pelayanan / Manual Standar Operasi Syariah', description: 'SOP implementasi nilai dan aturan syariah dalam operasional bisnis.', isMandatory: true, sortOrder: 3 },
        { code: 'LAPORAN_AUDIT', name: 'Laporan Hasil Audit / Evaluasi Lapangan', description: 'Bukti kesiapan fasilitas, SDM, dan tata kelola syariah.', isMandatory: true, sortOrder: 4 },
        { code: 'FASILITAS_HALAL', name: 'Sertifikat Halal / Daftar Fasilitas Pendukung', description: 'Sertifikat halal produk/dapur dan foto fasilitas ibadah memadai.', isMandatory: false, sortOrder: 5 },
      ],
    },
    {
      code: 'LAPORAN_PENGAWASAN_DPS',
      name: 'Laporan Hasil Pengawasan DPS',
      description: 'Penyampaian berkala Laporan Hasil Pengawasan (LHP) Dewan Pengawas Syariah semesteran atau tahunan dari lembaga keuangan syariah ke DSN-MUI.',
      icon: 'ClipboardCheck',
      sortOrder: 7,
      requirements: [
        { code: 'SURAT_PENGANTAR', name: 'Surat Pengantar Penyampaian Laporan Pengawasan', description: 'Surat resmi pengantar bertanda tangan DPS dan Direksi.', isMandatory: true, sortOrder: 1 },
        { code: 'DOKUMEN_LHP', name: 'Dokumen Lengkap Laporan Hasil Pengawasan (LHP)', description: 'Laporan berkala periode semester atau tahunan pengawasan syariah.', isMandatory: true, sortOrder: 2 },
        { code: 'MATRIKS_TEMUAN', name: 'Matriks Temuan Pengawasan & Rekomendasi Perbaikan', description: 'Daftar temuan audit syariah beserta status tindak lanjut perbaikan.', isMandatory: true, sortOrder: 3 },
        { code: 'NOTULEN_RAPAT', name: 'Risalah / Notulen Rapat DPS bersama Direksi', description: 'Bukti penyelenggaraan rapat koordinasi pengawasan syariah berkala.', isMandatory: false, sortOrder: 4 },
      ],
    },
    {
      code: 'SURAT_PENGADUAN',
      name: 'Surat Pengaduan',
      description: 'Saluran pengaduan resmi terkait dugaan ketidaksesuaian syariah, sengketa muamalah, atau pelanggaran prinsip syariah pada lembaga terkait.',
      icon: 'AlertTriangle',
      sortOrder: 8,
      requirements: [
        { code: 'SURAT_PENGADUAN', name: 'Surat Pengaduan Resmi & Kronologis Lengkap', description: 'Uraian runtut permasalahan, pihak terlapor, dan substansi dugaan pelanggaran.', isMandatory: true, sortOrder: 1 },
        { code: 'BUKTI_TRANSAKSI', name: 'Bukti Perjanjian / Dokumen Transaksi Terkait', description: 'Salinan akad, bukti transfer, atau bukti transaksi relevan.', isMandatory: true, sortOrder: 2 },
        { code: 'IDENTITAS_PELAPOR', name: 'Salinan KTP / Akta Kuasa Hukum Pelapor', description: 'Tanda pengenal resmi pihak pengadu atau surat kuasa khusus.', isMandatory: true, sortOrder: 3 },
        { code: 'KORESPONDENSI', name: 'Bukti Korespondensi / Tanggapan Pihak Terlapor', description: 'Upaya penyelesaian musyawarah yang telah dilakukan sebelumnya.', isMandatory: false, sortOrder: 4 },
      ],
    },
    {
      code: 'UMUM',
      name: 'Umum',
      description: 'Permohonan audiensi, konsultasi awal muamalah syariah, permintaan narasumber, atau korespondensi resmi umum lainnya ke DSN-MUI.',
      icon: 'HelpCircle',
      sortOrder: 9,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Resmi Institusi', description: 'Surat pengajuan berkop resmi instansi atau pemohon.', isMandatory: true, sortOrder: 1 },
        { code: 'TOR_AGENDA', name: 'Kerangka Acuan Kerja (TOR) / Pokok Konsultasi', description: 'Tujuan kegiatan, daftar topik pembahasan, dan susunan acara.', isMandatory: true, sortOrder: 2 },
        { code: 'KONTAK_PIC', name: 'Profil Lembaga & Kontak Person Penanggung Jawab', description: 'Informasi kontak narahubung yang dapat dihubungi.', isMandatory: true, sortOrder: 3 },
      ],
    },
  ];

  // Deactivate any legacy submission types
  await prisma.submissionTypeMaster.updateMany({
    where: {
      code: {
        notIn: submissionTypes.map((t) => t.code),
      },
    },
    data: { isActive: false },
  });

  for (const t of submissionTypes) {
    const typeRecord = await prisma.submissionTypeMaster.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        description: t.description,
        icon: t.icon,
        sortOrder: t.sortOrder,
        isActive: true,
      },
      create: {
        code: t.code,
        name: t.name,
        description: t.description,
        icon: t.icon,
        sortOrder: t.sortOrder,
        isActive: true,
      },
    });

    for (const r of t.requirements) {
      const existingReq = await prisma.submissionRequirementMaster.findFirst({
        where: { submissionTypeId: typeRecord.id, code: r.code },
      });

      if (existingReq) {
        await prisma.submissionRequirementMaster.update({
          where: { id: existingReq.id },
          data: {
            name: r.name,
            description: r.description,
            isMandatory: r.isMandatory,
            sortOrder: r.sortOrder,
          },
        });
      } else {
        await prisma.submissionRequirementMaster.create({
          data: {
            submissionTypeId: typeRecord.id,
            code: r.code,
            name: r.name,
            description: r.description,
            isMandatory: r.isMandatory,
            sortOrder: r.sortOrder,
          },
        });
      }
    }
  }

  // 2. Create Demo Companies & PICs for testing
  console.log('🏢 Seeding Demo Company...');
  const demoCompany = await prisma.company.upsert({
    where: { id: 'comp-demo-001' },
    update: {},
    create: {
      id: 'comp-demo-001',
      name: 'PT Bank Syariah Nusantara Mandiri',
      legalType: 'PT',
      legalityNumber: 'AHU-0019283.AH.01.01.TAHUN.2021',
      npwp: '01.234.567.8-012.000',
      address: 'Jl. Jenderal Sudirman Kav. 52-53, Kawasan SCBD, Senayan',
      province: 'DKI Jakarta',
      city: 'Jakarta Selatan',
      postalCode: '12190',
      phone: '021-52998877',
      email: 'pic.syariah@nusantarabank.co.id',
      website: 'https://nusantarabank.co.id',
    },
  });

  const demoUser = await prisma.companyUser.upsert({
    where: { id: 'cuser-demo-001' },
    update: {},
    create: {
      id: 'cuser-demo-001',
      companyId: demoCompany.id,
      email: 'demo@perusahaan.id',
      fullName: 'Ahmad Fauzi, M.E.Sy.',
      position: 'Head of Sharia Product Development',
      phone: '081288990011',
      role: 'ADMIN',
      isActive: true,
    },
  });

  // 3. Create Sample Submissions for Demo Company
  console.log('📄 Seeding Sample Submissions...');

  // Submission 1: Completed with Certificate
  const typeKesesuaian = await prisma.submissionTypeMaster.findUnique({ where: { code: 'KESESUAIAN_SYARIAH' } });
  const sub1 = await prisma.publicSubmission.upsert({
    where: { submissionNumber: 'AMN-2026-000101' },
    update: {},
    create: {
      submissionNumber: 'AMN-2026-000101',
      companyId: demoCompany.id,
      applicantUserId: demoUser.id,
      submissionTypeId: typeKesesuaian?.id,
      submissionTypeName: 'Permohonan Pernyataan Kesesuaian Syariah',
      title: 'Permohonan Kesesuaian Syariah Produk Pembiayaan Sindikasi Infrastruktur Hijau (Green Sukuk Murabahah)',
      productOrServiceName: 'Pembiayaan Hijau Nusantara iB',
      description: 'Produk pembiayaan berjangka untuk pembiayaan proyek energi terbarukan dengan menggunakan akad Murabahah bil Wakalah dan Ijarah Muntahiyah Bittamlik.',
      companyLetterNumber: 'DIR/BSN/VIII/2026/0442',
      companyLetterDate: new Date('2026-08-01'),
      officialLetterUrl: '/images/kop-surat.png',
      officialLetterName: 'Surat_Permohonan_Kesesuaian_Syariah_DIR_0442.pdf',
      officialLetterSize: 1845000,
      status: 'SERTIFIKAT_DITERBITKAN',
      stepCompleted: 5,
      submittedAt: new Date('2026-08-02'),
    },
  });

  // Attach Documents to Sub 1
  await prisma.publicSubmissionDocument.createMany({
    data: [
      {
        submissionId: sub1.id,
        requirementName: 'Surat Permohonan Resmi Direksi',
        fileName: 'Surat_Permohonan_DIR_0442.pdf',
        fileUrl: '/images/kop-surat.png',
        fileSize: 1845000,
        mimeType: 'application/pdf',
        isMandatory: true,
        status: 'VALID',
      },
      {
        submissionId: sub1.id,
        requirementName: 'Akta Pendirian & Izin Usaha (OJK/BI)',
        fileName: 'Salinan_Akta_Legalitas_OJK.pdf',
        fileUrl: '/images/kop-surat.png',
        fileSize: 3420000,
        mimeType: 'application/pdf',
        isMandatory: true,
        status: 'VALID',
      },
      {
        submissionId: sub1.id,
        requirementName: 'Deskripsi & Spesifikasi Produk/Layanan',
        fileName: 'Spesifikasi_Produk_Green_Sukuk_iB.pdf',
        fileUrl: '/images/kop-surat.png',
        fileSize: 5210000,
        mimeType: 'application/pdf',
        isMandatory: true,
        status: 'VALID',
      },
      {
        submissionId: sub1.id,
        requirementName: 'Draf Perjanjian / Kontrak Akad Nasabah',
        fileName: 'Draft_Akad_Murabahah_Sindikasi.docx',
        fileUrl: '/images/kop-surat.png',
        fileSize: 840000,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        isMandatory: true,
        status: 'VALID',
      },
    ],
    skipDuplicates: true,
  });

  // Timeline for Sub 1
  await prisma.publicSubmissionActivity.createMany({
    data: [
      {
        submissionId: sub1.id,
        title: 'Pengajuan Berhasil Dikirim',
        description: 'Permohonan kesesuaian syariah telah diterima secara resmi oleh DSN-MUI.',
        publicStatus: 'Pengajuan Terkirim',
        performedByName: 'Sistem Amanah',
        createdAt: new Date('2026-08-02T09:30:00Z'),
      },
      {
        submissionId: sub1.id,
        title: 'Verifikasi Administrasi Selesai',
        description: 'Seluruh dokumen persyaratan lengkap dan valid sesuai pedoman DSN-MUI.',
        publicStatus: 'Verifikasi Administrasi',
        performedByName: 'Sekretariat DSN-MUI',
        createdAt: new Date('2026-08-04T14:15:00Z'),
      },
      {
        submissionId: sub1.id,
        title: 'Rapat Pleno Pembahasan Syariah',
        description: 'Kajian fikih muamalah telah dibahas dalam Sidang Pleno Badan Pengurus Harian DSN-MUI.',
        publicStatus: 'Dalam Pembahasan',
        performedByName: 'BPH DSN-MUI',
        createdAt: new Date('2026-08-10T11:00:00Z'),
      },
      {
        submissionId: sub1.id,
        title: 'Pernyataan Kesesuaian Syariah Disetujui',
        description: 'Sidang menetapkan bahwa skema produk telah memenuhi ketentuan Fatwa DSN-MUI.',
        publicStatus: 'Disetujui',
        performedByName: 'Ketua BPH DSN-MUI',
        createdAt: new Date('2026-08-15T16:00:00Z'),
      },
      {
        submissionId: sub1.id,
        title: 'Sertifikat Kesesuaian Syariah Diterbitkan',
        description: 'Sertifikat resmi bernomor DSN-MUI/KS/VIII/2026/0042 telah diterbitkan secara elektronik dan dapat diunduh.',
        publicStatus: 'Sertifikat Diterbitkan',
        performedByName: 'Sekretariat DSN-MUI',
        createdAt: new Date('2026-08-18T10:00:00Z'),
      },
    ],
    skipDuplicates: true,
  });

  // Certificate for Sub 1
  await prisma.shariaCertificate.upsert({
    where: { certificateNumber: 'DSN-MUI/KS/VIII/2026/0042' },
    update: {},
    create: {
      submissionId: sub1.id,
      companyId: demoCompany.id,
      certificateNumber: 'DSN-MUI/KS/VIII/2026/0042',
      title: 'Sertifikat Kesesuaian Syariah untuk Pembiayaan Hijau Nusantara iB',
      issueDate: new Date('2026-08-18'),
      validUntil: new Date('2029-08-18'),
      fileUrl: '/images/kop-surat.png',
      fileName: 'Sertifikat_Kesesuaian_Syariah_DSN_MUI_0042.pdf',
      fileSize: 1205000,
    },
  });

  // Submission 2: Need Revision (Action Required)
  const sub2 = await prisma.publicSubmission.upsert({
    where: { submissionNumber: 'AMN-2026-000102' },
    update: {},
    create: {
      submissionNumber: 'AMN-2026-000102',
      companyId: demoCompany.id,
      applicantUserId: demoUser.id,
      submissionTypeId: typeKesesuaian?.id,
      submissionTypeName: 'Permohonan Pernyataan Kesesuaian Syariah',
      title: 'Pengajuan Layanan Pembiayaan Modal Kerja UMKM Digital (Nusantara PayLater Syariah)',
      productOrServiceName: 'Nusantara PayLater Syariah',
      description: 'Layanan pembiayaan invoice financing dan talangan belanja produktif UMKM dengan skema Qardh dan Murabahah digital.',
      companyLetterNumber: 'DIR/BSN/VIII/2026/0458',
      companyLetterDate: new Date('2026-08-10'),
      officialLetterUrl: '/images/kop-surat.png',
      officialLetterName: 'Surat_Permohonan_PayLater_Syariah.pdf',
      officialLetterSize: 1540000,
      status: 'PERLU_PERBAIKAN',
      stepCompleted: 4,
      submittedAt: new Date('2026-08-11'),
    },
  });

  await prisma.publicSubmissionDocument.createMany({
    data: [
      {
        submissionId: sub2.id,
        requirementName: 'Surat Permohonan Resmi Direksi',
        fileName: 'Surat_Permohonan_DIR_0458.pdf',
        fileUrl: '/images/kop-surat.png',
        fileSize: 1540000,
        mimeType: 'application/pdf',
        isMandatory: true,
        status: 'VALID',
      },
      {
        submissionId: sub2.id,
        requirementName: 'Business Model & Skema Alur Dana (Flowchart)',
        fileName: 'Flowchart_Alur_Transaksi_PayLater.pdf',
        fileUrl: '/images/kop-surat.png',
        fileSize: 2200000,
        mimeType: 'application/pdf',
        isMandatory: true,
        status: 'REVISION_REQUIRED',
        notes: 'Perjelas batas waktu penyaluran dana talangan dan pembebanan ujrah.',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.publicSubmissionActivity.createMany({
    data: [
      {
        submissionId: sub2.id,
        title: 'Pengajuan Berhasil Dikirim',
        description: 'Permohonan telah terkirim dan diterima oleh tim sekretariat.',
        publicStatus: 'Pengajuan Terkirim',
        performedByName: 'Sistem Amanah',
        createdAt: new Date('2026-08-11T10:00:00Z'),
      },
      {
        submissionId: sub2.id,
        title: 'Catatan Verifikasi Administrasi',
        description: 'Dibutuhkan revisi pada bagan alur transaksi dan penegasan klausul denda keterlambatan (ta’zir/ta’widh).',
        publicStatus: 'Perlu Perbaikan',
        performedByName: 'Tim Verifikator Syariah DSN-MUI',
        createdAt: new Date('2026-08-14T13:40:00Z'),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.publicSubmissionRevision.create({
    data: {
      submissionId: sub2.id,
      requestNotes: 'Mohon perbarui bagan alur dana (flowchart) dengan menegaskan bahwa dana denda keterlambatan (ta’zir) sepenuhnya disalurkan untuk dana sosial/kebajikan (qardh hasan) dan tidak diakui sebagai pendapatan perusahaan.',
      deadline: new Date('2026-08-28'),
      status: 'PENDING',
    },
  });

  // Submission 3: In Discussion
  const sub3 = await prisma.publicSubmission.upsert({
    where: { submissionNumber: 'AMN-2026-000103' },
    update: {},
    create: {
      submissionNumber: 'AMN-2026-000103',
      companyId: demoCompany.id,
      applicantUserId: demoUser.id,
      submissionTypeId: typeKesesuaian?.id,
      submissionTypeName: 'Permohonan Pernyataan Kesesuaian Syariah',
      title: 'Permohonan Kesesuaian Syariah Tabungan Haji Berencana Kuota Fleksibel',
      productOrServiceName: 'Tabungan Mabrur Fleksi iB',
      description: 'Produk tabungan rencana haji berbasis akad Wadiah Yad Dhamanah dengan opsi setoran berkala otomatis.',
      companyLetterNumber: 'DIR/BSN/VIII/2026/0471',
      companyLetterDate: new Date('2026-08-16'),
      officialLetterUrl: '/images/kop-surat.png',
      officialLetterName: 'Surat_Permohonan_Mabrur_Fleksi.pdf',
      officialLetterSize: 1620000,
      status: 'DALAM_PEMBAHASAN',
      stepCompleted: 5,
      submittedAt: new Date('2026-08-17'),
    },
  });

  await prisma.publicSubmissionActivity.createMany({
    data: [
      {
        submissionId: sub3.id,
        title: 'Pengajuan Berhasil Dikirim',
        description: 'Permohonan diterima oleh sistem.',
        publicStatus: 'Pengajuan Terkirim',
        performedByName: 'Sistem Amanah',
        createdAt: new Date('2026-08-17T08:30:00Z'),
      },
      {
        submissionId: sub3.id,
        title: 'Verifikasi Dokumen Lengkap',
        description: 'Seluruh berkas persyaratan telah dinyatakan lengkap.',
        publicStatus: 'Verifikasi Administrasi',
        performedByName: 'Sekretariat DSN-MUI',
        createdAt: new Date('2026-08-19T11:20:00Z'),
      },
      {
        submissionId: sub3.id,
        title: 'Masuk Agenda Rapat BPH',
        description: 'Pengajuan dijadwalkan untuk dibahas dalam Sidang Tim Ahli Perbankan Syariah DSN-MUI.',
        publicStatus: 'Dalam Pembahasan',
        performedByName: 'BPH DSN-MUI',
        createdAt: new Date('2026-08-20T15:00:00Z'),
      },
    ],
    skipDuplicates: true,
  });

  // Notifications for demo company
  await prisma.publicNotification.createMany({
    data: [
      {
        companyId: demoCompany.id,
        userId: demoUser.id,
        title: 'Permintaan Perbaikan Dokumen',
        message: 'Pengajuan AMN-2026-000102 memerlukan revisi pada dokumen alur transaksi. Batas waktu hingga 28 Agustus 2026.',
        type: 'ACTION_REQUIRED',
        link: `/submissions/${sub2.id}`,
        isRead: false,
      },
      {
        companyId: demoCompany.id,
        userId: demoUser.id,
        title: 'Sertifikat Kesesuaian Syariah Siap Diunduh',
        message: 'Sertifikat resmi untuk Pembiayaan Hijau Nusantara iB (AMN-2026-000101) telah terbit.',
        type: 'SUCCESS',
        link: `/submissions/${sub1.id}`,
        isRead: false,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeding Amanah Public Portal Master Data & Demo Data completed!');
}

seedPublicPortal()
  .catch((e) => {
    console.error('❌ Error seeding public portal data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
