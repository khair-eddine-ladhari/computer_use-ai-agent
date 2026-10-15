"use client";

import { Folder, FileText, ChevronRight, X } from "lucide-react";
import { useDesktopStore } from "@/store/desktopStore";
import { resolvePath } from "@/lib/fileSystem";

export default function FilesApp() {
  const filesPath = useDesktopStore((s) => s.filesPath);
  const selectedFile = useDesktopStore((s) => s.selectedFile);
  const setFilesPath = useDesktopStore((s) => s.setFilesPath);
  const selectFile = useDesktopStore((s) => s.selectFile);

  const resolved = resolvePath(filesPath) ?? resolvePath([])!;
  const currentFolder = resolved.node;
  const path = resolved.path;

  return (
    <div className="flex h-full flex-col text-ink">
      <div className="flex shrink-0 items-center gap-1 border-b border-panel-border px-3 py-2 text-xs text-ink-muted">
        {path.map((segment, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} />}
            <button
              onClick={() => setFilesPath(path.slice(0, i + 1))}
              className={i === path.length - 1 ? "text-ink" : "hover:text-ink"}
            >
              {segment}
            </button>
          </span>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-4 content-start gap-3 overflow-auto p-4">
        {currentFolder.children?.map((node) => {
          const isSelected = node.type === "file" && node.name === selectedFile;
          return (
            <button
              key={node.name}
              onClick={() =>
                node.type === "folder"
                  ? setFilesPath([...path, node.name])
                  : selectFile(node.name)
              }
              className={`flex flex-col items-center gap-1.5 rounded-lg p-2 text-center hover:bg-panel-light ${
                isSelected ? "bg-panel-light ring-1 ring-accent" : ""
              }`}
            >
              {node.type === "folder" ? (
                <Folder size={36} className="text-accent" fill="currentColor" fillOpacity={0.15} />
              ) : (
                <FileText size={36} className="text-ink-muted" />
              )}
              <span className="w-full truncate text-xs">{node.name}</span>
            </button>
          );
        })}
      </div>

      {selectedFile && (
        <div className="shrink-0 border-t border-panel-border bg-panel p-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-ink">
              <FileText size={14} className="text-accent" />
              {selectedFile}
            </span>
            <button
              onClick={() => selectFile(null)}
              aria-label="Close preview"
              className="flex h-5 w-5 items-center justify-center rounded hover:bg-panel-light"
            >
              <X size={12} className="text-ink-muted" />
            </button>
          </div>
          <p className="mt-2 text-ink-muted">
            Preview isn't available in this simulated desktop.
          </p>
        </div>
      )}
    </div>
  );
}