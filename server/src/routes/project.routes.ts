import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator';
import * as ctrl from '../controllers/project.controller';

const router = Router();
router.use(authenticate);

router.get('/', asyncHandler(ctrl.listProjects));
router.get('/:id', asyncHandler(ctrl.getProject));
router.post(
  '/',
  authorize('Administrator', 'ProjectManager'),
  validate(createProjectSchema),
  asyncHandler(ctrl.createProject)
);
router.put(
  '/:id',
  authorize('Administrator', 'ProjectManager', 'TeamLead'),
  validate(updateProjectSchema),
  asyncHandler(ctrl.updateProject)
);
router.delete('/:id', authorize('Administrator'), asyncHandler(ctrl.deleteProject));
router.post(
  '/:id/milestones',
  authorize('Administrator', 'ProjectManager', 'TeamLead'),
  asyncHandler(ctrl.addMilestone)
);

export default router;
