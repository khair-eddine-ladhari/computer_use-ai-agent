import mongoose, { Schema, Document } from "mongoose";

export type TaskStatus = "running" | "done" | "failed" | "stopped";

export interface ITask extends Document {
  sessionId: string;
  goal: string;
  status: TaskStatus;
  stepCount: number;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    sessionId: { type: String, required: true, index: true },
    goal: { type: String, required: true },
    status: {
      type: String,
      enum: ["running", "done", "failed", "stopped"],
      default: "running",
    },
    stepCount: { type: Number, default: 0 },
    summary: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model<ITask>("Task", TaskSchema);