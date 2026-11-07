import { useDesktopStore } from "@/store/desktopStore";
import { resolvePath } from "@/lib/fileSystem";
import type { AppId } from "@/agent/types";

export interface DesktopSnapshot {
  openWindows: Array<{ app: AppId; minimized: boolean; focused: boolean }>;
  files: { path: string; contents: string[]; selectedFile: string | null } | null;
  terminal: { lastLines: string[] } | null;
}

const TERMINAL_LINES = 8;

// A plain-data summary of what is on screen right now.
// Read with getState() at send time, so it is never stale.
export function getDesktopSnapshot(): DesktopSnapshot {
  const s = useDesktopStore.getState();

  const visible = s.windows.filter((w) => !w.isMinimized);
  const top = visible.length
    ? visible.reduce((a, b) => (a.zIndex > b.zIndex ? a : b))
    : null;

  const openWindows = s.windows.map((w) => ({
    app: w.appId,
    minimized: w.isMinimized,
    focused: top?.id === w.id,
  }));

  let files: DesktopSnapshot["files"] = null;
  if (s.windows.some((w) => w.appId === "files")) {
    const resolved = resolvePath(s.filesPath);
    files = {
      path: (resolved?.path ?? s.filesPath).join("/"),
      contents: (resolved?.node.children ?? []).map((c) =>
        c.type === "folder" ? `${c.name}/` : c.name
      ),
      selectedFile: s.selectedFile,
    };
  }

  let terminal: DesktopSnapshot["terminal"] = null;
  if (s.windows.some((w) => w.appId === "terminal")) {
    terminal = {
      lastLines: s.terminalHistory
        .slice(-TERMINAL_LINES)
        .map((l) => (l.type === "input" ? `$ ${l.text}` : l.text).slice(0, 200)),
    };
  }

  return { openWindows, files, terminal };
}