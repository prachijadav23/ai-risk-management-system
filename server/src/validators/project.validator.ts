import { z } from 'zod';
import { PROJECT_STATUS, PRIORITY } from '../models/Project';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    code: z.string().min(2),
    description: z.string().optional(),
    client: objectId,
    manager: objectId,
    team: objectId.optional(),
    department: objectId,
    technology: z.array(z.string()).optional(),
    category: z.string().optional(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    budget: z.number().nonnegative(),
    spentBudget: z.number().nonnegative().optional(),
    priority: z.enum(PRIORITY).optional(),
    status: z.enum(PROJECT_STATUS).optional(),
    progress: z.number().min(0).max(100).optional(),
    requirements: z.array(z.string()).optional(),
    requirementChanges: z.number().nonnegative().optional(),
    defectCount: z.number().nonnegative().optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: createProjectSchema.shape.body.partial(),
});
