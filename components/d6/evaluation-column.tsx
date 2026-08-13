"use client";

import { useState } from "react";
import { Sparkles, Save, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ASPECT_META, ASPECT_STATUS_LABELS, ROLE_LABELS } from "@/lib/constants";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { Aspect, AspectInput, AspectStatus } from "@/types";
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

  const statusMeta = ASPECT_STATUS_LABELS[status];

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

        <div className="mt-auto space-y-2 pt-1">
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
            {canEdit && (
              <Button
                size="sm"
                variant="primary"
                onClick={save}
                disabled={saving || !dirty || !evaluationId}
              >
                {saving ? <Spinner className="h-3.5 w-3.5" /> : <Save />}
                Simpan
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between">
            <Badge className={statusMeta.cls}>{statusMeta.label}</Badge>
            {savedFlash && (
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
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
