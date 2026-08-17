import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validators/user.validator';
import * as ctrl from '../controllers/user.controller';

const router = Router();

// Entire module is Administrator-only.
router.use(authenticate);
router.use(authorize('Administrator'));

router.get('/', asyncHandler(ctrl.listUsers));
router.post('/', validate(createUserSchema), asyncHandler(ctrl.createUser));
router.put('/:id', validate(updateUserSchema), asyncHandler(ctrl.updateUser));
router.delete('/:id', asyncHandler(ctrl.deleteUser));

export default router;
