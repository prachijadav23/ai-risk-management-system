/**
 * Deterministic, explainable risk-prediction engine (rule-based-v1).
 *
 * This is NOT a trained ML model. It is a transparent weighted-factor engine
 * that computes each risk factor from real project data, so contributions are
 * fully explainable. The public shape (RiskInput -> RiskResult) is intentionally
 * kept stable so it can later be swapped for a Python FastAPI + scikit-learn /
 * XGBoost microservice without touching controllers or the frontend.
 */

export interface RiskInput {
  startDate: Date;
  endDate: Date;
  now?: Date;
  progress: number; // 0-100
  budget: number;
  spentBudget: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalMilestones: number;
  overdueMilestones: number;
  requirementChanges: number;
  defectCount: number;
  avgTeamWorkload: number; // 0-100
  teamCapacityRatio: number; // required hours / available hours (0-2+)
}

export interface Factor {
  key: string;
  label: string;
  value: number; // normalized 0-100
  contribution: number; // percentage points added to risk
}

export interface RiskResult {
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  delayProbability: number;
  budgetOverrunProbability: number;
  failureProbability: number;
  resourceShortageRisk: number;
  qualityRisk: number;
  successProbability: number;
  factors: Factor[];
  recommendedAction: string;
  engineVersion: string;
}

const clamp = (n: number, min = 0, max = 100): number => Math.max(min, Math.min(max, n));
const round = (n: number): number => Math.round(n * 10) / 10;

/** Weights sum to 1.0 — each factor's normalized value * weight * 100 = contribution. */
const WEIGHTS = {
  schedule: 0.22,
  budget: 0.18,
  taskCompletion: 0.16,
  workload: 0.14,
  milestones: 0.12,
  requirements: 0.08,
  quality: 0.06,
  capacity: 0.04,
} as const;

function levelFor(score: number): RiskResult['riskLevel'] {
  if (score >= 75) return 'Critical';
  if (score >= 55) return 'High';
  if (score >= 35) return 'Medium';
  return 'Low';
}

export function computeRisk(input: RiskInput): RiskResult {
  const now = input.now ?? new Date();
  const totalMs = input.endDate.getTime() - input.startDate.getTime();
  const elapsedMs = now.getTime() - input.startDate.getTime();
  const timeElapsedPct = totalMs > 0 ? clamp((elapsedMs / totalMs) * 100) : 0;

  // 1. Schedule variance — behind schedule if elapsed% > progress%.
  const scheduleGap = clamp(timeElapsedPct - input.progress);
  const scheduleValue = clamp(scheduleGap * 1.6);

  // 2. Budget variance — spending outpacing progress.
  const budgetPct = input.budget > 0 ? clamp((input.spentBudget / input.budget) * 100) : 0;
  const budgetGap = clamp(budgetPct - input.progress);
  const budgetValue = clamp(budgetGap * 1.5);

  // 3. Task completion shortfall vs elapsed time.
  const taskDonePct =
    input.totalTasks > 0 ? (input.completedTasks / input.totalTasks) * 100 : timeElapsedPct;
  const taskValue = clamp(clamp(timeElapsedPct - taskDonePct) * 1.4);

  // 4. Team workload pressure.
  const workloadValue = clamp((input.avgTeamWorkload - 60) * 2.2);

  // 5. Milestone delays.
  const milestoneValue =
    input.totalMilestones > 0
      ? clamp((input.overdueMilestones / input.totalMilestones) * 140)
      : 0;

  // 6. Requirement churn.
  const requirementValue = clamp(input.requirementChanges * 12);

  // 7. Quality / defects.
  const qualityValue = clamp(input.defectCount * 6);

  // 8. Capacity shortage.
  const capacityValue = clamp((input.teamCapacityRatio - 1) * 120);

  const raw: Array<Omit<Factor, 'contribution'> & { weight: number }> = [
    { key: 'schedule', label: 'Schedule delay', value: round(scheduleValue), weight: WEIGHTS.schedule },
    { key: 'budget', label: 'Budget utilization', value: round(budgetValue), weight: WEIGHTS.budget },
    { key: 'taskCompletion', label: 'Task completion shortfall', value: round(taskValue), weight: WEIGHTS.taskCompletion },
    { key: 'workload', label: 'High team workload', value: round(workloadValue), weight: WEIGHTS.workload },
    { key: 'milestones', label: 'Milestone delays', value: round(milestoneValue), weight: WEIGHTS.milestones },
    { key: 'requirements', label: 'Requirement changes', value: round(requirementValue), weight: WEIGHTS.requirements },
    { key: 'quality', label: 'Defect / quality risk', value: round(qualityValue), weight: WEIGHTS.quality },
    { key: 'capacity', label: 'Team capacity shortage', value: round(capacityValue), weight: WEIGHTS.capacity },
  ];

  const factors: Factor[] = raw.map((f) => ({
    key: f.key,
    label: f.label,
    value: f.value,
    contribution: round((f.value / 100) * f.weight * 100),
  }));

  const riskScore = round(clamp(factors.reduce((s, f) => s + f.contribution, 0)));

  // Confidence rises with how much real signal we had (data completeness).
  const dataSignals =
    (input.totalTasks > 0 ? 1 : 0) +
    (input.totalMilestones > 0 ? 1 : 0) +
    (input.budget > 0 ? 1 : 0) +
    (input.avgTeamWorkload > 0 ? 1 : 0);
  const confidence = round(clamp(55 + dataSignals * 10));

  // Derived probabilities — transparent transforms of the sub-factors.
  const delayProbability = round(clamp(scheduleValue * 0.55 + taskValue * 0.3 + milestoneValue * 0.15));
  const budgetOverrunProbability = round(clamp(budgetValue * 0.7 + riskScore * 0.2));
  const resourceShortageRisk = round(clamp(workloadValue * 0.6 + capacityValue * 0.4));
  const qualityRisk = round(clamp(qualityValue * 0.6 + requirementValue * 0.4));
  const failureProbability = round(clamp(riskScore * 0.6 + delayProbability * 0.2 + budgetOverrunProbability * 0.2));
  const successProbability = round(clamp(100 - failureProbability));

  const topFactor = [...factors].sort((a, b) => b.contribution - a.contribution)[0];
  const recommendedAction = buildAction(riskScore, topFactor);

  return {
    riskScore,
    riskLevel: levelFor(riskScore),
    confidence,
    delayProbability,
    budgetOverrunProbability,
    failureProbability,
    resourceShortageRisk,
    qualityRisk,
    successProbability,
    factors,
    recommendedAction,
    engineVersion: 'rule-based-v1',
  };
}

function buildAction(score: number, top: Factor): string {
  if (score < 35) return 'Project is on track. Maintain current cadence and monitor weekly.';
  const map: Record<string, string> = {
    schedule: 'Re-baseline the timeline or add capacity to recover the schedule slip.',
    budget: 'Review scope and burn rate; escalate a budget re-forecast to the sponsor.',
    taskCompletion: 'Unblock stalled tasks and redistribute work to close the completion gap.',
    workload: 'Reduce overloaded members\u2019 assignments by ~20% and rebalance across the team.',
    milestones: 'Recover slipped milestones with a focused catch-up sprint.',
    requirements: 'Freeze scope and route further requirement changes through change control.',
    quality: 'Increase QA coverage and add a defect-triage cycle before the next release.',
    capacity: 'Add resources or extend the deadline to close the capacity shortfall.',
  };
  return map[top.key] ?? 'Investigate the top risk factor and take corrective action.';
}
