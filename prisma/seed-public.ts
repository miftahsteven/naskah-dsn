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

  // 1. Submission Types & Requirements Master Data
  const submissionTypes = [
    {
      code: 'BANK_SYARIAH',
      name: 'Perbankan & Lembaga Keuangan Syariah',
      description: 'Pengajuan kesesuaian syariah untuk produk penghimpunan dana, pembiayaan, treasury, trade finance, dan layanan digital perbankan syariah.',
      icon: 'Building2',
      sortOrder: 1,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Resmi Direksi', description: 'Surat resmi bertanda tangan direksi dan stempel basah/TTE perusahaan.', isMandatory: true, sortOrder: 1 },
        { code: 'LEGALITAS_PERUSAHAAN', name: 'Akta Pendirian & Izin Usaha (OJK/BI)', description: 'Salinan Akta Notaris, SK Kemenkumham, NIB, dan Izin Operasional Lembaga.', isMandatory: true, sortOrder: 2 },
        { code: 'PROFIL_PRODUK', name: 'Deskripsi & Spesifikasi Produk/Layanan', description: 'Dokumen penjelasan fitur, skema akad syariah, flow transaksi, dan simulasi perhitungan margin/bagi hasil.', isMandatory: true, sortOrder: 3 },
        { code: 'DRAFT_AKAD', name: 'Draf Perjanjian / Kontrak Akad Nasabah', description: 'Format baku akad/perjanjian yang akan ditandatangani oleh nasabah.', isMandatory: true, sortOrder: 4 },
        { code: 'OPINI_DPS', name: 'Rekomendasi / Opini DPS Internal', description: 'Hasil review dan persetujuan awal dari Dewan Pengawas Syariah internal lembaga.', isMandatory: false, sortOrder: 5 },
        { code: 'SOP_PRODUK', name: 'Standar Operasional Prosedur (SOP)', description: 'Manual operasional penanganan produk oleh unit kerja terkait.', isMandatory: false, sortOrder: 6 },
      ],
    },
    {
      code: 'FINTECH_SYARIAH',
      name: 'Fintech & P2P Lending Syariah',
      description: 'Permohonan kesesuaian syariah untuk platform teknologi finansial, P2P lending, payment gateway, e-wallet, dan equity crowdfunding syariah.',
      icon: 'SmartphoneNfc',
      sortOrder: 2,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Resmi Direksi', description: 'Surat resmi permohonan opini/sertifikasi kesesuaian syariah dari direksi.', isMandatory: true, sortOrder: 1 },
        { code: 'LEGALITAS_PLATFORM', name: 'Legalitas PT, NIB & Tanda Daftar OJK/Kominfo', description: 'Salinan izin usaha fintech berizin/terdaftar di OJK dan PSE Kominfo.', isMandatory: true, sortOrder: 2 },
        { code: 'BUSINESS_MODEL', name: 'Business Model & Skema Alur Dana (Flowchart)', description: 'Diagram terperinci mengenai aliran dana (fund flow), biaya administrasi (ujrah), dan batas tanggung jawab.', isMandatory: true, sortOrder: 3 },
        { code: 'DRAFT_ELEKTRONIK_AKAD', name: 'Draf Akad Elektronik & Terms of Service', description: 'Ketentuan layanan elektronik dan klausul akad (Wakalah bil Ujrah, Murabahah, Musyarakah, dll).', isMandatory: true, sortOrder: 4 },
        { code: 'SECURITY_AUDIT', name: 'Sertifikat Keamanan Sistem (ISO 27001)', description: 'Bukti sertifikasi keamanan informasi sistem elektronik.', isMandatory: false, sortOrder: 5 },
      ],
    },
    {
      code: 'PASAR_MODAL_SYARIAH',
      name: 'Pasar Modal & Investasi Syariah',
      description: 'Pengajuan kesesuaian syariah untuk penerbitan Sukuk, Reksa Dana Syariah, Efek Beragun Aset Syariah, dan instrumen pasar modal lainnya.',
      icon: 'TrendingUp',
      sortOrder: 3,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Penerbitan Sukuk / Reksa Dana', description: 'Surat resmi pengajuan kepada DSN-MUI.', isMandatory: true, sortOrder: 1 },
        { code: 'PROSPEKTUS_RINGKAS', name: 'Draf Prospektus / Dokumen Penawaran', description: 'Prospektus penerbitan instrumen investasi syariah.', isMandatory: true, sortOrder: 2 },
        { code: 'DOKUMEN_UNDERLYING', name: 'Legalitas & Bukti Kepemilikan Aset Underlying', description: 'Dokumen hak milik atas aset berwujud/jasa yang menjadi dasar akad (underlying asset).', isMandatory: true, sortOrder: 3 },
        { code: 'DRAFT_PERJANJIAN_WALI_AMANAT', name: 'Draf Perjanjian Perwaliamanatan / Kustodian', description: 'Kontrak kerja sama dengan bank kustodian atau wali amanat.', isMandatory: true, sortOrder: 4 },
        { code: 'LEGAL_OPINION', name: 'Pendapat Hukum (Legal Opinion) Konsultan', description: 'Kajian hukum dari konsultan hukum terdaftar OJK.', isMandatory: false, sortOrder: 5 },
      ],
    },
    {
      code: 'ASURANSI_SYARIAH',
      name: 'Asuransi & Reasuransi Syariah',
      description: 'Kesesuaian syariah untuk produk asuransi jiwa, asuransi umum, dana tabarru, investasi unit link syariah, dan reasuransi syariah.',
      icon: 'Shield',
      sortOrder: 4,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Resmi Direksi', description: 'Surat permohonan persetujuan produk asuransi syariah.', isMandatory: true, sortOrder: 1 },
        { code: 'POLIS_DAN_AKAD', name: 'Draf Polis & Klausul Akad Tabarru/Tijarah', description: 'Rancangan polis asuransi memuat akad Tabarru, Wakalah bil Ujrah, atau Mudharabah.', isMandatory: true, sortOrder: 2 },
        { code: 'LAPORAN_AKTUARIA', name: 'Ringkasan Laporan Aktuaria Produk', description: 'Kajian aktuaria terkait pengelolaan risiko dan dana kebajikan.', isMandatory: true, sortOrder: 3 },
        { code: 'REKOMENDASI_DPS', name: 'Surat Rekomendasi DPS Perusahaan', description: 'Persetujuan dari Dewan Pengawas Syariah internal.', isMandatory: false, sortOrder: 4 },
      ],
    },
    {
      code: 'BISNIS_DAN_WISATA_HALAL',
      name: 'Hotel, Rumah Sakit & Wisata Halal',
      description: 'Sertifikasi kesesuaian syariah untuk operasional hotel ramah muslim, rumah sakit syariah, biro perjalanan umrah/haji, dan destinasi wisata halal.',
      icon: 'Hotel',
      sortOrder: 5,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Sertifikasi', description: 'Surat pengajuan kesesuaian syariah unit bisnis.', isMandatory: true, sortOrder: 1 },
        { code: 'LEGALITAS_USAHA', name: 'NIB, Izin Usaha Pariwisata / Izin Operasional RS', description: 'Kelengkapan perizinan operasional instansi.', isMandatory: true, sortOrder: 2 },
        { code: 'MANUAL_SYARIAH', name: 'Pedoman Standar Pelayanan Syariah (SOP)', description: 'Manual implementasi prinsip syariah dalam fasilitas, makanan halal, keuangan, dan pelayanan.', isMandatory: true, sortOrder: 3 },
        { code: 'DAFTAR_FASILITAS', name: 'Denah & Inventaris Fasilitas Ibadah / Higienitas', description: 'Foto/layout musala, arah kiblat, toilet bersih, dan dapur halal.', isMandatory: true, sortOrder: 4 },
      ],
    },
    {
      code: 'PRODUK_KONSUMEN_SYARIAH',
      name: 'Multi Level Marketing & Bisnis Syariah',
      description: 'Kesesuaian syariah untuk skema Penjualan Langsung Berjenjang Syariah (PLBS / MLM Syariah), e-commerce syariah, dan koperasi syariah.',
      icon: 'ShoppingBag',
      sortOrder: 6,
      requirements: [
        { code: 'SURAT_PERMOHONAN', name: 'Surat Permohonan Kesesuaian Syariah', description: 'Surat resmi dari direksi perusahaan.', isMandatory: true, sortOrder: 1 },
        { code: 'MARKETING_PLAN', name: 'Marketing Plan & Skema Komisi / Reward', description: 'Penjelasan terperinci mengenai bonus, pembagian keuntungan, serta pencegahan unsur maisir/gharar/maysir.', isMandatory: true, sortOrder: 2 },
        { code: 'SERTIFIKAT_HALAL_PRODUK', name: 'Sertifikat Halal Produk (BPJPH)', description: 'Daftar produk yang diperdagangkan beserta sertifikat halal resminya.', isMandatory: true, sortOrder: 3 },
        { code: 'KODE_ETIK_DISTRIBUTOR', name: 'Kode Etik Mitra / Distributor', description: 'Aturan perilaku dan perlindungan konsumen.', isMandatory: false, sortOrder: 4 },
      ],
    },
  ];

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
  const typeBank = await prisma.submissionTypeMaster.findUnique({ where: { code: 'BANK_SYARIAH' } });
  const sub1 = await prisma.publicSubmission.upsert({
    where: { submissionNumber: 'AMN-2026-000101' },
    update: {},
    create: {
      submissionNumber: 'AMN-2026-000101',
      companyId: demoCompany.id,
      applicantUserId: demoUser.id,
      submissionTypeId: typeBank?.id,
      submissionTypeName: 'Perbankan & Lembaga Keuangan Syariah',
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
  const typeFintech = await prisma.submissionTypeMaster.findUnique({ where: { code: 'FINTECH_SYARIAH' } });
  const sub2 = await prisma.publicSubmission.upsert({
    where: { submissionNumber: 'AMN-2026-000102' },
    update: {},
    create: {
      submissionNumber: 'AMN-2026-000102',
      companyId: demoCompany.id,
      applicantUserId: demoUser.id,
      submissionTypeId: typeFintech?.id,
      submissionTypeName: 'Fintech & P2P Lending Syariah',
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
      submissionTypeId: typeBank?.id,
      submissionTypeName: 'Perbankan & Lembaga Keuangan Syariah',
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
