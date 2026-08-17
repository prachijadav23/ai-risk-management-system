import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { lookups } from '../controllers/lookup.controller';

const router = Router();
router.use(authenticate);
// Form dropdown data (clients/departments/teams/managers) is only needed by
// roles that can create/edit projects and employees.
router.use(authorize('Administrator', 'ProjectManager', 'TeamLead'));
router.get('/', asyncHandler(lookups));

export default router;
