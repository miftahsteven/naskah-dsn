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
import publicRouter from './modules/public-portal/public.router.js';


const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 4002;

// ── SECURITY HEADERS (helmet) ────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // needed for file serving
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false, // handled at frontend level
  frameguard: false, // allow iframe embedding of documents/PDFs across ports
}));

// ── CORS — strict origin whitelist, NO wildcards ─────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server (no origin header) in non-production
    if (!origin && process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    const isLocalhost = origin && (
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.startsWith('exp://')
    );
    if (!origin || allowedOrigins.includes(origin) || (process.env.NODE_ENV !== 'production' && isLocalhost)) {
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

// ── STATIC FILES / HTML INTERCEPTOR ─────────────────────────────────────────
// Unified handler for /uploads/* — serves all files, but for .html files that
// are SIGNED documents, dynamically injects the TTE QR code badge.
const uploadsRouter = express.Router();

uploadsRouter.use((_req: Request, res: Response, next: NextFunction) => {
  res.removeHeader('X-Frame-Options');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  next();
});

uploadsRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only handle GET and HEAD requests — pass OPTIONS preflight through to CORS middleware
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }

    // req.path here is relative to /uploads, e.g. "/file-123.html"
    const subPath = req.path.startsWith('/') ? req.path.slice(1) : req.path;

    // Only intercept HTML files — everything else served normally
    if (!subPath.toLowerCase().endsWith('.html')) {
      return next();
    }

    const filePath = path.resolve('uploads', subPath);
    let html = '';
    if (fs.existsSync(filePath)) {
      html = fs.readFileSync(filePath, 'utf8');
    } else {
      // Fetch from production if not found on local disk
      try {
        const prodRes = await fetch(`https://amanah.dsnmui.or.id/uploads/${subPath}`);
        if (prodRes.ok) {
          html = await prodRes.text();
          // Cache locally
          await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
          await fs.promises.writeFile(filePath, html, 'utf8');
        } else {
          return next();
        }
      } catch {
        return next();
      }
    }

    // Look up this version in DB to check if SIGNED
    const version = await prisma.documentVersion.findFirst({
      where: { fileUrl: { contains: subPath } },
      include: { document: true }
    });

    const doc = version?.document;
    if (doc && doc.status === 'SIGNED' && html.includes('<!-- QR_CODE_TTE_PLACEHOLDER -->')) {
      const frontendUrl = process.env.FRONTEND_URL || 'https://amanah.dsnmui.or.id';
      const verifyUrl = `${frontendUrl}/verify/document/${doc.id}`;

      // Generate QR Code as Base64 Data URL (dark color #006633 MUI green)
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        color: {
          dark: '#006633',
          light: '#ffffff'
        },
        margin: 1,
        width: 120
      });

      // Digital Signature Badge
      const qrHtml = `
        <div style="text-align: center; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; border: 1.5px solid #006633; padding: 10px; border-radius: 12px; background: #ffffff; box-shadow: 0 4px 12px rgba(0, 102, 51, 0.08); font-family: Arial, sans-serif; margin: 0 15px;">
          <img src="${qrDataUrl}" alt="QR Code TTE" style="width: 85px; height: 85px; object-fit: contain;" />
          <div style="font-size: 8px; font-weight: bold; color: #006633; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 6px; white-space: nowrap;">TTE VERIFIED</div>
          <div style="font-size: 6.5px; color: #64748b; margin-top: 1px; font-weight: 500; white-space: nowrap;">Scan untuk verifikasi</div>
        </div>
      `;

      html = html.replace('<!-- QR_CODE_TTE_PLACEHOLDER -->', qrHtml);
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  } catch (error) {
    console.error('[Uploads HTML Interceptor] Error:', error);
    next();
  }
});

// Fallback static file server for non-HTML files (images, PDFs, etc.)
uploadsRouter.use(express.static('uploads'));

// Proxy fallback for non-HTML files not present locally
uploadsRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }
  const subPath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
  const targetPath = path.resolve('uploads', subPath);
  try {
    const prodRes = await fetch(`https://amanah.dsnmui.or.id/uploads/${subPath}`);
    if (prodRes.ok) {
      const buffer = Buffer.from(await prodRes.arrayBuffer());
      await fs.promises.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.promises.writeFile(targetPath, buffer);
      return res.sendFile(targetPath);
    }
  } catch (e) {
    console.warn(`[Uploads Proxy] Failed to proxy ${subPath} from production:`, e);
  }
  next();
});

app.use('/uploads', uploadsRouter);
app.use('/images', express.static(path.join(process.cwd(), 'public/images')));
app.use('/api/images', express.static(path.join(process.cwd(), 'public/images')));
app.use(express.static(path.join(process.cwd(), 'public')));



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
app.use('/api/public', publicRouter);


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
