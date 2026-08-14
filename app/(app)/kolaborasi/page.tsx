import { Building2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Card } from "@/components/ui/card";
import { KolaborasiTable } from "@/components/kolaborasi/kolaborasi-table";
import type { Evaluation, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function KolaborasiPage() {
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const [{ data: evals }, { data: tenders }] = await Promise.all([
    supabaseClient()
      .from("evaluations")
      .select("*")
      .order("vendor_name", { ascending: true }),
    supabaseClient()
      .from("tenders")
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const tById = new Map((tenders ?? []).map((t) => [t.id, t as Tender]));
  const rows = ((evals ?? []) as Evaluation[])
    .sort((a, b) =>
      a.vendor_name.localeCompare(b.vendor_name) ||
      a.created_at?.localeCompare(b.created_at ?? "") ||
      0
    )
    .map((evalRow) => ({ eval: evalRow, tender: tById.get(evalRow.tender_id) }));

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold tracking-tight text-brand-950">
          Kolaborasi Penilaian Vendor
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pusat evaluasi lintas tim — setiap vendor dinilai bersama dari 4
          aspek, lalu dikonsolidasi menjadi konsensus akhir.
        </p>
      </div>

      <Card className="overflow-hidden">
        <KolaborasiTable rows={rows} tById={tById} />
      </Card>
    </div>
  );
}