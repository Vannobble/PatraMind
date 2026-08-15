"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayCircle, Clock3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatRupiah } from "@/lib/utils";
import type { Tender } from "@/types";

export function MenungguPenilaian({
  tenders,
  offerNames,
  canStart,
}: {
  tenders: Tender[];
  offerNames: Record<string, string[]>;
  canStart: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (tenders.length === 0) return null;

  async function start(t: Tender, vendors: string[]) {
    setBusyId(t.id);
    setError(null);
    try {
      let firstId: string | null = null;
      for (const vendorName of vendors) {
        const res = await fetch("/api/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "create",
            tenderId: t.id,
            vendorName,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Gagal memulai evaluasi");
        if (!firstId) firstId = json.id;
      }
      if (!firstId) throw new Error("Tidak ada penawaran untuk dievaluasi");
      router.push(`/kolaborasi/${firstId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memulai evaluasi");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
          <Clock3 className="h-4 w-4" />
        </span>
        <h3 className="font-display text-sm font-bold text-brand-950">
          Menunggu Penilaian
        </h3>
        <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-600">
          {tenders.length} tender
        </span>
      </div>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {tenders.map((t) => {
          const vendors = offerNames[t.id] ?? [];
          return (
            <div
              key={t.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-900">
                  {t.nama_pekerjaan}
                </p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                  {t.nomor_pr || "-"} · {formatRupiah(t.nilai_kontrak ?? 0)}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500">
                  <FileText className="h-3 w-3" />
                  {vendors.length} penawaran siap dinilai
                </p>
              </div>
              {canStart && (
                <Button
                  size="sm"
                  onClick={() => start(t, vendors)}
                  disabled={busyId === t.id || vendors.length === 0}
                >
                  {busyId === t.id ? (
                    <Spinner className="h-4 w-4" />
                  ) : (
                    <PlayCircle className="h-4 w-4" />
                  )}
                  Mulai Evaluasi
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}