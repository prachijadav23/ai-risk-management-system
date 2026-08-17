import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Employee } from '../models/Employee';
import { Team } from '../models/Team';
import { Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';
import { ok, created, noContent } from '../utils/ApiResponse';
import { logActivity } from '../models/ActivityLog';
import { getScope, assertEmployeeAccess } from '../middleware/scope';

export async function listEmployees(req: Request, res: Response) {
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10));
  const limit = Math.min(200, Math.max(1, parseInt(String(req.query.limit ?? '20'), 10)));
  const { department, availability, skill, search } = req.query;

  const filter: Record<string, unknown> = {};
  if (department) filter.department = department;
  if (availability) filter.availability = availability;
  if (skill) filter.skills = { $in: [new RegExp(String(skill), 'i')] };
  if (search) filter.name = { $regex: String(search), $options: 'i' };

  // TeamLead only sees members of the teams they lead (plus themselves).
  const scope = await getScope(req);
  if (scope.role === 'TeamLead' && scope.employeeId) {
    const teams = await Team.find({ lead: new Types.ObjectId(scope.employeeId) })
      .select('members')
      .lean();
    const memberIds = new Set<string>(teams.flatMap((t) => (t.members ?? []).map((m) => String(m))));
    memberIds.add(scope.employeeId);
    filter._id = { $in: Array.from(memberIds).map((id) => new Types.ObjectId(id)) };
  }

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .populate('department', 'name code')
      .populate('team', 'name')
      .sort({ performanceScore: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Employee.countDocuments(filter),
  ]);

  return ok(res, items, 'Employees fetched', {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getEmployee(req: Request, res: Response) {
  await assertEmployeeAccess(req, req.params.id);
  const employee = await Employee.findById(req.params.id)
    .populate('department', 'name code')
    .populate('team', 'name')
    .populate('assignedProjects', 'name status progress')
    .lean();
  if (!employee) throw ApiError.notFound('Employee not found');

  const tasks = await Task.find({ assignee: employee._id })
    .populate('project', 'name')
    .sort({ dueDate: 1 })
    .lean();

  return ok(res, { ...employee, tasks });
}

export async function createEmployee(req: Request, res: Response) {
  const employee = await Employee.create(req.body);
  await logActivity(toId(req.user?.sub), 'employee.create', 'Employee', employee._id, {
    name: employee.name,
  });
  return created(res, employee);
}

export async function updateEmployee(req: Request, res: Response) {
  const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!employee) throw ApiError.notFound('Employee not found');
  await logActivity(toId(req.user?.sub), 'employee.update', 'Employee', employee._id);
  return ok(res, employee);
}

export async function deleteEmployee(req: Request, res: Response) {
  const employee = await Employee.findByIdAndDelete(req.params.id);
  if (!employee) throw ApiError.notFound('Employee not found');
  await logActivity(toId(req.user?.sub), 'employee.delete', 'Employee', employee._id);
  return noContent(res);
}

function toId(v?: string): Types.ObjectId | undefined {
  return v && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : undefined;
}
