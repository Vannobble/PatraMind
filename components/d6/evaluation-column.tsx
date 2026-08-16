"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  CheckCircle2,
  Clock3,
  FileSearch,
  Lock,
  MessageSquareText,
  RefreshCw,
  Save,
  SendHorizonal,
  Sparkles,
  User,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ASPECT_CONFIG, ASPECT_META, ROLE_LABELS } from "@/lib/constants";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type {
  Aspect,
  AspectChatMessage,
  AspectInput,
  AspectStatus,
} from "@/types";
import { cn } from "@/lib/utils";

const LOADING_STAGES = [
  "Membaca dokumen penawaran…",
  "Membandingkan dengan RKS/TOR…",
  "Menyusun ringkasan & skor kesesuaian…",
];

function skorLabel(skor: number): { label: string; cls: string } {
  if (skor >= 75) return { label: "Sesuai", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  if (skor >= 50) return { label: "Perlu Review", cls: "bg-amber-50 text-amber-700 border-amber-200" };
  return { label: "Tidak Sesuai", cls: "bg-red-50 text-red-700 border-red-200" };
}

function skorColor(skor: number): string {
  if (skor >= 75) return "text-emerald-600";
  if (skor >= 50) return "text-amber-600";
  return "text-red-600";
}

function formatWaktu(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

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
  const config = ASPECT_CONFIG[aspect];
  const { setLiveDocument } = useWorkspace();

  const [analysis, setAnalysis] = useState(initial?.analysis ?? "");
  const [status, setStatus] = useState<AspectStatus>(
    initial?.status ?? "belum_dinilai"
  );
  const [skor, setSkor] = useState<number | null>(initial?.skor ?? null);
  const [poin, setPoin] = useState<AspectInput["poin"]>(initial?.poin ?? null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(
    initial?.analyzed_at ?? null
  );
  const [aiLoading, setAiLoading] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [chatMessages, setChatMessages] = useState<AspectChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [sending, setSending] = useState(false);

  const hasAnalysis = Boolean((analysis ?? "").trim());

  useEffect(() => {
    if (!canEdit || !evaluationId) return;
    fetch(`/api/aspect-chat?evaluationId=${evaluationId}&aspect=${aspect}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.messages) setChatMessages(j.messages);
      })
      .catch(() => {});
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

  async function runAI() {
    if (!evaluationId) return;
    setAiLoading(true);
    setError(null);
    setStageIdx(0);
    const timer = setInterval(
      () => setStageIdx((i) => Math.min(i + 1, LOADING_STAGES.length - 1)),
      1400
    );
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId, vendorName, aspect }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal analisis");
      setAnalysis(json.analysis);
      setSkor(typeof json.skor === "number" ? json.skor : null);
      setPoin(json.poin ?? null);
      setStatus(json.status);
      setAnalyzedAt(json.analyzedAt ?? new Date().toISOString());
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
      clearInterval(timer);
      setAiLoading(false);
    }
  }

  async function save() {
    if (!evaluationId) return;
    setSaving(true);
    setError(null);
    try {
      const input: AspectInput = {
        analysis,
        catatan: initial?.catatan ?? "",
        status,
        skor,
        poin,
        analyzed_at: analyzedAt,
      };
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save_aspect", evaluationId, aspect, input }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal simpan");
      onSaved(input);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const dirty =
    analysis !== (initial?.analysis ?? "") ||
    status !== (initial?.status ?? "belum_dinilai");

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="rounded-t-xl border-b border-slate-100 px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">{config.judul}</p>
            <p className="text-[11px] text-slate-500">{config.deskripsi}</p>
          </div>
          <Badge className={meta.badgeClass}>{ROLE_LABELS[meta.role]}</Badge>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* ============ LOADING: skeleton + tahapan ============ */}
        {aiLoading ? (
          <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-4">
            <div className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-brand-700" />
              <p className="text-xs font-semibold text-brand-800">
                AI sedang menganalisis…
              </p>
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-brand-700">
              <Sparkles className="h-3 w-3" /> {LOADING_STAGES[stageIdx]}
            </p>
            <div className="mt-3 space-y-2">
              <div className="h-2.5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-2.5 w-3/5 animate-pulse rounded-full bg-slate-200" />
              <div className="h-2.5 w-2/3 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        ) : !hasAnalysis ? (
          /* ============ EMPTY STATE ============ */
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/50 px-4 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <FileSearch className="h-5 w-5" />
            </span>
            <p className="mt-3 text-xs font-semibold text-slate-700">
              Belum ada analisis
            </p>
            <p className="mx-auto mt-1 max-w-[240px] text-[11px] leading-5 text-slate-400">
              Klik &quot;AI Analisis&quot; untuk memproses dokumen penawaran
              vendor ini dari sisi {config.judul}.
            </p>
            {canEdit && (
              <Button
                size="sm"
                variant="primary"
                onClick={runAI}
                disabled={!evaluationId}
                className="mt-4"
              >
                <Sparkles /> AI Analisis
              </Button>
            )}
            {!canEdit && (
              <span className="mt-3 flex items-center gap-1 text-[11px] text-slate-400">
                <Lock className="h-3 w-3" /> Read-only untuk peran Anda
              </span>
            )}
          </div>
        ) : (
          /* ============ RESULT STATE ============ */
          <>
            <div className="flex flex-wrap items-center gap-2">
              {skor !== null && (
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border-2 font-display text-sm font-bold",
                      skorColor(skor),
                      "border-current"
                    )}
                  >
                    {skor}
                  </span>
                  <Badge className={skorLabel(skor).cls}>
                    {skorLabel(skor).label}
                  </Badge>
                </div>
              )}
              <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                {meta.label}
              </Badge>
              {analyzedAt && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock3 className="h-3 w-3" />
                  Analisis: {formatWaktu(analyzedAt)}
                </span>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="subtle"
                  onClick={runAI}
                  disabled={!evaluationId}
                  className="ml-auto h-7 text-[11px]"
                >
                  <RefreshCw className="h-3 w-3" /> Jalankan ulang
                </Button>
              )}
            </div>

            {poin && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                {poin.sesuai.length > 0 && (
                  <ul className="space-y-1">
                    {poin.sesuai.map((p, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] leading-4 text-emerald-700">
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                {poin.kurang.length > 0 && (
                  <ul className="space-y-1">
                    {poin.kurang.map((p, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] leading-4 text-red-600">
                        <XCircle className="mt-0.5 h-3 w-3 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                {poin.catatan.length > 0 && (
                  <ul className="space-y-1 border-t border-slate-200 pt-1.5">
                    {poin.catatan.map((p, i) => (
                      <li key={i} className="flex gap-1.5 text-[11px] leading-4 text-slate-600">
                        <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-amber-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-500">
                Catatan tambahan — detail analisis (dapat diedit)
              </label>
              <Textarea
                value={analysis}
                onChange={(e) => setAnalysis(e.target.value)}
                placeholder="Klik 'AI Analisis' untuk ringkasan otomatis, atau tulis penilaian manual…"
                rows={7}
                disabled={!canEdit}
                className="text-xs leading-5"
              />
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
            </div>
          </>
        )}

        {/* ============ TANYA-JAWAB (selalu tampil) ============ */}
        <div className="space-y-1 border-t border-slate-100 pt-3">
          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <MessageSquareText className="h-3 w-3" /> Tanya-jawab dengan AI
            (jawaban dari dokumen vendor)
          </label>
          <div className="h-36 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
            {chatMessages.length === 0 && (
              <p className="px-1 text-[11px] leading-5 text-slate-400">
                Belum ada percakapan. Tanyakan, misalnya: &quot;Apakah
                penawaran ini memenuhi {config.deskripsi.toLowerCase()}?&quot;
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

        {error && <p className="text-[11px] font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}