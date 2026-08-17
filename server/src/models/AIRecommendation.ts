import { Schema, model, Document, Types } from 'mongoose';

export interface IAIRecommendation extends Document {
  _id: Types.ObjectId;
  project?: Types.ObjectId;
  type: 'Staffing' | 'Workload' | 'Quality' | 'Timeline' | 'Budget';
  problem: string;
  reason: string;
  action: string;
  expectedImpact: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  status: 'Pending' | 'Accepted' | 'Rejected';
  resolvedBy?: Types.ObjectId;
}

const recSchema = new Schema<IAIRecommendation>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', index: true },
    type: {
      type: String,
      enum: ['Staffing', 'Workload', 'Quality', 'Timeline', 'Budget'],
      required: true,
    },
    problem: { type: String, required: true },
    reason: { type: String, required: true },
    action: { type: String, required: true },
    expectedImpact: { type: String, required: true },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    confidence: { type: Number, default: 70 },
    status: { type: String, enum: ['Pending', 'Accepted', 'Rejected'], default: 'Pending', index: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const AIRecommendation = model<IAIRecommendation>('AIRecommendation', recSchema);
