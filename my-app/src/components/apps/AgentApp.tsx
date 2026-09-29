"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";
import type { ChatMessage } from "@/agent/types";
import { sendMessageToAgent } from "@/lib/api";
import { executeToolCall } from "@/agent/executor";

export default function AgentApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "agent",
      text: "Hi, I'm your computer agent. What would you like me to do?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isThinking]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: input,
      timestamp: Date.now(),
    };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    setIsThinking(true);

    try {
      const { reply, toolCalls } = await sendMessageToAgent(userMessage.text);

      // Run any actions the agent decided on before showing the reply,
      // so the desktop updates in sync with the message appearing.
      for (const call of toolCalls) {
        executeToolCall(call);
      }

      setMessages((m) => [...m, reply]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "agent",
          text: "Couldn't reach the agent server. Is it running?",
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="themed-scroll flex-1 space-y-3 overflow-auto p-3">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
                msg.role === "user" ? "bg-accent text-white" : "bg-panel-light text-ink"
              }`}
            >
              {msg.text}
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
            <motion.div
              className="rounded-xl bg-panel-light px-3 py-2 text-xs text-ink-muted"
              animate={{ opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              Thinking…
            </motion.div>
          </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-2 border-t border-panel-border bg-panel px-3 py-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent to do something..."
          disabled={isThinking}
          className="flex-1 rounded-lg border border-panel-border bg-panel-light px-3 py-2.5 text-xs text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isThinking}
          aria-label="Send message"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}
