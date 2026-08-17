import { Schema, model, Document, Types } from 'mongoose';

export interface IActivityLog extends Document {
  _id: Types.ObjectId;
  actor?: Types.ObjectId;
  action: string;
  entity: string;
  entityId?: Types.ObjectId;
  meta?: Record<string, unknown>;
}

const activityLogSchema = new Schema<IActivityLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    action: { type: String, required: true },
    entity: { type: String, required: true, index: true },
    entityId: { type: Schema.Types.ObjectId },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const ActivityLog = model<IActivityLog>('ActivityLog', activityLogSchema);

export async function logActivity(
  actor: Types.ObjectId | undefined,
  action: string,
  entity: string,
  entityId?: Types.ObjectId,
  meta?: Record<string, unknown>
): Promise<void> {
  try {
    await ActivityLog.create({ actor, action, entity, entityId, meta });
  } catch {
    /* logging must never break the request */
  }
}
