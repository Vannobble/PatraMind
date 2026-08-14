"use client";

import { useState } from "react";
import { Building2, PlayCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EvaluationColumn } from "./evaluation-column";
import { ConsensusPanel } from "./consensus-panel";
import { ASPECT_ORDER, ASPECT_META, ROLE_LABELS } from "@/lib/constants";
import type {
  Aspect,
  AspectInput,
  ConsensusJson,
  Evaluation,
  Role,
} from "@/types";
import { cn } from "@/lib/utils";

export function EvaluationBoard({
  tenderId,
  vendors,
  initialEvals,
  role,
}: {
  tenderId: string;
  vendors: { nama: string }[];
  initialEvals: Evaluation[];
  role: Role;
}) {
  const [selectedVendor, setSelectedVendor] = useState(
    vendors[0]?.nama ?? ""
  );
  const [evals, setEvals] = useState<Evaluation[]>(initialEvals);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current: Evaluation | undefined = evals.find(
    (e) => e.vendor_name === selectedVendor
  );

  async function createEvaluation() {
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          tenderId,
          vendorName: selectedVendor,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal memulai evaluasi");
      setEvals((prev) => [
        ...prev,
        {
          id: json.id,
          tender_id: tenderId,
          vendor_name: selectedVendor,
          teknis_input: null,
          legal_input: null,
          harga_input: null,
          k3_input: null,
          consensus_result: null,
          status: "draft",
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setCreating(false);
    }
  }

  function canEdit(aspect: Aspect): boolean {
    const required = ASPECT_META[aspect].role;
    return role === required || role === "admin";
  }

  function onSaved(aspect: Aspect, input: AspectInput) {
    const field = `${aspect}_input`;
    setEvals((prev) =>
      prev.map((e) =>
        e.id === current?.id
          ? ({ ...e, [field]: input } as unknown as Evaluation)
          : e
      )
    );
  }

  function onConsensus(c: ConsensusJson) {
    setEvals((prev) =>
      prev.map((e) =>
        e.id === current?.id ? { ...e, consensus_result: c } : e
      )
    );
  }

  function onApproved() {
    setEvals((prev) =>
      prev.map((e) => (e.id === current?.id ? { ...e, status: "final" } : e))
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-purple-200 bg-purple-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
          <div className="text-xs leading-6 text-purple-800">
            <p className="font-bold">Modul D6 — Evaluation Collaboration Hub</p>
            <p>
              Alur: <b>Review</b> (4 aspek paralel, dibantu AI) →{" "}
              <b>Collaborate</b> (catatan &amp; status per aspek) →{" "}
              <b>Consensus</b> (ringkasan akhir + approval Otorisator). Peran
              Anda: <b>{ROLE_LABELS[role]}</b> — kolom selain aspek Anda tampil
              read-only.
            </p>
          </div>
        </div>
      </div>

      {/* Pilih vendor */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Building2 className="h-4 w-4" /> Penawaran vendor:
        </span>
        {vendors.map((v) => (
          <button
            key={v.nama}
            onClick={() => setSelectedVendor(v.nama)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
              selectedVendor === v.nama
                ? "border-brand-700 bg-brand-800 text-white shadow-sm"
                : "border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700"
            )}
          >
            {v.nama}
          </button>
        ))}
      </div>

      {!selectedVendor && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-xs text-slate-500">
          Tidak ada dokumen penawaran untuk tender ini — jalankan{" "}
          <code className="rounded bg-white px-1">npm run seed</code> untuk
          memuat vendor contoh.
        </div>
      )}

      {selectedVendor && !current && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Evaluasi {selectedVendor} belum dimulai
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            Mulai evaluasi untuk membuka 4 kolom aspek. Setiap role mengisi
            aspeknya, lalu Panitia/Otorisator me-generate konsensus.
          </p>
          <Button
            size="sm"
            className="mt-4"
            onClick={createEvaluation}
            disabled={creating}
          >
            {creating ? <Spinner className="h-4 w-4" /> : <PlayCircle />}
            Mulai Evaluasi
          </Button>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {selectedVendor && current && (
        <>
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
            {ASPECT_ORDER.map((aspect) => (
              <EvaluationColumn
                key={aspect}
                aspect={aspect}
                tenderId={tenderId}
                vendorName={selectedVendor}
                evaluationId={current.id}
                initial={
                  (current as unknown as Record<string, AspectInput | null>)[
                    `${aspect}_input`
                  ]
                }
                canEdit={canEdit(aspect)}
                onSaved={(input) => onSaved(aspect, input)}
              />
            ))}
          </div>

          <ConsensusPanel
            tenderId={tenderId}
            vendorName={selectedVendor}
            evaluationId={current.id}
            consensus={current.consensus_result}
            isFinal={current.status === "final"}
            canGenerate={["panitia", "otorisator", "admin"].includes(role)}
            canApprove={["otorisator", "admin"].includes(role)}
            onConsensus={onConsensus}
            onApproved={onApproved}
          />

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Badge className="bg-slate-100 text-slate-500 border-slate-200">
              Status evaluasi: {current.status === "final" ? "Final" : "Draft"}
            </Badge>
            {current.status !== "final" && (
              <span>· Otorisator menyetujui setelah konsensus dibuat</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
