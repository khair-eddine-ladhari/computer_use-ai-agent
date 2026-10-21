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

// How many earlier messages the agent gets to see with each request.
const HISTORY_LIMIT = 10;

// How long Node waits for FastAPI before giving up. Keep this LONGER than the
// Python budget so Python normally answers first with its own clean error.
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
// or one of undici's built-in timeouts.
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
      // 1. Load this session's conversation BEFORE calling the agent, and take
      //    the most recent messages as its memory. The new message isn't saved
      //    yet, so history only contains what came before it.
      let conversation = await Conversation.findOne({ sessionId });
      const history = (conversation?.messages ?? [])
        .slice(-HISTORY_LIMIT)
        .map((m) => ({ role: m.role, text: m.text }));


      // 2. Call the AI brain with the history. It decides the reply AND
      //    classifies whether this message is chat or a task.
      const agentRes = await fetch(`${AGENT_SERVER_URL}/api/agent/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId, history }),
        signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
      });

      // FastAPI answered with an error: forward its status and message.
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

      // 3. Only real tasks get a Task document ("hi" stays out of Task history).
      if (agentData.messageType === "task") {
        task = new Task({
          sessionId,
          goal: text,
          status: "running",
          startedAt: new Date(),
        });
        await task.save();
      }

      // 4. Audit trail for every real tool call.
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

      // 5. Save the new exchange to the conversation.
      const userMessage = { role: "user" as const, text, timestamp: Date.now() };
      const agentMessage = { role: "agent" as const, text: replyText, timestamp: Date.now() };

      if (!conversation) {
        conversation = new Conversation({ sessionId, messages: [] });
      }
      conversation.messages.push(userMessage, agentMessage);
      await conversation.save();

      // 6. Mark the task completed.
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
      // Don't leave a Task stuck as "running" if something failed.
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

      // FastAPI isn't reachable at all.
      if (err instanceof TypeError && err.message === "fetch failed") {
        res.status(502).json({
          code: "agent_unreachable",
          message: "Couldn't reach the agent server. Is it running?",
        });
        return;
      }

      // Anything else (database errors, bugs) goes to the error handler.
      next(err);
    }
  }
);

router.get("/history/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const conversation = await Conversation.findOne({ sessionId: req.params.sessionId });
    res.json({ messages: conversation?.messages ?? [] });
  } catch (err) {
    next(err);
  }
});




router.get("/activity/:sessionId", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    const [logs, tasks] = await Promise.all([
      AuditLog.find({ sessionId }).sort({ timestamp: -1 }).limit(50).lean(),
      Task.find({ sessionId }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const goals = new Map(tasks.map((t) => [String(t._id), t.goal]));

    res.json({
      actions: logs.map((l) => ({
        id: String(l._id),
        tool: l.tool,
        args: l.args,
        result: l.result,
        message: l.message,
        timestamp: l.timestamp,
        goal: l.taskId ? goals.get(l.taskId) ?? null : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});
export default router;