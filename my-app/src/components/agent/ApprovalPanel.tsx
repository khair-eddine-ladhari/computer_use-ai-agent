"use client";

import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useAgentStore } from "@/store/agentStore";
import { approveAction, rejectAction } from "@/lib/api";
import { runAndReport } from "@/agent/runToolCalls";
import { describeToolCall } from "@/agent/describe";
import type { ServerToolCall } from "@/agent/actions";

function ApprovalCard({ call }: { call: ServerToolCall }) {
  const removePending = useAgentStore((s) => s.removePending);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setBusy(true);
    setError(null);

    const ok = await approveAction(call.id);
    if (!ok) {
      setError("Couldn't approve this. Try again, or dismiss it.");
      setBusy(false);
      return;
    }

    await runAndReport(call);
    removePending(call.id);
  }

  async function handleReject() {
    setBusy(true);
    setError(null);

    const ok = await rejectAction(call.id);
    if (!ok) {
      setError("Couldn't reject this. Try again, or dismiss it.");
      setBusy(false);
      return;
    }

    removePending(call.id);
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-panel-light p-3 text-xs">
      <div className="flex items-start gap-2">
        <ShieldAlert size={14} className="mt-0.5 shrink-0 text-amber-400" />
        <div className="min-w-0">
          <div className="text-ink-muted">The agent wants to:</div>
          <div className="break-words font-medium text-ink">{describeToolCall(call)}</div>
        </div>
      </div>

      {error && <div className="mt-2 text-red-400">{error}</div>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleApprove}
          disabled={busy}
          className="rounded-md bg-accent px-3 py-1.5 text-white hover:bg-accent-hover disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={handleReject}
          disabled={busy}
          className="rounded-md border border-panel-border px-3 py-1.5 text-ink hover:bg-panel disabled:opacity-50"
        >
          Reject
        </button>
        {error && (
          <button
            onClick={() => removePending(call.id)}
            className="px-2 py-1.5 text-ink-muted hover:text-ink"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

export default function ApprovalPanel() {
  const pending = useAgentStore((s) => s.pending);

  if (pending.length === 0) return null;

  return (
    <div className="shrink-0 space-y-2 border-b border-panel-border bg-amber-500/5 p-3">
      {pending.map((call) => (
        <ApprovalCard key={call.id} call={call} />
      ))}
    </div>
  );
}