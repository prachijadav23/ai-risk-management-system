import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import * as ctrl from '../controllers/employee.controller';

const router = Router();
router.use(authenticate);

// Directory listing — management + leads (leads are scoped to their team).
// Employees do not get a global employee directory.
router.get('/', authorize('Administrator', 'ProjectManager', 'TeamLead'), asyncHandler(ctrl.listEmployees));

// Single record — any role, but scoped in the controller (Employee = self only).
router.get('/:id', asyncHandler(ctrl.getEmployee));

router.post('/', authorize('Administrator', 'ProjectManager'), asyncHandler(ctrl.createEmployee));
router.put('/:id', authorize('Administrator', 'ProjectManager'), asyncHandler(ctrl.updateEmployee));
router.delete('/:id', authorize('Administrator'), asyncHandler(ctrl.deleteEmployee));

export default router;
