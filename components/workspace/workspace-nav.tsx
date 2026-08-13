"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FilePenLine, LayoutGrid, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  {
    href: "/pre-bid",
    label: "Pre-Bid & BA",
    desc: "D5",
    icon: FilePenLine,
  },
  {
    href: "/evaluation",
    label: "Evaluation",
    desc: "D6",
    icon: LayoutGrid,
  },
  {
    href: "/dokumen",
    label: "Dokumen",
    desc: "D8",
    icon: FolderOpen,
  },
];

export function WorkspaceNav({ tenderId }: { tenderId: string }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {NAV.map((n) => {
        const href = `/tender/${tenderId}${n.href}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={n.href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition",
              active
                ? "bg-brand-800 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            <n.icon className={cn("h-4 w-4", active ? "text-amber-300" : "text-slate-400")} />
            <span className="flex-1">{n.label}</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[9px] font-bold",
                active ? "bg-white/15 text-brand-100" : "bg-slate-100 text-slate-400"
              )}
            >
              {n.desc}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
