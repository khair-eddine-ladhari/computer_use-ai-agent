
import mongoose, { Schema, Document } from "mongoose";

export type TaskStatus =
  | "pending"
  | "running"
  | "waiting_approval"
  | "reviewing"
  | "inconclusive"
  | "completed"
  | "failed"
  | "cancelled";

export interface ITask extends Document {
  sessionId: string;
  goal: string;
  status: TaskStatus;

  // Execution progress
  currentStep: number;
  maxSteps: number;
  batchNumber: number;
reviewCount: number;
maxReviews: number;

  // Most recent desktop state, after an action
  latestDesktop?: Record<string, unknown>;

  // Last action verification
  lastActionId?: string;
  lastActionResult?: "success" | "failed" | "blocked";
  lastActionMessage?: string;

  // Existing fields
  result?: string;
  error?: string;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },

    goal: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "pending",
        "running",
        "waiting_approval",
        "completed",
        "failed",
        "cancelled",
      ],
      default: "pending",
      index: true,
    },

    currentStep: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxSteps: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },




    batchNumber: {
  type: Number,
  default: 0,
  min: 0,
},

reviewCount: {
  type: Number,
  default: 0,
  min: 0,
},

maxReviews: {
  type: Number,
  default: 3,
  min: 1,
  max: 10,
},



    latestDesktop: {
      type: Schema.Types.Mixed,
      default: undefined,
    },

    lastActionId: {
      type: String,
    },

    lastActionResult: {
      type: String,
      enum: ["success", "failed", "blocked"],
    },

    lastActionMessage: {
      type: String,
    },

    result: {
      type: String,
    },

    error: {
      type: String,
    },

    startedAt: {
      type: Date,
    },

    finishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Quickly find active tasks belonging to a session.
TaskSchema.index({ sessionId: 1, status: 1 });

export default mongoose.model<ITask>("Task", TaskSchema);
