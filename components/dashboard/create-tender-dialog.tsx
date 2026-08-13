"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function CreateTenderDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [nomorPr, setNomorPr] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_pekerjaan: nama, nomor_pr: nomorPr }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat tender");
      setOpen(false);
      setNama("");
      setNomorPr("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat tender");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus /> Buat Tender
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Buat Tender Baru
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={create} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nama">Nama Pekerjaan</Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: Pengadaan Spare Part Pompa NPK 2026"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pr">Nomor PR</Label>
                <Input
                  id="pr"
                  value={nomorPr}
                  onChange={(e) => setNomorPr(e.target.value)}
                  placeholder="Contoh: PR-26-005132"
                  required
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? <Spinner className="h-4 w-4" /> : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
