"use client";

import { useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Folder, Globe, Terminal, Bot } from "lucide-react";
import { useDesktopStore } from "@/store/desktopStore";
import type { AppId } from "@/agent/types";

const DOCK_APPS: { id: AppId; label: string; icon: React.ElementType }[] = [
  { id: "files", label: "Files", icon: Folder },
  { id: "browser", label: "Browser", icon: Globe },
  { id: "terminal", label: "Terminal", icon: Terminal },
  { id: "agent", label: "Agent", icon: Bot },
];

export default function Dock() {
  const openApp = useDesktopStore((state) => state.openApp);
  const closeApp = useDesktopStore((state) => state.closeApp);
  const windows = useDesktopStore((state) => state.windows);
  const dockRef = useRef<HTMLElement>(null);

  const openApps = useMemo(() => windows.map((w) => w.appId), [windows]);

  useEffect(() => {
    const dock = dockRef.current;
    if (!dock) return;

    const context = gsap.context(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduceMotion) return;

      gsap.fromTo(
        ".dock-shell",
        { y: 22, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.55, ease: "power3.out" },
      );
      gsap.fromTo(
        ".dock-item",
        { opacity: 0 },
        { opacity: 1, duration: 0.35, stagger: 0.07, delay: 0.12, ease: "power2.out" },
      );
    }, dock);

    return () => context.revert();
  }, []);

  return (
    <nav ref={dockRef} aria-label="Applications" className="fixed bottom-5 left-1/2 z-40 -translate-x-1/2">
      <div className="dock-shell chrome-panel flex items-center gap-1.5 rounded-2xl p-2 shadow-window">
        {DOCK_APPS.map(({ id, label, icon: Icon }) => {
          const isOpen = openApps.includes(id);
          const isVisible = windows.some((win) => win.appId === id && !win.isMinimized);
          return (
            <motion.button
              key={id}
              onClick={() => (isVisible ? closeApp(id) : openApp(id))}
              onDoubleClick={(event) => {
                event.preventDefault();
                closeApp(id);
              }}
              title={`${label} (click to open or close)`}
              aria-label={`${isVisible ? "Close" : "Open"} ${label}`}
              className="dock-item group relative flex h-12 w-12 items-center justify-center rounded-xl text-slate-300 transition-colors hover:bg-slate-700/70 hover:text-white"
              whileHover={{ y: -4, scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              <Icon size={21} />
              {isOpen && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-accent" />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
