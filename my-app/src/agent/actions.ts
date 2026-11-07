import type { ToolCall } from "./tools";

// A tool call as sent by server-web: the same action, plus its audit-log id
// and whether a human must approve it first.
export type ServerToolCall = ToolCall & { id: string; requiresApproval: boolean };