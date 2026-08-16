"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, ListChecks } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ASPECT_CONFIG } from "@/lib/constants";
import type { Aspect, DocumentRow } from "@/types";

export function AspectSidePanel({
  tenderId,
  vendorName,
  aspect,
}: {
  tenderId: string;
  vendorName: string;
  aspect: Aspect;
}) {
  const config = ASPECT_CONFIG[aspect];
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/documents?tenderId=${tenderId}&jenis=penawaran`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) {
          setError(j.error ?? "Gagal memuat dokumen");
          return;
        }
        if (active) setDocs(Array.isArray(j.docs) ? j.docs : []);
      })
      .catch(() => active && setError("Gagal memuat dokumen"))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [tenderId]);

  const vendorDoc =
    docs.find((d) =>
      d.nama_file.toLowerCase().includes(vendorName.toLowerCase())
    ) ??
    docs.find((d) => d.nama_file.toLowerCase().includes("penawaran")) ??
    docs[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <FileText className="h-3.5 w-3.5 text-brand-700" />
          <div>
            <p className="text-xs font-bold text-slate-900">
              Dokumen Penawaran
            </p>
            <p className="text-[10px] text-slate-500">{vendorName}</p>
          </div>
        </div>
        <div className="p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <Spinner className="h-4 w-4 text-brand-700" />
              <span className="text-[11px] text-slate-400">Memuat…</span>
            </div>
          ) : error ? (
            <p className="py-4 text-center text-[11px] text-red-600">{error}</p>
          ) : vendorDoc ? (
            <div className="max-h-72 overflow-y-auto rounded-lg bg-slate-50 p-3">
              <p className="mb-1 text-[10px] font-semibold text-slate-500">
                {vendorDoc.nama_file}
              </p>
              <p className="whitespace-pre-wrap text-[11px] leading-5 text-slate-600">
                {vendorDoc.konten_text ?? "—"}
              </p>
            </div>
          ) : (
            <p className="py-4 text-center text-[11px] text-slate-400">
              Dokumen penawaran belum diunggah.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <ListChecks className="h-3.5 w-3.5 text-brand-700" />
          <p className="text-xs font-bold text-slate-900">
            Kriteria Penilaian — {config.judul}
          </p>
        </div>
        <ul className="space-y-2 p-3">
          {config.kriteria.map((k, i) => (
            <li key={i} className="flex gap-1.5 text-[11px] leading-4 text-slate-600">
              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-brand-600" />
              {k}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}