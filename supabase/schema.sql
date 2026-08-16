-- ============================================================
-- PATRAMIND — Skema Database Prototype (Supabase Postgres)
-- Cara pakai: tempel seluruh isi file ini di SQL Editor Supabase
-- lalu jalankan. Setelah itu jalankan `npm run seed`.
-- ============================================================

-- 1. Ekstensi pgvector (untuk RAG D8)
create extension if not exists vector;

-- 2. Role & profile
create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text not null default '',
  role text not null default 'panitia'
    check (role in ('panitia','teknis','legal','k3','otorisator','admin')),
  created_at timestamp default now()
);

-- Migrasi idempotent: perluas role dengan 'admin'
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check
  check (role in ('panitia','teknis','legal','k3','otorisator','admin'));

-- 3. Tender/project
create table if not exists tenders (
  id uuid primary key default gen_random_uuid(),
  nama_pekerjaan text not null,
  nomor_pr text not null default '',
  klien text not null default '',
  nilai_kontrak numeric not null default 0,
  deadline date,
  pic text not null default '',
  status text not null default 'draft',
  created_at timestamp default now()
);

-- Migrasi idempotent: kolom tambahan ala PATRAMINE
alter table tenders add column if not exists klien text not null default '';
alter table tenders add column if not exists nilai_kontrak numeric not null default 0;
alter table tenders add column if not exists deadline date;
alter table tenders add column if not exists pic text not null default '';

-- Migrasi idempotent: status baru Draft/Proses/Evaluasi/Diterima/Ditolak
alter table tenders drop constraint if exists tenders_status_check;
update tenders set status = 'proses' where status = 'aanwijzing';
update tenders set status = 'diterima' where status = 'final';
alter table tenders add constraint tenders_status_check
  check (status in ('draft','proses','evaluasi','diterima','ditolak'));

-- Migrasi idempotent: ringkasan tender (rangkuman naratif per tender)
alter table tenders add column if not exists ringkasan text not null default '';

-- Migrasi idempotent: mode evaluasi kolaborasi per tender
alter table tenders add column if not exists mode_evaluasi text not null default 'aspek';
alter table tenders drop constraint if exists tenders_mode_evaluasi_check;
alter table tenders add constraint tenders_mode_evaluasi_check
  check (mode_evaluasi in ('aspek','departemen'));

-- 3b. Master departemen (global, bisa ditambah/dihapus admin)
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  nama text not null unique,
  created_at timestamp default now()
);

-- 3c. Bobot departemen per tender (mode_evaluasi = 'departemen')
create table if not exists tender_departments (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  department_id uuid references departments(id) on delete cascade,
  bobot int not null default 0,
  unique (tender_id, department_id)
);

-- 4. Dokumen (RKS/TOR, penawaran, dll)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  jenis text not null default 'lainnya'
    check (jenis in ('rks_tor','penawaran','lainnya')),
  nama_file text not null,
  konten_text text not null default '',
  embedding vector(1536),
  created_at timestamp default now()
);

-- 5. Chunk dokumen untuk RAG (D8)
create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  sumber text not null default '',
  embedding vector(1536),
  created_at timestamp default now()
);

-- 6. Hasil D5
create table if not exists berita_acara (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  qna_notes jsonb not null default '[]'::jsonb,
  hasil_generate jsonb not null default '{}'::jsonb,
  status text not null default 'draft'
    check (status in ('draft','final')),
  created_by uuid references profiles(id),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 7. Hasil D6
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  vendor_name text not null,
  teknis_input jsonb,
  legal_input jsonb,
  harga_input jsonb,
  k3_input jsonb,
  consensus_result jsonb,
  status text not null default 'draft'
    check (status in ('draft','final')),
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 8. Riwayat chat D8
create table if not exists chat_history (
  id uuid primary key default gen_random_uuid(),
  tender_id uuid references tenders(id) on delete cascade,
  document_id uuid references documents(id) on delete cascade,
  user_id uuid references profiles(id),
  question text not null,
  answer text not null,
  sources jsonb not null default '[]'::jsonb,
  created_at timestamp default now()
);

-- Migrasi idempotent: konteks chat per dokumen
alter table chat_history add column if not exists document_id uuid references documents(id) on delete cascade;

-- 8b. Penilaian per departemen (mode_evaluasi = 'departemen')
create table if not exists department_assessments (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid references evaluations(id) on delete cascade,
  department_id uuid references departments(id) on delete cascade,
  ai_proposal text not null default '',
  penilaian_teks text not null default '',
  ai_skor numeric,
  ai_ringkasan text not null default '',
  status text not null default 'belum'
    check (status in ('belum','dinilai','diskor')),
  created_at timestamp default now(),
  updated_at timestamp default now(),
  unique (evaluation_id, department_id)
);

-- 9. Fungsi pencarian vektor (RAG D8)
create or replace function match_documents(
  query_embedding vector(1536),
  match_count int default 5,
  p_tender_id uuid default null
)
returns table (id uuid, tender_id uuid, content text, sumber text, similarity float)
language plpgsql as $$
begin
  return query
  select dc.id, dc.tender_id, dc.content, dc.sumber,
         1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where (p_tender_id is null or dc.tender_id = p_tender_id)
  order by dc.embedding <=> query_embedding
  limit match_count;
end $$;

-- 10. Trigger: buat profile otomatis saat user baru terdaftar
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'panitia')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Catatan prototype: RLS dimatikan agar alur demo tidak terhambat.
-- Sebelum produksi, aktifkan RLS + buat policy per role.
alter table profiles enable row level security;
alter table tenders enable row level security;
alter table documents enable row level security;
alter table document_chunks enable row level security;
alter table berita_acara enable row level security;
alter table evaluations enable row level security;
alter table chat_history enable row level security;
