"use client";

import { useState } from "react";
import { CheckCircle2, Pencil, Save, FileCheck2, Copy, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BaDocument } from "@/components/workspace/ba-document";
import { Spinner } from "@/components/ui/spinner";
import type { BaJson } from "@/types";

export function BAPreview({
  ba,
  status,
  saving,
  onSave,
}: {
  ba: BaJson;
  status: "draft" | "final";
  saving: boolean;
  onSave: (status: "draft" | "final", content: BaJson) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function startEdit() {
    setJsonText(JSON.stringify(ba, null, 2));
    setJsonError(null);
    setEditing(true);
  }

  function saveJson(statusToSave: "draft" | "final") {
    try {
      const parsed = JSON.parse(jsonText) as BaJson;
      if (!parsed.nomor_ba || !parsed.ringkasan_pelaksanaan) {
        setJsonError("Struktur tidak valid: nomor_ba dan ringkasan_pelaksanaan wajib ada.");
        return;
      }
      setJsonError(null);
      void onSave(statusToSave, parsed);
      setEditing(false);
    } catch {
      setJsonError("JSON tidak valid. Periksa tanda baca (koma, kurung).");
    }
  }

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(ba, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard tidak tersedia
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-slate-900">
            Draft Berita Acara
          </h3>
          {status === "final" ? (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              <CheckCircle2 className="h-3 w-3" /> Final — tersimpan
            </Badge>
          ) : (
            <Badge className="bg-slate-100 text-slate-600 border-slate-200">
              Draft
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={saving}
                onClick={() => saveJson(status)}
              >
                {saving ? <Spinner className="h-4 w-4" /> : <Save />}
                Simpan Perubahan
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={copyJson}>
                {copied ? <CheckCircle2 className="text-emerald-600" /> : <Copy />}
                {copied ? "Tersalin" : "Salin JSON"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startEdit}
                disabled={status === "final" && false}
              >
                <Pencil /> Edit
              </Button>
              <Button
                variant="success"
                size="sm"
                disabled={saving}
                onClick={() => {
                  if (editing) saveJson("final");
                  else void onSave("final", ba);
                }}
              >
                {saving ? <Spinner className="h-4 w-4" /> : <FileCheck2 />}
                Finalize & Simpan
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="h-3.5 w-3.5" />
            Mode edit — ubah struktur JSON di bawah, lalu simpan.
          </div>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            className="min-h-[420px] w-full rounded-lg border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-5 text-emerald-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
            spellCheck={false}
          />
          {jsonError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {jsonError}
            </p>
          )}
        </div>
      ) : (
        <BaDocument ba={ba} status={status} />
      )}
    </div>
  );
}
