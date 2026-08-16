"use client";

import { useEffect, useRef, useState } from "react";
import { SendHorizonal, Sparkles, Bot, User, FileText, Loader2, CircleX, PenLine, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { BaDocument } from "@/components/workspace/ba-document";
import type { ChatMessage } from "@/types";

const SUGGESTIONS = [
  "Apa spesifikasi teknis impeller?",
  "Berapa HPS pengadaan ini?",
  "Syarat K3 apa yang wajib dipenuhi penyedia?",
  "Berapa batas waktu pengiriman barang?",
];

const EDIT_SUGGESTIONS = [
  "Perbaiki ejaan dan format dokumen",
  "Tambahkan klausa tentang jaminan mutu di akhir dokumen",
];

export function ChatPanel({
  tenderId,
  documentId,
  canEdit = false,
  onApplyEdit,
}: {
  tenderId: string;
  documentId?: string;
  canEdit?: boolean;
  onApplyEdit?: (kontenBaru: string) => void;
}) {
  const { chat, setChat, sendChat } = useWorkspace();
  const { messages, input, loading, error } = chat;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text?: string) {
    if (loading) return;
    await sendChat(tenderId, text ?? input, documentId);
  }

  async function applyEdit(m: ChatMessage) {
    if (!documentId || !m.editProposal || applyingId) return;
    setApplyingId(m.id);
    try {
      const res = await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ konten_text: m.editProposal.konten_baru }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menerapkan edit");
      setChat((prev) => ({
        ...prev,
        messages: prev.messages.map((x) =>
          x.id === m.id ? { ...x, editApplied: true } : x
        ),
      }));
      onApplyEdit?.(m.editProposal.konten_baru);
    } catch (err) {
      setChat((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Gagal menerapkan edit",
      }));
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="flex h-full flex-col">
      {messages.length === 0 && (
        <div className="px-4 pt-3">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Coba tanyakan
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={loading}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-brand-300 hover:text-brand-700 disabled:opacity-50"
              >
                {s}
              </button>
            ))}
            {documentId && (
              <>
                <span className="my-1 w-full border-t border-dashed border-slate-200" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
                  Perintah edit dokumen
                </p>
                {EDIT_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={loading}
                    className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 disabled:opacity-50"
                  >
                    <PenLine className="mr-1 inline h-3 w-3" />
                    {s}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.role === "user" ? "flex justify-end" : "flex justify-start"
            }
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-brand-800 px-3.5 py-2.5 text-xs leading-5 text-white"
                  : "max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm"
              }
            >
              <div className="mb-1 flex items-center gap-1.5">
                {m.role === "user" ? (
                  <User className="h-3 w-3 opacity-70" />
                ) : (
                  <Bot className="h-3 w-3 text-brand-700" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
                  {m.role === "user" ? "Anda" : "Asisten AI"}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-xs leading-5 text-slate-700 [text-align:start]">
                {m.content}
              </p>
              {m.editProposal && (
                <div className="mt-2.5 rounded-xl border border-brand-200 bg-brand-50/50">
                  <div className="flex items-center gap-1.5 border-b border-brand-100 px-2.5 py-1.5">
                    <PenLine className="h-3 w-3 text-brand-700" />
                    <span className="text-[10px] font-bold uppercase tracking-wide text-brand-800">
                      Usulan Edit Dokumen
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto px-2.5 py-2">
                    <pre className="whitespace-pre-wrap font-mono text-[10.5px] leading-4 text-slate-600">
                      {m.editProposal.konten_baru}
                    </pre>
                  </div>
                  <div className="border-t border-brand-100 px-2.5 py-2">
                    {m.editApplied ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> Diterapkan ke dokumen
                      </span>
                    ) : canEdit ? (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => applyEdit(m)}
                        disabled={applyingId !== null}
                        className="h-7 w-full text-[11px]"
                      >
                        {applyingId === m.id ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <PenLine className="h-3 w-3" />
                        )}
                        Terapkan ke Dokumen
                      </Button>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        Khusus Panitia/Admin untuk menerapkan edit.
                      </span>
                    )}
                  </div>
                </div>
              )}
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.sources.map((s) => (
                    <Badge
                      key={s}
                      className="bg-sky-50 text-sky-700 border-sky-200 text-[10px]"
                    >
                      <FileText className="h-2.5 w-2.5" /> {s}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Asisten sedang menelusuri dokumen…
          </div>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-1.5 px-4 pb-1 text-[11px] font-medium text-red-600">
          <CircleX className="h-3 w-3" /> {error}
        </p>
      )}

      <div className="border-t border-slate-200 p-3">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            value={input}
            onChange={(e) =>
              setChat((prev) => ({ ...prev, input: e.target.value }))
            }
            placeholder="Tanya dokumen project…"
            className="h-10 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            variant="primary"
            className="h-10 w-10"
          >
            <SendHorizonal />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function LivePreviewPanel() {
  const { liveDocument } = useWorkspace();

  if (!liveDocument) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
          <Sparkles className="h-5 w-5" />
        </span>
        <p className="text-xs font-semibold text-slate-600">
          Live Preview — kosong
        </p>
        <p className="text-[11px] leading-5 text-slate-400">
          Dokumen yang sedang Anda susun (mis. draft Berita Acara atau hasil
          analisis AI) akan tampil real-time di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-900">
            {liveDocument.title}
          </p>
          {liveDocument.subtitle && (
            <p className="truncate text-[11px] text-slate-500">
              {liveDocument.subtitle}
            </p>
          )}
        </div>
        {liveDocument.badge && (
          <Badge className="shrink-0 bg-brand-50 text-brand-700 border-brand-200">
            {liveDocument.badge}
          </Badge>
        )}
      </div>

      {liveDocument.kind === "ba" && liveDocument.ba ? (
        <div className="scale-[0.78] origin-top">
          <BaDocument ba={liveDocument.ba} />
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          {liveDocument.text?.split("\n").map((p, i) =>
            p.trim() ? (
              <p
                key={i}
                className="mb-2 text-justify text-[11px] leading-5 text-slate-600"
              >
                {p}
              </p>
            ) : null
          )}
        </div>
      )}
    </div>
  );
}