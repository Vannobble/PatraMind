"use client";

import { useState } from "react";
import { Sparkles, FileCheck2, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import { cn } from "@/lib/utils";
import type { ConsensusJson } from "@/types";

const REKOMENDASI_CLS: Record<string, string> = {
  "Layak Dilanjutkan": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Perlu Klarifikasi Tambahan": "bg-amber-50 text-amber-700 border-amber-200",
  "Tidak Layak": "bg-red-50 text-red-700 border-red-200",
};

export function ConsensusPanel({
  tenderId,
  vendorName,
  evaluationId,
  consensus,
  isFinal,
  canGenerate,
  canApprove,
  onConsensus,
  onApproved,
}: {
  tenderId: string;
  vendorName: string;
  evaluationId: string | null;
  consensus: ConsensusJson | null;
  isFinal: boolean;
  canGenerate: boolean;
  canApprove: boolean;
  onConsensus: (c: ConsensusJson) => void;
  onApproved: () => void;
}) {
  const { setLiveDocument } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!evaluationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/consensus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evaluationId, tenderId, vendorName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal konsensus");
      onConsensus(json.consensus);
      setLiveDocument({
        title: `Konsensus Evaluasi — ${vendorName}`,
        subtitle: "Ringkasan akhir 4 aspek",
        badge: json.consensus.rekomendasi,
        kind: "text",
        text: json.consensus.kesimpulan,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    if (!evaluationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve", evaluationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyetujui");
      onApproved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-emerald-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-800 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Konsensus Evaluasi — {vendorName}
            </h3>
            <p className="text-xs text-slate-500">
              Konsolidasi 4 aspek evaluasi menjadi satu ringkasan akhir
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isFinal && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Final
            </Badge>
          )}
          <Button
            size="sm"
            onClick={generate}
            disabled={loading || !canGenerate || !evaluationId}
          >
            {loading ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles />}
            Generate Konsensus
          </Button>
          {canApprove && (
            <Button
              size="sm"
              variant="success"
              onClick={approve}
              disabled={loading || !consensus || isFinal || !evaluationId}
            >
              <FileCheck2 /> Setujui Final
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {consensus ? (
        <div className="mt-4 space-y-3">
          {typeof consensus.skor_akhir === "number" && (
            <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-white px-4 py-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Skor Akhir Tertimbang
              </span>
              <span
                className={cn(
                  "font-display text-2xl font-bold",
                  consensus.skor_akhir >= 75
                    ? "text-emerald-600"
                    : consensus.skor_akhir >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                )}
              >
                {consensus.skor_akhir}
              </span>
              <span className="text-xs font-semibold text-slate-400">/ 100</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={cn(
                    "h-full rounded-full",
                    consensus.skor_akhir >= 75
                      ? "bg-emerald-500"
                      : consensus.skor_akhir >= 50
                        ? "bg-amber-500"
                        : "bg-red-500"
                  )}
                  style={{ width: `${consensus.skor_akhir}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Rekomendasi Akhir
            </span>
            <Badge className={REKOMENDASI_CLS[consensus.rekomendasi] ?? REKOMENDASI_CLS["Perlu Klarifikasi Tambahan"]}>
              {consensus.rekomendasi}
            </Badge>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-justify text-xs leading-6 text-slate-700">
              {consensus.kesimpulan}
            </p>
            {consensus.poin_perhatian.length > 0 && (
              <div className="mt-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700">
                  <AlertTriangle className="h-3.5 w-3.5" /> Poin yang perlu diperhatikan
                </p>
                <ul className="space-y-1.5">
                  {consensus.poin_perhatian.map((p, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-5 text-slate-600">
                      <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-amber-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      ) : (
        !loading && (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white/60 p-4 text-center text-xs text-slate-500">
            Belum ada konsensus — kumpulkan penilaian 4 aspek, lalu klik{" "}
            <b>Generate Konsensus</b>.
          </p>
        )
      )}
    </div>
  );
}
