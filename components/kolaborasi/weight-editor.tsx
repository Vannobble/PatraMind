"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, Plus, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { Department, TenderDepartment, TenderMode } from "@/types";

export function WeightEditor({
  tenderId,
  initialMode,
  departments,
  tenderDepartments,
  isAdmin,
}: {
  tenderId: string;
  initialMode: TenderMode;
  departments: Department[];
  tenderDepartments: TenderDepartment[];
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<TenderMode>(initialMode);
  const [weights, setWeights] = useState<Record<string, number>>(() => {
    const w: Record<string, number> = {};
    for (const td of tenderDepartments) w[td.department_id] = td.bobot;
    const n = departments.length;
    departments.forEach((d, i) => {
      if (w[d.id] === undefined) {
        w[d.id] = i === departments.length - 1 ? 100 - Math.floor(100 / n) * (n - 1) : Math.floor(100 / n);
      }
    });
    return w;
  });
  const [busy, setBusy] = useState(false);
  const [busyDept, setBusyDept] = useState<string | null>(null);
  const [newDept, setNewDept] = useState("");
  const [error, setError] = useState<string | null>(null);

  const totalBobot = Object.values(weights).reduce((a, b) => a + (b || 0), 0);

  async function save() {
    if (mode === "departemen" && totalBobot !== 100) {
      setError("Bobot harus total 100%");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tender-departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenderId,
          mode,
          assignments: departments.map((d) => ({
            department_id: d.id,
            bobot: weights[d.id] || 0,
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menyimpan");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy(false);
    }
  }

  async function addDepartment() {
    const nama = newDept.trim();
    if (nama.length < 2) return;
    setBusyDept("add");
    setError(null);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "add", nama }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menambah");
      setNewDept("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menambah");
    } finally {
      setBusyDept(null);
    }
  }

  async function removeDepartment(id: string) {
    if (!confirm("Hapus departemen ini dari master? Penilaian terkait ikut terhapus.")) return;
    setBusyDept(id);
    setError(null);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "remove", id }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menghapus");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setBusyDept(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Settings2 className="h-4 w-4 text-brand-700" />
          Konfigurasi Kolaborasi
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
            {mode === "departemen" ? "Departemen Berbobot" : "Aspek"}
          </span>
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-slate-400 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 px-4 py-4">
          <div className="flex gap-2">
            {(
              [
                { v: "aspek", label: "Mode Aspek (4 kolom)" },
                { v: "departemen", label: "Mode Departemen Berbobot" },
              ] as { v: TenderMode; label: string }[]
            ).map((o) => (
              <button
                key={o.v}
                onClick={() => setMode(o.v)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
                  mode === o.v
                    ? "border-brand-700 bg-brand-800 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-brand-300"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>

          {mode === "departemen" && (
            <>
              <div className="space-y-2">
                {departments.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2"
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
                          [d.id]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                        }))
                      }
                      className="h-8 w-20 rounded-lg border border-slate-300 px-2 text-right text-xs font-semibold text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                    />
                    <span className="w-6 text-[10px] font-bold text-slate-400">%</span>
                    {isAdmin && (
                      <button
                        onClick={() => removeDepartment(d.id)}
                        disabled={busyDept === d.id}
                        className="rounded-md p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                        title="Hapus departemen"
                      >
                        {busyDept === d.id ? (
                          <Spinner className="h-3.5 w-3.5" />
                        ) : (
                          <X className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <input
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    placeholder="Nama departemen baru…"
                    className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-xs text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addDepartment}
                    disabled={busyDept === "add" || newDept.trim().length < 2}
                    className="h-8 text-[11px]"
                  >
                    {busyDept === "add" ? <Spinner className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    Tambah
                  </Button>
                </div>
              )}

              <p
                className={cn(
                  "text-right text-[11px] font-bold",
                  totalBobot === 100 ? "text-emerald-600" : "text-red-600"
                )}
              >
                Total: {totalBobot}%
              </p>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
          )}

          <div className="flex justify-end">
            <Button size="sm" onClick={save} disabled={busy}>
              {busy ? <Spinner className="h-3.5 w-3.5" /> : "Simpan Konfigurasi"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}