"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";

type PageId = "home" | "about" | "not-found";

const PAGES: Record<Exclude<PageId, "not-found">, { title: string; content: React.ReactNode }> = {
  home: {
    title: "New Tab",
    content: (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-muted">
        <p className="text-lg">This is a simulated browser.</p>
        <p className="text-xs">Try visiting: about</p>
      </div>
    ),
  },
  about: {
    title: "About this computer",
    content: (
      <div className="p-6 text-sm text-ink">
        <h1 className="mb-2 text-lg font-semibold">About</h1>
        <p className="text-ink-muted">
          This is a simulated Linux desktop built for an AI computer-use agent project.
        </p>
      </div>
    ),
  },
};

function resolveUrl(input: string): PageId {
  const clean = input.trim().toLowerCase();
  if (clean === "" || clean === "home") return "home";
  if (clean === "about") return "about";
  return "not-found";
}

export default function BrowserApp() {
  const [pageId, setPageId] = useState<PageId>("home");
  const [addressInput, setAddressInput] = useState("home");

  function handleNavigate(e: React.FormEvent) {
    e.preventDefault();
    setPageId(resolveUrl(addressInput));
  }

  return (
    <div className="flex h-full flex-col">
      {/* Address bar */}
      <div className="flex shrink-0 items-center gap-2 border-b border-panel-border px-3 py-2">
        <ArrowLeft size={14} className="text-ink-muted" />
        <ArrowRight size={14} className="text-ink-muted" />
        <RotateCw size={14} className="text-ink-muted" />
        <form onSubmit={handleNavigate} className="flex-1">
          <input
            value={addressInput}
            onChange={(e) => setAddressInput(e.target.value)}
            aria-label="Address"
            className="w-full rounded-lg border border-panel-border bg-panel-light px-3 py-2 text-xs text-ink outline-none transition-colors focus:border-accent"
            spellCheck={false}
          />
        </form>
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto bg-panel">
        {pageId === "not-found" ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-muted">
            Page not found: no internet access in this simulation.
          </div>
        ) : (
          PAGES[pageId].content
        )}
      </div>
    </div>
  );
}
