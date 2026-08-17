import { Request } from 'express';
import { Types } from 'mongoose';
import { Role } from '../utils/token';
import { User } from '../models/User';
import { Employee } from '../models/Employee';
import { Project } from '../models/Project';
import { Team } from '../models/Team';
import { Task } from '../models/Task';
import { ApiError } from '../utils/ApiError';

/**
 * Central authorization scope for the authenticated request.
 *
 * This is the single source of truth for "which records may this user touch".
 * Route-level `authorize(...roles)` gates *actions*; this module gates *data*,
 * which is what actually prevents IDOR (changing an :id in the URL to reach
 * someone else's project/task/employee).
 */

export interface Scope {
  userId: string;
  role: Role;
  employeeId: string | null;
}

interface ScopedRequest extends Request {
  _scope?: Scope;
  _accessibleProjectIds?: string[] | 'ALL';
}

/** Resolve the caller's linked Employee id — from the JWT if present, else a
 *  one-time User lookup cached on the request. */
async function resolveEmployeeId(req: Request): Promise<string | null> {
  if (req.user?.employee) return req.user.employee;
  if (!req.user?.sub) return null;
  const user = await User.findById(req.user.sub).select('employee').lean();
  return user?.employee ? String(user.employee) : null;
}

/** Build (and cache) the authorization scope for this request. */
export async function getScope(req: Request): Promise<Scope> {
  const r = req as ScopedRequest;
  if (r._scope) return r._scope;
  if (!req.user) throw ApiError.unauthorized();
  const employeeId = await resolveEmployeeId(req);
  r._scope = { userId: req.user.sub, role: req.user.role, employeeId };
  return r._scope;
}

/**
 * The set of project ids this user may access, or 'ALL' for administrators.
 * - Administrator → ALL
 * - ProjectManager → projects they manage (project.manager === their employee)
 * - TeamLead → projects of teams they lead + projects they're assigned to
 * - Employee → only projects they're assigned to
 */
export async function accessibleProjectIds(req: Request): Promise<string[] | 'ALL'> {
  const r = req as ScopedRequest;
  if (r._accessibleProjectIds) return r._accessibleProjectIds;

  const scope = await getScope(req);
  if (scope.role === 'Administrator') {
    r._accessibleProjectIds = 'ALL';
    return 'ALL';
  }

  const ids = new Set<string>();
  const empId = scope.employeeId;

  if (empId) {
    const empObjId = new Types.ObjectId(empId);

    if (scope.role === 'ProjectManager') {
      const managed = await Project.find({ manager: empObjId }).select('_id').lean();
      managed.forEach((p) => ids.add(String(p._id)));
    }

    if (scope.role === 'TeamLead') {
      const teams = await Team.find({ lead: empObjId }).select('_id').lean();
      const teamIds = teams.map((t) => t._id);
      if (teamIds.length) {
        const teamProjects = await Project.find({ team: { $in: teamIds } })
          .select('_id')
          .lean();
        teamProjects.forEach((p) => ids.add(String(p._id)));
      }
    }

    // Assigned projects apply to PM, Lead and Employee alike.
    const emp = await Employee.findById(empObjId).select('assignedProjects').lean();
    (emp?.assignedProjects ?? []).forEach((p) => ids.add(String(p)));
  }

  const arr = Array.from(ids);
  r._accessibleProjectIds = arr;
  return arr;
}

/** A Mongo `_id` filter fragment scoping a Project query to accessible ids. */
export async function projectScopeFilter(req: Request): Promise<Record<string, unknown>> {
  const ids = await accessibleProjectIds(req);
  if (ids === 'ALL') return {};
  return { _id: { $in: ids.map((id) => new Types.ObjectId(id)) } };
}

/** Assert the caller may access a specific project; throws 404/403 otherwise.
 *  404 (not 403) is returned for a non-existent id so we don't leak existence. */
export async function assertProjectAccess(req: Request, projectId: string): Promise<void> {
  if (!Types.ObjectId.isValid(projectId)) throw ApiError.badRequest('Invalid project id');
  const exists = await Project.exists({ _id: projectId });
  if (!exists) throw ApiError.notFound('Project not found');

  const ids = await accessibleProjectIds(req);
  if (ids === 'ALL') return;
  if (!ids.includes(String(projectId))) {
    throw ApiError.forbidden('You do not have access to this project');
  }
}

/** Assert the caller may access a task (via its parent project). Returns the
 *  task's project id and whether the task is assigned to the caller. */
export async function assertTaskAccess(
  req: Request,
  taskId: string
): Promise<{ projectId: string; isOwnTask: boolean }> {
  if (!Types.ObjectId.isValid(taskId)) throw ApiError.badRequest('Invalid task id');
  const task = await Task.findById(taskId).select('project assignee').lean();
  if (!task) throw ApiError.notFound('Task not found');

  await assertProjectAccess(req, String(task.project));

  const scope = await getScope(req);
  const isOwnTask =
    !!scope.employeeId && !!task.assignee && String(task.assignee) === scope.employeeId;
  return { projectId: String(task.project), isOwnTask };
}

/** Assert the caller may access an employee record.
 *  - Administrator / ProjectManager → any
 *  - TeamLead → members of teams they lead, or themselves
 *  - Employee → only their own record */
export async function assertEmployeeAccess(req: Request, employeeId: string): Promise<void> {
  if (!Types.ObjectId.isValid(employeeId)) throw ApiError.badRequest('Invalid employee id');
  const exists = await Employee.exists({ _id: employeeId });
  if (!exists) throw ApiError.notFound('Employee not found');

  const scope = await getScope(req);
  if (scope.role === 'Administrator' || scope.role === 'ProjectManager') return;

  if (scope.employeeId && String(employeeId) === scope.employeeId) return; // self

  if (scope.role === 'TeamLead' && scope.employeeId) {
    const teams = await Team.find({ lead: new Types.ObjectId(scope.employeeId) })
      .select('members')
      .lean();
    const memberIds = new Set(teams.flatMap((t) => (t.members ?? []).map((m) => String(m))));
    if (memberIds.has(String(employeeId))) return;
  }

  throw ApiError.forbidden('You do not have access to this employee record');
}

/** Employees may only edit a restricted set of fields on their own task. */
export const EMPLOYEE_TASK_WRITABLE_FIELDS = ['status', 'progress', 'actualHours'] as const;
