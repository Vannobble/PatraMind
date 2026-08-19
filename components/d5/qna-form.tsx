"use client";

import { useEffect, useState } from "react";
import {
  Sparkles,
  Trash2,
  Plus,
  CheckCircle2,
  Loader2,
  FileText,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BAPreview } from "@/components/d5/ba-preview";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { BaJson, QnaNote } from "@/types";
import { cn } from "@/lib/utils";

const STEPS = [
  "Menganalisis RKS/TOR…",
  "Memproses catatan sesi…",
  "Menyusun Berita Acara…",
];

export function QnaForm({
  tenderId,
  rksFileName,
  initialNotes,
  existingBa,
  existingStatus,
  existingBaId,
}: {
  tenderId: string;
  rksFileName: string;
  initialNotes: QnaNote[];
  existingBa: BaJson | null;
  existingStatus?: "draft" | "final";
  existingBaId?: string;
}) {
  const { setLiveDocument } = useWorkspace();
  const [notes, setNotes] = useState<QnaNote[]>(initialNotes);
  const [ba, setBa] = useState<BaJson | null>(existingBa);
  const [baId, setBaId] = useState<string | null>(existingBaId ?? null);
  const [baStatus, setBaStatus] = useState<"draft" | "final">(
    existingStatus ?? "draft"
  );
  const [generating, setGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [aiAnswering, setAiAnswering] = useState<number | null>(null);

  useEffect(() => {
    if (ba) {
      setLiveDocument({
        title: "Berita Acara Aanwijzing",
        subtitle: "Draft yang sedang disusun",
        badge: baStatus === "final" ? "Final" : "Draft",
        kind: "ba",
        ba,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ba, baStatus]);

  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setStepIndex((s) => Math.min(s + 1, STEPS.length - 1));
    }, 1150);
    return () => clearInterval(interval);
  }, [generating]);

  function addNote() {
    setNotes((n) => [...n, { no: n.length + 1, pertanyaan: "", jawaban: "" }]);
  }

  function updateNote(i: number, field: "pertanyaan" | "jawaban", v: string) {
    setNotes((n) => n.map((x, idx) => (idx === i ? { ...x, [field]: v } : x)));
  }

  function removeNote(i: number) {
    setNotes((n) => n.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, no: idx + 1 })));
  }

  async function answerWithAi(i: number) {
    const question = notes[i].pertanyaan.trim();
    if (!question || aiAnswering !== null) return;
    setAiAnswering(i);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId, question }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menjawab");
      updateNote(i, "jawaban", json.answer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menjawab");
    } finally {
      setAiAnswering(null);
    }
  }

  async function generate() {
    setError(null);
    setGenerating(true);
    setStepIndex(0);
    try {
      const res = await fetch("/api/generate-ba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenderId, qnaNotes: notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal generate");

      const hasil = json.hasil as BaJson;
      setBa(hasil);
      setBaStatus("draft");

      // simpan draft otomatis agar tidak hilang
      try {
        const saveRes = await fetch("/api/berita-acara", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: baId ?? undefined,
            tenderId,
            qnaNotes: notes,
            hasilGenerate: hasil,
            status: "draft",
          }),
        });
        const saveJson = await saveRes.json();
        if (saveJson.id) setBaId(saveJson.id);
      } catch {
        // simpan otomatis gagal — draft tetap tampil di layar
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setGenerating(false);
      setStepIndex(0);
    }
  }

  async function save(status: "draft" | "final", content: BaJson) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/berita-acara", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: baId ?? undefined,
          tenderId,
          qnaNotes: notes,
          hasilGenerate: content,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan");
      setBaId(json.id);
      setBaStatus(status);
      setBa(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Catatan Sesi Pemberian Penjelasan (Aanwijzing)
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Tulis pertanyaan peserta & jawaban AI selama sesi — AI akan
              menyusunnya menjadi Berita Acara resmi.
            </p>
          </div>
          <Badge className="hidden shrink-0 bg-slate-100 text-slate-600 border-slate-200 sm:inline-flex">
            <FileText className="h-3 w-3" /> {rksFileName.split(".")[0].slice(0, 28)}…
          </Badge>
        </div>

        <div className="mt-4 space-y-3">
          {notes.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
              Belum ada catatan. Tambahkan pertanyaan pertama peserta pada sesi
              penjelasan.
            </div>
          )}

          {notes.map((n, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-800 text-[11px] font-bold text-white">
                  {n.no}
                </span>
                <button
                  onClick={() => removeNote(i)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Hapus"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">
                    Pertanyaan peserta
                  </label>
                  <Textarea
                    value={n.pertanyaan}
                    onChange={(e) => updateNote(i, "pertanyaan", e.target.value)}
                    placeholder="Contoh: Apakah spesifikasi material impeller dapat menggunakan stainless steel 316L?"
                    rows={3}
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Jawaban AI
                    </label>
                    <button
                      type="button"
                      onClick={() => answerWithAi(i)}
                      disabled={aiAnswering !== null || !n.pertanyaan.trim()}
                      className="inline-flex items-center gap-1 rounded-md border border-brand-200 bg-brand-50 px-2 py-1 text-[10px] font-semibold text-brand-700 transition hover:bg-brand-100 disabled:opacity-50"
                    >
                      {aiAnswering === i ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {aiAnswering === i ? "Menganalisis…" : "Jawabkan dengan AI"}
                    </button>
                  </div>
                  <Textarea
                    value={n.jawaban}
                    onChange={(e) => updateNote(i, "jawaban", e.target.value)}
                    placeholder="Kosongkan, lalu tekan 'Jawabkan dengan AI' atau tulis jawaban resmi panitia."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={addNote}>
            <Plus /> Tambah Q&A
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={generate}
            disabled={generating || notes.length === 0 || saving}
          >
            <Sparkles className="text-amber-300" />
            Generate Berita Acara
          </Button>
          {error && (
            <span className="text-xs font-medium text-red-600">{error}</span>
          )}
        </div>
      </div>

      {/* Loading bertahap */}
      {generating && (
        <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 to-sky-50 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin text-brand-700" />
            <p className="text-sm font-bold text-brand-900">
              AI sedang menyusun dokumen…
            </p>
          </div>
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "flex items-center gap-2 text-xs font-medium transition",
                  i < stepIndex
                    ? "text-emerald-600"
                    : i === stepIndex
                      ? "text-brand-800"
                      : "text-slate-400"
                )}
              >
                {i < stepIndex ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : i === stepIndex ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4" />
                )}
                {s}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hasil */}
      {ba && !generating && (
        <BAPreview
          ba={ba}
          status={baStatus}
          saving={saving}
          onSave={save}
        />
      )}
    </div>
  );
}
