import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

import fs from 'fs';
import path from 'path';

const kopBase64 = fs.existsSync(path.join(process.cwd(), 'public/images/kop-surat.png'))
  ? `data:image/png;base64,${fs.readFileSync(path.join(process.cwd(), 'public/images/kop-surat.png')).toString('base64')}`
  : '/images/kop-surat.png';

const bismillahBase64 = fs.existsSync(path.join(process.cwd(), 'public/images/bismillah.svg'))
  ? `data:image/svg+xml;base64,${fs.readFileSync(path.join(process.cwd(), 'public/images/bismillah.svg')).toString('base64')}`
  : '/images/bismillah.svg';

const HEADER_HTML = `<div style="text-align: center; margin-bottom: 4px; margin-left: -40px; margin-right: -40px; padding-top: 10px;">
    <img src="${kopBase64}" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 750px; height: auto; display: block; margin: 0 auto;" />
  </div>

  <!-- Bismillah Calligraphy -->
  <div style="text-align: center; margin-top: 2px; margin-bottom: 6px;">
    <img src="${bismillahBase64}" alt="Bismillah" style="height: 35px; object-fit: contain; filter: brightness(0); display: block; margin: 0 auto;" />
  </div>`;

const FULL_HTML_PKS = `<div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; max-width: 750px; margin: auto; padding: 40px;">
  ${HEADER_HTML}

  <table style="width: 100%; font-size: 11pt; margin-bottom: 20px;">
    <tr><td style="width: 140px;">Nomor</td><td style="width:10px;">:</td><td><strong>{{nomorSurat}}</strong></td></tr>
    <tr><td>Lampiran</td><td>:</td><td>{{lampiran}}</td></tr>
    <tr><td>Perihal</td><td>:</td><td><strong>{{perihal}}</strong></td></tr>
  </table>

  <p style="margin-bottom: 4px;">Kepada Yth.</p>
  <p style="margin-bottom: 4px;"><strong>{{namaLembaga}}</strong></p>
  <p style="margin-bottom: 20px; white-space: pre-line;">{{alamatLembaga}}</p>

  <p><em>Assalamu'alaikum Wr. Wb.</em></p>

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

  <p><em>Wassalamu'alaikum Wr. Wb.</em></p>

  <div style="margin-top: 30px; page-break-inside: avoid;">
    <p>Jakarta, {{tanggalSurat}}</p>
    <p><strong>DEWAN SYARIAH NASIONAL – MAJELIS ULAMA INDONESIA</strong></p>
    <p>Ketua,</p>
    <br /><br /><br />
    <p><strong>{{namaKetua}}</strong></p>
  </div>
</div>`;

const FULL_VARS_PKS = [
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'B-0442/DSN-MUI/VI/2026' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-' },
  { key: 'perihal', label: 'Perihal', type: 'text', required: true, placeholder: 'PKS Sukuk Internasional Tahun 2026' },
  { key: 'namaLembaga', label: 'Nama Lembaga Tujuan', type: 'text', required: true, placeholder: 'Direktur Jenderal Pengelolaan Pembiayaan dan Risiko' },
  { key: 'alamatLembaga', label: 'Alamat Lembaga', type: 'textarea', required: true, placeholder: 'Kementerian Keuangan RI\nDi-\nJakarta' },
  { key: 'namaTransaksi', label: 'Nama Transaksi / Produk', type: 'text', required: true, placeholder: 'Sukuk Internasional Tahun 2026' },
  { key: 'namaPemohon', label: 'Nama Pemohon', type: 'text', required: true, placeholder: 'DJPPR Kementerian Keuangan RI' },
  { key: 'tanggalPermohonan', label: 'Tanggal Permohonan', type: 'date', required: true },
  { key: 'namaPelaksana', label: 'Nama Pelaksana / Emiten', type: 'text', required: true, placeholder: 'Pemerintah Republik Indonesia' },
  { key: 'nomorFatwa', label: 'Nomor Fatwa DSN-MUI', type: 'text', required: true, placeholder: '137/DSN-MUI/V/2020' },
  { key: 'judulFatwa', label: 'Judul Fatwa', type: 'text', required: true, placeholder: 'Sukuk' },
  { key: 'tujuanTransaksi', label: 'Tujuan Transaksi', type: 'textarea', required: true, placeholder: 'pembiayaan APBN Tahun 2026' },
  { key: 'nilaiTransaksi', label: 'Nilai Transaksi', type: 'text', required: true, placeholder: 'USD 2.000.000.000 (dua miliar Dollar Amerika Serikat)' },
  { key: 'tanggalSurat', label: 'Tanggal Surat', type: 'date', required: true },
  { key: 'namaKetua', label: 'Nama Ketua DSN-MUI', type: 'text', required: true, placeholder: 'Prof. Dr. H. Hasanuddin AF, M.A.' },
];

const FULL_HTML_OPINI = `<div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; max-width: 750px; margin: auto; padding: 40px;">
  ${HEADER_HTML}

  <table style="width: 100%; font-size: 11pt; margin-bottom: 20px;">
    <tr><td style="width: 140px;">Nomor</td><td style="width:10px;">:</td><td><strong>{{nomorSurat}}</strong></td></tr>
    <tr><td>Lampiran</td><td>:</td><td>{{lampiran}}</td></tr>
    <tr><td>Perihal</td><td>:</td><td><strong>Opini Syariah atas {{perihal}}</strong></td></tr>
  </table>

  <p style="margin-bottom: 4px;">Kepada Yth.</p>
  <p style="margin-bottom: 4px;"><strong>{{namaLembaga}}</strong></p>
  <p style="margin-bottom: 20px; white-space: pre-line;">{{alamatLembaga}}</p>

  <p><em>Assalamu'alaikum Wr. Wb.</em></p>

  <p style="text-align: justify; margin-bottom: 10px;">
    Menanggapi surat/permohonan dari <strong>{{namaPemohon}}</strong> Nomor <strong>{{nomorSuratPermohonan}}</strong>
    tanggal <strong>{{tanggalPermohonan}}</strong> perihal <strong>{{perihal}}</strong>,
    setelah melakukan kajian mendalam, dengan ini DSN-MUI menyampaikan Opini Syariah sebagai berikut:
  </p>

  <p style="font-weight: bold; margin-bottom: 6px;">A. Deskripsi Transaksi</p>
  <p style="text-align: justify; margin-bottom: 14px; white-space: pre-line;">{{deskripsiTransaksi}}</p>

  <p style="font-weight: bold; margin-bottom: 6px;">B. Dasar Hukum Syariah</p>
  <ol style="margin-bottom: 14px; padding-left: 20px;">
    <li>Al-Qur'an dan Hadis yang relevan;</li>
    <li>Fatwa DSN-MUI Nomor <strong>{{nomorFatwa}}</strong> tentang <strong>{{judulFatwa}}</strong>;</li>
    <li style="white-space: pre-line;">{{dasarHukumTambahan}}</li>
  </ol>

  <p style="font-weight: bold; margin-bottom: 6px;">C. Opini Syariah</p>
  <p style="text-align: justify; margin-bottom: 10px;">
    Berdasarkan kajian dan analisis syariah, DSN-MUI berpendapat bahwa
    <strong>{{namaTransaksi}}</strong> yang dilaksanakan oleh <strong>{{namaPelaksana}}</strong>
    <strong>selaras dengan prinsip-prinsip syariah</strong>, dengan catatan:
  </p>
  <ol style="text-align: justify; margin-bottom: 14px; padding-left: 20px;">
    <li style="margin-bottom: 8px; white-space: pre-line;">{{syaratSatu}}</li>
    <li style="margin-bottom: 8px; white-space: pre-line;">{{syaratDua}}</li>
    <li style="margin-bottom: 8px;">Apabila terdapat perubahan struktur transaksi, perlu dilakukan kajian ulang untuk memastikan keselarasan syariah.</li>
  </ol>

  <p style="text-align: justify; margin-bottom: 20px;">
    Demikian Opini Syariah ini kami sampaikan untuk menjadi perhatian dan dapat dipergunakan sebagaimana mestinya.
  </p>

  <p><em>Wassalamu'alaikum Wr. Wb.</em></p>

  <div style="margin-top: 30px; page-break-inside: avoid;">
    <p>Jakarta, {{tanggalSurat}}</p>
    <p><strong>DEWAN SYARIAH NASIONAL – MAJELIS ULAMA INDONESIA</strong></p>
    <div style="display: flex; gap: 100px; margin-top: 8px;">
      <div>
        <p>Ketua,</p><br /><br /><br />
        <p><strong>{{namaKetua}}</strong></p>
      </div>
      <div>
        <p>Sekretaris,</p><br /><br /><br />
        <p><strong>{{namaSekretaris}}</strong></p>
      </div>
    </div>
  </div>
</div>`;

const FULL_VARS_OPINI = [
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'B-0703/DSN-MUI/VI/2026' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-' },
  { key: 'perihal', label: 'Perihal / Nama Transaksi', type: 'text', required: true, placeholder: 'Transaksi Cross Switching SUN dengan SBSN' },
  { key: 'namaLembaga', label: 'Nama Lembaga Tujuan', type: 'text', required: true, placeholder: 'Kepala DEKS Bank Indonesia' },
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
];

const FULL_HTML_UNDANGAN_FATWA = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  ${HEADER_HTML}

  <!-- Tanggal Surat -->
  <div style="text-align: right; font-size: 11pt; margin-bottom: 6px; line-height: 1.3;">
    Jakarta, {{tanggalHijriah}}<br />
    {{tanggalMasehi}}
  </div>

  <!-- Metadata (Nomor, Lampiran, Hal) -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 11pt;">
    <tr>
      <td style="width: 55px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 10px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- Kepada Yth -->
  <div style="margin-bottom: 6px; font-size: 11pt; line-height: 1.3;">
    <strong>Kepada Yth.:</strong>
    <div style="white-space: pre-line; margin-top: 2px; font-weight: bold;">{{penerimaUndangan}}</div>
    di -<br />
    &nbsp;&nbsp;&nbsp;&nbsp;<strong>TEMPAT</strong>
  </div>

  <!-- Salam Pembuka -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

  <!-- Paragraf Pembuka -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px; text-indent: 30px;">
    Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{perihalRapat}}</strong>, yang insyaAllah akan diadakan pada:
  </p>

  <!-- Jadwal Rapat Table -->
  <table style="width: 90%; border-collapse: collapse; margin: 4px auto; font-size: 11pt;">
    <tr>
      <td style="width: 140px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{hariTanggalRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Waktu</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{waktuRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Tempat</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="white-space: pre-line; padding: 2px 0;">{{tempatRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{agendaRapat}}</td>
    </tr>
  </table>

  <!-- Paragraf Penutup -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px;">
    Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
  </p>

  <!-- Salam Penutup -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

  <!-- Tanda Tangan Section -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <!-- Hidden spacer matching header height so Ketua aligns with Sekretaris -->
          <div style="visibility: hidden; font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-bottom: 4px;">
            BADAN PENGURUS<br />
            DEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA
          </div>
          <div style="font-weight: bold;">Ketua,</div>
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaKetua}}</span>
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; margin-left: auto; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; margin-bottom: 4px;">
            BADAN PENGURUS<br />
            DEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA
          </div>
          <div style="font-weight: bold;">Sekretaris,</div>
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaSekretaris}}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- Page Break for Lampiran 1 -->
  <div style="page-break-before: always; margin-top: 40px;"></div>

  <!-- Lampiran 1 Header -->
  <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
    Lampiran 1 Daftar Undangan {{perihal}}<br />
    {{nomorSurat}}
  </div>

  <!-- Lampiran 1 Content -->
  <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5;">
    {{daftarUndanganLampiran}}
  </div>

  <!-- Page Break for Lampiran 2 -->
  <div style="page-break-before: always; margin-top: 40px;"></div>

  <!-- Lampiran 2 Header -->
  <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
    Lampiran 2 Agenda Rapat {{perihal}}<br />
    {{nomorSurat}}
  </div>

  <!-- Lampiran 2 Content -->
  <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5;">
    {{agendaRapatLampiran}}
  </div>
</div>`;

const FULL_VARS_UNDANGAN_FATWA = [
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'U-0666/DSN-MUI/VIII/2026' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal Surat', type: 'text', required: true, placeholder: 'Undangan Rapat Bidang Fatwa DSN-MUI' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '10 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '26 Shafar 1448 H' },
  { key: 'penerimaUndangan', label: 'Penerima Undangan (Kepada Yth.)', type: 'textarea', required: true, placeholder: '1. Pimpinan DSN-MUI Bidang Fatwa Perbankan\n2. Pimpinan DSN-MUI Bidang Fatwa Non Perbankan\n3. Bidang Fatwa DSN-MUI' },
  { key: 'perihalRapat', label: 'Perihal Rapat (Kalimat Pembuka)', type: 'text', required: true, placeholder: 'Rapat Bidang Fatwa DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari, tanggal Rapat', type: 'text', required: true, placeholder: 'Selasa, 11 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 WIB - selesai' },
  { key: 'tempatRapat', label: 'Tempat Rapat', type: 'textarea', required: true, placeholder: 'Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320' },
  { key: 'agendaRapat', label: 'Agenda Singkat (Tabel)', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'namaKetua', label: 'Nama Ketua', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndanganLampiran', label: 'Lampiran 1: Daftar Undangan (Pre-line)', type: 'textarea', required: true, placeholder: '1. Unsur Pimpinan:\nWakil Ketua: Prof. Dr. K.H. Hasanudin, M.Ag.\n...' },
  { key: 'agendaRapatLampiran', label: 'Lampiran 2: Agenda Rapat (Pre-line)', type: 'textarea', required: true, placeholder: 'Pukul 13.00 – 14.00 WIB:\n1. Pembahasan Lanjutan Hasil FGD...\n...' }
];

const FULL_HTML_UNDANGAN_BPH = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  ${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; font-size: 11pt; margin-bottom: 6px; line-height: 1.3;">
    Jakarta, {{tanggalHijriah}}<br />
    {{tanggalMasehi}}
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 11pt;">
    <tr>
      <td style="width: 55px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 10px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- KEPADA YTH -->
  <div style="margin-bottom: 6px; font-size: 11pt; line-height: 1.3;">
    <strong>Kepada Yth.:</strong><br />
    <div style="white-space: pre-line; font-weight: bold; margin-bottom: 4px;">{{daftarPenerima}}</div>
    di -<br />
    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{{tempatPenerima}}</strong>
  </div>

  <!-- SALAM PEMBUKA -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

  <!-- PARAGRAF ISI -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px; text-indent: 30px;">
    Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
  </p>

  <!-- JADWAL TABLE -->
  <table style="width: 90%; border-collapse: collapse; margin: 4px auto; font-size: 11pt;">
    <tr>
      <td style="width: 140px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{hariTanggalRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Waktu</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{waktuRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Tempat</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="white-space: pre-line; padding: 2px 0;"><strong>{{tempatRapat}}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;"><strong>{{agendaRapat}}</strong></td>
    </tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px;">
    Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
  </p>

  <!-- SALAM PENUTUP -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

  <!-- TANDA TANGAN SECTION -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
          <div style="visibility: hidden; font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; white-space: pre-line; margin-bottom: 4px;">{{headerTtd}}</div>
          <div style="font-weight: bold;">{{jabatanKiri}},</div>
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaKetua}}</span>
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; margin-left: auto; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; white-space: pre-line; margin-bottom: 4px;">{{headerTtd}}</div>
          <div style="font-weight: bold;">{{jabatanKanan}},</div>
          <!-- QR_CODE_TTE_PLACEHOLDER -->
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaSekretaris}}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- PAGE BREAK FOR LAMPIRAN 1 -->
  <div style="page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 1 Daftar Undangan {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5; text-align: justify;">
      {{daftarUndangan}}
    </div>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 2 (CONDITIONAL) -->
  <div style="display: {{showAgendaDetail}}; page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 2 Agenda Rapat {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5; text-align: justify;">
      {{agendaDetail}}
    </div>
  </div>
</div>`;

const FULL_VARS_UNDANGAN_BPH = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0638/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '4 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '20 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Pimpinan Badan Pengurus DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima (Satu per baris)', type: 'textarea', required: true, placeholder: '1. Pimpinan Badan Pengurus DSN-MUI\n2. Koordinator Bidang Fatwa DSN-MUI\n3. Koordinator Bidang Layanan...' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Pimpinan Badan Pengurus DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Rabu, 5 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 15.00 WIB' },
  { key: 'tempatRapat', label: 'Tempat Rapat', type: 'textarea', required: true, placeholder: 'Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'textarea', required: true, placeholder: '1. Unsur Pimpinan:\n   Ketua : K.H. M. Cholil Nafis, Lc., Ph.D...' },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'textarea', required: true, placeholder: 'Pukul 13.00 - 15.00 WIB:\n1. Laporan...' },
  { key: 'showAgendaDetail', label: 'Show Agenda Detail', type: 'text', required: false, placeholder: 'block' }
];

const FULL_HTML_UNDANGAN_KESEKRETARISAN = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  ${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; font-size: 11pt; margin-bottom: 6px; line-height: 1.3;">
    Jakarta, {{tanggalHijriah}}<br />
    {{tanggalMasehi}}
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 11pt;">
    <tr>
      <td style="width: 55px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 10px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- KEPADA YTH -->
  <div style="margin-bottom: 6px; font-size: 11pt; line-height: 1.3;">
    <strong>Kepada Yth.:</strong><br />
    <div style="white-space: pre-line; font-weight: bold; margin-bottom: 4px;">{{daftarPenerima}}</div>
    di -<br />
    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{{tempatPenerima}}</strong>
  </div>

  <!-- SALAM PEMBUKA -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

  <!-- PARAGRAF ISI -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px; text-indent: 30px;">
    Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
  </p>

  <!-- JADWAL TABLE -->
  <table style="width: 90%; border-collapse: collapse; margin: 4px auto; font-size: 11pt;">
    <tr>
      <td style="width: 140px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{hariTanggalRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Waktu</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{waktuRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Media</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="white-space: pre-line; padding: 2px 0;"><strong>{{mediaRapat}}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;"><strong>{{agendaRapat}}</strong></td>
    </tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px;">
    Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
  </p>

  <!-- SALAM PENUTUP -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

  <!-- TANDA TANGAN SECTION -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
          <div style="visibility: hidden; font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; white-space: pre-line; margin-bottom: 4px;">{{headerTtd}}</div>
          <div style="font-weight: bold;">{{jabatanKiri}},</div>
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaKetua}}</span>
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; margin-left: auto; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; white-space: pre-line; margin-bottom: 4px;">{{headerTtd}}</div>
          <div style="font-weight: bold;">{{jabatanKanan}},</div>
          <!-- QR_CODE_TTE_PLACEHOLDER -->
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaSekretaris}}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- PAGE BREAK FOR LAMPIRAN 1 -->
  <div style="page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 1 Daftar Undangan {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5; text-align: justify;">
      {{daftarUndangan}}
    </div>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 2 (CONDITIONAL) -->
  <div style="display: {{showAgendaDetail}}; page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 2 Agenda Rapat {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5; text-align: justify;">
      {{agendaDetail}}
  </div>
</div>`;

const FULL_HTML_UNDANGAN_LAYANAN = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  ${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; font-size: 11pt; margin-bottom: 6px; line-height: 1.3;">
    Jakarta, {{tanggalHijriah}}<br />
    {{tanggalMasehi}}
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 11pt;">
    <tr>
      <td style="width: 55px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 10px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- KEPADA YTH -->
  <div style="margin-bottom: 6px; font-size: 11pt; line-height: 1.3;">
    <strong>Kepada Yth.:</strong><br />
    <div style="white-space: pre-line; font-weight: bold; margin-bottom: 4px;">{{daftarPenerima}}</div>
    di -<br />
    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{{tempatPenerima}}</strong>
  </div>

  <!-- SALAM PEMBUKA -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

  <!-- PARAGRAF ISI -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px; text-indent: 30px;">
    Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
  </p>

  <!-- JADWAL TABLE -->
  <table style="width: 90%; border-collapse: collapse; margin: 4px auto; font-size: 11pt;">
    <tr>
      <td style="width: 140px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{hariTanggalRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Waktu</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{waktuRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Tempat</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="white-space: pre-line; padding: 2px 0;"><strong>{{tempatRapat}}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;"><strong>{{agendaRapat}}</strong></td>
    </tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 4px;">
    Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
  </p>

  <!-- SALAM PENUTUP -->
  <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

  <!-- TANDA TANGAN SECTION -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
          <div style="visibility: hidden; font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; white-space: pre-line; margin-bottom: 4px;">{{headerTtd}}</div>
          <div style="font-weight: bold;">{{jabatanKiri}},</div>
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaKetua}}</span>
        </div>
      </td>
      <td style="width: 50%; vertical-align: top; padding: 0;">
        <div style="width: 310px; margin-left: auto; text-align: left; font-family: Arial, sans-serif; font-size: 11pt;">
          <div style="font-size: 9pt; font-weight: bold; text-transform: uppercase; line-height: 1.2; white-space: pre-line; margin-bottom: 4px;">{{headerTtd}}</div>
          <div style="font-weight: bold;">{{jabatanKanan}},</div>
          <!-- QR_CODE_TTE_PLACEHOLDER -->
          <div style="height: 60px;"></div>
          <span style="font-weight: bold; text-decoration: underline; white-space: nowrap;">{{namaSekretaris}}</span>
        </div>
      </td>
    </tr>
  </table>

  <!-- PAGE BREAK FOR LAMPIRAN 1 -->
  <div style="page-break-before: always; margin-top: 40px; border-top: 1px solid #000000; padding-top: 20px;">
    <p style="font-weight: bold; margin-bottom: 2px;">Lampiran 1 Daftar Undangan {{namaRapat}}</p>
    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 20px;">Nomor: {{nomorSurat}}</p>
    
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5; text-align: justify;">
      {{daftarUndangan}}
    </div>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 2 (CONDITIONAL) -->
  <div style="display: {{showAgendaDetail}}; page-break-before: always; margin-top: 40px; border-top: 1px solid #000000; padding-top: 20px;">
    <p style="font-weight: bold; margin-bottom: 2px;">Lampiran 2 Agenda Rapat {{namaRapat}}</p>
    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 20px;">Nomor: {{nomorSurat}}</p>
    
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5; text-align: justify;">
      {{agendaDetail}}
    </div>
  </div>
</div>`;

const FULL_VARS_UNDANGAN_LAYANAN = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0667/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '10 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '26 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima (Satu per baris)', type: 'textarea', required: true, placeholder: '1. Pimpinan DSN-MUI Bidang Layanan dan Literasi\\n2. Pimpinan DSN-MUI Bidang Relasi Industri dan Regulasi\\n3. Bidang Layanan, Literasi, Relasi Industri, dan Regulasi\\nDewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI)\\n(Nama-nama terlampir)' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Selasa, 11 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 15.00 WIB' },
  { key: 'tempatRapat', label: 'Tempat Rapat', type: 'textarea', required: true, placeholder: 'Kantor DSN-MUI\\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\\nDEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'textarea', required: true, placeholder: '1. Unsur Pimpinan:\\n   Wakil Ketua : K.H. Sholahudin Al Aiyub\\n   Wakil Ketua : Ir. H. Adiwarman A. Karim, S.E., M.B.A., M.A.E.P.\\n   Wakil Sekretaris : Kanny Hidaya, S.E., M.A.\\n   Wakil Sekretaris : Dr. Asrori S. Karni, S.Ag., M.H.\\n\\n2. Koordinator Bidang Fatwa:\\n   Dr. Asep Supyadillah, M.Ag.\\n\\n3. Anggota Bidang Fatwa:\\n   1. Ah. Azharuddin Latif, M.Ag., M.H.\\n   2. Dr. Yuke Rahmawati, M.A.' },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'textarea', required: true, placeholder: '1. Tindak Lanjut atas Rapat Kesekretarisan DSN-MUI tanggal 6 Agustus 2026:\\n   a. Pemohonan Izin Penelitian Skripsi dari Velisa Universitas Darussalam\\n   b. Permohonan Surat Rekomendasi Dewan Pengawas Syariah dari PT LKM Artha Kerta Raharja (Perseroda)\\n   ...' },
  { key: 'showAgendaDetail', label: 'Show Agenda Detail', type: 'text', required: false, placeholder: 'block' }
];

const FULL_VARS_UNDANGAN_KESEKRETARISAN = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0643/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '5 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '21 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima (Satu per baris)', type: 'textarea', required: true, placeholder: 'Unsur Sekretaris Badan Pengurus DSN-MUI' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Kesekretarisan Badan Pengurus DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Kamis, 6 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 14.30 WIB' },
  { key: 'mediaRapat', label: 'Media Rapat', type: 'textarea', required: true, placeholder: 'Zoom Cloud Meeting\n(Meeting ID: 859 4470 8501 | Passcode: DSNMUI26)' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'textarea', required: true, placeholder: 'Sekretaris : Dr. H. Amirsyah Tambunan, M.A\nWakil Sekretaris : Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.\nWakil Sekretaris : Kanny Hidaya, S.E., M.A.\nWakil Sekretaris : Dr. Asrori S. Karni, S.Ag., M.H.\nWakil Sekretaris : Drs. H. Muhammad Ziyad, M.A.' },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'textarea', required: true, placeholder: '1. Tindak Lanjut Keputusan Rapat Pimpinan.\n2. Pembahasan surat-surat Masuk\n3. Dan lain-lain.' },
  { key: 'showAgendaDetail', label: 'Show Agenda Detail', type: 'text', required: false, placeholder: 'block' }
];

async function updateTemplates() {
  console.log('Updating PKS-SYARIAH with full HTML...');
  await prisma.letterTemplate.update({
    where: { code: 'PKS-SYARIAH' },
    data: {
      description: 'Template surat Pernyataan Kesesuaian Syariah untuk disampaikan kepada pihak terkait (DJPPR, dll). Berisi nomor surat, perihal, dan isi pernyataan yang dinamis.',
      htmlContent: FULL_HTML_PKS,
      variables: FULL_VARS_PKS,
    },
  });
  console.log('✅ PKS-SYARIAH updated');

  console.log('Updating OPINI-SYARIAH with full HTML...');
  await prisma.letterTemplate.update({
    where: { code: 'OPINI-SYARIAH' },
    data: {
      description: 'Template surat Pernyataan Keselarasan (Opini) Syariah untuk transaksi atau kebijakan yang memerlukan opini kesesuaian dari DSN-MUI.',
      htmlContent: FULL_HTML_OPINI,
      variables: FULL_VARS_OPINI,
    },
  });
  console.log('✅ OPINI-SYARIAH updated');

  console.log('Upserting UNDANGAN-FATWA with full HTML...');
  await prisma.letterTemplate.upsert({
    where: { code: 'UNDANGAN-FATWA' },
    update: {
      name: 'Undangan Rapat Bidang Fatwa DSN-MUI',
      description: 'Template resmi Undangan Rapat Bidang Fatwa DSN-MUI, mencakup daftar undangan dan agenda rapat.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_FATWA,
      variables: FULL_VARS_UNDANGAN_FATWA,
    },
    create: {
      code: 'UNDANGAN-FATWA',
      name: 'Undangan Rapat Bidang Fatwa DSN-MUI',
      description: 'Template resmi Undangan Rapat Bidang Fatwa DSN-MUI, mencakup daftar undangan dan agenda rapat.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_FATWA,
      variables: FULL_VARS_UNDANGAN_FATWA,
    },
  });
  console.log('✅ UNDANGAN-FATWA upserted');

  console.log('Upserting U-0638-UNDANGAN-BPH with full HTML...');
  await prisma.letterTemplate.upsert({
    where: { code: 'U-0638-UNDANGAN-BPH' },
    update: {
      name: 'Undangan Rapat Pimpinan Badan Pengurus (U-0638)',
      description: 'Template resmi Undangan Rapat Pimpinan Badan Pengurus DSN-MUI.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_BPH,
      variables: FULL_VARS_UNDANGAN_BPH,
    },
    create: {
      code: 'U-0638-UNDANGAN-BPH',
      name: 'Undangan Rapat Pimpinan Badan Pengurus (U-0638)',
      description: 'Template resmi Undangan Rapat Pimpinan Badan Pengurus DSN-MUI.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_BPH,
      variables: FULL_VARS_UNDANGAN_BPH,
    },
  });
  console.log('✅ U-0638-UNDANGAN-BPH upserted');

  console.log('Upserting U-0643-UNDANGAN-KESEKRETARISAN with full HTML...');
  await prisma.letterTemplate.upsert({
    where: { code: 'U-0643-UNDANGAN-KESEKRETARISAN' },
    update: {
      name: 'Undangan Rapat Kesekretarisan Badan Pengurus (U-0643)',
      description: 'Template resmi Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_KESEKRETARISAN,
      variables: FULL_VARS_UNDANGAN_KESEKRETARISAN,
    },
    create: {
      code: 'U-0643-UNDANGAN-KESEKRETARISAN',
      name: 'Undangan Rapat Kesekretarisan Badan Pengurus (U-0643)',
      description: 'Template resmi Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_KESEKRETARISAN,
      variables: FULL_VARS_UNDANGAN_KESEKRETARISAN,
    },
  });
  console.log('✅ U-0643-UNDANGAN-KESEKRETARISAN upserted');

  console.log('Upserting U-0667-UNDANGAN-LAYANAN with full HTML...');
  await prisma.letterTemplate.upsert({
    where: { code: 'U-0667-UNDANGAN-LAYANAN' },
    update: {
      name: 'Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi (U-0667)',
      description: 'Template resmi Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_LAYANAN,
      variables: FULL_VARS_UNDANGAN_LAYANAN,
    },
    create: {
      code: 'U-0667-UNDANGAN-LAYANAN',
      name: 'Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi (U-0667)',
      description: 'Template resmi Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI.',
      category: 'Undangan',
      htmlContent: FULL_HTML_UNDANGAN_LAYANAN,
      variables: FULL_VARS_UNDANGAN_LAYANAN,
    },
  });
  console.log('✅ U-0667-UNDANGAN-LAYANAN upserted');

  await prisma.$disconnect();
  console.log('Done!');
}

updateTemplates().catch(e => { console.error(e); process.exit(1); });
