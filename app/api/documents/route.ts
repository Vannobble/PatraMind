import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { chunkDocument, mockEmbedding } from "@/lib/ai/rag";
import type { DocJenis, DocumentRow } from "@/types";

export async function GET(request: Request) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const url = new URL(request.url);
    const tenderId = String(url.searchParams.get("tenderId") ?? "");
    const jenis = String(url.searchParams.get("jenis") ?? "");

    if (!tenderId) {
      return NextResponse.json({ error: "Parameter tenderId wajib diisi" }, { status: 400 });
    }

    let query = supabaseClient()
      .from("documents")
      .select("id, tender_id, jenis, nama_file, konten_text, created_at")
      .eq("tender_id", tenderId)
      .order("created_at", { ascending: false });
    if (jenis) {
      query = query.eq("jenis", jenis);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ docs: data as DocumentRow[] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengambil dokumen" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (!["panitia", "admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Khusus Panitia/Admin" }, { status: 403 });
    }

    const body = await request.json();
    const tenderId = String(body.tenderId ?? "");
    const nama_file = String(body.nama_file ?? "").trim();
    const jenis = String(body.jenis ?? "lainnya") as DocJenis;
    const konten_text = String(body.konten_text ?? "").trim();

    if (!tenderId || !nama_file || !konten_text) {
      return NextResponse.json(
        { error: "Nama file, tender, dan isi dokumen wajib diisi" },
        { status: 400 }
      );
    }

    const { data: doc, error } = await supabaseClient()
      .from("documents")
      .insert({ tender_id: tenderId, jenis, nama_file, konten_text })
      .select("*")
      .single();
    if (error) throw error;

    const full = doc as DocumentRow;
    const chunks = chunkDocument(full);
    const rows = chunks.map((c) => ({
      tender_id: tenderId,
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

    return NextResponse.json({ id: full.id, chunks: rows.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal membuat dokumen" },
      { status: 500 }
    );
  }
}