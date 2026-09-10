import { Router } from 'express';
import type { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';

const router = Router();

// ── GET SUBMISSION TYPES & REQUIREMENTS MASTER ──────────────────────────────
router.get('/submission-types', async (_req: Request, res: Response) => {
  try {
    const types = await prisma.submissionTypeMaster.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        requirements: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    return res.json({
      status: 'success',
      data: types,
    });
  } catch (error: any) {
    console.error('[Public Master] Error fetching submission types:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat jenis pengajuan kesesuaian syariah.',
      error: error.message,
    });
  }
});

// ── GET LEGAL ENTITY TYPES ──────────────────────────────────────────────────
router.get('/legal-types', async (_req: Request, res: Response) => {
  const legalTypes = [
    { code: 'PT', name: 'Perseroan Terbatas (PT)' },
    { code: 'PT Tbk', name: 'Perseroan Terbatas Terbuka (PT Tbk)' },
    { code: 'CV', name: 'Commanditaire Vennootschap (CV)' },
    { code: 'Koperasi', name: 'Koperasi / Koperasi Syariah' },
    { code: 'Yayasan', name: 'Yayasan' },
    { code: 'BUMN', name: 'Badan Usaha Milik Negara (BUMN)' },
    { code: 'BUMD', name: 'Badan Usaha Milik Daerah (BUMD)' },
    { code: 'Lembaga', name: 'Lembaga Negara / Instansi Pemerintah' },
    { code: 'Lainnya', name: 'Bentuk Usaha Lainnya' },
  ];

  return res.json({
    status: 'success',
    data: legalTypes,
  });
});

// ── GET FAQS ────────────────────────────────────────────────────────────────
router.get('/faqs', async (_req: Request, res: Response) => {
  try {
    const faqs = [
      {
        category: 'Alur Pengajuan',
        items: [
          {
            question: 'Apa saja tahapan pengajuan kesesuaian syariah di DSN-MUI?',
            answer:
              'Tahapan terdiri dari 4 langkah utama: (1) Registrasi Akun Perusahaan & PIC melalui verifikasi OTP Email, (2) Membuat permohonan baru dengan mengisi informasi dan mengunggah surat resmi serta dokumen persyaratan, (3) Pemantauan proses secara transparan melalui timeline hingga rapat pembahasan, dan (4) Penerbitan serta pengunduhan sertifikat kesesuaian syariah resmi.',
          },
          {
            question: 'Berapa lama waktu yang dibutuhkan untuk proses pengajuan?',
            answer:
              'Waktu pemrosesan bergantung pada kelengkapan dokumen administrasi dan substansi teknis akad/produk yang diajukan. Status dan kemajuan pengajuan dapat dipantau langsung secara real-time melalui dashboard Amanah.',
          },
          {
            question: 'Bagaimana jika pengajuan saya membutuhkan perbaikan (revisi)?',
            answer:
              'Jika terdapat catatan dari tim verifikator atau rapat DSN-MUI, status pengajuan akan berubah menjadi "Perlu Perbaikan". Anda akan menerima rincian catatan revisi dan dapat langsung mengunggah dokumen pengganti melalui halaman detail pengajuan tanpa perlu mengulang dari awal.',
          },
        ],
      },
      {
        category: 'Dokumen Persyaratan',
        items: [
          {
            question: 'Format dokumen apa saja yang didukung oleh sistem?',
            answer:
              'Format berkas yang diterima adalah PDF (sangat disarankan untuk dokumen legal & surat permohonan), DOCX, XLSX, dan gambar JPG/PNG dengan ukuran berkas hingga 20 MB per dokumen.',
          },
          {
            question: 'Apakah surat permohonan harus bertanda tangan basah / TTE?',
            answer:
              'Ya, Surat Permohonan resmi wajib ditandatangani oleh pimpinan lembaga / direksi yang berwenang (dapat berupa tanda tangan basah yang discan atau tanda tangan elektronik tersertifikasi) dan dibubuhi cap resmi perusahaan.',
          },
          {
            question: 'Dapatkah saya menyimpan draf pengajuan jika berkas belum lengkap?',
            answer:
              'Ya, fitur multi-step wizard Amanah secara otomatis menyimpan draf pengajuan Anda. Anda dapat keluar kapan saja dan melanjutkan kembali dari dashboard tanpa kehilangan data yang telah diisi.',
          },
        ],
      },
      {
        category: 'Sertifikat & Keabsahan',
        items: [
          {
            question: 'Bagaimana cara memverifikasi keabsahan sertifikat yang telah terbit?',
            answer:
              'Setiap sertifikat kesesuaian syariah yang diterbitkan DSN-MUI melalui Amanah dilengkapi dengan QR Code Verifikasi Resmi dan nomor sertifikat unik yang dapat diverifikasi secara publik oleh regulator, mitra perbankan, maupun nasabah.',
          },
          {
            question: 'Apakah sertifikat fisik tetap dapat diperoleh?',
            answer:
              'Sertifikat digital yang diunduh dari portal Amanah merupakan dokumen resmi yang sah. Apabila membutuhkan salinan cetak resmi (hardcopy) dengan stempel fisik DSN-MUI, PIC perusahaan dapat berkoordinasi dengan bagian sekretariat.',
          },
        ],
      },
    ];

    return res.json({
      status: 'success',
      data: faqs,
    });
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memuat FAQ.',
      error: error.message,
    });
  }
});

// ── IN-MEMORY CACHE FOR REGIONAL DATA ─────────────────────────────────────────
const regionalCache = new Map<string, any>();

const FALLBACK_PROVINCES = [
  { id: '11', name: 'ACEH' },
  { id: '12', name: 'SUMATERA UTARA' },
  { id: '13', name: 'SUMATERA BARAT' },
  { id: '14', name: 'RIAU' },
  { id: '15', name: 'JAMBI' },
  { id: '16', name: 'SUMATERA SELATAN' },
  { id: '17', name: 'BENGKULU' },
  { id: '18', name: 'LAMPUNG' },
  { id: '19', name: 'KEPULAUAN BANGKA BELITUNG' },
  { id: '21', name: 'KEPULAUAN RIAU' },
  { id: '31', name: 'DKI JAKARTA' },
  { id: '32', name: 'JAWA BARAT' },
  { id: '33', name: 'JAWA TENGAH' },
  { id: '34', name: 'DAERAH ISTIMEWA YOGYAKARTA' },
  { id: '35', name: 'JAWA TIMUR' },
  { id: '36', name: 'BANTEN' },
  { id: '51', name: 'BALI' },
  { id: '52', name: 'NUSA TENGGARA BARAT' },
  { id: '53', name: 'NUSA TENGGARA TIMUR' },
  { id: '61', name: 'KALIMANTAN BARAT' },
  { id: '62', name: 'KALIMANTAN TENGAH' },
  { id: '63', name: 'KALIMANTAN SELATAN' },
  { id: '64', name: 'KALIMANTAN TIMUR' },
  { id: '65', name: 'KALIMANTAN UTARA' },
  { id: '71', name: 'SULAWESI UTARA' },
  { id: '72', name: 'SULAWESI TENGAH' },
  { id: '73', name: 'SULAWESI SELATAN' },
  { id: '74', name: 'SULAWESI TENGGARA' },
  { id: '75', name: 'GORONTALO' },
  { id: '76', name: 'SULAWESI BARAT' },
  { id: '81', name: 'MALUKU' },
  { id: '82', name: 'MALUKU UTARA' },
  { id: '91', name: 'PAPUA BARAT' },
  { id: '92', name: 'PAPUA' },
  { id: '93', name: 'PAPUA SELATAN' },
  { id: '94', name: 'PAPUA TENGAH' },
  { id: '95', name: 'PAPUA PEGUNUNGAN' },
  { id: '96', name: 'PAPUA BARAT DAYA' },
];

function toTitleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ── GET PROVINCES ─────────────────────────────────────────────────────────────
router.get('/provinces', async (_req: Request, res: Response) => {
  try {
    const cacheKey = 'provinces';
    if (regionalCache.has(cacheKey)) {
      return res.json({ status: 'success', data: regionalCache.get(cacheKey) });
    }

    try {
      const response = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json', {
        signal: AbortSignal.timeout(4000),
      });
      if (response.ok) {
        const raw: any = await response.json();
        const formatted = raw.map((p: any) => ({
          id: p.id,
          name: toTitleCase(p.name),
        }));
        regionalCache.set(cacheKey, formatted);
        return res.json({ status: 'success', data: formatted });
      }
    } catch {
      // fallback
    }

    const fallbackFormatted = FALLBACK_PROVINCES.map((p) => ({
      id: p.id,
      name: toTitleCase(p.name),
    }));
    return res.json({ status: 'success', data: fallbackFormatted });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: 'Gagal memuat data provinsi.' });
  }
});

// ── GET REGENCIES (KABUPATEN/KOTA) ───────────────────────────────────────────
router.get('/regencies/:provinceId', async (req: Request, res: Response) => {
  const { provinceId } = req.params;
  const cacheKey = `regencies_${provinceId}`;
  if (regionalCache.has(cacheKey)) {
    return res.json({ status: 'success', data: regionalCache.get(cacheKey) });
  }

  try {
    const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const raw: any = await response.json();
      const formatted = raw.map((r: any) => ({
        id: r.id,
        provinceId: r.province_id,
        name: toTitleCase(r.name),
      }));
      regionalCache.set(cacheKey, formatted);
      return res.json({ status: 'success', data: formatted });
    }
    return res.json({ status: 'success', data: [] });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: 'Gagal memuat data kabupaten/kota.' });
  }
});

// ── GET DISTRICTS (KECAMATAN) ────────────────────────────────────────────────
router.get('/districts/:regencyId', async (req: Request, res: Response) => {
  const { regencyId } = req.params;
  const cacheKey = `districts_${regencyId}`;
  if (regionalCache.has(cacheKey)) {
    return res.json({ status: 'success', data: regionalCache.get(cacheKey) });
  }

  try {
    const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const raw: any = await response.json();
      const formatted = raw.map((d: any) => ({
        id: d.id,
        regencyId: d.regency_id,
        name: toTitleCase(d.name),
      }));
      regionalCache.set(cacheKey, formatted);
      return res.json({ status: 'success', data: formatted });
    }
    return res.json({ status: 'success', data: [] });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: 'Gagal memuat data kecamatan.' });
  }
});

// ── GET VILLAGES (KELURAHAN/DESA) ───────────────────────────────────────────
router.get('/villages/:districtId', async (req: Request, res: Response) => {
  const { districtId } = req.params;
  const cacheKey = `villages_${districtId}`;
  if (regionalCache.has(cacheKey)) {
    return res.json({ status: 'success', data: regionalCache.get(cacheKey) });
  }

  try {
    const response = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`, {
      signal: AbortSignal.timeout(4000),
    });
    if (response.ok) {
      const raw: any = await response.json();
      const formatted = raw.map((v: any) => ({
        id: v.id,
        districtId: v.district_id,
        name: toTitleCase(v.name),
      }));
      regionalCache.set(cacheKey, formatted);
      return res.json({ status: 'success', data: formatted });
    }
    return res.json({ status: 'success', data: [] });
  } catch (error: any) {
    return res.status(500).json({ status: 'error', message: 'Gagal memuat data kelurahan.' });
  }
});

// ── GET POSTAL CODE (KODEPOS) ────────────────────────────────────────────────
router.get('/postal-code', async (req: Request, res: Response) => {
  const { district, village } = req.query;
  if (!district) {
    return res.json({ status: 'success', postalCode: '' });
  }

  const districtStr = String(district).trim();
  const villageStr = village ? String(village).trim() : '';
  const cacheKey = `postal_${districtStr}_${villageStr}`;

  if (regionalCache.has(cacheKey)) {
    return res.json({ status: 'success', postalCode: regionalCache.get(cacheKey) });
  }

  try {
    const response = await fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(districtStr)}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (response.ok) {
      const json: any = await response.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        let match = null;
        if (villageStr) {
          match = json.data.find((item: any) =>
            item.village?.toLowerCase().includes(villageStr.toLowerCase()) ||
            villageStr.toLowerCase().includes(item.village?.toLowerCase())
          );
        }
        const postalCode = String(match?.code || json.data[0].code || '');
        if (postalCode) {
          regionalCache.set(cacheKey, postalCode);
          return res.json({ status: 'success', postalCode });
        }
      }
    }
  } catch {
    // fallback
  }

  return res.json({ status: 'success', postalCode: '' });
});

export default router;
