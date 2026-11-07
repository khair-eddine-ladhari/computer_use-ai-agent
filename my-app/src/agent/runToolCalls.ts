import { executeToolCall } from "@/agent/executor";
import { reportActionResult } from "@/lib/api";
import { useAgentStore } from "@/store/agentStore";
import type { ServerToolCall } from "@/agent/actions";
import { getDesktopSnapshot } from "@/lib/snapshot";
// Runs one action on the desktop, then tells the server how it went.
export async function runAndReport(call: ServerToolCall): Promise<void> {
  let success = false;
  let message = "";

  try {
    const result = executeToolCall(call);
    success = result.success;
    message = result.message;
  } catch (err) {
    message = err instanceof Error ? err.message : "Unknown error";
  }

  const desktop = getDesktopSnapshot();

  await reportActionResult(
  call.id,
  success ? "success" : "failed",
  message,
  desktop);
}

// Safe actions run right away. Risky ones wait in the approval list.
export async function processToolCalls(
  calls: ServerToolCall[]
): Promise<void> {
  const waiting = calls.filter(c => c.requiresApproval);

  if (waiting.length > 0) {
    useAgentStore.getState().addPending(waiting);
  }

  for (const call of calls) {
    if (!call.requiresApproval) {
      await runAndReport(call);
    }
  }
}