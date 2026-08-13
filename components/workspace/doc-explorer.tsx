"use client";

import { useState } from "react";
import { FileText, Eye } from "lucide-react";
import { DocumentPreview } from "@/components/workspace/document-preview";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/components/workspace/workspace-provider";
import type { DocumentRow } from "@/types";
import { cn } from "@/lib/utils";

const JENIS_LABELS: Record<DocumentRow["jenis"], string> = {
  rks_tor: "RKS/TOR",
  penawaran: "Penawaran",
  lainnya: "Lainnya",
};

export function DocExplorer({ docs }: { docs: DocumentRow[] }) {
  const [selectedId, setSelectedId] = useState(docs[0]?.id ?? null);
  const { setLiveDocument } = useWorkspace();
  const selected = docs.find((d) => d.id === selectedId) ?? null;

  function open(doc: DocumentRow) {
    setSelectedId(doc.id);
    setLiveDocument({
      title: doc.nama_file,
      subtitle: JENIS_LABELS[doc.jenis],
      kind: "text",
      text: doc.konten_text,
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Dokumen project ({docs.length})
        </p>
        {docs.map((d) => (
          <button
            key={d.id}
            onClick={() => open(d)}
            className={cn(
              "w-full rounded-xl border p-3 text-left transition",
              selectedId === d.id
                ? "border-brand-700 bg-brand-50/60 shadow-sm"
                : "border-slate-200 bg-white hover:border-brand-200"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                  selectedId === d.id
                    ? "bg-brand-800 text-white"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                <FileText className="h-4 w-4" />
              </span>
              <Badge
                className={cn(
                  d.jenis === "rks_tor"
                    ? "bg-brand-50 text-brand-700 border-brand-200"
                    : d.jenis === "penawaran"
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-slate-100 text-slate-600 border-slate-200"
                )}
              >
                {JENIS_LABELS[d.jenis]}
              </Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-800">
              {d.nama_file}
            </p>
            <p className="mt-1 text-[10px] text-slate-400">
              {d.konten_text.length.toLocaleString("id-ID")} karakter teks
            </p>
          </button>
        ))}
      </div>

      <div>
        {selected ? (
          <DocumentPreview doc={selected} />
        ) : (
          <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Eye className="h-5 w-5" />
            </span>
            <p className="text-xs font-semibold text-slate-600">
              Pilih dokumen untuk melihat preview
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
