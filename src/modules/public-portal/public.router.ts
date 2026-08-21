import { Router } from 'express';
import authPublicRouter from './auth.public.router.js';
import submissionsPublicRouter from './submissions.public.router.js';
import masterPublicRouter from './master.public.router.js';
import certificatesPublicRouter from './certificates.public.router.js';
import companyPublicRouter from './company.public.router.js';
import notificationsPublicRouter from './notifications.public.router.js';

const router = Router();

router.use('/auth', authPublicRouter);
router.use('/submissions', submissionsPublicRouter);
router.use('/master', masterPublicRouter);
router.use('/certificates', certificatesPublicRouter);
router.use('/company', companyPublicRouter);
router.use('/notifications', notificationsPublicRouter);

export default router;
