import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Task, TASK_STATUS } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import { ok, created, noContent } from '../utils/ApiResponse';
import { logActivity } from '../models/ActivityLog';
import {
  accessibleProjectIds,
  assertProjectAccess,
  assertTaskAccess,
  getScope,
  EMPLOYEE_TASK_WRITABLE_FIELDS,
} from '../middleware/scope';

/** Restrict a task query to the projects the caller may see. */
async function taskScopeFilter(req: Request): Promise<Record<string, unknown>> {
  const ids = await accessibleProjectIds(req);
  if (ids === 'ALL') return {};
  return { project: { $in: ids.map((id) => new Types.ObjectId(id)) } };
}

export async function listTasks(req: Request, res: Response) {
  const { project, assignee, status, priority } = req.query;
  const filter: Record<string, unknown> = { ...(await taskScopeFilter(req)) };
  if (project) {
    // Narrowing to a specific project — verify access to it first.
    await assertProjectAccess(req, String(project));
    filter.project = project;
  }
  if (assignee) filter.assignee = assignee;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;

  const tasks = await Task.find(filter)
    .populate('assignee', 'name')
    .populate('project', 'name')
    .sort({ order: 1, createdAt: -1 })
    .lean();
  return ok(res, tasks);
}

/** Kanban-shaped payload: columns keyed by status. */
export async function boardTasks(req: Request, res: Response) {
  const filter: Record<string, unknown> = { ...(await taskScopeFilter(req)) };
  if (req.query.project) {
    await assertProjectAccess(req, String(req.query.project));
    filter.project = req.query.project;
  }

  const tasks = await Task.find(filter).populate('assignee', 'name').sort({ order: 1 }).lean();
  const columns = Object.fromEntries(TASK_STATUS.map((s) => [s, [] as unknown[]]));
  for (const t of tasks) columns[t.status].push(t);
  return ok(res, columns);
}

export async function createTask(req: Request, res: Response) {
  if (!req.body.project) throw ApiError.badRequest('project is required');
  // Must have access to the project the task is being created under.
  await assertProjectAccess(req, String(req.body.project));
  const task = await Task.create(req.body);
  await logActivity(toId(req.user?.sub), 'task.create', 'Task', task._id, { title: task.title });
  return created(res, task);
}

export async function updateTask(req: Request, res: Response) {
  const { isOwnTask } = await assertTaskAccess(req, req.params.id);
  const scope = await getScope(req);

  let update = req.body as Record<string, unknown>;

  // Employees may only edit their OWN task, and only progress-related fields.
  if (scope.role === 'Employee') {
    if (!isOwnTask) throw ApiError.forbidden('You can only update tasks assigned to you');
    update = pick(update, EMPLOYEE_TASK_WRITABLE_FIELDS as unknown as string[]);
    if (Object.keys(update).length === 0) {
      throw ApiError.badRequest('You may only update status, progress or actual hours');
    }
  }

  const task = await Task.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  });
  if (!task) throw ApiError.notFound('Task not found');
  await logActivity(toId(req.user?.sub), 'task.update', 'Task', task._id);
  return ok(res, task);
}

export async function moveTask(req: Request, res: Response) {
  const { isOwnTask } = await assertTaskAccess(req, req.params.id);
  const scope = await getScope(req);
  if (scope.role === 'Employee' && !isOwnTask) {
    throw ApiError.forbidden('You can only move tasks assigned to you');
  }

  const { status, order } = req.body as { status?: string; order?: number };
  const update: Record<string, unknown> = {};
  if (status) update.status = status;
  if (typeof order === 'number') update.order = order;
  if (status === 'Done') update.progress = 100;
  const task = await Task.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!task) throw ApiError.notFound('Task not found');
  await logActivity(toId(req.user?.sub), 'task.move', 'Task', task._id, { status });
  return ok(res, task);
}

export async function deleteTask(req: Request, res: Response) {
  // Route already blocks Employees; still verify project access (PM/Lead scope).
  await assertTaskAccess(req, req.params.id);
  const task = await Task.findByIdAndDelete(req.params.id);
  if (!task) throw ApiError.notFound('Task not found');
  await logActivity(toId(req.user?.sub), 'task.delete', 'Task', task._id);
  return noContent(res);
}

function pick(obj: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out;
}

function toId(v?: string): Types.ObjectId | undefined {
  return v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;
}
