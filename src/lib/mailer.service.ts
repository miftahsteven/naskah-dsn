import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

let transporterInstance: Transporter | null = null;
let currentConfigKey: string = '';
let etherealAccount: any = null;

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  error?: string;
}

/**
 * Get or initialize nodemailer transporter.
 * Supports:
 * 1. Production SMTP via env with pooling (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
 * 2. Automatic Ethereal test account in development (with preview URLs)
 * 3. Safe fallback transport if network fails
 */
async function getTransporter(): Promise<Transporter> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const configKey = `${host}:${port}:${user}:${pass}:${secure}`;

  if (transporterInstance && currentConfigKey === configKey) {
    return transporterInstance;
  }

  if (host && user && pass) {
    console.log(`[Mailer] Initializing pooled SMTP transport: ${user}@${host}:${port} (secure=${secure}, pooled=true)`);
    currentConfigKey = configKey;
    transporterInstance = nodemailer.createTransport({
      pool: true,
      maxConnections: 3,
      maxMessages: 100,
      host,
      port,
      secure,
      auth: { user, pass },
      connectionTimeout: 20000,
      greetingTimeout: 25000,
      socketTimeout: 30000,
      tls: { rejectUnauthorized: false },
    } as any);
    return transporterInstance;
  }

  // Development fallback: try Ethereal email for realistic mail testing
  try {
    console.log('[Mailer] No custom SMTP configured. Creating Ethereal test account for dev...');
    etherealAccount = await nodemailer.createTestAccount();
    transporterInstance = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
    console.log(`[Mailer] Ethereal test account created: ${etherealAccount.user}`);
    return transporterInstance;
  } catch (err: any) {
    console.warn('[Mailer] Could not create Ethereal account, using stream/mock transporter:', err.message);
    transporterInstance = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
    return transporterInstance;
  }
}

const getFromAddress = (): string => {
  return process.env.SMTP_FROM || 'Sekretariat DSN-MUI <sekretariat@dsnmui.or.id>';
};

const getPortalUrl = (): string => {
  return process.env.PUBLIC_PORTAL_URL || 'http://localhost:5174';
};

/**
 * 1. SEND OTP EMAIL
 */
export interface SendOtpEmailParams {
  toEmail: string;
  otpCode: string;
  type?: 'REGISTER' | 'LOGIN' | 'VERIFY' | string | undefined;
  recipientName?: string | undefined;
}

export async function sendOtpEmail({
  toEmail,
  otpCode,
  type = 'REGISTER',
  recipientName,
}: SendOtpEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();

    const isRegister = type === 'REGISTER';
    const subjectTitle = isRegister
      ? `[DSN-MUI] Kode OTP Verifikasi Pendaftaran: ${otpCode}`
      : `[DSN-MUI] Kode OTP Masuk Portal Amanah: ${otpCode}`;

    const headingText = isRegister
      ? 'Verifikasi Pendaftaran Akun Perusahaan'
      : 'Verifikasi Masuk Portal Amanah DSN-MUI';

    const actionDescription = isRegister
      ? 'Anda telah mengajukan pendaftaran akun perusahaan pemohon pada Portal Pengajuan Kesesuaian Syariah DSN-MUI.'
      : 'Anda sedang melakukan proses masuk (login) ke Portal Amanah DSN-MUI.';

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" max-width="580" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #005a2b 0%, #007a3d 100%); padding: 32px 30px; text-align: center; border-bottom: 4px solid #d4af37;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <div style="background-color: #ffffff; width: 64px; height: 64px; border-radius: 14px; padding: 6px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); display: inline-block;">
                      <img src="https://amanah.dsnmui.or.id/images/logo-dsn.png" alt="Logo DSN-MUI" width="52" height="52" style="display: block; margin: auto; object-fit: contain;" onerror="this.style.display='none'" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">DEWAN SYARIAH NASIONAL - MUI</h1>
                    <p style="color: #d4af37; margin: 4px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Portal Pengajuan Kesesuaian Syariah (AMANAH)</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 19px; font-weight: 700; color: #0f172a; text-align: center;">
                ${headingText}
              </h2>

              <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                <em>Assalamu’alaikum Warahmatullahi Wabarakatuh,</em>
              </p>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                ${recipientName ? `Yth. <strong>${recipientName}</strong>,<br/>` : ''}
                ${actionDescription} Gunakan 6 digit kode OTP berikut untuk memverifikasi alamat email Anda:
              </p>

              <!-- OTP Code Display Card -->
              <div style="margin: 28px 0; text-align: center;">
                <div style="display: inline-block; background-color: #f0fdf4; border: 2px dashed #007a3d; border-radius: 12px; padding: 18px 36px; box-shadow: 0 2px 8px rgba(0, 122, 61, 0.08);">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #005a2b; display: block; margin-left: 8px;">
                    ${otpCode}
                  </span>
                </div>
              </div>

              <!-- Expiry & Warning -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #92400e; line-height: 1.5;">
                    ⏳ <strong>Masa Berlaku:</strong> Kode OTP ini hanya berlaku selama <strong>45 detik</strong>.<br/>
                    🔒 <strong>Peringatan Keamanan:</strong> Jangan pernah membagikan kode OTP ini kepada siapa pun, termasuk petugas atau pihak yang mengatasnamakan DSN-MUI.
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 13px; line-height: 1.5; color: #64748b;">
                Jika Anda tidak merasa melakukan pendaftaran atau permintaan ini, silakan abaikan email ini secara aman.
              </p>

              <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #334155;">
                <em>Wassalamu’alaikum Warahmatullahi Wabarakatuh,</em><br/>
                <strong>Sekretariat Dewan Syariah Nasional – MUI</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                Dewan Syariah Nasional – Majelis Ulama Indonesia
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                Gedung MUI Pusat, Jl. Proklamasi No. 51, Menteng, Jakarta Pusat 10320<br/>
                Telp/WA Hotline: +62 822-6000-4146 | Email: sekretariat@dsnmui.or.id
              </p>
              <p style="margin: 10px 0 0 0; font-size: 10px; color: #94a3b8;">
                Email ini dikirimkan secara otomatis oleh Sistem Amanah DSN-MUI. Mohon tidak membalas langsung ke alamat email ini.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const textContent = `
DEWAN SYARIAH NASIONAL - MUI
Portal Pengajuan Kesesuaian Syariah (AMANAH)
--------------------------------------------
${headingText}

Assalamu’alaikum Warahmatullahi Wabarakatuh,

${actionDescription}
Berikut adalah kode One-Time Password (OTP) Anda:

KODE OTP: ${otpCode}

Masa berlaku kode ini: 45 Detik.
PERINGATAN: Jangan berikan kode ini kepada pihak manapun termasuk petugas DSN-MUI.

Wassalamu’alaikum Warahmatullahi Wabarakatuh,
Sekretariat DSN-MUI
Gedung MUI Pusat, Jl. Proklamasi No. 51, Jakarta Pusat
Email: sekretariat@dsnmui.or.id
`;

    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const info = await transporter.sendMail({
          from: getFromAddress(),
          to: toEmail,
          subject: subjectTitle,
          text: textContent,
          html: htmlContent,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Mailer] OTP email sent successfully to ${toEmail} (Attempt ${attempt}). MessageId: ${info.messageId}`);
        if (previewUrl) {
          console.log(`[Mailer] Ethereal Email Preview URL: ${previewUrl}`);
        }

        return {
          success: true,
          messageId: info.messageId,
          previewUrl,
        };
      } catch (err: any) {
        lastError = err;
        console.error(`[Mailer] OTP email send attempt ${attempt}/2 failed to ${toEmail}:`, err.message);
        transporterInstance = null;
        currentConfigKey = '';
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Gagal mengirim kode OTP ke server email.',
    };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send OTP email to ${toEmail}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 2. SEND REGISTRATION SUCCESS & READY TO LOGIN EMAIL
 */
export interface SendRegistrationSuccessEmailParams {
  toEmail: string;
  companyName: string;
  picName: string;
  picPosition?: string | undefined;
  loginUrl?: string | undefined;
}

export async function sendRegistrationSuccessEmail({
  toEmail,
  companyName,
  picName,
  picPosition = 'Penanggung Jawab',
  loginUrl,
}: SendRegistrationSuccessEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();
    const portalBase = getPortalUrl();
    const activeLoginUrl = loginUrl || `${portalBase}/login?email=${encodeURIComponent(toEmail)}`;

    const subjectTitle = `[DSN-MUI Amanah] Pendaftaran Berhasil — Akun Perusahaan ${companyName} Siap Digunakan`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subjectTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f7f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f7f6; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="100%" max-width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.07); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #005a2b 0%, #007a3d 100%); padding: 36px 30px; text-align: center; border-bottom: 4px solid #d4af37;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 14px;">
                    <div style="background-color: #ffffff; width: 68px; height: 68px; border-radius: 16px; padding: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); display: inline-block;">
                      <img src="https://amanah.dsnmui.or.id/images/logo-dsn.png" alt="Logo DSN-MUI" width="56" height="56" style="display: block; margin: auto; object-fit: contain;" onerror="this.style.display='none'" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <h1 style="color: #ffffff; margin: 0; font-size: 21px; font-weight: 800; letter-spacing: 0.5px;">DEWAN SYARIAH NASIONAL - MUI</h1>
                    <p style="color: #d4af37; margin: 4px 0 0 0; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Portal Pengajuan Kesesuaian Syariah (AMANAH)</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <!-- Badge -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="background-color: #dcfce7; color: #166534; font-size: 12px; font-weight: 700; padding: 6px 16px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid #bbf7d0;">
                  ✓ Pendaftaran Terverifikasi & Aktif
                </span>
              </div>

              <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.4;">
                Selamat! Akun Perusahaan Anda Telah Siap Digunakan
              </h2>

              <p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                <em>Assalamu’alaikum Warahmatullahi Wabarakatuh,</em>
              </p>

              <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
                Yth. <strong>Bapak/Ibu ${picName}</strong> (${picPosition}),<br/>
                Alhamdulillah, pendaftaran perusahaan <strong>${companyName}</strong> pada <strong>Portal Amanah DSN-MUI</strong> telah berhasil diverifikasi dan akun Anda kini telah <strong>aktif sepenuhnya</strong>.
              </p>

              <!-- Account Summary Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px;">
                <tr>
                  <td colspan="2" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 10px;">
                    <strong style="font-size: 13px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Ringkasan Data Pendaftaran</strong>
                  </td>
                </tr>
                <tr>
                  <td width="40%" style="padding: 10px 0 4px 0; font-size: 13px; color: #64748b;">Nama Perusahaan:</td>
                  <td width="60%" style="padding: 10px 0 4px 0; font-size: 13px; font-weight: 700; color: #0f172a;">${companyName}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Penanggung Jawab (PIC):</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; color: #0f172a;">${picName} (${picPosition})</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Email Login Resmi:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #007a3d;">${toEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Status Akun:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; color: #15803d;">Aktif (Siap Login)</td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <div style="text-align: center; margin: 30px 0 32px 0;">
                <a href="${activeLoginUrl}" style="background: linear-gradient(135deg, #005a2b 0%, #007a3d 100%); color: #ffffff; text-decoration: none; padding: 15px 36px; font-size: 15px; font-weight: 700; border-radius: 12px; display: inline-block; box-shadow: 0 4px 14px rgba(0, 122, 61, 0.3); letter-spacing: 0.3px;">
                  Masuk ke Portal Amanah DSN-MUI &rarr;
                </a>
              </div>

              <!-- How to login guidance -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1e293b;">
                  🔑 Panduan Masuk (Passwordless Login via OTP):
                </h3>
                <ol style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;">
                  <li>Kunjungi portal publik di <a href="${portalBase}" style="color: #007a3d; text-decoration: underline;">${portalBase}</a> atau klik tombol di atas.</li>
                  <li>Masukkan alamat email terdaftar: <strong>${toEmail}</strong>.</li>
                  <li>Sistem akan otomatis mengirimkan 6 digit kode OTP ke email Anda.</li>
                  <li>Masukkan kode OTP untuk langsung mengakses dashboard perusahaan tanpa perlu mengingat kata sandi.</li>
                </ol>
              </div>

              <!-- What can you do now -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 700; color: #1e293b;">
                  📋 Layanan yang Dapat Anda Akses:
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.6; color: #475569;">
                  <li>Melengkapi profil perusahaan dan dokumen legalitas badan usaha.</li>
                  <li>Membuat permohonan baru untuk Opini Syariah, Fatwa, Rekomendasi DPS, atau Kesesuaian Produk/Lembaga.</li>
                  <li>Mengunggah berkas persyaratan dan memantau status telaah secara transparan.</li>
                  <li>Mengunduh Sertifikat Kesesuaian Syariah resmi ber-QR Code setelah disetujui Sidang Pleno.</li>
                </ul>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 14px; line-height: 1.6; color: #334155;">
                <em>Wassalamu’alaikum Warahmatullahi Wabarakatuh,</em><br/>
                <strong>Sekretariat Dewan Syariah Nasional – Majelis Ulama Indonesia</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
                Dewan Syariah Nasional – Majelis Ulama Indonesia
              </p>
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                Gedung MUI Pusat, Jl. Proklamasi No. 51, Menteng, Jakarta Pusat 10320<br/>
                Telp/WA Hotline: +62 822-6000-4146 | Email: sekretariat@dsnmui.or.id
              </p>
              <p style="margin: 10px 0 0 0; font-size: 10px; color: #94a3b8;">
                Email ini dikirimkan secara otomatis oleh Sistem Amanah DSN-MUI. Mohon simpan email ini sebagai bukti pendaftaran resmi.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const textContent = `
DEWAN SYARIAH NASIONAL - MUI
Portal Pengajuan Kesesuaian Syariah (AMANAH)
--------------------------------------------
Selamat! Pendaftaran Perusahaan Berhasil & Akun Siap Digunakan

Assalamu’alaikum Warahmatullahi Wabarakatuh,

Yth. Bapak/Ibu ${picName} (${picPosition}),

Alhamdulillah, pendaftaran perusahaan ${companyName} pada Portal Amanah DSN-MUI telah berhasil diproses dan akun Anda kini telah aktif.

RINGKASAN DATA:
- Nama Perusahaan: ${companyName}
- Penanggung Jawab (PIC): ${picName} (${picPosition})
- Email Login: ${toEmail}
- Status: Aktif & Siap Login

Tautan Masuk:
${activeLoginUrl}

CARA LOGIN:
1. Buka tautan di atas.
2. Masukkan email ${toEmail}.
3. Masukkan 6 digit kode OTP yang dikirimkan ke email Anda.
4. Anda dapat langsung mengakses dashboard pengajuan.

Wassalamu’alaikum Warahmatullahi Wabarakatuh,
Sekretariat DSN-MUI
Gedung MUI Pusat, Jl. Proklamasi No. 51, Jakarta Pusat 10320
Email: sekretariat@dsnmui.or.id | WA Hotline: +62 822-6000-4146
`;

    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const info = await transporter.sendMail({
          from: getFromAddress(),
          to: toEmail,
          subject: subjectTitle,
          text: textContent,
          html: htmlContent,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Mailer] Welcome/Ready-to-login email sent to ${toEmail} (Attempt ${attempt}). MessageId: ${info.messageId}`);
        if (previewUrl) {
          console.log(`[Mailer] Ethereal Preview URL: ${previewUrl}`);
        }

        return {
          success: true,
          messageId: info.messageId,
          previewUrl,
        };
      } catch (err: any) {
        lastError = err;
        console.error(`[Mailer] Welcome email send attempt ${attempt}/2 failed to ${toEmail}:`, err.message);
        transporterInstance = null;
        currentConfigKey = '';
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Gagal mengirim email konfirmasi pendaftaran.',
    };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send welcome email to ${toEmail}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 3. SEND SUBMISSION CONFIRMATION EMAIL (e.g. Permohonan Rekomendasi DPS)
 */
export interface SendSubmissionConfirmationEmailParams {
  toEmail: string;
  recipientName: string;
  companyName: string;
  submissionNumber: string;
  submissionTitle: string;
  serviceName: string;
  candidateNames?: string[];
  submissionId?: string;
}

export async function sendSubmissionConfirmationEmail({
  toEmail,
  recipientName,
  companyName,
  submissionNumber,
  submissionTitle,
  serviceName,
  candidateNames = [],
  submissionId,
}: SendSubmissionConfirmationEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();
    const portalUrl = getPortalUrl();
    const trackingUrl = submissionId
      ? `${portalUrl}/submissions/${submissionId}`
      : `${portalUrl}/dashboard`;

    const subjectTitle = `[DSN-MUI] Konfirmasi Pengajuan ${serviceName}: ${submissionNumber}`;

    const candidatesListHtml = candidateNames.length > 0
      ? `
        <div style="margin-top: 14px; padding: 12px 16px; background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #334155; text-transform: uppercase; letter-spacing: 0.5px;">
            Daftar Calon Dewan Pengawas Syariah Diusulkan (${candidateNames.length} Orang):
          </p>
          <ol style="margin: 0; padding-left: 20px; font-size: 13px; color: #1e293b; line-height: 1.6;">
            ${candidateNames.map((name) => `<li style="margin-bottom: 4px;"><strong>${name}</strong></li>`).join('')}
          </ol>
        </div>
      `
      : '';

    const candidatesText = candidateNames.length > 0
      ? candidateNames.map((name, i) => `   ${i + 1}. ${name}`).join('\n')
      : '   -';

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${subjectTitle}</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px 12px; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
    
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #004d25 0%, #006633 50%, #00381a 100%); padding: 32px 30px; text-align: center;">
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0 0 4px 0; letter-spacing: 0.5px;">
          AMANAH DSN-MUI
        </h1>
        <p style="color: #d4af37; font-size: 12px; font-weight: 600; margin: 0; text-transform: uppercase; letter-spacing: 1.5px;">
          Dewan Syariah Nasional – Majelis Ulama Indonesia
        </p>
      </td>
    </tr>

    <!-- Body Content -->
    <tr>
      <td style="padding: 32px 30px;">
        <span style="display: inline-block; background-color: #dcfce7; color: #166534; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">
          Pengajuan Berhasil Diterima
        </span>

        <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.4;">
          Konfirmasi Pengajuan ${serviceName}
        </h2>

        <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.6; color: #334155;">
          Assalamu’alaikum Warahmatullahi Wabarakatuh,<br/><br/>
          Yth. <strong>${recipientName}</strong>,<br/>
          Perwakilan Resmi <strong>${companyName}</strong>,
        </p>

        <p style="margin: 0 0 20px 0; font-size: 14px; line-height: 1.6; color: #334155;">
          Terima kasih atas pengajuan permohonan rekomendasi Dewan Pengawas Syariah melalui Portal Amanah DSN-MUI. Berkas permohonan dan dokumen kelengkapan Anda telah berhasil terdaftar ke dalam sistem antrean surat masuk resmi DSN-MUI.
        </p>

        <!-- Ticket Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px;">
          <tr>
            <td style="font-size: 13px; line-height: 1.8; color: #475569;">
              <strong style="color: #1e293b;">Nomor Registrasi / Tiket:</strong> <span style="font-family: monospace; font-weight: 700; color: #006633; background: #dcfce7; padding: 2px 6px; border-radius: 4px;">${submissionNumber}</span><br/>
              <strong style="color: #1e293b;">Layanan:</strong> ${serviceName}<br/>
              <strong style="color: #1e293b;">Judul Permohonan:</strong> ${submissionTitle}<br/>
              <strong style="color: #1e293b;">Instansi Pemohon:</strong> ${companyName}<br/>
              <strong style="color: #1e293b;">Status Saat Ini:</strong> <span style="font-weight: 700; color: #2563eb;">Proses Pengajuan</span>
            </td>
          </tr>
        </table>

        ${candidatesListHtml}

        <!-- 5 Tahapan Alur Info -->
        <div style="margin: 24px 0; padding: 16px 20px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px;">
          <p style="margin: 0 0 10px 0; font-size: 12px; font-weight: 700; color: #166534; text-transform: uppercase;">
            Alur Tahapan Proses Rekomendasi DPS di DSN-MUI:
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="font-size: 12px; color: #166534; line-height: 1.6;">
            <tr><td style="padding: 3px 0;"><strong>1. Proses Pengajuan</strong> &nbsp;— Berkas masuk ke antrean sekretariat</td></tr>
            <tr><td style="padding: 3px 0;"><strong>2. Validasi Dokumen</strong> &nbsp;— Pemeriksaan kelengkapan & keabsahan persyaratan</td></tr>
            <tr><td style="padding: 3px 0;"><strong>3. Wawancara</strong> &nbsp;— Uji kompetensi syariah calon DPS</td></tr>
            <tr><td style="padding: 3px 0;"><strong>4. Proses Internal</strong> &nbsp;— Sidang pleno komisi & BPH DSN-MUI</td></tr>
            <tr><td style="padding: 3px 0;"><strong>5. Lulus / Tidak Lulus</strong> &nbsp;— Penerbitan Surat Rekomendasi resmi</td></tr>
          </table>
        </div>

        <!-- Action Button -->
        <div style="margin: 28px 0; text-align: center;">
          <a href="${trackingUrl}" style="display: inline-block; background: linear-gradient(135deg, #006633 0%, #007a3d 100%); color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 102, 51, 0.25);">
            Pantau Status Pengajuan di Dashboard &rarr;
          </a>
        </div>

        <p style="margin: 24px 0 0 0; font-size: 13px; line-height: 1.6; color: #64748b;">
          Mohon pastikan narahubung selalu memantau perkembangan status secara berkala melalui dashboard. Jika terdapat permintaan kelengkapan tambahan, notifikasi resmi akan dikirimkan ke akun Anda.
        </p>

        <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #334155;">
          <em>Wassalamu’alaikum Warahmatullahi Wabarakatuh,</em><br/>
          <strong>Sekretariat Dewan Syariah Nasional – MUI</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f8fafc; padding: 24px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 600; color: #475569;">
          Dewan Syariah Nasional – Majelis Ulama Indonesia
        </p>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; line-height: 1.5;">
          Gedung MUI Pusat, Jl. Proklamasi No. 51, Menteng, Jakarta Pusat 10320<br/>
          Telp/WA Hotline: +62 822-6000-4146 | Email: sekretariat@dsnmui.or.id
        </p>
        <p style="margin: 10px 0 0 0; font-size: 10px; color: #94a3b8;">
          Email ini dikirimkan secara otomatis oleh Sistem Amanah DSN-MUI. Mohon simpan email ini sebagai bukti tanda terima pengajuan resmi.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    const textContent = `
DEWAN SYARIAH NASIONAL - MUI
Portal Pengajuan Kesesuaian Syariah (AMANAH)
--------------------------------------------
Konfirmasi Pengajuan ${serviceName}: ${submissionNumber}

Assalamu’alaikum Warahmatullahi Wabarakatuh,

Yth. ${recipientName},
Perwakilan Resmi ${companyName},

Terima kasih atas pengajuan permohonan rekomendasi Dewan Pengawas Syariah melalui Portal Amanah DSN-MUI.
Berkas permohonan Anda telah berhasil terdaftar ke dalam antrean surat masuk resmi DSN-MUI.

RINCIAN PENGAJUAN:
- Nomor Registrasi / Tiket: ${submissionNumber}
- Layanan: ${serviceName}
- Judul Permohonan: ${submissionTitle}
- Instansi Pemohon: ${companyName}
- Status Saat Ini: Proses Pengajuan

DAFTAR CALON DPS DIUSULKAN:
${candidatesText}

ALUR TAHAPAN PROSES:
1. Proses Pengajuan (Sedang Berjalan)
2. Validasi Dokumen
3. Wawancara
4. Proses Internal
5. Lulus / Tidak Lulus

Pantau status pengajuan Anda melalui tautan berikut:
${trackingUrl}

Wassalamu’alaikum Warahmatullahi Wabarakatuh,
Sekretariat DSN-MUI
Gedung MUI Pusat, Jl. Proklamasi No. 51, Jakarta Pusat 10320
Email: sekretariat@dsnmui.or.id | WA: +62 822-6000-4146
`;

    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const info = await transporter.sendMail({
          from: getFromAddress(),
          to: toEmail,
          subject: subjectTitle,
          text: textContent,
          html: htmlContent,
        });

        console.log(`[Mailer] Submission confirmation email sent to ${toEmail} for ticket ${submissionNumber} (Attempt ${attempt}). MessageId: ${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (err: any) {
        lastError = err;
        console.error(`[Mailer] Submission email send attempt ${attempt}/2 failed to ${toEmail}:`, err.message);
        transporterInstance = null;
        currentConfigKey = '';
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Gagal mengirim email konfirmasi pengajuan.',
    };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send submission email to ${toEmail}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 4. SEND DOCUMENT INVITATION EMAIL (Surat Keluar / Agenda Rapat)
 * Sends individualized email to each attendee with dynamic body and PDF attachment.
 */
export interface SendDocumentInvitationEmailParams {
  toEmail: string;
  recipientName: string;
  invitationTitle: string;
  documentTitle: string;
  documentNumber?: string | undefined;
  pdfBuffer: Buffer;
  pdfFileName: string;
  meetingDetails?: {
    dateTime?: string | Date | undefined;
    location?: string | undefined;
  } | undefined;
}

export async function sendDocumentInvitationEmail({
  toEmail,
  recipientName,
  invitationTitle,
  documentTitle,
  documentNumber,
  pdfBuffer,
  pdfFileName,
  meetingDetails,
}: SendDocumentInvitationEmailParams): Promise<SendEmailResult> {
  try {
    const transporter = await getTransporter();
    const docDisplayTitle = documentTitle || invitationTitle || 'Surat Keluar';
    const effectiveTitle = invitationTitle || documentTitle || 'Undangan';
    const subjectTitle = `Penyampaian ${effectiveTitle}${documentNumber ? ` (${documentNumber})` : ''}`;

    let meetingInfoText = '';
    let meetingInfoHtml = '';

    if (meetingDetails?.dateTime || meetingDetails?.location) {
      const formattedDate = meetingDetails.dateTime
        ? new Date(meetingDetails.dateTime).toLocaleString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }) + ' WIB'
        : '';

      meetingInfoText = `
Informasi Pelaksanaan Agenda:
${formattedDate ? `• Waktu: ${formattedDate}\n` : ''}${meetingDetails.location ? `• Tempat: ${meetingDetails.location}\n` : ''}`;

      meetingInfoHtml = `
      <div style="margin: 20px 0; padding: 14px 18px; background-color: #F0FDF4; border: 1px solid #BBF7D0; border-left: 4px solid #006633; border-radius: 8px;">
        <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; color: #006633;">🗓 Informasi Agenda / Pelaksanaan:</p>
        ${formattedDate ? `<p style="margin: 3px 0; font-size: 13px; color: #1e293b;"><strong>Waktu:</strong> ${formattedDate}</p>` : ''}
        ${meetingDetails.location ? `<p style="margin: 3px 0; font-size: 13px; color: #1e293b;"><strong>Tempat / Media:</strong> ${meetingDetails.location}</p>` : ''}
      </div>
      `;
    }

    const textContent = `
Penyampaian ${effectiveTitle}

Kepada Yth.
${recipientName}

di TEMPAT

Assalamu'alaykum Wr. Wb.,

Bersama ini Sekretariat Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengirimkan softcopy (dalam format .pdf) ${docDisplayTitle}, sebagaimana terlampir.
Silakan diterima dengan baik.
${meetingInfoText}
Demikian kami sampaikan.
Wassalamu'alaykum Wr. Wb.

Ttd,
Sekretariat DSN-MUI
Dewan Syariah Nasional - Majelis Ulama Indonesia
Jl. Dempo No.19, Pegangsaan, Kec. Menteng, Kota Jakarta Pusat, DKI Jakarta 10320
`;

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <title>${subjectTitle}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center" style="padding: 12px;">
        <table width="620" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; width: 100%; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          <!-- Top Header Ribbon -->
          <tr>
            <td style="background-color: #006633; padding: 20px 28px; border-bottom: 3px solid #D4AF37;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <h2 style="margin: 0; color: #ffffff; font-size: 17px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase;">
                      Dewan Syariah Nasional
                    </h2>
                    <p style="margin: 2px 0 0 0; color: #e2e8f0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">
                      Majelis Ulama Indonesia
                    </p>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 4px 10px; background-color: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); border-radius: 20px; font-size: 10px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px;">
                      SURAT RESMI
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px 28px;">
              <div style="font-size: 15px; font-weight: 800; color: #006633; margin-bottom: 20px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
                Penyampaian ${effectiveTitle}
              </div>

              <div style="margin-bottom: 20px; font-size: 14px; color: #334155;">
                <p style="margin: 0; font-weight: 600;">Kepada Yth.</p>
                <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #0f172a;">${recipientName}</p>
                <p style="margin: 4px 0 0 0; font-style: italic; color: #64748b;">di TEMPAT</p>
              </div>

              <p style="margin: 16px 0; font-size: 14px; color: #334155;">
                <em>Assalamu'alaykum Wr. Wb.,</em>
              </p>

              <p style="margin: 16px 0; font-size: 14px; color: #334155; line-height: 1.7;">
                Bersama ini Sekretariat Dewan Syariah Nasional-Majelis Ulama Indonesia (DSN-MUI) mengirimkan <em>softcopy</em> (dalam format .pdf) <strong>${docDisplayTitle}</strong>, sebagaimana terlampir.
              </p>
              <p style="margin: 16px 0; font-size: 14px; color: #334155;">
                Silakan diterima dengan baik.
              </p>

              ${meetingInfoHtml}

              <!-- Attachment Callout -->
              <div style="margin: 24px 0; padding: 14px 18px; background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; display: flex; align-items: center;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td width="36" valign="middle" style="font-size: 24px;">📄</td>
                    <td valign="middle">
                      <div style="font-size: 13px; font-weight: bold; color: #0f172a;">Lampiran Berkas PDF Resmi:</div>
                      <div style="font-size: 12px; color: #006633; font-weight: 600;">${pdfFileName}</div>
                    </td>
                    <td align="right" valign="middle">
                      <span style="font-size: 11px; background-color: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-weight: 700;">PDF ATTACHED</span>
                    </td>
                  </tr>
                </table>
              </div>

              <p style="margin: 20px 0 6px 0; font-size: 14px; color: #334155;">
                Demikian kami sampaikan.
              </p>
              <p style="margin: 0; font-size: 14px; color: #334155;">
                <em>Wassalamu'alaykum Wr. Wb.</em>
              </p>

              <!-- Signature Area -->
              <div style="margin-top: 32px; padding-top: 18px; border-top: 1px solid #f1f5f9;">
                <p style="margin: 0; font-size: 13px; font-weight: 600; color: #64748b;">Ttd,</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #006633;">Sekretariat DSN-MUI</p>
                <p style="margin: 2px 0 0 0; font-size: 12px; color: #64748b;">Dewan Syariah Nasional – Majelis Ulama Indonesia</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f1f5f9; padding: 16px 28px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 11px; color: #64748b; line-height: 1.5;">
                Jl. Dempo No.19, Pegangsaan, Kec. Menteng, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10320<br/>
                Email: sekretariat@dsnmui.or.id | Amanah DSN-MUI Digital e-Office
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    let lastError: any = null;

    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const info = await transporter.sendMail({
          from: getFromAddress(),
          to: toEmail,
          subject: subjectTitle,
          text: textContent,
          html: htmlContent,
          attachments: [
            {
              filename: pdfFileName,
              content: pdfBuffer,
              contentType: 'application/pdf',
            },
          ],
        });

        console.log(`[Mailer] Document invitation email sent to ${toEmail} for "${effectiveTitle}" (Attempt ${attempt}). MessageId: ${info.messageId}`);
        return {
          success: true,
          messageId: info.messageId,
        };
      } catch (err: any) {
        lastError = err;
        console.error(`[Mailer] Invitation email send attempt ${attempt}/2 failed to ${toEmail}:`, err.message);
        transporterInstance = null;
        currentConfigKey = '';
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || 'Gagal mengirim email undangan dokumen.',
    };
  } catch (error: any) {
    console.error(`[Mailer] Failed to send document invitation email to ${toEmail}:`, error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}


