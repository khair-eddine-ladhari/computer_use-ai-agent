"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { loadActivity, type ActivityEntry } from "@/lib/api";

function describe(e: ActivityEntry): string {
  const a = e.args as {
    appId?: string;
    path?: string[];
    fileName?: string;
    command?: string;
  };

  switch (e.tool) {
    case "open_app":
      return `Opened the ${a.appId} app`;
    case "close_app":
      return `Closed the ${a.appId} app`;
    case "open_folder":
      return `Opened folder ${a.path?.join("/")}`;
    case "open_file":
      return `Opened ${a.path?.join("/")}/${a.fileName}`;
    case "run_command":
      return `Ran "${a.command}" in the terminal`;
    default:
      return e.tool;
  }
}

const RESULT_STYLE: Record<ActivityEntry["result"], string> = {
  pending: "text-ink-muted",
  success: "text-emerald-400",
  failed: "text-red-400",
  blocked: "text-amber-400",
};

export default function ActivityLog() {
  const [entries, setEntries] = useState<ActivityEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      setEntries(await loadActivity());
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-panel-border px-3 py-2 text-xs text-ink-muted">
        <span>Last {entries?.length ?? 0} actions</span>
        <button
          onClick={refresh}
          disabled={loading}
          aria-label="Refresh activity"
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-panel-light disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="themed-scroll flex-1 space-y-2 overflow-auto p-3">
        {entries && entries.length === 0 && (
          <p className="pt-6 text-center text-xs text-ink-muted">
            No actions yet. Ask the agent to open something.
          </p>
        )}

        {entries?.map((e) => (
          <div key={e.id} className="rounded-lg bg-panel-light px-3 py-2 text-xs">
            <div className="flex items-start justify-between gap-2">
              <span className="text-ink">{describe(e)}</span>
              <span className={`shrink-0 ${RESULT_STYLE[e.result]}`}>{e.result}</span>
            </div>
            {e.goal && (
              <div className="mt-1 truncate text-ink-muted">Asked: {e.goal}</div>
            )}
            <div className="mt-1 text-ink-muted">
              {new Date(e.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}