import type { ChatMessage } from "@/agent/types";
import type { ServerToolCall } from "@/agent/actions";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function getSessionId(): string {
  const key = "computer-agent-session-id";
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
}

export interface AgentResponse {
  reply: ChatMessage;
  toolCalls: ServerToolCall[];
}

export async function sendMessageToAgent(text: string): Promise<AgentResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 100_000);

  try {
    const res = await fetch(`${API_BASE_URL}/api/agent/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sessionId: getSessionId() }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Agent request failed: ${res.status} ${res.statusText}`);
    }

    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadHistory(): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/api/agent/history/${getSessionId()}`);
  if (!res.ok) return [];

  const data = (await res.json()) as {
    messages: Array<{ role: "user" | "agent"; text: string; timestamp: number }>;
  };

  return data.messages.slice(-50).map((m) => ({
    id: crypto.randomUUID(),
    role: m.role,
    text: m.text,
    timestamp: m.timestamp,
  }));
}

export interface ActivityEntry {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  result: "pending" | "success" | "failed" | "blocked";
  message?: string;
  timestamp: number;
  goal: string | null;
}

export async function loadActivity(): Promise<ActivityEntry[]> {
  const res = await fetch(`${API_BASE_URL}/api/agent/activity/${getSessionId()}`);
  if (!res.ok) return [];

  const data = (await res.json()) as { actions: ActivityEntry[] };
  return data.actions;
}

// Approve, reject, and result calls. They return true if the server accepted it.
async function postAction(path: string, body?: unknown): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/agent/actions/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export const approveAction = (id: string) => postAction(`${id}/approve`);
export const rejectAction = (id: string) => postAction(`${id}/reject`);
export const reportActionResult = (
  id: string,
  result: "success" | "failed",
  message?: string
) => postAction(`${id}/result`, { result, message });