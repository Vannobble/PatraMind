import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { ContextSidebar } from "@/components/workspace/context-sidebar";
import { AIAssistantPanel } from "@/components/workspace/ai-assistant-panel";
import { WorkspaceProvider } from "@/components/workspace/workspace-provider";
import { AiToggle, BackToDashboard } from "@/components/workspace/topbar-actions";
import { RoleSwitcher } from "@/components/auth/role-switcher";
import { LogoutButton } from "@/components/auth/logout-button";
import { ROLE_LABELS, TENDER_STATUS_LABELS } from "@/lib/constants";
import type { DocumentRow, Profile, Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function TenderLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let profile: Profile | null = null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    profile = await getProfile(user.id);
  } catch {
    redirect("/login");
  }

  const [{ data: tender }, { data: docs }] = await Promise.all([
    supabaseClient().from("tenders").select("*").eq("id", id).maybeSingle(),
    supabaseClient()
      .from("documents")
      .select("id, tender_id, jenis, nama_file, konten_text, created_at")
      .eq("tender_id", id)
      .order("created_at"),
  ]);

  if (!tender) notFound();
  const t = tender as Tender;
  const st = TENDER_STATUS_LABELS[t.status] ?? TENDER_STATUS_LABELS.draft;

  return (
    <WorkspaceProvider>
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-brand-900 px-4 shadow-md">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard">
              <Logo dark size="sm" />
            </Link>
            <span className="hidden h-6 w-px bg-white/15 sm:block" />
            <BackToDashboard />
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-xs font-bold text-white">
                {t.nama_pekerjaan}
              </p>
              <p className="text-[10px] text-brand-300">
                No. PR {t.nomor_pr || "-"}
              </p>
            </div>
            <Badge className={`${st.cls} hidden sm:inline-flex`}>
              {st.label}
            </Badge>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {profile && (
              <span className="hidden text-right lg:block">
                <p className="text-[11px] font-semibold text-white">
                  {profile.full_name}
                </p>
                <p className="text-[10px] text-brand-200">
                  {ROLE_LABELS[profile.role]}
                </p>
              </span>
            )}
            <AiToggle />
            {profile && <RoleSwitcher currentRole={profile.role} />}
            <LogoutButton className="text-brand-100 hover:bg-white/10 hover:text-white" />
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <ContextSidebar tender={t} docs={(docs ?? []) as DocumentRow[]} />
          <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
            {children}
          </main>
          <AIAssistantPanel
            tenderId={id}
            aiMode={process.env.OPENAI_API_KEY ? "openai" : "local"}
          />
        </div>
      </div>
    </WorkspaceProvider>
  );
}
