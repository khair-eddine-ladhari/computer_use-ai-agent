"use client";

import { useState } from "react";
import { ListChecks, MessageSquare } from "lucide-react";
import AgentApp from "@/components/apps/AgentApp";
import ActivityLog from "@/components/agent/ActivityLog";

type Tab = "chat" | "activity";

export default function AgentTabs() {
  const [tab, setTab] = useState<Tab>("chat");

  const tabClass = (t: Tab) =>
    `flex items-center gap-1.5 border-b-2 px-3 py-2 text-xs transition-colors ${
      tab === t
        ? "border-accent text-ink"
        : "border-transparent text-ink-muted hover:text-ink"
    }`;

  return (
    <div className="flex h-full flex-col">
      <nav className="flex shrink-0 border-b border-panel-border">
        <button onClick={() => setTab("chat")} className={tabClass("chat")}>
          <MessageSquare size={12} /> Chat
        </button>
        <button onClick={() => setTab("activity")} className={tabClass("activity")}>
          <ListChecks size={12} /> Activity
        </button>
      </nav>

      <div className="min-h-0 flex-1">
        {/* Chat stays mounted so its messages survive tab switches. */}
        <div className={tab === "chat" ? "h-full" : "hidden"}>
          <AgentApp />
        </div>
        {/* Activity mounts fresh each time, so it reloads the log. */}
        {tab === "activity" && <ActivityLog />}
      </div>
    </div>
  );
}