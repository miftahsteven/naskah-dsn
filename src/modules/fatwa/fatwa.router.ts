import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';

const router = Router();

// ── GET FATWA STATS (Must be before /:id) ──
router.get('/stats', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const total = await prisma.fatwa.count();
    const published = await prisma.fatwa.count({ where: { status: 'PUBLIKASI' } });
    const inProgress = await prisma.fatwa.count({ where: { status: { not: 'PUBLIKASI' } } });
    const totalResmi = await prisma.fatwa.count({ where: { nomorFatwa: { not: null } } });
    const recent = await prisma.fatwa.findMany({
      where: { nomorFatwa: { not: null } },
      orderBy: [
        { noUrut: 'desc' },
        { tahun: 'desc' },
        { tanggal: 'desc' }
      ],
      take: 6,
    });

    const fatwasWithPleno = await prisma.fatwa.findMany({
      where: { pleno: { not: null } },
      select: { pleno: true },
      distinct: ['pleno'],
    });

    const fatwasWithYear = await prisma.fatwa.findMany({
      where: { tahun: { not: null } },
      select: { tahun: true },
      distinct: ['tahun'],
      orderBy: { tahun: 'asc' },
    });

    res.json({
      status: 'success',
      data: {
        total,
        totalResmi,
        published,
        inProgress,
        totalPleno: fatwasWithPleno.length || 60,
        years: fatwasWithYear.map((y) => y.tahun).filter(Boolean),
        recent,
      },
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET ALL FATWAS (with search, filter, sorting) ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status, tahun, pleno, search, limit, page, sort } = req.query;
    const filter: any = {};

    if (status && String(status).toUpperCase() !== 'ALL') {
      filter.status = String(status).toUpperCase();
    }

    if (tahun && tahun !== 'ALL') {
      filter.tahun = parseInt(String(tahun), 10);
    }

    if (pleno && pleno !== 'ALL') {
      filter.pleno = parseInt(String(pleno), 10);
    }

    if (search) {
      const q = String(search).trim();
      filter.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { agendaNumber: { contains: q, mode: 'insensitive' } },
        { applicant: { contains: q, mode: 'insensitive' } },
        { keterangan: { contains: q, mode: 'insensitive' } },
        { nomorFatwa: { contains: q, mode: 'insensitive' } },
        { penandatangan1: { contains: q, mode: 'insensitive' } },
        { penandatangan2: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderDirection: 'asc' | 'desc' = sort === 'asc' ? 'asc' : 'desc';
    const orderByList: any[] = [
      { noUrut: { sort: orderDirection, nulls: 'last' } },
      { tahun: { sort: orderDirection, nulls: 'last' } },
      { tanggal: orderDirection },
    ];

    const findManyArgs: any = {
      where: filter,
      orderBy: orderByList,
    };

    if (limit) {
      const takeNum = parseInt(String(limit), 10);
      findManyArgs.take = takeNum;
      if (page) {
        findManyArgs.skip = (parseInt(String(page), 10) - 1) * takeNum;
      }
    }

    const [list, total] = await Promise.all([
      prisma.fatwa.findMany(findManyArgs),
      prisma.fatwa.count({ where: filter }),
    ]);

    res.json({
      status: 'success',
      data: list,
      total,
      page: page ? parseInt(String(page), 10) : 1,
      limit: findManyArgs.take ?? total,
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET FATWA BY ID ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const fatwa = await prisma.fatwa.findUnique({
      where: { id: String(id) },
    });
    if (!fatwa) {
      return res.status(404).json({ status: 'error', message: 'Data fatwa tidak ditemukan' });
    }
    res.json({ status: 'success', data: fatwa });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE FATWA ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      agendaNumber,
      status,
      applicant,
      tanggal,
      keterangan,
      nomorFatwa,
      pleno,
      tahun,
      penandatangan1,
      penandatangan2,
      noUrut,
    } = req.body;

    const finalAgenda = agendaNumber || nomorFatwa;
    const finalApplicant = applicant || [penandatangan1, penandatangan2].filter(Boolean).join(' & ') || 'Dewan Syariah Nasional MUI';
    const finalStatus = (status || 'PUBLIKASI').toUpperCase();

    if (!title || !finalAgenda) {
      return res.status(400).json({
        status: 'error',
        message: 'Field title dan nomorFatwa / agendaNumber wajib diisi.',
      });
    }

    // Check if agenda number is already taken
    const existing = await prisma.fatwa.findUnique({
      where: { agendaNumber: finalAgenda },
    });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: `Nomor Agenda / Fatwa "${finalAgenda}" sudah digunakan.`,
      });
    }

    const tglDate = tanggal ? new Date(tanggal) : new Date();
    const resolvedYear = tahun ? parseInt(String(tahun), 10) : tglDate.getFullYear();

    const newFatwa = await prisma.fatwa.create({
      data: {
        title,
        agendaNumber: finalAgenda,
        status: finalStatus,
        applicant: finalApplicant,
        tanggal: tglDate,
        keterangan: keterangan || null,
        nomorFatwa: nomorFatwa || finalAgenda,
        pleno: pleno ? String(pleno) : null,
        tahun: resolvedYear,
        penandatangan1: penandatangan1 || null,
        penandatangan2: penandatangan2 || null,
        noUrut: noUrut ? parseInt(String(noUrut), 10) : null,
      },
    });

    res.status(201).json({ status: 'success', data: newFatwa });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE FATWA (EDIT) ──
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existing = await prisma.fatwa.findUnique({
      where: { id: String(id) },
    });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Data fatwa tidak ditemukan' });
    }

    if (updateData.agendaNumber && updateData.agendaNumber !== existing.agendaNumber) {
      const duplicate = await prisma.fatwa.findUnique({
        where: { agendaNumber: updateData.agendaNumber },
      });
      if (duplicate) {
        return res.status(400).json({
          status: 'error',
          message: `Nomor Agenda / Fatwa "${updateData.agendaNumber}" sudah digunakan.`,
        });
      }
    }

    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase();
    }
    if (updateData.tanggal) {
      updateData.tanggal = new Date(updateData.tanggal);
    }
    if (updateData.pleno !== undefined) {
      updateData.pleno = updateData.pleno ? String(updateData.pleno) : null;
    }
    if (updateData.tahun !== undefined) {
      updateData.tahun = updateData.tahun ? parseInt(String(updateData.tahun), 10) : null;
    }
    if (updateData.noUrut !== undefined) {
      updateData.noUrut = updateData.noUrut ? parseInt(String(updateData.noUrut), 10) : null;
    }

    const updated = await prisma.fatwa.update({
      where: { id: String(id) },
      data: updateData,
    });

    res.json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE FATWA ──
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.fatwa.findUnique({
      where: { id: String(id) },
    });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Data fatwa tidak ditemukan' });
    }

    await prisma.fatwa.delete({
      where: { id: String(id) },
    });

    res.json({ status: 'success', message: 'Data fatwa berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
