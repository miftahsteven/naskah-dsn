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

export default router;
