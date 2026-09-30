import mongoose, { Schema, Document } from "mongoose";

export interface IAuditLog extends Document {
  sessionId: string;
  taskId?: string;
  tool: string;
  args: Record<string, unknown>;
  result: "success" | "failed" | "blocked";
  message?: string;
  timestamp: number;
}

const AuditLogSchema = new Schema<IAuditLog>({
  sessionId: { type: String, required: true, index: true },
  taskId: { type: String, index: true },
  tool: { type: String, required: true },
  args: { type: Schema.Types.Mixed, default: {} },
  result: { type: String, enum: ["success", "failed", "blocked"], required: true },
  message: { type: String },
  timestamp: { type: Number, required: true },
});

export default mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);