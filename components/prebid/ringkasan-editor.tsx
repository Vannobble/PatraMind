"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NotebookText, Pencil, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export function RingkasanEditor({
  tenderId,
  ringkasan,
  canEdit,
}: {
  tenderId: string;
  ringkasan: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(ringkasan);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tenders/${tenderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ringkasan: text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan ringkasan");
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
            <NotebookText className="h-4 w-4" />
          </span>
          <p className="text-sm font-bold text-brand-950">Rangkuman Tender</p>
        </div>
        {canEdit && !editing && (
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="h-4 w-4" /> Edit
          </Button>
        )}
      </div>

      {editing ? (
        <div className="mt-4 space-y-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder="Tulis rangkuman singkat tender…"
            className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setText(ringkasan);
                setError(null);
              }}
            >
              <X className="h-4 w-4" /> Batal
            </Button>
            <Button onClick={save} disabled={busy || text.trim() === ""}>
              {busy ? <Spinner className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              Simpan
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-xs leading-6 text-slate-600">
          {ringkasan.trim() || "Belum ada rangkuman."}
        </p>
      )}
    </div>
  );
}