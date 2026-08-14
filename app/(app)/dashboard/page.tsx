import Link from "next/link";
import {
  FolderKanban,
  FileText,
  Scale,
  CircleAlert,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import type { ReactNode } from "react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CreateTenderDialog } from "@/components/dashboard/create-tender-dialog";
import { TENDER_STATUS_LABELS } from "@/lib/constants";
import { formatTanggal, waktuRelatif } from "@/lib/utils";
import type { Evaluation, Tender } from "@/types";

export const dynamic = "force-dynamic";

const JENIS_BADGE: Record<string, string> = {
  rks_tor: "bg-brand-50 text-brand-700 border-brand-200",
  penawaran: "bg-sky-50 text-sky-700 border-sky-200",
  lainnya: "bg-slate-100 text-slate-600 border-slate-200",
};
const JENIS_LABEL: Record<string, string> = {
  rks_tor: "RKS/TOR",
  penawaran: "Penawaran",
  lainnya: "Lainnya",
};

export default async function DashboardPage() {
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  let tenders: Tender[] = [];
  let evalsByTender: Record<string, Evaluation[]> = {};
  let recentDocs: {
    id: string;
    tender_id: string;
    jenis: string;
    nama_file: string;
    created_at?: string;
  }[] = [];
  let totalDokumen = 0;
  let dokumenMingguIni = 0;
  let bas: { id: string; tender_id: string; created_at?: string }[] = [];
  let dbError: string | null = null;

  try {
    const seminggu = new Date(Date.now() - 7 * 86400000).toISOString();

    const [
      { data: tData },
      { data: evals },
      { data: dData },
      { data: baData },
      { count: docCount },
      { count: docWeekCount },
    ] = await Promise.all([
      supabaseClient()
        .from("tenders")
        .select("id, nama_pekerjaan, nomor_pr, klien, nilai_kontrak, deadline, pic, status, created_at")
        .order("created_at", { ascending: false }),
      supabaseClient()
        .from("evaluations")
        .select("id, tender_id, vendor_name, status, created_at")
        .order("created_at", { ascending: false })
        .limit(200),
      supabaseClient()
        .from("documents")
        .select("id, tender_id, jenis, nama_file, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseClient()
        .from("berita_acara")
        .select("id, tender_id, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseClient()
        .from("documents")
        .select("id", { count: "exact", head: true }),
      supabaseClient()
        .from("documents")
        .select("id", { count: "exact", head: true })
        .gte("created_at", seminggu),
    ]);

    tenders = (tData ?? []) as Tender[];
    evalsByTender = ((evals ?? []) as Evaluation[]).reduce<
      Record<string, Evaluation[]>
    >((acc, e) => {
      (acc[e.tender_id] ??= []).push(e);
      return acc;
    }, {});
    recentDocs = (dData ?? []) as typeof recentDocs;
    bas = (baData ?? []) as typeof bas;
    totalDokumen = docCount ?? 0;
    dokumenMingguIni = docWeekCount ?? 0;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database tidak terhubung";
  }

  const namaTender = (id: string) =>
    tenders.find((t) => t.id === id)?.nama_pekerjaan ?? "tender";

  const semuaEvals = Object.values(evalsByTender).flat();
  const tenderBerjalan = tenders.filter((t) =>
    ["proses", "evaluasi"].includes(t.status)
  ).length;
  const tenderDraft = tenders.filter((t) => t.status === "draft").length;
  const evaluasiSelesai = semuaEvals.filter(
    (e) => e.status === "final"
  ).length;

  const nearDeadline = tenders
    .filter((t) => !["diterima", "ditolak"].includes(t.status))
    .filter((t) => t.deadline)
    .sort(
      (a, b) =>
        new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime()
    )
    .slice(0, 4);

  type Activity = {
    key: string;
    time?: string;
    dot: string;
    node: ReactNode;
  };

  const activities: Activity[] = [
    ...tenders.map((t) => ({
      key: `t-${t.id}`,
      time: t.created_at,
      dot: "bg-sky-500",
      node: (
        <>
          Tender <b>{t.nama_pekerjaan}</b> ditambahkan
        </>
      ),
    })),
    ...recentDocs.map((d) => ({
      key: `d-${d.id}`,
      time: d.created_at,
      dot: "bg-gold-500",
      node: (
        <>
          Dokumen <b>{d.nama_file}</b> ditambahkan ke{" "}
          <b>{namaTender(d.tender_id)}</b>
        </>
      ),
    })),
    ...semuaEvals.map((e) => ({
      key: `e-${e.id}`,
      time: e.created_at,
      dot: "bg-amber-500",
      node: (
        <>
          Evaluasi <b>{e.vendor_name}</b> dimulai di{" "}
          <b>{namaTender(e.tender_id)}</b>
        </>
      ),
    })),
    ...bas.map((b) => ({
      key: `b-${b.id}`,
      time: b.created_at,
      dot: "bg-gold-500",
      node: (
        <>
          Berita Acara dibuat untuk <b>{namaTender(b.tender_id)}</b>
        </>
      ),
    })),
  ]
    .filter((a) => a.time)
    .sort(
      (a, b) =>
        new Date(b.time ?? 0).getTime() - new Date(a.time ?? 0).getTime()
    )
    .slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-brand-950">
            Ringkasan Pengadaan
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pantau seluruh project, dokumen, dan evaluasi dalam satu layar.
          </p>
        </div>
        {["panitia", "admin"].includes(profile?.role ?? "") && (
          <CreateTenderDialog />
        )}
      </div>

      {dbError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Database belum siap</p>
            <p className="mt-0.5 text-xs leading-5">
              {dbError}. Jalankan <b>npm run db:setup</b> (atau tempel{" "}
              <b>supabase/schema.sql</b> di SQL Editor) lalu <b>npm run seed</b>.
            </p>
          </div>
        </div>
      )}

      {!dbError && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <FileText className="h-4 w-4" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-brand-950">
                {totalDokumen}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Total Dokumen Terkelola
              </p>
              <p
                className={`mt-1 text-[11px] font-medium ${
                  dokumenMingguIni > 0 ? "text-gold-600" : "text-slate-400"
                }`}
              >
                {dokumenMingguIni > 0
                  ? `+${dokumenMingguIni} dokumen minggu ini`
                  : "Belum ada tambahan minggu ini"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                <FolderKanban className="h-4 w-4" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-brand-950">
                {tenderBerjalan}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Tender Sedang Berjalan
              </p>
              <p className="mt-1 text-[11px] font-medium text-slate-400">
                {tenderDraft > 0
                  ? `${tenderDraft} draft menunggu proses`
                  : "Semua tender aktif diproses"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-100 text-gold-600">
                <Scale className="h-4 w-4" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-brand-950">
                {semuaEvals.length}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Evaluasi Vendor
              </p>
              <p
                className={`mt-1 text-[11px] font-medium ${
                  evaluasiSelesai > 0 ? "text-gold-600" : "text-slate-400"
                }`}
              >
                {evaluasiSelesai > 0
                  ? `${evaluasiSelesai} selesai dinilai`
                  : "Belum ada evaluasi final"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                <CircleAlert className="h-4 w-4" />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-brand-950">
                {tenderDraft}
              </p>
              <p className="text-xs font-semibold text-slate-600">
                Tender Draft
              </p>
              <p className="mt-1 text-[11px] font-medium text-red-600">
                {tenderDraft > 0
                  ? "Segera tindak lanjuti"
                  : "Tidak ada yang menunggu"}
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-brand-950">
                  Aktivitas Terbaru
                </h3>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {activities.length}
                </span>
              </div>
              {activities.length > 0 ? (
                <div className="space-y-3.5">
                  {activities.map((a) => (
                    <div className="flex items-start gap-3" key={a.key}>
                      <span
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${a.dot}`}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs leading-5 text-slate-700">
                          {a.node}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {waktuRelatif(a.time)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Belum ada aktivitas.</p>
              )}
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-brand-950">
                  Tender Mendekati Deadline
                </h3>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                  {nearDeadline.length}
                </span>
              </div>
              {nearDeadline.length > 0 ? (
                <div className="space-y-3">
                  {nearDeadline.map((t) => {
                    const st =
                      TENDER_STATUS_LABELS[t.status] ??
                      TENDER_STATUS_LABELS.draft;
                    return (
                      <Link
                        key={t.id}
                        href={`/prebid/${t.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50/60 p-3 transition hover:border-gold-400 hover:bg-gold-100/40"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold leading-5 text-slate-800">
                            {t.nama_pekerjaan}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                            {t.nomor_pr || "-"}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[11px] font-bold text-brand-800">
                            {formatTanggal(t.deadline ?? undefined)}
                          </p>
                          <Badge className={st.cls}>{st.label}</Badge>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  Belum ada tender dengan deadline.
                </p>
              )}
            </Card>

            <Card className="p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-brand-950">
                  Dokumen Terbaru
                </h3>
                <Link
                  href="/dokumen"
                  className="flex items-center gap-1 text-xs font-semibold text-gold-600 hover:text-gold-500"
                >
                  Buka Smart-Dokumen <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {recentDocs.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentDocs.slice(0, 6).map((d) => (
                    <Link
                      key={d.id}
                      href={`/dokumen/${d.id}`}
                      className="rounded-lg border border-slate-100 bg-white p-3 transition hover:border-gold-400 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="line-clamp-2 text-xs font-semibold leading-5 text-slate-800">
                          {d.nama_file}
                        </p>
                        <Badge
                          className={
                            JENIS_BADGE[d.jenis] ?? JENIS_BADGE.lainnya
                          }
                        >
                          {JENIS_LABEL[d.jenis] ?? "Lainnya"}
                        </Badge>
                      </div>
                      <p className="mt-1.5 truncate text-[10px] text-slate-400">
                        {namaTender(d.tender_id)} · {waktuRelatif(d.created_at)}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Belum ada dokumen.</p>
              )}
            </Card>
          </div>
        </>
      )}

      {!dbError && tenders.length === 0 && (
        <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
            <FolderKanban className="h-7 w-7" />
          </span>
          <p className="text-sm font-semibold text-slate-700">
            Belum ada tender
          </p>
          <p className="max-w-sm text-xs leading-5 text-slate-500">
            Jalankan <b>npm run seed</b> untuk memuat tender contoh, atau buat
            tender baru lewat tombol di kanan atas (role Panitia).
          </p>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {tenders.map((t) => {
          const st =
            TENDER_STATUS_LABELS[t.status] ?? TENDER_STATUS_LABELS.draft;
          const evals = evalsByTender[t.id] ?? [];
          return (
            <Link
              key={t.id}
              href={`/prebid/${t.id}`}
              className="group"
            >
              <Card className="p-5 transition group-hover:border-gold-400 group-hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    <FolderKanban className="h-5 w-5" />
                  </div>
                  <Badge className={st.cls}>{st.label}</Badge>
                </div>
                <h3 className="mt-3 text-sm font-bold leading-6 text-slate-900 group-hover:text-brand-800">
                  {t.nama_pekerjaan}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  <span className="font-mono text-[11px] font-medium text-brand-700">
                    {t.nomor_pr || "No. PR -"}
                  </span>{" "}
                  · dibuat {formatTanggal(t.created_at)}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-[11px] font-medium text-slate-400">
                    {evals.length > 0
                      ? `${evals.length} vendor dalam evaluasi`
                      : "Belum ada evaluasi"}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-gold-600">
                    Buka PreBid
                    <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}