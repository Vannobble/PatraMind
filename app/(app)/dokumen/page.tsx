import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreateDocumentDialog } from "@/components/dokumen/create-document-dialog";
import { formatTanggal } from "@/lib/utils";
import type { DocumentRow, Tender } from "@/types";

export const dynamic = "force-dynamic";

const JENIS_BADGE: Record<string, string> = {
  rks_tor: "bg-brand-50 text-brand-700 border-brand-200",
  penawaran: "bg-sky-50 text-sky-700 border-sky-200",
  lainnya: "bg-slate-100 text-slate-600 border-slate-200",
};
const JENIS_LABEL: Record<string, string> = {
  rks_tor: "RKS/TOR",
  penawaran: "Penawaran",
  lainnya: "Lainnya",
};

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
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Cari nama dokumen, tender, No. PR…"
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            />
          </div>
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
            {rows.length} dokumen
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-5 py-3">No</th>
                <th className="px-3 py-3">Nama Dokumen</th>
                <th className="px-3 py-3">Kategori</th>
                <th className="px-3 py-3">Nomor Dokumen</th>
                <th className="px-3 py-3">Lokasi Simpan</th>
                <th className="px-3 py-3">Ditambahkan</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                      <FileText className="h-6 w-6" />
                    </span>
                    <p className="mt-3 text-xs font-semibold text-slate-600">
                      Belum ada dokumen
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Jalankan <b>npm run seed</b> atau tambahkan dokumen baru.
                    </p>
                  </td>
                </tr>
              )}
              {rows.map((d, i) => {
                const t = tById.get(d.tender_id);
                return (
                  <tr
                    key={d.id}
                    className="border-b border-slate-50 transition hover:bg-gold-100/30"
                  >
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {i + 1}
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/dokumen/${d.id}`}
                        className="flex items-center gap-2 text-xs font-bold text-brand-900 hover:text-brand-700 hover:underline"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                          <FileText className="h-3.5 w-3.5" />
                        </span>
                        {d.nama_file}
                      </Link>
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge className={JENIS_BADGE[d.jenis] ?? JENIS_BADGE.lainnya}>
                        {JENIS_LABEL[d.jenis] ?? "Lainnya"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5 font-mono text-[11px] text-slate-500">
                      {t?.nomor_pr || "-"}
                    </td>
                    <td className="max-w-[220px] truncate px-3 py-3.5 text-xs text-slate-600">
                      {t?.nama_pekerjaan ?? "-"}
                    </td>
                    <td className="px-3 py-3.5 text-xs text-slate-500">
                      {formatTanggal(d.created_at)}
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/dokumen/${d.id}`}
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