import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import type { Aspect, AspectInput } from "@/types";

export async function GET(request: Request) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const tenderId = searchParams.get("tenderId");
    if (!tenderId) {
      return NextResponse.json({ error: "tenderId wajib" }, { status: 400 });
    }

    const { data, error } = await supabaseClient()
      .from("evaluations")
      .select("*")
      .eq("tender_id", tenderId)
      .order("vendor_name");
    if (error) throw error;
    return NextResponse.json({ evaluations: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat" },
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
    const action: string = body.action ?? "";

    if (action === "create") {
      const tenderId = String(body.tenderId ?? "");
      const vendorName = String(body.vendorName ?? "");
      if (!tenderId || !vendorName) {
        return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
      }
      const { data, error } = await supabaseClient()
        .from("evaluations")
        .insert({ tender_id: tenderId, vendor_name: vendorName, status: "draft" })
        .select("id")
        .single();
      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    if (action === "save_aspect") {
      const evaluationId = String(body.evaluationId ?? "");
      const aspect = String(body.aspect ?? "") as Aspect;
      const input: AspectInput = body.input;
      if (!evaluationId || !["teknis", "legal", "harga", "k3"].includes(aspect) || !input) {
        return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
      }

      const field = `${aspect}_input` as const;
      const { error } = await supabaseClient()
        .from("evaluations")
        .update({
          [field]: { ...input, updated_by: user.id, updated_at: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        })
        .eq("id", evaluationId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "save_consensus") {
      const evaluationId = String(body.evaluationId ?? "");
      const consensus = body.consensus;
      if (!evaluationId || !consensus) {
        return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
      }
      const { error } = await supabaseClient()
        .from("evaluations")
        .update({ consensus_result: consensus, updated_at: new Date().toISOString() })
        .eq("id", evaluationId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    if (action === "approve") {
      if (profile.role !== "otorisator") {
        return NextResponse.json({ error: "Hanya Otorisator yang dapat menyetujui" }, { status: 403 });
      }
      const evaluationId = String(body.evaluationId ?? "");
      const { error } = await supabaseClient()
        .from("evaluations")
        .update({ status: "final", updated_at: new Date().toISOString() })
        .eq("id", evaluationId);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan" },
      { status: 500 }
    );
  }
}
