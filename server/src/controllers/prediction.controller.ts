import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Employee } from '../models/Employee';
import { RiskPrediction } from '../models/RiskPrediction';
import { AIRecommendation } from '../models/AIRecommendation';
import { ApiError } from '../utils/ApiError';
import { ok, created } from '../utils/ApiResponse';
import { computeRisk, RiskInput, RiskResult } from '../services/risk.service';
import { scoreCandidates, Candidate } from '../services/allocation.service';
import { generateRecommendations } from '../services/recommendation.service';
import { logActivity } from '../models/ActivityLog';
import {
  accessibleProjectIds,
  assertProjectAccess,
  projectScopeFilter,
} from '../middleware/scope';

/** Assemble a RiskInput from live project + task + employee data. */
async function buildRiskInput(projectId: Types.ObjectId): Promise<{
  input: RiskInput;
  name: string;
}> {
  const project = await Project.findById(projectId).lean();
  if (!project) throw ApiError.notFound('Project not found');

  const tasks = await Task.find({ project: projectId }).lean();
  const now = new Date();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'Done').length;
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.status !== 'Done' && new Date(t.dueDate) < now
  ).length;

  const totalMilestones = project.milestones.length;
  const overdueMilestones = project.milestones.filter(
    (m) => !m.completed && new Date(m.dueDate) < now
  ).length;

  const employees = await Employee.find({ assignedProjects: projectId }).lean();
  const avgTeamWorkload =
    employees.length > 0
      ? employees.reduce((s, e) => s + e.currentWorkload, 0) / employees.length
      : 60;

  const estHours = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
  const availableHours = Math.max(1, employees.length * 40);
  const teamCapacityRatio = estHours > 0 ? estHours / availableHours : 1;

  const input: RiskInput = {
    startDate: new Date(project.startDate),
    endDate: new Date(project.endDate),
    now,
    progress: project.progress,
    budget: project.budget,
    spentBudget: project.spentBudget,
    totalTasks,
    completedTasks,
    overdueTasks,
    totalMilestones,
    overdueMilestones,
    requirementChanges: project.requirementChanges,
    defectCount: project.defectCount,
    avgTeamWorkload,
    teamCapacityRatio,
  };

  return { input, name: project.name };
}

/** Run + persist a prediction for one project. */
export async function predictProject(req: Request, res: Response) {
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid project id');
  await assertProjectAccess(req, id);
  const projectId = new Types.ObjectId(id);

  const { input, name } = await buildRiskInput(projectId);
  const result: RiskResult = computeRisk(input);

  const record = await RiskPrediction.create({
    project: projectId,
    ...result,
    createdBy: req.user ? new Types.ObjectId(req.user.sub) : undefined,
  });

  // Also generate recommendations from the same result.
  const generated = generateRecommendations(name, result);
  if (generated.length) {
    await AIRecommendation.insertMany(generated.map((g) => ({ ...g, project: projectId })));
  }

  await logActivity(
    req.user ? new Types.ObjectId(req.user.sub) : undefined,
    'ai.predict',
    'Project',
    projectId,
    { riskScore: result.riskScore }
  );

  return created(res, { prediction: record, recommendations: generated });
}

/** Latest stored prediction for a project. */
export async function latestPrediction(req: Request, res: Response) {
  await assertProjectAccess(req, req.params.id);
  const prediction = await RiskPrediction.findOne({ project: req.params.id })
    .sort({ createdAt: -1 })
    .lean();
  if (!prediction) throw ApiError.notFound('No prediction yet. Run one first.');
  return ok(res, prediction);
}

/** Portfolio-wide command-center summary computed live. */
export async function commandCenter(req: Request, res: Response) {
  const scopeFilter = await projectScopeFilter(req);
  const projects = await Project.find({
    ...scopeFilter,
    status: { $in: ['Planning', 'Active', 'OnHold'] },
  }).lean();
  const results: Array<{ project: string; name: string } & RiskResult> = [];

  for (const p of projects) {
    const { input, name } = await buildRiskInput(p._id);
    const r = computeRisk(input);
    results.push({ project: String(p._id), name, ...r });
  }

  const avg = (fn: (r: RiskResult) => number) =>
    results.length ? Math.round((results.reduce((s, r) => s + fn(r), 0) / results.length) * 10) / 10 : 0;

  return ok(res, {
    projectsAnalyzed: results.length,
    avgRiskScore: avg((r) => r.riskScore),
    avgSuccessProbability: avg((r) => r.successProbability),
    avgDelayProbability: avg((r) => r.delayProbability),
    avgBudgetOverrunProbability: avg((r) => r.budgetOverrunProbability),
    highRisk: results.filter((r) => r.riskScore >= 55).length,
    projects: results.sort((a, b) => b.riskScore - a.riskScore),
  });
}

/** Recommend best employees for a project's required skills. */
export async function recommendAllocation(req: Request, res: Response) {
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid project id');
  await assertProjectAccess(req, id);
  const project = await Project.findById(id).lean();
  if (!project) throw ApiError.notFound('Project not found');

  const requiredSkills: string[] =
    (req.body.requiredSkills as string[] | undefined) ??
    (project.technology.length ? project.technology : ['JavaScript']);

  const departmentFilter = req.query.allDepartments === 'true' ? {} : { department: project.department };
  const employees = await Employee.find({ ...departmentFilter, status: 'Active' }).lean();

  const candidates: Candidate[] = employees.map((e) => ({
    id: String(e._id),
    name: e.name,
    designation: e.designation,
    skills: e.skills,
    experienceYears: e.experienceYears,
    currentWorkload: e.currentWorkload,
    performanceScore: e.performanceScore,
    availability: e.availability,
  }));

  const ranked = scoreCandidates(requiredSkills, candidates).slice(0, 10);
  return ok(res, { requiredSkills, recommendations: ranked });
}

/** List AI recommendations; supports status filter. */
export async function listRecommendations(req: Request, res: Response) {
  const filter: Record<string, unknown> = {};
  if (req.query.status) filter.status = req.query.status;

  // Scope to accessible projects (Administrators see all).
  const ids = await accessibleProjectIds(req);
  if (ids !== 'ALL') {
    const objIds = ids.map((i) => new Types.ObjectId(i));
    if (req.query.project) {
      await assertProjectAccess(req, String(req.query.project));
      filter.project = req.query.project;
    } else {
      filter.project = { $in: objIds };
    }
  } else if (req.query.project) {
    filter.project = req.query.project;
  }

  const recs = await AIRecommendation.find(filter)
    .populate('project', 'name')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
  return ok(res, recs);
}

/** Accept / reject a recommendation. */
export async function resolveRecommendation(req: Request, res: Response) {
  const { status } = req.body as { status: 'Accepted' | 'Rejected' };
  if (!['Accepted', 'Rejected'].includes(status)) {
    throw ApiError.badRequest('status must be Accepted or Rejected');
  }
  const existing = await AIRecommendation.findById(req.params.id).select('project').lean();
  if (!existing) throw ApiError.notFound('Recommendation not found');
  await assertProjectAccess(req, String(existing.project));
  const rec = await AIRecommendation.findByIdAndUpdate(
    req.params.id,
    { status, resolvedBy: req.user ? new Types.ObjectId(req.user.sub) : undefined },
    { new: true }
  );
  if (!rec) throw ApiError.notFound('Recommendation not found');
  return ok(res, rec);
}

/**
 * What-if simulator: computes risk for baseline vs an overridden scenario
 * without persisting anything.
 */
export async function simulate(req: Request, res: Response) {
  const id = req.params.id;
  if (!Types.ObjectId.isValid(id)) throw ApiError.badRequest('Invalid project id');
  await assertProjectAccess(req, id);
  const { input } = await buildRiskInput(new Types.ObjectId(id));

  const before = computeRisk(input);

  const o = req.body as Partial<RiskInput> & { deadlineShiftDays?: number };
  const scenario: RiskInput = { ...input };
  if (typeof o.budget === 'number') scenario.budget = o.budget;
  if (typeof o.avgTeamWorkload === 'number') scenario.avgTeamWorkload = o.avgTeamWorkload;
  if (typeof o.teamCapacityRatio === 'number') scenario.teamCapacityRatio = o.teamCapacityRatio;
  if (typeof o.requirementChanges === 'number') scenario.requirementChanges = o.requirementChanges;
  if (typeof o.progress === 'number') scenario.progress = o.progress;
  if (typeof o.deadlineShiftDays === 'number') {
    scenario.endDate = new Date(scenario.endDate.getTime() + o.deadlineShiftDays * 86400000);
  }

  const after = computeRisk(scenario);
  return ok(res, { before, after });
}
