import type { DocumentRow } from "@/types";
import { Badge } from "@/components/ui/badge";

const JENIS_LABELS: Record<DocumentRow["jenis"], { label: string; cls: string }> = {
  rks_tor: { label: "RKS/TOR", cls: "bg-brand-50 text-brand-700 border-brand-200" },
  penawaran: { label: "Penawaran", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  lainnya: { label: "Lainnya", cls: "bg-slate-100 text-slate-600 border-slate-200" },
};

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  if (/^\d+(\.\d+)*[\.\)]?\s+[A-Z0-9]/.test(trimmed) && trimmed.length < 120)
    return true;
  return /^[A-Z0-9 \-\/\.]{3,60}$/.test(trimmed) && trimmed.length > 3;
}

export function DocumentPreview({
  doc,
  maxHeight,
}: {
  doc: DocumentRow;
  maxHeight?: string;
}) {
  const meta = JENIS_LABELS[doc.jenis];
  const lines = doc.konten_text.split("\n");

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div
        className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 py-4"
      >
        <div>
          <h3 className="text-sm font-bold text-slate-900">{doc.nama_file}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Dokumen pendukung project — tampilan teks
          </p>
        </div>
        <Badge className={meta.cls}>{meta.label}</Badge>
      </div>
      <div
        className={`overflow-y-auto px-6 py-5 ${
          maxHeight ?? "max-h-[65vh]"
        }`}
      >
        {lines.map((line, i) =>
          line.trim() === "" ? (
            <div key={i} className="h-3" />
          ) : isHeadingLine(line) ? (
            <p
              key={i}
              className="mt-2 text-sm font-bold text-brand-800 first:mt-0"
            >
              {line}
            </p>
          ) : (
            <p key={i} className="text-justify text-sm leading-7 text-slate-700">
              {line}
            </p>
          )
        )}
      </div>
    </div>
  );
}
