import { Schema, model, Document, Types } from 'mongoose';

export const TASK_STATUS = ['Todo', 'InProgress', 'Review', 'Done', 'Blocked'] as const;
export type TaskStatus = (typeof TASK_STATUS)[number];

export const TASK_PRIORITY = ['Low', 'Medium', 'High', 'Critical'] as const;
export type TaskPriority = (typeof TASK_PRIORITY)[number];

export interface ITask extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  project: Types.ObjectId;
  assignee?: Types.ObjectId; // Employee
  priority: TaskPriority;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  dueDate?: Date;
  progress: number;
  order: number;
}

const taskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    assignee: { type: Schema.Types.ObjectId, ref: 'Employee', index: true },
    priority: { type: String, enum: TASK_PRIORITY, default: 'Medium' },
    status: { type: String, enum: TASK_STATUS, default: 'Todo', index: true },
    estimatedHours: { type: Number, default: 0, min: 0 },
    actualHours: { type: Number, default: 0, min: 0 },
    dueDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, status: 1 });

export const Task = model<ITask>('Task', taskSchema);
