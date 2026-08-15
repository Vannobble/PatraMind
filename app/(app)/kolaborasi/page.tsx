import { Building2 } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Card } from "@/components/ui/card";
import { KolaborasiTable } from "@/components/kolaborasi/kolaborasi-table";
import { MenungguPenilaian } from "@/components/kolaborasi/menunggu-penilaian";
import type { Evaluation, Tender } from "@/types";

export const dynamic = "force-dynamic";

function vendorName(namaFile: string): string {
  const m = namaFile.match(/penawaran[_\-\s]*(.+)/i);
  const nama = m ? m[1].replace(/\.[a-z]+$/i, "").trim() : namaFile;
  return nama.length > 2 ? nama : "";
}

export default async function KolaborasiPage() {
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const [{ data: evals }, { data: tenders }, { data: offers }] =
    await Promise.all([
      supabaseClient()
        .from("evaluations")
        .select("*")
        .order("vendor_name", { ascending: true }),
      supabaseClient()
        .from("tenders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseClient()
        .from("documents")
        .select("tender_id, nama_file")
        .eq("jenis", "penawaran"),
    ]);

  const tById = new Map((tenders ?? []).map((t) => [t.id, t as Tender]));
  const rows = ((evals ?? []) as Evaluation[])
    .sort(
      (a, b) =>
        a.vendor_name.localeCompare(b.vendor_name) ||
        a.created_at?.localeCompare(b.created_at ?? "") ||
        0
    )
    .map((evalRow) => ({ eval: evalRow, tender: tById.get(evalRow.tender_id) }));

  // Tender berstatus evaluasi yang belum punya satupun evaluasi
  const evalTenderIds = new Set(
    ((evals ?? []) as Evaluation[]).map((e) => e.tender_id)
  );
  const waiting = (tenders ?? [])
    .filter((t) => t.status === "evaluasi" && !evalTenderIds.has(t.id))
    .map((t) => t as Tender);

  const offerNames: Record<string, string[]> = {};
  for (const o of offers ?? []) {
    const nama = vendorName(String(o.nama_file ?? ""));
    if (!nama) continue;
    (offerNames[o.tender_id] ??= []).push(nama);
  }

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

      <MenungguPenilaian
        tenders={waiting}
        offerNames={offerNames}
        canStart={["panitia", "admin"].includes(profile?.role ?? "")}
      />

      <Card className="overflow-hidden">
        <KolaborasiTable rows={rows} tById={tById} />
      </Card>
    </div>
  );
}