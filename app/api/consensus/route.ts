import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { generateConsensus } from "@/lib/ai";
import type { Aspect, AspectInput, Evaluation } from "@/types";

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

    const { data: evalRow } = await supabaseClient()
      .from("evaluations")
      .select("*")
      .eq("id", evaluationId)
      .single();

    if (!evalRow) throw new Error("Evaluasi tidak ditemukan");
    const ev = evalRow as unknown as Evaluation;

    const inputs: Record<Aspect, AspectInput | null> = {
      teknis: ev.teknis_input,
      legal: ev.legal_input,
      harga: ev.harga_input,
      k3: ev.k3_input,
    };

    const consensus = await generateConsensus({
      vendorName: vendorName || ev.vendor_name,
      inputs,
    });

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
