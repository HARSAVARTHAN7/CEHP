import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  actorUserId: mongoose.Types.ObjectId;
  action: string;
  entityType: string;
  entityId?: mongoose.Types.ObjectId;
  timestamp: Date;
  reason?: string;
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  requestId?: string;
  ipAddress?: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  actorUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId },
  timestamp: { type: Date, default: Date.now },
  reason: { type: String },
  beforeSnapshot: { type: Schema.Types.Mixed },
  afterSnapshot: { type: Schema.Types.Mixed },
  requestId: { type: String },
  ipAddress: { type: String },
});

auditLogSchema.index({ actorUserId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });
auditLogSchema.index({ timestamp: -1 });

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
