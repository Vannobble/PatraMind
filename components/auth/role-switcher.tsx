"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_ACCOUNTS, ROLE_LABELS } from "@/lib/constants";
import type { Role } from "@/types";

export function RoleSwitcher({ currentRole }: { currentRole: Role }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function switchRole(role: Role) {
    const acc = DEMO_ACCOUNTS.find((a) => a.role === role);
    if (!acc || acc.role === currentRole) return;
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });
      if (!error) {
        router.push("/dashboard");
        router.refresh();
      }
    } finally {
      setBusy(false);
      setOpen(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
      >
        {busy ? (
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <>
            <span>Demo: {ROLE_LABELS[currentRole]}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Ganti peran (mode demo)
            </p>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.role}
                onClick={() => switchRole(acc.role)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition hover:bg-slate-50 ${
                  acc.role === currentRole ? "text-brand-700" : "text-slate-700"
                }`}
              >
                <span className="font-semibold">{ROLE_LABELS[acc.role]}</span>
                {acc.role === currentRole && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                    aktif
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
