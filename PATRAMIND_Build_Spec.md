# PATRAMIND — Build Spec untuk AI Builder

> Dokumen ini adalah instruksi lengkap untuk membangun **prototype demo** sistem PATRAMIND.
> Baca seluruh dokumen sebelum mulai coding. Ikuti prioritas fitur yang tertulis di Bagian 3 — jangan membangun semua modul dengan kedalaman yang sama.

---

## 1. KONTEKS & TUJUAN SISTEM

**PATRAMIND** adalah *Intelligent Procurement Workspace* berbasis Context-Aware Agentic AI, dibuat untuk mendukung proses pengadaan barang di lingkungan PT Pertamina Patra Niaga. Proyek ini adalah **proyek akademik/kompetisi mahasiswa (FILKOM x Pertamina Patra Niaga)**.

**Masalah yang ingin diselesaikan:**
1. **Repetitive documentation** — Berita Acara disusun ulang manual dari hasil setiap sesi tender.
2. **Document-heavy processing** — informasi perlu dikonsolidasi dari banyak dokumen pendukung.
3. **Distributed collaboration** — evaluasi tender melibatkan banyak perspektif (Teknis, Harga, Legal, K3/HSSE) yang tersebar dan perlu dikonsolidasi.
4. **Review & rework** — draft dokumen melalui banyak putaran review sebelum approval.

**Konsep produk:** satu workspace ("One Context. Everyone Aligned.") yang menghubungkan tiga panel: **Context** (RKS/TOR, Meeting, Vendor, Evaluation), **Document** (preview & generate dokumen), dan **AI Assistant** (chat, generate, refine, summarize) — didukung AI yang context-aware terhadap seluruh dokumen proyek.

**Tahap saat ini: PROTOTYPE UNTUK DEMO SELEKSI AWAL.**
- Ini **bukan** sistem produksi. Ini adalah demo yang harus terlihat meyakinkan, mengalir end-to-end, dan menunjukkan nilai AI-nya dengan jelas.
- Tidak akan digunakan langsung oleh juri secara live — ini didemokan oleh tim (kemungkinan presentasi terpandu), jadi **tidak perlu tahan terhadap semua edge case**, tapi **harus tahan terhadap alur demo yang direncanakan.**
- Namun arsitekturnya harus **future-proof**: sistem ini akan dikembangkan lebih lanjut menjadi sistem terintegrasi produksi setelah tahap seleksi. Jangan membangun sesuatu yang harus dibuang total nanti — cukup sederhanakan implementasi, bukan strukturnya.

---

## 2. TECH STACK (WAJIB DIIKUTI)

| Layer | Teknologi | Catatan |
|---|---|---|
| Framework | **Next.js (App Router)**, TypeScript | Deploy ke Vercel, zero-config |
| Styling | **Tailwind CSS** | Ikuti panduan desain di Bagian 6 |
| Database | **Supabase (Postgres)** | Project sudah ada, akan diberikan connection string/env |
| Auth | **Supabase Auth** | Jangan bangun sistem auth sendiri |
| File storage | **Supabase Storage** | Untuk dokumen upload (RKS, penawaran, dll) |
| Vector search (untuk D8) | **Supabase pgvector** | Jangan pakai vector DB eksternal (Pinecone dll) |
| AI Provider | **OpenAI API** | Dipanggil HANYA dari server (API routes), tidak pernah dari client langsung |
| Deployment | **Vercel** | Push ke git = auto deploy |

**Aturan penting:**
- Semua panggilan ke OpenAI API harus lewat Next.js API routes (`/app/api/.../route.ts`), untuk menjaga API key tetap di server.
- Gunakan environment variables untuk semua key (`OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, dll).
- Struktur folder harus rapi per modul (lihat Bagian 8) supaya mudah diperluas nanti.

---

## 3. PRIORITAS FITUR (SANGAT PENTING — BACA DULU SEBELUM CODING)

Sistem ini punya 3 modul: **D5, D6, D8**. Prioritas pengerjaan **TIDAK SAMA RATA**:

### 🔴 D5 — Pre-Bid & BA Auto-Gen — **PRIORITAS UTAMA, BUAT PALING MATANG**
Ini adalah fitur andalan yang ditonjolkan saat demo. AI generation-nya harus terasa "wow" — cepat, terstruktur, terlihat cerdas. Alokasikan waktu & effort paling besar di sini.

### 🟡 D6 — Evaluation Collaboration Hub — **PRIORITAS SEDANG**
Harus fungsional dan alurnya jelas (4 role bisa input, ada tahap consensus), tapi tidak perlu se-detail D5. Interaksi AI di sini boleh lebih sederhana (ringkasan/rekomendasi, tidak perlu multi-turn chat kompleks).

### 🟢 D8 — Smart Doc Assistant — **PRIORITAS SEDANG, TETAP DIBUAT UTUH**
Harus ada dan berfungsi (chat dengan dokumen via RAG sederhana + live preview), tapi boleh menggunakan dataset dokumen contoh yang sudah disiapkan (tidak perlu mendukung upload dokumen dinamis dari user di tahap ini).

**Yang BOLEH disederhanakan di semua modul (karena ini demo, bukan produksi):**
- Auth cukup pakai Supabase Auth standar dengan role disimpan di tabel `profiles` — tidak perlu sistem permission granular.
- Tidak perlu audit trail lengkap, notifikasi real-time, atau WebSocket.
- Tidak perlu integrasi ke SAPP/sistem Pertamina lainnya — cukup mock/placeholder.
- Data boleh di-seed (lihat Bagian 7) supaya demo tidak dimulai dari kondisi kosong.

---

## 4. USER ROLES

Sistem punya 5 role, disimpan di tabel `profiles` (terhubung ke `auth.users` Supabase):

1. **Panitia Pengadaan** — mengelola project tender, trigger generate BA (D5), melihat semua hasil evaluasi (D6), akses penuh ke D8.
2. **Tim Teknis** — input evaluasi aspek teknis (D6), akses D8 untuk dokumen terkait spesifikasi.
3. **Legal** — input evaluasi aspek legal/administrasi (D6).
4. **K3/HSSE** — input evaluasi aspek K3/SLA (D6).
5. **Otorisator** — melihat ringkasan akhir/consensus (D6), approve dokumen final.

Login page: form email/password sederhana (Supabase Auth), lalu redirect ke dashboard sesuai role. Sediakan halaman **role switcher** khusus untuk mode demo (misalnya tombol "Login sebagai [Role]" dengan akun demo yang sudah di-seed) supaya presenter bisa berpindah role dengan cepat saat demo tanpa logout-login manual berkali-kali.

---

## 5. BREAKDOWN FITUR PER MODUL

### 5.1 🔴 MODUL D5 — Pre-Bid & BA Auto-Gen

**Alur:** `Capture → Understand → Generate`

**Tujuan:** Panitia mengunggah/memilih RKS/TOR dan mencatat hasil sesi pemberian penjelasan (Aanwijzing), lalu AI menghasilkan draft Berita Acara Pemberian Penjelasan secara otomatis dan terstruktur.

**Halaman/komponen yang dibutuhkan:**

1. **Halaman Project/Tender List** — daftar tender aktif (card list), klik satu tender masuk ke workspace-nya.
2. **Workspace Tender — Tab "Pre-Bid"**:
   - Panel kiri: pilih/lihat dokumen RKS/TOR yang terkait (dari data seed, ditampilkan sebagai preview teks).
   - Panel tengah: form input "Catatan Sesi Penjelasan" — textarea untuk catat pertanyaan peserta & jawaban panitia (bisa multiple entries, tombol "+ Tambah Q&A").
   - Tombol **"Generate Berita Acara"** — memicu API call ke OpenAI.
   - Panel kanan/bawah: hasil generate ditampilkan sebagai **preview dokumen terstruktur** (bukan raw text) — dengan bagian: Kop/Header, Daftar Hadir Peserta (mock), Ringkasan Penjelasan, Daftar Tanya-Jawab, Perubahan/Addendum (jika ada), Kesimpulan, Tanda Tangan (placeholder).
   - Tombol **"Edit"** (buka jadi editable rich text/textarea) dan **"Finalize & Save"** (simpan ke Supabase, status jadi "final").
3. **Loading state yang meyakinkan**: saat generate, tampilkan indikator progress bertahap (misal: "Menganalisis RKS/TOR..." → "Memproses catatan sesi..." → "Menyusun Berita Acara...") — ini penting untuk kesan "AI sedang bekerja cerdas", jangan hanya spinner polos.

**Struktur Prompt OpenAI untuk D5** (jadikan system prompt yang terstruktur):
```
Kamu adalah asisten AI yang membantu Panitia Pengadaan menyusun Berita Acara Pemberian Penjelasan (Aanwijzing) sesuai prosedur pengadaan barang perusahaan.

Berdasarkan:
1. Ringkasan RKS/TOR berikut: {rks_content}
2. Catatan sesi pemberian penjelasan (tanya-jawab) berikut: {qna_notes}

Susun draft Berita Acara Pemberian Penjelasan dengan struktur:
1. Kop dokumen (Nomor BA, Nama Pekerjaan, Tanggal, Tempat)
2. Ringkasan pelaksanaan (waktu, peserta yang hadir jika disebutkan)
3. Poin-poin penjelasan utama (ringkas dari RKS/TOR)
4. Daftar tanya-jawab (format tabel: No, Pertanyaan, Jawaban)
5. Perubahan/penambahan/klarifikasi dokumen (jika ada disebutkan dalam catatan)
6. Kesimpulan dan penutup

Gunakan bahasa formal Indonesia sesuai gaya dokumen resmi perusahaan. Jangan menambahkan informasi yang tidak ada dalam input.
Output dalam format JSON dengan struktur: { "nomor_ba": ..., "ringkasan_pelaksanaan": ..., "poin_penjelasan": [...], "tanya_jawab": [{"no":1,"pertanyaan":..., "jawaban":...}], "perubahan": [...], "kesimpulan": ... }
```
> Output berupa JSON terstruktur (bukan freeform text) supaya bisa dirender rapi di UI sebagai "dokumen", bukan sekadar chat bubble panjang. Ini penting untuk kesan profesional saat demo.

**Referensi bisnis proses:** ikuti struktur Berita Acara Pemberian Penjelasan sesuai Prosedur Pengadaan Barang PKT butir 5.28 (jika file prosedur tersedia untuk builder, jadikan referensi konten/istilah — kalau tidak tersedia, gunakan struktur di atas).

---

### 5.2 🟡 MODUL D6 — Evaluation Collaboration Hub

**Alur:** `Review → Collaborate → Consensus`

**Tujuan:** 4 role (Teknis, Legal, K3/SLA, Harga) melakukan evaluasi dokumen penawaran secara paralel, masing-masing dibantu AI, lalu hasilnya dikonsolidasi menjadi satu ringkasan (consensus).

**Halaman/komponen:**

1. **Workspace Tender — Tab "Evaluation"**:
   - Layout 4 kolom/card: **Teknis + AI**, **Legal + AI**, **Harga + AI**, **K3/SLA + AI**.
   - Setiap kolom hanya bisa diisi oleh role yang sesuai (role lain bisa lihat read-only).
   - Di tiap kolom: tombol **"AI Analisis"** yang memanggil OpenAI untuk memberi ringkasan otomatis dari dokumen penawaran terkait aspek tersebut (misal untuk Teknis: bandingkan spesifikasi penawaran vs RKS), lalu user bisa edit/tambahkan catatan manual.
   - Field status per kolom: `Belum Dinilai / Dinilai / Perlu Klarifikasi`.
2. **Tombol "Generate Consensus"** (biasanya dipicu oleh Panitia/Otorisator) — memanggil OpenAI untuk merangkum ke-4 input jadi satu ringkasan evaluasi akhir, ditampilkan di panel tengah bawah.
3. Simpan hasil consensus sebagai bagian dari dokumen evaluasi tender (tabel `evaluations`).

**Prompt OpenAI untuk masing-masing kolom** (contoh untuk Teknis):
```
Kamu adalah asisten evaluasi teknis pengadaan barang. Berdasarkan spesifikasi RKS/TOR berikut: {rks_spec}
dan dokumen penawaran vendor berikut: {vendor_offer}
Berikan analisis singkat (maks 150 kata) meliputi: kesesuaian spesifikasi, potensi risiko/gap, dan rekomendasi awal (Layak/Tidak Layak/Perlu Klarifikasi).
```

**Prompt OpenAI untuk Consensus:**
```
Berikut adalah hasil evaluasi dari 4 aspek untuk penawaran vendor {vendor_name}:
- Teknis: {teknis_input}
- Legal: {legal_input}
- Harga: {harga_input}
- K3/SLA: {k3_input}
Susun ringkasan konsensus yang mencakup: kesimpulan keseluruhan, poin yang perlu diperhatikan, dan rekomendasi akhir (Layak Dilanjutkan/Tidak Layak/Perlu Klarifikasi Tambahan).
```

---

### 5.3 🟢 MODUL D8 — Smart Doc Assistant

**Alur:** `Ingest → Contextualize → Generate`

**Tujuan:** AI side-bot yang bisa ditanya seputar dokumen-dokumen dalam satu project tender (RAG sederhana), plus live preview dokumen yang sedang disusun.

**Halaman/komponen:**

1. **Panel kanan (tersedia di semua tab workspace tender, seperti "Ask AI" persistent sidebar)**:
   - Chat interface sederhana: input pertanyaan, jawaban dari AI berdasarkan dokumen project yang relevan.
   - Menampilkan "sumber" jawaban (misal: "Berdasarkan RKS bagian 3.2...") untuk kesan transparan/trustworthy.
2. **Live Preview**: saat user sedang menyusun dokumen (misal draft BA dari D5, atau catatan evaluasi dari D6), panel ini menampilkan preview real-time dari dokumen tersebut.
3. **Implementasi RAG sederhana**:
   - Dokumen contoh (RKS, prosedur pengadaan, dll) di-embed sekali (pakai OpenAI Embeddings) dan disimpan di tabel Supabase dengan kolom `vector` (pgvector).
   - Saat user tanya, query di-embed, cari top-k chunk paling relevan (cosine similarity via pgvector), kirim sebagai context ke OpenAI chat completion.

**Prompt OpenAI untuk D8 (RAG):**
```
Kamu adalah asisten AI yang membantu pengguna memahami dokumen-dokumen proyek pengadaan ini.
Gunakan HANYA informasi dari konteks berikut untuk menjawab. Jika informasi tidak ada dalam konteks, katakan tidak tahu — jangan mengarang.

Konteks relevan:
{retrieved_chunks}

Pertanyaan pengguna: {user_question}
```

---

## 6. PANDUAN DESAIN (UI/UX)

Ikuti gaya visual PATRAMIND dari materi referensi:
- **Warna utama**: biru navy (#1a2b5f atau sejenisnya) sebagai warna brand, aksen merah dan hijau untuk status/highlight, putih/abu terang untuk background.
- **Layout workspace**: 3 kolom mirip dashboard software B2B modern — sidebar kiri untuk navigasi Context (RKS, Meeting, Vendor, Evaluation), panel tengah untuk konten utama/dokumen, panel kanan untuk AI Assistant (persistent, collapsible).
- **Kartu/card** dengan rounded corners, shadow halus, ikon di setiap kategori (gunakan icon set seperti Lucide/Heroicons).
- **Tipografi**: sans-serif modern (Inter/Manrope), heading tegas, body text mudah dibaca.
- **Komponen dokumen preview**: harus terlihat seperti dokumen resmi (bukan sekadar card chat) — pakai layout mirip kertas/formulir dengan header, section, dan tabel jika perlu.
- **Status badge**: gunakan warna berbeda untuk status (Draft = abu, Perlu Review = kuning, Final = hijau).
- Gunakan komponen UI library ringan seperti **shadcn/ui** di atas Tailwind untuk mempercepat pembuatan komponen konsisten (button, card, tabs, dialog).

---

## 7. SKEMA DATA (SUPABASE) — MINIMAL UNTUK PROTOTYPE

```sql
-- Role & profile
profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text check (role in ('panitia','teknis','legal','k3','otorisator')),
  created_at timestamp default now()
)

-- Tender/project
tenders (
  id uuid primary key default gen_random_uuid(),
  nama_pekerjaan text,
  nomor_pr text,
  status text default 'draft',
  created_at timestamp default now()
)

-- Dokumen (RKS/TOR, penawaran, dll) — untuk D5 & D8
documents (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id),
  jenis text check (jenis in ('rks_tor','penawaran','lainnya')),
  nama_file text,
  konten_text text,      -- isi teks dokumen (untuk prototype, cukup text, tidak perlu parsing PDF asli)
  embedding vector(1536), -- untuk RAG D8, pakai pgvector
  created_at timestamp default now()
)

-- Hasil D5
berita_acara (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id),
  qna_notes jsonb,        -- input catatan tanya jawab
  hasil_generate jsonb,   -- output terstruktur dari AI
  status text default 'draft', -- draft / final
  created_by uuid references profiles(id),
  created_at timestamp default now()
)

-- Hasil D6
evaluations (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id),
  vendor_name text,
  teknis_input jsonb,
  legal_input jsonb,
  harga_input jsonb,
  k3_input jsonb,
  consensus_result jsonb,
  created_at timestamp default now()
)

-- Chat history D8 (opsional untuk demo, boleh minimal)
chat_history (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id),
  user_id uuid references profiles(id),
  question text,
  answer text,
  created_at timestamp default now()
)
```

**Seed data yang wajib disiapkan sebelum demo:**
- 1 tender contoh lengkap (nama pekerjaan realistis, misal "Pengadaan Spare Part Pompa NPK").
- 1 dokumen RKS/TOR contoh (teks cukup panjang, realistis, bisa disarikan dari dokumen prosedur pengadaan yang ada).
- 2-3 dokumen penawaran vendor contoh (untuk demo D6).
- Akun demo untuk tiap role (email/password sederhana), sudah terdaftar di Supabase Auth + tabel `profiles`.

---

## 8. STRUKTUR FOLDER YANG DISARANKAN

```
/app
  /login
  /dashboard
  /tender/[id]
    /pre-bid          -> D5
    /evaluation        -> D6
    layout.tsx          -> shared layout dengan sidebar Context + panel AI Assistant (D8)
  /api
    /generate-ba        -> D5 endpoint (panggil OpenAI)
    /evaluate            -> D6 endpoint (panggil OpenAI per aspek)
    /consensus           -> D6 endpoint (generate consensus)
    /chat                -> D8 endpoint (RAG + OpenAI)
    /embed               -> D8 endpoint (buat embedding dokumen, dipanggil saat seeding)
/components
  /ui                   -> shadcn components
  /workspace            -> ContextSidebar, DocumentPreview, AIAssistantPanel
  /d5                   -> QnaForm, BAPreview
  /d6                   -> EvaluationColumn, ConsensusPanel
  /d8                   -> ChatPanel, LivePreview
/lib
  supabase.ts
  openai.ts
/types
  index.ts
```

---

## 9. URUTAN PEMBANGUNAN YANG DISARANKAN (MENGINGAT WAKTU MEPET)

1. Setup project Next.js + Tailwind + shadcn, koneksi ke Supabase (auth + db).
2. Buat skema tabel di Supabase + seed data (Bagian 7).
3. Buat halaman login + role switcher demo + dashboard tender list.
4. Bangun **D5 penuh** (prioritas utama) — dari UI input sampai generate & preview dokumen.
5. Bangun **D8** (chat + RAG sederhana + live preview) — bisa reuse panel ini di semua workspace.
6. Bangun **D6** (4 kolom evaluasi + consensus).
7. Polish UI sesuai Bagian 6, pastikan alur demo dari awal ke akhir mulus tanpa error.
8. Uji alur demo end-to-end minimal 2x sebelum presentasi.

---

## 10. CATATAN PENUTUP UNTUK AI BUILDER

- Prioritaskan **kualitas & kesan D5** di atas kelengkapan fitur modul lain.
- Semua teks UI dan output AI menggunakan **Bahasa Indonesia formal**, konsisten dengan gaya dokumen resmi perusahaan (rujuk istilah seperti RKS, TOR, Berita Acara, Otorisator, Panitia Pengadaan — jangan diterjemahkan ke Inggris).
- Jangan over-engineer bagian yang ditandai "boleh disederhanakan" — fokuskan waktu ke alur yang benar-benar akan didemokan.
- Pastikan tidak ada error yang terlihat user saat demo (gunakan try-catch, fallback UI, loading state yang jelas) — untuk demo, "terlihat mulus" lebih penting daripada "benar-benar robust".
