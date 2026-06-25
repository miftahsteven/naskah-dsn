import { Router } from 'express';
import type { Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import { authenticate } from '../../middleware/auth.js';
import type { AuthRequest } from '../../middleware/auth.js';
import { PushService } from '../../lib/push.js';
import { sendNotification } from '../notifications/notifications.router.js';
import { triggerQueueUpdate } from '../../lib/firebase.js';

function formatDateStr(dateVal: Date | string) {
  try {
    const d = new Date(dateVal);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB';
  } catch (e) {
    return String(dateVal);
  }
}

const router = Router();

// Helper to calculate attendees based on targetType
async function calculateAttendees(
  targetType: string,
  departmentId?: string,
  customAttendeeIds?: string[],
  externalEmails?: string[]
) {
  const attendees: any[] = [];
  let internalUsers: any[] = [];

  const targetTypeUpper = targetType.toUpperCase();
  const filterByUserIds = customAttendeeIds && customAttendeeIds.length > 0;

  if (targetTypeUpper === 'ALL') {
    internalUsers = await prisma.user.findMany({
      where: {
        organizationId: 'org-mui-001',
        ...(filterByUserIds ? { id: { in: customAttendeeIds } } : {})
      },
      include: { department: true, jabatan: true }
    });
  } else if (targetTypeUpper === 'EXECUTIVE') {
    internalUsers = await prisma.user.findMany({
      where: {
        organizationId: 'org-mui-001',
        department: { name: 'Pimpinan Harian' },
        ...(filterByUserIds ? { id: { in: customAttendeeIds } } : {})
      },
      include: { department: true, jabatan: true }
    });
  } else if (targetTypeUpper === 'ALL_BOARD') {
    internalUsers = await prisma.user.findMany({
      where: {
        organizationId: 'org-mui-001',
        department: {
          name: {
            in: [
              'Pimpinan Harian',
              'Bidang Fatwa',
              'Bidang Layanan, Literasi, Relasi Industri & Regulasi',
              'Anggota Pleno'
            ]
          }
        },
        ...(filterByUserIds ? { id: { in: customAttendeeIds } } : {})
      },
      include: { department: true, jabatan: true }
    });
  } else if (targetTypeUpper === 'SECRETARIAT') {
    internalUsers = await prisma.user.findMany({
      where: {
        organizationId: 'org-mui-001',
        department: { name: 'Kesekretariatan' },
        ...(filterByUserIds ? { id: { in: customAttendeeIds } } : {})
      },
      include: { department: true, jabatan: true }
    });
  } else if (targetTypeUpper === 'FINANCE') {
    internalUsers = await prisma.user.findMany({
      where: {
        organizationId: 'org-mui-001',
        department: { name: 'Keuangan' },
        ...(filterByUserIds ? { id: { in: customAttendeeIds } } : {})
      },
      include: { department: true, jabatan: true }
    });
  } else if (targetTypeUpper === 'DEPARTMENT' && departmentId) {
    internalUsers = await prisma.user.findMany({
      where: {
        organizationId: 'org-mui-001',
        departmentId: departmentId,
        ...(filterByUserIds ? { id: { in: customAttendeeIds } } : {})
      },
      include: { department: true, jabatan: true }
    });
  } else if (targetTypeUpper === 'CROSS_INTERNAL' && customAttendeeIds && customAttendeeIds.length > 0) {
    internalUsers = await prisma.user.findMany({
      where: {
        organizationId: 'org-mui-001',
        id: { in: customAttendeeIds }
      },
      include: { department: true, jabatan: true }
    });
  } else if (targetTypeUpper === 'CROSS_AGENCY') {
    if (customAttendeeIds && customAttendeeIds.length > 0) {
      internalUsers = await prisma.user.findMany({
        where: {
          organizationId: 'org-mui-001',
          id: { in: customAttendeeIds }
        },
        include: { department: true, jabatan: true }
      });
    }
  }

  internalUsers.forEach((u) => {
    attendees.push({
      userId: u.id,
      name: u.fullName,
      email: u.email,
      phone: u.phone || '',
      department: u.department?.name || '',
      jabatan: u.jabatan?.name || '',
      isExternal: false,
      status: 'UNDANGAN',
      invitationSent: false
    });
  });

  if (targetTypeUpper === 'CROSS_AGENCY' && externalEmails && externalEmails.length > 0) {
    externalEmails.forEach((email) => {
      attendees.push({
        userId: null,
        name: email.split('@')[0],
        email: email,
        phone: '',
        department: 'Eksternal',
        jabatan: 'Undangan Luar',
        isExternal: true,
        status: 'UNDANGAN',
        invitationSent: false
      });
    });
  }

  return attendees;
}

// ── GET ALL MEETINGS ──
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.meeting.findMany({
      orderBy: { dateTime: 'desc' },
    });
    res.json({ status: 'success', data: list });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET MEETING BY ID ──
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.meeting.findUnique({
      where: { id: String(id) },
    });
    if (!meeting) {
      return res.status(404).json({ status: 'error', message: 'Agenda rapat tidak ditemukan' });
    }
    res.json({ status: 'success', data: meeting });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── CREATE MEETING ──
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { title, agendaNumber, dateTime, endDateTime, location, description, targetType, departmentId, customAttendeeIds, externalEmails } = req.body;

    if (!title || !dateTime || !location || !targetType) {
      return res.status(400).json({
        status: 'error',
        message: 'Field title, dateTime, location, dan targetType wajib diisi.',
      });
    }

    if (agendaNumber) {
      const existing = await prisma.meeting.findUnique({
        where: { agendaNumber },
      });
      if (existing) {
        return res.status(400).json({
          status: 'error',
          message: `Nomor Agenda ${agendaNumber} sudah digunakan.`,
        });
      }
    }

    // Resolve attendees list dynamically from organizational structure
    const resolvedAttendees = await calculateAttendees(
      targetType,
      departmentId,
      customAttendeeIds,
      externalEmails
    );

    const newMeeting = await prisma.meeting.create({
      data: {
        title,
        agendaNumber: agendaNumber || null,
        dateTime: new Date(dateTime),
        endDateTime: endDateTime ? new Date(endDateTime) : null,
        location,
        description: description || null,
        targetType: targetType.toUpperCase(),
        departmentId: departmentId || null,
        status: 'DRAFT',
        attendees: resolvedAttendees
      },
    });

    // Notify attendees if meeting is active/not draft
    if (newMeeting.status === 'AKTIF') {
      const list = newMeeting.attendees as any[] || [];
      for (const att of list) {
        if (att.userId) {
          triggerQueueUpdate(att.userId).catch(() => {});
          PushService.sendNotification({
            userId: att.userId,
            title: 'Undangan Rapat Baru',
            body: `Anda diundang untuk menghadiri rapat "${newMeeting.title}" pada ${formatDateStr(newMeeting.dateTime)}.`,
            data: { meetingId: newMeeting.id, type: 'MEETING_INVITATION' }
          }).catch(() => {});
          sendNotification({
            userId: att.userId,
            type: 'MEETING_INVITATION',
            title: 'Undangan Rapat Baru',
            message: `Anda diundang untuk menghadiri rapat "${newMeeting.title}" pada ${formatDateStr(newMeeting.dateTime)}.`,
            link: '/agenda'
          }).catch(() => {});
        }
      }
    }

    res.status(201).json({ status: 'success', data: newMeeting });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE MEETING ──
router.patch('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existing = await prisma.meeting.findUnique({
      where: { id: String(id) },
    });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Agenda rapat tidak ditemukan' });
    }

    if (updateData.agendaNumber && updateData.agendaNumber !== existing.agendaNumber) {
      const duplicate = await prisma.meeting.findUnique({
        where: { agendaNumber: updateData.agendaNumber },
      });
      if (duplicate) {
        return res.status(400).json({
          status: 'error',
          message: `Nomor Agenda ${updateData.agendaNumber} sudah digunakan.`,
        });
      }
    }

    // Recalculate attendees if targetType, customAttendeeIds, or externalEmails are sent
    if (updateData.targetType || updateData.hasOwnProperty('customAttendeeIds') || updateData.hasOwnProperty('externalEmails')) {
      const targetType = updateData.targetType || existing.targetType;
      const departmentId = updateData.hasOwnProperty('departmentId') ? updateData.departmentId : (existing.departmentId || undefined);
      const customAttendeeIds = updateData.customAttendeeIds;
      const externalEmails = updateData.externalEmails;

      updateData.attendees = await calculateAttendees(
        targetType,
        departmentId,
        customAttendeeIds,
        externalEmails
      );
      updateData.targetType = targetType.toUpperCase();
    }

    if (updateData.dateTime) {
      updateData.dateTime = new Date(updateData.dateTime);
    }

    if (updateData.hasOwnProperty('endDateTime')) {
      updateData.endDateTime = updateData.endDateTime ? new Date(updateData.endDateTime) : null;
    }

    // Remove client-specific array params that aren't DB fields
    delete updateData.customAttendeeIds;
    delete updateData.externalEmails;

    const updated = await prisma.meeting.update({
      where: { id: String(id) },
      data: updateData,
    });

    res.json({ status: 'success', data: updated });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SIMULATED SEND INVITATION EMAIL ──
router.post('/:id/send-invitation', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const meeting = await prisma.meeting.findUnique({
      where: { id: String(id) },
    });
    if (!meeting) {
      return res.status(404).json({ status: 'error', message: 'Agenda rapat tidak ditemukan' });
    }

    const list: any[] = (meeting.attendees as any[]) || [];
    
    // Simulate invitation dispatch
    console.log(`Sending email invitations for meeting "${meeting.title}" to all attendees...`);
    list.forEach((att: any) => {
      console.log(`  -> Sending email to: ${att.name} (${att.email}) [External: ${att.isExternal}]`);
    });

    const updatedList = list.map((att: any) => ({ ...att, invitationSent: true }));

    const updated = await prisma.meeting.update({
      where: { id: String(id) },
      data: { 
        invitationSent: true, 
        status: 'AKTIF',
        attendees: updatedList
      }
    });

    // Notify all attendees with a userId
    for (const att of updatedList) {
      if (att.userId) {
        triggerQueueUpdate(att.userId).catch(() => {});
        PushService.sendNotification({
          userId: att.userId,
          title: 'Undangan Rapat Baru',
          body: `Anda diundang untuk menghadiri rapat "${updated.title}" pada ${formatDateStr(updated.dateTime)}.`,
          data: { meetingId: updated.id, type: 'MEETING_INVITATION' }
        }).catch(() => {});
        sendNotification({
          userId: att.userId,
          type: 'MEETING_INVITATION',
          title: 'Undangan Rapat Baru',
          message: `Anda diundang untuk menghadiri rapat "${updated.title}" pada ${formatDateStr(updated.dateTime)}.`,
          link: '/agenda'
        }).catch(() => {});
      }
    }

    res.json({
      status: 'success',
      message: `Undangan email berhasil dikirim ke ${list.length} peserta.`,
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── SIMULATED SEND SINGLE INVITATION EMAIL ──
router.post('/:id/send-invitation-single', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ status: 'error', message: 'Email penerima wajib diisi.' });
    }

    const meeting = await prisma.meeting.findUnique({
      where: { id: String(id) },
    });
    if (!meeting) {
      return res.status(404).json({ status: 'error', message: 'Agenda rapat tidak ditemukan' });
    }

    const list: any[] = (meeting.attendees as any[]) || [];
    
    // Simulate single invitation dispatch
    console.log(`Sending single email invitation for meeting "${meeting.title}" to: ${email}`);

    let emailFound = false;
    const updatedList = list.map((att: any) => {
      if (att.email === email) {
        emailFound = true;
        return { ...att, invitationSent: true };
      }
      return att;
    });

    if (!emailFound) {
      return res.status(404).json({ status: 'error', message: `Peserta dengan email ${email} tidak terdaftar di rapat ini.` });
    }

    // Set meeting status to active if draft
    const newStatus = meeting.status === 'DRAFT' ? 'AKTIF' : meeting.status;

    const updated = await prisma.meeting.update({
      where: { id: String(id) },
      data: { 
        status: newStatus,
        attendees: updatedList
      }
    });

    // Notify target attendee if they have userId
    const targetAttendee = updatedList.find((att: any) => att.email === email);
    if (targetAttendee && targetAttendee.userId) {
      triggerQueueUpdate(targetAttendee.userId).catch(() => {});
      PushService.sendNotification({
        userId: targetAttendee.userId,
        title: 'Undangan Rapat Baru',
        body: `Anda diundang untuk menghadiri rapat "${updated.title}" pada ${formatDateStr(updated.dateTime)}.`,
        data: { meetingId: updated.id, type: 'MEETING_INVITATION' }
      }).catch(() => {});
      sendNotification({
        userId: targetAttendee.userId,
        type: 'MEETING_INVITATION',
        title: 'Undangan Rapat Baru',
        message: `Anda diundang untuk menghadiri rapat "${updated.title}" pada ${formatDateStr(updated.dateTime)}.`,
        link: '/agenda'
      }).catch(() => {});
    }

    res.json({
      status: 'success',
      message: `Undangan email berhasil dikirim ke ${email}.`,
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── DELETE MEETING ──
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.meeting.findUnique({
      where: { id: String(id) },
    });
    if (!existing) {
      return res.status(404).json({ status: 'error', message: 'Agenda rapat tidak ditemukan' });
    }

    await prisma.meeting.delete({
      where: { id: String(id) },
    });

    res.json({ status: 'success', message: 'Agenda rapat berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
