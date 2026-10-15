import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import Conversation from "../models/Conversation";
import Task from "../models/Task";
import { requireFields } from "../middleware/validation";
import AuditLog from "../models/AuditLog";

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

// How long Node waits for FastAPI before giving up. Keep this LONGER than the
// Python budget (MAX_TOTAL_SECONDS = 60 in crew/crew.py) so Python normally
// answers first with its own clean "model busy" error. This is the backstop
// for when Python is stuck and never answers.
const AGENT_TIMEOUT_MS = 90_000;

const BUSY_MESSAGE = "The model is busy right now. Please try again in a moment.";

// FastAPI sends errors as {"detail": "..."}. Pull the message out of that,
// or fall back to a generic line if the body is anything else.
async function readErrorDetail(agentRes: {
  status: number;
  text(): Promise<string>;
}): Promise<string> {
  const fallback = `agent-server responded with ${agentRes.status}`;
  try {
    const body = JSON.parse(await agentRes.text()) as { detail?: unknown };
    return typeof body.detail === "string" ? body.detail : fallback;
  } catch {
    return fallback;
  }
}

// True when Node itself gave up waiting: our AbortSignal.timeout,
// or one of undici's built-in timeouts (the old HeadersTimeoutError).
function isTimeout(err: unknown): boolean {
  const e = err as { name?: string; cause?: { code?: string } } | null;
  return (
    e?.name === "TimeoutError" ||
    e?.name === "AbortError" ||
    e?.cause?.code === "UND_ERR_HEADERS_TIMEOUT" ||
    e?.cause?.code === "UND_ERR_BODY_TIMEOUT"
  );
}

router.post(
  "/message",
  requireFields(["text", "sessionId"]),
  async (req: Request<{}, {}, AgentMessageBody>, res: Response, next: NextFunction) => {
    const { text, sessionId } = req.body;
    let task = null;

    try {
      // 1. Call the real AI brain — it decides the reply AND classifies
      //    whether this message is casual chat or an actual task.
      //    The timeout makes sure we never wait forever.
      const agentRes = await fetch(`${AGENT_SERVER_URL}/api/agent/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId }),
        signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
      });

      // FastAPI answered, but with an error. Forward its status and message
      // (503 = model busy) instead of throwing a generic "fetch failed".
      if (!agentRes.ok) {
        const detail = await readErrorDetail(agentRes);
        console.error(`agent-server responded with ${agentRes.status}: ${detail}`);

        if (agentRes.status === 503) {
          res.set("Retry-After", "5");
          res.status(503).json({ code: "model_busy", message: detail || BUSY_MESSAGE });
        } else {
          res.status(502).json({ code: "agent_error", message: detail });
        }
        return;
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

      // 3. Log every real tool call the agent made, tied to this session
      //    and (if one exists) this task — this is the safety/audit trail.
      for (const call of toolCalls) {
        await AuditLog.create({
          sessionId,
          taskId: task?.id,
          tool: call.tool,
          args: call.args,
          result: "success",
          timestamp: Date.now(),
        });
      }

      // 4. Persist the conversation either way — chat or task,
      //    every message still belongs in the chat history.
      const userMessage = { role: "user" as const, text, timestamp: Date.now() };
      const agentMessage = { role: "agent" as const, text: replyText, timestamp: Date.now() };

      let conversation = await Conversation.findOne({ sessionId });
      if (!conversation) {
        conversation = new Conversation({ sessionId, messages: [] });
      }
      conversation.messages.push(userMessage, agentMessage);
      await conversation.save();

      // 5. If a Task was created, mark it completed now that the
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

      // Node gave up waiting for FastAPI: tell the UI the model is busy.
      if (isTimeout(err)) {
        res.set("Retry-After", "5");
        res.status(503).json({ code: "model_busy", message: BUSY_MESSAGE });
        return;
      }

      // FastAPI isn't reachable at all (not running, wrong port, connection refused).
      if (err instanceof TypeError && err.message === "fetch failed") {
        res.status(502).json({
          code: "agent_unreachable",
          message: "Couldn't reach the agent server. Is it running?",
        });
        return;
      }

      // Anything else (database errors, bugs) still goes to your existing error handler.
      next(err);
    }
  }
);

export default router;