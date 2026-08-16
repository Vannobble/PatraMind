"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Layers, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Department, TenderMode } from "@/types";

export function CreateTenderDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [nama, setNama] = useState("");
  const [nomorPr, setNomorPr] = useState("");
  const [klien, setKlien] = useState("");
  const [nilaiKontrak, setNilaiKontrak] = useState("");
  const [deadline, setDeadline] = useState("");
  const [pic, setPic] = useState("");
  const [mode, setMode] = useState<TenderMode>("aspek");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/departments")
      .then((r) => r.json())
      .then((j) => {
        const deps = (j.departments ?? []) as Department[];
        setDepartments(deps);
        const w: Record<string, number> = {};
        const n = deps.length;
        deps.forEach((d, i) => {
          w[d.id] = i === deps.length - 1 ? 100 - Math.floor(100 / n) * (n - 1) : Math.floor(100 / n);
        });
        setWeights(w);
      })
      .catch(() => {});
  }, [open]);

  const totalBobot = Object.values(weights).reduce((a, b) => a + (b || 0), 0);
  const bobotValid = mode !== "departemen" || (departments.length > 0 && totalBobot === 100);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!bobotValid) {
      setError("Bobot departemen harus total 100%");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_pekerjaan: nama,
          nomor_pr: nomorPr,
          klien,
          pic,
          deadline: deadline || null,
          nilai_kontrak: Number(nilaiKontrak.replace(/[^\d]/g, "")) || 0,
          mode_evaluasi: mode,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat tender");

      if (mode === "departemen") {
        const res2 = await fetch("/api/tender-departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenderId: json.id,
            mode: "departemen",
            assignments: departments.map((d) => ({
              department_id: d.id,
              bobot: weights[d.id] || 0,
            })),
          }),
        });
        const json2 = await res2.json();
        if (!res2.ok) throw new Error(json2.error ?? "Gagal simpan bobot");
      }

      setOpen(false);
      setNama("");
      setNomorPr("");
      setKlien("");
      setNilaiKontrak("");
      setDeadline("");
      setPic("");
      setMode("aspek");
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
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
                <div className="space-y-1.5">
                  <Label htmlFor="klien">Klien</Label>
                  <Input
                    id="klien"
                    value={klien}
                    onChange={(e) => setKlien(e.target.value)}
                    placeholder="Contoh: PT Pertamina Patra Niaga"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nilai">Nilai Kontrak (Rp)</Label>
                  <Input
                    id="nilai"
                    type="text"
                    inputMode="numeric"
                    value={nilaiKontrak}
                    onChange={(e) => setNilaiKontrak(e.target.value)}
                    placeholder="Contoh: 250000000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pic">PIC</Label>
                <Input
                  id="pic"
                  value={pic}
                  onChange={(e) => setPic(e.target.value)}
                  placeholder="Contoh: Panitia Pengadaan"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Mode Evaluasi Kolaborasi</Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("aspek")}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-3 text-left transition",
                      mode === "aspek"
                        ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                        : "border-slate-200 bg-white hover:border-brand-300"
                    )}
                  >
                    <Layers className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                    <span>
                      <span className="block text-xs font-bold text-slate-900">
                        Aspek
                      </span>
                      <span className="block text-[11px] leading-4 text-slate-500">
                        4 kolom tetap: Teknis, Legal, Harga, K3
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("departemen")}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-3 text-left transition",
                      mode === "departemen"
                        ? "border-brand-700 bg-brand-50 ring-1 ring-brand-700"
                        : "border-slate-200 bg-white hover:border-brand-300"
                    )}
                  >
                    <Scale className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" />
                    <span>
                      <span className="block text-xs font-bold text-slate-900">
                        Departemen Berbobot
                      </span>
                      <span className="block text-[11px] leading-4 text-slate-500">
                        Tiap departemen menilai + AI skor, digabung sesuai bobot
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {mode === "departemen" && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Bobot per Departemen (total harus 100%)
                  </p>
                  {departments.length === 0 ? (
                    <p className="text-[11px] text-slate-400">
                      Belum ada departemen — tambahkan lewat halaman Kolaborasi.
                    </p>
                  ) : (
                    departments.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
                      >
                        <span className="flex-1 text-xs font-semibold text-slate-700">
                          {d.nama}
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={weights[d.id] ?? 0}
                          onChange={(e) =>
                            setWeights((prev) => ({
                              ...prev,
                              [d.id]: Math.max(
                                0,
                                Math.min(100, Number(e.target.value) || 0)
                              ),
                            }))
                          }
                          className="h-8 w-20 rounded-lg border border-slate-300 px-2 text-right text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        />
                        <span className="w-6 text-[10px] font-bold text-slate-400">
                          %
                        </span>
                      </div>
                    ))
                  )}
                  <p
                    className={cn(
                      "text-right text-[11px] font-bold",
                      totalBobot === 100 ? "text-emerald-600" : "text-red-600"
                    )}
                  >
                    Total: {totalBobot}%
                  </p>
                </div>
              )}

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
                <Button type="submit" disabled={busy || !bobotValid}>
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