import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';

const router = Router();

// ── GET ALL FATWAS ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) {
      filter.status = String(status).toUpperCase();
    }

    const list = await prisma.fatwa.findMany({
      where: filter,
      orderBy: { tanggal: 'desc' },
    });
    res.json({ status: 'success', data: list });
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
    const { title, agendaNumber, status, applicant, tanggal, keterangan } = req.body;

    if (!title || !agendaNumber || !status || !applicant) {
      return res.status(400).json({
        status: 'error',
        message: 'Field title, agendaNumber, status, dan applicant wajib diisi.',
      });
    }

    // Check if agenda number is already taken
    const existing = await prisma.fatwa.findUnique({
      where: { agendaNumber },
    });
    if (existing) {
      return res.status(400).json({
        status: 'error',
        message: `Nomor Agenda ${agendaNumber} sudah digunakan.`,
      });
    }

    const newFatwa = await prisma.fatwa.create({
      data: {
        title,
        agendaNumber,
        status: status.toUpperCase(),
        applicant,
        tanggal: tanggal ? new Date(tanggal) : new Date(),
        keterangan: keterangan || null,
      },
    });

    res.status(201).json({ status: 'success', data: newFatwa });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE FATWA ──
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
          message: `Nomor Agenda ${updateData.agendaNumber} sudah digunakan.`,
        });
      }
    }

    if (updateData.status) {
      updateData.status = updateData.status.toUpperCase();
    }
    if (updateData.tanggal) {
      updateData.tanggal = new Date(updateData.tanggal);
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
