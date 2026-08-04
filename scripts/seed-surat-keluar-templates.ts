import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Shared letterhead used by all surat keluar templates
const LETTERHEAD = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>{{perihal}}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; line-height: 1.6; margin: 40px; font-size: 12px; }
    .letter-title { text-align: center; font-size: 14px; font-weight: 800; text-decoration: underline; text-transform: uppercase; margin: 10px 0 20px; color: #111827; }
    .meta-section { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .meta-col { display: flex; flex-direction: column; gap: 2px; }
    .meta-row { display: flex; gap: 6px; }
    .meta-label { font-weight: bold; width: 80px; }
    .recipient-block { margin-bottom: 24px; }
    .letter-body { font-size: 12px; min-height: 250px; }
    .signature-block { display: flex; justify-content: flex-end; margin-top: 60px; border-top: 1px dashed #e2e8f0; padding-top: 20px; }
    .signature-inner { text-align: center; min-width: 180px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0; }
    td, th { padding: 6px 8px; vertical-align: top; }
  </style>
</head>
<body>
  <table style="width:100%;border-collapse:collapse;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:12px;">
    <tr>
      <td style="width:65px;vertical-align:middle;padding:0 8px 0 0;">
        <img src="https://www.dsnmui.or.id/wp-content/uploads/2020/10/Logo-DSN-MUI.png" alt="Logo DSN-MUI" style="width:55px;height:55px;object-fit:contain;" />
      </td>
      <td style="text-align:left;vertical-align:middle;padding:0;">
        <div style="font-size:11px;font-weight:bold;text-transform:uppercase;color:#111827;letter-spacing:-0.2px;margin-bottom:1px;line-height:1.2;white-space:nowrap;">DEWAN SYARIAH NASIONAL - MAJELIS ULAMA INDONESIA</div>
        <div style="font-size:8.5px;font-weight:bold;color:#111827;margin-bottom:3px;line-height:1.2;white-space:nowrap;">National Sharia Board - Indonesian Council of Ulama</div>
        <div style="font-size:7.5px;color:#374151;margin-bottom:1px;line-height:1.2;white-space:nowrap;">SEKRETARIAT : Jl. Dempo No.19 Pegangsaan - Jakarta Pusat 10320</div>
        <div style="font-size:7.5px;color:#374151;line-height:1.2;white-space:nowrap;">Telp. (021) 3904146 &nbsp; Email: sekretariat@dsnmui.or.id &nbsp; Web: www.dsnmui.or.id</div>
      </td>
      <td style="width:70px;vertical-align:middle;text-align:right;padding:0 0 0 8px;">
        <div style="border:1px solid #000;padding:3px;font-size:6px;text-align:center;line-height:1.1;font-weight:bold;color:#111827;">
          <div style="border-bottom:1px solid #000;padding-bottom:1px;margin-bottom:1.5px;font-size:5px;">REGISTERED</div>
          <div style="font-weight:800;font-size:8px;letter-spacing:0.5px;margin-bottom:0.5px;">WQA</div>
          <div style="font-size:5px;margin:1px 0;">ISO 9001:2015</div>
          <div style="border-top:1px dashed #000;padding-top:1px;margin-top:1.5px;font-size:4.5px;">UKAS 134</div>
        </div>
      </td>
    </tr>
  </table>

  <div style="text-align:center;font-size:20px;font-family:'Times New Roman',serif;margin-top:12px;margin-bottom:18px;color:#111827;">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</div>

  <div class="letter-title">{{judulSurat}}</div>

  <div class="meta-section">
    <div class="meta-col">
      <div class="meta-row"><span class="meta-label">Nomor</span><span>: {{nomorSurat}}</span></div>
      <div class="meta-row"><span class="meta-label">Lampiran</span><span>: {{lampiran}}</span></div>
      <div class="meta-row"><span class="meta-label">Perihal</span><span>: {{perihal}}</span></div>
    </div>
    <div class="meta-col" style="text-align:right;align-items:flex-end;">
      <div>{{tempatDibuat}}, {{tanggalMasehi}} M</div>
      <div>{{tanggalHijriah}}</div>
    </div>
  </div>

  <div class="recipient-block">
    <p style="margin-bottom:2px;">Kepada Yang Terhormat,</p>
    <p style="font-weight:bold;margin-bottom:2px;">{{namaPenerima}}</p>
    <p>{{alamatPenerima}}</p>
  </div>

  <div class="letter-body">
    {{isiSurat}}
  </div>

  <div class="signature-block">
    <div class="signature-inner">
      <div style="font-size:11px;color:#4b5563;margin-bottom:45px;">{{jabatanPenandatangan}},</div>
      <div style="font-size:12px;font-weight:bold;text-decoration:underline;color:#111827;">{{namaPenandatangan}}</div>
      <div style="font-size:10px;color:#6b7280;margin-top:2px;">{{jabatanPenandatanganDetail}}</div>
    </div>
  </div>
</body>
</html>`;

const COMMON_VARS = [
  { key: 'judulSurat', label: 'Judul / Nama Surat', type: 'text', required: true },
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: '001/SR/DSN-MUI/VI/2026' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '—' },
  { key: 'perihal', label: 'Perihal', type: 'text', required: true },
  { key: 'tempatDibuat', label: 'Tempat Dibuat', type: 'text', required: true, placeholder: 'Jakarta' },
  { key: 'tanggalMasehi', label: 'Tanggal (Masehi)', type: 'text', required: true, placeholder: '24 Juni 2026' },
  { key: 'tanggalHijriah', label: 'Tanggal (Hijriah)', type: 'text', required: false, placeholder: "28 Dzulhijjah 1447 H" },
  { key: 'namaPenerima', label: 'Nama Penerima', type: 'text', required: true, placeholder: 'Pimpinan / Anggota Organisasi' },
  { key: 'alamatPenerima', label: 'Alamat Penerima', type: 'text', required: true, placeholder: 'di — Tempat' },
  { key: 'namaPenandatangan', label: 'Nama Penandatangan', type: 'text', required: true },
  { key: 'jabatanPenandatangan', label: 'Label Jabatan (Menyetujui/Ketua)', type: 'text', required: true, placeholder: 'Menyetujui' },
  { key: 'jabatanPenandatanganDetail', label: 'Detail Jabatan Penandatangan', type: 'text', required: false },
];

const TEMPLATES = [
  {
    name: 'Surat Rutin Internal',
    code: 'SK-RUTIN',
    category: 'Surat Internal',
    description: 'Template surat rutin untuk keperluan koordinasi program kerja antar unit dan undangan pertemuan rutin.',
    htmlContent: LETTERHEAD.replace('{{isiSurat}}', `<p>Dengan hormat,</p>
    <p>Sehubungan dengan kelancaran koordinasi program kerja antar unit, kami mengharapkan kehadiran seluruh Kepala Bidang dan staff terkait pada pertemuan koordinasi rutin yang akan diselenggarakan pada:</p>
    <table style="margin: 12px 0; border-collapse: collapse;">
      <tbody>
        <tr><td style="width:25%;padding:4px 0;font-weight:bold;">Hari, Tanggal</td><td>: {{hariTanggalAcara}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Waktu</td><td>: {{waktuAcara}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Tempat</td><td>: {{tempatAcara}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Agenda</td><td>: {{agendaAcara}}</td></tr>
      </tbody>
    </table>
    <p>Demikian undangan ini kami sampaikan. Mengingat pentingnya agenda tersebut, kehadiran dan partisipasi aktif Bapak/Ibu sangat diharapkan. Atas perhatian dan kerja samanya, kami ucapkan terima kasih.</p>`),
    variables: [
      ...COMMON_VARS,
      { key: 'hariTanggalAcara', label: 'Hari & Tanggal Acara', type: 'text', required: true, placeholder: 'Senin, 8 Juni 2026' },
      { key: 'waktuAcara', label: 'Waktu Acara', type: 'text', required: true, placeholder: '09.00 WIB - Selesai' },
      { key: 'tempatAcara', label: 'Tempat Acara', type: 'text', required: true, placeholder: 'Ruang Rapat Utama Lt. 2' },
      { key: 'agendaAcara', label: 'Agenda', type: 'text', required: true, placeholder: 'Koordinasi Kerja & Evaluasi Bulanan' },
    ],
  },
  {
    name: 'Surat Pengantar Internal',
    code: 'SK-PENGANTAR',
    category: 'Surat Internal',
    description: 'Template surat pengantar untuk mengirimkan dokumen-dokumen internal beserta daftar dokumen yang dikirimkan.',
    htmlContent: LETTERHEAD.replace('{{isiSurat}}', `<p>Dengan hormat,</p>
    <p>Bersama ini kami kirimkan dokumen-dokumen internal organisasi berikut untuk dapat dipergunakan sebagaimana mestinya:</p>
    <table style="width:100%;margin:12px 0;border:1px solid #cbd5e1;border-collapse:collapse;">
      <thead>
        <tr style="background-color:#f8fafc;">
          <th style="border:1px solid #cbd5e1;padding:8px;text-align:center;width:8%;">No</th>
          <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Nama Dokumen</th>
          <th style="border:1px solid #cbd5e1;padding:8px;text-align:center;width:15%;">Jumlah</th>
          <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Keterangan</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">1</td>
          <td style="border:1px solid #cbd5e1;padding:8px;">{{dokumen1Nama}}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">{{dokumen1Jumlah}}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;">{{dokumen1Ket}}</td>
        </tr>
        <tr>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">2</td>
          <td style="border:1px solid #cbd5e1;padding:8px;">{{dokumen2Nama}}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;text-align:center;">{{dokumen2Jumlah}}</td>
          <td style="border:1px solid #cbd5e1;padding:8px;">{{dokumen2Ket}}</td>
        </tr>
      </tbody>
    </table>
    <p>Demikian pengantar ini disampaikan, mohon penerimaan dokumen dapat dikonfirmasi kembali kepada sekretariat kami. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.</p>`),
    variables: [
      ...COMMON_VARS,
      { key: 'dokumen1Nama', label: 'Dokumen 1 — Nama', type: 'text', required: true, placeholder: 'Laporan Keuangan Kuartal I' },
      { key: 'dokumen1Jumlah', label: 'Dokumen 1 — Jumlah', type: 'text', required: true, placeholder: '1 Rangkap' },
      { key: 'dokumen1Ket', label: 'Dokumen 1 — Keterangan', type: 'text', required: false, placeholder: 'Mohon ditandatangani' },
      { key: 'dokumen2Nama', label: 'Dokumen 2 — Nama', type: 'text', required: false, placeholder: 'Proposal Program Pelatihan' },
      { key: 'dokumen2Jumlah', label: 'Dokumen 2 — Jumlah', type: 'text', required: false, placeholder: '2 Bundel' },
      { key: 'dokumen2Ket', label: 'Dokumen 2 — Keterangan', type: 'text', required: false, placeholder: 'Arsip Unit Kerja' },
    ],
  },
  {
    name: 'Surat Keputusan',
    code: 'SK-KEPUTUSAN',
    category: 'Surat Keputusan',
    description: 'Template Surat Keputusan formal DSN-MUI dengan format Menimbang, Mengingat, dan Menetapkan.',
    htmlContent: LETTERHEAD.replace('{{isiSurat}}', `<p style="text-align:center;font-weight:bold;margin-bottom:16px;">TENTANG<br>{{tentang}}</p>
    <p style="font-weight:bold;text-decoration:underline;margin-top:12px;">Menimbang:</p>
    <ol style="margin-left:20px;list-style-type:lower-alpha;padding-left:0;">
      <li>{{menimbangA}}</li>
      <li>{{menimbangB}}</li>
    </ol>
    <p style="font-weight:bold;text-decoration:underline;margin-top:12px;">Mengingat:</p>
    <ol style="margin-left:20px;list-style-type:decimal;padding-left:0;">
      <li>{{mengingatA}}</li>
      <li>{{mengingatB}}</li>
    </ol>
    <p style="text-align:center;font-weight:bold;margin-top:20px;text-transform:uppercase;">MEMUTUSKAN</p>
    <p style="font-weight:bold;text-decoration:underline;margin-top:12px;">Menetapkan:</p>
    <ol style="margin-left:20px;list-style-type:decimal;padding-left:0;">
      <li>{{menetapkanA}}</li>
      <li>Keputusan ini berlaku sejak tanggal ditetapkan dengan ketentuan apabila terdapat kekeliruan akan diperbaiki sebagaimana mestinya.</li>
    </ol>`),
    variables: [
      ...COMMON_VARS,
      { key: 'tentang', label: 'Perihal Keputusan (TENTANG ...)', type: 'text', required: true, placeholder: 'PENGANGKATAN PENGURUS UNIT KERJA DIGITALISASI' },
      { key: 'menimbangA', label: 'Menimbang — Poin A', type: 'textarea', required: true },
      { key: 'menimbangB', label: 'Menimbang — Poin B', type: 'textarea', required: false },
      { key: 'mengingatA', label: 'Mengingat — Poin 1', type: 'textarea', required: true, placeholder: 'Anggaran Dasar dan Anggaran Rumah Tangga organisasi' },
      { key: 'mengingatB', label: 'Mengingat — Poin 2', type: 'textarea', required: false },
      { key: 'menetapkanA', label: 'Menetapkan — Poin 1', type: 'textarea', required: true },
    ],
  },
  {
    name: 'Surat Mandat',
    code: 'SK-MANDAT',
    category: 'Surat Mandat',
    description: 'Template surat mandat untuk memberikan wewenang kepada seseorang untuk bertindak atas nama organisasi.',
    htmlContent: LETTERHEAD.replace('{{isiSurat}}', `<p>Dengan hormat,</p>
    <p>Yang bertanda tangan di bawah ini memberikan mandat sepenuhnya kepada:</p>
    <table style="margin:12px 0;border-collapse:collapse;">
      <tbody>
        <tr><td style="width:25%;padding:4px 0;font-weight:bold;">Nama</td><td>: {{namaPenerima}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Jabatan</td><td>: {{jabatanPenerimaMandatDetail}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Alamat</td><td>: {{alamatPenerimaMandatDetail}}</td></tr>
      </tbody>
    </table>
    <p>Untuk bertindak selaku perwakilan organisasi dalam {{tujuanMandat}}.</p>
    <p>Demikian surat mandat ini dibuat untuk dipergunakan dengan penuh tanggung jawab oleh penerima mandat.</p>`),
    variables: [
      ...COMMON_VARS,
      { key: 'jabatanPenerimaMandatDetail', label: 'Jabatan Penerima Mandat', type: 'text', required: true, placeholder: 'Kepala Hubungan Masyarakat' },
      { key: 'alamatPenerimaMandatDetail', label: 'Alamat Penerima Mandat', type: 'text', required: false, placeholder: 'Jl. Kramat Raya No. 164, Jakarta Pusat' },
      { key: 'tujuanMandat', label: 'Tujuan / Kegiatan yang Dimandatkan', type: 'textarea', required: true, placeholder: 'menghadiri rapat koordinasi nasional dan mengambil keputusan-keputusan strategis' },
    ],
  },
  {
    name: 'Surat Tugas',
    code: 'SK-TUGAS',
    category: 'Surat Tugas',
    description: 'Template surat tugas untuk menugaskan seseorang atau tim dalam rangka pelaksanaan suatu program/kegiatan.',
    htmlContent: LETTERHEAD.replace('{{isiSurat}}', `<p>Dengan hormat,</p>
    <p>Dalam rangka {{latar}}, dengan ini menugaskan kepada:</p>
    <table style="margin:12px 0;border-collapse:collapse;">
      <tbody>
        <tr><td style="width:25%;padding:4px 0;font-weight:bold;">Nama</td><td>: {{namaPenerima}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Jabatan</td><td>: {{jabatanPenerimaTugas}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Tugas</td><td>: {{deskripsiTugas}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">Durasi Tugas</td><td>: {{durasiTugas}}</td></tr>
      </tbody>
    </table>
    <p>Setelah melaksanakan tugas tersebut, penerima tugas wajib memberikan laporan tertulis hasil pelaksanaan kegiatan kepada pimpinan organisasi. Atas perhatian dan dukungannya, diucapkan terima kasih.</p>`),
    variables: [
      ...COMMON_VARS,
      { key: 'latar', label: 'Latar Belakang Penugasan', type: 'text', required: true, placeholder: 'implementasi program digitalisasi administrasi' },
      { key: 'jabatanPenerimaTugas', label: 'Jabatan Penerima Tugas', type: 'text', required: true, placeholder: 'Direktur TI & Sistem Informasi' },
      { key: 'deskripsiTugas', label: 'Deskripsi Tugas', type: 'textarea', required: true, placeholder: 'Melakukan sosialisasi & pendampingan teknis...' },
      { key: 'durasiTugas', label: 'Durasi / Periode Tugas', type: 'text', required: true, placeholder: '8 Juni s.d 12 Juni 2026' },
    ],
  },
  {
    name: 'Surat Informasi',
    code: 'SK-INFORMASI',
    category: 'Surat Internal',
    description: 'Template surat pengumuman / pemberitahuan informasi kepada seluruh anggota dan mitra kerja.',
    htmlContent: LETTERHEAD.replace('{{isiSurat}}', `<p>Kepada Yth. Seluruh Anggota dan Mitra Kerja,</p>
    <p>Diberitahukan bahwa {{isiPengumuman}}:</p>
    <table style="margin:12px 0;border-collapse:collapse;">
      <tbody>
        <tr><td style="width:25%;padding:4px 0;font-weight:bold;">Hari/Tanggal</td><td>: {{hariTanggal}}</td></tr>
        <tr><td style="padding:4px 0;font-weight:bold;">{{labelTambahan}}</td><td>: {{nilaiTambahan}}</td></tr>
      </tbody>
    </table>
    <p>{{keteranganTambahan}} Demikian pengumuman ini disampaikan untuk diketahui bersama.</p>`),
    variables: [
      ...COMMON_VARS,
      { key: 'isiPengumuman', label: 'Pokok Pengumuman', type: 'textarea', required: true, placeholder: 'dalam rangka libur nasional Hari Raya, aktivitas pelayanan kantor akan diliburkan sementara' },
      { key: 'hariTanggal', label: 'Hari/Tanggal', type: 'text', required: true, placeholder: 'Kamis s.d. Minggu, 28 s.d. 31 Mei 2026' },
      { key: 'labelTambahan', label: 'Label Baris Kedua', type: 'text', required: false, placeholder: 'Pelayanan Kembali' },
      { key: 'nilaiTambahan', label: 'Nilai Baris Kedua', type: 'text', required: false, placeholder: 'Senin, 1 Juni 2026' },
      { key: 'keteranganTambahan', label: 'Keterangan Tambahan', type: 'textarea', required: false, placeholder: 'Selama masa libur tersebut, koordinasi penting darurat dapat dilakukan secara online...' },
    ],
  },
  {
    name: 'Undangan Rapat Pimpinan Badan Pengurus (U-0638)',
    code: 'U-0638-UNDANGAN-BPH',
    category: 'Undangan',
    description: 'Template resmi Undangan Rapat Pimpinan Badan Pengurus DSN-MUI.',
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
  },
];

async function seedSuratKeluarTemplates() {
  for (const t of TEMPLATES) {
    const result = await prisma.letterTemplate.upsert({
      where: { code: t.code },
      update: {
        name: t.name,
        category: t.category,
        description: t.description,
        htmlContent: t.htmlContent,
        variables: t.variables,
      },
      create: t,
    });
    console.log(`✅ Seeded: ${result.name} (${result.code})`);
  }
  await prisma.$disconnect();
  console.log('\nDone! All 6 Surat Keluar templates seeded.');
}

seedSuratKeluarTemplates().catch(e => { console.error(e); process.exit(1); });
