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
  {
    name: 'Undangan Silaturahim dan Wawancara Calon DPS kepada PT (U-0000)',
    code: 'U-0000-WAWANCARA-DPS',
    category: 'Undangan',
    description:
      'Template resmi Draf Undangan Silaturahim dan Wawancara Calon Dewan Pengawas Syariah (DPS) kepada Direktur Utama PT.',
    htmlContent: `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.5; max-width: 800px; margin: auto; padding: 20px;">
  <!-- KOP SURAT DSN-MUI -->
  <table style="width: 100%; border-collapse: collapse; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 12px;">
    <tr>
      <td style="width: 65px; vertical-align: middle; padding: 0 8px 0 0;">
        <img src="/images/logo-dsn.png" alt="Logo DSN-MUI" style="width: 55px; height: 55px; object-fit: contain;" />
      </td>
      <td style="text-align: left; vertical-align: middle; padding: 0;">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #111827; letter-spacing: -0.2px; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          DEWAN SYARIAH NASIONAL - MAJELIS ULAMA INDONESIA
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; font-weight: bold; color: #111827; margin-bottom: 3px; line-height: 1.2; white-space: nowrap;">
          National Sharia Board - Indonesian Council of Ulama
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; color: #374151; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          SEKRETARIAT : Jl. Dempo No.19 Pegangsaan - Jakarta Pusat 10320
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; color: #374151; line-height: 1.2; white-space: nowrap;">
          Telp. (021) 3904146 &nbsp; Email: sekretariat@dsnmui.or.id &nbsp; Web: www.dsnmui.or.id
        </div>
      </td>
      <td style="width: 70px; vertical-align: middle; text-align: right; padding: 0 0 0 8px;">
        <div style="border: 1px solid #000000; padding: 3px; font-family: Arial, Helvetica, sans-serif; font-size: 6px; text-align: center; line-height: 1.1; font-weight: bold; color: #111827;">
          <div style="border-bottom: 1px solid #000000; padding-bottom: 1px; margin-bottom: 1.5px; font-size: 5px;">REGISTERED</div>
          <div style="font-weight: 800; font-size: 8px; letter-spacing: 0.5px; margin-bottom: 0.5px;">WQA</div>
          <div style="font-size: 5px; margin: 1px 0;">ISO 9001:2015</div>
          <div style="border-top: 1px dashed #000000; padding-top: 1px; margin-top: 1.5px; font-size: 4.5px;">UKAS 134</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- BASMALAH -->
  <div style="text-align: center; font-size: 20px; font-family: 'Times New Roman', serif; margin-top: 12px; margin-bottom: 18px; color: #111827;">
    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
  </div>

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; font-size: 11pt; margin-bottom: 15px; line-height: 1.3;">
    Jakarta, {{tanggal_masehi}}<br />
    {{tanggal_hijriah}}
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
    <tr>
      <td style="width: 80px; vertical-align: top;">Nomor</td>
      <td style="width: 15px; vertical-align: top;">:</td>
      <td>{{nomor_surat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top;">Lamp.</td>
      <td style="vertical-align: top;">:</td>
      <td>{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold;">Hal</td>
      <td style="vertical-align: top; font-weight: bold;">:</td>
      <td style="font-weight: bold;">Undangan Silaturahim dan Wawancara Calon DPS</td>
    </tr>
  </table>

  <!-- KEPADA YTH -->
  <div style="margin-bottom: 20px; font-size: 11pt; line-height: 1.4;">
    <strong>Kepada Yth.:</strong><br />
    <strong>Direktur Utama {{nama_pt}}</strong><br />
    <strong>Sdr. {{nama_dirut}}</strong><br />
    di -<br />
    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{{kota_tujuan}}</strong>
  </div>

  <!-- SALAM PEMBUKA -->
  <p style="margin-bottom: 12px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

  <!-- PARAGRAF PEMBUKA -->
  <p style="text-align: justify; margin-bottom: 12px; text-indent: 30px;">
    Puji syukur ke hadirat Allah Subhanahu wa Ta’ala, teriring doa semoga Saudara dalam keadaan sehat wal afiat dan mendapat lindungan dari Allah SWT dalam menjalankan tugas sehari-hari.
  </p>

  <!-- PARAGRAF ISI -->
  <p style="text-align: justify; margin-bottom: 12px; text-indent: 30px;">
    Menunjuk surat Saudara No. <strong>{{no_surat_permohonan}}</strong> tertanggal <strong>{{tgl_surat_permohonan}}</strong> perihal <strong>{{perihal_surat_permohonan}}</strong>; dan berdasarkan keputusan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) tanggal <strong>{{tgl_rapat_dsn}}</strong>, DSN-MUI mengundang calon Dewan Pengawas Syariah (DPS) yang Saudara ajukan yaitu <strong>Sdr. {{nama_calon_dps}}</strong> untuk silaturahim dan wawancara melalui <em>video conference</em>, yang insyaAllah akan diadakan pada:
  </p>

  <!-- JADWAL WAWANCARA TABLE -->
  <table style="width: 90%; border-collapse: collapse; margin: 15px auto; font-size: 11pt;">
    <tr>
      <td style="width: 140px; vertical-align: top; font-weight: bold;">Hari, Tanggal</td>
      <td style="width: 15px; vertical-align: top;">:</td>
      <td style="font-weight: bold;">{{hari_tanggal_wawancara}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold;">Waktu</td>
      <td style="vertical-align: top;">:</td>
      <td style="font-weight: bold;">{{waktu_wawancara}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold;">Media</td>
      <td style="vertical-align: top;">:</td>
      <td>
        <strong>Zoom Cloud Meeting</strong><br />
        (Meeting ID: <strong>{{meeting_id}}</strong> | Passcode: <strong>{{passcode}}</strong>)
      </td>
    </tr>
  </table>

  <!-- PARAGRAF KONFIRMASI -->
  <p style="text-align: justify; margin-bottom: 12px;">
    Konfirmasi kehadiran dapat menghubungi Kepala Sekretariat DSN-MUI (Sdr. Abdul Wasik, M.Si, HP: 0818 404 852), Hotline DSN-MUI (HP: 0822 6000 4146) atau email <a href="mailto:sekretariat@dsnmui.or.id" style="color: #006633; text-decoration: underline;">sekretariat@dsnmui.or.id</a> dan <a href="mailto:dsnmui@gmail.com" style="color: #006633; text-decoration: underline;">dsnmui@gmail.com</a>.
  </p>

  <p style="text-align: justify; margin-bottom: 12px;">
    Mengingat pentingnya acara tersebut, kami mengharapkan calon DPS yang Saudara ajukan dapat menghadiri tepat pada waktunya.
  </p>

  <p style="text-align: justify; margin-bottom: 12px;">
    Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.
  </p>

  <!-- SALAM PENUTUP -->
  <p style="margin-bottom: 20px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

  <!-- TANDA TANGAN SECTION -->
  <div style="margin-top: 30px; page-break-inside: avoid;">
    <div style="text-align: right; margin-bottom: 10px; font-weight: bold; font-size: 10pt; text-transform: uppercase;">
      BADAN PENGURUS<br />
      DEWAN SYARIAH NASIONAL-MAJELIS ULAMA INDONESIA
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 15px;">
      <div style="text-align: center; min-width: 200px;">
        <div style="font-size: 11pt; font-weight: bold; margin-bottom: 60px;">Ketua,</div>
        <div style="font-size: 11pt; font-weight: bold; text-decoration: underline;">K.H. M. CHOLIL NAFIS, Lc., Ph.D.</div>
      </div>
      <div style="text-align: center; min-width: 200px;">
        <div style="font-size: 11pt; font-weight: bold; margin-bottom: 60px;">Sekretaris,</div>
        <div style="font-size: 11pt; font-weight: bold; text-decoration: underline;">Dr. H. AMIRSYAH TAMBUNAN, M.A.</div>
      </div>
    </div>
  </div>
</div>`,
    variables: [
      { key: 'nomor_surat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0000/DSN-MUI/VII/2026' },
      { key: 'tanggal_masehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '30 Juni 2026 M' },
      { key: 'tanggal_hijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '15 Muharram 1448 H' },
      { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-----' },
      { key: 'nama_pt', label: 'Nama PT / Lembaga Tujuan', type: 'text', required: true, placeholder: 'PT ...' },
      { key: 'nama_dirut', label: 'Nama Direktur Utama', type: 'text', required: true, placeholder: 'Nama Dirut PT' },
      { key: 'kota_tujuan', label: 'Kota Tujuan', type: 'text', required: true, placeholder: 'JAKARTA' },
      { key: 'no_surat_permohonan', label: 'No. Surat Permohonan PT', type: 'text', required: true, placeholder: 'No. ...' },
      { key: 'tgl_surat_permohonan', label: 'Tanggal Surat Permohonan', type: 'text', required: true, placeholder: '10 Juni 2026' },
      { key: 'perihal_surat_permohonan', label: 'Perihal Surat Permohonan PT', type: 'text', required: true, placeholder: 'Permohonan Rekomendasi Calon DPS' },
      { key: 'tgl_rapat_dsn', label: 'Tanggal Rapat Bidang DSN-MUI', type: 'text', required: true, placeholder: '15 Juni 2026' },
      { key: 'nama_calon_dps', label: 'Nama Calon DPS yang Diuji', type: 'text', required: true, placeholder: 'Sdr. ...' },
      { key: 'hari_tanggal_wawancara', label: 'Hari & Tanggal Wawancara', type: 'text', required: true, placeholder: 'Senin, 20 Juli 2026' },
      { key: 'waktu_wawancara', label: 'Waktu Wawancara', type: 'text', required: true, placeholder: '07.00 – 09.00 WIB' },
      { key: 'media_wawancara', label: 'Media Wawancara', type: 'text', required: true, placeholder: 'Zoom Cloud Meeting' },
      { key: 'meeting_id', label: 'Meeting ID Zoom', type: 'text', required: true, placeholder: '000 0000 0000' },
      { key: 'passcode', label: 'Passcode Zoom', type: 'text', required: true, placeholder: '........' }
    ]
  },
  {
    name: 'Undangan Rapat Pimpinan Badan Pengurus (U-0638)',
    code: 'U-0638-UNDANGAN-BPH',
    category: 'Undangan',
    description:
      'Template resmi Undangan Rapat Pimpinan Badan Pengurus DSN-MUI.',
    htmlContent: `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.5; max-width: 800px; margin: auto; padding: 20px;">
  <!-- KOP SURAT DSN-MUI -->
  <table style="width: 100%; border-collapse: collapse; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 12px;">
    <tr>
      <td style="width: 65px; vertical-align: middle; padding: 0 8px 0 0;">
        <img src="/images/logo-dsn.png" alt="Logo DSN-MUI" style="width: 55px; height: 55px; object-fit: contain;" />
      </td>
      <td style="text-align: left; vertical-align: middle; padding: 0;">
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; color: #111827; letter-spacing: -0.2px; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          DEWAN SYARIAH NASIONAL - MAJELIS ULAMA INDONESIA
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; font-weight: bold; color: #111827; margin-bottom: 3px; line-height: 1.2; white-space: nowrap;">
          National Sharia Board - Indonesian Council of Ulama
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; color: #374151; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          SEKRETARIAT : Jl. Dempo No.19 Pegangsaan - Jakarta Pusat 10320
        </div>
        <div style="font-family: Arial, Helvetica, sans-serif; font-size: 7.5px; color: #374151; line-height: 1.2; white-space: nowrap;">
          Telp. (021) 3904146 &nbsp; Email: sekretariat@dsnmui.or.id &nbsp; Web: www.dsnmui.or.id
        </div>
      </td>
      <td style="width: 70px; vertical-align: middle; text-align: right; padding: 0 0 0 8px;">
        <div style="border: 1px solid #000000; padding: 3px; font-family: Arial, Helvetica, sans-serif; font-size: 6px; text-align: center; line-height: 1.1; font-weight: bold; color: #111827;">
          <div style="border-bottom: 1px solid #000000; padding-bottom: 1px; margin-bottom: 1.5px; font-size: 5px;">REGISTERED</div>
          <div style="font-weight: 800; font-size: 8px; letter-spacing: 0.5px; margin-bottom: 0.5px;">WQA</div>
          <div style="font-size: 5px; margin: 1px 0;">ISO 9001:2015</div>
          <div style="border-top: 1px dashed #000000; padding-top: 1px; margin-top: 1.5px; font-size: 4.5px;">UKAS 134</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- BASMALAH -->
  <div style="text-align: center; font-size: 20px; font-family: 'Times New Roman', serif; margin-top: 12px; margin-bottom: 18px; color: #111827;">
    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
  </div>

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; font-size: 11pt; margin-bottom: 15px; line-height: 1.3;">
    Jakarta, {{tanggalHijriah}}<br />
    {{tanggalMasehi}}
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11pt;">
    <tr>
      <td style="width: 80px; vertical-align: top;">Nomor</td>
      <td style="width: 15px; vertical-align: top;">:</td>
      <td>{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top;">Lamp.</td>
      <td style="vertical-align: top;">:</td>
      <td>{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold;">Hal</td>
      <td style="vertical-align: top; font-weight: bold;">:</td>
      <td style="font-weight: bold;">{{perihal}}</td>
    </tr>
  </table>

  <!-- KEPADA YTH -->
  <div style="margin-bottom: 20px; font-size: 11pt; line-height: 1.4;">
    <strong>Kepada Yth.:</strong><br />
    <div style="white-space: pre-line; font-weight: bold; margin-bottom: 4px;">{{daftarPenerima}}</div>
    di -<br />
    &nbsp;&nbsp;&nbsp;&nbsp;<strong>{{tempatPenerima}}</strong>
  </div>

  <!-- SALAM PEMBUKA -->
  <p style="margin-bottom: 12px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

  <!-- PARAGRAF ISI -->
  <p style="text-align: justify; margin-bottom: 12px; text-indent: 30px;">
    Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
  </p>

  <!-- JADWAL TABLE -->
  <table style="width: 90%; border-collapse: collapse; margin: 15px auto; font-size: 11pt;">
    <tr>
      <td style="width: 140px; vertical-align: top; font-weight: bold;">Hari, tanggal</td>
      <td style="width: 15px; vertical-align: top;">:</td>
      <td style="font-weight: bold;">{{hariTanggalRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold;">Waktu</td>
      <td style="vertical-align: top;">:</td>
      <td style="font-weight: bold;">{{waktuRapat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold;">Tempat</td>
      <td style="vertical-align: top;">:</td>
      <td style="white-space: pre-line;"><strong>{{tempatRapat}}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top; font-weight: bold;">Agenda</td>
      <td style="vertical-align: top;">:</td>
      <td><strong>{{agendaRapat}}</strong></td>
    </tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-bottom: 12px;">
    Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
  </p>

  <!-- SALAM PENUTUP -->
  <p style="margin-bottom: 20px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

  <!-- TANDA TANGAN SECTION -->
  <div style="margin-top: 30px; page-break-inside: avoid;">
    <div style="text-align: right; margin-bottom: 10px; font-weight: bold; font-size: 10pt; text-transform: uppercase; white-space: pre-line;">
      {{headerTtd}}
    </div>
    <div style="display: flex; justify-content: space-between; margin-top: 15px;">
      <div style="text-align: center; min-width: 200px;">
        <div style="font-size: 11pt; font-weight: bold; margin-bottom: 60px;">{{jabatanKiri}},</div>
        <div style="font-size: 11pt; font-weight: bold; text-decoration: underline;">{{namaKetua}}</div>
      </div>
      <div style="text-align: center; min-width: 200px;">
        <div style="font-size: 11pt; font-weight: bold; margin-bottom: 60px;">{{jabatanKanan}},</div>
        <div style="font-size: 11pt; font-weight: bold; text-decoration: underline;">{{namaSekretaris}}</div>
      </div>
    </div>
  </div>
</div>`,
    variables: [
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
      { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' }
    ]
  }
];
const dummy = null;

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
