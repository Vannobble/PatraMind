import { Gauge, FileCheck2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ASPECT_META, ASPECT_ORDER, ROLE_LABELS } from "@/lib/constants";
import type {
  AspectStatus,
  Department,
  DepartmentAssessment,
  Evaluation,
  TenderDepartment,
  TenderMode,
} from "@/types";

function skorBadge(skor: number): { label: string; cls: string } {
  if (skor >= 75)
    return {
      label: "Layak Dilanjutkan",
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  if (skor >= 50)
    return {
      label: "Perlu Klarifikasi",
      cls: "bg-amber-50 text-amber-700 border-amber-200",
    };
  return { label: "Tidak Layak", cls: "bg-red-50 text-red-700 border-red-200" };
}

const STATUS_LABEL: Record<AspectStatus, string> = {
  dinilai: "Dinilai",
  perlu_klarifikasi: "Perlu Klarifikasi",
  belum_dinilai: "Belum Dinilai",
};

const STATUS_BADGE: Record<AspectStatus, string> = {
  dinilai: "bg-emerald-50 text-emerald-700 border-emerald-200",
  perlu_klarifikasi: "bg-amber-50 text-amber-700 border-amber-200",
  belum_dinilai: "bg-slate-100 text-slate-500 border-slate-200",
};

export function ScoreSummary({
  evaluation,
  mode,
  departments,
  tenderDepartments,
  assessments,
}: {
  evaluation: Evaluation;
  mode: TenderMode;
  departments: Department[];
  tenderDepartments: TenderDepartment[];
  assessments: DepartmentAssessment[];
}) {
  let rows: { label: string; role: string; skor: number | null; status: AspectStatus | null; bobot?: number }[] = [];
  let skorAkhir: number | null = null;

  if (mode === "departemen") {
    rows = tenderDepartments.map((td) => {
      const dep = departments.find((d) => d.id === td.department_id);
      const asm = assessments.find((a) => a.department_id === td.department_id);
      return {
        label: dep?.nama ?? "Departemen",
        role: `${td.bobot}% bobot`,
        skor: asm?.ai_skor ?? null,
        status: (asm?.status as AspectStatus | null) ?? null,
        bobot: td.bobot,
      };
    });
    const weighted = rows
      .filter((r) => r.skor != null && r.bobot != null)
      .reduce(
        (acc, r) => ({
          sum: acc.sum + (r.skor as number) * (r.bobot as number),
          bobot: acc.bobot + (r.bobot as number),
        }),
        { sum: 0, bobot: 0 }
      );
    if (weighted.bobot > 0) skorAkhir = Math.round(weighted.sum / weighted.bobot);
  } else {
    rows = ASPECT_ORDER.map((aspect) => {
      const input = evaluation[`${aspect}_input`];
      return {
        label: ASPECT_META[aspect].label,
        role: ROLE_LABELS[ASPECT_META[aspect].role],
        skor: input?.skor ?? null,
        status: input?.status ?? null,
      };
    });
    const valid = rows
      .map((r) => r.skor)
      .filter((s): s is number => s != null);
    if (valid.length > 0)
      skorAkhir = Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }

  const finalBadge = skorAkhir != null ? skorBadge(skorAkhir) : null;
  const consensus = evaluation.consensus_result;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Gauge className="h-4 w-4" />
          </span>
          <p className="text-sm font-bold text-brand-950">Ringkasan Skor</p>
        </div>
        <Badge
          className={
            evaluation.status === "final"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
              : "bg-slate-100 text-slate-600 border-slate-200"
          }
        >
          <FileCheck2 className="h-3 w-3" />
          {evaluation.status === "final" ? "Final" : "Draft"}
        </Badge>
      </div>

      <div className="space-y-1.5">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/70 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-800">
                {r.label}
              </p>
              <p className="text-[10px] text-slate-400">{r.role}</p>
            </div>
            {r.skor != null ? (
              <span className="flex items-center gap-1.5">
                <span className="font-display text-sm font-bold text-slate-900">
                  {r.skor}
                </span>
                {r.status && (
                  <Badge className={cn("hidden sm:inline-flex", STATUS_BADGE[r.status])}>
                    {STATUS_LABEL[r.status]}
                  </Badge>
                )}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-slate-400">
                Belum dinilai
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
            Skor Akhir
          </p>
          {finalBadge ? (
            <span className="font-display text-lg font-bold text-brand-900">
              {skorAkhir}
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">—</span>
          )}
        </div>
        {finalBadge && (
          <Badge className={cn("mt-1.5 w-full justify-center", finalBadge.cls)}>
            {finalBadge.label}
          </Badge>
        )}
      </div>

      {consensus && (
        <div className="mt-3 space-y-1.5 rounded-lg border border-purple-200 bg-purple-50/60 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-purple-700">
            Hasil Konsensus
          </p>
          {consensus.skor_akhir != null && (
            <p className="text-xs text-purple-800">
              Skor akhir konsensus:{" "}
              <b className="font-display">{consensus.skor_akhir}</b> —{" "}
              {consensus.rekomendasi}
            </p>
          )}
          <p className="line-clamp-3 text-[11px] leading-5 text-purple-800/80">
            {consensus.kesimpulan}
          </p>
        </div>
      )}
    </div>
  );
}