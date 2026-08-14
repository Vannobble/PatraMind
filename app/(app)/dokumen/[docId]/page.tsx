import { notFound } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { DocumentWorkspace } from "@/components/dokumen/document-workspace";
import { aiMode } from "@/lib/ai";
import type { DocumentRow, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function DocWorkspacePage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;

  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const { data: doc } = await supabaseClient()
    .from("documents")
    .select("id, tender_id, jenis, nama_file, konten_text, created_at")
    .eq("id", docId)
    .maybeSingle();

  if (!doc) notFound();

  const d = doc as DocumentRow;
  const { data: tender } = await supabaseClient()
    .from("tenders")
    .select("id, nama_pekerjaan, nomor_pr")
    .eq("id", d.tender_id)
    .maybeSingle();

  const tenderInfo = (tender as Pick<
    Tender,
    "id" | "nama_pekerjaan" | "nomor_pr"
  > | null) ?? {
    id: d.tender_id,
    nama_pekerjaan: "Tender telah dihapus",
    nomor_pr: "-",
  };

  return (
    <DocumentWorkspace
      doc={d}
      tender={tenderInfo}
      role={profile?.role ?? "panitia"}
      aiMode={aiMode()}
    />
  );
}