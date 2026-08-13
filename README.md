# PATRAMIND — Intelligent Procurement Workspace

Prototype demo sistem pengadaan berbasis Context-Aware Agentic AI untuk
PT Pertamina Patra Niaga (proyek akademik FILKOM x Pertamina Patra Niaga).

**One Context. Everyone Aligned.** — satu workspace menghubungkan tiga panel:
**Context** (RKS/TOR, Meeting, Vendor, Evaluation), **Document** (preview &
generate), dan **AI Assistant** (chat, generate, refine, summarize).

## Modul

| Modul | Nama | Prioritas | Halaman |
|---|---|---|---|
| D5 | Pre-Bid & BA Auto-Gen (Capture → Understand → Generate) | 🔴 Utama | `/tender/[id]/pre-bid` |
| D6 | Evaluation Collaboration Hub (Review → Collaborate → Consensus) | 🟡 Sedang | `/tender/[id]/evaluation` |
| D8 | Smart Doc Assistant — chat RAG + live preview (persistent panel) | 🟢 Sedang | semua tab workspace |

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Supabase (Postgres,
Auth, pgvector) · OpenAI API (opsional) · Lucide icons

**Mode AI:** kalau `OPENAI_API_KEY` kosong, sistem berjalan 100% offline dengan
AI generator lokal yang realistis (memakai input asli: RKS + catatan sesi).
Begitu key diisi, semua panggilan otomatis memakai OpenAI asli dari server
(API routes), RAG berpindah ke pgvector.

## Setup Lokal (5 langkah)

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Konfigurasi env**
   ```bash
   cp .env.local.example .env.local
   # isi NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
   # SUPABASE_SERVICE_ROLE_KEY (wajib), DATABASE_URL (untuk db:setup),
   # OPENAI_API_KEY (opsional — kosongkan untuk mode demo offline)
   ```

3. **Buat skema database**
   ```bash
   npm run db:setup
   ```
   (Jika gagal, tempel isi `supabase/schema.sql` di SQL Editor Supabase)

4. **Seed data demo** (5 akun role, 1 tender, RKS, 3 penawaran vendor, chunk RAG)
   ```bash
   npm run seed
   ```

5. **Jalankan**
   ```bash
   npm run dev
   ```
   Buka http://localhost:3000

### Akun demo

| Role | Email | Password |
|---|---|---|
| Panitia Pengadaan | `panitia@patramind.demo` | `patramind123` |
| Tim Teknis | `teknis@patramind.demo` | `patramind123` |
| Legal | `legal@patramind.demo` | `patramind123` |
| K3 / HSSE | `k3@patramind.demo` | `patramind123` |
| Otorisator | `otorisator@patramind.demo` | `patramind123` |

Role switcher tersedia di pojok kanan atas workspace — ganti role saat demo
tanpa logout-login.

## Alur Demo yang Disarankan

1. Login sebagai **Panitia** → buka tender "Pengadaan Spare Part Pompa
   Sentrifugal NPK 2026".
2. **D5**: tambah 2–3 Q&A sesi aanwijzing → klik *Generate Berita Acara*
   (perhatikan progress bertahap AI) → preview dokumen resmi muncul →
   *Edit* bila perlu → *Finalize & Simpan*.
3. **D8**: di panel kanan, tanya Asisten AI (mis. "Apa spesifikasi impeller?")
   — jawaban menyertakan sumber dokumen. Tab *Live Preview* menampilkan draft
   yang sedang disusun.
4. Ganti peran **Teknis** → buka tab *Evaluation* → klik *AI Analisis* di
   kolom Teknis → simpan. Ulangi untuk **Legal**, **K3**, dan kembali ke
   **Panitia** untuk kolom Harga.
5. Sebagai **Panitia** → *Generate Konsensus* → ganti peran **Otorisator** →
   *Setujui Final*.

## Struktur Folder

```
app/
  login/  dashboard/  tender/[id]/ (pre-bid, evaluation, dokumen, layout)
  api/    generate-ba, evaluate, consensus, chat, embed, berita-acara,
          evaluations, tenders
components/
  ui/  workspace/  d5/  d6/  d8/  auth/  dashboard/
lib/
  supabase/  ai/  api-auth.ts  constants.ts  utils.ts
scripts/   seed.ts, db-setup.ts
supabase/  schema.sql
types/
```

## Catatan Prototype

- RLS dimatikan via policy (semua akses lewat service role) — sebelum
  produksi, aktifkan RLS + buat policy per role.
- Dokumen disimpan sebagai teks (belum parsing PDF) sesuai spec prototype.
- Endpoint AI (`/api/generate-ba`, `/api/evaluate`, `/api/consensus`,
  `/api/chat`) hanya berjalan di server — API key tidak pernah bocor ke client.
- `npm run build` lalu `npm start` untuk menjalankan dalam mode produksi.
