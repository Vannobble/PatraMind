import { redirect } from "next/navigation";
import Link from "next/link";
import { FolderKanban, ArrowRight, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getProfile, supabaseClient } from "@/lib/supabase/auth";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { LogoutButton } from "@/components/auth/logout-button";
import { CreateTenderDialog } from "@/components/dashboard/create-tender-dialog";
import { ROLE_LABELS, TENDER_STATUS_LABELS } from "@/lib/constants";
import { formatTanggal } from "@/lib/utils";
import type { Evaluation, Tender } from "@/types";

export const dynamic = "force-dynamic";

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
  let dbError: string | null = null;

  try {
    const { data } = await supabaseClient()
      .from("tenders")
      .select("id, nama_pekerjaan, nomor_pr, status, created_at")
      .order("created_at", { ascending: false });
    tenders = (data ?? []) as Tender[];

    const { data: evals } = await supabaseClient()
      .from("evaluations")
      .select("id, tender_id, vendor_name, status");
    evalsByTender = ((evals ?? []) as Evaluation[]).reduce<
      Record<string, Evaluation[]>
    >((acc, e) => {
      (acc[e.tender_id] ??= []).push(e);
      return acc;
    }, {});
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Database tidak terhubung";
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center justify-between bg-brand-900 px-6 shadow-md">
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
            <h1 className="text-2xl font-extrabold tracking-tight text-brand-900">
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
                <Card className="p-5 transition group-hover:border-brand-300 group-hover:shadow-md">
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
                    No. PR {t.nomor_pr || "-"} · dibuat {formatTanggal(t.created_at)}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-medium text-slate-400">
                      {evals.length > 0
                        ? `${evals.length} vendor dalam evaluasi`
                        : "Belum ada evaluasi"}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-brand-700">
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
