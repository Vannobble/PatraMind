import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { AppShell } from "@/components/shell/app-shell";
import { WorkspaceProvider } from "@/components/workspace/workspace-provider";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let userId: string | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    // env belum diatur
  }
  if (!userId) redirect("/login");

  const profile = await getProfile(userId);
  if (!profile) redirect("/login");

  return (
    <WorkspaceProvider>
      <AppShell profile={profile}>{children}</AppShell>
    </WorkspaceProvider>
  );
}