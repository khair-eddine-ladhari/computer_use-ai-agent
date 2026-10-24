import type { ToolCall } from "./tools";

export function describeToolCall(call: ToolCall): string {
  switch (call.tool) {
    case "open_app":
      return `Open the ${call.args.appId} app`;
    case "close_app":
      return `Close the ${call.args.appId} app`;
    case "open_folder":
      return `Open the folder ${call.args.path.join("/")}`;
    case "open_file":
      return `Open ${call.args.path.join("/")}/${call.args.fileName}`;
    case "run_command":
      return `Run "${call.args.command}" in the terminal`;
    case "mark_task_complete":
      return call.args.summary;
    default:
      return "Unknown action";
  }
}