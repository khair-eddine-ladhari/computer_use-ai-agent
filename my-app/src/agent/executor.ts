import { useDesktopStore } from "@/store/desktopStore";
import { resolvePath } from "@/lib/fileSystem";
import type { AppId } from "./types";
import type { ToolCall } from "./tools";

export interface ExecutionResult {
  success: boolean;
  message: string;
}

const VALID_APPS: AppId[] = ["files", "browser", "terminal", "agent"];

export function executeToolCall(call: ToolCall): ExecutionResult {
  const store = useDesktopStore.getState();

  switch (call.tool) {
    case "open_app": {
      if (!VALID_APPS.includes(call.args.appId)) {
        return { success: false, message: `Unknown app: ${call.args.appId}` };
      }
      store.openApp(call.args.appId);
      return { success: true, message: `Opened ${call.args.appId}` };
    }

    case "close_app": {
      const win = store.windows.find((w) => w.appId === call.args.appId);
      if (!win) {
        return { success: false, message: `${call.args.appId} is not open` };
      }
      store.closeWindow(win.id);
      return { success: true, message: `Closed ${call.args.appId}` };
    }

    case "open_folder": {
      const resolved = resolvePath(call.args.path);
      if (!resolved || resolved.node.type !== "folder") {
        return { success: false, message: `Folder not found: ${call.args.path.join("/")}` };
      }
      store.openApp("files");
      store.setFilesPath(resolved.path);
      return { success: true, message: `Opened folder ${resolved.path.join("/")}` };
    }

    case "open_file": {
      const folder = resolvePath(call.args.path);
      if (!folder || folder.node.type !== "folder") {
        return { success: false, message: `Folder not found: ${call.args.path.join("/")}` };
      }
      const file = folder.node.children?.find(
        (c) => c.type === "file" && c.name.toLowerCase() === call.args.fileName.toLowerCase()
      );
      if (!file) {
        return {
          success: false,
          message: `File ${call.args.fileName} not found in ${folder.path.join("/")}`,
        };
      }
      store.openApp("files");
      store.setFilesPath(folder.path);
      store.selectFile(file.name);
      return { success: true, message: `Opened ${folder.path.join("/")}/${file.name}` };
    }

    case "run_command": {
      store.openApp("terminal");
      store.runTerminalCommand(call.args.command);
      return { success: true, message: `Ran: ${call.args.command}` };
    }

    case "mark_task_complete":
      return { success: true, message: call.args.summary };

    default: {
      const _exhaustive: never = call;
      return { success: false, message: "Unknown tool call" };
    }
  }
}