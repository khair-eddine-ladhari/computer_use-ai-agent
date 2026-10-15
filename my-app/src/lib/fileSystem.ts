import type { FileNode } from "@/agent/types";

export const FILE_TREE: FileNode = {
  name: "Home",
  type: "folder",
  children: [
    {
      name: "Documents",
      type: "folder",
      children: [
        { name: "CV.pdf", type: "file" },
        { name: "internship.pdf", type: "file" },
        { name: "report.docx", type: "file" },
      ],
    },
    {
      name: "Downloads",
      type: "folder",
      children: [{ name: "wallpaper.jpg", type: "file" }],
    },
    {
      name: "Pictures",
      type: "folder",
      children: [{ name: "screenshot.png", type: "file" }],
    },
  ],
};

export interface ResolvedPath {
  path: string[];
  node: FileNode;
}

// Case-insensitive lookup that returns the canonical path, or null if it doesn't exist.
export function resolvePath(path: string[]): ResolvedPath | null {
  const segments = path.filter(Boolean);
  const rest =
    segments.length > 0 && segments[0].toLowerCase() === FILE_TREE.name.toLowerCase()
      ? segments.slice(1)
      : segments;

  let node: FileNode = FILE_TREE;
  const canonical = [FILE_TREE.name];

  for (const segment of rest) {
    const next = node.children?.find(
      (c) => c.name.toLowerCase() === segment.toLowerCase()
    );
    if (!next) return null;
    canonical.push(next.name);
    node = next;
  }

  return { path: canonical, node };
}