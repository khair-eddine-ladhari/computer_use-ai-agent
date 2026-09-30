import express, { Request, Response } from "express";
import crypto from "crypto";
import Conversation from "../models/Conversation";
import { requireFields } from "../middleware/validation";

const router = express.Router();

interface AgentMessageBody {
  text: string;
  sessionId: string;
}

router.post(
  "/message",
  requireFields(["text", "sessionId"]),
  async (req: Request<{}, {}, AgentMessageBody>, res: Response, next) => {
    const { text, sessionId } = req.body;

    const lower = text.toLowerCase().trim();
    let replyText: string;

    if (["hi", "hello", "hey"].includes(lower)) {
      replyText = "Hey! I'm saved to MongoDB now, but still no AI brain connected.";
    } else {
      replyText = `(server fake reply, now persisted) I received: "${text}"`;
    }

    const userMessage = { role: "user" as const, text, timestamp: Date.now() };
    const agentMessage = { role: "agent" as const, text: replyText, timestamp: Date.now() };

    try {
      let conversation = await Conversation.findOne({ sessionId });
      if (!conversation) {
        conversation = new Conversation({ sessionId, messages: [] });
      }

      conversation.messages.push(userMessage, agentMessage);
      await conversation.save();

      res.json({
        reply: { id: crypto.randomUUID(), ...agentMessage },
        toolCalls: [],
      });
    } catch (err) {
      next(err); // hands off to errorHandler instead of duplicating error logic here
    }
  }
);

export default router;