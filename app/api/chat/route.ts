import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { chatAnswer } from "@/lib/ai";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const tenderId = String(body.tenderId ?? "");
    const question = String(body.question ?? "").trim();

    if (!tenderId || !question) {
      return NextResponse.json({ error: "Pertanyaan tidak boleh kosong" }, { status: 400 });
    }

    const { answer, sources } = await chatAnswer({ tenderId, question });

    // simpan riwayat (best effort)
    await supabaseClient().from("chat_history").insert({
      tender_id: tenderId,
      user_id: user.id,
      question,
      answer,
      sources,
    });

    return NextResponse.json({ answer, sources });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menjawab" },
      { status: 500 }
    );
  }
}
