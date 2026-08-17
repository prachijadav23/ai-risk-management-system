import { Schema, model, Document, Types } from 'mongoose';

export const PROJECT_STATUS = [
  'Planning',
  'Active',
  'OnHold',
  'Completed',
  'Cancelled',
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS)[number];

export const PRIORITY = ['Low', 'Medium', 'High', 'Critical'] as const;
export type Priority = (typeof PRIORITY)[number];

export interface IMilestone {
  title: string;
  dueDate: Date;
  completed: boolean;
  completedAt?: Date;
}

export interface IProject extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  client: Types.ObjectId;
  manager: Types.ObjectId; // Employee
  team?: Types.ObjectId;
  department: Types.ObjectId;
  technology: string[];
  category: string;
  startDate: Date;
  endDate: Date;
  budget: number;
  spentBudget: number;
  priority: Priority;
  status: ProjectStatus;
  progress: number; // 0-100
  requirements: string[];
  requirementChanges: number;
  defectCount: number;
  milestones: IMilestone[];
}

const milestoneSchema = new Schema<IMilestone>(
  {
    title: { type: String, required: true },
    dueDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: true }
);

const projectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String },
    client: { type: Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    manager: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    technology: { type: [String], default: [] },
    category: { type: String, default: 'Web Application' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    budget: { type: Number, required: true, min: 0 },
    spentBudget: { type: Number, default: 0, min: 0 },
    priority: { type: String, enum: PRIORITY, default: 'Medium', index: true },
    status: { type: String, enum: PROJECT_STATUS, default: 'Planning', index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    requirements: { type: [String], default: [] },
    requirementChanges: { type: Number, default: 0, min: 0 },
    defectCount: { type: Number, default: 0, min: 0 },
    milestones: { type: [milestoneSchema], default: [] },
  },
  { timestamps: true }
);

projectSchema.index({ status: 1, priority: 1 });

export const Project = model<IProject>('Project', projectSchema);
