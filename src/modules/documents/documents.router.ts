import { Router } from 'express';
import type { Response, Request } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';

const router = Router();

// ── STORAGE CONFIG ──
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 }, // Default 10MB
});

// ── GET CATEGORIES & CLASSIFICATIONS ──
router.get('/meta', authenticate, async (req: Request, res: Response) => {
  try {
    const [categories, classifications] = await Promise.all([
      prisma.documentCategory.findMany(),
      prisma.documentClassification.findMany(),
    ]);
    res.json({ status: 'success', data: { categories, classifications } });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET DOCUMENTS (With Filter) ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, categoryId, classificationId, search } = req.query;

    const documents = await prisma.document.findMany({
      where: {
        organizationId: req.user!.organizationId,
        ...(status && { status: String(status) }),
        ...(categoryId && { categoryId: String(categoryId) }),
        ...(classificationId && { classificationId: String(classificationId) }),
        ...(search && {
          OR: [
            { title: { contains: String(search), mode: 'insensitive' } },
            { documentNumber: { contains: String(search), mode: 'insensitive' } },
          ],
        }),
      },
      include: {
        category: true,
        classification: true,
        creator: { select: { fullName: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({ status: 'success', data: documents });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPLOAD DOCUMENT ──
router.post('/', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { title, categoryId, classificationId, documentNumber } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ status: 'error', message: 'File is required' });
    }

    if (!title || !categoryId || !classificationId) {
      return res.status(400).json({ status: 'error', message: 'Missing metadata' });
    }

    // Create Document & Version in a transaction
    const document = await prisma.document.create({
      data: {
        title,
        documentNumber,
        organizationId: req.user!.organizationId,
        categoryId,
        classificationId,
        creatorId: req.user!.id,
        status: 'DRAFT',
        versions: {
          create: {
            versionNum: 1,
            fileUrl: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            createdBy: req.user!.id,
          },
        },
      },
      include: {
        versions: true,
      },
    });

    res.status(201).json({ status: 'success', data: document });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET DOCUMENT DETAIL ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        category: true,
        classification: true,
        creator: { select: { fullName: true, email: true } },
        versions: { orderBy: { versionNum: 'desc' } },
        signatures: { include: { user: { select: { fullName: true, jobTitle: true } } } },
        workflowInstances: {
          include: {
            steps: { orderBy: { stepNumber: 'asc' } }
          }
        }
      },
    });

    if (!document) return res.status(404).json({ status: 'error', message: 'Document not found' });

    res.json({ status: 'success', data: document });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
