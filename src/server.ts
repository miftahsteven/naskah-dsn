import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRouter from './modules/auth/auth.router.js';
import usersRouter from './modules/users/users.router.js';
import rolesRouter from './modules/roles/roles.router.js';
import documentsRouter from './modules/documents/documents.router.js';
import workflowRouter from './modules/workflow/workflow.router.js';
import auditRouter from './modules/audit/audit.router.js';
import notificationsRouter from './modules/notifications/notifications.router.js';
import dashboardRouter from './modules/dashboard/dashboard.router.js';

dotenv.config();

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

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── RATE LIMITING ─────────────────────────────────────────────────────────────

// Strict limiter for auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak percobaan. Silakan coba lagi dalam 15 menit.' },
});

// General API limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { status: 'error', message: 'Terlalu banyak request. Silakan coba lagi nanti.' },
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── STATIC FILES ──────────────────────────────────────────────────────────────
// Protected uploads — require auth token checked via middleware in docs router
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
