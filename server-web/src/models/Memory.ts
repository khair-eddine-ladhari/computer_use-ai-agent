import mongoose, { Schema, Document } from "mongoose";

export interface IMemory extends Document {
  sessionId: string;
  key: string;
  value: string;
  createdAt: Date;
  updatedAt: Date;
}

const MemorySchema = new Schema<IMemory>(
  {
    sessionId: { type: String, required: true, index: true },
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { timestamps: true }
);

// One key per session should be unique — writing "cv_location" twice
// should update the existing fact, not create a duplicate.
MemorySchema.index({ sessionId: 1, key: 1 }, { unique: true });

export default mongoose.model<IMemory>("Memory", MemorySchema);