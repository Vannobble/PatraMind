"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Gauge,
  Lock,
  MessageSquareText,
  Save,
  SendHorizonal,
  Sparkles,
  User,
  CheckCircle2,
  PenLine,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { ROLE_DEPT_MAP, ROLE_LABELS } from "@/lib/constants";
import type {
  AssessmentChatMessage,
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
  diskor: { label: "Diskor", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  submitted: { label: "Submitted", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
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
  const [drafts, setDrafts] = useState<
    Record<string, { proposal: string; penilaian: string }>
  >({});
  const [flash, setFlash] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<
    Record<string, AssessmentChatMessage[]>
  >({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<Record<string, boolean>>({});

  const bobotMap = new Map(
    tenderDepartments.map((td) => [td.department_id, td.bobot])
  );
  const ordered = [...departments].sort(
    (a, b) => (bobotMap.get(b.id) ?? 0) - (bobotMap.get(a.id) ?? 0)
  );

  const byDept = new Map(
    assessments.map((a) => [a.department_id, a] as const)
  );

  const isReviewer = role === "otorisator";
  const isAdmin = role === "admin";
  const ownDeptName = ROLE_DEPT_MAP[role];

  const visible = isReviewer || isAdmin ? ordered : ordered.filter((d) => d.nama === ownDeptName);
  const writable = isAdmin ? visible : isReviewer ? [] : visible;

  useEffect(() => {
    for (const dept of writable) {
      fetch(
        `/api/assessments?evaluationId=${evaluation.id}&departmentId=${dept.id}`
      )
        .then((r) => r.json())
        .then((j) => {
          if (j.messages)
            setMessages((prev) => ({ ...prev, [dept.id]: j.messages }));
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluation.id]);

  function draftFor(deptId: string) {
    return (
      drafts[deptId] ?? {
        proposal: byDept.get(deptId)?.ai_proposal ?? "",
        penilaian: byDept.get(deptId)?.penilaian_teks ?? "",
      }
    );
  }

  function setDraft(
    deptId: string,
    patch: Partial<{ proposal: string; penilaian: string }>
  ) {
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

  async function sendChat(dept: Department) {
    const text = (inputs[dept.id] ?? "").trim();
    if (!text || sending[dept.id]) return;
    setSending((s) => ({ ...s, [dept.id]: true }));
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "chat",
          evaluationId: evaluation.id,
          departmentId: dept.id,
          departmentName: dept.nama,
          message: text,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal menjawab");
      setInputs((prev) => ({ ...prev, [dept.id]: "" }));
      setMessages((prev) => ({ ...prev, [dept.id]: json.messages }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setSending((s) => ({ ...s, [dept.id]: false }));
    }
  }

  async function rangkum(dept: Department) {
    setBusy((b) => ({ ...b, [dept.id]: "rangkum" }));
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "rangkum",
          evaluationId: evaluation.id,
          departmentId: dept.id,
          departmentName: dept.nama,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal merangkum");
      setDraft(dept.id, { proposal: draftFor(dept.id).proposal, penilaian: json.penilaian });
      patchAssessment(dept.id, { penilaian_teks: json.penilaian });
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

  async function submit(dept: Department) {
    setBusy((b) => ({ ...b, [dept.id]: "submit" }));
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          evaluationId: evaluation.id,
          departmentId: dept.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal submit");
      patchAssessment(dept.id, { status: "submitted" });
      setFlash((f) => ({ ...f, [dept.id]: true }));
      setTimeout(() => setFlash((f) => ({ ...f, [dept.id]: false })), 1600);
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

  async function reopen(dept: Department) {
    setBusy((b) => ({ ...b, [dept.id]: "reopen" }));
    setError(null);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reopen",
          evaluationId: evaluation.id,
          departmentId: dept.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuka kembali");
      patchAssessment(dept.id, { status: "diskor" });
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

  const submittedCount = ordered.filter(
    (d) => byDept.get(d.id)?.status === "submitted"
  ).length;

  if (visible.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">
          Tidak ada ruang penilaian untuk peran Anda
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Peran <b>{ROLE_LABELS[role]}</b> tidak terpetakan ke departemen pada
          tender ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {(isAdmin || isReviewer) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white px-5 py-4">
          <div>
            <p className="text-xs font-bold text-slate-900">
              Penilaian Departemen Berbobot
            </p>
            <p className="text-[11px] text-slate-500">
              {isReviewer
                ? "Tinjau penilaian seluruh divisi. Generate Summary aktif setelah semua divisi submit."
                : "Tanya-jawab → AI rangkum → skor → submit. Anda dapat mengisi atas nama semua divisi."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] font-bold text-slate-500">
              {submittedCount}/{ordered.length} divisi submit
            </span>
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
                <span className="text-xs font-semibold text-slate-400">
                  / 100
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}

      {!isReviewer && visible.length === 1 && writable.length === 1 && (
        <p className="rounded-lg bg-purple-50 px-4 py-2.5 text-[11px] leading-5 text-purple-800">
          Ruang <b>{visible[0].nama}</b> — tanya-jawab dengan AI tentang
          dokumen vendor terlebih dahulu, lalu klik <b>Rangkum Penilaian</b>,
          <b> Simpan Penilaian</b>, <b>Analisis AI → Skor</b>, dan{" "}
          <b>Submit</b> setelah selesai.
        </p>
      )}

      <div
        className={cn(
          "grid gap-4",
          visible.length > 1 && "lg:grid-cols-2 2xl:grid-cols-3"
        )}
      >
        {visible.map((dept) => {
          const bobot = bobotMap.get(dept.id) ?? 0;
          const a = byDept.get(dept.id);
          const locked = a?.status === "submitted";
          const write = writable.some((d) => d.id === dept.id) && !locked;
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

              {isReviewer ? (
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Penilaian departemen
                    </label>
                    <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs leading-5 text-slate-700">
                      {a?.penilaian_teks?.trim() || "(belum ada penilaian)"}
                    </div>
                  </div>
                  {a?.ai_ringkasan && (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-[11px] leading-5 text-emerald-800">
                      {a.ai_ringkasan}
                    </p>
                  )}
                  {a?.ai_skor !== null && a?.ai_skor !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Skor
                      </span>
                      <span
                        className={cn(
                          "font-display text-2xl font-bold",
                          skorColor(a.ai_skor)
                        )}
                      >
                        {a.ai_skor}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">
                        / 100
                      </span>
                    </div>
                  )}
                  <span className="mt-auto flex items-center gap-1 text-[11px] text-slate-400">
                    <MessageSquareText className="h-3 w-3" /> Read-only — review
                    otorisator
                  </span>
                </div>
              ) : (
                <div className="flex flex-1 flex-col gap-3 p-4">
                  {locked && (
                    <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                        <Lock className="h-3 w-3" /> Penilaian disubmit —
                        terkunci
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => reopen(dept)}
                          disabled={busy[dept.id] === "reopen"}
                          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold text-brand-700 transition hover:bg-brand-50"
                        >
                          {busy[dept.id] === "reopen" ? (
                            <Spinner className="h-3 w-3" />
                          ) : (
                            <RotateCcw className="h-3 w-3" />
                          )}
                          Buka Kembali
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <MessageSquareText className="h-3 w-3" /> Tanya-jawab
                      dengan AI (jawaban dari dokumen vendor)
                    </label>
                    <div className="h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/50 p-2.5">
                      {(messages[dept.id] ?? []).length === 0 && (
                        <p className="px-1 text-[11px] leading-5 text-slate-400">
                          Belum ada percakapan. Tanyakan, misalnya: &quot;Apakah
                          penawaran ini memenuhi spesifikasi di RKS?&quot;,
                          &quot;Bagaimana kelengkapan dokumen legalnya?&quot;,
                          atau &quot;Apa ketentuan K3 yang harus dipenuhi?&quot;
                        </p>
                      )}
                      {(messages[dept.id] ?? []).map((m) => (
                        <div
                          key={m.id}
                          className={
                            m.role === "user"
                              ? "flex justify-end"
                              : "flex justify-start"
                          }
                        >
                          <div
                            className={
                              m.role === "user"
                                ? "max-w-[85%] rounded-2xl rounded-br-md bg-brand-800 px-3 py-2 text-[11px] leading-4 text-white"
                                : "max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-[11px] leading-4 text-slate-700"
                            }
                          >
                            <div className="mb-1 flex items-center gap-1">
                              {m.role === "user" ? (
                                <User className="h-2.5 w-2.5 opacity-70" />
                              ) : (
                                <Bot className="h-2.5 w-2.5 text-brand-700" />
                              )}
                              <span className="text-[9px] font-bold uppercase tracking-wide opacity-70">
                                {m.role === "user" ? "Anda" : "AI"}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap [text-align:start]">
                              {m.content}
                            </p>
                          </div>
                        </div>
                      ))}
                      {sending[dept.id] && (
                        <p className="flex items-center gap-1.5 px-1 text-[11px] text-slate-400">
                          <Spinner className="h-3 w-3" /> AI sedang menjawab…
                        </p>
                      )}
                    </div>
                    {write ? (
                      <form
                        className="flex items-center gap-1.5"
                        onSubmit={(e) => {
                          e.preventDefault();
                          void sendChat(dept);
                        }}
                      >
                        <input
                          value={inputs[dept.id] ?? ""}
                          onChange={(e) =>
                            setInputs((prev) => ({
                              ...prev,
                              [dept.id]: e.target.value,
                            }))
                          }
                          placeholder="Tanya AI tentang penawaran vendor…"
                          className="h-8 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
                        />
                        <Button
                          type="submit"
                          size="icon"
                          variant="primary"
                          disabled={sending[dept.id] || !(inputs[dept.id] ?? "").trim()}
                          className="h-8 w-8"
                        >
                          <SendHorizonal className="h-3.5 w-3.5" />
                        </Button>
                      </form>
                    ) : (
                      <p className="text-[10px] text-slate-400">
                        Percakapan hanya dapat dilakukan oleh departemen pemilik
                        ruang.
                      </p>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant="subtle"
                    onClick={() => rangkum(dept)}
                    disabled={!write || busy[dept.id] === "rangkum"}
                    className="h-8 w-full text-[11px]"
                  >
                    {busy[dept.id] === "rangkum" ? (
                      <Spinner className="h-3 w-3" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Rangkum Penilaian (dari percakapan)
                  </Button>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">
                      Penilaian Departemen
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
                          ? "Hasil rangkum AI akan tampil di sini — Anda dapat mengeditnya…"
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

                  <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => savePenilaian(dept)}
                      disabled={!write || busy[dept.id] === "save"}
                      className="h-8 text-[11px]"
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
                      disabled={!write || busy[dept.id] === "score"}
                      className="h-8 text-[11px]"
                    >
                      {busy[dept.id] === "score" ? (
                        <Spinner className="h-3 w-3" />
                      ) : (
                        <Gauge className="h-3 w-3" />
                      )}
                      Analisis AI → Skor
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => submit(dept)}
                      disabled={
                        !write || busy[dept.id] === "submit" || a?.status !== "diskor"
                      }
                      className="col-span-2 h-8 text-[11px]"
                    >
                      {busy[dept.id] === "submit" ? (
                        <Spinner className="h-3 w-3" />
                      ) : (
                        <CheckCircle2 className="h-3 w-3" />
                      )}
                      {a?.status === "submitted" ? "Sudah Disubmit" : "Submit Penilaian"}
                    </Button>
                  </div>
                  {flash[dept.id] && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" /> Tersimpan
                    </span>
                  )}
                  {!writable.some((d) => d.id === dept.id) && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <PenLine className="h-3 w-3" /> Read-only
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}