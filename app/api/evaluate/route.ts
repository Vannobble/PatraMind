import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { evaluateAspect } from "@/lib/ai";
import type { Aspect, AspectStatus } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user || !profile) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const tenderId = String(body.tenderId ?? "");
    const vendorName = String(body.vendorName ?? "");
    const aspect = String(body.aspect ?? "") as Aspect;

    if (!tenderId || !vendorName) {
      return NextResponse.json({ error: "Tender atau vendor tidak ditemukan" }, { status: 400 });
    }

    const { data: rksDoc } = await supabaseClient()
      .from("documents")
      .select("*")
      .eq("tender_id", tenderId)
      .eq("jenis", "rks_tor")
      .limit(1)
      .maybeSingle();

    const { data: offers } = await supabaseClient()
      .from("documents")
      .select("*")
      .eq("tender_id", tenderId)
      .eq("jenis", "penawaran")
      .limit(20);

    const normalized = (s: string) =>
      s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const vendorOffer = (offers ?? []).find((d) =>
      normalized(d.nama_file).includes(normalized(vendorName))
    ) ?? (offers?.[0] ?? null);

    const result = await evaluateAspect({
      aspect,
      vendorName,
      rksSpec: rksDoc?.konten_text ?? "(RKS tidak ditemukan)",
      vendorOffer: vendorOffer?.konten_text ?? "(Dokumen penawaran tidak ditemukan)",
    });

    const status: AspectStatus = result.status;
    return NextResponse.json({
      analysis: result.analysis,
      rekomendasi: result.rekomendasi,
      status,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menganalisis" },
      { status: 500 }
    );
  }
}
