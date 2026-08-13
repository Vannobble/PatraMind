"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "@/components/workspace/workspace-provider";

export function AiToggle() {
  const { aiOpen, setAiOpen } = useWorkspace();
  return (
    <button
      onClick={() => setAiOpen(!aiOpen)}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        aiOpen
          ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
          : "border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200"
      }`}
    >
      {aiOpen ? "Sembunyikan Asisten AI" : "Buka Asisten AI"}
    </button>
  );
}

export function BackToDashboard() {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-brand-200 transition hover:bg-white/10 hover:text-white"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> Dashboard
    </Link>
  );
}
