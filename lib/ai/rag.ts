import type { DocChunk, DocJenis, DocumentRow } from "@/types";
import { supabaseClient } from "@/lib/supabase/admin";
import { createEmbedding } from "./openai";
import { keywordRetrieve } from "./mock";

/* ---------------- Chunking dokumen ---------------- */

export function sumberForDoc(doc: {
  nama_file: string;
  jenis: DocJenis;
}): string {
  const nama = doc.nama_file.toLowerCase();
  if (doc.jenis === "penawaran") {
    const m = doc.nama_file.match(/penawaran[_\-\s]*(.+)/i);
    const vendor = m ? m[1].replace(/\.[a-z]+$/i, "").trim() : doc.nama_file;
    return `Penawaran ${vendor}`;
  }
  if (doc.jenis === "rks_tor") return "RKS/TOR";
  return doc.nama_file;
}

export function chunkDocument(
  doc: DocumentRow,
  targetLen = 350
): { content: string; sumber: string }[] {
  const base = sumberForDoc(doc);
  const lines = doc.konten_text.split("\n").map((l) => l.trim());
  const sections: { title: string; text: string }[] = [];
  let current: { title: string; text: string } | null = null;

  for (const line of lines) {
    if (!line) continue;
    const m = line.match(/^(\d+(?:\.\d+)*)[\.\)]?\s+[A-Z].*/);
    const isHeading = m || /^[A-Z0-9 \-\/\.]{3,60}$/.test(line);
    if (isHeading) {
      if (current) sections.push(current);
      current = { title: line.slice(0, 80), text: "" };
    } else if (current) {
      current.text += line + " ";
    } else {
      if (!current) current = { title: base, text: "" };
      current.text += line + " ";
    }
  }
  if (current) sections.push(current);

  const out: { content: string; sumber: string }[] = [];
  for (const s of sections) {
    const sumber = `${base} — Bagian ${s.title}`;
    const words = s.text.split(" ");
    for (let i = 0; i < words.length; i += targetLen) {
      const piece = words.slice(i, i + targetLen).join(" ");
      if (piece.trim().length > 30) out.push({ content: piece.trim(), sumber });
    }
  }
  return out;
}

/* ---------------- Retrieval ---------------- */

export async function fetchChunks(
  tenderId: string,
  documentId?: string
): Promise<DocChunk[]> {
  let query = supabaseClient()
    .from("document_chunks")
    .select("id, tender_id, content, sumber")
    .limit(400);
  if (documentId) {
    query = query.eq("document_id", documentId);
  } else {
    query = query.eq("tender_id", tenderId);
  }
  const { data, error } = await query;
  if (error) throw new Error(`Gagal memuat chunks: ${error.message}`);
  return (data ?? []) as DocChunk[];
}

export async function retrieveChunks(
  tenderId: string,
  question: string,
  limit = 3,
  documentId?: string
): Promise<DocChunk[]> {
  const chunks = await fetchChunks(tenderId, documentId);

  if (!process.env.OPENAI_API_KEY || documentId) {
    return keywordRetrieve(chunks, question, limit);
  }

  try {
    const embedding = await createEmbedding(question);
    const { data, error } = await supabaseClient().rpc("match_documents", {
      query_embedding: embedding,
      match_count: limit,
      p_tender_id: tenderId,
    });
    if (error) throw error;
    const hits = (data ?? []) as DocChunk[];
    if (hits.length > 0) return hits;
  } catch {
    // fallback keyword bila pgvector tidak tersedia
  }
  return keywordRetrieve(chunks, question, limit);
}

export function mockEmbedding(text: string, dim = 1536): number[] {
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }
  const vec: number[] = [];
  let state = seed;
  let norm = 0;
  for (let i = 0; i < dim; i++) {
    state = (state * 1103515245 + 12345) >>> 0;
    const v = ((state % 2000) / 1000 - 1) * 0.01;
    vec.push(v);
    norm += v * v;
  }
  const len = Math.sqrt(norm) || 1;
  return vec.map((v) => v / len);
}
