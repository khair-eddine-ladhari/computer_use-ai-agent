import { useDesktopStore } from "@/store/desktopStore";
import type { ToolCall } from "./tools";

export interface ExecutionResult {
  success: boolean;
  message: string;
}

export function executeToolCall(call: ToolCall): ExecutionResult {
  const store = useDesktopStore.getState();

  switch (call.tool) {
    case "open_app":
      store.openApp(call.args.appId);
      return { success: true, message: `Opened ${call.args.appId}` };

    case "close_app": {
      const win = store.windows.find((w) => w.appId === call.args.appId);
      if (!win) {
        return { success: false, message: `${call.args.appId} is not open` };
      }
      store.closeWindow(win.id);
      return { success: true, message: `Closed ${call.args.appId}` };
    }

    case "open_folder":
      // FilesApp currently owns its folder path as local component state,
      // not desktopStore, so there's nothing global to dispatch to yet.
      return {
        success: false,
        message: "open_folder isn't wired up yet — FILE_TREE needs to move into desktopStore first",
      };

    case "open_file":
      return {
        success: false,
        message: "open_file isn't wired up yet — same reason as open_folder",
      };

    case "run_command":
      // Same situation: TerminalApp owns its own command history locally.
      return {
        success: false,
        message: "run_command isn't wired up yet — TerminalApp state is local, not global",
      };

    case "mark_task_complete":
      // This one just needs to pass the summary along, no desktop state to touch.
      return { success: true, message: call.args.summary };

    default: {
      // Exhaustiveness check: if a new ToolCall variant is added to tools.ts
      // and not handled above, TypeScript will error on this line.
      const _exhaustive: never = call;
      return { success: false, message: "Unknown tool call" };
    }
  }
}