import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import Conversation from "../models/Conversation";
import Task from "../models/Task";
import { requireFields } from "../middleware/validation";

const router = express.Router();

interface AgentMessageBody {
  text: string;
  sessionId: string;
}

interface AgentServerResponse {
  reply: { id: string; role: string; text: string; timestamp: number };
  toolCalls: Array<{ tool: string; args: Record<string, unknown> }>;
  messageType: "chat" | "task";
}

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || "http://localhost:8000";

router.post(
  "/message",
  requireFields(["text", "sessionId"]),
  async (req: Request<{}, {}, AgentMessageBody>, res: Response, next: NextFunction) => {
    const { text, sessionId } = req.body;
    let task = null;

    try {
      // 1. Call the real AI brain — it decides the reply AND classifies
      //    whether this message is casual chat or an actual task.
      const agentRes = await fetch(`${AGENT_SERVER_URL}/api/agent/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId }),
      });

      if (!agentRes.ok) {
        throw new Error(`agent-server responded with ${agentRes.status}`);
      }

      const agentData = (await agentRes.json()) as AgentServerResponse;
      const replyText = agentData.reply.text;
      const toolCalls = agentData.toolCalls || [];

      // 2. Only create a Task document if the agent classified this
      //    as an actual task, not plain chat (e.g. "hi" stays out of Task history).
      if (agentData.messageType === "task") {
        task = new Task({
          sessionId,
          goal: text,
          status: "running",
          startedAt: new Date(),
        });
        await task.save();
      }

      // 3. Persist the conversation either way — chat or task,
      //    every message still belongs in the chat history.
      const userMessage = { role: "user" as const, text, timestamp: Date.now() };
      const agentMessage = { role: "agent" as const, text: replyText, timestamp: Date.now() };

      let conversation = await Conversation.findOne({ sessionId });
      if (!conversation) {
        conversation = new Conversation({ sessionId, messages: [] });
      }
      conversation.messages.push(userMessage, agentMessage);
      await conversation.save();

      // 4. If a Task was created, mark it completed now that the
      //    agent has finished responding.
      if (task) {
        task.status = "completed";
        task.result = replyText;
        task.finishedAt = new Date();
        await task.save();
      }

      res.json({
        reply: { id: crypto.randomUUID(), ...agentMessage },
        toolCalls,
      });
    } catch (err) {
      // If something failed partway through and a Task was already
      // created, mark it failed rather than leaving it stuck as "running".
      if (task) {
        task.status = "failed";
        task.error = err instanceof Error ? err.message : "Unknown error";
        task.finishedAt = new Date();
        await task.save().catch(() => {});
      }

      console.error("Failed to process agent message:", err);
      next(err);
    }
  }
);

export default router;