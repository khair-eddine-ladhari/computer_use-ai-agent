"use client";

import { useDesktopStore } from "@/store/desktopStore";
import { AnimatePresence } from "framer-motion";
import Window from "@/components/window/Window";
import FilesApp from "@/components/apps/FilesApp";
import BrowserApp from "@/components/apps/BrowserApp";
import TerminalApp from "@/components/apps/TerminalApp";
import AgentApp from "@/components/apps/AgentApp";
import type { AppId } from "@/agent/types";

const APP_COMPONENTS: Record<AppId, React.ComponentType> = {
  files: FilesApp,
  browser: BrowserApp,
  terminal: TerminalApp,
  agent: AgentApp,
};

export default function WindowManager() {
  const windows = useDesktopStore((state) => state.windows);

  return (
    <AnimatePresence initial={false}>
      {windows.filter((win) => !win.isMinimized).map((win) => {
        const AppContent = APP_COMPONENTS[win.appId];
        return (
          <Window key={win.id} window={win}>
            <AppContent />
          </Window>
        );
      })}
    </AnimatePresence>
  );
}
