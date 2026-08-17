import { z } from 'zod';
import { ROLES } from '../models/User';

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(ROLES),
    employee: z.string().optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    role: z.enum(ROLES).optional(),
    isActive: z.boolean().optional(),
    employee: z.string().nullable().optional(),
  }),
});
