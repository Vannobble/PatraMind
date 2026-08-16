import Link from "next/link";
import { FileText, FolderOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentRow } from "@/types";

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

export function DokumenRelevan({
  docs,
  activeVendor,
}: {
  docs: DocumentRow[];
  activeVendor: string;
}) {
  const penawaran = docs.filter((d) => d.jenis === "penawaran");
  const lainnya = docs.filter((d) => d.jenis !== "penawaran");

  function isActive(d: DocumentRow): boolean {
    return (
      d.jenis === "penawaran" &&
      d.nama_file.toLowerCase().includes(activeVendor.toLowerCase())
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <FolderOpen className="h-4 w-4" />
          </span>
          <p className="text-sm font-bold text-brand-950">Dokumen Relevan</p>
        </div>
        <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold text-brand-700">
          {docs.length} dokumen
        </span>
      </div>

      {docs.length === 0 ? (
        <p className="text-xs text-slate-400">
          Belum ada dokumen untuk tender ini — tambahkan lewat Smart-Dokumen.
        </p>
      ) : (
        <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
          {penawaran.map((d) => (
            <Link
              key={d.id}
              href={`/dokumen/${d.id}`}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3 transition hover:shadow-sm",
                isActive(d)
                  ? "border-brand-300 bg-brand-50/60"
                  : "border-slate-100 bg-slate-50/60 hover:border-gold-400"
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {d.nama_file}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Dokumen penawaran vendor yang sedang dinilai
                </p>
              </div>
              <Badge className={JENIS_BADGE.penawaran}>
                {JENIS_LABEL.penawaran}
              </Badge>
            </Link>
          ))}
          {lainnya.map((d) => (
            <Link
              key={d.id}
              href={`/dokumen/${d.id}`}
              className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition hover:border-gold-400 hover:shadow-sm"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                <FileText className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {d.nama_file}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  Dokumen acuan tender (RKS / pendukung)
                </p>
              </div>
              <Badge
                className={JENIS_BADGE[d.jenis] ?? JENIS_BADGE.lainnya}
              >
                {JENIS_LABEL[d.jenis] ?? "Lainnya"}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}