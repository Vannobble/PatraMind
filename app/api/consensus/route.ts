import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { generateConsensus, weightedConsensus } from "@/lib/ai";
import type {
  Aspect,
  AspectInput,
  DepartmentAssessment,
  Evaluation,
  Tender,
  TenderDepartment,
} from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user || !profile) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const evaluationId = String(body.evaluationId ?? "");
    const tenderId = String(body.tenderId ?? "");
    const vendorName = String(body.vendorName ?? "");

    if (!evaluationId) {
      return NextResponse.json({ error: "Evaluasi tidak ditemukan" }, { status: 400 });
    }

    const [{ data: evalRow }, { data: tenderRow }] = await Promise.all([
      supabaseClient()
        .from("evaluations")
        .select("*")
        .eq("id", evaluationId)
        .single(),
      supabaseClient()
        .from("tenders")
        .select("mode_evaluasi")
        .eq("id", tenderId)
        .maybeSingle(),
    ]);

    if (!evalRow) throw new Error("Evaluasi tidak ditemukan");
    const ev = evalRow as unknown as Evaluation;
    const mode = (tenderRow as unknown as { mode_evaluasi?: string } | null)
      ?.mode_evaluasi;

    let consensus;
    if (mode === "departemen") {
      const [tds, deps, assessments] = await Promise.all([
        supabaseClient()
          .from("tender_departments")
          .select("*")
          .eq("tender_id", tenderId),
        supabaseClient().from("departments").select("id, nama"),
        supabaseClient()
          .from("department_assessments")
          .select("*")
          .eq("evaluation_id", evaluationId),
      ]);
      const deptName = new Map(
        (deps?.data ?? []).map((d) => [d.id as string, d.nama as string])
      );
      const bobotMap = new Map(
        ((tds?.data ?? []) as TenderDepartment[]).map((td) => [
          td.department_id,
          td.bobot,
        ])
      );
      const items = ((assessments?.data ?? []) as DepartmentAssessment[])
        .filter(
          (a) =>
            a.status !== "belum" &&
            a.ai_skor !== null &&
            bobotMap.has(a.department_id)
        )
        .map((a) => ({
          department: deptName.get(a.department_id) ?? "Departemen",
          penilaian: a.penilaian_teks,
          skor: a.ai_skor as number,
          bobot: bobotMap.get(a.department_id) ?? 0,
        }));

      if (items.length === 0) {
        return NextResponse.json(
          { error: "Belum ada penilaian departemen yang diskor AI" },
          { status: 400 }
        );
      }
      consensus = await weightedConsensus({
        vendorName: vendorName || ev.vendor_name,
        items,
      });
    } else {
      const inputs: Record<Aspect, AspectInput | null> = {
        teknis: ev.teknis_input,
        legal: ev.legal_input,
        harga: ev.harga_input,
        k3: ev.k3_input,
      };
      consensus = await generateConsensus({
        vendorName: vendorName || ev.vendor_name,
        inputs,
      });
    }

    const { error } = await supabaseClient()
      .from("evaluations")
      .update({ consensus_result: consensus, updated_at: new Date().toISOString() })
      .eq("id", evaluationId);
    if (error) throw error;

    return NextResponse.json({ consensus, tenderId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat konsensus" },
      { status: 500 }
    );
  }
}