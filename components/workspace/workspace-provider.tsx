"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import type { LiveDocument } from "@/types";

interface WorkspaceCtx {
  liveDocument: LiveDocument | null;
  setLiveDocument: (d: LiveDocument | null) => void;
  aiOpen: boolean;
  setAiOpen: (v: boolean) => void;
}

const Ctx = createContext<WorkspaceCtx>({
  liveDocument: null,
  setLiveDocument: () => {},
  aiOpen: true,
  setAiOpen: () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [liveDocument, setLiveDocument] = useState<LiveDocument | null>(null);
  const [aiOpen, setAiOpen] = useState(true);
  return (
    <Ctx.Provider value={{ liveDocument, setLiveDocument, aiOpen, setAiOpen }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspace() {
  return useContext(Ctx);
}
