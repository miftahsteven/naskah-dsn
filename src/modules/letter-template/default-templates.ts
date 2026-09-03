export const HEADER_HTML = `<div style="text-align: center; margin-bottom: 4px; margin-left: 0; margin-right: 0; padding-top: 0;">
    <img src="/images/kop-surat.png" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
  </div>

  <!-- Bismillah Calligraphy -->
  <div style="text-align: center; margin-top: 8px; margin-bottom: 14px;">
    <img src="/images/bismillah.svg" alt="Bismillah" style="width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;" />
  </div>`;

export const FOOTER_HTML = `<table class="amanah-letter-footer" style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif;">
    <tr>
      <td style="vertical-align: middle; text-align: left; padding: 4px 10px 4px 0; font-size: 7.5pt; line-height: 1.25; font-style: italic; color: #1f2937; border-top: 1px solid #e5e7eb;">
        Dokumen ini telah ditandatangani secara elektronik oleh Sistem Digital Amanah dibawah otoritas Dewan Syariah Nasional-Majelis Ulama Indonesia. Untuk memastikan keaslian tanda tangan elektronik, silakan pindai QR-Code
      </td>
      <td style="vertical-align: middle; text-align: right; width: 32px; padding: 4px 0; border-top: 1px solid #e5e7eb;">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style="display: inline-block; vertical-align: middle;">
          <path d="M16 2L5 6.5V14.5C5 21.2 9.7 27.5 16 29.5C22.3 27.5 27 21.2 27 14.5V6.5L16 2Z" fill="#006633" stroke="#004D26" stroke-width="1.5" stroke-linejoin="round"/>
          <circle cx="16" cy="16" r="8.5" fill="#006633" stroke="#ffffff" stroke-width="1" stroke-dasharray="2 1.5"/>
          <path d="M12 16L14.8 18.8L20.5 13" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </td>
    </tr>
  </table>`;

export const FULL_HTML_PKS = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr><td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{nomorSurat}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Lamp.</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{lampiran}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Hal</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td></tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{namaLembaga}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{alamatLembaga}}</div>
    </div>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Sehubungan dengan permohonan kesesuaian syariah atas <strong>{{namaTransaksi}}</strong>
      yang diajukan oleh <strong>{{namaPemohon}}</strong> pada tanggal <strong>{{tanggalPermohonan}}</strong>,
      dengan ini Dewan Syariah Nasional – Majelis Ulama Indonesia (DSN-MUI) menyatakan bahwa:
    </p>

    <ol style="text-align: justify; margin-top: 0; margin-bottom: 8px; margin-left: 0; padding-left: 20px; line-height: 1.25;">
      <li style="margin-bottom: 6px;">
        <strong>{{namaTransaksi}}</strong> yang dilaksanakan oleh <strong>{{namaPelaksana}}</strong>
        <strong>telah sesuai dengan ketentuan syariah</strong> berdasarkan fatwa DSN-MUI
        Nomor <strong>{{nomorFatwa}}</strong> tentang <strong>{{judulFatwa}}</strong>.
      </li>
      <li style="margin-bottom: 6px;">
        Transaksi sebagaimana dimaksud pada angka 1 dilaksanakan dalam rangka <strong>{{tujuanTransaksi}}</strong>
        dengan nilai transaksi sebesar <strong>{{nilaiTransaksi}}</strong>.
      </li>
      <li style="margin-bottom: 6px;">
        Pernyataan ini berlaku sejak tanggal ditetapkan dan dapat ditinjau ulang apabila terdapat
        perubahan atas ketentuan syariah yang relevan.
      </li>
    </ol>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Demikian Pernyataan Kesesuaian Syariah ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya.
    </p>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Ketua,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>

    \${FOOTER_HTML}
  </div>
</div>`;

export const FULL_VARS_PKS = [
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'B-0442/DSN-MUI/VI/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '24 Juni 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '8 Muharram 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-' },
  { key: 'perihal', label: 'Perihal', type: 'text', required: true, placeholder: 'PKS Sukuk Internasional Tahun 2026' },
  { key: 'namaLembaga', label: 'Nama Lembaga Tujuan', type: 'text', required: true, placeholder: 'Direktur Jenderal Pengelolaan Pembiayaan dan Risiko' },
  { key: 'alamatLembaga', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaTransaksi', label: 'Nama Transaksi / Produk', type: 'text', required: true, placeholder: 'Sukuk Internasional Tahun 2026' },
  { key: 'namaPemohon', label: 'Nama Pemohon', type: 'text', required: true, placeholder: 'DJPPR Kementerian Keuangan RI' },
  { key: 'tanggalPermohonan', label: 'Tanggal Permohonan', type: 'text', required: true, placeholder: '10 Juni 2026' },
  { key: 'namaPelaksana', label: 'Nama Pelaksana / Emiten', type: 'text', required: true, placeholder: 'Pemerintah Republik Indonesia' },
  { key: 'nomorFatwa', label: 'Nomor Fatwa DSN-MUI', type: 'text', required: true, placeholder: '137/DSN-MUI/V/2020' },
  { key: 'judulFatwa', label: 'Judul Fatwa', type: 'text', required: true, placeholder: 'Sukuk' },
  { key: 'tujuanTransaksi', label: 'Tujuan Transaksi', type: 'textarea', required: true, placeholder: 'pembiayaan APBN Tahun 2026' },
  { key: 'nilaiTransaksi', label: 'Nilai Transaksi', type: 'text', required: true, placeholder: 'USD 2.000.000.000 (dua miliar Dollar Amerika Serikat)' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'namaKetua', label: 'Nama Ketua DSN-MUI', type: 'text', required: true, placeholder: 'Prof. Dr. H. Hasanuddin AF, M.A.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris DSN-MUI', type: 'text', required: true, placeholder: 'Dr. H. Anwar Abbas, M.M., M.Ag.' },
];

export const FULL_HTML_OPINI = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr><td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{nomorSurat}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Lamp.</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{lampiran}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Hal</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Opini Syariah atas {{perihal}}</td></tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{namaLembaga}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{alamatLembaga}}</div>
    </div>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Menanggapi surat/permohonan dari <strong>{{namaPemohon}}</strong> Nomor <strong>{{nomorSuratPermohonan}}</strong>
      tanggal <strong>{{tanggalPermohonan}}</strong> perihal <strong>{{perihal}}</strong>,
      setelah melakukan kajian mendalam, dengan ini DSN-MUI menyampaikan Opini Syariah sebagai berikut:
    </p>

    <p style="font-weight: bold; margin-top: 0; margin-bottom: 4px;">A. Deskripsi Transaksi</p>
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; white-space: pre-line; line-height: 1.25;">{{deskripsiTransaksi}}</p>

    <p style="font-weight: bold; margin-top: 0; margin-bottom: 4px;">B. Dasar Hukum Syariah</p>
    <ol style="margin-top: 0; margin-bottom: 8px; margin-left: 0; padding-left: 20px; line-height: 1.25;">
      <li>Al-Qur'an dan Hadis yang relevan;</li>
      <li>Fatwa DSN-MUI Nomor <strong>{{nomorFatwa}}</strong> tentang <strong>{{judulFatwa}}</strong>;</li>
      <li style="white-space: pre-line;">{{dasarHukumTambahan}}</li>
    </ol>

    <p style="font-weight: bold; margin-top: 0; margin-bottom: 4px;">C. Opini Syariah</p>
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; line-height: 1.25;">
      Berdasarkan kajian dan analisis syariah, DSN-MUI berpendapat bahwa
      <strong>{{namaTransaksi}}</strong> yang dilaksanakan oleh <strong>{{namaPelaksana}}</strong>
      <strong>selaras dengan prinsip-prinsip syariah</strong>, dengan catatan:
    </p>
    <ol style="text-align: justify; margin-top: 0; margin-bottom: 8px; margin-left: 0; padding-left: 20px; line-height: 1.25;">
      <li style="margin-bottom: 6px; white-space: pre-line;">{{syaratSatu}}</li>
      <li style="margin-bottom: 6px; white-space: pre-line;">{{syaratDua}}</li>
      <li style="margin-bottom: 6px;">Apabila terdapat perubahan struktur transaksi, perlu dilakukan kajian ulang untuk memastikan keselarasan syariah.</li>
    </ol>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Demikian Opini Syariah ini kami sampaikan untuk menjadi perhatian dan dapat dipergunakan sebagaimana mestinya.
    </p>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Ketua,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>

    \${FOOTER_HTML}
  </div>
</div>`;

export const FULL_VARS_OPINI = [
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'B-0703/DSN-MUI/VI/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '24 Juni 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '8 Muharram 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-' },
  { key: 'perihal', label: 'Perihal / Nama Transaksi', type: 'text', required: true, placeholder: 'Transaksi Cross Switching SUN dengan SBSN' },
  { key: 'namaLembaga', label: 'Nama Lembaga Tujuan', type: 'text', required: true, placeholder: 'Kepala DEKS Bank Indonesia' },
  { key: 'alamatLembaga', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaPemohon', label: 'Nama / Instansi Pemohon', type: 'text', required: true, placeholder: 'DEKS Bank Indonesia' },
  { key: 'nomorSuratPermohonan', label: 'Nomor Surat Permohonan', type: 'text', required: true, placeholder: 'No. B-xxx/DEKS/xxx/2026' },
  { key: 'tanggalPermohonan', label: 'Tanggal Permohonan', type: 'text', required: true, placeholder: '10 Juni 2026' },
  { key: 'deskripsiTransaksi', label: 'Deskripsi Transaksi', type: 'textarea', required: true, placeholder: 'Penjelasan mekanisme transaksi secara rinci...' },
  { key: 'namaTransaksi', label: 'Nama Transaksi', type: 'text', required: true, placeholder: 'Cross Switching SUN dengan SBSN' },
  { key: 'namaPelaksana', label: 'Nama Pelaksana', type: 'text', required: true, placeholder: 'Bank Indonesia' },
  { key: 'nomorFatwa', label: 'Nomor Fatwa DSN-MUI', type: 'text', required: true, placeholder: '137/DSN-MUI/V/2020' },
  { key: 'judulFatwa', label: 'Judul Fatwa', type: 'text', required: true, placeholder: 'Surat Berharga Syariah Negara (SBSN)' },
  { key: 'dasarHukumTambahan', label: 'Dasar Hukum Tambahan', type: 'textarea', required: false, placeholder: 'Peraturan/regulasi lain yang relevan' },
  { key: 'syaratSatu', label: 'Syarat/Catatan Pertama', type: 'textarea', required: true, placeholder: 'Akad yang digunakan harus ...' },
  { key: 'syaratDua', label: 'Syarat/Catatan Kedua', type: 'textarea', required: true, placeholder: 'Mekanisme pelaksanaan harus ...' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'namaKetua', label: 'Nama Ketua DSN-MUI', type: 'text', required: true, placeholder: 'Prof. Dr. H. Hasanuddin AF, M.A.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris DSN-MUI', type: 'text', required: false, placeholder: 'Dr. H. Anwar Abbas, M.M., M.Ag.' },
];

export const FULL_HTML_UNDANGAN_FATWA = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{penerimaUndangan}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.25;">
      Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{perihalRapat}}</strong>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL TABLE -->
    <table style="margin-left: 30px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.25;">
      <tr>
        <td style="width: 120px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
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

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.25;">
      Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
    </p>

    <!-- SALAM PENUTUP -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Ketua,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Page Break for Lampiran 1 -->
  <div style="page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 10.5pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 1 Daftar Undangan {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{daftarUndanganLampiran}}
    </div>
  </div>

  <!-- Page Break for Lampiran 2 -->
  <div style="page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 10.5pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 2 Agenda Rapat {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{agendaRapatLampiran}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_UNDANGAN_FATWA = [
  { key: 'nomorSurat', label: 'Nomor Surat', type: 'text', required: true, placeholder: 'U-0666/DSN-MUI/VIII/2026' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal Surat', type: 'text', required: true, placeholder: 'Undangan Rapat Bidang Fatwa DSN-MUI' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '10 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '26 Shafar 1448 H' },
  { key: 'penerimaUndangan', label: 'Penerima Undangan (Kepada Yth.)', type: 'textarea', required: true, placeholder: '1. Pimpinan DSN-MUI Bidang Fatwa Perbankan\n2. Pimpinan DSN-MUI Bidang Fatwa Non Perbankan\n3. Bidang Fatwa DSN-MUI' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'perihalRapat', label: 'Perihal Rapat (Kalimat Pembuka)', type: 'text', required: true, placeholder: 'Rapat Bidang Fatwa DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari, tanggal Rapat', type: 'text', required: true, placeholder: 'Selasa, 11 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 WIB - selesai' },
  { key: 'tempatRapat', label: 'Tempat Rapat', type: 'textarea', required: true, placeholder: 'Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320' },
  { key: 'agendaRapat', label: 'Agenda Singkat (Tabel)', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'namaKetua', label: 'Nama Ketua', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndanganLampiran', label: 'Lampiran 1: Daftar Undangan', type: 'wysiwyg', required: true, placeholder: '1. Unsur Pimpinan:\nWakil Ketua: Prof. Dr. K.H. Hasanudin, M.Ag.\n...' },
  { key: 'agendaRapatLampiran', label: 'Lampiran 2: Agenda Rapat', type: 'wysiwyg', required: true, placeholder: 'Pukul 13.00 – 14.00 WIB:\n1. Pembahasan Lanjutan Hasil FGD...\n...' }
];

export const DEFAULT_DAFTAR_UNDANGAN_BPH = `<div style="font-size: 10.5pt; line-height: 1.35;">
  <div style="font-weight: bold; margin-bottom: 4px;">1. Unsur Pimpinan:</div>
  <table style="margin-left: 16px; border-collapse: collapse; font-size: 10.5pt; line-height: 1.35; margin-bottom: 12px;">
    <tr><td style="width: 140px; vertical-align: top; padding: 2px 0;">Ketua</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">K.H. M. Cholil Nafis, Lc., Ph.D.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Prof. Dr. K.H. Hasanudin, M.Ag.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">K.H. Sholahudin Al Aiyub, M.Si.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Prof. Dr. K.H. M. Asrorun Ni’am Sholeh, S.H., M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Ketua</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Ir. H. Adiwarman A. Karim, S.E., M.B.A., M.A.E.P.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. H. Amirsyah Tambunan, M.A</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Kanny Hidaya, S.E., M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. Asrori S. Karni, S.Ag., M.H.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Drs. H. Muhammad Ziyad, M.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Bendahara</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Hj. Trisna Ningsih Yulati Djuwaeli, S.E., M.M.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Bendahara</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">M. Gunawan Yasni, S.E., Ak., M.M., C.I.F.A., F.I.I.S., C.R.P., C.A.</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Bendahara</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. M. Dawud Arif Khan, S.E., Ak., M.Si., C.P.A. QIA, QGIA.</td></tr>
  </table>
  <div style="font-weight: bold; margin-bottom: 2px;">2. Koordinator Bidang Fatwa</div>
  <div style="margin-left: 16px; margin-bottom: 12px;">Prof. Dr. H. Jaih Mubarok, S.E., M.H., M.Ag.</div>
  <div style="font-weight: bold; margin-bottom: 2px;">3. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi</div>
  <div style="margin-left: 16px;">Dr. H. Asep Supyadillah, M.Ag.</div>
</div>`;

export const DEFAULT_AGENDA_DETAIL_BPH = `<div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
  <div style="font-weight: bold; margin-bottom: 6px;">Pukul 13.00 - 15.00 WIB:</div>
  <ol style="margin-top: 0; margin-bottom: 10px; padding-left: 20px;">
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan Hasil Pertemuan Silaturahmi DSN-MUI dengan PT. Bank Syariah Indonesia Tbk terkait Permohonan Fatwa DSN-MUI terkait Pengenaan Mu'nah pada Gadai Tabungan Emas BSI oleh PT. Bank Syariah Indonesia dilaporkan oleh Kyai Bukhori Muslim.</li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan Menerima Kunjungan Komisi III DPRD Provinsi Nusa Tenggara Barat dilaporkan oleh Kyai Sholahudin Al Aiyub.</li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan hasil menerima Silaturahim Direksi PT BPD Kalimantan Selatan (Bank Kalsel) pada Jumat, 31 Juli 2026 terkait Permohonan Rekomendasi DPS dilaporkan oleh Ust Adiwarman Karim.</li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Laporan terkait tindaklanjut Permohonan Rekomendasi DPS, TAS, dan Sertifikasi Syariah dan surat masuk (oleh Ust Asep):
      <ol type="a" style="margin-top: 4px; margin-bottom: 4px; padding-left: 18px;">
        <li style="margin-bottom: 4px; padding-left: 4px;">Permohonan Rekomendasi Tim Ahli Syariah Penerbitan Sukuk Mudharabah Berkelanjutan V Tahap III Tahun 2026 dari PT Indah Kiat Pulp & Paper Tbk.</li>
        <li style="margin-bottom: 4px; padding-left: 4px;">Permohonan Rekomendasi Tim Ahli Syariah untuk Penerbitan Sukuk Wakalah bi al-Istitsmar Jangka Menengah I PT Mitra Tekno Madani Tahun 2026 dari PT PNM Investment Management.</li>
        <li style="margin-bottom: 4px; padding-left: 4px;">Invitation to the 7th Centralized Shari’ah Authorities Forum (CSAF) & Islamic Finance Events dari Central Bank of The U.A.E.</li>
        <li style="margin-bottom: 4px; padding-left: 4px;">Laporan Hasil Pelatihan Dasar Muamalah Maliyah dan Fatwa (PDMMF) tanggal 30-31 Juli 2026 di MUI Pusat.</li>
      </ol>
    </li>
    <li style="margin-bottom: 6px; padding-left: 6px;">Dan lain-lain.</li>
  </ol>
  <div style="font-weight: bold; margin-top: 10px; margin-bottom: 4px;">Pukul 15.00 – 15.30 WIB:</div>
  <div style="font-style: italic; margin-left: 20px; margin-bottom: 10px;">Break Sholat Ashar</div>
  <div style="font-weight: bold; margin-top: 10px; margin-bottom: 6px;">Pukul 15.30 – 16.30 WIB:</div>
  <ol start="6" style="margin-top: 0; margin-bottom: 10px; padding-left: 20px;">
    <li style="margin-bottom: 6px; padding-left: 6px;">Silaturahim dan Diskusi Permohonan Pernyataan Kesesuaian Syariah SBSN CWLS Seri SWR007 Tahun 2026 dengan DJPPR Kementerian Keuangan RI.</li>
  </ol>
</div>`;

export const FULL_HTML_UNDANGAN_BPH = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- BODY CONTENT -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{daftarPenerima}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <div style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</div>

    <!-- PARAGRAF ISI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.25;">
      Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL TABLE -->
    <table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.25;">
      <tr>
        <td style="width: 120px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
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
        <td style="white-space: pre-line; font-weight: bold; padding: 2px 0;">{{tempatRapat}}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="font-weight: bold; padding: 2px 0;">{{agendaRapat}}</td>
      </tr>
    </table>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.25;">
      Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
    </p>

    <!-- SALAM PENUTUP -->
    <div style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</div>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 1 -->
  <div class="page-break" style="page-break-before: always; margin-top: 30px;">
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 2px;">Lampiran 1 Daftar Undangan {{namaRapat}}</div>
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 8px;">{{nomorSurat}}</div>
    <hr style="border: none; border-top: 1.5px solid #000; margin: 0 0 16px 0;" />
    <div style="font-size: 10.5pt; line-height: 1.35;">
      {{daftarUndangan}}
    </div>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 2 -->
  <div class="page-break" style="page-break-before: always; margin-top: 30px;">
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 2px;">Lampiran 2 Agenda {{namaRapat}}</div>
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 8px;">{{nomorSurat}}</div>
    <hr style="border: none; border-top: 1.5px solid #000; margin: 0 0 16px 0;" />
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{agendaDetail}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_UNDANGAN_BPH = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0638/DSN-MUI/VIII/2026', defaultValue: 'U-0638/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '4 Agustus 2026 M', defaultValue: '4 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '20 Shafar 1448 H', defaultValue: '20 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas', defaultValue: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Pimpinan Badan Pengurus DSN-MUI', defaultValue: 'Undangan Rapat Pimpinan Badan Pengurus DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima (Satu per baris)', type: 'textarea', required: true, placeholder: '1. Pimpinan Badan Pengurus DSN-MUI\n2. Koordinator Bidang Fatwa DSN-MUI\n3. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi DSN-MUI', defaultValue: '1. Pimpinan Badan Pengurus DSN-MUI\n2. Koordinator Bidang Fatwa DSN-MUI\n3. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi DSN-MUI' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Pimpinan Badan Pengurus DSN-MUI', defaultValue: 'Rapat Pimpinan Badan Pengurus DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Rabu, 5 Agustus 2026', defaultValue: 'Rabu, 5 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 15.00 WIB', defaultValue: '13.00 – 15.00 WIB' },
  { key: 'tempatRapat', label: 'Tempat Rapat', type: 'textarea', required: true, placeholder: 'Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320', defaultValue: 'Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir', defaultValue: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua', defaultValue: 'Ketua' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris', defaultValue: 'Sekretaris' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', defaultValue: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.', defaultValue: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'wysiwyg', required: true, placeholder: '1. Unsur Pimpinan...', defaultValue: DEFAULT_DAFTAR_UNDANGAN_BPH },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'wysiwyg', required: true, placeholder: 'Pukul 13.00 - 15.00 WIB...', defaultValue: DEFAULT_AGENDA_DETAIL_BPH }
];

export const DEFAULT_DAFTAR_UNDANGAN_KESEKRETARISAN = `<table style="border-collapse: collapse; font-size: 10.5pt; line-height: 1.35;">
  <tr><td style="width: 140px; vertical-align: top; padding: 2px 0;">Sekretaris</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. H. Amirsyah Tambunan, M.A</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Kanny Hidaya, S.E., M.A.</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Dr. Asrori S. Karni, S.Ag., M.H.</td></tr>
  <tr><td style="vertical-align: top; padding: 2px 0;">Wakil Sekretaris</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">Drs. H. Muhammad Ziyad, M.A.</td></tr>
</table>`;

export const DEFAULT_AGENDA_DETAIL_KESEKRETARISAN = `<ol style="margin-top: 0; margin-bottom: 10px; padding-left: 20px; font-size: 10.5pt; line-height: 1.35;">
  <li style="margin-bottom: 6px; padding-left: 6px;">Tindak Lanjut Keputusan Rapat Pimpinan.</li>
  <li style="margin-bottom: 6px; padding-left: 6px;">Pembahasan surat-surat Masuk</li>
  <li style="margin-bottom: 6px; padding-left: 6px;">Dan lain-lain.</li>
</ol>`;

export const FULL_HTML_UNDANGAN_KESEKRETARISAN = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- BODY CONTENT -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{daftarPenerima}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <div style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</div>

    <!-- PARAGRAF ISI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.25;">
      Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL TABLE -->
    <table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.25;">
      <tr>
        <td style="width: 120px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
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
        <td style="white-space: pre-line; font-weight: bold; padding: 2px 0;">{{mediaRapat}}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="font-weight: bold; padding: 2px 0;">{{agendaRapat}}</td>
      </tr>
    </table>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.25;">
      Mengingat pentingnya acara tersebut, kami mengharapkan Bapak/Ibu/Sdr/i dapat menghadirinya. Atas perhatian & kehadirannya diucapkan terima kasih.
    </p>

    <!-- SALAM PENUTUP -->
    <div style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</div>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 1 -->
  <div class="page-break" style="page-break-before: always; margin-top: 30px;">
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 2px;">Lampiran 1 Daftar Undangan {{namaRapat}}</div>
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 8px;">{{nomorSurat}}</div>
    <hr style="border: none; border-top: 1.5px solid #000; margin: 0 0 16px 0;" />
    <div style="font-size: 10.5pt; line-height: 1.35;">
      {{daftarUndangan}}
    </div>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 2 -->
  <div class="page-break" style="page-break-before: always; margin-top: 30px;">
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 2px;">Lampiran 2 Agenda {{namaRapat}}</div>
    <div style="font-weight: bold; font-size: 10.5pt; margin-bottom: 8px;">{{nomorSurat}}</div>
    <hr style="border: none; border-top: 1.5px solid #000; margin: 0 0 16px 0;" />
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{agendaDetail}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_UNDANGAN_KESEKRETARISAN = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0643/DSN-MUI/VIII/2026', defaultValue: 'U-0643/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '5 Agustus 2026 M', defaultValue: '5 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '21 Shafar 1448 H', defaultValue: '21 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas', defaultValue: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI', defaultValue: 'Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima', type: 'textarea', required: true, placeholder: 'Unsur Sekretaris Badan Pengurus DSN-MUI', defaultValue: 'Unsur Sekretaris Badan Pengurus DSN-MUI' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Kesekretarisan Badan Pengurus DSN-MUI', defaultValue: 'Rapat Kesekretarisan Badan Pengurus DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Kamis, 6 Agustus 2026', defaultValue: 'Kamis, 6 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 14.30 WIB', defaultValue: '13.00 – 14.30 WIB' },
  { key: 'mediaRapat', label: 'Media Rapat', type: 'textarea', required: true, placeholder: 'Zoom Cloud Meeting\n(Meeting ID: 859 4470 8501 | Passcode: DSNMUI26)', defaultValue: 'Zoom Cloud Meeting\n(Meeting ID: 859 4470 8501 | Passcode: DSNMUI26)' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir', defaultValue: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua', defaultValue: 'Ketua' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris', defaultValue: 'Sekretaris' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', defaultValue: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.', defaultValue: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'wysiwyg', required: true, placeholder: 'Sekretaris : Dr. H. Amirsyah Tambunan, M.A...', defaultValue: DEFAULT_DAFTAR_UNDANGAN_KESEKRETARISAN },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'wysiwyg', required: true, placeholder: '1. Tindak Lanjut Keputusan Rapat Pimpinan...', defaultValue: DEFAULT_AGENDA_DETAIL_KESEKRETARISAN }
];

export const FULL_HTML_UNDANGAN_LAYANAN = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0; font-weight: bold;">{{perihal}}</td>
    </tr>
  </table>

  <!-- KEPADA YTH -->
  <div style="margin-bottom: 10px; margin-left: 75px;">
    <div>Kepada Yth.</div>
    <div style="font-weight: bold; margin-bottom: 2px; white-space: pre-line;">{{daftarPenerima}}</div>
    <div>di –</div>
    <div style="margin-left: 25px; font-weight: bold;">{{tempatPenerima}}</div>
  </div>

  <!-- SALAM PEMBUKA -->
  <div style="margin-bottom: 8px; margin-left: 75px; font-style: italic;">
    Assalamu’alaikum Warahmatullahi Wabarakatuh
  </div>

  <!-- PARAGRAF PEMBUKA -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; margin-left: 75px; margin-right: 15px; line-height: 1.25;">
    Segala puji dan syukur kita panjatkan ke hadirat Allah SWT, semoga kita senantiasa mendapatkan rahmat dan taufiq-Nya dalam menjalankan tugas sehari-hari. Amin.
  </p>
  <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; margin-left: 75px; margin-right: 15px; line-height: 1.25;">
    Bersama ini kami mengundang Bapak/Ibu untuk hadir pada rapat yang diselenggarakan pada:
  </p>

  <!-- JADWAL RAPAT -->
  <table style="width: 100%; border-collapse: collapse; margin-left: 95px; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 110px; padding: 2px 0; vertical-align: top;">Acara</td>
      <td style="width: 15px; padding: 2px 0; vertical-align: top;">:</td>
      <td style="padding: 2px 0;"><strong>{{namaRapat}}</strong></td>
    </tr>
    <tr>
      <td style="padding: 2px 0; vertical-align: top;">Hari, tanggal</td>
      <td style="padding: 2px 0; vertical-align: top;">:</td>
      <td style="padding: 2px 0;">{{hariTanggalRapat}}</td>
    </tr>
    <tr>
      <td style="padding: 2px 0; vertical-align: top;">Waktu</td>
      <td style="padding: 2px 0; vertical-align: top;">:</td>
      <td style="padding: 2px 0;">{{waktuRapat}}</td>
    </tr>
    <tr>
      <td style="padding: 2px 0; vertical-align: top;">Tempat</td>
      <td style="padding: 2px 0; vertical-align: top;">:</td>
      <td style="padding: 2px 0;"><strong>{{tempatRapat}}</strong></td>
    </tr>
    <tr>
      <td style="padding: 2px 0; vertical-align: top;">Agenda Rapat</td>
      <td style="padding: 2px 0; vertical-align: top;">:</td>
      <td style="padding: 2px 0;">{{agendaRapat}}</td>
    </tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; margin-left: 75px; margin-right: 15px; line-height: 1.25;">
    Mengingat pentingnya acara ini, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
  </p>

  <!-- SALAM PENUTUP -->
  <div style="margin-bottom: 10px; margin-left: 75px; font-style: italic;">
    Wassalamu’alaikum Warahmatullah Wabarakatuh.
  </div>

  <!-- TANDA TANGAN (DUAL COLUMN) -->
  <div style="margin-top: 14px; margin-left: 75px; page-break-inside: avoid;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0;">
          <div style="font-family: Arial, sans-serif;">
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 1 -->
  <div style="page-break-before: always; margin-top: 40px; padding-top: 0;">
    <p style="font-weight: bold; margin-bottom: 2px;">Lampiran 1 Daftar Undangan {{namaRapat}}</p>
    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 20px;">Nomor: {{nomorSurat}}</p>
    
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{daftarUndangan}}
    </div>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN 2 (CONDITIONAL) -->
  <div class="page-break" style="page-break-before: always; margin-top: 40px; padding-top: 0;">
    <p style="font-weight: bold; margin-bottom: 2px;">Lampiran 2 Agenda Rapat {{namaRapat}}</p>
    <p style="font-weight: bold; text-decoration: underline; margin-bottom: 20px;">Nomor: {{nomorSurat}}</p>
    
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{agendaDetail}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_UNDANGAN_LAYANAN = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0667/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '10 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '26 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima (Satu per baris)', type: 'textarea', required: true, placeholder: '1. Pimpinan DSN-MUI Bidang Layanan dan Literasi\n2. Pimpinan DSN-MUI Bidang Relasi Industri dan Regulasi\n3. Bidang Layanan, Literasi, Relasi Industri, dan Regulasi\nDewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI)\n(Nama-nama terlampir)' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Selasa, 11 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 15.00 WIB' },
  { key: 'tempatRapat', label: 'Tempat Rapat', type: 'textarea', required: true, placeholder: 'Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'wysiwyg', required: true, placeholder: '1. Unsur Pimpinan:\n   Wakil Ketua : K.H. Sholahudin Al Aiyub\n   Wakil Ketua : Ir. H. Adiwarman A. Karim, S.E., M.B.A., M.A.E.P.\n   Wakil Sekretaris : Kanny Hidaya, S.E., M.A.\n   Wakil Sekretaris : Dr. Asrori S. Karni, S.Ag., M.H.\n\n2. Koordinator Bidang Fatwa:\n   Dr. Asep Supyadillah, M.Ag.\n\n3. Anggota Bidang Fatwa:\n   1. Ah. Azharuddin Latif, M.Ag., M.H.\n   2. Dr. Yuke Rahmawati, M.A.' },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'wysiwyg', required: true, placeholder: '1. Tindak Lanjut atas Rapat Kesekretarisan DSN-MUI tanggal 6 Agustus 2026:\n   a. Pemohonan Izin Penelitian Skripsi dari Velisa Universitas Darussalam\n   b. Permohonan Surat Rekomendasi Dewan Pengawas Syariah dari PT LKM Artha Kerta Raharja (Perseroda)\n   ...' }
];

export const FULL_HTML_U0000 = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggal_hijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggal_masehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomor_surat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">Undangan Silaturahim dan Wawancara Calon DPS</td>
    </tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.</div>
      <div style="font-weight: bold;">Direktur Utama {{nama_pt}}</div>
      <div style="font-weight: bold;">Sdr. {{nama_dirut}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{kota_tujuan}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Puji syukur ke hadirat Allah Subhanahu wa Ta’ala, teriring doa semoga Saudara dalam keadaan sehat wal afiat dan mendapat lindungan dari Allah SWT dalam menjalankan tugas sehari-hari.
    </p>

    <!-- PARAGRAF ISI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Menunjuk surat Saudara No. <strong>{{no_surat_permohonan}}</strong> tertanggal <strong>{{tgl_surat_permohonan}}</strong> perihal <strong>{{perihal_surat_permohonan}}</strong>; dan berdasarkan keputusan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) tanggal <strong>{{tgl_rapat_dsn}}</strong>, DSN-MUI mengundang calon Dewan Pengawas Syariah (DPS) yang Saudara ajukan yaitu <strong>Sdr. {{nama_calon_dps}}</strong> untuk silaturahim dan wawancara melalui <em>video conference</em>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL WAWANCARA TABLE -->
    <table style="margin-left: 30px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.25;">
      <tr>
        <td style="width: 120px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, Tanggal</td>
        <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
        <td style="font-weight: bold; padding: 2px 0;">{{hari_tanggal_wawancara}}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Waktu</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="font-weight: bold; padding: 2px 0;">{{waktu_wawancara}}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Media</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="padding: 2px 0;">
          <strong>Zoom Cloud Meeting</strong><br />
          (Meeting ID: <strong>{{meeting_id}}</strong> | Passcode: <strong>{{passcode}}</strong>)
        </td>
      </tr>
    </table>

    <!-- PARAGRAF KONFIRMASI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Konfirmasi kehadiran dapat menghubungi Kepala Sekretariat DSN-MUI (Sdr. Abdul Wasik, M.Si, HP: 0818 404 852), Hotline DSN-MUI (HP: 0822 6000 4146) atau email <a href="mailto:sekretariat@dsnmui.or.id" style="color: #006633; text-decoration: underline;">sekretariat@dsnmui.or.id</a> dan <a href="mailto:dsnmui@gmail.com" style="color: #006633; text-decoration: underline;">dsnmui@gmail.com</a>.
    </p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Mengingat pentingnya acara tersebut, kami mengharapkan calon DPS yang Saudara ajukan dapat menghadiri tepat pada waktunya.
    </p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
      Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.
    </p>

    <!-- SALAM PENUTUP -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Ketua,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>

    \${FOOTER_HTML}
  </div>
</div>`;

export const FULL_VARS_U0000 = [
  { key: 'nomor_surat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0000/DSN-MUI/VII/2026' },
  { key: 'tanggal_masehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '30 Juni 2026 M' },
  { key: 'tanggal_hijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '15 Muharram 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-----' },
  { key: 'nama_pt', label: 'Nama PT / Lembaga Tujuan', type: 'text', required: true, placeholder: 'PT ...' },
  { key: 'nama_dirut', label: 'Nama Direktur Utama', type: 'text', required: true, placeholder: 'Nama Dirut PT' },
  { key: 'kota_tujuan', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'no_surat_permohonan', label: 'No. Surat Permohonan PT', type: 'text', required: true, placeholder: 'No. ...' },
  { key: 'tgl_surat_permohonan', label: 'Tanggal Surat Permohonan', type: 'text', required: true, placeholder: '10 Juni 2026' },
  { key: 'perihal_surat_permohonan', label: 'Perihal Surat Permohonan PT', type: 'text', required: true, placeholder: 'Permohonan Rekomendasi Calon DPS' },
  { key: 'tgl_rapat_dsn', label: 'Tanggal Rapat Bidang DSN-MUI', type: 'text', required: true, placeholder: '15 Juni 2026' },
  { key: 'nama_calon_dps', label: 'Nama Calon DPS yang Diuji', type: 'text', required: true, placeholder: 'Sdr. ...' },
  { key: 'hari_tanggal_wawancara', label: 'Hari & Tanggal Wawancara', type: 'text', required: true, placeholder: 'Senin, 20 Juli 2026' },
  { key: 'waktu_wawancara', label: 'Waktu Wawancara', type: 'text', required: true, placeholder: '07.00 – 09.00 WIB' },
  { key: 'media_wawancara', label: 'Media Wawancara', type: 'text', required: true, placeholder: 'Zoom Cloud Meeting' },
  { key: 'meeting_id', label: 'Meeting ID Zoom', type: 'text', required: true, placeholder: '000 0000 0000' },
  { key: 'passcode', label: 'Passcode Zoom', type: 'text', required: true, placeholder: '........' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'namaKetua', label: 'Nama Ketua', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', defaultValue: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.', defaultValue: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' }
];

export const FULL_HTML_SURAT_TUGAS = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- JUDUL SURAT & NOMOR -->
  <div style="text-align: center; margin-top: 6px; margin-bottom: 12px;">
    <div style="font-weight: bold; font-size: 10.5pt; text-decoration: underline; letter-spacing: 4px; text-transform: uppercase; display: inline-block;">S U R A T &nbsp; T U G A S</div>
    <div style="font-size: 10.5pt; margin-top: 2px;">No: {{nomorSurat}}</div>
  </div>

  <!-- KONSIDERANS PEMBUKA -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
    Menunjuk surat dari {{namaLembagaPengundang}} No. {{nomorSuratPengundang}} tertanggal {{tanggalSuratPengundang}}, dan berdasarkan keputusan Rapat {{namaRapatPengambilKeputusan}} Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) tanggal {{tanggalRapat}}, DSN-MUI dengan ini <strong>menugaskan</strong> kepada:
  </p>

  <!-- TABEL RINCIAN PENUGASAN -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 100px; vertical-align: top; padding: 2px 0;">Nama</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0; white-space: pre-line;">{{daftarNamaPenugasan}}</td>
    </tr>
    <tr>
      <td style="width: 100px; vertical-align: top; padding: 2px 0;">Jabatan</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0; white-space: pre-line;">{{jabatan}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 4px 0 2px 0;">Keperluan</td>
      <td style="vertical-align: top; padding: 4px 0 2px 0;">:</td>
      <td style="padding: 4px 0 2px 0; text-align: justify;">
        {{keperluan}}
        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 10.5pt; line-height: 1.25;">
          <tr>
            <td style="width: 100px; vertical-align: top; font-weight: bold; padding: 2px 0;">Hari, tanggal</td>
            <td style="width: 15px; vertical-align: top; font-weight: bold; padding: 2px 0;">:</td>
            <td style="font-weight: bold; padding: 2px 0;">{{hariTanggalKegiatan}}</td>
          </tr>
          <tr>
            <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Waktu</td>
            <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">:</td>
            <td style="font-weight: bold; padding: 2px 0;">{{waktuKegiatan}}</td>
          </tr>
          <tr>
            <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Tempat</td>
            <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">:</td>
            <td style="font-weight: bold; white-space: pre-line; padding: 2px 0;">{{tempatKegiatan}}</td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 4px 0 2px 0;">Keterangan</td>
      <td style="vertical-align: top; padding: 4px 0 2px 0;">:</td>
      <td style="padding: 4px 0 2px 0;">
        <div style="font-weight: normal; margin-bottom: 2px;">Narahubung</div>
        <div style="line-height: 1.25;">{{keteranganNarahubung}}</div>
      </td>
    </tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.25;">
    Demikian Surat Tugas ini diberikan kepada yang bersangkutan untuk dilaksanakan sebagaimana mestinya dan melaporkan hasilnya kepada Pimpinan DSN-MUI.
  </p>

  <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.25;">
    Apabila dalam penugasan ini terdapat kekeliruan, atau ada kebutuhan organisasi, akan diperbaiki sebagaimana mestinya.
  </p>

  <!-- TANGGAL DAN HEADER BADAN PENGURUS DI SISI KANAN -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid; table-layout: fixed;">
    <tr>
      <td style="width: 50%; vertical-align: bottom; padding: 0;"></td>
      <td style="width: 50%; vertical-align: top; padding: 0; text-align: right;">
        <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
          <!-- TANGGAL SURAT -->
          <table style="border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt; line-height: 1.2; margin-bottom: 6px;">
            <tr>
              <td style="padding: 0; white-space: nowrap; vertical-align: bottom;">Jakarta,&nbsp;</td>
              <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
                <span style="border-bottom: 1px solid #000; display: inline-block; padding-bottom: 0px;">{{tanggalHijriah}}</span>
              </td>
            </tr>
            <tr>
              <td></td>
              <td style="padding: 2px 0 0 0; white-space: nowrap;">{{tanggalMasehi}}</td>
            </tr>
          </table>

          <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
        </div>
      </td>
    </tr>
  </table>

  <!-- TANDA TANGAN DUA KOLOM SEJAJAR 100% -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 0px; page-break-inside: avoid; table-layout: fixed;">
    <tr>
      <!-- KOLOM KIRI -->
      <td style="width: 50%; vertical-align: top; padding: 0; text-align: left;">
        <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; max-width: 100%;">
          <div style="font-weight: normal; font-size: 10.5pt; line-height: 1.2;">{{jabatanKiri}},</div>
          <!-- QR_CODE_TTE_PLACEHOLDER -->
          <div style="height: 48px;"></div>
          <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
        </div>
      </td>
      <!-- KOLOM KANAN -->
      <td style="width: 50%; vertical-align: top; padding: 0; text-align: right;">
        <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
          <div style="font-weight: normal; font-size: 10.5pt; line-height: 1.2;">{{jabatanKanan}},</div>
          <!-- QR_CODE_TTE_PLACEHOLDER -->
          <div style="height: 48px;"></div>
          <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
        </div>
      </td>
    </tr>
  </table>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_SURAT_TUGAS = [
  { key: 'nomorSurat', label: 'Nomor Surat Tugas', type: 'text', required: true, placeholder: 'ST-0650/DSN-MUI/VIII/2026', defaultValue: 'ST-0650/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '6 Agustus 2026 M', defaultValue: '6 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '22 Shafar 1448 H', defaultValue: '22 Shafar 1448 H' },
  { key: 'namaLembagaPengundang', label: 'Nama Lembaga Pengundang', type: 'text', required: true, placeholder: 'Lembaga Penggerak Ekonomi Umat (LPEU) Majelis Ulama Indonesia', defaultValue: 'Lembaga Penggerak Ekonomi Umat (LPEU) Majelis Ulama Indonesia' },
  { key: 'nomorSuratPengundang', label: 'Nomor Surat Pengundang', type: 'text', required: true, placeholder: 'A-120/LPEU MUI/VII/2026', defaultValue: 'A-120/LPEU MUI/VII/2026' },
  { key: 'tanggalSuratPengundang', label: 'Tanggal Surat Pengundang', type: 'text', required: true, placeholder: '28 Juli 2026', defaultValue: '28 Juli 2026' },
  { key: 'namaRapatPengambilKeputusan', label: 'Nama Rapat Pengambil Keputusan', type: 'text', required: true, placeholder: 'Kesekretarisan', defaultValue: 'Kesekretarisan' },
  { key: 'tanggalRapat', label: 'Tanggal Rapat Keputusan', type: 'text', required: true, placeholder: '6 Agustus 2026', defaultValue: '6 Agustus 2026' },
  { key: 'daftarNamaPenugasan', label: 'Nama yang Ditugaskan', type: 'textarea', required: true, placeholder: '1. Dr. Asep Supyadillah, M.Ag.\n2. Dr. Yulizar Djamaluddin Sanrego, M.Ec.', defaultValue: '1. Dr. Asep Supyadillah, M.Ag.\n2. Dr. Yulizar Djamaluddin Sanrego, M.Ec.' },
  { key: 'jabatan', label: 'Jabatan', type: 'textarea', required: true, placeholder: '1. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi\n2. Anggota Bidang Fatwa', defaultValue: '1. Koordinator Bidang Layanan, Literasi, Relasi Industri dan Regulasi\n2. Anggota Bidang Fatwa' },
  { key: 'keperluan', label: 'Keperluan / Acara Penugasan', type: 'textarea', required: true, placeholder: 'menghadiri kegiatan Risk Based Performance Management Training, yang diselenggarakan oleh LPEU MUI, yang insyaAllah dilaksanakan pada:', defaultValue: 'menghadiri kegiatan Risk Based Performance Management Training, yang diselenggarakan oleh LPEU MUI, yang insyaAllah dilaksanakan pada:' },
  { key: 'hariTanggalKegiatan', label: 'Hari, Tanggal Kegiatan', type: 'text', required: true, placeholder: 'Jumat-Sabtu, 7-8 Agustus 2026', defaultValue: 'Jumat-Sabtu, 7-8 Agustus 2026' },
  { key: 'waktuKegiatan', label: 'Waktu Kegiatan', type: 'text', required: true, placeholder: '08.00 WIB - selesai (Rundown acara terlampir)', defaultValue: '08.00 WIB - selesai (Rundown acara terlampir)' },
  { key: 'tempatKegiatan', label: 'Tempat Kegiatan', type: 'textarea', required: true, placeholder: 'Aula Buya Hamka Gedung MUI Pusat\nJl. Proklamasi 51, Menteng, Jakarta Pusat', defaultValue: 'Aula Buya Hamka Gedung MUI Pusat\nJl. Proklamasi 51, Menteng, Jakarta Pusat' },
  { key: 'keteranganNarahubung', label: 'Keterangan Narahubung', type: 'wysiwyg', required: true, placeholder: '<p><strong>❖ Sekretariat DSN-MUI</strong><br>Telp./WA : 0818 404 852 (Sdr. Abdul Wasik, M.Si)<br>WA Hotline : 0822 6000 4146<br>Email : sekretariat@dsnmui.or.id<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dsnmui@gmail.com</p><p><strong>❖ LPEU MUI</strong><br>Telp. : 0812 1569 7070 (Admin WA LPEU MUI)<br>Email : lpeu.mui.pusat@gmail.com</p>', defaultValue: '<p><strong>❖ Sekretariat DSN-MUI</strong><br>Telp./WA : 0818 404 852 (Sdr. Abdul Wasik, M.Si)<br>WA Hotline : 0822 6000 4146<br>Email : sekretariat@dsnmui.or.id<br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;dsnmui@gmail.com</p><p><strong>❖ LPEU MUI</strong><br>Telp. : 0812 1569 7070 (Admin WA LPEU MUI)<br>Email : lpeu.mui.pusat@gmail.com</p>' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri', type: 'text', required: true, placeholder: 'Ketua', defaultValue: 'Ketua' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan', type: 'text', required: true, placeholder: 'Sekretaris', defaultValue: 'Sekretaris' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', defaultValue: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.', defaultValue: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
];

export const DEFAULT_ISI_PERMOHONAN_PKL = `<ol style="margin-top: 4px; margin-bottom: 6px; padding-left: 24px; line-height: 1.35; text-align: justify;">
  <li style="margin-bottom: 6px; text-align: justify;">Sebagai persyaratan kelulusan, setiap peserta diminta melakukan Praktik Kerja Lapangan (PKL) ke Lembaga Keuangan Syariah/Rumah Sakit Syariah 2026.</li>
  <li style="margin-bottom: 6px; text-align: justify;">Dalam kegiatan PKL, peserta akan diminta membuat review terhadap beberapa dokumen pengawasan asli yang menjadi tugas Dewan Pengawas Syariah (DPS) diantaranya : (1) Kontrak Akad, (2) SOP, (3) Laporan Keuangan, (4) Opini DPS dan (5) Dokumen Pemasaran.</li>
</ol>
<p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
  Sehubungan dengan kegiatan diatas, kami mohon dengan hormat kiranya Bapak/Ibu berkenan memberikan berkas-berkas yang diperlukan untuk peserta berikut melakukan PKL di Lembaga yang Bapak/Ibu pimpin. Adapun identitas peserta adalah:
</p>
<table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.35;">
  <tr>
    <td style="width: 80px; vertical-align: top; padding: 2px 0;">Nama</td>
    <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
    <td style="font-weight: bold; padding: 2px 0;">Nama Peserta</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;">Alamat</td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="padding: 2px 0;">Alamat Peserta<br>Alamat Peserta</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;">No. Telp</td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="padding: 2px 0;">08xx........</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;">E-Mail</td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="padding: 2px 0;">fulan@.....</td>
  </tr>
</table>
<p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
  Seluruh dokumen yang diberikan ke peserta hanya akan digunakan untuk kepentingan pelatihan dan tidak akan berpengaruh terhadap laporan pengawasan DPS kepada DSN-MUI.
</p>`;

export const FULL_HTML_PERMOHONAN_PKL = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth. :</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{penerimaSurat}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Puji syukur ke hadirat Allah Subhanahu wa Ta’ala, teriring doa semoga Saudara dalam keadaan sehat wal afiat dan mendapat lindungan dari Allah SWT dalam menjalankan tugas sehari-hari.
    </p>
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Sehubungan dengan diadakannya {{namaKegiatanPelatihan}}, Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) menyampaikan hal-hal berikut ini :
    </p>

    <!-- ISI SURAT (WYSIWYG EDITOR) -->
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify; margin-bottom: 8px;">
      {{isiSurat}}
    </div>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
      Demikian surat permohonan ini kami sampaikan. Atas perhatian dan kerjasamanya kami ucapkan terima kasih.
    </p>

    <!-- SALAM PENUTUP -->
    <p style="margin-top: 8px; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <td style="width: 52%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; max-width: 100%;">
            <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKiri}}</span>
          </div>
        </td>
        <td style="width: 48%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 240px; max-width: 100%;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKanan}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN (CONDITIONAL) -->
  <div class="page-break" style="page-break-before: always; margin-top: 40px; padding-top: 0; display: {{lampiranDisplay}};">
    <div style="font-weight: bold; font-size: 10.5pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{lampiranKonten}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_PERMOHONAN_PKL = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0000/DSN-MUI/VIII/2026', defaultValue: 'U-0000/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '6 Juli 2026 M', defaultValue: '6 Juli 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '21 Muharram 1448 H', defaultValue: '21 Muharram 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '-----', defaultValue: '-----' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Permohonan Dokumen Untuk Praktik Kerja Lapangan (PKL)', defaultValue: 'Permohonan Dokumen Untuk Praktik Kerja Lapangan (PKL)' },
  { key: 'penerimaSurat', label: 'Penerima Surat (Jabatan & Nama Lembaga)', type: 'textarea', required: true, placeholder: 'Jabatan\nNama Lembaga', defaultValue: 'Jabatan\nNama Lembaga' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaKegiatanPelatihan', label: 'Nama Pelatihan / Kegiatan', type: 'text', required: true, placeholder: 'Pelatihan Dasar Pengawas Syariah (PDPS) Lembaga Keuangan Syariah/Rumah Sakit Syariah 2026', defaultValue: 'Pelatihan Dasar Pengawas Syariah (PDPS) Lembaga Keuangan Syariah/Rumah Sakit Syariah 2026' },
  { key: 'isiSurat', label: 'Isi Surat (Poin PKL & Identitas Peserta)', type: 'wysiwyg', required: true, defaultValue: DEFAULT_ISI_PERMOHONAN_PKL },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Penandatangan Kiri', type: 'text', required: true, placeholder: 'Wakil Ketua', defaultValue: 'Wakil Ketua' },
  { key: 'namaKiri', label: 'Nama Penandatangan Kiri', type: 'text', required: true, placeholder: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A.', defaultValue: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A.' },
  { key: 'jabatanKanan', label: 'Jabatan Penandatangan Kanan', type: 'text', required: true, placeholder: 'Wakil Sekretaris', defaultValue: 'Wakil Sekretaris' },
  { key: 'namaKanan', label: 'Nama Penandatangan Kanan', type: 'text', required: true, placeholder: 'Dr. ASRORI S. KARNI, S.Ag., M.H.', defaultValue: 'Dr. ASRORI S. KARNI, S.Ag., M.H.' },
  { key: 'lampiranKonten', label: 'Halaman Lampiran (WYSIWYG)', type: 'wysiwyg', required: false, placeholder: 'Isi dokumen lampiran jika ada...' },
  { key: 'lampiranDisplay', label: 'Tampilkan Lampiran', type: 'text', required: false, defaultValue: 'none' },
];

export const DEFAULT_ISI_INFORMASI_PELATIHAN = `<p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
  Berdasarkan Pelatihan Dasar Muamalah Maliyah dan Fatwa DSN-MUI (PDMMF) Privat yang sudah diikuti oleh Bpk Abdullah Syamsul Arifin, Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengadakan Pelatihan Dasar Pengawas Syariah (PDPS) di Lembaga Keuangan Syariah (LKS). Sertifikat pelatihan ini dapat digunakan sebagai syarat mengajukan permohonan Surat Rekomendasi DPS dari DSN-MUI dan/atau mengikuti sertifikasi profesi DPS di Lembaga Sertifikasi Profesi (LSP-MUI). Berikut ini adalah teknis penyelenggaraanya:
</p>
<ol style="margin-top: 4px; margin-bottom: 6px; padding-left: 24px; line-height: 1.35; text-align: justify;">
  <li style="margin-bottom: 6px; text-align: justify;">Pelatihan Privat dilaksanakan dengan minimal 1 orang dan maksimal 5 orang peserta yang mengikuti pelatihan;</li>
  <li style="margin-bottom: 6px; text-align: justify;">Pelatihan dilaksanakan secara daring dengan menggunakan media Google ClassRoom dan Zoom Cloud Meeting (agenda terlampir);</li>
  <li style="margin-bottom: 6px; text-align: justify;">Biaya kontribusi pelatihan adalah Rp. 7.500.000 (Tujuh Juta Lima Ratus Ribu Rupiah/orang/pelatihan;</li>
  <li style="margin-bottom: 6px; text-align: justify;">Jadwal Pelatihan akan diberikan jika peserta sudah mengkonfirmasi keikutsertaan dengan membayar biaya pelatihan;</li>
  <li style="margin-bottom: 6px; text-align: justify;">Dalam pelatihan ini terdapat post-test dan ujian wawancara dimana hanya yang lulus post-test dan wawancara yang mendapatkan sertifikat pelatihan dari DSN-MUI.</li>
  <li style="margin-bottom: 6px; text-align: justify;">Pendaftaran dapat dilakukan dengan menghubungi Sdri. Heny di 0813-1564-5752, Hotline DSN-MUI (HP: 0822 6000 4146)</li>
</ol>`;

export const DEFAULT_LAMPIRAN_INFORMASI_PELATIHAN = `<div style="text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 12px; letter-spacing: 0.5px;">
  RUNDOWN PDPS
</div>
<table style="width: 100%; border-collapse: collapse; font-size: 9pt; line-height: 1.25; font-family: Arial, sans-serif;">
  <thead>
    <tr style="background-color: #000000; color: #ffffff; text-align: center; font-weight: bold;">
      <th style="border: 1px solid #333; padding: 6px 4px; width: 15%;">Hari, Tanggal</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 15%;">Pukul</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 12%;">Durasi</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 38%;">Materi</th>
      <th style="border: 1px solid #333; padding: 6px 4px; width: 20%;">Media</th>
    </tr>
  </thead>
  <tbody>
    <!-- HARI 1 -->
    <tr>
      <td rowspan="3" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; background-color: #ffff00; vertical-align: middle;">Hari-1</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #ffff00;">09.00 - 10.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #ffff00;"></td>
      <td style="border: 1px solid #333; padding: 4px 6px; font-weight: bold; text-align: center; background-color: #ffff00;">ORIENTASI PELATIHAN</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; font-weight: bold; background-color: #ffff00;">ZOOM CLOUD MEETING</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Materi Pengantar &amp; Regulasi Perbankan Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Pengantar &amp; Regulasi Perbankan Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">19.00 - 21.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">90 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Kuis Materi Pengantar dan Regulasi Perbankan Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>

    <!-- HARI 2 -->
    <tr>
      <td rowspan="2" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle;">Hari-2</td>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Materi Akuntansi Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Materi Akuntansi Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 24.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Simulasi Materi Akuntansi Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>

    <!-- HARI 3 -->
    <tr>
      <td rowspan="2" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle;">Hari-3</td>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Materi Akta Perjanjian &amp; Opini Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Materi Akta Perjanjian &amp; Opini Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 24.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Simulasi Materi Akta Perjanjian dan Opini Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>

    <!-- HARI 4 -->
    <tr>
      <td rowspan="3" style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold; vertical-align: middle;">Hari-4</td>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online SOP &amp; Pemasaran Syariah</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Materi SOP &amp; Pemasaran Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 24.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Simulasi Materi SOP &amp; Pemasaran Syariah</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Google Classroom</td>
    </tr>
    <tr>
      <td colspan="2" style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3; font-style: italic;">Akses Kelas Online Simulasi Produk Baru dan Evaluasi Uji Petik</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #cfe2f3;">Simulasi Produk Baru &amp; Evaluasi Uji Petik</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #cfe2f3;">Google Classroom</td>
    </tr>

    <!-- HARI 5 -->
    <tr>
      <td style="border: 1px solid #333; padding: 6px; text-align: center; font-weight: bold;">Hari-5</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">09.00 - 12.00</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">120 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; font-weight: bold;">Live Tanya Jawab Materi</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Zoom Cloud Meeting</td>
    </tr>

    <!-- UJIAN -->
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Sesuai kesepakatan</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">20.00 - 20.45</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">45 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #d9d2e9;">Ujian Post test</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Zoom Cloud Meeting &amp; G-Form</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Sesuai kesepakatan</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">20.00 - 20.45</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">45 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #d9d2e9;">Ujian Online HER 1**</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Zoom Cloud Meeting &amp; G-Form</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Sesuai kesepakatan</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">20.00 - 20.45</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">45 menit</td>
      <td style="border: 1px solid #333; padding: 4px 6px; background-color: #d9d2e9;">Ujian Online HER 2**</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center; background-color: #d9d2e9;">Zoom Cloud Meeting &amp; G-Form</td>
    </tr>

    <!-- PKL SECTION -->
    <tr style="background-color: #ffff00; font-weight: bold; text-align: center;">
      <td colspan="5" style="border: 1px solid #333; padding: 5px;">PKL</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Ujian Wawancara</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Zoom Cloud Meeting</td>
    </tr>
    <tr>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">***</td>
      <td style="border: 1px solid #333; padding: 4px 6px;">Ujian HER Wawancara</td>
      <td style="border: 1px solid #333; padding: 4px; text-align: center;">Zoom Cloud Meeting</td>
    </tr>
  </tbody>
</table>`;

export const FULL_HTML_INFORMASI_PELATIHAN = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.:</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{penerimaSurat}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Puji syukur ke hadirat Allah Subhanahu wa Ta’ala, teriring doa semoga Saudara dalam keadaan sehat wal afiat dan mendapat lindungan dari Allah SWT dalam menjalankan tugas sehari-hari.
    </p>

    <!-- ISI SURAT (WYSIWYG EDITOR) -->
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify; margin-bottom: 8px;">
      {{isiSurat}}
    </div>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 6px; margin-bottom: 6px; text-indent: 0; line-height: 1.35;">
      Demikian permohonan ini kami sampaikan. Atas perhatian Saudara, kami ucapkan terima kasih.
    </p>

    <!-- SALAM PENUTUP -->
    <p style="margin-top: 8px; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <td style="width: 54%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; max-width: 100%;">
            <!-- Hidden spacer matching headerTtd height so jabatanKiri aligns with jabatanKanan -->
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; letter-spacing: -0.2px; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKiri}}</span>
          </div>
        </td>
        <td style="width: 46%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKanan}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN (CONDITIONAL) -->
  <div class="page-break" style="page-break-before: always; margin-top: 40px; padding-top: 0; display: {{lampiranDisplay}};">
    <div style="font-weight: bold; font-size: 10.5pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran Rundown<br />
      {{nomorSurat}}
    </div>
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{lampiranKonten}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_INFORMASI_PELATIHAN = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0617/DSN-MUI/VII/2026', defaultValue: 'U-0617/DSN-MUI/VII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '30 Juli 2026 M', defaultValue: '30 Juli 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '15 Shafar 1448 H', defaultValue: '15 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) lembar', defaultValue: '1 (satu) lembar' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Penyampaian Informasi terkait Pelatihan PDPS Privat', defaultValue: 'Penyampaian Informasi terkait Pelatihan PDPS Privat' },
  { key: 'penerimaSurat', label: 'Penerima Surat (Jabatan & Nama Lembaga)', type: 'textarea', required: true, placeholder: 'VP Unit Usaha Syariah\nPT. Bank Jatim', defaultValue: 'VP Unit Usaha Syariah\nPT. Bank Jatim' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'isiSurat', label: 'Isi Surat (Penyampaian Informasi & Poin Pelatihan)', type: 'wysiwyg', required: true, defaultValue: DEFAULT_ISI_INFORMASI_PELATIHAN },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Penandatangan Kiri', type: 'text', required: true, placeholder: 'Wakil Ketua', defaultValue: 'Wakil Ketua' },
  { key: 'namaKiri', label: 'Nama Penandatangan Kiri', type: 'text', required: true, placeholder: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.', defaultValue: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.' },
  { key: 'jabatanKanan', label: 'Jabatan Penandatangan Kanan', type: 'text', required: true, placeholder: 'Wakil Sekretaris', defaultValue: 'Wakil Sekretaris' },
  { key: 'namaKanan', label: 'Nama Penandatangan Kanan', type: 'text', required: true, placeholder: 'Dr. ASRORI S. KARNI, S.Ag., M.H.', defaultValue: 'Dr. ASRORI S. KARNI, S.Ag., M.H.' },
  { key: 'lampiranKonten', label: 'Halaman Lampiran (WYSIWYG)', type: 'wysiwyg', required: false, placeholder: 'Isi dokumen lampiran...', defaultValue: DEFAULT_LAMPIRAN_INFORMASI_PELATIHAN },
  { key: 'lampiranDisplay', label: 'Tampilkan Lampiran', type: 'text', required: false, defaultValue: 'block' },
];

export const DEFAULT_ISI_KETERANGAN_WAWANCARA = `<p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.4;">Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) dengan ini menerangkan bahwa pada tanggal 29 April 2026 telah dilakukan wawancara melalui <em>video conference</em> atas nama:</p><table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 10px; font-size: 10.5pt; line-height: 1.35;"><tr><td style="width: 130px; vertical-align: top; padding: 2px 0;">Nama</td><td style="width: 20px; vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Ahmad Munif</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Nomor Pokok</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">24090290001</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Program Studi</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Studi Islam (Konsentrasi Hukum Islam)</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">University</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">UIN Walisongo Semarang</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Keperluan</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0; text-align: justify;">Penyusunan penelitian Disertasi dengan judul <em>Ijtihad Dalam Fatwa Dewan Syariah Nasional Majelis Ulama Indonesia (DSN-MUI) tentang Transaksi Ekonomi Berbasis Teknologi Digital Perspektif Metodologis</em></td></tr></table><p style="text-align: justify; margin-top: 8px; margin-bottom: 10px; line-height: 1.4;">Demikian Surat Keterangan ini dibuat untuk digunakan sebagaimana mestinya.</p>`;

export const FULL_HTML_KETERANGAN_WAWANCARA = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- JUDUL SURAT KETERANGAN -->
  <div style="text-align: center; margin-top: 10px; margin-bottom: 22px;">
    <div style="font-weight: bold; font-size: 12pt; letter-spacing: 2px; text-decoration: underline; text-underline-offset: 3px; margin-bottom: 4px;">
      S U R A T &nbsp; K E T E R A N G A N
    </div>
    <div style="font-size: 10.5pt;">
      No. {{nomorSurat}}
    </div>
  </div>

  <!-- BODY CONTENT -->
  <div style="margin-left: 0; margin-right: 0;">
    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 12px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- ISI SURAT (WYSIWYG EDITOR) -->
    <div style="font-size: 10.5pt; line-height: 1.4; text-align: justify; margin-bottom: 8px;">
      {{isiSurat}}
    </div>

    <!-- SALAM PENUTUP -->
    <p style="margin-top: 12px; margin-bottom: 18px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANGGAL DAN HEADER BADAN PENGURUS DI SISI KANAN -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <td style="width: 54%; vertical-align: bottom; padding: 0;"></td>
        <td style="width: 46%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
            <!-- TANGGAL SURAT -->
            <table style="border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt; margin-bottom: 12px;">
              <tr>
                <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
                <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
                  <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
                </td>
              </tr>
              <tr>
                <td></td>
                <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
              </tr>
            </table>

            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- TANDA TANGAN DUA KOLOM SEJAJAR 100% -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 0px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <!-- KOLOM KIRI -->
        <td style="width: 54%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; max-width: 100%;">
            <div style="font-weight: bold; font-size: 10.5pt; line-height: 1.3;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; letter-spacing: -0.2px; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKiri}}</span>
          </div>
        </td>
        <!-- KOLOM KANAN -->
        <td style="width: 46%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
            <div style="font-weight: bold; font-size: 10.5pt; line-height: 1.3;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKanan}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN (CONDITIONAL) -->
  <div class="page-break" style="page-break-before: always; margin-top: 40px; padding-top: 0; display: {{lampiranDisplay}};">
    <div style="font-weight: bold; font-size: 10.5pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran<br />
      {{nomorSurat}}
    </div>
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{lampiranKonten}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_KETERANGAN_WAWANCARA = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0541/DSN-MUI/VII/2026', defaultValue: 'U-0541/DSN-MUI/VII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '6 Juli 2026 M', defaultValue: '6 Juli 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '21 Muharram 1448 H', defaultValue: '21 Muharram 1448 H' },
  { key: 'isiSurat', label: 'Isi Surat Keterangan (Data Peneliti & Keperluan)', type: 'wysiwyg', required: true, defaultValue: DEFAULT_ISI_KETERANGAN_WAWANCARA },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Penandatangan Kiri', type: 'text', required: true, placeholder: 'Wakil Ketua', defaultValue: 'Wakil Ketua' },
  { key: 'namaKiri', label: 'Nama Penandatangan Kiri', type: 'text', required: true, placeholder: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.', defaultValue: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.' },
  { key: 'jabatanKanan', label: 'Jabatan Penandatangan Kanan', type: 'text', required: true, placeholder: 'Wakil Sekretaris', defaultValue: 'Wakil Sekretaris' },
  { key: 'namaKanan', label: 'Nama Penandatangan Kanan', type: 'text', required: true, placeholder: 'Dr. ASRORI S. KARNI, S.Ag., M.H.', defaultValue: 'Dr. ASRORI S. KARNI, S.Ag., M.H.' },
  { key: 'lampiranKonten', label: 'Halaman Lampiran (WYSIWYG)', type: 'wysiwyg', required: false, placeholder: 'Isi dokumen lampiran jika ada...' },
  { key: 'lampiranDisplay', label: 'Tampilkan Lampiran', type: 'text', required: false, defaultValue: 'none' },
];

export const DEFAULT_ISI_KETERANGAN_PELATIHAN = `<p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.4;">Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) dengan ini menerangkan bahwa pada tanggal 10-25 April 2026, telah mengikuti Pelatihan Dasar Muamalah Maliyah dan Fatwa (PDMMF) dan Pelatihan Dasar Pengawas Syariah (PDPS) untuk Lembaga Keuangan Syariah bidang Perbankan peserta atas nama :</p><table style="margin-left: 20px; border-collapse: collapse; margin-top: 4px; margin-bottom: 10px; font-size: 10.5pt; line-height: 1.35;"><tr><td style="width: 110px; vertical-align: top; padding: 2px 0;">Nama</td><td style="width: 20px; vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Purmansyah Ariadi</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Lembaga</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">PT. BPR Syariah Al Falah Banyuasin</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Alamat</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0; text-align: justify;">LR.Pasma Putra II NO.43 RT.023 RW.005 Kelurahan 3 Ilir Kecamatan Ilir Timur II Palembang</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">No. HP</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">08163295721</td></tr><tr><td style="vertical-align: top; padding: 2px 0;">Tempat</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Google Classroom dan Kantor DSN-MUI, Jl. Dempo No. 19 Jakarta</td></tr></table><p style="text-align: justify; margin-top: 8px; margin-bottom: 8px; line-height: 1.4;">Dan berdasarkan ujian pada tahap PDMMF yang telah dilaksanakan pada tanggal 23 April 2026, peserta di atas dinyatakan <strong>TIDAK LULUS</strong> sehingga tidak dapat melanjutkan ujian pada tahap PDPS.</p><p style="text-align: justify; margin-top: 8px; margin-bottom: 10px; line-height: 1.4;">Demikian Surat Keterangan ini diberikan kepada yang bersangkutan untuk dipergunakan sebagaimana mestinya.</p>`;

export const FULL_HTML_KETERANGAN_PELATIHAN = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- JUDUL SURAT KETERANGAN -->
  <div style="text-align: center; margin-top: 10px; margin-bottom: 22px;">
    <div style="font-weight: bold; font-size: 12pt; letter-spacing: 2px; text-decoration: underline; text-underline-offset: 3px; margin-bottom: 4px;">
      S U R A T &nbsp; K E T E R A N G A N
    </div>
    <div style="font-size: 10.5pt;">
      No. {{nomorSurat}}
    </div>
  </div>

  <!-- BODY CONTENT -->
  <div style="margin-left: 0; margin-right: 0;">
    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 12px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- ISI SURAT (WYSIWYG EDITOR) -->
    <div style="font-size: 10.5pt; line-height: 1.4; text-align: justify; margin-bottom: 8px;">
      {{isiSurat}}
    </div>

    <!-- SALAM PENUTUP -->
    <p style="margin-top: 12px; margin-bottom: 18px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANGGAL DAN HEADER BADAN PENGURUS DI SISI KANAN -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <td style="width: 54%; vertical-align: bottom; padding: 0;"></td>
        <td style="width: 46%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
            <!-- TANGGAL SURAT -->
            <table style="border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt; margin-bottom: 12px;">
              <tr>
                <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
                <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
                  <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
                </td>
              </tr>
              <tr>
                <td></td>
                <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
              </tr>
            </table>

            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- TANDA TANGAN DUA KOLOM SEJAJAR 100% -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 0px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <!-- KOLOM KIRI -->
        <td style="width: 54%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; max-width: 100%;">
            <div style="font-weight: bold; font-size: 10.5pt; line-height: 1.3;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; letter-spacing: -0.2px; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKiri}}</span>
          </div>
        </td>
        <!-- KOLOM KANAN -->
        <td style="width: 46%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
            <div style="font-weight: bold; font-size: 10.5pt; line-height: 1.3;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKanan}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN (CONDITIONAL) -->
  <div class="page-break" style="page-break-before: always; margin-top: 40px; padding-top: 0; display: {{lampiranDisplay}};">
    <div style="font-weight: bold; font-size: 10.5pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran<br />
      {{nomorSurat}}
    </div>
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify;">
      {{lampiranKonten}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_KETERANGAN_PELATIHAN = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0563/DSN-MUI/VII/2026', defaultValue: 'U-0563/DSN-MUI/VII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '14 Juli 2026 M', defaultValue: '14 Juli 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '29 Muharram 1448 H', defaultValue: '29 Muharram 1448 H' },
  { key: 'isiSurat', label: 'Isi Surat Keterangan (Data Peserta & Keterangan Pelatihan)', type: 'wysiwyg', required: true, defaultValue: DEFAULT_ISI_KETERANGAN_PELATIHAN },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Penandatangan Kiri', type: 'text', required: true, placeholder: 'Wakil Ketua', defaultValue: 'Wakil Ketua' },
  { key: 'namaKiri', label: 'Nama Penandatangan Kiri', type: 'text', required: true, placeholder: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.', defaultValue: 'Ir. H. ADIWARMAN A. KARIM, S.E., M.B.A., M.A.E.P.' },
  { key: 'jabatanKanan', label: 'Jabatan Penandatangan Kanan', type: 'text', required: true, placeholder: 'Wakil Sekretaris', defaultValue: 'Wakil Sekretaris' },
  { key: 'namaKanan', label: 'Nama Penandatangan Kanan', type: 'text', required: true, placeholder: 'Dr. ASRORI S. KARNI, S.Ag., M.H.', defaultValue: 'Dr. ASRORI S. KARNI, S.Ag., M.H.' },
  { key: 'lampiranKonten', label: 'Halaman Lampiran (WYSIWYG)', type: 'wysiwyg', required: false, placeholder: 'Isi dokumen lampiran jika ada...' },
  { key: 'lampiranDisplay', label: 'Tampilkan Lampiran', type: 'text', required: false, defaultValue: 'none' },
];

export const DEFAULT_NAMA_TIM_SURAT_TUGAS = `<div style="line-height: 1.25;">
  <div style="font-weight: bold;">1. Penanggung Jawab:</div>
  <div style="margin-left: 16px; margin-bottom: 2px;">
    1) K.H. M. Cholil Nafis, Lc., Ph.D.<br>
    2) Dr. H. Amisyah Tambunan, M.A.<br>
    3) Hj. Trisna Ningsih Yuliati Djuwaeli, S.E., M.M.
  </div>
  <div style="font-weight: bold;">2. Pengarah:</div>
  <div style="margin-left: 16px; margin-bottom: 2px;">
    1) Prof. Dr. K.H. Hasanudin, M.Ag.<br>
    2) Prof. Dr. K.H. M. Asrorun Niam Sholeh, S.H., M.A.<br>
    3) Drs. H. Muhammad Ziyad, M.A.<br>
    4) Prof. Dr. H. Jaih Mubarok, S.E., M.H., M.Ag.
  </div>
  <div style="font-weight: bold;">3. Pelaksana:</div>
  <div style="margin-left: 16px;">
    1) Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.<br>
    2) Dr. Yulizar Djamaluddin Sanrego, M.Ec.<br>
    3) K.H. Mahbub Ma’afi Ramdlan, S.H.I., M.Hum.<br>
    4) K.H. Muhammad Faishol, Lc., M.A.<br>
    5) Ibnu Wazi<br>
    6) Dr. Asep Supyadillah, M.Ag.
  </div>
</div>`;

export const DEFAULT_KEPERLUAN_SURAT_TUGAS_TIM = `<p style="margin: 0; line-height: 1.25; text-align: justify;">
  Tim DSN-MUI untuk melakukan kajian permohonan Fatwa terkait Pengenaan Mu’nah Gadai Tabungan Emas BSI dari PT Bank Syariah Indonesia Tbk.
</p>`;

export const DEFAULT_KETERANGAN_SURAT_TUGAS_TIM = `<div style="line-height: 1.25;">
  <div>Narahubung</div>
  <div style="font-weight: bold; margin-bottom: 1px;">❖ Sekretariat DSN-MUI</div>
  <table style="border-collapse: collapse; font-size: 9.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 44px; vertical-align: top; padding: 1px 0;">Telp</td>
      <td style="width: 14px; vertical-align: top; padding: 1px 0;">:</td>
      <td style="padding: 1px 0;">0818 404 852 (Kepala Sekretariat, Abdul Wasik, M.Si)</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 1px 0;">WA</td>
      <td style="vertical-align: top; padding: 1px 0;">:</td>
      <td style="padding: 1px 0;">0822 6000 4146 (Hotline DSN-MUI)</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 1px 0;">Email</td>
      <td style="vertical-align: top; padding: 1px 0;">:</td>
      <td style="padding: 1px 0;">sekretariat@dsnmui.or.id dan dsnmui@gmail.com</td>
    </tr>
  </table>
</div>`;

export const FULL_HTML_SURAT_TUGAS_TIM = `<div style="font-family: Arial, sans-serif; font-size: 9.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- JUDUL SURAT TUGAS -->
  <div style="text-align: center; margin-top: 4px; margin-bottom: 10px;">
    <div style="font-weight: bold; font-size: 11pt; letter-spacing: 2px; text-decoration: underline; text-underline-offset: 3px; margin-bottom: 2px;">
      S U R A T &nbsp; T U G A S
    </div>
    <div style="font-size: 9.5pt;">
      No: {{nomorSurat}}
    </div>
  </div>

  <!-- BODY CONTENT -->
  <div style="margin-left: 0; margin-right: 0;">
    <!-- PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.3;">
      Menunjuk keputusan Rapat Pimpinan Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) tanggal {{tanggalRapatPimpinan}}, DSN-MUI dengan ini <strong>menugaskan kepada</strong>:
    </p>

    <!-- TABEL ISIAN SURAT TUGAS TIM -->
    <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; line-height: 1.25; margin-bottom: 6px;">
      <tr>
        <td style="width: 100px; vertical-align: top; padding: 1px 0;">Nama Tim</td>
        <td style="width: 15px; vertical-align: top; padding: 1px 0;">:</td>
        <td style="vertical-align: top; padding: 1px 0;">
          {{namaTim}}
        </td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Jabatan</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">{{jabatan}}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Waktu Tugas</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">{{waktuTugas}}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Keperluan</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0; text-align: justify;">{{keperluan}}</td>
      </tr>
      <tr>
        <td style="vertical-align: top; padding: 2px 0;">Keterangan</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="vertical-align: top; padding: 2px 0;">{{keterangan}}</td>
      </tr>
    </table>

    <!-- PENUTUP -->
    <p style="text-align: justify; margin-top: 4px; margin-bottom: 4px; line-height: 1.3;">
      Demikian Surat Tugas ini diberikan kepada yang bersangkutan untuk dilaksanakan sebagaimana mestinya dan melaporkan hasilnya kepada Pimpinan DSN-MUI.
    </p>
    <p style="text-align: justify; margin-top: 2px; margin-bottom: 6px; line-height: 1.3;">
      Apabila dalam penugasan ini terdapat kekeliruan, atau ada kebutuhan organisasi, akan diperbaiki sebagaimana mestinya.
    </p>

    <!-- TANGGAL DAN HEADER BADAN PENGURUS DI SISI KANAN -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 4px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <td style="width: 50%; vertical-align: bottom; padding: 0;"></td>
        <td style="width: 50%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
            <!-- TANGGAL SURAT -->
            <table style="border-collapse: separate; border-spacing: 0; text-align: left; font-size: 9.5pt; margin-bottom: 4px;">
              <tr>
                <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
                <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
                  <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
                </td>
              </tr>
              <tr>
                <td></td>
                <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
              </tr>
            </table>

            <div style="font-size: 9pt; font-weight: normal; text-transform: uppercase; line-height: 1.2; white-space: pre-line; margin-bottom: 2px;">{{headerTtd}}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- TANDA TANGAN DUA KOLOM SEJAJAR 100% -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 0px; page-break-inside: avoid; table-layout: fixed;">
      <tr>
        <!-- KOLOM KIRI -->
        <td style="width: 50%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; max-width: 100%;">
            <div style="font-weight: normal; font-size: 9.5pt; line-height: 1.2;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 48px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKiri}}</span>
          </div>
        </td>
        <!-- KOLOM KANAN -->
        <td style="width: 50%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif; width: 235px; max-width: 100%;">
            <div style="font-weight: normal; font-size: 9.5pt; line-height: 1.2;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 48px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKanan}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- PAGE BREAK FOR LAMPIRAN (CONDITIONAL) -->
  <div class="page-break" style="page-break-before: always; margin-top: 30px; padding-top: 0; display: {{lampiranDisplay}};">
    <div style="font-weight: bold; font-size: 10pt; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 12px;">
      Lampiran<br />
      {{nomorSurat}}
    </div>
    <div style="font-size: 9.5pt; line-height: 1.35; text-align: justify;">
      {{lampiranKonten}}
    </div>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_SURAT_TUGAS_TIM = [
  { key: 'nomorSurat', label: 'Nomor Surat Tugas', type: 'text', required: true, placeholder: 'ST-0663/DSN-MUI/VIII/2026', defaultValue: 'ST-0663/DSN-MUI/VIII/2026' },
  { key: 'tanggalRapatPimpinan', label: 'Tanggal Rapat Pimpinan', type: 'text', required: true, placeholder: '5 Agustus 2026', defaultValue: '5 Agustus 2026' },
  { key: 'namaTim', label: 'Nama Tim (Struktur & Anggota Tim)', type: 'wysiwyg', required: true, defaultValue: DEFAULT_NAMA_TIM_SURAT_TUGAS },
  { key: 'jabatan', label: 'Jabatan', type: 'text', required: true, placeholder: 'Pengurus DSN-MUI', defaultValue: 'Pengurus DSN-MUI' },
  { key: 'waktuTugas', label: 'Waktu Tugas (Tanggal Awal – Akhir)', type: 'text', required: true, placeholder: '12 Agustus 2026 – 12 September 2026', defaultValue: '12 Agustus 2026 – 12 September 2026' },
  { key: 'keperluan', label: 'Keperluan / Acara Penugasan', type: 'wysiwyg', required: true, defaultValue: DEFAULT_KEPERLUAN_SURAT_TUGAS_TIM },
  { key: 'keterangan', label: 'Keterangan (Narahubung & Kontak)', type: 'wysiwyg', required: true, defaultValue: DEFAULT_KETERANGAN_SURAT_TUGAS_TIM },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '10 Agustus 2026 M', defaultValue: '10 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '26 Shafar 1448 H', defaultValue: '26 Shafar 1448 H' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Penandatangan Kiri', type: 'text', required: true, placeholder: 'Ketua', defaultValue: 'Ketua' },
  { key: 'namaKiri', label: 'Nama Penandatangan Kiri', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', defaultValue: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Penandatangan Kanan', type: 'text', required: true, placeholder: 'Sekretaris', defaultValue: 'Sekretaris' },
  { key: 'namaKanan', label: 'Nama Penandatangan Kanan', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.', defaultValue: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'lampiranKonten', label: 'Halaman Lampiran (WYSIWYG)', type: 'wysiwyg', required: false, placeholder: 'Isi dokumen lampiran jika ada...' },
  { key: 'lampiranDisplay', label: 'Tampilkan Lampiran', type: 'text', required: false, defaultValue: 'none' },
];

export const DEFAULT_ISI_KONTRIBUSI_DPS = `<ol style="margin-top: 0; margin-bottom: 8px; padding-left: 24px; text-align: justify; line-height: 1.35;">
  <li style="margin-bottom: 8px; padding-left: 6px;">
    Rapat Pimpinan DSN-MUI Tanggal 4 Februari 2026 telah menetapkan bahwa setiap DPS memberikan iuran bulanan kepada DSN-MUI, paling sedikit 5% dari penerimaan honor/gaji sebagai DPS. Untuk mendukung pelaksanaan kegiatan dan program DSN-MUI.
  </li>
  <li style="margin-bottom: 8px; padding-left: 6px;">
    Nomor rekening untuk kontribusi DPS dapat menggunakan Virtual Account di PT Bank Syariah Indonesia Tbk. <strong>8316480000000007</strong> atas nama <strong>KH SHOLAHUDIN AL AIYUB MSI</strong>. Jika Virtual Account tersebut bermasalah maka kontribusi dapat transfer ke No. Rek. <strong>1983863270</strong> atas nama <strong>Dewan Syariah Nasional MUI</strong> di Bank Syariah Indonesia dengan memberikan keterangan nama DPS yang bersangkutan.
  </li>
  <li style="margin-bottom: 8px; padding-left: 6px;">
    Untuk memudahkan pencatatan kami di bagian keuangan mohon kiranya, Bapak/Ibu menyampaikan bukti transfernya. Yaitu melalui email <strong>keuangan@dsnmui.or.id</strong> dan <strong>datakeuangandsnmui@gmail.com</strong> atau bisa menghubungi Whastapp Hotline Bagian Keuangan DSN-MUI di <strong>+62 811-9000-3456</strong>.
  </li>
</ol>`;

export const FULL_HTML_KONTRIBUSI_DPS = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.25; width: 100%; max-width: 100%; margin: 0; padding: 0;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 10.5pt;">
      <tr>
        <td style="padding: 0; white-space: nowrap; vertical-align: bottom; line-height: 1.05;">Jakarta,&nbsp;</td>
        <td style="padding: 0; text-align: right; white-space: nowrap; vertical-align: bottom;">
          <span style="border-bottom: 1.5px solid #000; display: inline-block; padding-bottom: 0px; line-height: 1.05; white-space: nowrap;">{{tanggalHijriah}}</span>
        </td>
      </tr>
      <tr>
        <td></td>
        <td style="padding: 2px 0 0 0; text-align: right; white-space: nowrap; line-height: 1.2;">{{tanggalMasehi}}</td>
      </tr>
    </table>
  </div>

  <!-- META SECTION (Nomor, Lampiran, Hal) -->
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 10.5pt; line-height: 1.25;">
    <tr>
      <td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{nomorSurat}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Lamp.</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0;">{{lampiran}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 0;">Hal</td>
      <td style="vertical-align: top; padding: 2px 0;">:</td>
      <td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td>
    </tr>
  </table>

  <!-- BODY CONTENT -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 10px; font-size: 10.5pt; line-height: 1.25;">
      <div>Kepada Yth.:</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{penerimaSurat}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <div style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</div>

    <!-- PARAGRAF PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.3;">
      {{paragrafPembuka}}
    </p>

    <!-- ISI SURAT (WYSIWYG) -->
    <div style="font-size: 10.5pt; line-height: 1.35; text-align: justify; margin-bottom: 6px;">
      {{isiSurat}}
    </div>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; line-height: 1.3;">
      {{paragrafPenutup}}
    </p>

    <!-- SALAM PENUTUP -->
    <div style="margin-top: 0; margin-bottom: 6px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</div>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKiri}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10.5pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  \${FOOTER_HTML}
</div>`;

export const FULL_VARS_KONTRIBUSI_DPS = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0477/Keu-324/DSN-MUI/VIII/2026', defaultValue: 'U-0477/Keu-324/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '11 Agustus 2026 M', defaultValue: '11 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '27 Safar 1448 H', defaultValue: '27 Safar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '----', defaultValue: '----' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Surat Edaran Iuran Bulanan Dewan Pengawas Syariah (DPS)', defaultValue: 'Surat Edaran Iuran Bulanan Dewan Pengawas Syariah (DPS)' },
  { key: 'penerimaSurat', label: 'Penerima Surat (Jabatan & Nama)', type: 'textarea', required: true, placeholder: 'Bapak/Ibu Dewan Pengawas Syariah\nK.H. Sholahudin Al Aiyub, M.Si.', defaultValue: 'Bapak/Ibu Dewan Pengawas Syariah\nK.H. Sholahudin Al Aiyub, M.Si.' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'paragrafPembuka', label: 'Paragraf Pengantar', type: 'textarea', required: true, placeholder: 'Bersama ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) menyampaikan hal-hal berikut:', defaultValue: 'Bersama ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) menyampaikan hal-hal berikut:' },
  { key: 'isiSurat', label: 'Isi Edaran / Poin Kontribusi (WYSIWYG)', type: 'wysiwyg', required: true, placeholder: 'Rincian poin kontribusi...', defaultValue: DEFAULT_ISI_KONTRIBUSI_DPS },
  { key: 'paragrafPenutup', label: 'Paragraf Penutup', type: 'textarea', required: true, placeholder: 'Demikian informasi ini kami sampaikan. Atas perhatian Bapak/Ibu, kami ucapkan terima kasih.', defaultValue: 'Demikian informasi ini kami sampaikan. Atas perhatian Bapak/Ibu, kami ucapkan terima kasih.' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua', defaultValue: 'Ketua' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris', defaultValue: 'Sekretaris' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', defaultValue: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.', defaultValue: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' }
];

export const DEFAULT_TEMPLATES = [
  {
    name: 'Pernyataan Kesesuaian Syariah',
    code: 'PKS-SYARIAH',
    category: 'Pernyataan',
    description: 'Template surat Pernyataan Kesesuaian Syariah untuk disampaikan kepada pihak terkait, termasuk nomor surat, perihal, dan isi pernyataan yang dinamis.',
    htmlContent: FULL_HTML_PKS,
    variables: FULL_VARS_PKS,
  },
  {
    name: 'Pernyataan Keselarasan (Opini) Syariah',
    code: 'OPINI-SYARIAH',
    category: 'Opini',
    description: 'Template surat Pernyataan Keselarasan (Opini) Syariah untuk transaksi atau kebijakan yang memerlukan opini kesesuaian dari DSN-MUI.',
    htmlContent: FULL_HTML_OPINI,
    variables: FULL_VARS_OPINI,
  },
  {
    name: 'Surat Tugas DSN-MUI (ST-0650)',
    code: 'ST-0650-TUGAS',
    category: 'Surat Tugas',
    description: 'Template resmi Surat Tugas Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI) untuk penugasan anggota/pengurus menghadiri kegiatan atau agenda eksternal.',
    htmlContent: FULL_HTML_SURAT_TUGAS,
    variables: FULL_VARS_SURAT_TUGAS,
  },
  {
    name: 'Surat Tugas',
    code: 'SK-TUGAS',
    category: 'Surat Tugas',
    description: 'Template standar Surat Tugas Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI).',
    htmlContent: FULL_HTML_SURAT_TUGAS,
    variables: FULL_VARS_SURAT_TUGAS,
  },
  {
    name: 'Undangan Silaturahim dan Wawancara Calon DPS kepada PT (U-0000)',
    code: 'U-0000-WAWANCARA-DPS',
    category: 'Undangan',
    description: 'Template resmi Draf Undangan Silaturahim dan Wawancara Calon Dewan Pengawas Syariah (DPS) kepada Direktur Utama PT.',
    htmlContent: FULL_HTML_U0000,
    variables: FULL_VARS_U0000,
  },
  {
    name: 'Undangan Rapat Pimpinan Badan Pengurus (U-0638)',
    code: 'U-0638-UNDANGAN-BPH',
    category: 'Undangan',
    description: 'Template resmi Undangan Rapat Pimpinan Badan Pengurus DSN-MUI.',
    htmlContent: FULL_HTML_UNDANGAN_BPH,
    variables: FULL_VARS_UNDANGAN_BPH,
  },
  {
    name: 'Undangan Rapat Kesekretarisan Badan Pengurus (U-0643)',
    code: 'U-0643-UNDANGAN-KESEKRETARISAN',
    category: 'Undangan',
    description: 'Template resmi Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI.',
    htmlContent: FULL_HTML_UNDANGAN_KESEKRETARISAN,
    variables: FULL_VARS_UNDANGAN_KESEKRETARISAN,
  },
  {
    name: 'Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi (U-0667)',
    code: 'U-0667-UNDANGAN-LAYANAN',
    category: 'Undangan',
    description: 'Template resmi Undangan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi DSN-MUI.',
    htmlContent: FULL_HTML_UNDANGAN_LAYANAN,
    variables: FULL_VARS_UNDANGAN_LAYANAN,
  },
  {
    name: 'Undangan Rapat Bidang Fatwa DSN-MUI',
    code: 'UNDANGAN-FATWA',
    category: 'Undangan',
    description: 'Template resmi Undangan Rapat Bidang Fatwa DSN-MUI, mencakup daftar undangan dan agenda rapat.',
    htmlContent: FULL_HTML_UNDANGAN_FATWA,
    variables: FULL_VARS_UNDANGAN_FATWA,
  },
  {
    name: 'Permohonan Dokumen Untuk PKL (U-0000)',
    code: 'U-0000-PERMOHONAN-PKL',
    category: 'Permohonan',
    description: 'Template resmi Permohonan Dokumen Untuk Praktik Kerja Lapangan (PKL) PDPS Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI).',
    htmlContent: FULL_HTML_PERMOHONAN_PKL,
    variables: FULL_VARS_PERMOHONAN_PKL,
  },
  {
    name: 'Penyampaian Informasi Pelatihan (U-0617)',
    code: 'U-0617-INFORMASI-PELATIHAN',
    category: 'Pemberitahuan',
    description: 'Template resmi Penyampaian Informasi Pelatihan (PDPS Privat) Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI).',
    htmlContent: FULL_HTML_INFORMASI_PELATIHAN,
    variables: FULL_VARS_INFORMASI_PELATIHAN,
  },
  {
    name: 'Surat Keterangan Wawancara (U-0541)',
    code: 'U-0541-KETERANGAN-WAWANCARA',
    category: 'Umum',
    description: 'Template resmi Surat Keterangan Wawancara Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI).',
    htmlContent: FULL_HTML_KETERANGAN_WAWANCARA,
    variables: FULL_VARS_KETERANGAN_WAWANCARA,
  },
  {
    name: 'Surat Keterangan Mengikuti Pelatihan (U-0563)',
    code: 'U-0563-KETERANGAN-PELATIHAN',
    category: 'Umum',
    description: 'Template resmi Surat Keterangan Mengikuti Pelatihan Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI).',
    htmlContent: FULL_HTML_KETERANGAN_PELATIHAN,
    variables: FULL_VARS_KETERANGAN_PELATIHAN,
  },
  {
    name: 'Surat Tugas Tim (ST-0663)',
    code: 'ST-0663-TUGAS-TIM',
    category: 'Surat Tugas',
    description: 'Template resmi Surat Tugas Tim Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI).',
    htmlContent: FULL_HTML_SURAT_TUGAS_TIM,
    variables: FULL_VARS_SURAT_TUGAS_TIM,
  },
  {
    name: 'Surat Edaran Kontribusi DPS (U-0477)',
    code: 'U-0477-KONTRIBUSI-DPS',
    category: 'Pemberitahuan',
    description: 'Template resmi Surat Edaran Iuran Bulanan / Kontribusi Dewan Pengawas Syariah (DPS) Dewan Syariah Nasional - Majelis Ulama Indonesia (DSN-MUI).',
    htmlContent: FULL_HTML_KONTRIBUSI_DPS,
    variables: FULL_VARS_KONTRIBUSI_DPS,
  },
];

