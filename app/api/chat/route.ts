import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import { chatAnswer, documentEdit } from "@/lib/ai";

export const maxDuration = 60;

const EDIT_PATTERN =
  /^(?:tolong|mohon|bisa|dapat|boleh)?\s*(?:ubah|edit|ganti(?:kan)?|tambahkan?|sisipkan|hapus|buang|hilangkan|perbaiki|rapikan|revisi|perjelas|perpendek|ringkas(?:\s|$)|tulis\s*ulang)/i;
const EDIT_MID =
  /(?:di|pada)\s+dokumen[^.!?]{0,80}(?:ubah|edit|ganti|tambahkan?|hapus|perbaiki|revisi)/i;

function isEditCommand(text: string): boolean {
  return EDIT_PATTERN.test(text) || EDIT_MID.test(text);
}

export async function POST(request: Request) {
  try {
    const { user } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }

    const body = await request.json();
    const tenderId = String(body.tenderId ?? "");
    const documentId = String(body.documentId ?? "");
    const question = String(body.question ?? "").trim();

    if (!tenderId || !question) {
      return NextResponse.json({ error: "Pertanyaan tidak boleh kosong" }, { status: 400 });
    }

    // Perintah edit dokumen: hanya berlaku di workspace dokumen (documentId ada)
    if (isEditCommand(question)) {
      if (!documentId) {
        const hint =
          "Saya bisa mengedit isi dokumen langsung. Buka salah satu dokumen di Smart-Dokumen, lalu perintahkan di panel chat ini — misalnya: \"ganti 'X' dengan 'Y'\", \"tambahkan klausa tentang K3\", \"hapus bagian yang menyebut Z\", atau \"perbaiki ejaan\".";
        await supabaseClient().from("chat_history").insert({
          tender_id: tenderId,
          document_id: null,
          user_id: user.id,
          question,
          answer: hint,
          sources: [],
        });
        return NextResponse.json({ answer: hint, sources: [] });
      }

      const { data: doc } = await supabaseClient()
        .from("documents")
        .select("nama_file, konten_text")
        .eq("id", documentId)
        .maybeSingle();
      if (!doc) {
        return NextResponse.json(
          { error: "Dokumen tidak ditemukan" },
          { status: 404 }
        );
      }

      const proposal = await documentEdit({
        documentTitle: doc.nama_file,
        currentContent: String(doc.konten_text ?? ""),
        instruction: question,
      });

      await supabaseClient().from("chat_history").insert({
        tender_id: tenderId,
        document_id: documentId,
        user_id: user.id,
        question,
        answer: proposal.ringkasan,
        sources: [],
      });

      return NextResponse.json({
        answer: proposal.ringkasan,
        sources: [],
        editProposal: proposal,
      });
    }

    const { answer, sources } = await chatAnswer({ tenderId, question, documentId: documentId || undefined });

    // simpan riwayat (best effort)
    await supabaseClient().from("chat_history").insert({
      tender_id: tenderId,
      document_id: documentId || null,
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