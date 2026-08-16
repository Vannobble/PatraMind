import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { ROLE_DEPT_MAP } from "@/lib/constants";
import {
  assessmentChatAnswer,
  departmentProposal,
  scoreAssessment,
  summarizeAssessment,
} from "@/lib/ai";
import type {
  AssessmentChatMessage,
  Department,
  DepartmentAssessment,
  DocumentRow,
  Evaluation,
  Role,
} from "@/types";

export const maxDuration = 60;

async function canAccess(
  departmentId: string,
  role: Role
): Promise<{ ok: boolean; reason?: string }> {
  if (role === "admin") return { ok: true };
  const mapped = ROLE_DEPT_MAP[role];
  if (!mapped) return { ok: false, reason: "Peran Anda tidak memiliki departemen penilaian" };
  const { data } = await supabaseClient()
    .from("departments")
    .select("nama")
    .eq("id", departmentId)
    .maybeSingle();
  if (!data || (data as Department).nama !== mapped) {
    return { ok: false, reason: "Anda hanya dapat mengisi penilaian departemen Anda sendiri" };
  }
  return { ok: true };
}

async function getEval(evaluationId: string): Promise<Evaluation> {
  const { data } = await supabaseClient()
    .from("evaluations")
    .select("id, tender_id, vendor_name")
    .eq("id", evaluationId)
    .maybeSingle();
  if (!data) throw new Error("Evaluasi tidak ditemukan");
  return data as unknown as Evaluation;
}

async function ensureRow(
  evaluationId: string,
  departmentId: string
): Promise<DepartmentAssessment> {
  const { data: existing } = await supabaseClient()
    .from("department_assessments")
    .select("*")
    .eq("evaluation_id", evaluationId)
    .eq("department_id", departmentId)
    .maybeSingle();
  if (existing) return existing as unknown as DepartmentAssessment;
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

async function getTenderDocs(
  tenderId: string,
  vendorName: string
): Promise<{ rksSpec: string; vendorOffer: string }> {
  const [rks, offer] = await Promise.all([
    supabaseClient()
      .from("documents")
      .select("konten_text")
      .eq("tender_id", tenderId)
      .eq("jenis", "rks_tor")
      .limit(1)
      .maybeSingle(),
    supabaseClient()
      .from("documents")
      .select("konten_text")
      .eq("tender_id", tenderId)
      .eq("jenis", "penawaran")
      .ilike("nama_file", `%${vendorName}%`)
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    rksSpec: String((rks?.data as DocumentRow | null)?.konten_text ?? ""),
    vendorOffer: String((offer?.data as DocumentRow | null)?.konten_text ?? ""),
  };
}

export async function GET(request: Request) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const url = new URL(request.url);
    const evaluationId = String(url.searchParams.get("evaluationId") ?? "");
    const departmentId = String(url.searchParams.get("departmentId") ?? "");
    if (!evaluationId || !departmentId) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    const { data } = await supabaseClient()
      .from("department_chat_messages")
      .select("*")
      .eq("evaluation_id", evaluationId)
      .eq("department_id", departmentId)
      .order("created_at", { ascending: true });
    return NextResponse.json({
      messages: (data ?? []) as AssessmentChatMessage[],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat percakapan" },
      { status: 500 }
    );
  }
}

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

    const ev = await getEval(evaluationId);
    const auth = await canAccess(departmentId, profile.role as Role);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.reason }, { status: 403 });
    }

    const { data: deptRow } = await supabaseClient()
      .from("departments")
      .select("nama")
      .eq("id", departmentId)
      .maybeSingle();
    const departmentName =
      (deptRow as Department | null)?.nama ?? "Departemen";

    if (action === "chat") {
      const message = String(body.message ?? "").trim();
      if (message.length < 2) {
        return NextResponse.json({ error: "Pertanyaan terlalu pendek" }, { status: 400 });
      }
      const { rksSpec, vendorOffer } = await getTenderDocs(ev.tender_id, ev.vendor_name);
      const reply = await assessmentChatAnswer({
        departmentName,
        vendorName: ev.vendor_name,
        rksSpec,
        vendorOffer,
        question: message,
      });
      const rows = [
        { evaluation_id: evaluationId, department_id: departmentId, role: "user", content: message },
        { evaluation_id: evaluationId, department_id: departmentId, role: "assistant", content: reply },
      ];
      const { error } = await supabaseClient()
        .from("department_chat_messages")
        .insert(rows);
      if (error) throw error;
      const { data: history } = await supabaseClient()
        .from("department_chat_messages")
        .select("*")
        .eq("evaluation_id", evaluationId)
        .eq("department_id", departmentId)
        .order("created_at", { ascending: true });
      return NextResponse.json({
        reply,
        messages: (history ?? []) as AssessmentChatMessage[],
      });
    }

    if (action === "rangkum") {
      const { data: history } = await supabaseClient()
        .from("department_chat_messages")
        .select("role, content")
        .eq("evaluation_id", evaluationId)
        .eq("department_id", departmentId)
        .order("created_at", { ascending: true });
      const messages = (history ?? []).map((m) => ({
        role: m.role as "user" | "assistant",
        content: String(m.content ?? ""),
      }));
      const penilaian = await summarizeAssessment({
        departmentName,
        vendorName: ev.vendor_name,
        messages,
      });
      const row = await ensureRow(evaluationId, departmentId);
      const { error } = await supabaseClient()
        .from("department_assessments")
        .update({
          penilaian_teks: penilaian,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ penilaian });
    }

    if (action === "submit") {
      const row = await ensureRow(evaluationId, departmentId);
      if (row.status !== "diskor") {
        return NextResponse.json(
          { error: "Lakukan analisis AI (skor) terlebih dahulu sebelum submit" },
          { status: 400 }
        );
      }
      const { error } = await supabaseClient()
        .from("department_assessments")
        .update({ status: "submitted", updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, status: "submitted" });
    }

    if (action === "reopen") {
      if (profile.role !== "admin") {
        return NextResponse.json({ error: "Khusus Admin" }, { status: 403 });
      }
      const row = await ensureRow(evaluationId, departmentId);
      const { error } = await supabaseClient()
        .from("department_assessments")
        .update({ status: "diskor", updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ ok: true, status: "diskor" });
    }

    const row = await ensureRow(evaluationId, departmentId);

    if (action === "propose") {
      const { rksSpec, vendorOffer } = await getTenderDocs(ev.tender_id, ev.vendor_name);
      const proposal = await departmentProposal({
        departmentName,
        vendorName: ev.vendor_name,
        rksSpec,
        vendorOffer,
      });
      const { error } = await supabaseClient()
        .from("department_assessments")
        .update({ ai_proposal: proposal, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) throw error;
      return NextResponse.json({ proposal });
    }

    if (action === "save_penilaian") {
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
      if (row.penilaian_teks.trim().length < 3) {
        return NextResponse.json(
          { error: "Tulis penilaian departemen terlebih dahulu" },
          { status: 400 }
        );
      }
      const result = await scoreAssessment({
        departmentName,
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