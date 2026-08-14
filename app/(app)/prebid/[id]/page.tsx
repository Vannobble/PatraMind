import { notFound } from "next/navigation";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { TenderDetailTabs } from "@/components/prebid/tender-detail-tabs";
import { Badge } from "@/components/ui/badge";
import { TENDER_STATUS_LABELS } from "@/lib/constants";
import { formatRupiah, formatTanggal } from "@/lib/utils";
import type { BeritaAcara, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const [{ data: tender }, { data: docs }, { data: bas }] = await Promise.all([
    supabaseClient().from("tenders").select("*").eq("id", id).maybeSingle(),
    supabaseClient()
      .from("documents")
      .select("*")
      .eq("tender_id", id)
      .order("created_at"),
    supabaseClient()
      .from("berita_acara")
      .select("*")
      .eq("tender_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!tender) notFound();
  const t = tender as Tender;
  const st = TENDER_STATUS_LABELS[t.status] ?? TENDER_STATUS_LABELS.draft;

  const rks =
    (docs ?? []).find((d) => d.jenis === "rks_tor") ??
    (docs ?? []).find((d) => d.jenis === "lainnya") ??
    null;

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-lg font-bold text-brand-950">
                {t.nama_pekerjaan}
              </h2>
              <Badge className={st.cls}>{st.label}</Badge>
            </div>
            <p className="mt-1 font-mono text-[11px] text-brand-700">
              {t.nomor_pr || "No. PR -"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Klien
              </p>
              <p className="mt-0.5 max-w-[180px] truncate text-slate-700">
                {t.klien || "-"}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Nilai Kontrak
              </p>
              <p className="mt-0.5 font-semibold text-slate-700">
                {formatRupiah(t.nilai_kontrak ?? 0)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Deadline
              </p>
              <p className="mt-0.5 text-slate-700">
                {formatTanggal(t.deadline ?? undefined)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                PIC
              </p>
              <p className="mt-0.5 text-slate-700">{t.pic || "-"}</p>
            </div>
          </div>
        </div>
      </div>

      <TenderDetailTabs
        tenderId={id}
        rksFileName={rks?.nama_file ?? "RKS/TOR"}
        initialBa={(bas?.[0] as BeritaAcara | undefined) ?? null}
      />
    </div>
  );
}