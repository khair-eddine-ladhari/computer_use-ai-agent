import type { ChatMessage } from "@/agent/types";
import type { ToolCall } from "@/agent/tools";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export interface AgentResponse {
  reply: ChatMessage;
  toolCalls: ToolCall[];
}

export async function sendMessageToAgent(text: string): Promise<AgentResponse> {
  const res = await fetch(`${API_BASE_URL}/api/agent/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Agent request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}