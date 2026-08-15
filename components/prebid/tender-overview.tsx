import {
  FileText,
  Check,
  PenLine,
  Users,
  BadgeCheck,
  Ban,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RingkasanEditor } from "@/components/prebid/ringkasan-editor";
import { TENDER_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Tender, TenderStatus } from "@/types";

const PHASES: { key: string; label: string; desc: string }[] = [
  { key: "draft", label: "Draft", desc: "Persiapan tender" },
  { key: "proses", label: "Proses", desc: "Pre-Bid & BA Aanwijzing" },
  { key: "evaluasi", label: "Evaluasi", desc: "Penilaian tim di Kolaborasi" },
  { key: "keputusan", label: "Keputusan", desc: "Diterima / Ditolak" },
];

function phaseIndexOf(status: TenderStatus): number {
  if (status === "draft") return 0;
  if (status === "proses") return 1;
  if (status === "evaluasi") return 2;
  return 3;
}

function TenderStepper({ status }: { status: TenderStatus }) {
  const idx = phaseIndexOf(status);
  const result = status === "diterima" ? "diterima" : status === "ditolak" ? "ditolak" : null;

  return (
    <div className="flex items-center gap-0">
      {PHASES.map((p, i) => {
        const done = i < idx || (i === idx && result !== null);
        const current = i === idx && result === null;
        const isResult = p.key === "keputusan";

        return (
          <div key={p.key} className={cn("flex items-center", i > 0 && "flex-1")}>
            {i > 0 && (
              <div
                className={cn(
                  "mx-1 h-0.5 flex-1 rounded",
                  i <= idx ? "bg-brand-700" : "bg-slate-200"
                )}
              />
            )}
            <div className="flex w-32 flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 transition",
                  done
                    ? "border-brand-700 bg-brand-700 text-white"
                    : current
                      ? "border-gold-500 bg-gold-100 text-gold-600 ring-4 ring-gold-100/60"
                      : "border-slate-200 bg-white text-slate-300"
                )}
              >
                {done ? (
                  <Check className="h-4 w-4" />
                ) : current ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : p.key === "keputusan" ? (
                  <Users className="h-4 w-4" />
                ) : i === 0 ? (
                  <FileText className="h-4 w-4" />
                ) : i === 1 ? (
                  <PenLine className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
              </span>
              <div className="leading-tight">
                <p
                  className={cn(
                    "text-[11px] font-bold",
                    done || current ? "text-brand-900" : "text-slate-400"
                  )}
                >
                  {isResult && result
                    ? result === "diterima"
                      ? "Diterima"
                      : "Ditolak"
                    : p.label}
                </p>
                <p className="mt-0.5 text-[9px] text-slate-400">{p.desc}</p>
              </div>
              {isResult && result === "ditolak" && (
                <Badge className="bg-red-50 text-red-700 border-red-200">
                  <Ban className="h-3 w-3" /> Ditolak
                </Badge>
              )}
              {isResult && result === "diterima" && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <BadgeCheck className="h-3 w-3" /> Diterima
                </Badge>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TenderOverview({
  tender,
  docCounts,
  baStatus,
  evalStats,
  canEditRingkasan = false,
}: {
  tender: Tender;
  docCounts: { rks: number; penawaran: number; lainnya: number; total: number };
  baStatus: "draft" | "final" | null;
  evalStats: { total: number; final: number; consensus: number };
  canEditRingkasan?: boolean;
}) {
  const st = TENDER_STATUS_LABELS[tender.status] ?? TENDER_STATUS_LABELS.draft;

  const tiles = [
    {
      label: "Dokumen Terkelola",
      value: String(docCounts.total),
      sub: `${docCounts.rks} RKS · ${docCounts.penawaran} penawaran · ${docCounts.lainnya} lainnya`,
      icon: FileText,
      cls: "bg-brand-50 text-brand-700",
    },
    {
      label: "BA Aanwijzing",
      value: baStatus === "final" ? "Final" : baStatus === "draft" ? "Draft" : "Belum",
      sub:
        baStatus === "final"
          ? "Berita Acara sudah difinalkan"
          : baStatus === "draft"
            ? "Draft BA tersedia — segera finalkan"
            : "Generate dari tab Pre-Bid & BA",
      icon: PenLine,
      cls: "bg-gold-100 text-gold-600",
    },
    {
      label: "Evaluasi Vendor",
      value: `${evalStats.final}/${evalStats.total}`,
      sub:
        evalStats.total === 0
          ? "Belum ada penilaian di Kolaborasi"
          : `${evalStats.consensus} konsensus · ${evalStats.final} final`,
      icon: Users,
      cls: "bg-purple-50 text-purple-600",
    },
    {
      label: "Status Tender",
      value: st.label,
      sub:
        tender.status === "draft"
          ? "Lengkapi dokumen, lalu ubah status ke Proses"
          : tender.status === "proses"
            ? "Jalankan sesi Pre-Bid & generate BA"
            : tender.status === "evaluasi"
              ? "Tunggu penilaian tim selesai di Kolaborasi"
              : tender.status === "diterima"
                ? "Tender diterima — evaluasi selesai"
                : "Tender ditolak — evaluasi dihentikan",
      icon: BadgeCheck,
      cls: "bg-red-50 text-red-600",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Alur Proses Pengadaan
          </p>
          <Badge className={st.cls}>{st.label}</Badge>
        </div>
        <div className="overflow-x-auto pb-1 pt-4">
          <TenderStepper status={tender.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                tile.cls
              )}
            >
              <tile.icon className="h-4 w-4" />
            </div>
            <p className="mt-3 font-display text-xl font-bold text-brand-950">
              {tile.value}
            </p>
            <p className="text-xs font-semibold text-slate-600">{tile.label}</p>
            <p className="mt-1 text-[10px] leading-4 text-slate-400">
              {tile.sub}
            </p>
          </div>
        ))}
        <RingkasanEditor
          tenderId={tender.id}
          ringkasan={tender.ringkasan ?? ""}
          canEdit={canEditRingkasan}
        />
      </div>
    </div>
  );
}