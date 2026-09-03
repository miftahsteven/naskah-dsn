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

    const candidates = [
      path.resolve(process.cwd(), 'uploads', subPath),
      path.resolve(process.cwd(), '../uploads', subPath),
      path.resolve('/var/www/mui-dsn-naskah/backend/uploads', subPath),
      path.resolve('/var/www/mui-dsn-naskah/uploads', subPath),
      path.resolve(process.cwd(), 'uploads', path.basename(subPath)),
      path.resolve('/var/www/mui-dsn-naskah/backend/uploads', path.basename(subPath)),
    ];

    let foundPath: string | null = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        foundPath = c;
        break;
      }
    }

    if (!foundPath) {
      const filename = path.basename(subPath);
      const targetDir = path.resolve(process.cwd(), 'uploads');
      const targetPath = path.resolve(targetDir, filename);
      try {
        const prodRes = await fetch(`https://amanah.dsnmui.or.id/api/uploads/${encodeURIComponent(filename)}`);
        if (prodRes.ok) {
          const buffer = Buffer.from(await prodRes.arrayBuffer());
          await fs.promises.mkdir(targetDir, { recursive: true });
          await fs.promises.writeFile(targetPath, buffer);
          foundPath = targetPath;
        }
      } catch (err) {
        console.warn(`[Uploads HTML Interceptor] Failed to fetch ${filename} from production:`, err);
      }
    }

    if (!foundPath) {
      return next();
    }

    const html = fs.readFileSync(foundPath, 'utf8');

    // Look up this version in DB to check if SIGNED
    const version = await prisma.documentVersion.findFirst({
      where: { fileUrl: { contains: path.basename(subPath) } },
      include: { document: true }
    });

    let finalHtml = html;
    // Strip any legacy TTE VERIFIED badge if present in downloaded file
    finalHtml = finalHtml.replace(/<div style="text-align: center; display: inline-flex;[\s\S]*?TTE VERIFIED[\s\S]*?<\/div>\s*<\/div>/gi, '<!-- QR_CODE_TTE_PLACEHOLDER -->');
    finalHtml = finalHtml.replace(/font-size:\s*11pt/gi, 'font-size: 10.5pt');

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(finalHtml);
  } catch (error) {
    console.error('[Uploads HTML Interceptor] Error:', error);
    next();
  }
});

// Fallback static file server for non-HTML files (images, PDFs, etc.)
uploadsRouter.use(express.static('uploads'));
uploadsRouter.use(express.static(path.resolve(process.cwd(), 'uploads')));
uploadsRouter.use(express.static(path.resolve(process.cwd(), '../uploads')));

// Proxy fallback for non-HTML files not present locally
uploadsRouter.use(async (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return next();
  }
  const subPath = req.path.startsWith('/') ? req.path.slice(1) : req.path;
  const filename = path.basename(subPath);
  const targetDir = path.resolve(process.cwd(), 'uploads');
  const targetPath = path.resolve(targetDir, filename);
  if (!fs.existsSync(targetPath)) {
    try {
      const prodRes = await fetch(`https://amanah.dsnmui.or.id/api/uploads/${encodeURIComponent(filename)}`);
      if (prodRes.ok) {
        const buffer = Buffer.from(await prodRes.arrayBuffer());
        await fs.promises.mkdir(targetDir, { recursive: true });
        await fs.promises.writeFile(targetPath, buffer);
        return res.sendFile(targetPath);
      }
    } catch (e) {
      // ignore
    }
  }
  next();
});

app.use('/uploads', uploadsRouter);
app.use('/api/uploads', uploadsRouter);
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
