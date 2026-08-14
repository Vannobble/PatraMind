"use client";

import { usePathname } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import { SidebarNav } from "@/components/shell/sidebar-nav";
import { ROLE_LABELS } from "@/lib/constants";
import type { Profile } from "@/types";

const TITLES: Record<string, { eyebrow: string; title: string }> = {
  "/dashboard": { eyebrow: "Procurement Command Center", title: "Dashboard Utama" },
  "/prebid": { eyebrow: "Manajemen Pengadaan", title: "PreBidManagement" },
  "/dokumen": { eyebrow: "Arsip Dokumen", title: "Smart-Dokumen" },
};

function topTitle(pathname: string) {
  if (pathname.startsWith("/dokumen/")) {
    return { eyebrow: "Smart-Dokumen", title: "Dokumen" };
  }
  if (pathname.startsWith("/prebid/")) {
    return { eyebrow: "PreBidManagement", title: "Detail PreBid" };
  }
  return TITLES[pathname] ?? { eyebrow: "PATRAMIND", title: "Workspace" };
}

function TopbarTitle() {
  const pathname = usePathname();
  const t = topTitle(pathname);
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-bold uppercase tracking-wider text-gold-500">
        {t.eyebrow}
      </p>
      <h1 className="truncate font-display text-lg font-bold text-brand-950">
        {t.title}
      </h1>
    </div>
  );
}

export function AppShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-[240px] shrink-0 flex-col bg-gradient-to-b from-brand-950 via-brand-900 to-brand-950">
          <div className="px-4 pb-5 pt-4">
            <Logo dark size="sm" />
          </div>
          <SidebarNav />
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2.5 rounded-xl bg-white/5 p-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500 text-xs font-bold text-brand-950">
                {(profile.full_name || "U").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white">
                  {profile.full_name}
                </p>
                <p className="truncate text-[10px] text-brand-200">
                  {ROLE_LABELS[profile.role]}
                </p>
              </div>
              <LogoutButton className="text-brand-200 hover:bg-white/10 hover:text-white" />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
            <TopbarTitle />
            <Badge className="bg-brand-50 text-brand-700 border-brand-200">
              {ROLE_LABELS[profile.role]}
            </Badge>
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto bg-[--background]">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}