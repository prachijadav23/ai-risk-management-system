import { RiskResult } from './risk.service';

export interface GeneratedRecommendation {
  type: 'Staffing' | 'Workload' | 'Quality' | 'Timeline' | 'Budget';
  problem: string;
  reason: string;
  action: string;
  expectedImpact: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
}

/**
 * Turns an explainable RiskResult into concrete, prioritized recommendations.
 * Only factors above a threshold produce a recommendation, so output tracks the
 * actual drivers of risk for that project.
 */
export function generateRecommendations(
  projectName: string,
  risk: RiskResult
): GeneratedRecommendation[] {
  const recs: GeneratedRecommendation[] = [];
  const byKey = Object.fromEntries(risk.factors.map((f) => [f.key, f]));
  const priorityFor = (v: number): GeneratedRecommendation['priority'] =>
    v >= 70 ? 'Critical' : v >= 50 ? 'High' : v >= 30 ? 'Medium' : 'Low';

  if ((byKey.workload?.value ?? 0) >= 40) {
    recs.push({
      type: 'Workload',
      problem: `Team on ${projectName} is over-allocated.`,
      reason: `Average workload factor is high (${byKey.workload.value}/100), raising burnout and delay risk.`,
      action: 'Reduce the most-loaded members\u2019 assignments by ~20% and rebalance across the team.',
      expectedImpact: 'Lowers delay probability and stabilizes throughput.',
      priority: priorityFor(byKey.workload.value),
      confidence: risk.confidence,
    });
  }

  if ((byKey.capacity?.value ?? 0) >= 30 || (byKey.schedule?.value ?? 0) >= 55) {
    recs.push({
      type: 'Staffing',
      problem: `${projectName} lacks capacity to hit the current plan.`,
      reason: 'Capacity shortfall and/or schedule slip indicate the team is under-resourced.',
      action: 'Assign an additional developer with the missing skill set to the project.',
      expectedImpact: 'Increases delivery capacity and reduces schedule variance.',
      priority: priorityFor(Math.max(byKey.capacity?.value ?? 0, byKey.schedule?.value ?? 0)),
      confidence: risk.confidence,
    });
  }

  if ((byKey.quality?.value ?? 0) >= 25 || (byKey.requirements?.value ?? 0) >= 40) {
    recs.push({
      type: 'Quality',
      problem: `Quality risk is rising on ${projectName}.`,
      reason: 'Elevated defect count and/or requirement churn threaten release quality.',
      action: 'Increase QA resources and add a defect-triage cycle; freeze scope via change control.',
      expectedImpact: 'Reduces rework and post-release defects.',
      priority: priorityFor(Math.max(byKey.quality?.value ?? 0, byKey.requirements?.value ?? 0)),
      confidence: risk.confidence,
    });
  }

  if (risk.delayProbability >= 55) {
    recs.push({
      type: 'Timeline',
      problem: `${projectName} is likely to miss its deadline.`,
      reason: `Delay probability is ${risk.delayProbability}%, driven by schedule and task-completion gaps.`,
      action: 'Re-baseline the timeline or request a deadline extension for the current phase.',
      expectedImpact: 'Aligns the plan with realistic delivery capacity.',
      priority: priorityFor(risk.delayProbability),
      confidence: risk.confidence,
    });
  }

  if (risk.budgetOverrunProbability >= 55) {
    recs.push({
      type: 'Budget',
      problem: `${projectName} is trending toward a budget overrun.`,
      reason: `Budget-overrun probability is ${risk.budgetOverrunProbability}% as spend outpaces progress.`,
      action: 'Review scope and burn rate; escalate a budget re-forecast to the sponsor.',
      expectedImpact: 'Contains cost and surfaces overruns early.',
      priority: priorityFor(risk.budgetOverrunProbability),
      confidence: risk.confidence,
    });
  }

  return recs;
}
