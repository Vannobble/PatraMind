import type { Aspect, Role } from "@/types";

export const APP_NAME = "PATRAMIND";
export const APP_TAGLINE = "One Context. Everyone Aligned.";

export const ROLE_LABELS: Record<Role, string> = {
  panitia: "Panitia Pengadaan",
  teknis: "Tim Teknis",
  legal: "Legal",
  k3: "K3 / HSSE",
  otorisator: "Otorisator",
  admin: "Admin",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  panitia: "Mengelola project tender & memicu generate dokumen",
  teknis: "Menilai kesesuaian spesifikasi teknis penawaran",
  legal: "Menilai kelengkapan dokumen legal & administrasi",
  k3: "Menilai aspek K3, lingkungan & SLA",
  otorisator: "Menyetujui hasil evaluasi final",
  admin: "Mengatur semua — akses penuh seluruh fitur",
};

export const DEMO_ACCOUNTS: {
  role: Role;
  email: string;
  password: string;
  name: string;
  deskripsi: string;
}[] = [
  {
    role: "admin",
    email: "admin@patramind.demo",
    password: "patramind123",
    name: "Admin Utama",
    deskripsi: "Mengatur semua — akses penuh seluruh fitur",
  },
  {
    role: "panitia",
    email: "panitia@patramind.demo",
    password: "patramind123",
    name: "Budi Santoso",
    deskripsi: "Mengelola workspace tender, generate Berita Acara",
  },
  {
    role: "teknis",
    email: "teknis@patramind.demo",
    password: "patramind123",
    name: "Rina Kartika",
    deskripsi: "Evaluasi aspek teknis penawaran",
  },
  {
    role: "otorisator",
    email: "otorisator@patramind.demo",
    password: "patramind123",
    name: "Siti Rahayu",
    deskripsi: "Meninjau konsensus & approve final",
  },
];

export const ASPECT_META: Record<
  Aspect,
  {
    label: string;
    role: Role;
    subLabel: string;
    badgeClass: string;
    ringClass: string;
  }
> = {
  teknis: {
    label: "Teknis",
    role: "teknis",
    subLabel: "Kesesuaian spesifikasi vs RKS",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    ringClass: "ring-blue-200",
  },
  legal: {
    label: "Legal",
    role: "legal",
    subLabel: "Kelengkapan dokumen & administrasi",
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    ringClass: "ring-purple-200",
  },
  harga: {
    label: "Harga",
    role: "panitia",
    subLabel: "Kewajaran harga & penawaran",
    badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    ringClass: "ring-amber-200",
  },
  k3: {
    label: "K3 / SLA",
    role: "k3",
    subLabel: "K3, lingkungan & jaminan layanan",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    ringClass: "ring-emerald-200",
  },
};

export const ASPECT_ORDER: Aspect[] = ["teknis", "legal", "harga", "k3"];

export const ASPECT_STATUS_LABELS: Record<
  string,
  { label: string; cls: string }
> = {
  belum_dinilai: { label: "Belum Dinilai", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  dinilai: { label: "Dinilai", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  perlu_klarifikasi: { label: "Perlu Klarifikasi", cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

export const TENDER_STATUS_LABELS: Record<
  string,
  { label: string; cls: string }
> = {
  draft: { label: "Draft", cls: "bg-slate-100 text-slate-600 border-slate-200" },
  proses: { label: "Proses", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  evaluasi: { label: "Evaluasi", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  diterima: { label: "Diterima", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  ditolak: { label: "Ditolak", cls: "bg-red-50 text-red-700 border-red-200" },
};

export const AI_MODE = {
  label: (openaiConfigured: boolean) =>
    openaiConfigured ? "OpenAI (live)" : "AI Lokal (demo offline)",
  hint: (openaiConfigured: boolean) =>
    openaiConfigured
      ? "Model OpenAI terhubung"
      : "Tambah OPENAI_API_KEY untuk AI asli",
};
