import { Schema, model, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  _id: Types.ObjectId;
  name: string;
  department: Types.ObjectId;
  lead?: Types.ObjectId;
  members: Types.ObjectId[];
  capacityHoursPerWeek: number;
}

const teamSchema = new Schema<ITeam>(
  {
    name: { type: String, required: true, trim: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    lead: { type: Schema.Types.ObjectId, ref: 'Employee' },
    members: [{ type: Schema.Types.ObjectId, ref: 'Employee' }],
    capacityHoursPerWeek: { type: Number, default: 200 },
  },
  { timestamps: true }
);

export const Team = model<ITeam>('Team', teamSchema);
