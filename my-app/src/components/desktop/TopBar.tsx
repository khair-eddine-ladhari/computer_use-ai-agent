"use client";

import { useEffect, useState } from "react";
import { Wifi, Volume2, BatteryFull } from "lucide-react";

export default function TopBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(interval);
  }, []);

  const timeLabel = now
    ? now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "";
  const dateLabel = now
    ? now.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" })
    : "";

  return (
    <header className="chrome-panel fixed inset-x-0 top-0 z-50 flex h-10 items-center justify-between px-5 text-xs text-slate-100">
      <div className="flex items-center gap-2 font-medium tracking-wide">
        <span>{dateLabel}</span>
        <span className="text-slate-400">{timeLabel}</span>
      </div>

      {/* Right: status icons */}
      <div className="flex items-center gap-3 text-slate-400" aria-label="System status">
        <Wifi size={15} />
        <Volume2 size={15} />
        <BatteryFull size={15} />
      </div>
    </header>
  );
}
