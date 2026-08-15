"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatTanggal } from "@/lib/utils";
import type { DocumentRow, Tender } from "@/types";

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

export function DokumenTable({
  rows,
  tById,
  canEdit,
}: {
  rows: DocumentRow[];
  tById: Map<string, { nama_pekerjaan: string; nomor_pr: string }>;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((d) => {
      const t = tById.get(d.tender_id);
      return (
        d.nama_file.toLowerCase().includes(s) ||
        (t?.nama_pekerjaan ?? "").toLowerCase().includes(s) ||
        (t?.nomor_pr ?? "").toLowerCase().includes(s) ||
        (JENIS_LABEL[d.jenis] ?? "").toLowerCase().includes(s)
      );
    });
  }, [q, rows, tById]);

  const allShown = filtered.length > 0 && sel.size === filtered.length;
  const allShownSome =
    filtered.some((d) => sel.has(d.id)) && sel.size < filtered.length;

  function toggleAll() {
    setSel((prev) => {
      const next = new Set(prev);
      if (allShown) {
        filtered.forEach((d) => next.delete(d.id));
      } else {
        filtered.forEach((d) => next.add(d.id));
      }
      return next;
    });
  }

  function toggleOne(id: string) {
    setSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function hapus() {
    if (sel.size === 0) return;
    const ok = confirm(
      `Hapus ${sel.size} dokumen terpilih? Tindakan ini tidak bisa dibatalkan.`
    );
    if (!ok) return;
    setBusy(true);
    try {
      for (const id of sel) {
        const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal menghapus");
      }
      setSel(new Set());
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus dokumen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama dokumen, tender, No. PR, kategori…"
              className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            />
          </div>
          {canEdit && (
            <Button
              variant="outline"
              className="h-9 border-red-200 text-red-700 hover:bg-red-50"
              onClick={hapus}
              disabled={sel.size === 0 || busy}
            >
              {busy ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Hapus {sel.size > 0 ? `(${sel.size})` : ""}
            </Button>
          )}
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
          {filtered.length} / {rows.length} dokumen
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {canEdit && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allShown}
                    ref={(el) => {
                      if (el) el.indeterminate = allShownSome;
                    }}
                    onChange={toggleAll}
                    className="h-3.5 w-3.5 accent-brand-700"
                  />
                </th>
              )}
              <th className="px-3 py-3">No</th>
              <th className="px-3 py-3">Nama Dokumen</th>
              <th className="px-3 py-3">Kategori</th>
              <th className="px-3 py-3">Nomor Dokumen</th>
              <th className="px-3 py-3">Lokasi Simpan</th>
              <th className="px-3 py-3">Ditambahkan</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={canEdit ? 7 : 6} className="px-5 py-12 text-center">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                    <FileText className="h-6 w-6" />
                  </span>
                  <p className="mt-3 text-xs font-semibold text-slate-600">
                    {q ? "Tidak ada dokumen yang cocok" : "Belum ada dokumen"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {q
                      ? "Coba kata kunci lain."
                      : "Jalankan npm run seed atau tambahkan dokumen baru."}
                  </p>
                </td>
              </tr>
            )}
            {filtered.map((d, i) => {
              const t = tById.get(d.tender_id);
              return (
                <tr
                  key={d.id}
                  onClick={() => router.push(`/dokumen/${d.id}`)}
                  className={cnRow(sel.has(d.id))}
                >
                  {canEdit && (
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={sel.has(d.id)}
                        onClick={(e) => e.stopPropagation()}
                        onChange={() => toggleOne(d.id)}
                        className="h-3.5 w-3.5 accent-brand-700"
                      />
                    </td>
                  )}
                  <td className="px-3 py-3.5 text-xs text-slate-400">
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function cnRow(selected: boolean): string {
  return selected
    ? "cursor-pointer border-b border-brand-100 bg-brand-50/50"
    : "cursor-pointer border-b border-slate-50 transition hover:bg-gold-100/30";
}