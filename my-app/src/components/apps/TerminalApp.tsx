"use client";

import { useState, useRef, useEffect } from "react";

interface HistoryLine {
  type: "input" | "output";
  text: string;
}

const PROMPT = "user@computer-agent:~$";

function runCommand(command: string): string {
  const cmd = command.trim();

  if (cmd === "") return "";
  if (cmd === "help") {
    return "Available commands: help, whoami, date, ls, clear";
  }
  if (cmd === "whoami") return "user";
  if (cmd === "date") return new Date().toString();
  if (cmd === "ls") return "Documents  Downloads  Pictures";
  if (cmd === "clear") return "__CLEAR__";

  return `command not found: ${cmd}`;
}

export default function TerminalApp() {
  const [history, setHistory] = useState<HistoryLine[]>([
    { type: "output", text: "Welcome. Type 'help' to see available commands." },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const output = runCommand(input);

    if (output === "__CLEAR__") {
      setHistory([]);
    } else {
      setHistory((h) => [
        ...h,
        { type: "input", text: input },
        ...(output ? [{ type: "output" as const, text: output }] : []),
      ]);
    }
    setInput("");
  }

  return (
    <div
      ref={scrollRef}
      className="themed-scroll h-full overflow-auto bg-panel p-3 font-mono text-xs text-ink"
    >
      {history.map((line, i) => (
        <div key={i} className="mb-1">
          {line.type === "input" ? (
            <span>
              <span className="text-accent">{PROMPT}</span> {line.text}
            </span>
          ) : (
            <span className="text-ink-muted whitespace-pre-wrap">{line.text}</span>
          )}
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <span className="text-accent shrink-0">{PROMPT}</span>
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
