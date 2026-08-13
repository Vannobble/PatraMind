/* ============================================================
   PATRAMIND — Seed script (prototype)
   Membuat: akun demo 5 role, 1 tender contoh, dokumen RKS + 3
   penawaran vendor, chunk RAG, dan embedding.
   Jalankan:  npm run seed   (wajib .env.local sudah terisi)
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "../lib/constants";
import { chunkDocument, mockEmbedding } from "../lib/ai/rag";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "[seed] Gagal: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const log = (msg: string) => console.log(`[seed] ${msg}`);

/* ---------------- data contoh ---------------- */

const RKS_TEXT = `RKS/TOR PENGADAAN SPARE PART POMPA SENTRIFUGAL NPK
NOMOR PR: PR-26-004821

1. PENDAHULUAN
1.1 Tujuan
Pengadaan spare part pompa sentrifugal NPK tahun 2026 bertujuan untuk mendukung kelancaran operasional pompa proses pada unit produksi. Dokumen ini menjadi acuan bagi calon penyedia dalam menyusun penawaran.

1.2 Lingkup Pekerjaan
Lingkup pekerjaan meliputi pengadaan, pengiriman, dan jaminan mutu atas spare part pompa sentrifugal yang terdiri dari impeller, mechanical seal, bearing, dan komponen pendukung lainnya sesuai daftar kebutuhan.

2. SPESIFIKASI TEKNIS
2.1 Impeller
Material impeller terbuat dari cast iron atau stainless steel 316L dengan dimensi diameter 420 mm, kapasitas aliran (flow) 320 m3/jam, dan head 45 m. Impeller harus dalam kondisi balance static dan dynamic.

2.2 Mechanical Seal
Mechanical seal tipe cartridge single seal dengan material carbon/silicon carbide, ketahanan tekanan kerja hingga 16 bar, dan umur pakai minimal 12.000 jam operasi.

2.3 Bearing
Bearing jenis roller bearing dengan ketahanan beban aksial dan radial, standar ISO 281, pelumasan gemuk dengan interval 2.000 jam operasi.

2.4 Komponen Pendukung
Komponen pendukung meliputi gasket, O-ring, dan baut pengikat dengan material tahan korosi serta sesuai standar dimensi original equipment manufacturer (OEM).

3. SYARAT MUTU DAN JAMINAN KUALITAS
3.1 Sertifikat Mutu
Setiap barang wajib dilengkapi sertifikat mutu (material certificate) yang diterbitkan pabrikan serta hasil uji kualitas yang dapat dipertanggungjawabkan.

3.2 Garansi
Penyedia wajib memberikan garansi mutu minimal 12 bulan sejak barang diterima, termasuk garansi terhadap cacat material dan pengerjaan.

3.3 Jaminan Pengiriman
Pengiriman dilakukan dengan waktu penyerahan maksimal 60 hari kalender sejak Surat Perintah Kerja (SPK) diterbitkan, termasuk pengiriman ke gudang PT Pertamina Patra Niaga.

4. PERSYARATAN ADMINISTRASI
Calon penyedia wajib memiliki NPWP, NIB, akta pendirian perusahaan, dan dokumen domisili yang masih berlaku. Dokumen penawaran disampaikan lengkap sesuai daftar pemeriksaan kelengkapan administrasi.

5. SYARAT K3 DAN LINGKUNGAN
Penyedia wajib memiliki sertifikat SMK3 minimal level 2 atau setara, menerapkan sistem manajemen lingkungan ISO 14001, serta memenuhi ketentuan keselamatan kerja (APD) pada proses pengiriman dan penanganan barang.

6. MEKANISME EVALUASI
Penawaran dievaluasi dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA. Penawaran yang memenuhi persyaratan teknis dan administrasi akan dilanjutkan ke evaluasi harga dan K3. HPS pengadaan ditetapkan sebesar Rp 1.250.000.000.

7. LAIN-LAIN
Ketentuan tambahan mengenai SLA purna jual, ketersediaan suku cadang, dan dukungan teknis penyedia akan diatur dalam kontrak. RKS ini dapat diubah melalui addendum yang ditetapkan panitia.`;

const OFFERS: { nama: string; text: string }[] = [
  {
    nama: "penawaran PT Energi Teknologi Sejahtera.txt",
    text: `PENAWARAN PT ENERGI TEKNOLOGI SEJAHTERA
PENGADAAN SPARE PART POMPA SENTRIFUGAL NPK 2026

1. PENDAHULUAN
PT Energi Teknologi Sejahtera menyampaikan penawaran untuk pengadaan spare part pompa sentrifugal NPK dengan komitmen memenuhi seluruh spesifikasi RKS.

2. SPESIFIKASI TEKNIS
Kami menawarkan impeller material stainless steel 316L diameter 420 mm dengan kapasitas aliran 320 m3/jam dan head 45 m, sepenuhnya sesuai spesifikasi RKS. Mechanical seal cartridge single seal material carbon/silicon carbide tahan tekanan 16 bar dengan umur pakai 12.000 jam. Bearing roller standar ISO 281 dengan interval pelumasan 2.000 jam. Seluruh komponen menjalani uji balance static dan dynamic serta dilengkapi material certificate dari pabrikan.

3. PERSYARATAN ADMINISTRASI
Kelengkapan administrasi: NPWP, NIB, akta pendirian, TDP, dan surat domisili seluruhnya masih berlaku. Kami juga melampirkan surat kuasa penandatanganan dokumen penawaran.

4. HARGA PENAWARAN
Nilai penawaran kami sebesar Rp 1.180.000.000 termasuk PPN 11%, biaya pengiriman ke gudang PT Pertamina Patra Niaga, dan garansi 12 bulan. Rincian harga terlampir dalam daftar kuantitas dan harga.

5. K3 DAN LINGKUNGAN
Kami memiliki sertifikat SMK3 level 3, ISO 45001, dan ISO 14001. Prosedur K3 pengiriman dan penanganan barang menggunakan APD sesuai ketentuan serta asuransi pengiriman.

6. JANGKA WAKTU
Waktu penyerahan 45 hari kalender sejak SPK diterbitkan, lebih cepat dari batas maksimal 60 hari kalender.

7. JAMINAN DAN SLA
Garansi mutu 12 bulan, dukungan teknis purna jual, dan ketersediaan suku cadang selama 5 tahun.`,
  },
  {
    nama: "penawaran PT Prima Sarana Mandiri.txt",
    text: `PENAWARAN PT PRIMA SARANA MANDIRI
PENGADAAN SPARE PART POMPA SENTRIFUGAL NPK 2026

1. PENDAHULUAN
PT Prima Sarana Mandiri mengajukan penawaran pekerjaan pengadaan spare part pompa sentrifugal NPK 2026.

2. SPESIFIKASI TEKNIS
Penawaran meliputi impeller cast iron diameter 420 mm, mechanical seal tipe cartridge dengan material carbon/silicon, dan bearing roller standar ISO 281. Kapasitas aliran 320 m3/jam dan head 45 m. Uji balance dilaksanakan di workshop kami dan material certificate dapat menyusul setelah pesanan dikonfirmasi.

3. ADMINISTRASI
Kami melampirkan NPWP, NIB, akta pendirian, dan domisili yang masih berlaku. Surat kuasa dapat dilengkapi apabila dibutuhkan.

4. HARGA
Nilai penawaran Rp 1.375.000.000 termasuk PPN, belum termasuk biaya pengiriman. Rincian harga terlampir.

5. K3
Perusahaan telah menerapkan prosedur K3 internal dan memiliki sertifikat SMK3 level 1. Dokumen ISO 14001 sedang dalam proses pengajuan.

6. JANGKA WAKTU
Waktu penyerahan 60 hari kalender sejak SPK diterbitkan.

7. GARANSI
Garansi 12 bulan terhadap cacat material.`,
  },
  {
    nama: "penawaran CV Jaya Pumpindo.txt",
    text: `PENAWARAN CV JAYA PUMPINDO
PENGADAAN SPARE PART POMPA SENTRIFUGAL NPK 2026

1. PENDAHULUAN
CV Jaya Pumpindo menyampaikan penawaran pengadaan spare part pompa sentrifugal NPK.

2. SPESIFIKASI TEKNIS
Kami menyediakan impeller, mechanical seal, dan bearing untuk pompa sentrifugal sesuai kebutuhan operasional. Spesifikasi detail komponen kami sesuaikan dengan kondisi pompa existing dan pengukuran di lapangan.

3. HARGA
Nilai penawaran Rp 985.000.000 termasuk PPN. Harga dapat dinegosiasikan.

4. JANGKA WAKTU
Waktu penyerahan 90 hari kalender setelah SPK diterbitkan.

5. K3
Kegiatan pengiriman memperhatikan ketentuan keselamatan kerja dasar. Sertifikat SMK3 dan ISO belum dimiliki perusahaan saat ini.`,
  },
];

/* ---------------- helpers ---------------- */

async function upsertDemoUsers() {
  let created = 0;
  const { data: existing } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const known = new Map((existing?.users ?? []).map((u) => [u.email, u]));

  for (const acc of DEMO_ACCOUNTS) {
    const user = known.get(acc.email);
    let userId = user?.id ?? null;

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: { full_name: acc.name, role: acc.role },
      });
      if (error) {
        log(`  ! ${acc.email}: ${error.message}`);
        continue;
      }
      userId = data.user?.id ?? null;
      created++;
    }

    if (userId) {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          { id: userId, full_name: acc.name, role: acc.role },
          { onConflict: "id" }
        );
      if (error) log(`  ! profile ${acc.email}: ${error.message}`);
      else log(`  akun ${acc.role.padEnd(10)} ${acc.email} siap`);
    }
  }
  log(`akun demo: ${created} baru dibuat, sisanya sudah ada`);
}

async function seedTenderAndDocs() {
  const { data: existing } = await supabase
    .from("tenders")
    .select("id, nomor_pr")
    .eq("nomor_pr", "PR-26-004821")
    .maybeSingle();

  let tenderId = existing?.id ?? null;

  if (!tenderId) {
    const { data, error } = await supabase
      .from("tenders")
      .insert({
        nama_pekerjaan: "Pengadaan Spare Part Pompa Sentrifugal NPK 2026",
        nomor_pr: "PR-26-004821",
        status: "aanwijzing",
      })
      .select("id")
      .single();
    if (error) throw error;
    tenderId = data.id;
    log("tender contoh dibuat");
  } else {
    log("tender contoh sudah ada");
  }

  const docs = [
    { jenis: "rks_tor" as const, nama_file: "RKS TOR Pengadaan Spare Part NPK 2026.txt", konten_text: RKS_TEXT },
    ...OFFERS.map((o) => ({
      jenis: "penawaran" as const,
      nama_file: o.nama,
      konten_text: o.text,
    })),
  ];

  for (const d of docs) {
    const { data: docExisting } = await supabase
      .from("documents")
      .select("id")
      .eq("tender_id", tenderId)
      .eq("nama_file", d.nama_file)
      .maybeSingle();

    let docId = docExisting?.id ?? null;
    if (!docId) {
      const { data, error } = await supabase
        .from("documents")
        .insert({
          tender_id: tenderId,
          jenis: d.jenis,
          nama_file: d.nama_file,
          konten_text: d.konten_text,
        })
        .select("id")
        .single();
      if (error) throw error;
      docId = data.id;
      log(`dokumen dibuat: ${d.nama_file}`);
    } else {
      log(`dokumen sudah ada: ${d.nama_file}`);
    }

    const { count } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("document_id", docId);

    if ((count ?? 0) === 0) {
      const full = { id: docId, tender_id: tenderId, nama_file: d.nama_file, jenis: d.jenis, konten_text: d.konten_text };
      const chunks = chunkDocument(full);
      const rows = chunks.map((c, i) => ({
        tender_id: tenderId,
        document_id: docId,
        content: c.content,
        sumber: c.sumber,
        embedding: mockEmbedding(c.content),
      }));
      const { error } = await supabase.from("document_chunks").insert(rows);
      if (error) throw error;
      log(`  chunk RAG dibuat: ${rows.length} chunk`);
    } else {
      log(`  chunk RAG sudah ada (${count})`);
    }
  }
}

/* ---------------- main ---------------- */

async function main() {
  log("Mulai seeding PATRAMIND...");
  await upsertDemoUsers();
  await seedTenderAndDocs();
  log("Selesai. Data demo siap digunakan.");
}

main().catch((e) => {
  console.error("[seed] Gagal:", e.message ?? e);
  process.exit(1);
});
