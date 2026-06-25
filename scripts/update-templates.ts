import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const FULL_HTML_PKS = `<div style="font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.5; max-width: 750px; margin: auto; padding: 40px;">
  <table style="width: 100%; border-collapse: collapse; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 12px; font-family: Arial, sans-serif;">
    <tr>
      <td style="width: 65px; vertical-align: middle; padding: 0 8px 0 0;">
        <img src="/images/logo-dsn.png" alt="Logo DSN-MUI" style="width: 55px; height: 55px; object-fit: contain;" />
      </td>
      <td style="text-align: left; vertical-align: middle; padding: 0;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #111827; letter-spacing: -0.2px; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          DEWAN SYARIAH NASIONAL - MAJELIS ULAMA INDONESIA
        </div>
        <div style="font-size: 8.5px; font-weight: bold; color: #111827; margin-bottom: 3px; line-height: 1.2; white-space: nowrap;">
          National Sharia Board - Indonesian Council of Ulama
        </div>
        <div style="font-size: 7.5px; color: #374151; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          SEKRETARIAT : Jl. Dempo No.19 Pegangsaan - Jakarta Pusat 10320
        </div>
        <div style="font-size: 7.5px; color: #374151; line-height: 1.2; white-space: nowrap;">
          Telp. (021) 3904146 &nbsp; Email: sekretariat@dsnmui.or.id &nbsp; Web: www.dsnmui.or.id
        </div>
      </td>
      <td style="width: 70px; vertical-align: middle; text-align: right; padding: 0 0 0 8px;">
        <div style="border: 1px solid #000000; padding: 3px; font-size: 6px; text-align: center; line-height: 1.1; font-weight: bold; color: #111827;">
          <div style="border-bottom: 1px solid #000000; padding-bottom: 1px; margin-bottom: 1.5px; font-size: 5px;">REGISTERED</div>
          <div style="font-weight: 800; font-size: 8px; letter-spacing: 0.5px; margin-bottom: 0.5px;">WQA</div>
          <div style="font-size: 5px; margin: 1px 0;">ISO 9001:2015</div>
          <div style="border-top: 1px dashed #000000; padding-top: 1px; margin-top: 1.5px; font-size: 4.5px;">UKAS 134</div>
        </div>
      </td>
    </tr>
  </table>

  <div style="text-align: center; font-size: 20px; font-family: 'Times New Roman', serif; margin-top: 12px; margin-bottom: 18px; color: #111827;">
    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
  </div>

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
  <table style="width: 100%; border-collapse: collapse; border-bottom: 3px double #000000; padding-bottom: 8px; margin-bottom: 12px; font-family: Arial, sans-serif;">
    <tr>
      <td style="width: 65px; vertical-align: middle; padding: 0 8px 0 0;">
        <img src="/images/logo-dsn.png" alt="Logo DSN-MUI" style="width: 55px; height: 55px; object-fit: contain;" />
      </td>
      <td style="text-align: left; vertical-align: middle; padding: 0;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; color: #111827; letter-spacing: -0.2px; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          DEWAN SYARIAH NASIONAL - MAJELIS ULAMA INDONESIA
        </div>
        <div style="font-size: 8.5px; font-weight: bold; color: #111827; margin-bottom: 3px; line-height: 1.2; white-space: nowrap;">
          National Sharia Board - Indonesian Council of Ulama
        </div>
        <div style="font-size: 7.5px; color: #374151; margin-bottom: 1px; line-height: 1.2; white-space: nowrap;">
          SEKRETARIAT : Jl. Dempo No.19 Pegangsaan - Jakarta Pusat 10320
        </div>
        <div style="font-size: 7.5px; color: #374151; line-height: 1.2; white-space: nowrap;">
          Telp. (021) 3904146 &nbsp; Email: sekretariat@dsnmui.or.id &nbsp; Web: www.dsnmui.or.id
        </div>
      </td>
      <td style="width: 70px; vertical-align: middle; text-align: right; padding: 0 0 0 8px;">
        <div style="border: 1px solid #000000; padding: 3px; font-size: 6px; text-align: center; line-height: 1.1; font-weight: bold; color: #111827;">
          <div style="border-bottom: 1px solid #000000; padding-bottom: 1px; margin-bottom: 1.5px; font-size: 5px;">REGISTERED</div>
          <div style="font-weight: 800; font-size: 8px; letter-spacing: 0.5px; margin-bottom: 0.5px;">WQA</div>
          <div style="font-size: 5px; margin: 1px 0;">ISO 9001:2015</div>
          <div style="border-top: 1px dashed #000000; padding-top: 1px; margin-top: 1.5px; font-size: 4.5px;">UKAS 134</div>
        </div>
      </td>
    </tr>
  </table>

  <div style="text-align: center; font-size: 20px; font-family: 'Times New Roman', serif; margin-top: 12px; margin-bottom: 18px; color: #111827;">
    بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
  </div>

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

  await prisma.$disconnect();
  console.log('Done!');
}

updateTemplates().catch(e => { console.error(e); process.exit(1); });
