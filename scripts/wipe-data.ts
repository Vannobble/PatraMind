/* ============================================================
   PATRAMIND — Wipe data script (prototype)
   Menghapus SEMUA data transaksi & master (tender, dokumen,
   evaluasi, chat, departemen, BA) agar tampil seperti fresh.
   PROFILES TIDAK DIHAPUS (agar akun demo tetap bisa login).
   Jalankan:  node --env-file-if-exists=.env.local --import tsx scripts/wipe-data.ts
   ============================================================ */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "[wipe] Gagal: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const log = (msg: string) => console.log(`[wipe] ${msg}`);

const TABLES = [
  "aspect_chat_messages",
  "department_chat_messages",
  "department_assessments",
  "chat_history",
  "evaluations",
  "document_chunks",
  "documents",
  "berita_acara",
  "tender_departments",
  "tenders",
  "departments",
] as const;

async function main() {
  for (const table of TABLES) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      log(`GAGAL hapus ${table}: ${error.message}`);
      process.exit(1);
    }
    const { count } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    log(`berhasil hapus ${table} (sisa: ${count ?? 0})`);
  }

  const { count } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });
  log(`selesai — profiles (akun login) dipertahankan: ${count ?? 0}`);
}

main();
