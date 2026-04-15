import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import rolesRouter from './modules/roles/roles.router';
import documentsRouter from './modules/documents/documents.router';
import workflowRouter from './modules/workflow/workflow.router';
import auditRouter from './modules/audit/audit.router';
import notificationsRouter from './modules/notifications/notifications.router';
import dashboardRouter from './modules/dashboard/dashboard.router';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4002;

// ── MIDDLEWARE ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// ── ROUTES ──────────────────────────────────────────────────────────────────

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'MUI Naskah Digital API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Mount Modules
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/workflow', workflowRouter);
app.use('/api/audit', auditRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/dashboard', dashboardRouter);
// app.use('/api/users', usersRouter);
// app.use('/api/documents', documentsRouter);

// ── ERROR HANDLING ──────────────────────────────────────────────────────────

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ── START SERVER ────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV}`);
});
