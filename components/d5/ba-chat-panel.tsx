"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bot,
  Check,
  CircleX,
  Loader2,
  PenLine,
  SendHorizonal,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { BaJson } from "@/types";

const SUGGESTIONS = [
  "Ringkas isi berita acara",
  "Berapa poin penjelasan?",
  "Apa isi kesimpulan?",
];

const EDIT_SUGGESTIONS = [
  "Ubah nomor BA menjadi BA/PP/001/AANW/2026",
  "Tambahkan klausa: vendor wajib menyertakan jaminan mutu",
  "Hapus tanya-jawab nomor 1",
];

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  editProposal?: { ba_baru: BaJson; ringkasan: string };
  editApplied?: boolean;
};

export function BaChatPanel({
  ba,
  onApplyEdit,
}: {
  ba: BaJson;
  onApplyEdit: (baBaru: BaJson, ringkasan: string) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);
  const nextId = () => `m-${++idRef.current}`;

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  async function send(text?: string) {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    setInput("");
    setError(null);
    const userMsg: ChatMessage = {
      id: nextId(),
      role: "user",
      content: question,
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch("/api/ba-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ba, question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal memproses pertanyaan");
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: "assistant",
        content: json.answer,
        editProposal: json.editProposal,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memproses pertanyaan");
    } finally {
      setLoading(false);
    }
  }

  function applyEdit(m: ChatMessage) {
    if (!m.editProposal || applyingId) return;
    setApplyingId(m.id);
    try {
      onApplyEdit(m.editProposal.ba_baru, m.editProposal.ringkasan);
      setMessages((prev) =>
        prev.map((x) => (x.id === m.id ? { ...x, editApplied: true } : x))
      );
    } finally {
      setApplyingId(null);
    }
  }

  return (
    <div className="flex h-full max-h-[720px] flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-slate-200 px-4">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
          <Bot className="h-3.5 w-3.5" />
        </span>
        <div className="leading-none">
          <p className="text-xs font-bold text-slate-900">Asisten BA</p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            Tanya isi &amp; beri instruksi edit
          </p>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
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
            <span className="my-1 w-full border-t border-dashed border-slate-200" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600">
              Instruksi edit
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
          </div>
        </div>
      )}

      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
      >
        {messages.map((m) => (
          <div
            key={m.id}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-md bg-brand-800 px-3.5 py-2.5 text-xs leading-5 text-white"
                  : "max-w-[95%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm"
              }
            >
              <div className="mb-1 flex items-center gap-1.5">
                {m.role === "user" ? (
                  <User className="h-3 w-3 opacity-70" />
                ) : (
                  <Sparkles className="h-3 w-3 text-brand-700" />
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
                      Usulan Edit Berita Acara
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto px-2.5 py-2">
                    <pre className="whitespace-pre-wrap font-mono text-[10.5px] leading-4 text-slate-600">
                      {m.editProposal.ringkasan}
                    </pre>
                  </div>
                  <div className="border-t border-brand-100 px-2.5 py-2">
                    {m.editApplied ? (
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                        <Check className="h-3.5 w-3.5" /> Diterapkan ke draft BA
                      </span>
                    ) : (
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
                        Terapkan ke Draft BA
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Asisten sedang memproses…
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
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya atau perintah edit BA…"
            className="h-9 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          />
          <Button
            type="submit"
            size="icon"
            disabled={loading || !input.trim()}
            variant="primary"
            className="h-9 w-9"
          >
            <SendHorizonal />
          </Button>
        </form>
      </div>
    </div>
  );
}