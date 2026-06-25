import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';

const router = Router();

// ── DEFAULT TEMPLATES (seeded on demand) ─────────────────────────────────────

const DEFAULT_TEMPLATES = [
  {
    name: 'Pernyataan Kesesuaian Syariah',
    code: 'PKS-SYARIAH',
    category: 'Pernyataan',
    description:
      'Template surat Pernyataan Kesesuaian Syariah untuk disampaikan kepada pihak terkait, termasuk nomor surat, perihal, dan isi pernyataan yang dinamis.',
    htmlContent: `<div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 750px; margin: auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="font-size: 14pt; margin: 0; text-transform: uppercase; letter-spacing: 1px;">DEWAN SYARIAH NASIONAL</h2>
    <h2 style="font-size: 14pt; margin: 0; text-transform: uppercase;">MAJELIS ULAMA INDONESIA</h2>
    <hr style="border: 2px solid #006633; margin: 8px 0;" />
    <p style="font-size: 10pt; color: #555; margin: 0;">Jl. Dempo No.19 Pegangsaan, Jakarta Pusat 10320 | Telp. (021) 3190-4146</p>
  </div>

  <table style="width: 100%; font-size: 12pt; margin-bottom: 20px;">
    <tr>
      <td style="width: 140px; vertical-align: top;">Nomor</td>
      <td style="width: 10px; vertical-align: top;">:</td>
      <td><strong>{{nomorSurat}}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top;">Lampiran</td>
      <td style="vertical-align: top;">:</td>
      <td>{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top;">Perihal</td>
      <td style="vertical-align: top;">:</td>
      <td><strong>{{perihal}}</strong></td>
    </tr>
  </table>

  <p style="margin-bottom: 4px;">Kepada Yth.</p>
  <p style="margin-bottom: 4px;"><strong>{{namaLembaga}}</strong></p>
  <p style="margin-bottom: 20px;">{{alamatLembaga}}</p>

  <p style="margin-bottom: 10px;"><em>Assalamu'alaikum Wr. Wb.</em></p>

  <p style="text-align: justify; margin-bottom: 10px;">
    Sehubungan dengan permohonan kesesuaian syariah atas <strong>{{namaTransaksi}}</strong>
    yang diajukan oleh <strong>{{namaPemohon}}</strong> pada tanggal <strong>{{tanggalPermohonan}}</strong>,
    dengan ini Dewan Syariah Nasional – Majelis Ulama Indonesia (DSN-MUI) menyatakan bahwa:
  </p>

  <ol style="text-align: justify; margin-bottom: 10px; padding-left: 20px;">
    <li style="margin-bottom: 8px;">
      <strong>{{namaTransaksi}}</strong> yang dilaksanakan oleh <strong>{{namaPelaksana}}</strong>
      <strong>telah sesuai dengan ketentuan syariah</strong> berdasarkan fatwa DSN-MUI
      Nomor <strong>{{nomorFatwa}}</strong> tentang <strong>{{judulFatwa}}</strong>.
    </li>
    <li style="margin-bottom: 8px;">
      Transaksi sebagaimana dimaksud pada angka 1 dilaksanakan dalam rangka <strong>{{tujuanTransaksi}}</strong>
      dengan nilai transaksi sebesar <strong>{{nilaiTransaksi}}</strong>.
    </li>
    <li style="margin-bottom: 8px;">
      Pernyataan ini berlaku sejak tanggal ditetapkan dan dapat ditinjau ulang apabila terdapat
      perubahan atas ketentuan syariah yang relevan.
    </li>
  </ol>

  <p style="text-align: justify; margin-bottom: 20px;">
    Demikian Pernyataan Kesesuaian Syariah ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya.
  </p>

  <p style="margin-bottom: 4px;"><em>Wassalamu'alaikum Wr. Wb.</em></p>

  <div style="margin-top: 30px;">
    <p style="margin-bottom: 4px;">Jakarta, {{tanggalSurat}}</p>
    <p style="margin-bottom: 0;"><strong>DEWAN SYARIAH NASIONAL – MAJELIS ULAMA INDONESIA</strong></p>
    <p style="margin-bottom: 0;">Ketua,</p>
    <br /><br /><br />
    <p style="margin-bottom: 0;"><strong>{{namaKetua}}</strong></p>
  </div>
</div>`,
    variables: [
      { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'B-0001/DSN-MUI/VI/2026' },
      { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-' },
      { key: 'perihal', label: 'Perihal', type: 'text', required: true, placeholder: 'Pernyataan Kesesuaian Syariah atas ...' },
      { key: 'namaLembaga', label: 'Nama Lembaga Tujuan', type: 'text', required: true, placeholder: 'Direktur Jenderal ...' },
      { key: 'alamatLembaga', label: 'Alamat Lembaga', type: 'textarea', required: true, placeholder: 'Di-\nTempat' },
      { key: 'namaTransaksi', label: 'Nama Transaksi / Produk', type: 'text', required: true, placeholder: 'Sukuk Internasional Tahun 2026' },
      { key: 'namaPemohon', label: 'Nama Pemohon', type: 'text', required: true, placeholder: 'DJPPR Kementerian Keuangan RI' },
      { key: 'tanggalPermohonan', label: 'Tanggal Permohonan', type: 'date', required: true },
      { key: 'namaPelaksana', label: 'Nama Pelaksana / Emiten', type: 'text', required: true, placeholder: 'Pemerintah Republik Indonesia' },
      { key: 'nomorFatwa', label: 'Nomor Fatwa DSN-MUI', type: 'text', required: true, placeholder: '137/DSN-MUI/V/2020' },
      { key: 'judulFatwa', label: 'Judul Fatwa', type: 'text', required: true, placeholder: 'Sukuk' },
      { key: 'tujuanTransaksi', label: 'Tujuan Transaksi', type: 'textarea', required: true, placeholder: 'pembiayaan APBN' },
      { key: 'nilaiTransaksi', label: 'Nilai Transaksi', type: 'text', required: true, placeholder: 'USD 2.000.000.000' },
      { key: 'tanggalSurat', label: 'Tanggal Surat', type: 'date', required: true },
      { key: 'namaKetua', label: 'Nama Ketua DSN-MUI', type: 'text', required: true, placeholder: 'Prof. Dr. H. Hasanuddin AF, M.A.' },
    ],
  },
  {
    name: 'Pernyataan Keselarasan (Opini) Syariah',
    code: 'OPINI-SYARIAH',
    category: 'Opini',
    description:
      'Template surat Pernyataan Keselarasan (Opini) Syariah untuk transaksi atau kebijakan yang perlu mendapat opini kesesuaian dari DSN-MUI.',
    htmlContent: `<div style="font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; max-width: 750px; margin: auto; padding: 40px;">
  <div style="text-align: center; margin-bottom: 30px;">
    <h2 style="font-size: 14pt; margin: 0; text-transform: uppercase; letter-spacing: 1px;">DEWAN SYARIAH NASIONAL</h2>
    <h2 style="font-size: 14pt; margin: 0; text-transform: uppercase;">MAJELIS ULAMA INDONESIA</h2>
    <hr style="border: 2px solid #006633; margin: 8px 0;" />
    <p style="font-size: 10pt; color: #555; margin: 0;">Jl. Dempo No.19 Pegangsaan, Jakarta Pusat 10320 | Telp. (021) 3190-4146</p>
  </div>

  <table style="width: 100%; font-size: 12pt; margin-bottom: 20px;">
    <tr>
      <td style="width: 140px; vertical-align: top;">Nomor</td>
      <td style="width: 10px; vertical-align: top;">:</td>
      <td><strong>{{nomorSurat}}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top;">Lampiran</td>
      <td style="vertical-align: top;">:</td>
      <td>{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top;">Perihal</td>
      <td style="vertical-align: top;">:</td>
      <td><strong>Opini Syariah atas {{perihal}}</strong></td>
    </tr>
  </table>

  <p style="margin-bottom: 4px;">Kepada Yth.</p>
  <p style="margin-bottom: 4px;"><strong>{{namaLembaga}}</strong></p>
  <p style="margin-bottom: 20px;">{{alamatLembaga}}</p>

  <p style="margin-bottom: 10px;"><em>Assalamu'alaikum Wr. Wb.</em></p>

  <p style="text-align: justify; margin-bottom: 10px;">
    Menanggapi surat/permohonan dari <strong>{{namaPemohon}}</strong> Nomor <strong>{{nomorSuratPermohonan}}</strong>
    tanggal <strong>{{tanggalPermohonan}}</strong> perihal <strong>{{perihal}}</strong>,
    setelah melakukan kajian mendalam, dengan ini DSN-MUI menyampaikan Opini Syariah sebagai berikut:
  </p>

  <p style="text-align: justify; font-weight: bold; margin-bottom: 6px;">A. Deskripsi Transaksi</p>
  <p style="text-align: justify; margin-bottom: 14px;">{{deskripsiTransaksi}}</p>

  <p style="text-align: justify; font-weight: bold; margin-bottom: 6px;">B. Dasar Hukum Syariah</p>
  <p style="text-align: justify; margin-bottom: 6px;">
    Transaksi dimaksud merujuk pada ketentuan syariah berdasarkan:
  </p>
  <ol style="margin-bottom: 14px; padding-left: 20px;">
    <li>Al-Qur'an dan Hadis yang relevan;</li>
    <li>Fatwa DSN-MUI Nomor <strong>{{nomorFatwa}}</strong> tentang <strong>{{judulFatwa}}</strong>;</li>
    <li>{{dasarHukumTambahan}}</li>
  </ol>

  <p style="text-align: justify; font-weight: bold; margin-bottom: 6px;">C. Opini Syariah</p>
  <p style="text-align: justify; margin-bottom: 10px;">
    Berdasarkan kajian dan analisis syariah yang telah dilakukan, DSN-MUI berpendapat bahwa
    <strong>{{namaTransaksi}}</strong> yang dilaksanakan oleh <strong>{{namaPelaksana}}</strong>
    <strong>selaras dengan prinsip-prinsip syariah</strong>, dengan catatan dan persyaratan sebagai berikut:
  </p>
  <ol style="text-align: justify; margin-bottom: 14px; padding-left: 20px;">
    <li style="margin-bottom: 8px;">{{syaratSatu}}</li>
    <li style="margin-bottom: 8px;">{{syaratDua}}</li>
    <li style="margin-bottom: 8px;">Apabila di kemudian hari terdapat perubahan atas struktur transaksi, maka perlu dilakukan
      kajian ulang untuk memastikan keselarasan dengan ketentuan syariah yang berlaku.</li>
  </ol>

  <p style="text-align: justify; margin-bottom: 20px;">
    Demikian Opini Syariah ini kami sampaikan untuk menjadi perhatian dan dapat dipergunakan sebagaimana mestinya.
  </p>

  <p style="margin-bottom: 4px;"><em>Wassalamu'alaikum Wr. Wb.</em></p>

  <div style="margin-top: 30px;">
    <p style="margin-bottom: 4px;">Jakarta, {{tanggalSurat}}</p>
    <p style="margin-bottom: 0;"><strong>DEWAN SYARIAH NASIONAL – MAJELIS ULAMA INDONESIA</strong></p>
    <div style="display: flex; gap: 80px; margin-top: 8px;">
      <div>
        <p style="margin-bottom: 0;">Ketua,</p>
        <br /><br /><br />
        <p style="margin-bottom: 0;"><strong>{{namaKetua}}</strong></p>
      </div>
      <div>
        <p style="margin-bottom: 0;">Sekretaris,</p>
        <br /><br /><br />
        <p style="margin-bottom: 0;"><strong>{{namaSekretaris}}</strong></p>
      </div>
    </div>
  </div>
</div>`,
    variables: [
      { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'B-0001/DSN-MUI/VI/2026' },
      { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-' },
      { key: 'perihal', label: 'Perihal / Nama Transaksi', type: 'text', required: true, placeholder: 'Transaksi Cross Switching SUN dengan SBSN' },
      { key: 'namaLembaga', label: 'Nama Lembaga Tujuan', type: 'text', required: true, placeholder: 'Kepala Departemen Ekonomi dan Keuangan Syariah' },
      { key: 'alamatLembaga', label: 'Alamat Lembaga', type: 'textarea', required: true, placeholder: 'Bank Indonesia\nDi-\nJakarta' },
      { key: 'namaPemohon', label: 'Nama / Instansi Pemohon', type: 'text', required: true, placeholder: 'DEKS Bank Indonesia' },
      { key: 'nomorSuratPermohonan', label: 'Nomor Surat Permohonan', type: 'text', required: true, placeholder: 'No. B-xxx/DEKS/xxx/2026' },
      { key: 'tanggalPermohonan', label: 'Tanggal Permohonan', type: 'date', required: true },
      { key: 'deskripsiTransaksi', label: 'Deskripsi Transaksi', type: 'textarea', required: true, placeholder: 'Penjelasan mekanisme transaksi secara rinci...' },
      { key: 'namaTransaksi', label: 'Nama Transaksi', type: 'text', required: true, placeholder: 'Cross Switching SUN dengan SBSN' },
      { key: 'namaPelaksana', label: 'Nama Pelaksana', type: 'text', required: true, placeholder: 'Bank Indonesia' },
      { key: 'nomorFatwa', label: 'Nomor Fatwa DSN-MUI', type: 'text', required: true, placeholder: '137/DSN-MUI/V/2020' },
      { key: 'judulFatwa', label: 'Judul Fatwa', type: 'text', required: true, placeholder: 'Surat Berharga Syariah Negara (SBSN)' },
      { key: 'dasarHukumTambahan', label: 'Dasar Hukum Tambahan', type: 'textarea', required: false, placeholder: 'Peraturan/regulasi lain yang relevan' },
      { key: 'syaratSatu', label: 'Syarat/Catatan Pertama', type: 'textarea', required: true, placeholder: 'Akad yang digunakan harus ...' },
      { key: 'syaratDua', label: 'Syarat/Catatan Kedua', type: 'textarea', required: true, placeholder: 'Mekanisme pelaksanaan harus ...' },
      { key: 'tanggalSurat', label: 'Tanggal Surat', type: 'date', required: true },
      { key: 'namaKetua', label: 'Nama Ketua DSN-MUI', type: 'text', required: true, placeholder: 'Prof. Dr. H. Hasanuddin AF, M.A.' },
      { key: 'namaSekretaris', label: 'Nama Sekretaris DSN-MUI', type: 'text', required: false, placeholder: 'Dr. H. Anwar Abbas, M.M., M.Ag.' },
    ],
  },
];

// ── SEED DEFAULT TEMPLATES ────────────────────────────────────────────────────
router.post('/seed', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    for (const tpl of DEFAULT_TEMPLATES) {
      await prisma.letterTemplate.upsert({
        where: { code: tpl.code },
        update: {
          name: tpl.name,
          category: tpl.category,
          description: tpl.description,
          htmlContent: tpl.htmlContent,
          variables: tpl.variables,
        },
        create: tpl,
      });
    }
    res.json({ status: 'success', message: 'Default templates seeded.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET ALL TEMPLATES ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, includeArchived } = req.query;

    const templates = await prisma.letterTemplate.findMany({
      where: {
        ...(includeArchived === 'true' ? {} : { isArchived: false }),
        ...(category && { category: String(category) }),
        ...(search && {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
            { code: { contains: String(search), mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ status: 'success', data: templates });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET SINGLE TEMPLATE ────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.letterTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!template) return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan' });
    res.json({ status: 'success', data: template });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE TEMPLATE ────────────────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, category, description, htmlContent, variables } = req.body;

    if (!name || !category || !htmlContent) {
      return res.status(400).json({ status: 'error', message: 'name, category, dan htmlContent wajib diisi' });
    }

    const template = await prisma.letterTemplate.create({
      data: {
        name,
        code: code || null,
        category,
        description: description || null,
        htmlContent,
        variables: variables || [],
        createdBy: req.user?.fullName || null,
      },
    });

    res.status(201).json({ status: 'success', data: template });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: 'Kode template sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE TEMPLATE ────────────────────────────────────────────────────────────
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, category, description, htmlContent, variables } = req.body;

    const template = await prisma.letterTemplate.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code || null }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(variables !== undefined && { variables }),
      },
    });

    res.json({ status: 'success', data: template });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan' });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── ARCHIVE TEMPLATE ───────────────────────────────────────────────────────────
router.patch('/:id/archive', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.letterTemplate.update({
      where: { id: String(req.params.id) },
      data: { isArchived: true },
    });
    res.json({ status: 'success', data: template, message: 'Template diarsipkan.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── RESTORE TEMPLATE ───────────────────────────────────────────────────────────
router.patch('/:id/restore', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.letterTemplate.update({
      where: { id: String(req.params.id) },
      data: { isArchived: false },
    });
    res.json({ status: 'success', data: template, message: 'Template dipulihkan.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
