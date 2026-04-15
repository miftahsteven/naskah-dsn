import { Router, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth';

const router = Router();

// ── GET ALL ROLES ──
router.get('/', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' },
    });
    res.json({ status: 'success', data: roles });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET ALL PERMISSIONS ──
router.get('/permissions', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { code: 'asc' },
    });
    res.json({ status: 'success', data: permissions });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── GET ROLE PERMISSIONS ──
router.get('/:id/permissions', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: id },
      include: { permission: true },
    });
    res.json({ status: 'success', data: rolePermissions });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── UPDATE ROLE PERMISSIONS ──
router.post('/:id/permissions', authenticate, authorize(['SUPER_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { permissionIds } = req.body; // Array of permission IDs

    // Use a transaction to ensure atomic update
    await prisma.$transaction([
      // Delete existing permissions for this role
      prisma.rolePermission.deleteMany({
        where: { roleId: id },
      }),
      // Create new ones
      prisma.rolePermission.createMany({
        data: permissionIds.map((pId: string) => ({
          roleId: id,
          permissionId: pId,
        })),
      }),
    ]);

    res.json({ status: 'success', message: 'Role permissions updated successfully' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

export default router;
