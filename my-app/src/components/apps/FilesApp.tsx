"use client";

import { useState } from "react";
import { Folder, FileText, ChevronRight } from "lucide-react";

interface FileNode {
  name: string;
  type: "folder" | "file";
  children?: FileNode[];
}

const FILE_TREE: FileNode = {
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

export default function FilesApp() {
  // path is the breadcrumb trail, e.g. ["Home", "Documents"]
  const [path, setPath] = useState<string[]>(["Home"]);

  // Walk FILE_TREE down to whatever folder `path` points at
  function resolveFolder(nodes: FileNode, trail: string[]): FileNode {
    if (trail.length <= 1) return nodes;
    const next = nodes.children?.find((c) => c.name === trail[1]);
    return next ? resolveFolder(next, trail.slice(1)) : nodes;
  }

  const currentFolder = resolveFolder(FILE_TREE, path);

  function openFolder(name: string) {
    setPath((p) => [...p, name]);
  }

  function goToBreadcrumb(index: number) {
    setPath((p) => p.slice(0, index + 1));
  }

  return (
    <div className="flex h-full flex-col text-ink">
      {/* Breadcrumbs */}
      <div className="flex shrink-0 items-center gap-1 border-b border-panel-border px-3 py-2 text-xs text-ink-muted">
        {path.map((segment, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} />}
            <button
              onClick={() => goToBreadcrumb(i)}
              className={i === path.length - 1 ? "text-ink" : "hover:text-ink"}
            >
              {segment}
            </button>
          </span>
        ))}
      </div>

      {/* Grid of files/folders */}
      <div className="grid flex-1 grid-cols-4 content-start gap-3 p-4">
        {currentFolder.children?.map((node) => (
          <button
            key={node.name}
            onClick={() => node.type === "folder" && openFolder(node.name)}
            className="flex flex-col items-center gap-1.5 rounded-lg p-2 text-center hover:bg-panel-light"
          >
            {node.type === "folder" ? (
              <Folder size={36} className="text-accent" fill="currentColor" fillOpacity={0.15} />
            ) : (
              <FileText size={36} className="text-ink-muted" />
            )}
            <span className="w-full truncate text-xs">{node.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}