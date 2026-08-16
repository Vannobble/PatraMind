"use client";

import { useState } from "react";
import { PlayCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EvaluationColumn } from "./evaluation-column";
import { AspectSidePanel } from "./aspect-side-panel";
import { DepartmentBoard } from "./department-board";
import { ConsensusPanel } from "./consensus-panel";
import { ASPECT_META, ASPECT_ORDER, ROLE_LABELS } from "@/lib/constants";
import type {
  Aspect,
  AspectInput,
  ConsensusJson,
  Department,
  DepartmentAssessment,
  Evaluation,
  Role,
  TenderDepartment,
  TenderMode,
} from "@/types";

export function EvaluationBoard({
  tenderId,
  initialEvals,
  role,
  initialVendor,
  mode,
  departments,
  tenderDepartments,
  initialAssessments,
}: {
  tenderId: string;
  initialEvals: Evaluation[];
  role: Role;
  initialVendor?: string;
  mode: TenderMode;
  departments: Department[];
  tenderDepartments: TenderDepartment[];
  initialAssessments: DepartmentAssessment[];
}) {
  const [evals, setEvals] = useState<Evaluation[]>(initialEvals);
  const [assessments, setAssessments] = useState<DepartmentAssessment[]>(
    initialAssessments
  );
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current: Evaluation | undefined =
    evals.find((e) => e.vendor_name === initialVendor) ?? evals[0];
  const selectedVendor = current?.vendor_name ?? initialVendor ?? "";

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
    if (role === "admin") return true;
    const required = ASPECT_META[aspect].role;
    return role === required;
  }

  const ROLE_TO_ASPECT: Partial<Record<Role, Aspect>> = {
    teknis: "teknis",
    legal: "legal",
    panitia: "harga",
    k3: "k3",
  };
  const visibleAspects: Aspect[] =
    role === "admin" || role === "otorisator"
      ? ASPECT_ORDER
      : ROLE_TO_ASPECT[role]
        ? [ROLE_TO_ASPECT[role] as Aspect]
        : [];

  const submittedCount = assessments.filter(
    (a) => a.status === "submitted"
  ).length;
  const totalDivisions = tenderDepartments.length;

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
              {mode === "departemen" ? (
                <>
                  Alur: <b>Usulan AI</b> (draft per departemen) →{" "}
                  <b>Penilaian Departemen</b> (bahasa manusia) →{" "}
                  <b>Skor AI 0–100</b> → <b>Konsensus tertimbang</b> sesuai
                  bobot. Peran Anda: <b>{ROLE_LABELS[role]}</b> — departemen
                  selain milik Anda tampil read-only.
                </>
              ) : (
                <>
                  Alur: <b>Review</b> (4 aspek paralel, dibantu AI) →{" "}
                  <b>Collaborate</b> (catatan &amp; status per aspek) →{" "}
                  <b>Consensus</b> (ringkasan akhir + approval Otorisator).
                  Peran Anda: <b>{ROLE_LABELS[role]}</b> — kolom selain aspek
                  Anda tampil read-only.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {!current && selectedVendor && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <p className="text-sm font-semibold text-slate-700">
            Evaluasi {selectedVendor} belum dimulai
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-500">
            {mode === "departemen"
              ? "Mulai evaluasi untuk membuka kartu penilaian per departemen."
              : "Mulai evaluasi untuk membuka 4 kolom aspek. Setiap role mengisi aspeknya, lalu Panitia/Otorisator me-generate konsensus."}
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
          {mode === "departemen" ? (
            <DepartmentBoard
              evaluation={current}
              departments={departments}
              tenderDepartments={tenderDepartments}
              assessments={assessments}
              role={role}
              onAssessments={setAssessments}
            />
          ) : visibleAspects.length === 1 ? (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
              <EvaluationColumn
                aspect={visibleAspects[0]}
                tenderId={tenderId}
                vendorName={selectedVendor}
                evaluationId={current.id}
                initial={
                  (current as unknown as Record<string, AspectInput | null>)[
                    `${visibleAspects[0]}_input`
                  ]
                }
                canEdit={canEdit(visibleAspects[0])}
                onSaved={(input) => onSaved(visibleAspects[0], input)}
              />
              <div className="hidden lg:block">
                <AspectSidePanel
                  tenderId={tenderId}
                  vendorName={selectedVendor}
                  aspect={visibleAspects[0]}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleAspects.map((aspect) => (
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
          )}

          <ConsensusPanel
            tenderId={tenderId}
            vendorName={selectedVendor}
            evaluationId={current.id}
            consensus={current.consensus_result}
            isFinal={current.status === "final"}
            canGenerate={["otorisator", "admin"].includes(role)}
            canApprove={["otorisator", "admin"].includes(role)}
            mode={mode}
            totalDivisions={totalDivisions}
            submittedDivisions={submittedCount}
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