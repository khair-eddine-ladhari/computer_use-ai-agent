"use client";

import { useState, useRef, useEffect } from "react";
import { useDesktopStore } from "@/store/desktopStore";

const PROMPT = "user@computer-agent:~$";

export default function TerminalApp() {
  const history = useDesktopStore((s) => s.terminalHistory);
  const runTerminalCommand = useDesktopStore((s) => s.runTerminalCommand);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runTerminalCommand(input);
    setInput("");
  }

  return (
    <div
      ref={scrollRef}
      className="themed-scroll h-full overflow-auto bg-black/40 p-3 font-mono text-xs text-ink"
    >
      {history.map((line, i) => (
        <div key={i} className="mb-1">
          {line.type === "input" ? (
            <span>
              <span className="text-accent">{PROMPT}</span> {line.text}
            </span>
          ) : (
            <span className="whitespace-pre-wrap text-ink-muted">{line.text}</span>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <span className="shrink-0 text-accent">{PROMPT}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          className="flex-1 bg-transparent outline-none"
          spellCheck={false}
        />
      </form>
    </div>
  );
}