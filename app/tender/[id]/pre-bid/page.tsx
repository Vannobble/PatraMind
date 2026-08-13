import { notFound } from "next/navigation";
import { FileText, Info } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { QnaForm } from "@/components/d5/qna-form";
import { Card } from "@/components/ui/card";
import type { BaJson, BeritaAcara, QnaNote, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function PreBidPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [{ data: tender }, { data: docs }, { data: bas }] = await Promise.all([
    supabaseClient().from("tenders").select("*").eq("id", id).maybeSingle(),
    supabaseClient()
      .from("documents")
      .select("*")
      .eq("tender_id", id)
      .order("created_at"),
    supabaseClient()
      .from("berita_acara")
      .select("*")
      .eq("tender_id", id)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  if (!tender) notFound();
  const t = tender as Tender;

  const rks =
    docs?.find((d) => d.jenis === "rks_tor") ??
    docs?.find((d) => d.jenis === "lainnya") ??
    null;

  const existingBa = (bas?.[0] ?? null) as BeritaAcara | null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-6">
      <div className="mb-6 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <div className="text-xs leading-6 text-sky-800">
            <p className="font-bold">Modul D5 — Pre-Bid &amp; BA Auto-Gen</p>
            <p>
              Alur: <b>Capture</b> (catat sesi) → <b>Understand</b> (AI
              menganalisis RKS/TOR) → <b>Generate</b> (draft Berita Acara
              terstruktur). Dokumen RKS yang dipakai:{" "}
              <span className="font-semibold">
                {rks?.nama_file ?? "— belum tersedia"}
              </span>
              .
            </p>
          </div>
        </div>
      </div>

      <Card className="p-5">
        <QnaForm
          tenderId={id}
          rksFileName={rks?.nama_file ?? "RKS/TOR"}
          initialNotes={
            (existingBa?.qna_notes as QnaNote[] | undefined) ?? []
          }
          existingBa={(existingBa?.hasil_generate as BaJson | null) ?? null}
          existingStatus={existingBa?.status}
          existingBaId={existingBa?.id}
        />
      </Card>

      {!rks && (
        <p className="mt-4 flex items-center gap-2 text-xs text-amber-700">
          <FileText className="h-3.5 w-3.5" />
          Belum ada dokumen RKS/TOR untuk tender ini — jalankan{" "}
          <code className="rounded bg-slate-100 px-1">npm run seed</code> agar
          data contoh dimuat.
        </p>
      )}
    </div>
  );
}
