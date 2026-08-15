"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Check,
  FileText,
  Pencil,
  Save,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { BackButton } from "@/components/ui/back-button";
import { AIAssistantPanel } from "@/components/workspace/ai-assistant-panel";
import { formatTanggal, cn } from "@/lib/utils";
import type { DocumentRow, Tender } from "@/types";

export function DocumentWorkspace({
  doc,
  tender,
  role,
  aiMode,
}: {
  doc: DocumentRow;
  tender: Pick<Tender, "id" | "nama_pekerjaan" | "nomor_pr">;
  role: string;
  aiMode: "openai" | "local";
}) {
  const canEdit = ["panitia", "admin"].includes(role);
  const [title, setTitle] = useState(doc.nama_file);
  const [content, setContent] = useState(doc.konten_text ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const dirty = title !== doc.nama_file || content !== (doc.konten_text ?? "");

  async function save() {
    if (!dirty || saving) return;
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_file: title, konten_text: content }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan");
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-7xl">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-6 py-3">
          <BackButton
            fallback="/dokumen"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-gold-400 hover:text-brand-800"
            title="Kembali ke Smart-Dokumen"
          >
            <ArrowLeft className="h-4 w-4" />
          </BackButton>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <FileText className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0 flex-1">
            {isEditing && canEdit ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full max-w-xl rounded-lg border border-brand-200 bg-brand-50/40 px-3 py-1.5 font-display text-base font-bold text-brand-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
              />
            ) : (
              <h1 className="truncate font-display text-base font-bold text-brand-950">
                {title}
              </h1>
            )}
            <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
              {tender.nomor_pr || "No. PR -"} · {tender.nama_pekerjaan} ·
              Ditambahkan {formatTanggal(doc.created_at)}
            </p>
          </div>
          <Badge className="hidden bg-slate-100 text-slate-600 border-slate-200 sm:inline-flex">
            {doc.jenis === "rks_tor"
              ? "RKS / TOR"
              : doc.jenis === "penawaran"
                ? "Penawaran"
                : "Lainnya / Pendukung"}
          </Badge>
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check className="h-4 w-4" /> Tersimpan
            </span>
          )}
          <div className="flex shrink-0 items-center gap-2">
            {canEdit && (
              <Button
                variant={isEditing ? "outline" : "ghost"}
                onClick={() => setIsEditing((v) => !v)}
              >
                {isEditing ? (
                  <Pencil className="h-4 w-4" />
                ) : (
                  <Pencil className="h-4 w-4" />
                )}
                {isEditing ? "Batal Edit" : "Edit"}
              </Button>
            )}
            <Button
              variant="primary"
              onClick={save}
              disabled={!dirty || saving}
            >
              {saving ? (
                <Spinner className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Simpan
            </Button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100/70 px-6 py-6">
          <div
            className={cn(
              "mx-auto min-h-[60vh] w-full max-w-3xl rounded-xl border bg-white p-8 shadow-sm",
              isEditing && canEdit
                ? "border-brand-200 ring-2 ring-brand-100"
                : "border-slate-200"
            )}
          >
            {isEditing && canEdit ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="h-[60vh] w-full resize-none bg-transparent font-mono text-[12.5px] leading-6 text-slate-800 focus-visible:outline-none"
                spellCheck={false}
              />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-[12.5px] leading-6 text-slate-800">
                {content || "(kosong)"}
              </pre>
            )}
          </div>
        </div>
      </div>

      <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <Sparkles className="h-4 w-4 text-gold-500" />
          <p className="text-xs font-bold text-brand-950">AI Asisten Dokumen</p>
          <span className="ml-auto rounded-full bg-brand-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-600">
            {aiMode === "openai" ? "OpenAI" : "RAG Lokal"}
          </span>
        </div>
        <div className="min-h-0 flex-1">
          <AIAssistantPanel
            tenderId={doc.tender_id}
            aiMode={aiMode}
            documentId={doc.id}
            compact
          />
        </div>
      </aside>
    </div>
  );
}