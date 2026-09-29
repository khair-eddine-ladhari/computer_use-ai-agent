import { create } from "zustand";
import type { AppId, WindowState } from "@/agent/types";

const APP_TITLES: Record<AppId, string> = {
  files: "Files",
  browser: "Browser",
  terminal: "Terminal",
  agent: "Agent",
};

const DEFAULT_SIZE: Record<AppId, { width: number; height: number }> = {
  files: { width: 640, height: 420 },
  browser: { width: 800, height: 520 },
  terminal: { width: 600, height: 360 },
  agent: { width: 420, height: 600 },
};

interface DesktopState {
  windows: WindowState[];
  nextZIndex: number;
  openApp: (appId: AppId) => void;
  closeApp: (appId: AppId) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
}

export const useDesktopStore = create<DesktopState>((set, get) => ({
  windows: [],
  nextZIndex: 1,

  openApp: (appId) => {
    const existing = get().windows.find((w) => w.appId === appId);
    if (existing) {
      get().focusWindow(existing.id);
      return;
    }

    const { width, height } = DEFAULT_SIZE[appId];
    const offset = get().windows.length * 24;

    set((state) => ({
      windows: [
        ...state.windows,
        {
          id: crypto.randomUUID(),
          appId,
          title: APP_TITLES[appId],
          x: 160 + offset,
          y: 80 + offset,
          width,
          height,
          isMinimized: false,
          zIndex: state.nextZIndex,
        },
      ],
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  closeApp: (appId) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.appId !== appId),
    }));
  },

  closeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
    }));
  },

  focusWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id
          ? { ...w, zIndex: state.nextZIndex, isMinimized: false }
          : w
      ),
      nextZIndex: state.nextZIndex + 1,
    }));
  },

  minimizeWindow: (id) => {
    set((state) => ({
      windows: state.windows.map((w) =>
        w.id === id ? { ...w, isMinimized: true } : w
      ),
    }));
  },

  moveWindow: (id, x, y) => {
    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    }));
  },
}));
