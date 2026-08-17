import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import * as ctrl from '../controllers/task.controller';

const router = Router();
router.use(authenticate);

// Reads: any authenticated user, but results are scoped to accessible projects.
router.get('/', asyncHandler(ctrl.listTasks));
router.get('/board', asyncHandler(ctrl.boardTasks));

// Create / delete: managers and leads only (Employees cannot assign tasks).
router.post('/', authorize('Administrator', 'ProjectManager', 'TeamLead'), asyncHandler(ctrl.createTask));
router.delete('/:id', authorize('Administrator', 'ProjectManager', 'TeamLead'), asyncHandler(ctrl.deleteTask));

// Update / move: all roles, but Employees are restricted in the controller to
// their OWN task and to progress-related fields only.
router.put('/:id', asyncHandler(ctrl.updateTask));
router.patch('/:id/move', asyncHandler(ctrl.moveTask));

export default router;
