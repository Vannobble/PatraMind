import type {
  Aspect,
  AspectInput,
  AspectStatus,
  BaJson,
  ConsensusJson,
  QnaNote,
  Tender,
} from "@/types";
import { chatCompletion } from "./openai";
import {
  mockChatAnswer,
  mockConsensus,
  mockEvaluateAspect,
  mockGenerateBa,
} from "./mock";
import { retrieveChunks } from "./rag";

export function aiMode(): "openai" | "local" {
  return process.env.OPENAI_API_KEY ? "openai" : "local";
}

/* ================= D5 — Generate Berita Acara ================= */

const BA_SYSTEM_PROMPT = `Kamu adalah asisten AI yang membantu Panitia Pengadaan menyusun Berita Acara Pemberian Penjelasan (Aanwijzing) sesuai prosedur pengadaan barang perusahaan.

Berdasarkan:
1. Ringkasan RKS/TOR berikut: {rks_content}
2. Catatan sesi pemberian penjelasan (tanya-jawab) berikut: {qna_notes}

Susun draft Berita Acara Pemberian Penjelasan dengan struktur:
1. Kop dokumen (Nomor BA, Nama Pekerjaan, Tanggal, Tempat)
2. Ringkasan pelaksanaan (waktu, peserta yang hadir jika disebutkan)
3. Poin-poin penjelasan utama (ringkas dari RKS/TOR)
4. Daftar tanya-jawab (format tabel: No, Pertanyaan, Jawaban)
5. Perubahan/penambahan/klarifikasi dokumen (jika ada disebutkan dalam catatan)
6. Kesimpulan dan penutup

Gunakan bahasa formal Indonesia sesuai gaya dokumen resmi perusahaan. Jangan menambahkan informasi yang tidak ada dalam input.
Output dalam format JSON dengan struktur:
{ "nomor_ba": ..., "ringkasan_pelaksanaan": ..., "poin_penjelasan": [...], "tanya_jawab": [{"no":1,"pertanyaan":..., "jawaban":...}], "perubahan": [...], "kesimpulan": ... }`;

export async function generateBa(params: {
  tender: Tender;
  rksContent: string;
  qnaNotes: QnaNote[];
}): Promise<BaJson> {
  if (aiMode() === "local") {
    return mockGenerateBa(params);
  }

  const system = BA_SYSTEM_PROMPT.replace(
    "{rks_content}",
    params.rksContent.slice(0, 12000)
  ).replace(
    "{qna_notes}",
    params.qnaNotes
      .map((n) => `Q${n.no}: ${n.pertanyaan}\nA${n.no}: ${n.jawaban}`)
      .join("\n") || "(tidak ada catatan)"
  );

  const raw = await chatCompletion({
    system,
    user: `Nama pekerjaan: ${params.tender.nama_pekerjaan}\nNomor PR: ${params.tender.nomor_pr}\nTanggal pelaksanaan: ${new Date().toLocaleDateString("id-ID")}\n\nSusun berita acara sesuai instruksi.`,
    json: true,
    temperature: 0.3,
  });

  const parsed = safeJson<Partial<BaJson>>(raw);
  const tanya_jawab = Array.isArray(parsed.tanya_jawab)
    ? (parsed.tanya_jawab as QnaNote[])
    : [];
  return {
    nomor_ba: parsed.nomor_ba ?? "",
    ringkasan_pelaksanaan: parsed.ringkasan_pelaksanaan ?? "",
    poin_penjelasan: Array.isArray(parsed.poin_penjelasan)
      ? (parsed.poin_penjelasan as string[])
      : [],
    tanya_jawab: tanya_jawab.map((t, i) => ({ ...t, no: i + 1 })),
    perubahan: Array.isArray(parsed.perubahan)
      ? (parsed.perubahan as string[])
      : [],
    kesimpulan: parsed.kesimpulan ?? "",
  };
}

/* ================= D6 — Evaluasi per aspek ================= */

const ASPECT_SYSTEM = `Kamu adalah asisten evaluasi {aspect_label} pengadaan barang. Berdasarkan spesifikasi RKS/TOR berikut: {rks_spec}
dan dokumen penawaran vendor berikut: {vendor_offer}
Berikan analisis singkat (maks 150 kata) meliputi: kesesuaian spesifikasi, potensi risiko/gap, dan rekomendasi awal (Layak/Tidak Layak/Perlu Klarifikasi).`;

export async function evaluateAspect(params: {
  aspect: Aspect;
  vendorName: string;
  rksSpec: string;
  vendorOffer: string;
}): Promise<{ analysis: string; rekomendasi: string; status: AspectStatus }> {
  if (aiMode() === "local") {
    return mockEvaluateAspect(params);
  }

  const labels: Record<Aspect, string> = {
    teknis: "teknis",
    legal: "legal/administrasi",
    harga: "harga",
    k3: "K3/lingkungan/SLA",
  };
  const system = ASPECT_SYSTEM.replace(
    "{aspect_label}",
    labels[params.aspect]
  )
    .replace("{rks_spec}", params.rksSpec.slice(0, 8000))
    .replace("{vendor_offer}", params.vendorOffer.slice(0, 8000));

  const analysis = await chatCompletion({
    system,
    user: `Vendor: ${params.vendorName}`,
    temperature: 0.3,
  });

  const lower = analysis.toLowerCase();
  const status: AspectStatus = lower.includes("tidak layak")
    ? "belum_dinilai"
    : lower.includes("klarifikasi")
      ? "perlu_klarifikasi"
      : "dinilai";
  const rekomendasi = status === "dinilai" ? "Layak" : status === "perlu_klarifikasi" ? "Perlu Klarifikasi" : "Tidak Layak";

  return { analysis, rekomendasi, status };
}

/* ================= D6 — Consensus ================= */

const CONSENSUS_SYSTEM = `Berikut adalah hasil evaluasi dari 4 aspek untuk penawaran vendor {vendor_name}:
- Teknis: {teknis_input}
- Legal: {legal_input}
- Harga: {harga_input}
- K3/SLA: {k3_input}
Susun ringkasan konsensus yang mencakup: kesimpulan keseluruhan, poin yang perlu diperhatikan, dan rekomendasi akhir (Layak Dilanjutkan/Tidak Layak/Perlu Klarifikasi Tambahan).
Output dalam format JSON: { "kesimpulan": ..., "poin_perhatian": [...], "rekomendasi": ... }`;

export async function generateConsensus(params: {
  vendorName: string;
  inputs: Record<Aspect, AspectInput | null>;
}): Promise<ConsensusJson> {
  if (aiMode() === "local") {
    return mockConsensus({
      vendorName: params.vendorName,
      teknis: params.inputs.teknis,
      legal: params.inputs.legal,
      harga: params.inputs.harga,
      k3: params.inputs.k3,
    });
  }

  const fmt = (a: AspectInput | null) =>
    a
      ? `Status: ${a.status} | Analisis: ${a.analysis.slice(0, 2000)} | Catatan: ${a.catatan}`
      : "(belum ada input)";

  const system = CONSENSUS_SYSTEM.replace("{vendor_name}", params.vendorName)
    .replace("{teknis_input}", fmt(params.inputs.teknis))
    .replace("{legal_input}", fmt(params.inputs.legal))
    .replace("{harga_input}", fmt(params.inputs.harga))
    .replace("{k3_input}", fmt(params.inputs.k3));

  const raw = await chatCompletion({ system, user: "Susun konsensus.", json: true, temperature: 0.3 });
  const parsed = safeJson<Partial<ConsensusJson>>(raw);
  return {
    kesimpulan: parsed.kesimpulan ?? "",
    poin_perhatian: Array.isArray(parsed.poin_perhatian)
      ? (parsed.poin_perhatian as string[])
      : [],
    rekomendasi: parsed.rekomendasi ?? "",
  };
}

/* ================= D8 — Chat RAG ================= */

const CHAT_SYSTEM = `Kamu adalah asisten AI yang membantu pengguna memahami dokumen-dokumen proyek pengadaan ini.
Gunakan HANYA informasi dari konteks berikut untuk menjawab. Jika informasi tidak ada dalam konteks, katakan tidak tahu — jangan mengarang.

Konteks relevan:
{retrieved_chunks}

Pertanyaan pengguna: {user_question}`;

export async function chatAnswer(params: {
  tenderId: string;
  question: string;
  documentId?: string;
}): Promise<{ answer: string; sources: string[] }> {
  const chunks = await retrieveChunks(
    params.tenderId,
    params.question,
    4,
    params.documentId
  );

  if (aiMode() === "local") {
    return mockChatAnswer({ question: params.question, chunks });
  }

  if (chunks.length === 0) {
    return {
      answer:
        "Maaf, saya tidak menemukan informasi yang relevan pada dokumen project ini. Coba pertanyaan lain seputar RKS/TOR, penawaran vendor, atau jadwal pengadaan.",
      sources: [],
    };
  }

  const context = chunks
    .map((c, i) => `[Sumber ${i + 1}: ${c.sumber}]\n${c.content.slice(0, 1500)}`)
    .join("\n\n");

  const system = CHAT_SYSTEM.replace("{retrieved_chunks}", context).replace(
    "{user_question}",
    params.question
  );

  const answer = await chatCompletion({
    system,
    user: params.question,
    temperature: 0.2,
  });

  return { answer, sources: chunks.map((c) => c.sumber) };
}

/* ================= util ================= */

function safeJson<T>(raw: string): T {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/```\s*$/, "");
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error("AI mengembalikan output yang tidak valid");
  }
}
