"use client";

import { useEffect, useState } from "react";
import { Sparkles, Save, Lock, CheckCircle2, Bot, User, SendHorizonal, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ASPECT_META, ROLE_LABELS } from "@/lib/constants";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { Aspect, AspectChatMessage, AspectInput, AspectStatus } from "@/types";
import { cn } from "@/lib/utils";

export function EvaluationColumn({
  aspect,
  tenderId,
  vendorName,
  evaluationId,
  initial,
  canEdit,
  onSaved,
}: {
  aspect: Aspect;
  tenderId: string;
  vendorName: string;
  evaluationId: string | null;
  initial: AspectInput | null;
  canEdit: boolean;
  onSaved: (input: AspectInput) => void;
}) {
  const meta = ASPECT_META[aspect];
  const { setLiveDocument } = useWorkspace();

  const [analysis, setAnalysis] = useState(initial?.analysis ?? "");
  const [catatan, setCatatan] = useState(initial?.catatan ?? "");
  const [status, setStatus] = useState<AspectStatus>(
    initial?.status ?? "belum_dinilai"
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [chatMessages, setChatMessages] = useState<AspectChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!canEdit || !evaluationId) return;
    fetch(`/api/aspect-chat?evaluationId=${evaluationId}&aspect=${aspect}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.messages) setChatMessages(j.messages);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId, aspect, canEdit]);

  async function sendChat() {
    const text = chatInput.trim();
    if (!text || sending || !evaluationId) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/aspect-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId, aspect, message: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menjawab");
      setChatInput("");
      setChatMessages(json.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSending(false);
    }
  }

  const dirty =
    analysis !== (initial?.analysis ?? "") ||
    catatan !== (initial?.catatan ?? "") ||
    status !== (initial?.status ?? "belum_dinilai");

  async function runAI() {
    if (!evaluationId) return;
    setAiLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId, vendorName, aspect }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal analisis");
      setAnalysis(json.analysis);
      setStatus(json.status);
      setLiveDocument({
        title: `Analisis AI — ${meta.label}`,
        subtitle: `Penawaran ${vendorName}`,
        badge: json.rekomendasi,
        kind: "text",
        text: json.analysis,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setAiLoading(false);
    }
  }

  async function save() {
    if (!evaluationId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_aspect",
          evaluationId,
          aspect,
          input: { analysis, catatan, status },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal simpan");
      onSaved({ analysis, catatan, status });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className={cn("rounded-t-xl border-b px-4 py-3", meta.ringClass.includes("ring") && "bg-white")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{meta.label}</p>
            <p className="text-[11px] text-slate-500">{meta.subLabel}</p>
          </div>
          <Badge className={meta.badgeClass}>{ROLE_LABELS[meta.role]}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="subtle"
            onClick={runAI}
            disabled={!canEdit || aiLoading || !evaluationId}
          >
            {aiLoading ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles />}
            {aiLoading ? "Menganalisis…" : "AI Analisis"}
          </Button>
          {!canEdit && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Lock className="h-3 w-3" /> Read-only untuk peran Anda
            </span>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">
            Hasil analisis AI / catatan penilai
          </label>
          <Textarea
            value={analysis}
            onChange={(e) => setAnalysis(e.target.value)}
            placeholder="Klik 'AI Analisis' untuk ringkasan otomatis, atau tulis penilaian manual…"
            rows={8}
            disabled={!canEdit}
            className="text-xs leading-5"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500">
            Catatan tambahan
          </label>
          <Textarea
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Contoh: mohon klarifikasi sertifikat material pada addendum…"
            rows={2}
            disabled={!canEdit}
            className="text-xs"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <MessageSquareText className="h-3 w-3" /> Tanya-jawab dengan AI
            (jawaban dari dokumen vendor)
          </label>
          <div className="h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
            {chatMessages.length === 0 && (
              <p className="px-1 text-[11px] leading-5 text-slate-400">
                Belum ada percakapan. Tanyakan, misalnya: &quot;Apakah
                penawaran ini memenuhi {meta.subLabel}?&quot;
              </p>
            )}
            {chatMessages.map((m) => (
              <div
                key={m.id}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-md bg-brand-800 px-3 py-2 text-[11px] leading-4 text-white"
                      : "max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-[11px] leading-4 text-slate-700"
                  }
                >
                  <div className="mb-1 flex items-center gap-1">
                    {m.role === "user" ? (
                      <User className="h-2.5 w-2.5 opacity-70" />
                    ) : (
                      <Bot className="h-2.5 w-2.5 text-brand-700" />
                    )}
                    <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">
                      {m.role === "user" ? "Anda" : "AI"}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap [text-align:start]">{m.content}</p>
                </div>
              </div>
            ))}
            {sending && (
              <p className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
                <Spinner className="h-3 w-3" /> AI sedang menjawab…
              </p>
            )}
          </div>
          {canEdit ? (
            <form
              className="flex items-center gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                void sendChat();
              }}
            >
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Tanya AI tentang penawaran vendor…"
                className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
              <Button
                type="submit"
                size="icon"
                variant="primary"
                disabled={sending || !chatInput.trim()}
                className="h-8 w-8"
              >
                <SendHorizonal className="h-3.5 w-3.5" />
              </Button>
            </form>
          ) : (
            <p className="text-[10px] text-slate-400">
              Percakapan hanya dapat dilakukan oleh penilai aspek ini.
            </p>
          )}
        </div>

        <div className="mt-auto space-y-2 pt-1">
          {canEdit && (
            <Button
              size="sm"
              variant="primary"
              onClick={save}
              disabled={saving || !dirty || !evaluationId}
              className="w-full justify-center"
            >
              {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save />}
              Simpan
            </Button>
          )}
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as AspectStatus)}
              disabled={!canEdit}
              className="h-8 flex-1 cursor-pointer rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            >
              <option value="belum_dinilai">Belum Dinilai</option>
              <option value="dinilai">Dinilai</option>
              <option value="perlu_klarifikasi">Perlu Klarifikasi</option>
            </select>
            {savedFlash && (
              <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Tersimpan
              </span>
            )}
          </div>
          {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
