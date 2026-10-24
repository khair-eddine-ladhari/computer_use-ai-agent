import { create } from "zustand";
import type { ServerToolCall } from "@/agent/actions";

interface AgentState {
  pending: ServerToolCall[];
  addPending: (calls: ServerToolCall[]) => void;
  removePending: (id: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  pending: [],

  addPending: (calls) => {
    set((state) => ({ pending: [...state.pending, ...calls] }));
  },

  removePending: (id) => {
    set((state) => ({ pending: state.pending.filter((c) => c.id !== id) }));
  },
}));