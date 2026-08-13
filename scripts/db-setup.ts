/* ============================================================
   PATRAMIND — Setup skema database secara otomatis.
   Membaca supabase/schema.sql dan mengeksekusi lewat koneksi
   Postgres langsung (DATABASE_URL di .env.local).
   Alternatif: tempel isi supabase/schema.sql di SQL Editor
   Supabase.
   Jalankan:  npm run db:setup
   ============================================================ */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error(
    "[db:setup] Gagal: DATABASE_URL belum diisi di .env.local.\n" +
      "Petunjuk: project settings > Database > Connection string (gunakan pooler).\n" +
      "Alternatif: tempel isi supabase/schema.sql di SQL Editor Supabase."
  );
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const schema = readFileSync(join(process.cwd(), "supabase", "schema.sql"), "utf8");
  console.log("[db:setup] Menghubungkan ke database…");
  await client.connect();
  console.log("[db:setup] Mengeksekusi skema…");
  await client.query(schema);
  console.log("[db:setup] Selesai — skema & fungsi RAG siap. Lanjutkan dengan `npm run seed`.");
}

main()
  .catch((e) => {
    console.error("[db:setup] Gagal:", e.message ?? e);
    console.error("Jika error soal ekstensi pgvector, jalankan manual di SQL Editor Supabase.");
    process.exit(1);
  })
  .finally(() => client.end().catch(() => {}));
