import { prisma } from '../lib/prisma.js';

async function main() {
  const tpl = {
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
  };

  const res = await prisma.letterTemplate.upsert({
    where: { code: tpl.code },
    update: tpl,
    create: tpl,
  });

  console.log('✅ Template U-0000 successfully seeded into database:', res.id);
}

main().catch(console.error).finally(() => process.exit(0));
