import mongoose, { Schema, Document } from "mongoose";

export interface IMessage {
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

export interface IConversation extends Document {
  sessionId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    role: { type: String, enum: ["user", "agent"], required: true },
    text: { type: String, required: true },
    timestamp: { type: Number, required: true },
  },
  { _id: false }
);

const ConversationSchema = new Schema<IConversation>(
  {
    sessionId: { type: String, required: true, index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<IConversation>("Conversation", ConversationSchema);