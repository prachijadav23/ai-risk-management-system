import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import * as ctrl from '../controllers/analytics.controller';

const router = Router();
router.use(authenticate);

// Global/portfolio analytics are a management feature — Employees are excluded.
router.use(authorize('Administrator', 'ProjectManager', 'TeamLead'));

router.get('/dashboard', asyncHandler(ctrl.dashboard));
router.get('/departments', asyncHandler(ctrl.departmentComparison));
router.get('/task-completion', asyncHandler(ctrl.taskCompletion));
router.get('/employee-workload', asyncHandler(ctrl.employeeWorkload));
router.get('/monthly-trend', asyncHandler(ctrl.monthlyTrend));

export default router;
