"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export function CreateDocumentDialog({
  tenders,
}: {
  tenders: { id: string; nama_pekerjaan: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState("lainnya");
  const [tenderId, setTenderId] = useState(tenders[0]?.id ?? "");
  const [isi, setIsi] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_file: nama,
          jenis,
          tenderId,
          konten_text: isi,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat dokumen");
      setOpen(false);
      setNama("");
      setIsi("");
      router.push(`/dokumen/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat dokumen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus /> Tambah Dokumen
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Dokumen Baru
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
                <Label htmlFor="nama">Nama File</Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: RKS TOR Pengadaan Jasa Survey 2026.txt"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jenis">Kategori</Label>
                  <Select
                    id="jenis"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                  >
                    <option value="rks_tor">RKS / TOR</option>
                    <option value="penawaran">Penawaran</option>
                    <option value="lainnya">Lainnya / Pendukung</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tender">Lokasi Simpan (Tender)</Label>
                  <Select
                    id="tender"
                    value={tenderId}
                    onChange={(e) => setTenderId(e.target.value)}
                    required
                  >
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama_pekerjaan}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="isi">Isi Dokumen</Label>
                <Textarea
                  id="isi"
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  placeholder={"RKS/TOR ...\n\n1. PENDAHULUAN\n..."}
                  rows={8}
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