"use client";

import { useState } from "react";
import { FilePenLine, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { QnaForm } from "@/components/d5/qna-form";
import type { BaJson, BeritaAcara, QnaNote } from "@/types";

export function TenderDetailTabs({
  tenderId,
  rksFileName,
  initialBa,
}: {
  tenderId: string;
  rksFileName: string;
  initialBa: BeritaAcara | null;
}) {
  const [tab, setTab] = useState<"prebid" | "penilaian">("prebid");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setTab("prebid")}
          className={cn(
            "flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold transition",
            tab === "prebid"
              ? "border-gold-500 text-brand-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <FilePenLine className="h-3.5 w-3.5" />
          Pre-Bid &amp; Berita Acara
        </button>
        <button
          onClick={() => setTab("penilaian")}
          className={cn(
            "flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold transition",
            tab === "penilaian"
              ? "border-gold-500 text-brand-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Info className="h-3.5 w-3.5" />
          Penilaian Tim
        </button>
      </div>

      {tab === "prebid" ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
            <div className="text-xs leading-6 text-sky-800">
              <p className="font-bold">Modul D5 — Pre-Bid &amp; BA Auto-Gen</p>
              <p>
                Alur: <b>Capture</b> (catat sesi) → <b>Understand</b> (AI
                menganalisis RKS/TOR) → <b>Generate</b> (draft Berita Acara
                terstruktur). Dokumen RKS yang dipakai:{" "}
                <span className="font-semibold">
                  {rksFileName}
                </span>
                .
              </p>
            </div>
          </div>
          <QnaForm
            tenderId={tenderId}
            rksFileName={rksFileName}
            initialNotes={(initialBa?.qna_notes as QnaNote[] | undefined) ?? []}
            existingBa={(initialBa?.hasil_generate as BaJson | null) ?? null}
            existingStatus={initialBa?.status}
            existingBaId={initialBa?.id}
          />
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50 px-5 py-4">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-purple-600" />
          <div className="text-xs leading-6 text-purple-800">
            <p className="font-bold">Penilaian tim dipindah ke Kolaborasi</p>
            <p>
              Evaluasi 4 aspek (Teknis, Legal, Harga, K3) untuk setiap vendor
              kini dikerjakan di modul <b>Kolaborasi</b> pada menu Operasional —
              berbasis vendor, lintas tender.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}