import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import type { BaJson, QnaNote } from "@/types";

export async function POST(request: Request) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      tenderId,
      qnaNotes,
      hasilGenerate,
      status,
    }: {
      id?: string;
      tenderId: string;
      qnaNotes: QnaNote[];
      hasilGenerate: BaJson;
      status: "draft" | "final";
    } = body;

    if (!tenderId || !hasilGenerate) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const payload = {
      tender_id: tenderId,
      qna_notes: qnaNotes ?? [],
      hasil_generate: hasilGenerate,
      status: status ?? "draft",
      updated_at: new Date().toISOString(),
    };

    if (id) {
      const { data, error } = await supabaseClient()
        .from("berita_acara")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single();
      if (error) throw error;
      return NextResponse.json({ id: data.id });
    }

    const { data, error } = await supabaseClient()
      .from("berita_acara")
      .insert({ ...payload, created_by: user.id })
      .select("id")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan" },
      { status: 500 }
    );
  }
}
