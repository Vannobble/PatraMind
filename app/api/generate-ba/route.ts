import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { generateBa } from "@/lib/ai";
import { sleep } from "@/lib/utils";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (!["panitia", "admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Hanya Panitia yang dapat generate BA" }, { status: 403 });
    }

    const body = await request.json();
    const tenderId = String(body.tenderId ?? "");
    const qnaNotes = Array.isArray(body.qnaNotes) ? body.qnaNotes : [];

    const [{ data: tender }, { data: rksDoc }] = await Promise.all([
      supabaseClient().from("tenders").select("*").eq("id", tenderId).single(),
      supabaseClient()
        .from("documents")
        .select("*")
        .eq("tender_id", tenderId)
        .eq("jenis", "rks_tor")
        .limit(1)
        .maybeSingle(),
    ]);
    if (!tender) throw new Error("Tender tidak ditemukan");

    const rksContent = rksDoc?.konten_text ?? "(RKS/TOR belum tersedia)";
    const result = await generateBa({
      tender,
      rksContent,
      qnaNotes: qnaNotes.map(
        (n: { pertanyaan?: string; jawaban?: string }, i: number) => ({
          no: i + 1,
          pertanyaan: String(n.pertanyaan ?? ""),
          jawaban: String(n.jawaban ?? ""),
        })
      ),
    });

    return NextResponse.json({ hasil: result });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal generate Berita Acara" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Biarkan ada untuk menghindari caching statis
  await sleep(0);
  return NextResponse.json({ ok: true });
}
