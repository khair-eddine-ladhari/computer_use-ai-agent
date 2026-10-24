import mongoose, { Schema, Document } from "mongoose";

export type AuditResult = "pending" | "success" | "failed" | "blocked";

export interface IAuditLog extends Document {
  sessionId: string;
  taskId?: string;
  tool: string;
  args: Record<string, unknown>;
  result: AuditResult;
  requiresApproval: boolean;
  approved: boolean;
  message?: string;
  timestamp: number;
}

const AuditLogSchema = new Schema<IAuditLog>({
  sessionId: { type: String, required: true, index: true },
  taskId: { type: String, index: true },
  tool: { type: String, required: true },
  args: { type: Schema.Types.Mixed, default: {} },
  result: {
    type: String,
    enum: ["pending", "success", "failed", "blocked"],
    default: "pending",
    index: true,
  },
  requiresApproval: { type: Boolean, default: false },
  approved: { type: Boolean, default: false },
  message: { type: String },
  timestamp: { type: Number, required: true },
});

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);