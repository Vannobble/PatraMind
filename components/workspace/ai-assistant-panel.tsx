"use client";

import { useState } from "react";
import { Bot, Eye, PanelRightClose, PanelRightOpen, MessageSquare } from "lucide-react";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { Badge } from "@/components/ui/badge";
import { ChatPanel, LivePreviewPanel } from "@/components/d8/chat-panel";
import { cn } from "@/lib/utils";

export function AIAssistantPanel({
  tenderId,
  aiMode,
}: {
  tenderId: string;
  aiMode: "openai" | "local";
}) {
  const { aiOpen, setAiOpen } = useWorkspace();
  const [tab, setTab] = useState<"chat" | "preview">("chat");

  return (
    <>
      {!aiOpen && (
        <button
          onClick={() => setAiOpen(true)}
          className="group flex w-10 shrink-0 items-start justify-center border-l border-slate-200 bg-white pt-4 text-slate-400 transition hover:text-brand-700"
          title="Buka Asisten AI"
        >
          <PanelRightOpen className="h-5 w-5" />
        </button>
      )}
      <aside
        className={cn(
          "w-[380px] shrink-0 flex-col border-l border-slate-200 bg-white",
          aiOpen ? "flex" : "hidden"
        )}
      >
        <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Bot className="h-4 w-4" />
            </span>
            <div className="leading-none">
              <p className="text-xs font-bold text-slate-900">Asisten AI</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {aiMode === "openai" ? "OpenAI terhubung" : "Mode demo offline"}
              </p>
            </div>
          </div>
          <button
            onClick={() => setAiOpen(false)}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Tutup panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1 border-b border-slate-200 px-3 pt-2">
          {(
            [
              { id: "chat", label: "Chat Dokumen", icon: MessageSquare },
              { id: "preview", label: "Live Preview", icon: Eye },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-t-lg border-b-2 px-2 py-2 text-[11px] font-semibold transition",
                tab === t.id
                  ? "border-brand-700 text-brand-800"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
              {t.id === "chat" && (
                <Badge className="bg-slate-100 text-slate-500 border-slate-200 text-[9px] px-1.5">
                  RAG
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1">
          <div className={cn("h-full", tab === "chat" ? "block" : "hidden")}>
            <ChatPanel tenderId={tenderId} />
          </div>
          <div className={cn("h-full", tab === "preview" ? "block" : "hidden")}>
            <LivePreviewPanel />
          </div>
        </div>
      </aside>
    </>
  );
}
