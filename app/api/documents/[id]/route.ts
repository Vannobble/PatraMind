import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { chunkDocument, mockEmbedding } from "@/lib/ai/rag";
import type { DocumentRow } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const nama_file = body.nama_file !== undefined ? String(body.nama_file).trim() : undefined;
    const konten_text = body.konten_text !== undefined ? String(body.konten_text).trim() : undefined;

    if (nama_file === undefined && konten_text === undefined) {
      return NextResponse.json({ error: "Tidak ada perubahan" }, { status: 400 });
    }

    const payload: { nama_file?: string; konten_text?: string } = {};
    if (nama_file !== undefined) payload.nama_file = nama_file;
    if (konten_text !== undefined) payload.konten_text = konten_text;

    const { data: updated, error } = await supabaseClient()
      .from("documents")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;

    // Re-chunk RAG agar konteks AI tetap sinkron dengan isi terbaru
    if (konten_text !== undefined) {
      const { error: delError } = await supabaseClient()
        .from("document_chunks")
        .delete()
        .eq("document_id", id);
      if (delError) throw delError;

      const full = updated as DocumentRow;
      const rows = chunkDocument(full).map((c) => ({
        tender_id: full.tender_id,
        document_id: full.id,
        content: c.content,
        sumber: c.sumber,
        embedding: mockEmbedding(c.content),
      }));
      if (rows.length > 0) {
        const { error: chunkError } = await supabaseClient()
          .from("document_chunks")
          .insert(rows);
        if (chunkError) throw chunkError;
      }
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan dokumen" },
      { status: 500 }
    );
  }
}