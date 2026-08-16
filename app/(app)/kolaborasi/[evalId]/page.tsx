import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationBoard } from "@/components/d6/evaluation-board";
import { WeightEditor } from "@/components/kolaborasi/weight-editor";
import { DokumenRelevan } from "@/components/kolaborasi/dokumen-relevan";
import type {
  Department,
  DepartmentAssessment,
  DocumentRow,
  Evaluation,
  Role,
  Tender,
  TenderDepartment,
  TenderMode,
} from "@/types";

export const dynamic = "force-dynamic";

export default async function KolaborasiDetailPage({
  params,
}: {
  params: Promise<{ evalId: string }>;
}) {
  const { evalId } = await params;

  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const { data: evalRow } = await supabaseClient()
    .from("evaluations")
    .select("*")
    .eq("id", evalId)
    .maybeSingle();

  if (!evalRow) notFound();
  const e = evalRow as Evaluation;

  const [{ data: tender }, { data: evals }, { data: docs }, depsData, tdsData, asmtData] =
    await Promise.all([
      supabaseClient()
        .from("tenders")
        .select("*")
        .eq("id", e.tender_id)
        .maybeSingle(),
      supabaseClient()
        .from("evaluations")
        .select("*")
        .eq("tender_id", e.tender_id)
        .order("vendor_name"),
      supabaseClient()
        .from("documents")
        .select("id, tender_id, jenis, nama_file, created_at")
        .eq("tender_id", e.tender_id)
        .order("created_at"),
      supabaseClient().from("departments").select("*").order("nama"),
      supabaseClient()
        .from("tender_departments")
        .select("*")
        .eq("tender_id", e.tender_id),
      supabaseClient()
        .from("department_assessments")
        .select("*")
        .eq("evaluation_id", evalId),
    ]);

  const t = (tender as Tender | null) ?? null;
  const docRows = (docs ?? []) as DocumentRow[];
  const departments = (depsData.data ?? []) as Department[];
  const tenderDepartments = (tdsData.data ?? []) as TenderDepartment[];
  const assessments = (asmtData.data ?? []) as DepartmentAssessment[];
  const canConfig = ["panitia", "admin"].includes(profile?.role ?? "");

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <BackButton
            fallback="/kolaborasi"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-900"
          />
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Building2 className="h-4.5 w-4.5" />
            </span>
            <h2 className="font-display text-lg font-bold text-brand-950">
              {e.vendor_name}
            </h2>
            <Badge
              className={
                e.status === "final"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }
            >
              {e.status === "final" ? "Final" : "Draft"}
            </Badge>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {t?.nama_pekerjaan ?? "Tender telah dihapus"} ·{" "}
            <span className="font-mono text-brand-700">
              {t?.nomor_pr || "-"}
            </span>
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          {canConfig && (
            <WeightEditor
              tenderId={e.tender_id}
              initialMode={t?.mode_evaluasi ?? "aspek"}
              departments={departments}
              tenderDepartments={tenderDepartments}
              isAdmin={profile?.role === "admin"}
            />
          )}
          <EvaluationBoard
            tenderId={e.tender_id}
            initialEvals={(evals ?? []) as Evaluation[]}
            role={(profile?.role ?? "panitia") as Role}
            initialVendor={e.vendor_name}
            mode={(t?.mode_evaluasi ?? "aspek") as TenderMode}
            departments={departments}
            tenderDepartments={tenderDepartments}
            initialAssessments={assessments}
          />
        </div>
        <DokumenRelevan docs={docRows} activeVendor={e.vendor_name} />
      </div>
    </div>
  );
}