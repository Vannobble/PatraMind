"use client";

import { useState } from "react";
import { FilePenLine, LayoutGrid, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { QnaForm } from "@/components/d5/qna-form";
import { EvaluationBoard } from "@/components/d6/evaluation-board";
import type { BaJson, BeritaAcara, Evaluation, QnaNote, Role } from "@/types";

export function TenderDetailTabs({
  tenderId,
  rksFileName,
  initialBa,
  initialEvals,
  vendors,
  role,
}: {
  tenderId: string;
  rksFileName: string;
  initialBa: BeritaAcara | null;
  initialEvals: Evaluation[];
  vendors: { nama: string }[];
  role: Role;
}) {
  const [tab, setTab] = useState<"prebid" | "evaluation">("prebid");

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
          onClick={() => setTab("evaluation")}
          className={cn(
            "flex items-center gap-1.5 rounded-t-lg border-b-2 px-4 py-2.5 text-xs font-semibold transition",
            tab === "evaluation"
              ? "border-gold-500 text-brand-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Evaluation ({vendors.length})
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
        <EvaluationBoard
          tenderId={tenderId}
          vendors={vendors}
          initialEvals={initialEvals}
          role={role}
        />
      )}
    </div>
  );
}