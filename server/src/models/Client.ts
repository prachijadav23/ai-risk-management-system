import { Schema, model, Document, Types } from 'mongoose';

export interface IClient extends Document {
  _id: Types.ObjectId;
  name: string;
  industry: string;
  contactEmail: string;
  contactPhone?: string;
  country?: string;
  status: 'Active' | 'Inactive';
}

const clientSchema = new Schema<IClient>(
  {
    name: { type: String, required: true, trim: true, index: true },
    industry: { type: String, required: true },
    contactEmail: { type: String, required: true, lowercase: true },
    contactPhone: { type: String },
    country: { type: String },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true }
);

export const Client = model<IClient>('Client', clientSchema);
