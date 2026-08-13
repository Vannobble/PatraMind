"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  FileText,
  GitMerge,
  MessagesSquare,
  ShieldCheck,
  UserRound,
  LockKeyhole,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { DEMO_ACCOUNTS, ROLE_LABELS } from "@/lib/constants";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import type { Role } from "@/types";

const ROLE_ICONS: Record<Role, typeof UserRound> = {
  panitia: ShieldCheck,
  teknis: FileText,
  legal: GitMerge,
  k3: Sparkles,
  otorisator: LockKeyhole,
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [missingEnv, setMissingEnv] = useState(false);

  const supabaseConfigured =
    typeof window !== "undefined" &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  async function doLogin(mail: string, pass: string, label: string) {
    setBusy(label);
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: mail,
        password: pass,
      });
      if (error) {
        setError(
          error.message.includes("Invalid login")
            ? "Email atau password salah."
            : error.message
        );
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setMissingEnv(true);
    } finally {
      setBusy(null);
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-950 p-6">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
          <Logo />
          <h1 className="mt-6 text-lg font-bold text-slate-900">
            Supabase belum dikonfigurasi
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Salin <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env.local.example</code>{" "}
            menjadi <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">.env.local</code> dan
            isi <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            serta <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
            Lalu jalankan <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run db:setup</code>{" "}
            dan <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run seed</code>, kemudian restart{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">npm run dev</code>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-[45%] flex-col justify-between bg-gradient-to-br from-brand-900 via-brand-800 to-brand-950 p-12 lg:flex">
        <Logo dark />
        <div>
          <h1 className="text-4xl font-extrabold leading-tight text-white">
            One Context.
            <br />
            <span className="text-brand-300">Everyone Aligned.</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-brand-200">
            Workspace pengadaan berbasis Context-Aware Agentic AI untuk PT
            Pertamina Patra Niaga — menggabungkan Context, Dokumen, dan AI
            Assistant dalam satu alur kerja.
          </p>
          <div className="mt-8 space-y-4">
            {[
              {
                icon: FileText,
                title: "Berita Acara Otomatis",
                desc: "Generate draft BA Aanwijzing terstruktur dari RKS & catatan sesi",
              },
              {
                icon: MessagesSquare,
                title: "Evaluasi Kolaboratif",
                desc: "4 aspek evaluasi paralel dengan AI, lalu dikonsolidasi",
              },
              {
                icon: Sparkles,
                title: "Smart Doc Assistant",
                desc: "Tanya dokumen project, jawab dengan sumber yang jelas",
              },
            ].map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-brand-100">
                  <f.icon className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{f.title}</p>
                  <p className="text-xs text-brand-200">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-brand-300">
          Prototype akademik — FILKOM x Pertamina Patra Niaga
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center bg-slate-50 px-6 py-10 sm:px-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {missingEnv && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Supabase belum dikonfigurasi di <b>.env.local</b>. Lihat petunjuk
              di README.
            </div>
          )}

          <h2 className="text-xl font-bold text-slate-900">
            Masuk ke Workspace
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Mode demo — pilih peran untuk langsung masuk sebagai peran tersebut
          </p>

          <div className="mt-5 space-y-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = ROLE_ICONS[acc.role];
              return (
                <button
                  key={acc.role}
                  disabled={busy !== null}
                  onClick={() => doLogin(acc.email, acc.password, acc.role)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-brand-300 hover:shadow disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                    {busy === acc.role ? (
                      <Spinner className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-slate-900">
                      {ROLE_LABELS[acc.role]}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {acc.deskripsi}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </button>
              );
            })}
          </div>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">atau login manual</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (email && password) doLogin(email, password, "manual");
            }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@patramind.demo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="patramind123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={busy !== null}
              variant="primary"
              size="lg"
            >
              {busy === "manual" ? (
                <Spinner className="h-4 w-4" />
              ) : (
                "Masuk"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
