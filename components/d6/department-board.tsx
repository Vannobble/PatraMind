"use client";

import { useState } from "react";
import { Sparkles, Gauge, MessageSquareText, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ROLE_DEPT_MAP } from "@/lib/constants";
import type {
  Department,
  DepartmentAssessment,
  Evaluation,
  Role,
  TenderDepartment,
} from "@/types";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  belum: { label: "Belum", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  dinilai: { label: "Dinilai", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  disskor: { label: "Diskor", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
};

function skorColor(skor: number): string {
  if (skor >= 75) return "text-emerald-600";
  if (skor >= 50) return "text-amber-600";
  return "text-red-600";
}

export function DepartmentBoard({
  evaluation,
  departments,
  tenderDepartments,
  assessments,
  role,
  onAssessments,
}: {
  evaluation: Evaluation;
  departments: Department[];
  tenderDepartments: TenderDepartment[];
  assessments: DepartmentAssessment[];
  role: Role;
  onAssessments: (a: DepartmentAssessment[]) => void;
}) {
  const [busy, setBusy] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { proposal: string; penilaian: string }>>({});
  const [flash, setFlash] = useState<Record<string, boolean>>({});

  const bobotMap = new Map(
    tenderDepartments.map((td) => [td.department_id, td.bobot])
  );
  const ordered = [...departments].sort(
    (a, b) => (bobotMap.get(b.id) ?? 0) - (bobotMap.get(a.id) ?? 0)
  );

  const byDept = new Map(
    assessments.map((a) => [a.department_id, a] as const)
  );

  function draftFor(deptId: string) {
    return (
      drafts[deptId] ?? {
        proposal: byDept.get(deptId)?.ai_proposal ?? "",
        penilaian: byDept.get(deptId)?.penilaian_teks ?? "",
      }
    );
  }

  function setDraft(deptId: string, patch: Partial<{ proposal: string; penilaian: string }>) {
    setDrafts((prev) => ({
      ...prev,
      [deptId]: { ...draftFor(deptId), ...patch },
    }));
  }

  function patchAssessment(deptId: string, patch: Partial<DepartmentAssessment>) {
    const current = byDept.get(deptId);
    const next = current
      ? { ...current, ...patch }
      : ({
          id: "",
          evaluation_id: evaluation.id,
          department_id: deptId,
          ai_proposal: "",
          penilaian_teks: "",
          ai_skor: null,
          ai_ringkasan: "",
          status: "belum",
          ...patch,
        } as DepartmentAssessment);
    const exists = byDept.has(deptId);
    onAssessments(
      exists
        ? assessments.map((a) => (a.department_id === deptId ? next : a))
        : [...assessments, next]
    );
  }

  function canWrite(dept: Department): boolean {
    if (role === "admin") return true;
    return ROLE_DEPT_MAP[role] === dept.nama;
  }

  async function propose(dept: Department) {
    setBusy((b) => ({ ...b, [dept.id]: "propose" }));
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "propose",
          evaluationId: evaluation.id,
          departmentId: dept.id,
          departmentName: dept.nama,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal usulan AI");
      setDraft(dept.id, { proposal: json.proposal, penilaian: draftFor(dept.id).penilaian });
      patchAssessment(dept.id, { ai_proposal: json.proposal });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[dept.id];
        return next;
      });
    }
  }

  async function savePenilaian(dept: Department) {
    const teks = draftFor(dept.id).penilaian;
    if (teks.trim().length < 3) {
      setError("Tulis penilaian departemen terlebih dahulu");
      return;
    }
    setBusy((b) => ({ ...b, [dept.id]: "save" }));
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_penilaian",
          evaluationId: evaluation.id,
          departmentId: dept.id,
          penilaianTeks: teks,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal simpan");
      patchAssessment(dept.id, { penilaian_teks: teks, status: "dinilai" });
      setFlash((f) => ({ ...f, [dept.id]: true }));
      setTimeout(() => setFlash((f) => ({ ...f, [dept.id]: false })), 1600);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[dept.id];
        return next;
      });
    }
  }

  async function score(dept: Department) {
    setBusy((b) => ({ ...b, [dept.id]: "score" }));
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "score",
          evaluationId: evaluation.id,
          departmentId: dept.id,
          departmentName: dept.nama,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal analisis");
      patchAssessment(dept.id, {
        ai_skor: json.skor,
        ai_ringkasan: json.ringkasan,
        status: "diskor",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setBusy((b) => {
        const next = { ...b };
        delete next[dept.id];
        return next;
      });
    }
  }

  const skorAkhir = (() => {
    const items = ordered
      .map((d) => {
        const a = byDept.get(d.id);
        return a && a.ai_skor !== null && bobotMap.get(d.id)
          ? { skor: a.ai_skor, bobot: bobotMap.get(d.id) ?? 0 }
          : null;
      })
      .filter((x): x is { skor: number; bobot: number } => x !== null);
    if (items.length === 0) return null;
    const total = items.reduce((a, x) => a + x.bobot, 0) || 100;
    return Math.round(items.reduce((a, x) => a + x.skor * x.bobot, 0) / total);
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
        <div>
          <p className="text-xs font-bold text-slate-900">
            Penilaian Departemen Berbobot
          </p>
          <p className="text-[11px] text-slate-500">
            AI mengusulkan → departemen menilai dengan bahasa → AI memberi skor
            0–100 → digabung sesuai bobot.
          </p>
        </div>
        {skorAkhir !== null && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Skor Akhir
            </span>
            <span
              className={cn(
                "font-display text-3xl font-bold",
                skorColor(skorAkhir)
              )}
            >
              {skorAkhir}
            </span>
            <span className="text-xs font-semibold text-slate-400">/ 100</span>
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {ordered.map((dept) => {
          const bobot = bobotMap.get(dept.id) ?? 0;
          const a = byDept.get(dept.id);
          const write = canWrite(dept);
          const draft = draftFor(dept.id);
          return (
            <div
              key={dept.id}
              className="flex flex-col rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between rounded-t-xl border-b bg-slate-50/60 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{dept.nama}</p>
                  <p className="text-[11px] text-slate-500">
                    Bobot penilaian: <b>{bobot}%</b>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge className={STATUS_BADGE[a?.status ?? "belum"].cls}>
                    {STATUS_BADGE[a?.status ?? "belum"].label}
                  </Badge>
                  {a?.ai_skor !== null && a?.ai_skor !== undefined && (
                    <span
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 font-display text-xs font-bold",
                        skorColor(a.ai_skor),
                        "border-current"
                      )}
                    >
                      {a.ai_skor}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Usulan AI (draft penilaian)
                    </label>
                    {write && (
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => propose(dept)}
                        disabled={busy[dept.id] === "propose"}
                        className="h-7 px-2 text-[11px]"
                      >
                        {busy[dept.id] === "propose" ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <Sparkles className="h-3 w-3" />
                        )}
                        Usulan AI
                      </Button>
                    )}
                  </div>
                  <textarea
                    value={draft.proposal}
                    onChange={(e) =>
                      setDraft(dept.id, {
                        proposal: e.target.value,
                        penilaian: draft.penilaian,
                      })
                    }
                    rows={4}
                    disabled={!write}
                    placeholder={
                      write
                        ? "Klik 'Usulan AI' untuk draft otomatis dari dokumen penawaran…"
                        : "Belum ada usulan AI."
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-5 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">
                    Penilaian Departemen (bahasa manusia)
                  </label>
                  <textarea
                    value={draft.penilaian}
                    onChange={(e) =>
                      setDraft(dept.id, {
                        proposal: draft.proposal,
                        penilaian: e.target.value,
                      })
                    }
                    rows={4}
                    disabled={!write}
                    placeholder={
                      write
                        ? "Tulis penilaian Anda dengan bahasa bebas: kelebihan, kekurangan, catatan…"
                        : "Belum ada penilaian."
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs leading-5 text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 disabled:bg-slate-50 disabled:text-slate-400"
                  />
                </div>

                {a?.ai_ringkasan && (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-5 text-emerald-800">
                    {a.ai_ringkasan}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-2 pt-1">
                  {write && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => savePenilaian(dept)}
                        disabled={busy[dept.id] === "save"}
                        className="h-8 flex-1 text-[11px]"
                      >
                        {busy[dept.id] === "save" ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                        Simpan Penilaian
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => score(dept)}
                        disabled={busy[dept.id] === "score"}
                        className="h-8 flex-1 text-[11px]"
                      >
                        {busy[dept.id] === "score" ? (
                          <Spinner className="h-3 w-3" />
                        ) : (
                          <Gauge className="h-3 w-3" />
                        )}
                        Analisis AI → Skor
                      </Button>
                    </>
                  )}
                  {flash[dept.id] && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Tersimpan
                    </span>
                  )}
                  {!write && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <MessageSquareText className="h-3 w-3" /> Read-only
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}