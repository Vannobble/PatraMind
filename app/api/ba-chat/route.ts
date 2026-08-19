import { NextResponse } from "next/server";
import { getApiUser } from "@/lib/api-auth";
import { baChatAnswer } from "@/lib/ai";
import type { BaJson } from "@/types";

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const ba = (body.ba ?? null) as BaJson | null;
    const question = String(body.question ?? "").trim();

    if (!ba || !question) {
      return NextResponse.json(
        { error: "Berita Acara dan pertanyaan wajib diisi" },
        { status: 400 }
      );
    }

    const result = await baChatAnswer({ ba, question });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses pertanyaan" },
      { status: 500 }
    );
  }
}