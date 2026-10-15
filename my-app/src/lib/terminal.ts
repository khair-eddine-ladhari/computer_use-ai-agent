export const CLEAR_SIGNAL = "__CLEAR__";

export function runCommand(command: string): string {
  const cmd = command.trim();

  if (cmd === "") return "";
  if (cmd === "help") return "Available commands: help, whoami, date, ls, clear";
  if (cmd === "whoami") return "user";
  if (cmd === "date") return new Date().toString();
  if (cmd === "ls") return "Documents  Downloads  Pictures";
  if (cmd === "clear") return CLEAR_SIGNAL;

  return `command not found: ${cmd}`;
}