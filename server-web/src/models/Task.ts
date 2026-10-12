import mongoose, { Schema, Document } from "mongoose";

export type TaskStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface ITask extends Document {
  sessionId: string;
  goal: string;
  status: TaskStatus;
  result?: string;
  error?: string;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    sessionId: { type: String, required: true, index: true },
    goal: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed", "cancelled"],
      default: "pending",
      index: true,
    },
    result: { type: String },
    error: { type: String },
    startedAt: { type: Date },
    finishedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", TaskSchema);