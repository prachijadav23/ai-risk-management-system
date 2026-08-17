import { Schema, model, Document, Types } from 'mongoose';

export interface IEmployee extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  department: Types.ObjectId;
  team?: Types.ObjectId;
  designation: string;
  skills: string[];
  experienceYears: number;
  salary: number;
  availability: 'Available' | 'PartiallyAvailable' | 'Unavailable';
  currentWorkload: number; // 0-100 %
  performanceScore: number; // 0-100
  assignedProjects: Types.ObjectId[];
  status: 'Active' | 'Inactive';
}

const employeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    team: { type: Schema.Types.ObjectId, ref: 'Team' },
    designation: { type: String, required: true },
    skills: { type: [String], default: [], index: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    salary: { type: Number, default: 0, min: 0 },
    availability: {
      type: String,
      enum: ['Available', 'PartiallyAvailable', 'Unavailable'],
      default: 'Available',
    },
    currentWorkload: { type: Number, default: 0, min: 0, max: 100 },
    performanceScore: { type: Number, default: 70, min: 0, max: 100 },
    assignedProjects: [{ type: Schema.Types.ObjectId, ref: 'Project' }],
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

employeeSchema.index({ department: 1, availability: 1 });

export const Employee = model<IEmployee>('Employee', employeeSchema);
