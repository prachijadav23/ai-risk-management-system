import { Schema, model, Document, Types } from 'mongoose';

export interface IFactor {
  key: string;
  label: string;
  contribution: number; // percentage points added to risk
  value: number; // raw normalized value 0-100
}

export interface IRiskPrediction extends Document {
  _id: Types.ObjectId;
  project: Types.ObjectId;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  confidence: number;
  delayProbability: number;
  budgetOverrunProbability: number;
  failureProbability: number;
  resourceShortageRisk: number;
  qualityRisk: number;
  successProbability: number;
  factors: IFactor[];
  recommendedAction: string;
  engineVersion: string;
  createdBy?: Types.ObjectId;
}

const factorSchema = new Schema<IFactor>(
  {
    key: String,
    label: String,
    contribution: Number,
    value: Number,
  },
  { _id: false }
);

const riskPredictionSchema = new Schema<IRiskPrediction>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    riskScore: { type: Number, required: true },
    riskLevel: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], required: true },
    confidence: { type: Number, required: true },
    delayProbability: Number,
    budgetOverrunProbability: Number,
    failureProbability: Number,
    resourceShortageRisk: Number,
    qualityRisk: Number,
    successProbability: Number,
    factors: { type: [factorSchema], default: [] },
    recommendedAction: String,
    engineVersion: { type: String, default: 'rule-based-v1' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const RiskPrediction = model<IRiskPrediction>('RiskPrediction', riskPredictionSchema);
