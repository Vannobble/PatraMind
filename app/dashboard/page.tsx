import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  FolderKanban,
  FileText,
  Scale,
  CircleAlert,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, supabaseClient } from "@/lib/supabase/auth";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { LogoutButton } from "@/components/auth/logout-button";
import { CreateTenderDialog } from "@/components/dashboard/create-tender-dialog";
import { ROLE_LABELS, TENDER_STATUS_LABELS } from "@/lib/constants";
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
  let user: { id: string; email?: string } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // env belum diatur
  }
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);

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
        .select("id, nama_pekerjaan, nomor_pr, status, created_at")
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
    ["aanwijzing", "evaluasi"].includes(t.status)
  ).length;
  const tenderDraft = tenders.filter((t) => t.status === "draft").length;
  const evaluasiSelesai = semuaEvals.filter(
    (e) => e.status === "final"
  ).length;

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
      dot: "bg-emerald-500",
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
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between bg-brand-950 px-6 shadow-md">
        <Link href="/dashboard">
          <Logo dark />
        </Link>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-white">
                {profile.full_name}
              </p>
              <p className="text-[11px] text-brand-200">
                {ROLE_LABELS[profile.role]}
              </p>
            </div>
          )}
          {profile && <RoleSwitcher currentRole={profile.role} />}
          <LogoutButton className="text-brand-100 hover:bg-white/10 hover:text-white" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-gold-500">
              Procurement Command Center
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-brand-950">
              Daftar Tender
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Kelola project pengadaan Anda — pilih tender untuk membuka
              workspace.
            </p>
          </div>
          {profile?.role === "panitia" && <CreateTenderDialog />}
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
                    dokumenMingguIni > 0 ? "text-emerald-600" : "text-slate-400"
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
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
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
                    evaluasiSelesai > 0
                      ? "text-emerald-600"
                      : "text-slate-400"
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
                  <p className="text-xs text-slate-400">
                    Belum ada aktivitas.
                  </p>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-sm font-bold text-brand-950">
                    Dokumen Terbaru
                  </h3>
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                    {recentDocs.length}
                  </span>
                </div>
                {recentDocs.length > 0 ? (
                  <div className="space-y-3">
                    {recentDocs.slice(0, 5).map((d) => (
                      <div
                        className="flex items-start justify-between gap-3"
                        key={d.id}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold leading-5 text-slate-800">
                            {d.nama_file}
                          </p>
                          <p className="truncate text-[10px] text-slate-400">
                            {namaTender(d.tender_id)} · {waktuRelatif(d.created_at)}
                          </p>
                        </div>
                        <Badge
                          className={
                            JENIS_BADGE[d.jenis] ?? JENIS_BADGE.lainnya
                          }
                        >
                          {JENIS_LABEL[d.jenis] ?? "Lainnya"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Belum ada dokumen.
                  </p>
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
            const st = TENDER_STATUS_LABELS[t.status] ?? TENDER_STATUS_LABELS.draft;
            const evals = evalsByTender[t.id] ?? [];
            return (
              <Link key={t.id} href={`/tender/${t.id}/pre-bid`} className="group">
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
                      Buka Workspace
                      <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
