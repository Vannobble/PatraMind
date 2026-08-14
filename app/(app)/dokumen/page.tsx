import { FileText } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Card } from "@/components/ui/card";
import { CreateDocumentDialog } from "@/components/dokumen/create-document-dialog";
import { DokumenTable } from "@/components/dokumen/dokumen-table";
import type { DocumentRow, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function DokumenPage() {
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const [{ data: docs }, { data: tenders }] = await Promise.all([
    supabaseClient()
      .from("documents")
      .select("id, tender_id, jenis, nama_file, konten_text, created_at")
      .order("created_at", { ascending: false }),
    supabaseClient()
      .from("tenders")
      .select("id, nama_pekerjaan, nomor_pr")
      .order("created_at", { ascending: false }),
  ]);

  const tList = (tenders ?? []) as Tender[];
  const tById = new Map(tList.map((t) => [t.id, t]));
  const rows = (docs ?? []) as DocumentRow[];

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-brand-950">
            Smart-Dokumen
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Arsip seluruh dokumen lintas tender — buka dokumen untuk membaca,
            mengedit, dan bertanya pada AI.
          </p>
        </div>
        {["panitia", "admin"].includes(profile?.role ?? "") && (
          <CreateDocumentDialog
            tenders={tList.map((t) => ({
              id: t.id,
              nama_pekerjaan: t.nama_pekerjaan,
            }))}
          />
        )}
      </div>

      <Card className="overflow-hidden">
        <DokumenTable
          rows={rows}
          tById={tById}
          canEdit={["panitia", "admin"].includes(profile?.role ?? "")}
        />
      </Card>
    </div>
  );
}