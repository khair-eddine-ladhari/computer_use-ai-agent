import type { ChatMessage } from "@/agent/types";
import type { ToolCall } from "@/agent/tools";

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
  toolCalls: ToolCall[];
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