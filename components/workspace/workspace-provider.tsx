"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import type { ChatMessage, LiveDocument } from "@/types";

export interface ChatState {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
}

interface WorkspaceCtx {
  liveDocument: LiveDocument | null;
  setLiveDocument: (d: LiveDocument | null) => void;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
  chat: ChatState;
  setChat: Dispatch<SetStateAction<ChatState>>;
  sendChat: (tenderId: string, question: string, documentId?: string) => Promise<void>;
}

const Ctx = createContext<WorkspaceCtx>({
  liveDocument: null,
  setLiveDocument: () => {},
  aiOpen: true,
  setAiOpen: () => {},
  chat: { messages: [], input: "", loading: false, error: null },
  setChat: () => {},
  sendChat: async () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [liveDocument, setLiveDocument] = useState<LiveDocument | null>(null);
  const [aiOpen, setAiOpen] = useState(true);
  const [chat, setChat] = useState<ChatState>({
    messages: [],
    input: "",
    loading: false,
    error: null,
  });

  async function sendChat(tenderId: string, question: string, documentId?: string) {
    const q = question.trim();
    if (!q) return;
    setChat((prev) => ({
      ...prev,
      input: "",
      error: null,
      messages: [
        ...prev.messages,
        { id: crypto.randomUUID(), role: "user", content: q },
      ],
      loading: true,
    }));
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId, question: q, documentId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menjawab");
      setChat((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: json.answer,
            sources: json.sources ?? [],
          },
        ],
      }));
    } catch (err) {
      setChat((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Terjadi kesalahan",
        messages: [
          ...prev.messages,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Maaf, saya mengalami kendala saat menjawab. Coba lagi.",
          },
        ],
      }));
    } finally {
      setChat((prev) => ({ ...prev, loading: false }));
    }
  }

  return (
    <Ctx.Provider
      value={{
        liveDocument,
        setLiveDocument,
        aiOpen,
        setAiOpen,
        chat,
        setChat,
        sendChat,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  return useContext(Ctx);
}