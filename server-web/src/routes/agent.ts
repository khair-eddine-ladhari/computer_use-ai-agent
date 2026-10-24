import express, { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import mongoose from "mongoose";
import Conversation from "../models/Conversation";
import Task from "../models/Task";
import AuditLog from "../models/AuditLog";
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

// What the browser receives for each action.
interface ClientAction {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  requiresApproval: boolean;
}

const AGENT_SERVER_URL = process.env.AGENT_SERVER_URL || "http://localhost:8000";
const HISTORY_LIMIT = 10;
const AGENT_TIMEOUT_MS = 90_000;
const BUSY_MESSAGE = "The model is busy right now. Please try again in a moment.";

// Tools that need a human's OK before they run.
// Decided here, in code. The model can't change this list.
const APPROVAL_TOOLS = new Set(["run_command"]);

function describeCall(call: { tool: string; args: Record<string, unknown> }): string {
  if (call.tool === "run_command") {
    return `run "${String(call.args.command)}" in the terminal`;
  }
  return call.tool;
}

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
      // 1. Load recent history BEFORE saving the new message.
      let conversation = await Conversation.findOne({ sessionId });
      const history = (conversation?.messages ?? [])
        .slice(-HISTORY_LIMIT)
        .map((m) => ({ role: m.role, text: m.text }));

      // 2. Ask the AI brain.
      const agentRes = await fetch(`${AGENT_SERVER_URL}/api/agent/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sessionId, history }),
        signal: AbortSignal.timeout(AGENT_TIMEOUT_MS),
      });

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
      const toolCalls = agentData.toolCalls || [];

      // 3. Only real tasks get a Task document.
      if (agentData.messageType === "task") {
        task = new Task({
          sessionId,
          goal: text,
          status: "running",
          startedAt: new Date(),
        });
        await task.save();
      }

      // 4. Log each action as "pending". The browser reports the real
      //    outcome later, or a human approves or rejects it first.
      const actions: ClientAction[] = [];
      for (const call of toolCalls) {
        const requiresApproval = APPROVAL_TOOLS.has(call.tool);
        const log = await AuditLog.create({
          sessionId,
          taskId: task?.id,
          tool: call.tool,
          args: call.args,
          result: "pending",
          requiresApproval,
          approved: false,
          timestamp: Date.now(),
        });
        actions.push({
          id: String(log._id),
          tool: call.tool,
          args: call.args,
          requiresApproval,
        });
      }

      // If something is waiting for approval, don't let the reply claim it's done.
      const waiting = actions.filter((a) => a.requiresApproval);
      const replyText = waiting.length
        ? `I need your approval to ${waiting.map(describeCall).join(" and ")}.`
        : agentData.reply.text;

      // 5. Save the new exchange.
      const userMessage = { role: "user" as const, text, timestamp: Date.now() };
      const agentMessage = { role: "agent" as const, text: replyText, timestamp: Date.now() };

      if (!conversation) {
        conversation = new Conversation({ sessionId, messages: [] });
      }
      conversation.messages.push(userMessage, agentMessage);
      await conversation.save();

      if (task) {
        task.status = "completed";
        task.result = replyText;
        task.finishedAt = new Date();
        await task.save();
      }

      res.json({
        reply: { id: crypto.randomUUID(), ...agentMessage },
        toolCalls: actions,
      });
    } catch (err) {
      if (task) {
        task.status = "failed";
        task.error = err instanceof Error ? err.message : "Unknown error";
        task.finishedAt = new Date();
        await task.save().catch(() => {});
      }

      console.error("Failed to process agent message:", err);

      if (isTimeout(err)) {
        res.set("Retry-After", "5");
        res.status(503).json({ code: "model_busy", message: BUSY_MESSAGE });
        return;
      }

      if (err instanceof TypeError && err.message === "fetch failed") {
        res.status(502).json({
          code: "agent_unreachable",
          message: "Couldn't reach the agent server. Is it running?",
        });
        return;
      }

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

// A human said yes. The browser may now run the action.
router.post(
  "/actions/:id/approve",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ error: "Invalid action id" });
        return;
      }

      const log = await AuditLog.findOneAndUpdate(
        { _id: id, result: "pending", requiresApproval: true },
        { approved: true },
        { new: true }
      );
      if (!log) {
        res.status(409).json({ error: "Action is not waiting for approval" });
        return;
      }

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// A human said no. Nothing runs, and the log records it as blocked.
router.post(
  "/actions/:id/reject",
  async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ error: "Invalid action id" });
        return;
      }

      const log = await AuditLog.findOneAndUpdate(
        { _id: id, result: "pending", requiresApproval: true },
        { result: "blocked", message: "rejected by user" },
        { new: true }
      );
      if (!log) {
        res.status(409).json({ error: "Action is not waiting for approval" });
        return;
      }

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// The browser reports what actually happened when it ran the action.
router.post(
  "/actions/:id/result",
  async (
    req: Request<{ id: string }, {}, { result?: string; message?: string }>,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { result, message } = req.body;

      if (!mongoose.isValidObjectId(id)) {
        res.status(400).json({ error: "Invalid action id" });
        return;
      }
      if (result !== "success" && result !== "failed") {
        res.status(400).json({ error: "result must be 'success' or 'failed'" });
        return;
      }

      // Refuses if the action is already finished, or if it needs approval and has none.
      const log = await AuditLog.findOneAndUpdate(
        {
          _id: id,
          result: "pending",
          $or: [{ requiresApproval: false }, { approved: true }],
        },
        {
          result,
          message: typeof message === "string" ? message.slice(0, 300) : undefined,
        },
        { new: true }
      );
      if (!log) {
        res.status(409).json({ error: "Action is finished or still needs approval" });
        return;
      }

      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;