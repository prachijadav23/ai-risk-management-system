import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import * as ctrl from '../controllers/prediction.controller';

const router = Router();
router.use(authenticate);

// Portfolio command center — management + leads only, scoped to their projects.
router.get(
  '/command-center',
  authorize('Administrator', 'ProjectManager', 'TeamLead'),
  asyncHandler(ctrl.commandCenter)
);

// Run a prediction — privileged AI, Employees excluded.
router.post(
  '/projects/:id/predict',
  authorize('Administrator', 'ProjectManager', 'TeamLead'),
  asyncHandler(ctrl.predictProject)
);

// View latest stored prediction — any role, but scoped to accessible projects
// (an Employee may see the risk of a project they're assigned to).
router.get('/projects/:id/latest', asyncHandler(ctrl.latestPrediction));

// Resource allocation — a manager feature (Admin + PM).
router.post(
  '/projects/:id/allocate',
  authorize('Administrator', 'ProjectManager'),
  asyncHandler(ctrl.recommendAllocation)
);

// What-if simulator — management + leads.
router.post(
  '/projects/:id/simulate',
  authorize('Administrator', 'ProjectManager', 'TeamLead'),
  asyncHandler(ctrl.simulate)
);

// Recommendations — management + leads (scoped); Employees excluded.
router.get(
  '/recommendations',
  authorize('Administrator', 'ProjectManager', 'TeamLead'),
  asyncHandler(ctrl.listRecommendations)
);
router.patch(
  '/recommendations/:id',
  authorize('Administrator', 'ProjectManager'),
  asyncHandler(ctrl.resolveRecommendation)
);

export default router;
