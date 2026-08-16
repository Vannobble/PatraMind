import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { departmentProposal, scoreAssessment } from "@/lib/ai";
import type { DepartmentAssessment, DocumentRow, Evaluation } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user || !profile) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const action = String(body.action ?? "");
    const evaluationId = String(body.evaluationId ?? "");
    const departmentId = String(body.departmentId ?? "");

    if (!evaluationId || !departmentId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const { data: evalRow } = await supabaseClient()
      .from("evaluations")
      .select("id, tender_id, vendor_name")
      .eq("id", evaluationId)
      .maybeSingle();
    if (!evalRow) throw new Error("Evaluasi tidak ditemukan");
    const ev = evalRow as unknown as Evaluation;

    // pastikan baris penilaian ada (upsert)
    const { data: existing } = await supabaseClient()
      .from("department_assessments")
      .select("*")
      .eq("evaluation_id", evaluationId)
      .eq("department_id", departmentId)
      .maybeSingle();
    const existingRow = existing as unknown as DepartmentAssessment | null;

    async function ensureRow() {
      if (existingRow) return existingRow;
      const { data, error } = await supabaseClient()
        .from("department_assessments")
        .insert({
          evaluation_id: evaluationId,
          department_id: departmentId,
          status: "belum",
        })
        .select("*")
        .single();
      if (error) throw error;
      return data as unknown as DepartmentAssessment;
    }

    if (action === "propose") {
      const row = await ensureRow();
      const [rks, offer] = await Promise.all([
        supabaseClient()
          .from("documents")
          .select("konten_text")
          .eq("tender_id", ev.tender_id)
          .eq("jenis", "rks_tor")
          .limit(1)
          .maybeSingle(),
        supabaseClient()
          .from("documents")
          .select("konten_text")
          .eq("tender_id", ev.tender_id)
          .eq("jenis", "penawaran")
          .ilike("nama_file", `%${ev.vendor_name}%`)
          .limit(1)
          .maybeSingle(),
      ]);
      const proposal = await departmentProposal({
        departmentName: body.departmentName || "Departemen",
        vendorName: ev.vendor_name,
        rksSpec: String(rks?.data?.konten_text ?? ""),
        vendorOffer: String(offer?.data?.konten_text ?? ""),
      });
      const { error } = await supabaseClient()
        .from("department_assessments")
        .update({ ai_proposal: proposal, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ proposal });
    }

    if (action === "save_penilaian") {
      const row = await ensureRow();
      const teks = String(body.penilaianTeks ?? "").trim();
      if (teks.length < 3) {
        return NextResponse.json({ error: "Penilaian terlalu pendek" }, { status: 400 });
      }
      const { error } = await supabaseClient()
        .from("department_assessments")
        .update({
          penilaian_teks: teks,
          status: "dinilai",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "score") {
      const row = await ensureRow();
      if (row.penilaian_teks.trim().length < 3) {
        return NextResponse.json(
          { error: "Tulis penilaian departemen terlebih dahulu" },
          { status: 400 }
        );
      }
      const result = await scoreAssessment({
        departmentName: body.departmentName || "Departemen",
        penilaianTeks: row.penilaian_teks,
      });
      const { error } = await supabaseClient()
        .from("department_assessments")
        .update({
          ai_skor: result.skor,
          ai_ringkasan: result.ringkasan,
          status: "diskor",
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ skor: result.skor, ringkasan: result.ringkasan });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses penilaian" },
      { status: 500 }
    );
  }
}