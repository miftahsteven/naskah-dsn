export const HEADER_HTML = `<div style="text-align: center; margin-bottom: 4px; margin-left: -30px; margin-right: -30px; padding-top: 10px;">
    <img src="/images/kop-surat.png" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 750px; height: auto; display: block; margin: 0 auto;" />
  </div>

  <!-- Bismillah Calligraphy -->
  <div style="text-align: center; margin-top: 2px; margin-bottom: 6px;">
    <img src="/images/bismillah.svg" alt="Bismillah" style="height: 35px; object-fit: contain; filter: brightness(0); display: block; margin: 0 auto;" />
  </div>`;

export const FULL_HTML_PKS = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 11pt;">
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
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; line-height: 1.35;">
    <tr><td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{nomorSurat}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Lamp.</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{lampiran}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Hal</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">{{perihal}}</td></tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 11pt; line-height: 1.35;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{namaLembaga}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{alamatLembaga}}</div>
    </div>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Sehubungan dengan permohonan kesesuaian syariah atas <strong>{{namaTransaksi}}</strong>
      yang diajukan oleh <strong>{{namaPemohon}}</strong> pada tanggal <strong>{{tanggalPermohonan}}</strong>,
      dengan ini Dewan Syariah Nasional – Majelis Ulama Indonesia (DSN-MUI) menyatakan bahwa:
    </p>

    <ol style="text-align: justify; margin-top: 0; margin-bottom: 8px; margin-left: 0; padding-left: 20px; line-height: 1.35;">
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

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Demikian Pernyataan Kesesuaian Syariah ini kami sampaikan untuk dapat dipergunakan sebagaimana mestinya.
    </p>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">Ketua,</div>
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
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

export const FULL_HTML_OPINI = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 11pt;">
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
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; line-height: 1.35;">
    <tr><td style="width: 60px; vertical-align: top; padding: 2px 0;">Nomor</td><td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{nomorSurat}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Lamp.</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="padding: 2px 0;">{{lampiran}}</td></tr>
    <tr><td style="vertical-align: top; padding: 2px 0;">Hal</td><td style="vertical-align: top; padding: 2px 0;">:</td><td style="font-weight: bold; padding: 2px 0;">Opini Syariah atas {{perihal}}</td></tr>
  </table>

  <!-- BODY CONTENT (Aligned under HAL at margin-left: 75px, ending at margin-right: 15px) -->
  <div style="margin-left: 75px; margin-right: 15px;">
    <!-- KEPADA YTH -->
    <div style="margin-bottom: 12px; font-size: 11pt; line-height: 1.35;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{namaLembaga}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{alamatLembaga}}</div>
    </div>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Menanggapi surat/permohonan dari <strong>{{namaPemohon}}</strong> Nomor <strong>{{nomorSuratPermohonan}}</strong>
      tanggal <strong>{{tanggalPermohonan}}</strong> perihal <strong>{{perihal}}</strong>,
      setelah melakukan kajian mendalam, dengan ini DSN-MUI menyampaikan Opini Syariah sebagai berikut:
    </p>

    <p style="font-weight: bold; margin-top: 0; margin-bottom: 4px;">A. Deskripsi Transaksi</p>
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; white-space: pre-line; line-height: 1.35;">{{deskripsiTransaksi}}</p>

    <p style="font-weight: bold; margin-top: 0; margin-bottom: 4px;">B. Dasar Hukum Syariah</p>
    <ol style="margin-top: 0; margin-bottom: 8px; margin-left: 0; padding-left: 20px; line-height: 1.35;">
      <li>Al-Qur'an dan Hadis yang relevan;</li>
      <li>Fatwa DSN-MUI Nomor <strong>{{nomorFatwa}}</strong> tentang <strong>{{judulFatwa}}</strong>;</li>
      <li style="white-space: pre-line;">{{dasarHukumTambahan}}</li>
    </ol>

    <p style="font-weight: bold; margin-top: 0; margin-bottom: 4px;">C. Opini Syariah</p>
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; line-height: 1.35;">
      Berdasarkan kajian dan analisis syariah, DSN-MUI berpendapat bahwa
      <strong>{{namaTransaksi}}</strong> yang dilaksanakan oleh <strong>{{namaPelaksana}}</strong>
      <strong>selaras dengan prinsip-prinsip syariah</strong>, dengan catatan:
    </p>
    <ol style="text-align: justify; margin-top: 0; margin-bottom: 8px; margin-left: 0; padding-left: 20px; line-height: 1.35;">
      <li style="margin-bottom: 6px; white-space: pre-line;">{{syaratSatu}}</li>
      <li style="margin-bottom: 6px; white-space: pre-line;">{{syaratDua}}</li>
      <li style="margin-bottom: 6px;">Apabila terdapat perubahan struktur transaksi, perlu dilakukan kajian ulang untuk memastikan keselarasan syariah.</li>
    </ol>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Demikian Opini Syariah ini kami sampaikan untuk menjadi perhatian dan dapat dipergunakan sebagaimana mestinya.
    </p>

    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Wassalamu’alaikum Warahmatullah Wabarakatuh.</p>

    <!-- TANDA TANGAN SECTION -->
    <table style="width: 100%; border-collapse: collapse; margin-top: 14px; page-break-inside: avoid;">
      <tr>
        <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">Ketua,</div>
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
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

export const FULL_HTML_UNDANGAN_FATWA = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 11pt;">
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
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; line-height: 1.35;">
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
    <div style="margin-bottom: 12px; font-size: 11pt; line-height: 1.35;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{penerimaUndangan}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
      Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{perihalRapat}}</strong>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL TABLE -->
    <table style="margin-left: 30px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 11pt; line-height: 1.35;">
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
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
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
            <div style="font-weight: bold; font-size: 10pt;">Ketua,</div>
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

  <!-- Page Break for Lampiran 1 -->
  <div style="page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 1 Daftar Undangan {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5;">
      {{daftarUndanganLampiran}}
    </div>
  </div>

  <!-- Page Break for Lampiran 2 -->
  <div style="page-break-before: always; margin-top: 40px;">
    <div style="font-weight: bold; font-size: 11pt; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 15px;">
      Lampiran 2 Agenda Rapat {{perihal}}<br />
      {{nomorSurat}}
    </div>
    <div style="white-space: pre-line; font-size: 11pt; line-height: 1.5;">
      {{agendaRapatLampiran}}
    </div>
  </div>
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
  { key: 'daftarUndanganLampiran', label: 'Lampiran 1: Daftar Undangan (Pre-line)', type: 'textarea', required: true, placeholder: '1. Unsur Pimpinan:\nWakil Ketua: Prof. Dr. K.H. Hasanudin, M.Ag.\n...' },
  { key: 'agendaRapatLampiran', label: 'Lampiran 2: Agenda Rapat (Pre-line)', type: 'textarea', required: true, placeholder: 'Pukul 13.00 – 14.00 WIB:\n1. Pembahasan Lanjutan Hasil FGD...\n...' }
];

export const FULL_HTML_UNDANGAN_BPH = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 11pt;">
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
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; line-height: 1.35;">
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
    <div style="margin-bottom: 12px; font-size: 11pt; line-height: 1.35;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{daftarPenerima}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF ISI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
      Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL TABLE -->
    <table style="margin-left: 30px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 11pt; line-height: 1.35;">
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
        <td style="white-space: pre-line; padding: 2px 0;"><strong>{{tempatRapat}}</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="padding: 2px 0;"><strong>{{agendaRapat}}</strong></td>
      </tr>
    </table>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
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
            <div style="font-weight: bold; font-size: 10pt;">{{jabatanKiri}},</div>
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

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

export const FULL_VARS_UNDANGAN_BPH = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0638/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '4 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '20 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Pimpinan Badan Pengurus DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima (Satu per baris)', type: 'textarea', required: true, placeholder: '1. Pimpinan Badan Pengurus DSN-MUI\n2. Koordinator Bidang Fatwa DSN-MUI\n3. Koordinator Bidang Layanan...' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Pimpinan Badan Pengurus DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Rabu, 5 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 15.00 WIB' },
  { key: 'tempatRapat', label: 'Tempat Rapat', type: 'textarea', required: true, placeholder: 'Kantor DSN-MUI\nJl. Dempo No. 19, Pegangsaan, Jakarta Pusat 10320' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'textarea', required: true, placeholder: '1. Unsur Pimpinan:\n   Ketua : K.H. M. Cholil Nafis, Lc., Ph.D...' },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'textarea', required: true, placeholder: 'Pukul 13.00 - 15.00 WIB:\n1. Laporan...' },
  { key: 'showAgendaDetail', label: 'Show Agenda Detail', type: 'text', required: false, placeholder: 'block' }
];

export const FULL_HTML_UNDANGAN_KESEKRETARISAN = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 11pt;">
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
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; line-height: 1.35;">
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
    <div style="margin-bottom: 12px; font-size: 11pt; line-height: 1.35;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{daftarPenerima}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF ISI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
      Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL TABLE -->
    <table style="margin-left: 30px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 11pt; line-height: 1.35;">
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
        <td style="white-space: pre-line; padding: 2px 0;"><strong>{{mediaRapat}}</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="padding: 2px 0;"><strong>{{agendaRapat}}</strong></td>
      </tr>
    </table>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
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
            <div style="font-weight: bold; font-size: 10pt;">{{jabatanKiri}},</div>
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

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

export const FULL_VARS_UNDANGAN_KESEKRETARISAN = [
  { key: 'nomorSurat', label: 'Nomor Surat Resmi', type: 'text', required: true, placeholder: 'U-0643/DSN-MUI/VIII/2026' },
  { key: 'tanggalMasehi', label: 'Tanggal Masehi', type: 'text', required: true, placeholder: '5 Agustus 2026 M' },
  { key: 'tanggalHijriah', label: 'Tanggal Hijriah', type: 'text', required: true, placeholder: '21 Shafar 1448 H' },
  { key: 'lampiran', label: 'Lampiran', type: 'text', required: false, placeholder: '1 (satu) berkas' },
  { key: 'perihal', label: 'Perihal / Hal', type: 'text', required: true, placeholder: 'Undangan Rapat Kesekretarisan Badan Pengurus DSN-MUI' },
  { key: 'daftarPenerima', label: 'Daftar Penerima (Satu per baris)', type: 'textarea', required: true, placeholder: 'Unsur Sekretaris Badan Pengurus DSN-MUI' },
  { key: 'tempatPenerima', label: 'Tempat / Kota Penerima', type: 'text', required: true, placeholder: 'TEMPAT', defaultValue: 'TEMPAT' },
  { key: 'namaRapat', label: 'Nama Rapat', type: 'text', required: true, placeholder: 'Rapat Kesekretarisan Badan Pengurus DSN-MUI' },
  { key: 'hariTanggalRapat', label: 'Hari & Tanggal Rapat', type: 'text', required: true, placeholder: 'Kamis, 6 Agustus 2026' },
  { key: 'waktuRapat', label: 'Waktu Rapat', type: 'text', required: true, placeholder: '13.00 – 14.30 WIB' },
  { key: 'mediaRapat', label: 'Media Rapat', type: 'textarea', required: true, placeholder: 'Zoom Cloud Meeting\n(Meeting ID: 859 4470 8501 | Passcode: DSNMUI26)' },
  { key: 'agendaRapat', label: 'Agenda Rapat', type: 'text', required: true, placeholder: 'Terlampir' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri (e.g. Ketua)', type: 'text', required: true, placeholder: 'Ketua' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'textarea', required: true, placeholder: 'Sekretaris : Dr. H. Amirsyah Tambunan, M.A\nWakil Sekretaris : Dr. K.H. Moch. Bukhori Muslim, Lc., M.A.\nWakil Sekretaris : Kanny Hidaya, S.E., M.A.\nWakil Sekretaris : Dr. Asrori S. Karni, S.Ag., M.H.\nWakil Sekretaris : Drs. H. Muhammad Ziyad, M.A.' },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'textarea', required: true, placeholder: '1. Tindak Lanjut Keputusan Rapat Pimpinan.\n2. Pembahasan surat-surat Masuk\n3. Dan lain-lain.' },
  { key: 'showAgendaDetail', label: 'Show Agenda Detail', type: 'text', required: false, placeholder: 'block' }
];

export const FULL_HTML_UNDANGAN_LAYANAN = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 11pt;">
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
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; line-height: 1.35;">
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
    <div style="margin-bottom: 12px; font-size: 11pt; line-height: 1.35;">
      <div>Kepada Yth.</div>
      <div style="white-space: pre-line; font-weight: bold; margin-bottom: 2px;">{{daftarPenerima}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{tempatPenerima}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF ISI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
      Dengan ini Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengundang Bapak/Ibu/Sdr/i untuk hadir dalam <strong>{{namaRapat}}</strong>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL TABLE -->
    <table style="margin-left: 30px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 11pt; line-height: 1.35;">
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
        <td style="white-space: pre-line; padding: 2px 0;"><strong>{{tempatRapat}}</strong></td>
      </tr>
      <tr>
        <td style="vertical-align: top; font-weight: bold; padding: 2px 0;">Agenda</td>
        <td style="vertical-align: top; padding: 2px 0;">:</td>
        <td style="padding: 2px 0;"><strong>{{agendaRapat}}</strong></td>
      </tr>
    </table>

    <!-- PARAGRAF PENUTUP -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
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
            <div style="font-weight: bold; font-size: 10pt;">{{jabatanKiri}},</div>
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">{{jabatanKanan}},</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
  </div>

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
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan (e.g. Sekretaris)', type: 'text', required: true, placeholder: 'Sekretaris' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
  { key: 'daftarUndangan', label: 'Daftar Undangan Detail (Lampiran 1)', type: 'textarea', required: true, placeholder: '1. Unsur Pimpinan:\n   Wakil Ketua : K.H. Sholahudin Al Aiyub\n   Wakil Ketua : Ir. H. Adiwarman A. Karim, S.E., M.B.A., M.A.E.P.\n   Wakil Sekretaris : Kanny Hidaya, S.E., M.A.\n   Wakil Sekretaris : Dr. Asrori S. Karni, S.Ag., M.H.\n\n2. Koordinator Bidang Fatwa:\n   Dr. Asep Supyadillah, M.Ag.\n\n3. Anggota Bidang Fatwa:\n   1. Ah. Azharuddin Latif, M.Ag., M.H.\n   2. Dr. Yuke Rahmawati, M.A.' },
  { key: 'agendaDetail', label: 'Detail Agenda Rapat (Lampiran 2)', type: 'textarea', required: true, placeholder: '1. Tindak Lanjut atas Rapat Kesekretarisan DSN-MUI tanggal 6 Agustus 2026:\n   a. Pemohonan Izin Penelitian Skripsi dari Velisa Universitas Darussalam\n   b. Permohonan Surat Rekomendasi Dewan Pengawas Syariah dari PT LKM Artha Kerta Raharja (Perseroda)\n   ...' },
  { key: 'showAgendaDetail', label: 'Show Agenda Detail', type: 'text', required: false, placeholder: 'block' }
];

export const FULL_HTML_U0000 = `<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- TANGGAL SURAT -->
  <div style="text-align: right; margin-bottom: 12px; margin-right: 15px;">
    <table style="display: inline-table; margin-left: auto; border-collapse: separate; border-spacing: 0; text-align: left; font-size: 11pt;">
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
  <table style="width: calc(100% - 15px); border-collapse: collapse; margin-bottom: 8px; font-size: 11pt; line-height: 1.35;">
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
    <div style="margin-bottom: 12px; font-size: 11pt; line-height: 1.35;">
      <div>Kepada Yth.</div>
      <div style="font-weight: bold;">Direktur Utama {{nama_pt}}</div>
      <div style="font-weight: bold;">Sdr. {{nama_dirut}}</div>
      <div>di -</div>
      <div style="margin-left: 20px; font-weight: bold;">{{kota_tujuan}}</div>
    </div>

    <!-- SALAM PEMBUKA -->
    <p style="margin-top: 0; margin-bottom: 4px; font-style: italic;">Assalamu’alaikum Warahmatullah Wabarakatuh,</p>

    <!-- PARAGRAF PEMBUKA -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Puji syukur ke hadirat Allah Subhanahu wa Ta’ala, teriring doa semoga Saudara dalam keadaan sehat wal afiat dan mendapat lindungan dari Allah SWT dalam menjalankan tugas sehari-hari.
    </p>

    <!-- PARAGRAF ISI -->
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Menunjuk surat Saudara No. <strong>{{no_surat_permohonan}}</strong> tertanggal <strong>{{tgl_surat_permohonan}}</strong> perihal <strong>{{perihal_surat_permohonan}}</strong>; dan berdasarkan keputusan Rapat Bidang Layanan, Literasi, Relasi Industri, dan Regulasi Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) tanggal <strong>{{tgl_rapat_dsn}}</strong>, DSN-MUI mengundang calon Dewan Pengawas Syariah (DPS) yang Saudara ajukan yaitu <strong>Sdr. {{nama_calon_dps}}</strong> untuk silaturahim dan wawancara melalui <em>video conference</em>, yang insyaAllah akan diadakan pada:
    </p>

    <!-- JADWAL WAWANCARA TABLE -->
    <table style="margin-left: 30px; border-collapse: collapse; margin-top: 4px; margin-bottom: 6px; font-size: 11pt; line-height: 1.35;">
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
    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Konfirmasi kehadiran dapat menghubungi Kepala Sekretariat DSN-MUI (Sdr. Abdul Wasik, M.Si, HP: 0818 404 852), Hotline DSN-MUI (HP: 0822 6000 4146) atau email <a href="mailto:sekretariat@dsnmui.or.id" style="color: #006633; text-decoration: underline;">sekretariat@dsnmui.or.id</a> dan <a href="mailto:dsnmui@gmail.com" style="color: #006633; text-decoration: underline;">dsnmui@gmail.com</a>.
    </p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Mengingat pentingnya acara tersebut, kami mengharapkan calon DPS yang Saudara ajukan dapat menghadiri tepat pada waktunya.
    </p>

    <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
      Demikian surat ini kami sampaikan. Atas perhatian dan kerja sama Saudara, kami ucapkan terima kasih.
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
            <div style="font-weight: bold; font-size: 10pt;">Ketua,</div>
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
          </div>
        </td>
        <td style="width: 55%; vertical-align: top; padding: 0; text-align: right;">
          <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
            <div style="font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
            <div style="font-weight: bold; font-size: 10pt;">Sekretaris,</div>
            <!-- QR_CODE_TTE_PLACEHOLDER -->
            <div style="height: 60px;"></div>
            <span style="font-size: 9.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
          </div>
        </td>
      </tr>
    </table>
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

export const FULL_HTML_SURAT_TUGAS = `<div style="font-family: Arial, sans-serif; font-size: 10.5pt; color: #111827; line-height: 1.35; max-width: 750px; margin: auto; padding: 0px 40px 10px 40px;">
  \${HEADER_HTML}

  <!-- JUDUL SURAT & NOMOR -->
  <div style="text-align: center; margin-top: 6px; margin-bottom: 12px;">
    <div style="font-weight: bold; font-size: 11pt; text-decoration: underline; letter-spacing: 4px; text-transform: uppercase; display: inline-block;">S U R A T &nbsp; T U G A S</div>
    <div style="font-size: 10.5pt; margin-top: 2px;">No: {{nomorSurat}}</div>
  </div>

  <!-- KONSIDERANS PEMBUKA -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
    Menunjuk surat dari {{namaLembagaPengundang}} No. {{nomorSuratPengundang}} tertanggal {{tanggalSuratPengundang}}, dan berdasarkan keputusan Rapat {{namaRapatPengambilKeputusan}} Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) tanggal {{tanggalRapat}}, DSN-MUI dengan ini <strong>menugaskan</strong> kepada:
  </p>

  <!-- TABEL RINCIAN PENUGASAN -->
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 6px; font-size: 10.5pt; line-height: 1.35;">
    <tr>
      <td style="width: 100px; vertical-align: top; padding: 2px 0;">Nama</td>
      <td style="width: 15px; vertical-align: top; padding: 2px 0;">:</td>
      <td style="padding: 2px 0; white-space: pre-line;">{{daftarNamaPenugasan}}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 4px 0 2px 0;">Keperluan</td>
      <td style="vertical-align: top; padding: 4px 0 2px 0;">:</td>
      <td style="padding: 4px 0 2px 0; text-align: justify;">
        {{keperluan}}
        <table style="width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 10.5pt; line-height: 1.35;">
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
        <div style="white-space: pre-line; line-height: 1.35;">{{keteranganNarahubung}}</div>
      </td>
    </tr>
  </table>

  <!-- PARAGRAF PENUTUP -->
  <p style="text-align: justify; margin-top: 0; margin-bottom: 6px; text-indent: 30px; line-height: 1.35;">
    Demikian Surat Tugas ini diberikan kepada yang bersangkutan untuk dilaksanakan sebagaimana mestinya dan melaporkan hasilnya kepada Pimpinan DSN-MUI.
  </p>

  <p style="text-align: justify; margin-top: 0; margin-bottom: 8px; text-indent: 30px; line-height: 1.35;">
    Apabila dalam penugasan ini terdapat kekeliruan, atau ada kebutuhan organisasi, akan diperbaiki sebagaimana mestinya.
  </p>

  <!-- TANDA TANGAN SECTION -->
  <table style="width: 100%; border-collapse: collapse; margin-top: 8px; page-break-inside: avoid;">
    <tr>
      <td style="width: 45%; vertical-align: top; padding: 0; text-align: left;">
        <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
          <!-- Hidden spacer matching date + headerTtd height -->
          <div style="visibility: hidden; font-size: 10.5pt; line-height: 1.2; margin-bottom: 6px;">
            <div>Jakarta, {{tanggalHijriah}}</div>
            <div style="padding-top: 2px;">{{tanggalMasehi}}</div>
          </div>
          <div style="visibility: hidden; font-size: 9.5pt; font-weight: normal; text-transform: uppercase; line-height: 1.25; white-space: pre-line; margin-bottom: 6px;">{{headerTtd}}</div>
          <div style="font-weight: normal; font-size: 10.5pt;">{{jabatanKiri}},</div>
          <div style="height: 55px;"></div>
          <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaKetua}}</span>
        </div>
      </td>
      <td style="width: 55%; vertical-align: top; padding: 0; text-align: left;">
        <div style="display: inline-block; text-align: left; font-family: Arial, sans-serif;">
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
          <div style="font-weight: normal; font-size: 10.5pt;">{{jabatanKanan}},</div>
          <!-- QR_CODE_TTE_PLACEHOLDER -->
          <div style="height: 55px;"></div>
          <span style="font-size: 10.5pt; font-weight: bold; border-bottom: 1.5px solid #000; text-decoration: none; padding-bottom: 0px; line-height: 1.15; display: inline-block; white-space: nowrap;">{{namaSekretaris}}</span>
        </div>
      </td>
    </tr>
  </table>
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
  { key: 'daftarNamaPenugasan', label: 'Daftar Nama yang Ditugaskan (Multiline)', type: 'textarea', required: true, placeholder: '1. Ibnu Wazi\n   (Anggota Bidang Fatwa)\n2. Dr. Nofrianto, M.Ag., CM.\n   (Anggota Bidang Layanan, Literasi, Relasi Industri, dan Regulasi)', defaultValue: '1. Ibnu Wazi\n   (Anggota Bidang Fatwa)\n2. Dr. Nofrianto, M.Ag., CM.\n   (Anggota Bidang Layanan, Literasi, Relasi Industri, dan Regulasi)' },
  { key: 'keperluan', label: 'Keperluan Tugas (Paragraf Pengantar)', type: 'textarea', required: true, placeholder: 'menghadiri kegiatan Risk Based Performance Management Training, yang diselenggarakan oleh LPEU MUI, yang insyaAllah dilaksanakan pada:', defaultValue: 'menghadiri kegiatan Risk Based Performance Management Training, yang diselenggarakan oleh LPEU MUI, yang insyaAllah dilaksanakan pada:' },
  { key: 'hariTanggalKegiatan', label: 'Hari & Tanggal Kegiatan', type: 'text', required: true, placeholder: 'Jumat-Sabtu, 7-8 Agustus 2026', defaultValue: 'Jumat-Sabtu, 7-8 Agustus 2026' },
  { key: 'waktuKegiatan', label: 'Waktu Kegiatan', type: 'text', required: true, placeholder: '08.00 WIB - selesai (Rundown acara terlampir)', defaultValue: '08.00 WIB - selesai (Rundown acara terlampir)' },
  { key: 'tempatKegiatan', label: 'Tempat Kegiatan', type: 'textarea', required: true, placeholder: 'Aula Buya Hamka Gedung MUI Pusat\nJl. Proklamasi 51, Menteng, Jakarta Pusat', defaultValue: 'Aula Buya Hamka Gedung MUI Pusat\nJl. Proklamasi 51, Menteng, Jakarta Pusat' },
  { key: 'keteranganNarahubung', label: 'Keterangan Narahubung', type: 'textarea', required: true, placeholder: '❖ Sekretariat DSN-MUI\n   Telp./WA : 0818 404 852 (Sdr. Abdul Wasik, M.Si)\n   WA Hotline : 0822 6000 4146\n   Email : sekretariat@dsnmui.or.id\n           dsnmui@gmail.com\n\n❖ LPEU MUI\n   Telp. : 0812 1569 7070 (Admin WA LPEU MUI)\n   Email : lpeu.mui.pusat@gmail.com', defaultValue: '❖ Sekretariat DSN-MUI\n   Telp./WA : 0818 404 852 (Sdr. Abdul Wasik, M.Si)\n   WA Hotline : 0822 6000 4146\n   Email : sekretariat@dsnmui.or.id\n           dsnmui@gmail.com\n\n❖ LPEU MUI\n   Telp. : 0812 1569 7070 (Admin WA LPEU MUI)\n   Email : lpeu.mui.pusat@gmail.com' },
  { key: 'headerTtd', label: 'Header Tanda Tangan', type: 'textarea', required: true, placeholder: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA', defaultValue: 'BADAN PENGURUS\nDEWAN SYARIAH NASIONAL-\nMAJELIS ULAMA INDONESIA' },
  { key: 'jabatanKiri', label: 'Jabatan Kiri', type: 'text', required: true, placeholder: 'Ketua', defaultValue: 'Ketua' },
  { key: 'namaKetua', label: 'Nama Ketua (Kiri)', type: 'text', required: true, placeholder: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.', defaultValue: 'K.H. M. CHOLIL NAFIS, Lc., Ph.D.' },
  { key: 'jabatanKanan', label: 'Jabatan Kanan', type: 'text', required: true, placeholder: 'Sekretaris', defaultValue: 'Sekretaris' },
  { key: 'namaSekretaris', label: 'Nama Sekretaris (Kanan)', type: 'text', required: true, placeholder: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.', defaultValue: 'Dr. H. AMIRSYAH TAMBUNAN, M.A.' },
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
];
