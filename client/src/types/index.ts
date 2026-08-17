export type Role = 'Administrator' | 'ProjectManager' | 'TeamLead' | 'Employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: { page?: number; limit?: number; total?: number; totalPages?: number };
}

export interface Client {
  _id: string;
  name: string;
  industry: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
}

export interface Employee {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  department: Department | string;
  designation: string;
  skills: string[];
  experienceYears: number;
  salary: number;
  availability: 'Available' | 'PartiallyAvailable' | 'Unavailable';
  currentWorkload: number;
  performanceScore: number;
  assignedProjects?: unknown[];
  status: 'Active' | 'Inactive';
}

export type ProjectStatus = 'Planning' | 'Active' | 'OnHold' | 'Completed' | 'Cancelled';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Milestone {
  _id?: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

export interface Project {
  _id: string;
  name: string;
  code: string;
  description?: string;
  client: Client | string;
  manager: Employee | string;
  department: Department | string;
  technology: string[];
  category: string;
  startDate: string;
  endDate: string;
  budget: number;
  spentBudget: number;
  priority: Priority;
  status: ProjectStatus;
  progress: number;
  requirements: string[];
  requirementChanges: number;
  defectCount: number;
  milestones: Milestone[];
  tasks?: Task[];
}

export type TaskStatus = 'Todo' | 'InProgress' | 'Review' | 'Done' | 'Blocked';

export interface Task {
  _id: string;
  title: string;
  description?: string;
  project: Project | string;
  assignee?: Employee | string;
  priority: Priority;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  dueDate?: string;
  progress: number;
  order: number;
}

export interface Factor {
  key: string;
  label: string;
  value: number;
  contribution: number;
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

export interface CommandCenter {
  projectsAnalyzed: number;
  avgRiskScore: number;
  avgSuccessProbability: number;
  avgDelayProbability: number;
  avgBudgetOverrunProbability: number;
  highRisk: number;
  projects: Array<RiskResult & { project: string; name: string }>;
}

export interface AllocationScore {
  id: string;
  name: string;
  designation: string;
  fitScore: number;
  skillMatchPct: number;
  spareCapacity: number;
  matchedSkills: string[];
  missingSkills: string[];
  breakdown: { label: string; value: number }[];
}

export interface Recommendation {
  _id: string;
  project?: { _id: string; name: string } | string;
  type: string;
  problem: string;
  reason: string;
  action: string;
  expectedImpact: string;
  priority: Priority;
  confidence: number;
  status: 'Pending' | 'Accepted' | 'Rejected';
}

export interface DashboardData {
  kpis: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    delayedProjects: number;
    totalEmployees: number;
    resourceUtilization: number;
    budgetUtilization: number;
    totalBudget: number;
    spentBudget: number;
  };
  statusBreakdown: { name: string; value: number }[];
  priorityBreakdown: { name: string; value: number }[];
}
