"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TENDER_STATUS_LABELS } from "@/lib/constants";
import { formatTanggal, formatRupiah, cn } from "@/lib/utils";
import type { Tender, TenderStatus } from "@/types";

const STATUS_OPTIONS: { value: TenderStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "proses", label: "Proses" },
  { value: "evaluasi", label: "Evaluasi" },
  { value: "diterima", label: "Diterima" },
  { value: "ditolak", label: "Ditolak" },
];

export function PrebidTable({
  tenders,
  docCounts,
  evalCounts,
  canEdit,
}: {
  tenders: Tender[];
  docCounts: Record<string, number>;
  evalCounts: Record<string, number>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [changing, setChanging] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return tenders;
    return tenders.filter(
      (t) =>
        t.nama_pekerjaan.toLowerCase().includes(s) ||
        (t.nomor_pr || "").toLowerCase().includes(s) ||
        (t.klien || "").toLowerCase().includes(s) ||
        (t.pic || "").toLowerCase().includes(s) ||
        (TENDER_STATUS_LABELS[t.status]?.label ?? "").toLowerCase().includes(s)
    );
  }, [q, tenders]);

  async function changeStatus(t: Tender, status: TenderStatus) {
    setChanging(t.id);
    try {
      const res = await fetch(`/api/tenders/${t.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mengubah status");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status");
    } finally {
      setChanging(null);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari nama tender, No. PR, klien, PIC, status…"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          />
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
          {filtered.length} / {tenders.length} tender
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FolderKanban className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    {q ? "Tidak ada tender yang cocok" : "Belum ada tender"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {q
                      ? "Coba kata kunci lain."
                      : "Jalankan npm run seed atau buat tender baru."}
                  </p>
                </td>
              </tr>
            )}
            {filtered.map((t, i) => {
              const st =
                TENDER_STATUS_LABELS[t.status] ?? TENDER_STATUS_LABELS.draft;
              return (
                <tr
                  key={t.id}
                  className={cn(
                    "border-b border-slate-50 transition hover:bg-gold-100/30",
                    t.status === "draft" && "bg-red-50/30"
                  )}
                >
                  <td className="px-5 py-3.5 text-xs text-slate-400">
                    {i + 1}
                  </td>
                  <td className="px-3 py-3.5">
                    <Link
                      href={`/prebid/${t.id}`}
                      className="block max-w-[260px] text-xs font-bold text-brand-900 hover:text-brand-700 hover:underline"
                    >
                      {t.nama_pekerjaan}
                    </Link>
                    <span className="font-mono text-[10px] text-slate-400">
                      {t.nomor_pr || "-"}
                    </span>
                  </td>
                  <td className="max-w-[180px] truncate px-3 py-3.5 text-xs text-slate-600">
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
                    {canEdit ? (
                      <select
                        value={t.status}
                        disabled={changing === t.id}
                        onChange={(e) =>
                          changeStatus(t, e.target.value as TenderStatus)
                        }
                        className={cn(
                          "h-7 cursor-pointer rounded-lg border px-2 text-[11px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:opacity-60",
                          st.cls
                        )}
                      >
                        {STATUS_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge className={st.cls}>{st.label}</Badge>
                    )}
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
    </>
  );
}