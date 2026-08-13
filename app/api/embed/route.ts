import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { chunkDocument } from "@/lib/ai/rag";
import { createEmbedding } from "@/lib/ai/openai";
import type { DocumentRow } from "@/types";

export const maxDuration = 120;

// Menghitung ulang embedding chunk dengan OpenAI (dipakai setelah
// OPENAI_API_KEY tersedia, supaya RAG vektor aktif).
export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user || !profile) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY belum diatur — mode demo offline aktif" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const tenderId = body.tenderId ? String(body.tenderId) : null;

    let query = supabaseClient().from("documents").select("*");
    if (tenderId) query = query.eq("tender_id", tenderId);
    const { data: docs, error } = await query.limit(20);
    if (error) throw error;

    let processed = 0;
    for (const doc of docs as DocumentRow[]) {
      const chunks = chunkDocument(doc);
      for (const c of chunks) {
        const embedding = await createEmbedding(c.content);
        const { error: updErr } = await supabaseClient()
          .from("document_chunks")
          .update({ embedding })
          .eq("document_id", doc.id)
          .eq("content", c.content);
        if (updErr) throw updErr;
        processed++;
      }
    }

    return NextResponse.json({ ok: true, chunks_processed: processed });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat embedding" },
      { status: 500 }
    );
  }
}
