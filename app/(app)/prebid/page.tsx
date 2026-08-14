import Link from "next/link";
import { FolderKanban, Search } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreateTenderDialog } from "@/components/dashboard/create-tender-dialog";
import { TENDER_STATUS_LABELS } from "@/lib/constants";
import { formatTanggal, formatRupiah, cn } from "@/lib/utils";
import type { Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function PreBidPage() {
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const [{ data: tData }, { data: docs }, { data: evals }] = await Promise.all([
    supabaseClient()
      .from("tenders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseClient().from("documents").select("tender_id"),
    supabaseClient().from("evaluations").select("tender_id, status"),
  ]);

  const tenders = (tData ?? []) as Tender[];
  const docCounts: Record<string, number> = {};
  for (const d of docs ?? []) {
    docCounts[d.tender_id] = (docCounts[d.tender_id] ?? 0) + 1;
  }
  const evalCounts: Record<string, number> = {};
  for (const e of evals ?? []) {
    evalCounts[e.tender_id] = (evalCounts[e.tender_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-brand-950">
            Daftar PreBid Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola project pengadaan, pantau status, dan buka workspace tender.
          </p>
        </div>
        {["panitia", "admin"].includes(profile?.role ?? "") && (
          <CreateTenderDialog />
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Cari tender, klien, PIC…"
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            />
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
            {tenders.length} tender
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">No</th>
                <th className="px-3 py-3">Nama Proyek/Tender</th>
                <th className="px-3 py-3">Klien</th>
                <th className="px-3 py-3">Nilai Kontrak</th>
                <th className="px-3 py-3">Deadline</th>
                <th className="px-3 py-3">PIC</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Dok</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {tenders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FolderKanban className="h-6 w-6" />
                    </span>
                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      Belum ada tender
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Jalankan <b>npm run seed</b> atau buat tender baru.
                    </p>
                  </td>
                </tr>
              )}
              {tenders.map((t, i) => {
                const st =
                  TENDER_STATUS_LABELS[t.status] ?? TENDER_STATUS_LABELS.draft;
                return (
                  <tr
                    key={t.id}
                    className={cn(
                      "border-b border-slate-50 transition hover:bg-gold-100/30",
                      t.status === "draft" && "bg-red-50/40"
                    )}
                  >
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/prebid/${t.id}`}
                        className="block max-w-[280px] text-xs font-bold text-brand-900 hover:text-brand-700 hover:underline"
                      >
                        {t.nama_pekerjaan}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">
                        {t.nomor_pr || "-"}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-3.5 text-xs text-slate-600">
                      {t.klien || "-"}
                    </td>
                    <td className="px-3 py-3.5 text-xs font-semibold text-slate-700">
                      {formatRupiah(t.nilai_kontrak ?? 0)}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-600">
                      {formatTanggal(t.deadline ?? undefined)}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-600">
                      {t.pic || "-"}
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge className={st.cls}>{st.label}</Badge>
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {docCounts[t.id] ?? 0}
                      <span className="ml-1 text-[10px] text-slate-400">
                        / {evalCounts[t.id] ?? 0} ev
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/prebid/${t.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-brand-800 transition hover:border-gold-400 hover:bg-gold-100/40"
                      >
                        Buka →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}