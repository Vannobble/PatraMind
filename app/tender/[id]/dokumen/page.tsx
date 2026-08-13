import { notFound, redirect } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { DocExplorer } from "@/components/workspace/doc-explorer";
import type { DocumentRow, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function DokumenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/login");
  } catch {
    redirect("/login");
  }

  const [{ data: tender }, { data: docs }] = await Promise.all([
    supabaseClient().from("tenders").select("*").eq("id", id).maybeSingle(),
    supabaseClient()
      .from("documents")
      .select("*")
      .eq("tender_id", id)
      .order("created_at"),
  ]);

  if (!tender) notFound();
  const t = tender as Tender;

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">
          Dokumen Project — {t.nama_pekerjaan}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          RKS/TOR, penawaran vendor, dan dokumen pendukung — sumber konteks
          untuk Asisten AI (D8)
        </p>
      </div>
      <DocExplorer docs={(docs ?? []) as DocumentRow[]} />
    </div>
  );
}
