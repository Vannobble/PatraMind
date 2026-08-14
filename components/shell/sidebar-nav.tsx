"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    label: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard Utama", icon: LayoutDashboard },
    ],
  },
  {
    label: "Operasional",
    items: [
      { href: "/prebid", label: "PreBidManagement", icon: ClipboardList },
      { href: "/dokumen", label: "Smart-Dokumen", icon: FolderOpen },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3">
      {NAV_GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-brand-300">
            {g.label}
          </p>
          <div className="space-y-0.5">
            {g.items.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
                    active
                      ? "bg-brand-800 text-white shadow-sm"
                      : "text-brand-100 hover:bg-white/5 hover:text-white"
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-gold-400" />
                  )}
                  <item.icon
                    className={cn(
                      "h-4 w-4",
                      active ? "text-gold-300" : "text-brand-300"
                    )}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}