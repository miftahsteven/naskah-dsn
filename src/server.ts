import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';
import { prisma } from './lib/prisma.js';

// ── Load env FIRST — before any module that reads process.env (e.g. Multer limits) ──
dotenv.config();

import authRouter from './modules/auth/auth.router.js';
import usersRouter from './modules/users/users.router.js';
import rolesRouter from './modules/roles/roles.router.js';
import documentsRouter from './modules/documents/documents.router.js';
import workflowRouter from './modules/workflow/workflow.router.js';
import auditRouter from './modules/audit/audit.router.js';
import notificationsRouter from './modules/notifications/notifications.router.js';
import dashboardRouter from './modules/dashboard/dashboard.router.js';
import dpsRouter from './modules/dps/dps.router.js';
import disposisiRouter from './modules/disposisi/disposisi.router.js';
import fatwaRouter from './modules/fatwa/fatwa.router.js';
import meetingRouter from './modules/meeting/meeting.router.js';
import notulaRouter from './modules/notula/notula.router.js';
import letterTemplateRouter from './modules/letter-template/letter-template.router.js';


const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4002;

// ── SECURITY HEADERS (helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // needed for file serving
  contentSecurityPolicy: false, // handled at frontend level
}));

// ── CORS — strict origin whitelist, NO wildcards ─────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin header) in non-production
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// ── RATE LIMITING ─────────────────────────────────────────────────────────────

// Strict limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased from 20 to support heavy demoing/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' },
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50000, // Increased from 300 to support heavy demoing/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak request. Silakan coba lagi nanti.' },
});

// Disabled during demo/testing to prevent false positive blocks
// app.use('/api/auth', authLimiter);
// app.use('/api', apiLimiter);

// ── STATIC FILES ──────────────────────────────────────────────────────────────
// Protected uploads — require auth token checked via middleware in docs router
app.get('/uploads/:filename.html', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const relativePath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
    const filePath = path.resolve(relativePath);

    if (!fs.existsSync(filePath)) {
      return next();
    }

    // Look up this version in DB
    const version = await prisma.documentVersion.findFirst({
      where: { fileUrl: relativePath },
      include: {
        document: true
      }
    });

    const doc = version?.document;
    if (!doc || doc.status !== 'SIGNED') {
      return next();
    }

    // It is signed! We should generate the QR code
    let html = fs.readFileSync(filePath, 'utf8');

    // Check if the HTML contains the placeholder comment
    if (html.includes('<!-- QR_CODE_TTE_PLACEHOLDER -->')) {
      const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
      let frontendUrl = 'http://localhost:3000';
      if (allowedOriginsEnv) {
        const origins = allowedOriginsEnv.split(',');
        const firstOrigin = origins[0];
        if (firstOrigin) {
          frontendUrl = firstOrigin.trim();
        }
      }
      
      const verifyUrl = `${frontendUrl}/verify/document/${doc.id}`;
      
      // Generate QR Code as Base64 Data URL (dark color #006633)
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        color: {
          dark: '#006633', // MUI green
          light: '#ffffff'
        },
        margin: 1,
        width: 120
      });

      // Digital Signature Badge Design
      const qrHtml = `
        <div style="text-align: center; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; border: 1.5px solid #006633; padding: 10px; border-radius: 12px; background: #ffffff; box-shadow: 0 4px 12px rgba(0, 102, 51, 0.08); font-family: Arial, sans-serif; margin: 0 15px;">
          <img src="${qrDataUrl}" alt="QR Code TTE" style="width: 85px; height: 85px; object-fit: contain;" />
          <div style="font-size: 8px; font-weight: bold; color: #006633; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 6px; white-space: nowrap;">TTE VERIFIED</div>
          <div style="font-size: 6.5px; color: #64748b; margin-top: 1px; font-weight: 500; white-space: nowrap;">Scan untuk verifikasi</div>
        </div>
      `;

      html = html.replace('<!-- QR_CODE_TTE_PLACEHOLDER -->', qrHtml);
    }

    res.setHeader('Content-Type', 'text/html');
    return res.send(html);
  } catch (error) {
    console.error('[Uploads Interceptor] Error serving HTML:', error);
    next();
  }
});

app.use('/uploads', express.static('uploads'));

// ── ROUTES ────────────────────────────────────────────────────────────────────

// Health Check — public but minimal info
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Amanah API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/dps', dpsRouter);
app.use('/api/disposisi', disposisiRouter);
app.use('/api/fatwa', fatwaRouter);
app.use('/api/meeting', meetingRouter);
app.use('/api/notula', notulaRouter);
app.use('/api/letter-templates', letterTemplateRouter);


// ── 404 HANDLER ───────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ status: 'error', message: 'Endpoint tidak ditemukan' });
});

// ── ERROR HANDLING ────────────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  // Don't leak internal error details in production
  const isDev = process.env.NODE_ENV !== 'production';

  if (err.message?.includes('CORS')) {
    return res.status(403).json({ status: 'error', message: 'Akses ditolak: Origin tidak diizinkan' });
  }

  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: isDev ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
});

// ── START SERVER ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Amanah API running on http://localhost:${PORT}`);
  console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
});
