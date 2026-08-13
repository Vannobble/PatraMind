import Link from "next/link";
import {
  ClipboardList,
  Building2,
  Users,
  CalendarDays,
  FileText,
} from "lucide-react";
import { WorkspaceNav } from "./workspace-nav";
import { Badge } from "@/components/ui/badge";
import { TENDER_STATUS_LABELS } from "@/lib/constants";
import { formatTanggal } from "@/lib/utils";
import type { DocumentRow, Tender } from "@/types";

export function ContextSidebar({
  tender,
  docs,
}: {
  tender: Tender;
  docs: DocumentRow[];
}) {
  const rks = docs.find((d) => d.jenis === "rks_tor");
  const vendors = docs.filter((d) => d.jenis === "penawaran");
  const st = TENDER_STATUS_LABELS[tender.status] ?? TENDER_STATUS_LABELS.draft;

  return (
    <aside className="flex w-[240px] shrink-0 flex-col gap-6 overflow-y-auto border-r border-slate-200 bg-white px-3 py-4">
      <div>
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        <WorkspaceNav tenderId={tender.id} />
      </div>

      <div>
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Context
        </p>
        <div className="space-y-2">
          <Link
            href={`/tender/${tender.id}/dokumen`}
            className="block rounded-lg border border-slate-200 bg-slate-50/60 p-3 transition hover:border-brand-200 hover:bg-brand-50/40"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-bold text-slate-800">
                RKS / TOR
              </p>
            </div>
            <p className="mt-1.5 line-clamp-2 text-[10px] leading-4 text-slate-500">
              {rks?.nama_file ?? "Belum tersedia"}
            </p>
            <p className="mt-1 text-[9px] font-semibold text-brand-700">
              Buka dokumen →
            </p>
          </Link>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Building2 className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-bold text-slate-800">
                Vendor{" "}
                <Badge className="ml-0.5 bg-sky-50 text-sky-700 border-sky-200 text-[9px] px-1.5">
                  {vendors.length}
                </Badge>
              </p>
            </div>
            <div className="mt-1.5 space-y-1">
              {vendors.map((v) => {
                const nama = v.nama_file.replace(/^penawaran[_\-\s]*/i, "").replace(/\.[a-z]+$/i, "");
                return (
                  <p key={v.id} className="text-[10px] leading-4 text-slate-500">
                    • {nama}
                  </p>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Users className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-bold text-slate-800">
                Meeting / Aanwijzing
              </p>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-[10px] leading-4 text-slate-500">
              <CalendarDays className="h-3 w-3 text-slate-400" />
              Telah dilaksanakan · 8 peserta
            </p>
          </div>
        </div>
      </div>

      <div className="mt-auto rounded-lg bg-brand-950 p-3">
        <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-200">
          <ClipboardList className="h-3 w-3" /> Project
        </p>
        <p className="mt-1.5 text-[11px] font-bold leading-4 text-white">
          {tender.nama_pekerjaan}
        </p>
        <p className="mt-1 text-[10px] text-brand-300">
          No. PR {tender.nomor_pr || "-"}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <Badge className={st.cls}>{st.label}</Badge>
          <span className="text-[9px] text-brand-300">
            {formatTanggal(tender.created_at)}
          </span>
        </div>
      </div>
    </aside>
  );
}
