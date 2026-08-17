import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { ok, created, noContent } from '../utils/ApiResponse';
import { logActivity } from '../models/ActivityLog';

/**
 * Administrator-only account management. This is the ONLY place privileged
 * accounts (Administrator / ProjectManager / TeamLead) can be created — public
 * self-registration always yields an Employee.
 */

export async function listUsers(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const { role, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (role) filter.role = role;
  if (search) filter.name = { $regex: String(search), $options: 'i' };

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('employee', 'name designation')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  return ok(res, items, 'Users fetched', {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function createUser(req: Request, res: Response) {
  const { name, email, password, role, employee } = req.body;
  const exists = await User.findOne({ email });
  if (exists) throw ApiError.conflict('Email is already registered');

  const user = await User.create({
    name,
    email,
    password,
    role,
    employee: employee && Types.ObjectId.isValid(employee) ? employee : undefined,
  });

  await logActivity(toId(req.user?.sub), 'user.create', 'User', user._id, { role });

  return created(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    employee: user.employee,
    isActive: user.isActive,
  });
}

export async function updateUser(req: Request, res: Response) {
  const { name, role, isActive, employee } = req.body;

  // Prevent an administrator from demoting/deactivating their own account and
  // locking themselves out.
  if (String(req.params.id) === String(req.user?.sub)) {
    if ((role && role !== 'Administrator') || isActive === false) {
      throw ApiError.badRequest('You cannot change your own role or deactivate yourself');
    }
  }

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (role !== undefined) update.role = role;
  if (isActive !== undefined) update.isActive = isActive;
  if (employee !== undefined) {
    update.employee = employee && Types.ObjectId.isValid(employee) ? employee : undefined;
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).lean();
  if (!user) throw ApiError.notFound('User not found');

  await logActivity(toId(req.user?.sub), 'user.update', 'User', user._id);

  return ok(res, {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    employee: user.employee,
    isActive: user.isActive,
  });
}

export async function deleteUser(req: Request, res: Response) {
  if (String(req.params.id) === String(req.user?.sub)) {
    throw ApiError.badRequest('You cannot delete your own account');
  }
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw ApiError.notFound('User not found');
  await logActivity(toId(req.user?.sub), 'user.delete', 'User', user._id);
  return noContent(res);
}

function toId(v?: string): Types.ObjectId | undefined {
  return v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;
}
