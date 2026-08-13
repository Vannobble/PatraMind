import { notFound, redirect } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { EvaluationBoard } from "@/components/d6/evaluation-board";
import type { Evaluation, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function EvaluationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // env belum diatur
  }
  if (!userId) redirect("/login");
  const profile = await getProfile(userId);

  const [{ data: tender }, { data: docs }, { data: evals }] =
    await Promise.all([
      supabaseClient().from("tenders").select("*").eq("id", id).maybeSingle(),
      supabaseClient()
        .from("documents")
        .select("*")
        .eq("tender_id", id)
        .eq("jenis", "penawaran")
        .order("created_at"),
      supabaseClient()
        .from("evaluations")
        .select("*")
        .eq("tender_id", id)
        .order("vendor_name"),
    ]);

  if (!tender) notFound();
  const t = tender as Tender;

  const vendors = (docs ?? [])
    .map((d) => {
      const m = d.nama_file.match(/penawaran[_\-\s]*(.+)/i);
      const nama = m ? m[1].replace(/\.[a-z]+$/i, "").trim() : d.nama_file;
      return { nama };
    })
    .filter((v) => v.nama.length > 2);

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5">
        <h2 className="text-base font-bold text-slate-900">
          Evaluasi Penawaran — {t.nama_pekerjaan}
        </h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {vendors.length} vendor · pilih vendor untuk melihat evaluasi
          paralel dari 4 aspek
        </p>
      </div>
      <EvaluationBoard
        tenderId={id}
        vendors={vendors}
        initialEvals={(evals ?? []) as Evaluation[]}
        role={profile?.role ?? "panitia"}
      />
    </div>
  );
}
