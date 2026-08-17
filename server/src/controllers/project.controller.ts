import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import { ok, created, noContent } from '../utils/ApiResponse';
import { logActivity } from '../models/ActivityLog';
import { Types } from 'mongoose';
import { projectScopeFilter, assertProjectAccess } from '../middleware/scope';

export async function listProjects(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const { status, priority, department, client, search } = req.query;

  const filter: Record<string, unknown> = { ...(await projectScopeFilter(req)) };
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (department) filter.department = department;
  if (client) filter.client = client;
  if (search) filter.name = { $regex: String(search), $options: 'i' };

  const [items, total] = await Promise.all([
    Project.find(filter)
      .populate('client', 'name')
      .populate('manager', 'name designation')
      .populate('department', 'name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  return ok(res, items, 'Projects fetched', {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getProject(req: Request, res: Response) {
  await assertProjectAccess(req, req.params.id);
  const project = await Project.findById(req.params.id)
    .populate('client', 'name industry')
    .populate('manager', 'name designation email')
    .populate('team', 'name')
    .populate('department', 'name code')
    .lean();
  if (!project) throw ApiError.notFound('Project not found');

  const tasks = await Task.find({ project: project._id })
    .populate('assignee', 'name')
    .sort({ order: 1 })
    .lean();

  return ok(res, { ...project, tasks });
}

export async function createProject(req: Request, res: Response) {
  const project = await Project.create(req.body);
  await logActivity(toId(req.user?.sub), 'project.create', 'Project', project._id, {
    name: project.name,
  });
  return created(res, project);
}

export async function updateProject(req: Request, res: Response) {
  await assertProjectAccess(req, req.params.id);
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!project) throw ApiError.notFound('Project not found');
  await logActivity(toId(req.user?.sub), 'project.update', 'Project', project._id);
  return ok(res, project);
}

export async function deleteProject(req: Request, res: Response) {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');
  await Task.deleteMany({ project: project._id });
  await logActivity(toId(req.user?.sub), 'project.delete', 'Project', project._id);
  return noContent(res);
}

export async function addMilestone(req: Request, res: Response) {
  await assertProjectAccess(req, req.params.id);
  const project = await Project.findById(req.params.id);
  if (!project) throw ApiError.notFound('Project not found');
  project.milestones.push({
    title: req.body.title,
    dueDate: new Date(req.body.dueDate),
    completed: false,
  });
  await project.save();
  await logActivity(toId(req.user?.sub), 'project.milestone.add', 'Project', project._id);
  return created(res, project.milestones);
}

function toId(v?: string): Types.ObjectId | undefined {
  return v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;
}
