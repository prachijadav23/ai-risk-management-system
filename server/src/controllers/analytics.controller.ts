import { Request, Response } from 'express';
import { Project } from '../models/Project';
import { Employee } from '../models/Employee';
import { Task } from '../models/Task';
import { ok } from '../utils/ApiResponse';

export async function dashboard(_req: Request, res: Response) {
  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    delayedProjects,
    totalEmployees,
    budgetAgg,
    utilizationAgg,
    statusBreakdown,
    priorityBreakdown,
  ] = await Promise.all([
    Project.countDocuments({}),
    Project.countDocuments({ status: 'Active' }),
    Project.countDocuments({ status: 'Completed' }),
    Project.countDocuments({ status: { $in: ['Active', 'Planning', 'OnHold'] }, endDate: { $lt: now } }),
    Employee.countDocuments({ status: 'Active' }),
    Project.aggregate([
      { $group: { _id: null, budget: { $sum: '$budget' }, spent: { $sum: '$spentBudget' } } },
    ]),
    Employee.aggregate([{ $group: { _id: null, avg: { $avg: '$currentWorkload' } } }]),
    Project.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Project.aggregate([{ $group: { _id: '$priority', count: { $sum: 1 } } }]),
  ]);

  const budget = budgetAgg[0] ?? { budget: 0, spent: 0 };
  const budgetUtilization = budget.budget > 0 ? Math.round((budget.spent / budget.budget) * 100) : 0;
  const resourceUtilization = Math.round(utilizationAgg[0]?.avg ?? 0);

  return ok(res, {
    kpis: {
      totalProjects,
      activeProjects,
      completedProjects,
      delayedProjects,
      totalEmployees,
      resourceUtilization,
      budgetUtilization,
      totalBudget: budget.budget,
      spentBudget: budget.spent,
    },
    statusBreakdown: statusBreakdown.map((s) => ({ name: s._id, value: s.count })),
    priorityBreakdown: priorityBreakdown.map((p) => ({ name: p._id, value: p.count })),
  });
}

export async function departmentComparison(_req: Request, res: Response) {
  const data = await Project.aggregate([
    {
      $group: {
        _id: '$department',
        projects: { $sum: 1 },
        avgProgress: { $avg: '$progress' },
        budget: { $sum: '$budget' },
        spent: { $sum: '$spentBudget' },
      },
    },
    { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
    { $unwind: { path: '$dept', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: 0,
        department: '$dept.name',
        projects: 1,
        avgProgress: { $round: ['$avgProgress', 1] },
        budget: 1,
        spent: 1,
      },
    },
    { $sort: { projects: -1 } },
  ]);
  return ok(res, data);
}

export async function taskCompletion(_req: Request, res: Response) {
  const data = await Task.aggregate([{ $group: { _id: '$status', value: { $sum: 1 } } }]);
  return ok(res, data.map((d) => ({ name: d._id, value: d.value })));
}

export async function employeeWorkload(_req: Request, res: Response) {
  const data = await Employee.find({ status: 'Active' })
    .select('name currentWorkload performanceScore')
    .sort({ currentWorkload: -1 })
    .limit(15)
    .lean();
  return ok(res, data);
}

export async function monthlyTrend(_req: Request, res: Response) {
  const data = await Project.aggregate([
    {
      $group: {
        _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.y': 1, '_id.m': 1 } },
    { $limit: 12 },
    {
      $project: {
        _id: 0,
        label: { $concat: [{ $toString: '$_id.y' }, '-', { $toString: '$_id.m' }] },
        count: 1,
      },
    },
  ]);
  return ok(res, data);
}
