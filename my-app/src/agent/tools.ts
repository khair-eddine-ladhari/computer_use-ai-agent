import type { AppId } from "./types";

export type ToolName =
  | "open_app"
  | "close_app"
  | "open_folder"
  | "open_file"
  | "run_command"
  | "mark_task_complete";

interface OpenAppCall {
  tool: "open_app";
  args: { appId: AppId };
}
interface CloseAppCall {
  tool: "close_app";
  args: { appId: AppId };
}
interface OpenFolderCall {
  tool: "open_folder";
  args: { path: string[] };
}
interface OpenFileCall {
  tool: "open_file";
  args: { path: string[]; fileName: string };
}
interface RunCommandCall {
  tool: "run_command";
  args: { command: string };
}
interface MarkTaskCompleteCall {
  tool: "mark_task_complete";
  args: { summary: string };
}

export type ToolCall =
  | OpenAppCall
  | CloseAppCall
  | OpenFolderCall
  | OpenFileCall
  | RunCommandCall
  | MarkTaskCompleteCall;