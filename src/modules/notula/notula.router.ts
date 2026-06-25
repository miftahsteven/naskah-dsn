import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { PushService } from '../../lib/push.js';
import { sendNotification } from '../notifications/notifications.router.js';
import { triggerQueueUpdate } from '../../lib/firebase.js';

const router = Router();

// ── GET ALL NOTULA (WITH ACCESS CONTROL) ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Sesi tidak valid.' });
    }

    const list = await prisma.notula.findMany({
      orderBy: { dateTime: 'desc' },
    });

    // Filter in-memory based on access logic:
    // 1. Logged-in user is the creator of the notula
    // 2. Logged-in user is listed in attendees array
    // 3. Logged-in user is in sharedWithIds array
    const filtered = list.filter((n: any) => {
      if (n.creatorId === userId) return true;

      const shared = Array.isArray(n.sharedWithIds) ? n.sharedWithIds : [];
      if (shared.includes(userId)) return true;

      const attendees = Array.isArray(n.attendees) ? n.attendees : [];
      return attendees.some((att: any) => att.userId === userId);
    });

    res.json({ status: 'success', data: filtered });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET NOTULA BY ID ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Sesi tidak valid.' });
    }

    const notula = await prisma.notula.findUnique({
      where: { id: String(id) },
    });

    if (!notula) {
      return res.status(404).json({ status: 'error', message: 'Notula tidak ditemukan.' });
    }

    const isCreator = notula.creatorId === userId;
    const shared = Array.isArray(notula.sharedWithIds) ? notula.sharedWithIds : [];
    const isShared = shared.includes(userId);
    const attendees = Array.isArray(notula.attendees) ? notula.attendees : [];
    const isAttendee = attendees.some((att: any) => att.userId === userId);

    if (!isCreator && !isShared && !isAttendee) {
      return res.status(403).json({
        status: 'error',
        message: 'Akses ditolak: Anda tidak menghadiri atau dibagikan notula rapat ini.',
      });
    }

    res.json({ status: 'success', data: notula });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE NOTULA ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.fullName || 'User';
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Sesi tidak valid.' });
    }

    const { meetingId, title, agendaNumber, dateTime, location, content, decisions, notes, attendees } = req.body;

    if (!title || !dateTime || !location || !content) {
      return res.status(400).json({
        status: 'error',
        message: 'Field Judul, Waktu, Lokasi, dan Pembahasan wajib diisi.',
      });
    }

    // Check duplicate if linked to meeting
    if (meetingId) {
      const existing = await prisma.notula.findUnique({
        where: { meetingId },
      });
      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: 'Notula untuk agenda rapat ini sudah pernah dibuat.',
        });
      }
    }

    const newNotula = await prisma.notula.create({
      data: {
        meetingId: meetingId || null,
        title,
        agendaNumber: agendaNumber || null,
        dateTime: new Date(dateTime),
        location,
        content,
        decisions: decisions || null,
        notes: notes || null,
        creatorId: userId,
        creatorName: userName,
        attendees: attendees || [],
        sharedWithIds: [],
      },
    });

    // If linked to meeting, change status to SELESAI
    if (meetingId) {
      await prisma.meeting.update({
        where: { id: meetingId },
        data: { status: 'SELESAI' },
      });
    }

    // Notify attendees that the notula (minutes) has been created
    const notulaAttendees = newNotula.attendees as any[] || [];
    for (const att of notulaAttendees) {
      if (att.userId && att.userId !== userId) {
        triggerQueueUpdate(att.userId).catch(() => {});
        PushService.sendNotification({
          userId: att.userId,
          title: 'Risalah Rapat Tersedia',
          body: `Risalah (notulen) untuk rapat "${newNotula.title}" telah diterbitkan.`,
          data: { meetingId: newNotula.meetingId, notulaId: newNotula.id, type: 'NOTULA_PUBLISHED' }
        }).catch(() => {});
        sendNotification({
          userId: att.userId,
          type: 'NOTULA_PUBLISHED',
          title: 'Risalah Rapat Tersedia',
          message: `Risalah (notulen) untuk rapat "${newNotula.title}" telah diterbitkan.`,
          link: '/agenda'
        }).catch(() => {});
      }
    }

    res.status(201).json({ status: 'success', data: newNotula });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE NOTULA ──
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Sesi tidak valid.' });
    }

    const notula = await prisma.notula.findUnique({
      where: { id: String(id) },
    });

    if (!notula) {
      return res.status(404).json({ status: 'error', message: 'Notula tidak ditemukan.' });
    }

    if (notula.creatorId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Hanya pembuat notula yang dapat memperbarui isi.',
      });
    }

    const updateData = { ...req.body };
    if (updateData.dateTime) {
      updateData.dateTime = new Date(updateData.dateTime);
    }

    const updated = await prisma.notula.update({
      where: { id: String(id) },
      data: updateData,
    });

    res.json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SHARE NOTULA ──
router.post('/:id/share', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { sharedWithIds } = req.body;

    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Sesi tidak valid.' });
    }

    if (!Array.isArray(sharedWithIds)) {
      return res.status(400).json({ status: 'error', message: 'sharedWithIds harus berupa array.' });
    }

    const notula = await prisma.notula.findUnique({
      where: { id: String(id) },
    });

    if (!notula) {
      return res.status(404).json({ status: 'error', message: 'Notula tidak ditemukan.' });
    }

    const isCreator = notula.creatorId === userId;
    const attendees = Array.isArray(notula.attendees) ? notula.attendees : [];
    const isAttendee = attendees.some((att: any) => att.userId === userId);

    if (!isCreator && !isAttendee) {
      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki hak untuk membagikan notula rapat ini.',
      });
    }

    const updated = await prisma.notula.update({
      where: { id: String(id) },
      data: {
        sharedWithIds: sharedWithIds,
      },
    });

    res.json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE NOTULA ──
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ status: 'error', message: 'Sesi tidak valid.' });
    }

    const notula = await prisma.notula.findUnique({
      where: { id: String(id) },
    });

    if (!notula) {
      return res.status(404).json({ status: 'error', message: 'Notula tidak ditemukan.' });
    }

    if (notula.creatorId !== userId) {
      return res.status(403).json({
        status: 'error',
        message: 'Hanya pembuat notula yang dapat menghapus data.',
      });
    }

    await prisma.notula.delete({
      where: { id: String(id) },
    });

    res.json({ status: 'success', message: 'Notula rapat berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
