"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ASPECT_ORDER, ASPECT_META, ASPECT_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AspectInput, Evaluation, Tender } from "@/types";

export function KolaborasiTable({
  rows,
  tById,
}: {
  rows: {
    eval: Evaluation;
    tender: Tender | undefined;
  }[];
  tById: Map<string, Tender>;
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(({ eval: e, tender }) =>
      e.vendor_name.toLowerCase().includes(s) ||
      (tender?.nama_pekerjaan ?? "").toLowerCase().includes(s) ||
      (tender?.nomor_pr ?? "").toLowerCase().includes(s) ||
      (e.status === "final" ? "final" : "draft").includes(s)
    );
  }, [q, rows]);

  const grouped = useMemo(() => {
    const out: { vendor: string; items: typeof filtered }[] = [];
    for (const r of filtered) {
      const last = out[out.length - 1];
      if (last && last.vendor === r.eval.vendor_name) last.items.push(r);
      else out.push({ vendor: r.eval.vendor_name, items: [r] });
    }
    return out;
  }, [filtered]);

  let counter = 0;

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari vendor, tender, No. PR, status…"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          />
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
          {grouped.length} vendor · {filtered.length} penilaian
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <th className="px-5 py-3">No</th>
              <th className="px-3 py-3">Vendor</th>
              <th className="px-3 py-3">Lokasi Simpan (Tender)</th>
              <th className="px-3 py-3">Penilaian Tim</th>
              <th className="px-3 py-3">Konsensus</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3" />
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <Building2 className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    {q
                      ? "Tidak ada penilaian yang cocok"
                      : "Belum ada penilaian vendor"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {q
                      ? "Coba kata kunci lain."
                      : "Mulai evaluasi dari halaman penilaian vendor."}
                  </p>
                </td>
              </tr>
            )}
            {grouped.map((g) =>
              g.items.map(({ eval: e, tender }) => {
                counter++;
                return (
                  <tr
                    key={e.id}
                    className="border-b border-slate-50 transition hover:bg-gold-100/30"
                  >
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {counter}
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="flex items-center gap-2 text-xs font-bold text-brand-900">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        {g.vendor}
                      </p>
                    </td>
                    <td className="max-w-[220px] px-3 py-3.5">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {tender?.nama_pekerjaan ?? "Tender telah dihapus"}
                      </p>
                      <span className="font-mono text-[10px] text-slate-400">
                        {tender?.nomor_pr || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex flex-wrap items-center gap-1">
                        {ASPECT_ORDER.map((aspect) => {
                          const input = (
                            e as unknown as Record<string, AspectInput | null>
                          )[`${aspect}_input`];
                          const st =
                            ASPECT_STATUS_LABELS[input?.status ?? "belum_dinilai"];
                          return (
                            <Badge
                              key={aspect}
                              title={`${ASPECT_META[aspect].label}: ${st.label}`}
                              className={cn("text-[9px] px-1.5", st.cls)}
                            >
                              {ASPECT_META[aspect].label}: {st.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </td>
                    <td className="max-w-[200px] px-3 py-3.5">
                      {e.consensus_result?.rekomendasi ? (
                        <p className="truncate text-[11px] font-semibold text-slate-700">
                          {e.consensus_result.rekomendasi}
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge
                        className={
                          e.status === "final"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }
                      >
                        {e.status === "final" ? "Final" : "Draft"}
                      </Badge>
                    </td>
                    <td className="px-3 py-3.5">
                      <Link
                        href={`/kolaborasi/${e.id}`}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-brand-800 transition hover:border-gold-400 hover:bg-gold-100/40"
                      >
                        Buka →
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}