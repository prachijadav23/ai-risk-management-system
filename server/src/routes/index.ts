import { Router } from 'express';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import employeeRoutes from './employee.routes';
import taskRoutes from './task.routes';
import analyticsRoutes from './analytics.routes';
import predictionRoutes from './prediction.routes';
import lookupRoutes from './lookup.routes';
import userRoutes from './user.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, message: 'API healthy' }));

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/employees', employeeRoutes);
router.use('/tasks', taskRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai', predictionRoutes);
router.use('/lookups', lookupRoutes);
router.use('/users', userRoutes);

export default router;
