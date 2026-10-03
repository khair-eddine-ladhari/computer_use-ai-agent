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
  const res = await fetch(`${API_BASE_URL}/api/agent/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sessionId: getSessionId() }),
  });

  if (!res.ok) {
    throw new Error(`Agent request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}