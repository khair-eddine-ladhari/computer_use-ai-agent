export type AppId = "files" | "browser" | "terminal" | "agent";

export interface WindowState {
  id: string;
  appId: AppId;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isMinimized: boolean;
  zIndex: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  timestamp: number;
}

export interface FileNode {
  name: string;
  type: "folder" | "file";
  children?: FileNode[];
}

export interface TerminalLine {
  type: "input" | "output";
  text: string;
}