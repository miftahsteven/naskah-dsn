import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { getKopSuratBase64, getBismillahBase64, getLogoDsnBase64, getWqaUkasBase64 } from '../documents/documents.router.js';
import { DEFAULT_TEMPLATES, HEADER_HTML, FOOTER_HTML } from './default-templates.js';

const router = Router();

// ── SEED DEFAULT TEMPLATES ────────────────────────────────────────────────────
router.post('/seed', authenticate, async (_req: AuthRequest, res: Response) => {
  try {
    for (const tpl of DEFAULT_TEMPLATES) {
      await prisma.letterTemplate.upsert({
        where: { code: tpl.code },
        update: {
          name: tpl.name,
          category: tpl.category,
          description: tpl.description,
          htmlContent: tpl.htmlContent,
          variables: tpl.variables,
          isArchived: false,
        },
        create: {
          name: tpl.name,
          code: tpl.code,
          category: tpl.category,
          description: tpl.description,
          htmlContent: tpl.htmlContent,
          variables: tpl.variables,
          isArchived: false,
        },
      });
    }
    return res.json({ message: 'Default templates seeded successfully', count: DEFAULT_TEMPLATES.length });
  } catch (error) {
    console.error('Error seeding templates:', error);
    return res.status(500).json({ error: 'Failed to seed default templates' });
  }
});

function sanitizeTemplateHtml(html: string): string {
  if (!html) return html;
  const kopBase64 = getKopSuratBase64();
  const bismillahBase64 = getBismillahBase64();
  const logoBase64 = getLogoDsnBase64();
  const wqaBase64 = getWqaUkasBase64();

  let out = html;
  const kopPlaceholderRegex = /(\\?\${HEADER_HTML}|\${HEADER_HTML})/g;
  if (kopPlaceholderRegex.test(out)) {
    const headerReplacement = `<div style="text-align: center; margin-bottom: 4px; margin-left: 0; margin-right: 0; padding-top: 0;">
    <img src="${kopBase64}" alt="Kop Surat DSN-MUI" class="kop-surat-img" style="width: 100%; max-width: 100%; height: auto; display: block; margin: 0 auto;" />
  </div>

  <!-- Bismillah Calligraphy -->
  <div style="text-align: center; margin-top: 8px; margin-bottom: 14px;">
    <img src="${bismillahBase64}" alt="Bismillah" style="width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;" />
  </div>`;
    out = out.replace(kopPlaceholderRegex, headerReplacement);
  }
  const footerPlaceholderRegex = /(\\?\${FOOTER_HTML}|\${FOOTER_HTML})/g;
  if (footerPlaceholderRegex.test(out)) {
    out = out.replace(footerPlaceholderRegex, FOOTER_HTML);
  }
  out = out.replace(/src=["'][^"']*kop-surat\.png["']/gi, `src="${kopBase64}" class="kop-surat-img"`);
  out = out.replace(/src=["'][^"']*bismillah\.svg["']/gi, `src="${bismillahBase64}"`);
  out = out.replace(/src=["']data:image\/svg\+xml;base64,[^"']*["']/gi, `src="${bismillahBase64}"`);
  out = out.replace(/src=["'][^"']*logo-dsn\.png["']/gi, `src="${logoBase64}"`);
  out = out.replace(/src=["'][^"']*wqa-ukas\.png["']/gi, `src="${wqaBase64}"`);
  out = out.replace(/(<img[^>]*(?:bismillah|Bismillah)[^>]*style=["'])([^"']*)(["'])/gi, (match, p1, p2, p3) => {
    let cleanStyle = p2.replace(/height:\s*[^;]+;?/gi, '').replace(/max-height:\s*[^;]+;?/gi, '').replace(/width:\s*[^;]+;?/gi, '').replace(/max-width:\s*[^;]+;?/gi, '').trim();
    return `${p1}${cleanStyle ? cleanStyle + '; ' : ''}width: 260px; max-width: 45%; height: auto; max-height: 48px; object-fit: contain; filter: brightness(0); display: block; margin: 8px auto 14px auto;${p3}`;
  });
  out = out.replace(/font-size:\s*11pt/gi, 'font-size: 10.5pt');
  return out;
}

// ── GET ALL TEMPLATES ──────────────────────────────────────────────────────────
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { search, category, includeArchived } = req.query;

    const templates = await prisma.letterTemplate.findMany({
      where: {
        ...(includeArchived === 'true' ? {} : { isArchived: false }),
        ...(category && { category: String(category) }),
        ...(search && {
          OR: [
            { name: { contains: String(search), mode: 'insensitive' } },
            { description: { contains: String(search), mode: 'insensitive' } },
            { code: { contains: String(search), mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { updatedAt: 'desc' },
    });

    const sanitized = templates.map(t => ({
      ...t,
      htmlContent: sanitizeTemplateHtml(t.htmlContent)
    }));

    res.json({ status: 'success', data: sanitized });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET SINGLE TEMPLATE ────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.letterTemplate.findUnique({ where: { id: String(req.params.id) } });
    if (!template) return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan' });
    res.json({
      status: 'success',
      data: {
        ...template,
        htmlContent: sanitizeTemplateHtml(template.htmlContent)
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE TEMPLATE ────────────────────────────────────────────────────────────
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, category, description, htmlContent, variables } = req.body;

    if (!name || !category || !htmlContent) {
      return res.status(400).json({ status: 'error', message: 'name, category, dan htmlContent wajib diisi' });
    }

    const template = await prisma.letterTemplate.create({
      data: {
        name,
        code: code || null,
        category,
        description: description || null,
        htmlContent,
        variables: variables || [],
        createdBy: req.user?.fullName || null,
      },
    });

    res.status(201).json({ status: 'success', data: template });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ status: 'error', message: 'Kode template sudah digunakan' });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE TEMPLATE ────────────────────────────────────────────────────────────
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, category, description, htmlContent, variables } = req.body;

    const template = await prisma.letterTemplate.update({
      where: { id: String(req.params.id) },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code: code || null }),
        ...(category !== undefined && { category }),
        ...(description !== undefined && { description }),
        ...(htmlContent !== undefined && { htmlContent }),
        ...(variables !== undefined && { variables }),
      },
    });

    res.json({ status: 'success', data: template });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ status: 'error', message: 'Template tidak ditemukan' });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── ARCHIVE TEMPLATE ───────────────────────────────────────────────────────────
router.patch('/:id/archive', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.letterTemplate.update({
      where: { id: String(req.params.id) },
      data: { isArchived: true },
    });
    res.json({ status: 'success', data: template, message: 'Template diarsipkan.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── RESTORE TEMPLATE ───────────────────────────────────────────────────────────
router.patch('/:id/restore', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.letterTemplate.update({
      where: { id: String(req.params.id) },
      data: { isArchived: false },
    });
    res.json({ status: 'success', data: template, message: 'Template dipulihkan.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
