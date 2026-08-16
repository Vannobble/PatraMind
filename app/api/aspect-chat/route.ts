import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { ASPECT_META } from "@/lib/constants";
import { assessmentChatAnswer } from "@/lib/ai";
import type { Aspect, AspectChatMessage, DocumentRow, Role } from "@/types";

export const maxDuration = 60;

function canAccess(aspect: Aspect, role: Role): boolean {
  return role === "admin" || ASPECT_META[aspect].role === role;
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
    const aspect = String(url.searchParams.get("aspect") ?? "") as Aspect;
    if (!evaluationId || !aspect) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    const { data } = await supabaseClient()
      .from("aspect_chat_messages")
      .select("*")
      .eq("evaluation_id", evaluationId)
      .eq("aspect", aspect)
      .order("created_at", { ascending: true });
    return NextResponse.json({ messages: (data ?? []) as AspectChatMessage[] });
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
    const evaluationId = String(body.evaluationId ?? "");
    const aspect = String(body.aspect ?? "") as Aspect;
    const message = String(body.message ?? "").trim();

    if (!evaluationId || !aspect || message.length < 2) {
      return NextResponse.json(
        { error: "Pertanyaan terlalu pendek atau data tidak lengkap" },
        { status: 400 }
      );
    }
    if (!ASPECT_META[aspect]) {
      return NextResponse.json({ error: "Aspek tidak dikenal" }, { status: 400 });
    }
    if (!canAccess(aspect, profile.role as Role)) {
      return NextResponse.json(
        { error: "Anda hanya dapat bertanya pada kolom aspek milik peran Anda" },
        { status: 403 }
      );
    }

    const { data: evalRow } = await supabaseClient()
      .from("evaluations")
      .select("tender_id, vendor_name")
      .eq("id", evaluationId)
      .maybeSingle();
    if (!evalRow) throw new Error("Evaluasi tidak ditemukan");

    const { rksSpec, vendorOffer } = await getTenderDocs(
      String(evalRow.tender_id),
      String(evalRow.vendor_name)
    );
    const reply = await assessmentChatAnswer({
      departmentName: ASPECT_META[aspect].label,
      vendorName: String(evalRow.vendor_name),
      rksSpec,
      vendorOffer,
      question: message,
    });

    const { error } = await supabaseClient()
      .from("aspect_chat_messages")
      .insert([
        { evaluation_id: evaluationId, aspect, role: "user", content: message },
        { evaluation_id: evaluationId, aspect, role: "assistant", content: reply },
      ]);
    if (error) throw error;

    const { data: history } = await supabaseClient()
      .from("aspect_chat_messages")
      .select("*")
      .eq("evaluation_id", evaluationId)
      .eq("aspect", aspect)
      .order("created_at", { ascending: true });
    return NextResponse.json({
      reply,
      messages: (history ?? []) as AspectChatMessage[],
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menjawab" },
      { status: 500 }
    );
  }
}