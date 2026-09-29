"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { X, Minus } from "lucide-react";
import { useDesktopStore } from "@/store/desktopStore";
import type { WindowState } from "@/agent/types";

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export default function Window({ window: win, children }: WindowProps) {
  const closeWindow = useDesktopStore((s) => s.closeWindow);
  const focusWindow = useDesktopStore((s) => s.focusWindow);
  const minimizeWindow = useDesktopStore((s) => s.minimizeWindow);
  const moveWindow = useDesktopStore((s) => s.moveWindow);

  const dragOffset = useRef<{ x: number; y: number } | null>(null);

  function handleDragStart(e: React.MouseEvent) {
    focusWindow(win.id);
    dragOffset.current = { x: e.clientX - win.x, y: e.clientY - win.y };

    function handleDragMove(ev: MouseEvent) {
      if (!dragOffset.current) return;
      moveWindow(win.id, ev.clientX - dragOffset.current.x, ev.clientY - dragOffset.current.y);
    }

    function handleDragEnd() {
      dragOffset.current = null;
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    }

    document.addEventListener("mousemove", handleDragMove);
    document.addEventListener("mouseup", handleDragEnd);
  }

  return (
    <motion.div
      className="glass-panel absolute flex flex-col overflow-hidden rounded-xl shadow-window"
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, y: 8 }}
      transition={{ type: "spring", stiffness: 340, damping: 30, opacity: { duration: 0.16 } }}
      style={{
        left: win.x,
        top: win.y,
        width: win.width,
        height: win.height,
        zIndex: win.zIndex,
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar — drag handle */}
      <div
        onMouseDown={handleDragStart}
        className="flex h-11 shrink-0 cursor-grab items-center justify-between border-b border-panel-border px-4 active:cursor-grabbing"
      >
        <span className="text-xs font-semibold tracking-wide text-ink">{win.title}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => minimizeWindow(win.id)}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={`Minimize ${win.title}`}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-panel-light hover:text-ink"
          >
            <Minus size={12} className="text-ink-muted" />
          </button>
          <button
            onClick={() => closeWindow(win.id)}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={`Close ${win.title}`}
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-red-900/80 hover:text-white"
          >
            <X size={12} className="text-ink-muted" />
          </button>
        </div>
      </div>

      {/* App content goes here */}
      <div className="themed-scroll flex-1 overflow-auto">{children}</div>
    </motion.div>
  );
}
