/* ============================================================
   PATRAMIND — Seed script (prototype)
   Membuat: akun demo 5 role, 1 tender contoh, dokumen RKS + 3
   penawaran vendor, chunk RAG, dan embedding.
   Jalankan:  npm run seed   (wajib .env.local sudah terisi)
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
import { DEMO_ACCOUNTS } from "../lib/constants";
import { chunkDocument, mockEmbedding } from "../lib/ai/rag";
import type {
  Aspect,
  AspectInput,
  AspectStatus,
  BaJson,
  ConsensusJson,
  QnaNote,
  TenderMode,
} from "../types";

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

const SUPPORT_DOCS: { nama: string; text: string }[] = [
  {
    nama: "Berita Acara Aanwijzing 2026.txt",
    text: `BERITA ACARA AANWIJZING
PENGADAAN SPARE PART POMPA SENTRIFUGAL NPK 2026
Nomor PR: PR-26-004821

1. PELAKSANAAN
Aanwijzing dilaksanakan secara daring pada hari Kamis, 12 Maret 2026, pukul 10.00-12.00 WIB, dipimpin oleh Panitia Pengadaan PT Pertamina Patra Niaga dan dihadiri 8 perwakilan calon penyedia.

2. JALANNYA SESI
Panitia menjelaskan lingkup pekerjaan, spesifikasi teknis utama (impeller, mechanical seal, bearing), HPS sebesar Rp 1.250.000.000, serta mekanisme evaluasi empat aspek (teknis, legal, harga, K3/SLA).

3. PERTANYAAN DAN JAWABAN
3.1 Apakah biaya pengiriman ke gudang Patra Niaga sudah termasuk dalam penawaran? Jawaban: Ya, biaya pengiriman ke gudang sudah termasuk dalam penawaran.
3.2 Apakah material certificate wajib dilampirkan saat penawaran? Jawaban: Wajib dilampirkan bersamaan dengan dokumen penawaran.
3.3 Apakah ada toleransi dimensi impeller? Jawaban: Toleransi mengikuti standar OEM, maksimal plus minus 1 mm.
3.4 Apakah garansi dihitung sejak barang diterima? Jawaban: Ya, garansi mutu 12 bulan sejak serah terima barang.
3.5 Bagaimana jika terjadi keterlambatan pengiriman? Jawaban: Berlaku ketentuan denda keterlambatan sesuai klausul kontrak.

4. PENUTUP
Peserta diharapkan menyampaikan penawaran sesuai ketentuan RKS beserta perubahan (jika ada) melalui addendum. Berita Acara ini menjadi lampiran resmi proses pengadaan.`,
  },
  {
    nama: "Addendum RKS Perubahan Waktu Penyerahan.txt",
    text: `ADDENDUM RKS
PENGADAAN SPARE PART POMPA SENTRIFUGAL NPK 2026
Nomor PR: PR-26-004821

1. DASAR
Addendum ini diterbitkan berdasarkan hasil klarifikasi pada proses aanwijzing tanggal 12 Maret 2026.

2. PERUBAHAN KETENTUAN
2.1 Waktu Penyerahan
Ketentuan waktu penyerahan maksimal 60 hari kalender diubah menjadi maksimal 75 hari kalender sejak Surat Perintah Kerja (SPK) diterbitkan, mempertimbangkan ketersediaan material impeller stainless steel 316L di pasar domestik.

2.2 Tempat Penyerahan
Penyerahan barang dilakukan di gudang PT Pertamina Patra Niaga, Jl. Raya Cilacap, Jawa Tengah, dengan jam kerja 08.00-16.00 WIB.

2.3 Dokumen Penawaran
Calon penyedia dapat menyampaikan pertanyaan tambahan secara tertulis paling lambat 3 hari kerja setelah addendum ini diterbitkan.

2.4 Jaminan Penawaran
Jaminan penawaran (bila dipersyaratkan) diterbitkan oleh bank umum dengan masa berlaku minimal 120 hari kalender.

3. KETENTUAN LAIN
Ketentuan selain yang diubah pada addendum ini tetap mengikuti RKS awal. Addendum ini merupakan satu kesatuan yang tidak terpisahkan dari RKS.`,
  },
  {
    nama: "Syarat K3 dan Lingkungan Pengiriman Barang.txt",
    text: `PERSYARATAN K3 DAN LINGKUNGAN
PENGIRIMAN DAN PENANGANAN BARANG
PENGADAAN SPARE PART POMPA SENTRIFUGAL NPK 2026

1. PERSYARATAN UMUM
Setiap penyedia wajib memenuhi ketentuan keselamatan dan kesehatan kerja (K3) serta pengelolaan lingkungan dalam seluruh rangkaian pengiriman dan penanganan barang.

2. PERSYARATAN SISTEM MANAJEMEN
2.1 Sertifikat SMK3 minimal level 2 atau setara.
2.2 Sistem manajemen lingkungan ISO 14001 atau setara.
2.3 Memiliki prosedur penanganan darurat (emergency response) untuk insiden di area pengiriman.

3. KETENTUAN OPERASIONAL
3.1 Pengemudi dan petugas penanganan barang wajib menggunakan APD lengkap (helm, sepatu safety, sarung tangan, rompi reflektif).
3.2 Kendaraan pengangkut wajib dalam kondisi laik jalan dan dilengkapi dokumen pengangkutan yang sah.
3.3 Barang berbahaya (bila ada) wajib dikemas sesuai klasifikasi dan diberi label sesuai ketentuan.

4. KETENTUAN LINGKUNGAN
4.1 Limbah kemasan (pallet, karton, plastik) wajib dikelola sesuai ketentuan pengelolaan limbah.
4.2 Dilarang membuang limbah pelumas atau bahan kimia ke lingkungan sekitar area pengiriman.

5. EVALUASI
Pemenuhan persyaratan K3 dan lingkungan menjadi bagian dari evaluasi aspek K3/SLA pada penilaian penawaran.`,
  },
];

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

const EXTRA_TENDERS: TenderSeed[] = [
  {
    nama_pekerjaan: "Pengadaan Jasa Kalibrasi Alat Ukur dan Instrumentasi 2026",
    nomor_pr: "PR-26-004812",
    klien: "Unit Operasional & Laboratorium — Pertamina Patra Niaga",
    nilai_kontrak: 450000000,
    deadline: "2026-06-10",
    pic: "Rina Kartika",
    status: "evaluasi",
    ringkasan:
      "Pengadaan jasa kalibrasi alat ukur dan instrumentasi 2026 senilai Rp450 juta untuk memastikan ketertelusuran pengukuran seluruh alat ukur proses. Tahap evaluasi sedang berjalan di Kolaborasi dengan 3 penawaran vendor yang dinilai oleh tim teknis, legal, harga, dan K3.",
    rks: {
      nama: "RKS TOR Jasa Kalibrasi Alat Ukur dan Instrumentasi 2026.txt",
      text: `RKS/TOR JASA KALIBRASI ALAT UKUR DAN INSTRUMENTASI 2026
NOMOR PR: PR-26-004812

1. PENDAHULUAN
Jasa kalibrasi alat ukur dan instrumentasi tahun 2026 bertujuan memastikan ketertelusuran pengukuran seluruh alat ukur proses di unit operasional.

2. LINGKUP PEKERJAAN
Kalibrasi flow meter (12 unit), pressure gauge (24 unit), temperature transmitter (16 unit), dan torque wrench (8 unit) yang tersebar di area produksi dan laboratorium.

3. PERSYARATAN LABORATORIUM
Laboratorium pelaksana wajib terakreditasi KAN ISO/IEC 17025, memiliki standar acuan yang tertelusur ke standar nasional/internasional, serta menerbitkan sertifikat kalibrasi yang diakui.

4. JADWAL PELAKSANAAN
Kalibrasi dilaksanakan dalam 30 hari kalender sejak SPK terbit, dengan prioritas pada unit pengukuran kritis.

5. MEKANISME EVALUASI
Penawaran dievaluasi dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA. HPS pengadaan ditetapkan sebesar Rp 450.000.000.`,
    },
    offers: [
      {
        nama: "penawaran PT Metrologi Nusantara.txt",
        text: `PENAWARAN PT METROLOGI NUSANTARA
JASA KALIBRASI ALAT UKUR DAN INSTRUMENTASI 2026

1. PENDAHULUAN
PT Metrologi Nusantara mengajukan penawaran jasa kalibrasi alat ukur dan instrumentasi.

2. KOMPETENSI LABORATORIUM
Laboratorium kami terakreditasi KAN ISO/IEC 17025 dengan ruang lingkup seluruh parameter yang diminta (flow, tekanan, temperatur, torsi) dan standar acuan tertelusur nasional.

3. HARGA PENAWARAN
Nilai penawaran Rp 425.000.000 termasuk PPN, pengambilan/pengantaran alat, dan penerbitan sertifikat kalibrasi.

4. JANGKA WAKTU
Pelaksanaan 14 hari kerja sejak SPK terbit; sertifikat kalibrasi diterbitkan maksimal 7 hari kerja setelah pelaksanaan.

5. K3 DAN SLA
Penerapan SMK3 level 3, prosedur penanganan alat ukur sensitif, dan jaminan rekalibrasi gratis apabila hasil di luar batas toleransi.`,
      },
      {
        nama: "penawaran PT Karya Kalibrasi Indonesia.txt",
        text: `PENAWARAN PT KARYA KALIBRASI INDONESIA
JASA KALIBRASI ALAT UKUR DAN INSTRUMENTASI 2026

1. PENDAHULUAN
PT Karya Kalibrasi Indonesia menyampaikan penawaran jasa kalibrasi.

2. KOMPETENSI
Kami memiliki laboratorium kalibrasi dengan akreditasi KAN untuk parameter tekanan dan temperatur; parameter flow dan torsi dilaksanakan di lokasi kilang dengan peralatan acuan tersertifikasi.

3. HARGA
Nilai penawaran Rp 398.000.000 termasuk PPN.

4. JANGKA WAKTU
Pelaksanaan 21 hari kerja sejak SPK terbit.

5. K3
Perusahaan memiliki sertifikat SMK3 level 2 dan prosedur kerja di area kilang sesuai ketentuan.`,
      },
      {
        nama: "penawaran CV Alat Ukur Prima.txt",
        text: `PENAWARAN CV ALAT UKUR PRIMA
JASA KALIBRASI ALAT UKUR DAN INSTRUMENTASI 2026

1. PENDAHULUAN
CV Alat Ukur Prima mengajukan penawaran jasa kalibrasi alat ukur dan instrumentasi.

2. LINGKUP
Kami melayani kalibrasi pressure gauge, temperature transmitter, flow meter, dan torque wrench, dilaksanakan secara onsite di lokasi kilang.

3. HARGA
Nilai penawaran Rp 515.000.000 termasuk PPN.

4. JANGKA WAKTU
Pelaksanaan 30 hari kerja sejak SPK terbit.

5. CATATAN
Akreditasi KAN laboratorium sedang dalam proses pengajuan; sertifikat kalibrasi diterbitkan berdasarkan standar acuan tersertifikasi.`,
      },
    ],
    supports: [
      {
        nama: "Berita Acara Aanwijzing Kalibrasi 2026.txt",
        text: `BERITA ACARA AANWIJZING
JASA KALIBRASI ALAT UKUR DAN INSTRUMENTASI 2026
Nomor PR: PR-26-004812

Aanwijzing dilaksanakan secara daring pada Rabu, 25 Maret 2026, pukul 14.00-15.30 WIB, dihadiri 6 perwakilan calon penyedia. Panitia menjelaskan lingkup kalibrasi 60 alat ukur, HPS Rp 450.000.000, dan keharusan akreditasi KAN.

PERTANYAAN DAN JAWABAN:
1. Apakah sertifikat kalibrasi wajib dari laboratorium terakreditasi KAN? Jawaban: Ya, wajib KAN ISO/IEC 17025.
2. Kapan sertifikat diterbitkan? Jawaban: Maksimal 7 hari kerja setelah pelaksanaan kalibrasi.
3. Apakah kalibrasi dapat dilakukan di lokasi kilang? Jawaban: Dapat, selama peralatan acuan tersertifikasi dan kondisi lingkungan memenuhi syarat.`,
      },
    ],
    ba: {
      status: "draft",
      qna: [
        {
          no: 1,
          pertanyaan: "Apakah sertifikat kalibrasi wajib dari laboratorium terakreditasi KAN?",
          jawaban: "Ya, wajib dari laboratorium terakreditasi KAN ISO/IEC 17025.",
        },
        {
          no: 2,
          pertanyaan: "Kapan sertifikat kalibrasi diterbitkan?",
          jawaban: "Maksimal 7 hari kerja setelah pelaksanaan kalibrasi.",
        },
        {
          no: 3,
          pertanyaan: "Apakah kalibrasi dapat dilakukan di lokasi kilang?",
          jawaban:
            "Dapat, selama peralatan acuan tersertifikasi dan kondisi lingkungan memenuhi syarat.",
        },
      ],
    },
  },
  {
    nama_pekerjaan: "Pengadaan Jasa Cleaning Tanki dan Pengelolaan Limbah B3 2026",
    nomor_pr: "PR-26-004788",
    klien: "Terminal BBM Cilacap — Pertamina Patra Niaga",
    nilai_kontrak: 2100000000,
    deadline: "2026-07-01",
    pic: "Agus Wijaya",
    status: "evaluasi",
    ringkasan:
      "Pengadaan jasa cleaning tanki dan pengelolaan limbah B3 2026 senilai Rp2,1 miliar untuk mendukung kesiapan operasional fasilitas penyimpanan produk. Pembersihan tanki timbun T-101 dan T-102 (water washing) plus pengelolaan limbah B3 oleh perusahaan berizin; tahap evaluasi penawaran di Kolaborasi.",
    rks: {
      nama: "RKS TOR Jasa Cleaning Tanki dan Pengelolaan Limbah B3 2026.txt",
      text: `RKS/TOR JASA CLEANING TANKI DAN PENGELOLAAN LIMBAH B3 2026
NOMOR PR: PR-26-004788

1. PENDAHULUAN
Jasa cleaning tanki dan pengelolaan limbah B3 tahun 2026 mendukung kesiapan operasional fasilitas penyimpanan produk di terminal.

2. LINGKUP PEKERJAAN
Pembersihan 2 tanki timbun (T-101 dan T-102) dengan metode water washing serta pengelolaan limbah B3 hasil cleaning oleh perusahaan pengelola limbah yang berizin.

3. PERSYARATAN K3
Pelaksana wajib melaksanakan gas free test sebelum pekerjaan, memiliki izin kerja (work permit), APD lengkap, serta prosedur tanggap darurat. Limbah B3 wajib ditangani sesuai ketentuan pengelolaan limbah.

4. JADWAL PELAKSANAAN
Pekerjaan dilaksanakan dalam 60 hari kalender sejak SPK terbit, termasuk mobilisasi dan demobilisasi peralatan.

5. MEKANISME EVALUASI
Penawaran dievaluasi dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA. HPS pengadaan ditetapkan sebesar Rp 2.100.000.000.`,
    },
    offers: [
      {
        nama: "penawaran PT Sarana Lingkungan Persada.txt",
        text: `PENAWARAN PT SARANA LINGKUNGAN PERSADA
JASA CLEANING TANKI DAN PENGELOLAAN LIMBAH B3 2026

1. PENDAHULUAN
PT Sarana Lingkungan Persada mengajukan penawaran jasa cleaning tanki dan pengelolaan limbah B3.

2. KOMPETENSI
Kami memiliki izin pengelolaan limbah B3 yang berlaku, pengalaman cleaning tanki di 5 terminal BBM, serta peralatan water washing dan vacuum tanker sendiri.

3. HARGA
Nilai penawaran Rp 1.985.000.000 termasuk PPN dan biaya pengelolaan limbah B3.

4. JANGKA WAKTU
Pelaksanaan 45 hari kalender sejak SPK terbit.

5. K3
Gas free test dilaksanakan oleh personel bersertifikat, work permit lengkap, dan prosedur tanggap darurat teruji.`,
      },
      {
        nama: "penawaran PT Mitra Bumi Sejahtera.txt",
        text: `PENAWARAN PT MITRA BUMI SEJAHTERA
JASA CLEANING TANKI DAN PENGELOLAAN LIMBAH B3 2026

1. PENDAHULUAN
PT Mitra Bumi Sejahtera menyampaikan penawaran jasa cleaning tanki.

2. KOMPETENSI
Perusahaan memiliki izin pengelolaan limbah B3, 10 kru operasional bersertifikat, dan pengalaman cleaning tanki di kilang dan terminal.

3. HARGA
Nilai penawaran Rp 2.045.000.000 termasuk PPN.

4. JANGKA WAKTU
Pelaksanaan 50 hari kalender sejak SPK terbit.

5. K3
Menerapkan SMK3 level 2, gas free test sebelum dan sesudah pekerjaan, serta pelaporan limbah sesuai ketentuan.`,
      },
      {
        nama: "penawaran CV Energi Bersih Mandiri.txt",
        text: `PENAWARAN CV ENERGI BERSIH MANDIRI
JASA CLEANING TANKI DAN PENGELOLAAN LIMBAH B3 2026

1. PENDAHULUAN
CV Energi Bersih Mandiri mengajukan penawaran jasa cleaning tanki dan pengelolaan limbah B3.

2. LINGKUP
Pembersihan tanki dengan metode water washing dan penanganan limbah B3 bekerja sama dengan perusahaan pengelola limbah berizin.

3. HARGA
Nilai penawaran Rp 1.580.000.000 termasuk PPN.

4. JANGKA WAKTU
Pelaksanaan 60 hari kalender sejak SPK terbit.

5. CATATAN
Izin pengelolaan limbah B3 perusahaan sedang dalam proses perpanjangan dan ditargetkan terbit sebelum pelaksanaan pekerjaan.`,
      },
    ],
    supports: [
      {
        nama: "Berita Acara Aanwijzing Cleaning Tanki 2026.txt",
        text: `BERITA ACARA AANWIJZING
JASA CLEANING TANKI DAN PENGELOLAAN LIMBAH B3 2026
Nomor PR: PR-26-004788

Aanwijzing dilaksanakan secara daring pada Kamis, 2 April 2026, pukul 09.00-11.00 WIB, dihadiri 7 perwakilan calon penyedia. Panitia menjelaskan lingkup cleaning 2 tanki timbun, HPS Rp 2.100.000.000, dan kewajiban gas free test.

PERTANYAAN DAN JAWABAN:
1. Metode cleaning apa yang diutamakan? Jawaban: Water washing secara cold work untuk meminimalkan risiko.
2. Bagaimana penanganan limbah B3? Jawaban: Ditimbang, didokumentasikan, dan dilaporkan ke pihak berwenang melalui PU berizin.
3. Kapan tanki dianggap selesai? Jawaban: Setelah diverifikasi dengan sertifikat gas free yang diterbitkan sebelum tanki diterima kembali.`,
      },
    ],
    ba: {
      status: "draft",
      qna: [
        {
          no: 1,
          pertanyaan: "Metode cleaning apa yang diutamakan?",
          jawaban: "Water washing secara cold work untuk meminimalkan risiko.",
        },
        {
          no: 2,
          pertanyaan: "Bagaimana penanganan limbah B3 hasil cleaning?",
          jawaban:
            "Limbah B3 ditimbang, didokumentasikan, dan dilaporkan ke pihak berwenang melalui pengelola limbah berizin.",
        },
        {
          no: 3,
          pertanyaan: "Kapan tanki dianggap selesai dikerjakan?",
          jawaban:
            "Setelah diverifikasi dengan sertifikat gas free yang diterbitkan sebelum tanki diterima kembali.",
        },
      ],
    },
  },
  {
    nama_pekerjaan: "Pengadaan Jasa Transportasi Distribusi BBM Regional Jawa Tengah 2026",
    nomor_pr: "PR-26-004745",
    klien: "Regional Jawa Tengah — Pertamina Patra Niaga",
    nilai_kontrak: 3750000000,
    deadline: "2026-06-30",
    pic: "Siti Rahayu",
    status: "draft",
    ringkasan:
      "Pengadaan jasa transportasi distribusi BBM Regional Jawa Tengah 2026 untuk memastikan pasokan premium, pertalite, dan solar dari terminal ke SPBU tepat waktu dan aman. Armada tangki 5.000–16.000 liter; masih tahap draft — siap dibuka ke tahap proses (pre-bid).",
    rks: {
      nama: "RKS TOR Jasa Transportasi Distribusi BBM Regional Jawa Tengah 2026.txt",
      text: `RKS/TOR JASA TRANSPORTASI DISTRIBUSI BBM REGIONAL JAWA TENGAH 2026
NOMOR PR: PR-26-004745

1. PENDAHULUAN
Jasa transportasi distribusi BBM regional Jawa Tengah tahun 2026 memastikan pasokan BBM ke SPBU tepat waktu dan aman.

2. LINGKUP PEKERJAAN
Pengangkutan BBM jenis premium, pertalite, dan solar menggunakan armada tangki kapasitas 5.000-16.000 liter dari terminal ke SPBU di wilayah Jawa Tengah.

3. PERSYARATAN ARMADA DAN DRIVER
Armada wajib laik jalan, memiliki izin angkutan, dilengkapi GPS tracking dan peralatan keselamatan. Driver wajib memiliki sertifikat pengemudi angkutan BBM dan memahami prosedur tanggap darurat.

4. SLA PENGIRIMAN
Ketepatan waktu pengiriman minimal 98% per bulan, dengan penggantian armada dalam 24 jam apabila terjadi kendala operasional.

5. MEKANISME EVALUASI
Penawaran dievaluasi dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA. HPS pengadaan ditetapkan sebesar Rp 3.750.000.000.`,
    },
    offers: [
      {
        nama: "penawaran PT Trans Patra Nusantara.txt",
        text: `PENAWARAN PT TRANS PATRA NUSANTARA
JASA TRANSPORTASI DISTRIBUSI BBM REGIONAL JAWA TENGAH 2026

1. PENDAHULUAN
PT Trans Patra Nusantara menyampaikan penawaran jasa transportasi distribusi BBM.

2. ARMADA
24 unit armada tangki kapasitas 5.000-16.000 liter, seluruhnya laik jalan dengan GPS tracking dan peralatan keselamatan lengkap.

3. HARGA
Nilai penawaran Rp 3.525.000.000 termasuk PPN untuk periode kontrak 12 bulan.

4. SLA
Ketepatan pengiriman 99% per bulan, penggantian armada dalam 24 jam, dan driver bersertifikat angkutan BBM.

5. K3
Penerapan SMK3 level 2 dan prosedur tanggap darurat pada setiap rute pengiriman.`,
      },
      {
        nama: "penawaran PT Mitra Logistik Energi.txt",
        text: `PENAWARAN PT MITRA LOGISTIK ENERGI
JASA TRANSPORTASI DISTRIBUSI BBM REGIONAL JAWA TENGAH 2026

1. PENDAHULUAN
PT Mitra Logistik Energi mengajukan penawaran jasa transportasi distribusi BBM.

2. ARMADA
20 unit armada tangki dengan GPS terintegrasi ke sistem pemantauan panitia dan peralatan keselamatan sesuai ketentuan.

3. HARGA
Nilai penawaran Rp 3.680.000.000 termasuk PPN untuk periode kontrak 12 bulan.

4. SLA
Ketepatan pengiriman 98% per bulan dengan dukungan armada cadangan di dua pool regional.

5. K3
Driver memiliki sertifikat pengemudi angkutan BBM dan pelatihan tanggap darurat berkala.`,
      },
      {
        nama: "penawaran CV Angkutan BBM Sejahtera.txt",
        text: `PENAWARAN CV ANGKUTAN BBM SEJAHTERA
JASA TRANSPORTASI DISTRIBUSI BBM REGIONAL JAWA TENGAH 2026

1. PENDAHULUAN
CV Angkutan BBM Sejahtera menyampaikan penawaran jasa transportasi distribusi BBM.

2. ARMADA
16 unit armada tangki berkapasitas 8.000-16.000 liter dengan izin angkutan yang berlaku.

3. HARGA
Nilai penawaran Rp 3.140.000.000 termasuk PPN untuk periode kontrak 12 bulan.

4. SLA
Ketepatan pengiriman 95% per bulan; penggantian armada dilakukan dalam 48 jam.

5. CATATAN
Sertifikasi pengemudi angkutan BBM sedang dilaksanakan untuk 30% dari total driver.`,
      },
    ],
    supports: [
      {
        nama: "Berita Acara Aanwijzing Transportasi BBM 2026.txt",
        text: `BERITA ACARA AANWIJZING
JASA TRANSPORTASI DISTRIBUSI BBM REGIONAL JAWA TENGAH 2026
Nomor PR: PR-26-004745

Aanwijzing dilaksanakan secara daring pada Kamis, 9 April 2026, pukul 10.00-12.00 WIB, dihadiri 9 perwakilan calon penyedia. Panitia menjelaskan lingkup distribusi ke 120 SPBU, HPS Rp 3.750.000.000, dan SLA ketepatan pengiriman 98%.

PERTANYAAN DAN JAWABAN:
1. Apakah armada wajib berlogo perusahaan penyedia? Jawaban: Ya, armada wajib berwarna standar dan berlogo perusahaan.
2. Siapa yang menanggung pemeliharaan armada? Jawaban: Pemeliharaan armada sepenuhnya tanggung jawab penyedia.
3. Bagaimana pemantauan perjalanan? Jawaban: Akses GPS diberikan kepada panitia selama masa kontrak.`,
      },
    ],
    ba: {
      status: "draft",
      qna: [
        {
          no: 1,
          pertanyaan: "Apakah armada wajib berlogo perusahaan penyedia?",
          jawaban: "Ya, armada wajib berwarna standar dan berlogo perusahaan.",
        },
        {
          no: 2,
          pertanyaan: "Siapa yang menanggung pemeliharaan armada?",
          jawaban: "Pemeliharaan armada sepenuhnya tanggung jawab penyedia.",
        },
        {
          no: 3,
          pertanyaan: "Bagaimana pemantauan perjalanan armada?",
          jawaban: "Akses GPS diberikan kepada panitia selama masa kontrak.",
        },
      ],
    },
  },
  {
    nama_pekerjaan: "Pengadaan Lomba KRTI TD 2026",
    nomor_pr: "PR-14-2026",
    klien: "Tim Development (TD) — Pertamina Patra Niaga",
    nilai_kontrak: 350000000,
    deadline: "2026-08-30",
    pic: "Andi Prasetyo",
    status: "evaluasi",
    ringkasan:
      "Pengadaan penyelenggaraan Lomba KRTI (Kreativitas, Riset, dan Teknologi Inovasi) TD 2026 senilai Rp350 juta: penyediaan venue, perangkat lomba, juri, dan produksi acara. Tahap evaluasi penawaran di Kolaborasi dengan 3 vendor penyedia jasa event.",
    rks: {
      nama: "RKS TOR Lomba KRTI TD 2026.txt",
      text: `RKS/TOR LOMBA KRTI TD 2026
NOMOR PR: PR-14-2026

1. PENDAHULUAN
Lomba Kreativitas, Riset, dan Teknologi Inovasi (KRTI) Tim Development 2026 diselenggarakan untuk mendorong inovasi teknologi di lingkungan perusahaan.

2. LINGKUP PEKERJAAN
Penyediaan venue lomba (3 hari), perangkat presentasi dan pameran, fasilitas juri, dokumentasi, serta produksi acara pembukaan dan penutupan.

3. PERSYARATAN
Penyedia wajib memiliki pengalaman minimal 3 event berskala nasional, sertifikasi keamanan pangan untuk catering, dan tim produksi minimal 10 orang.

4. MEKANISME EVALUASI
Penawaran dievaluasi dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA. HPS pengadaan ditetapkan sebesar Rp 350.000.000.`,
    },
    offers: [
      {
        nama: "penawaran PT Eventora Kreasi Nusantara.txt",
        text: `PENAWARAN PT EVENTORA KREASI NUSANTARA
LOMBA KRTI TD 2026

1. PENDAHULUAN
PT Eventora Kreasi Nusantara menyampaikan penawaran penyelenggaraan Lomba KRTI TD 2026.

2. SPESIFIKASI TEKNIS
Berpengalaman 5 event nasional. Menyediakan venue utama kapasitas 500 orang, 20 booth pameran, LED screen 6x3 meter, sistem sound 32 channel, dan dokumentasi 4K.

3. PENAWARAN HARGA
Total penawaran Rp 318.000.000 termasuk PPN, dengan rincian venue, produksi, juri, dan catering.

4. K3 DAN SLA
Sertifikasi K3 event, asuransi peserta, dan tim produksi 12 orang selama 3 hari pelaksanaan.`,
      },
      {
        nama: "penawaran CV Mitra Lomba Indonesia.txt",
        text: `PENAWARAN CV MITRA LOMBA INDONESIA
LOMBA KRTI TD 2026

1. PENDAHULUAN
CV Mitra Lomba Indonesia menyampaikan penawaran penyelenggaraan Lomba KRTI TD 2026.

2. SPESIFIKASI TEKNIS
Berpengalaman 3 event nasional. Menyediakan venue kapasitas 400 orang, 15 booth, proyektor 10K lumen, dan sistem sound 16 channel.

3. PENAWARAN HARGA
Total penawaran Rp 285.000.000 termasuk PPN.

4. K3 DAN SLA
Memiliki izin usaha event organizer dan asuransi acara. Tim produksi 10 orang.`,
      },
      {
        nama: "penawaran PT Cipta Panggung Nusantara.txt",
        text: `PENAWARAN PT CIPTA PANGGUNG NUSANTARA
LOMBA KRTI TD 2026

1. PENDAHULUAN
PT Cipta Panggung Nusantara menyampaikan penawaran penyelenggaraan Lomba KRTI TD 2026.

2. SPESIFIKASI TEKNIS
Berpengalaman 7 event nasional dan 2 event internasional. Menyediakan venue eksklusif kapasitas 600 orang, 25 booth, LED screen 8x4 meter, panggung 12x8 meter, dan live streaming.

3. PENAWARAN HARGA
Total penawaran Rp 342.000.000 termasuk PPN.

4. K3 DAN SLA
Sertifikasi K3 event, protokol keamanan lengkap, dan SLA respon 1x24 jam.`,
      },
    ],
    supports: [],
    ba: {
      status: "draft",
      qna: [
        {
          no: 1,
          pertanyaan: "Apakah venue harus berupa gedung khusus atau dapat hotel?",
          jawaban: "Dapat hotel/venue sejenis dengan kapasitas minimal 400 orang.",
        },
        {
          no: 2,
          pertanyaan: "Apakah catering termasuk dalam lingkup pekerjaan?",
          jawaban: "Ya, catering untuk peserta dan panitia termasuk dalam lingkup.",
        },
        {
          no: 3,
          pertanyaan: "Siapa yang menyediakan sistem penjurian digital?",
          jawaban: "Penyedia, termasuk perangkat dan operatornya.",
        },
      ],
    },
  },
  {
    nama_pekerjaan: "Penyelenggaraan Event K3 dan Simulasi Tanggap Darurat 2026",
    nomor_pr: "PR-26-003388",
    klien: "Tim HSSE — Pertamina Patra Niaga",
    nilai_kontrak: 500000000,
    deadline: "2026-07-15",
    pic: "Maya Puspita",
    status: "evaluasi",
    mode_evaluasi: "departemen",
    ringkasan:
      "Penyelenggaraan Event K3 dan Simulasi Tanggap Darurat 2026 senilai Rp500 juta: venue, booth pameran K3, workshop, dan simulasi tanggap darurat. Tender menggunakan mode departemen — penilaian dilakukan per departemen (K3, Teknis, Legal, Keuangan) dengan bobot masing-masing.",
    rks: {
      nama: "RKS TOR Event K3 dan Simulasi Tanggap Darurat 2026.txt",
      text: `RKS/TOR PENYELENGGARAAN EVENT K3 DAN SIMULASI TANGGAP DARURAT 2026
NOMOR PR: PR-26-003388

1. PENDAHULUAN
Event K3 dan Simulasi Tanggap Darurat 2026 diselenggarakan untuk meningkatkan budaya keselamatan kerja di lingkungan perusahaan.

2. LINGKUP PEKERJAAN
Penyediaan venue (2 hari), booth pameran K3 (25 booth), workshop keselamatan, simulasi tanggap darurat skala penuh, asuransi peserta, dan dokumentasi acara.

3. PERSYARATAN
Penyedia wajib memiliki pengalaman minimal 3 event K3/keselamatan, instruktur tersertifikasi, protokol K3 acara, dan asuransi untuk seluruh peserta.

4. MEKANISME EVALUASI
Penilaian dilakukan per departemen: K3/HSSE, Teknis, Legal, dan Keuangan dengan bobot K3 35%, Teknis 30%, Legal 20%, dan Keuangan 15%. HPS pengadaan ditetapkan sebesar Rp 500.000.000.`,
    },
    offers: [
      {
        nama: "penawaran PT Garuda Safety Event.txt",
        text: `PENAWARAN PT GARUDA SAFETY EVENT
EVENT K3 DAN SIMULASI TANGGAP DARURAT 2026

1. PENDAHULUAN
PT Garuda Safety Event menyampaikan penawaran penyelenggaraan Event K3 dan Simulasi Tanggap Darurat 2026.

2. SPESIFIKASI TEKNIS
Berpengalaman 6 event K3 nasional. Venue kapasitas 400 orang, 25 booth pameran, LED screen 6x3 meter, dan peralatan simulasi tanggap darurat lengkap (asap, peraga korban, unit evakuasi).

3. PENAWARAN HARGA
Total penawaran Rp 468.000.000 termasuk PPN, asuransi peserta, dan dokumentasi 4K.

4. K3 DAN SLA
Protokol K3 acara, tim instruktur tersertifikasi (12 orang), simulasi melibatkan tim internal perusahaan, dan SLA respon 1x24 jam.`,
      },
      {
        nama: "penawaran CV Andalan Mitra K3.txt",
        text: `PENAWARAN CV ANDALAN MITRA K3
EVENT K3 DAN SIMULASI TANGGAP DARURAT 2026

1. PENDAHULUAN
CV Andalan Mitra K3 mengajukan penawaran penyelenggaraan Event K3 dan Simulasi Tanggap Darurat 2026.

2. SPESIFIKASI TEKNIS
Berpengalaman 3 event K3. Venue kapasitas 350 orang, 20 booth, proyektor 10K lumen, dan peralatan simulasi dasar.

3. PENAWARAN HARGA
Total penawaran Rp 420.000.000 termasuk PPN.

4. K3 DAN SLA
Instruktur tersertifikasi 8 orang dan asuransi peserta disediakan. Tim internal dilibatkan pada simulasi.`,
      },
      {
        nama: "penawaran PT Patra Safety Nusantara.txt",
        text: `PENAWARAN PT PATRA SAFETY NUSANTARA
EVENT K3 DAN SIMULASI TANGGAP DARURAT 2026

1. PENDAHULUAN
PT Patra Safety Nusantara menyampaikan penawaran penyelenggaraan Event K3 dan Simulasi Tanggap Darurat 2026.

2. SPESIFIKASI TEKNIS
Berpengalaman 8 event K3 nasional dan pelatihan tanggap darurat di 4 kilang. Venue kapasitas 500 orang, 30 booth, dan simulasi skala penuh dengan unit pemadam internal.

3. PENAWARAN HARGA
Total penawaran Rp 485.000.000 termasuk PPN.

4. K3 DAN SLA
Protokol K3 lengkap, tim instruktur 15 orang tersertifikasi, asuransi peserta, dan dokumentasi 4K dengan live streaming.`,
      },
    ],
    supports: [
      {
        nama: "Berita Acara Aanwijzing Event K3 2026.txt",
        text: `BERITA ACARA AANWIJZING
EVENT K3 DAN SIMULASI TANGGAP DARURAT 2026
Nomor PR: PR-26-003388

Aanwijzing dilaksanakan secara daring pada Senin, 13 April 2026, pukul 10.00-12.00 WIB, dihadiri 6 perwakilan calon penyedia. Panitia menjelaskan lingkup event 2 hari, HPS Rp 500.000.000, dan bobot penilaian departemen (K3 35%, Teknis 30%, Legal 20%, Keuangan 15%).

PERTANYAAN DAN JAWABAN:
1. Apakah simulasi tanggap darurat wajib melibatkan tim internal perusahaan? Jawaban: Ya, tim internal dilibatkan sebagai peserta simulasi.
2. Apakah asuransi peserta acara ditanggung penyedia? Jawaban: Ya, penyedia wajib menyediakan asuransi untuk seluruh peserta.
3. Apakah dokumentasi acara wajib format 4K? Jawaban: Ya, dokumentasi foto dan video dengan kualitas minimum 4K.`,
      },
    ],
    ba: {
      status: "draft",
      qna: [
        {
          no: 1,
          pertanyaan: "Apakah simulasi tanggap darurat wajib melibatkan tim internal perusahaan?",
          jawaban: "Ya, tim internal dilibatkan sebagai peserta simulasi.",
        },
        {
          no: 2,
          pertanyaan: "Apakah asuransi peserta acara ditanggung penyedia?",
          jawaban: "Ya, penyedia wajib menyediakan asuransi untuk seluruh peserta.",
        },
        {
          no: 3,
          pertanyaan: "Apakah dokumentasi acara wajib format 4K?",
          jawaban: "Ya, dokumentasi foto dan video dengan kualitas minimum 4K.",
        },
      ],
    },
  },
  {
    nama_pekerjaan:
      "Jasa Maintenance dan Inspeksi Tangki Timbun T-201 T-202 Terminal BBM Semarang 2026",
    nomor_pr: "PR-26-004910",
    klien: "Terminal BBM Semarang — Pertamina Patra Niaga",
    nilai_kontrak: 2850000000,
    deadline: "2026-05-20",
    pic: "Hendra Gunawan",
    status: "diterima",
    ringkasan:
      "Jasa maintenance dan inspeksi tangki timbun T-201 dan T-202 Terminal BBM Semarang senilai Rp2,85 miliar telah selesai: evaluasi 4 aspek di Kolaborasi menghasilkan pemenang PT Inspeksi Tangki Indonesia (skor akhir 90), konsensus tertulis, dan Berita Acara final.",
    rks: {
      nama: "RKS TOR Jasa Maintenance dan Inspeksi Tangki Timbun 2026.txt",
      text: `RKS/TOR JASA MAINTENANCE DAN INSPEKSI TANGKI TIMBUN T-201 T-202 2026
NOMOR PR: PR-26-004910

1. PENDAHULUAN
Jasa maintenance dan inspeksi tangki timbun T-201 dan T-202 Terminal BBM Semarang tahun 2026 untuk menjamin integritas fasilitas penyimpanan produk.

2. LINGKUP PEKERJAAN
Inspeksi internal tangki sesuai API 653, pengujian ketebalan (UTM), maintenance coating internal, penggantian fitting dan gasket, serta hydrostatic test setelah pekerjaan.

3. PERSYARATAN
Inspektur wajib bersertifikat (API 653/CSWIP atau setara), peralatan NDT terkalibrasi, dan penyedia berpengalaman minimal 5 proyek inspeksi tangki.

4. JADWAL PELAKSANAAN
Pekerjaan dilaksanakan dalam 60 hari kalender sejak SPK terbit, disinkronkan dengan jadwal stop operasi terminal.

5. MEKANISME EVALUASI
Penawaran dievaluasi dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA. HPS pengadaan ditetapkan sebesar Rp 2.850.000.000.`,
    },
    offers: [
      {
        nama: "penawaran PT Inspeksi Tangki Indonesia.txt",
        text: `PENAWARAN PT INSPEKSI TANGKI INDONESIA
JASA MAINTENANCE DAN INSPEKSI TANGKI TIMBUN T-201 T-202 2026

1. PENDAHULUAN
PT Inspeksi Tangki Indonesia menyampaikan penawaran jasa maintenance dan inspeksi tangki timbun.

2. KOMPETENSI TEKNIS
Inspektur API 653 dan CSWIP (8 orang), pengalaman 12 proyek inspeksi tangki timbun, peralatan NDT milik sendiri dengan sertifikat kalibrasi berlaku.

3. HARGA PENAWARAN
Nilai penawaran Rp 2.680.000.000 termasuk PPN, seluruh biaya scaffolding, dan laporan inspeksi.

4. JANGKA WAKTU
Pelaksanaan 52 hari kalender sejak SPK terbit; laporan inspeksi maksimal 14 hari kerja setelah pekerjaan selesai.

5. K3
SMK3 level 2, izin kerja dan gas free test lengkap, prosedur tanggap darurat, serta pelaporan temuan inspeksi secara harian.`,
      },
      {
        nama: "penawaran PT Mandiri Tankindo Utama.txt",
        text: `PENAWARAN PT MANDIRI TANKINDO UTAMA
JASA MAINTENANCE DAN INSPEKSI TANGKI TIMBUN T-201 T-202 2026

1. PENDAHULUAN
PT Mandiri Tankindo Utama mengajukan penawaran jasa maintenance dan inspeksi tangki timbun.

2. KOMPETENSI TEKNIS
Inspektur bersertifikat API 653 (4 orang), pengalaman 6 proyek; peralatan NDT disewa dari pihak ketiga yang tersertifikasi.

3. HARGA PENAWARAN
Nilai penawaran Rp 2.410.000.000 termasuk PPN, merupakan penawaran terendah.

4. JANGKA WAKTU
Pelaksanaan 58 hari kalender sejak SPK terbit; laporan inspeksi maksimal 21 hari kerja setelah pekerjaan selesai.

5. K3
Prosedur izin kerja tersedia; sertifikat SMK3 level 1 dan pelatihan tanggap darurat dasar.`,
      },
      {
        nama: "penawaran CV Tangki Prima Sejahtera.txt",
        text: `PENAWARAN CV TANGKI PRIMA SEJAHTERA
JASA MAINTENANCE DAN INSPEKSI TANGKI TIMBUN T-201 T-202 2026

1. PENDAHULUAN
CV Tangki Prima Sejahtera menyampaikan penawaran jasa maintenance tangki timbun.

2. KOMPETENSI TEKNIS
Berpengalaman pada coating dan pekerjaan sipil tangki; inspektur API 653 sedang dalam proses sertifikasi (1 orang), peralatan NDT disewa.

3. HARGA PENAWARAN
Nilai penawaran Rp 2.890.000.000 termasuk PPN.

4. JANGKA WAKTU
Pelaksanaan 60 hari kalender sejak SPK terbit.

5. CATATAN
Pengalaman hydrostatic test skala besar belum pernah dilakukan; sertifikat SMK3 belum dimiliki.`,
      },
    ],
    supports: [
      {
        nama: "Berita Acara Aanwijzing Inspeksi Tangki 2026.txt",
        text: `BERITA ACARA AANWIJZING
JASA MAINTENANCE DAN INSPEKSI TANGKI TIMBUN T-201 T-202 2026
Nomor PR: PR-26-004910

Aanwijzing dilaksanakan secara daring pada Kamis, 16 April 2026, pukul 10.00-12.00 WIB, dihadiri 7 perwakilan calon penyedia. Panitia menjelaskan lingkup inspeksi internal 2 tangki timbun sesuai API 653, HPS Rp 2.850.000.000, dan evaluasi empat aspek.

PERTANYAAN DAN JAWABAN:
1. Apakah inspeksi internal menggunakan standar API 653? Jawaban: Ya, mengacu API 653 dengan tambahan persyaratan perusahaan.
2. Apakah laporan inspeksi wajib ditandatangani inspector bersertifikat? Jawaban: Wajib, minimal API 653/CSWIP atau setara.
3. Siapa yang menyediakan scaffolding dan akses masuk tangki? Jawaban: Penyedia, termasuk seluruh peralatan pendukung dan biayanya.`,
      },
    ],
    ba: {
      status: "final",
      qna: [
        {
          no: 1,
          pertanyaan: "Apakah inspeksi internal menggunakan standar API 653?",
          jawaban: "Ya, inspeksi internal mengacu pada API 653 dengan tambahan persyaratan dari perusahaan.",
        },
        {
          no: 2,
          pertanyaan: "Apakah laporan inspeksi wajib ditandatangani inspector bersertifikat?",
          jawaban: "Wajib, inspector minimal API 653/CSWIP atau setara dan laporan harus dapat dipertanggungjawabkan.",
        },
        {
          no: 3,
          pertanyaan: "Siapa yang menyediakan scaffolding dan akses masuk tangki?",
          jawaban: "Penyedia, termasuk seluruh peralatan pendukung dan biayanya.",
        },
      ],
      hasil: {
        nomor_ba: "BA-26-004910-01",
        ringkasan_pelaksanaan:
          "Aanwijzing dilaksanakan secara daring pada Kamis, 16 April 2026, pukul 10.00-12.00 WIB, dipimpin Panitia Pengadaan PT Pertamina Patra Niaga dan dihadiri 7 perwakilan calon penyedia. Panitia menjelaskan lingkup inspeksi dan maintenance 2 tangki timbun (T-201 dan T-202), HPS sebesar Rp 2.850.000.000, serta mekanisme evaluasi empat aspek.",
        poin_penjelasan: [
          "Lingkup pekerjaan: inspeksi internal T-201 dan T-202 sesuai API 653, pengujian ketebalan (UTM), maintenance coating internal, penggantian fitting dan gasket, serta hydrostatic test.",
          "HPS pengadaan ditetapkan sebesar Rp 2.850.000.000.",
          "Evaluasi dilakukan dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA.",
          "Waktu pelaksanaan maksimal 60 hari kalender sejak SPK terbit, disinkronkan dengan jadwal stop operasi terminal.",
        ],
        tanya_jawab: [
          {
            no: 1,
            pertanyaan: "Apakah inspeksi internal menggunakan standar API 653?",
            jawaban: "Ya, inspeksi internal mengacu pada API 653 dengan tambahan persyaratan dari perusahaan.",
          },
          {
            no: 2,
            pertanyaan: "Apakah laporan inspeksi wajib ditandatangani inspector bersertifikat?",
            jawaban: "Wajib, inspector minimal API 653/CSWIP atau setara dan laporan harus dapat dipertanggungjawabkan.",
          },
          {
            no: 3,
            pertanyaan: "Siapa yang menyediakan scaffolding dan akses masuk tangki?",
            jawaban: "Penyedia, termasuk seluruh peralatan pendukung dan biayanya.",
          },
        ],
        perubahan: [
          "Waktu penyerahan laporan inspeksi ditetapkan maksimal 14 hari kerja setelah pekerjaan selesai.",
          "Peralatan NDT wajib dikalibrasi dan sertifikatnya dilampirkan pada saat mobilisasi.",
        ],
        kesimpulan:
          "Peserta diharapkan menyampaikan penawaran sesuai ketentuan RKS; pertanyaan tambahan dapat diajukan paling lambat 3 hari kerja setelah addendum diterbitkan.",
      },
    },
    consensus: {
      "PT Inspeksi Tangki Indonesia": {
        kesimpulan:
          "Berdasarkan konsensus tertimbang seluruh aspek, PT Inspeksi Tangki Indonesia memberikan penawaran paling memenuhi spesifikasi teknis dengan skor akhir 90, harga kompetitif di bawah HPS, serta kepatuhan K3 yang tinggi.",
        poin_perhatian: [
          "Jadwal inspeksi perlu disinkronkan dengan rencana stop operasi terminal.",
          "Konfirmasi ketersediaan peralatan NDT di lokasi pekerjaan.",
          "Dokumen jaminan pelaksanaan wajib dilampirkan sebelum SPK diterbitkan.",
        ],
        rekomendasi: "Layak Dilanjutkan — direkomendasikan ditunjuk sebagai pemenang.",
        skor_akhir: 90,
      },
      "PT Mandiri Tankindo Utama": {
        kesimpulan:
          "PT Mandiri Tankindo Utama menawarkan harga terendah namun keunggulan teknis dan K3 lebih rendah dari pemenang; tetap layak sebagai cadangan.",
        poin_perhatian: [
          "Peralatan NDT disewa dari pihak ketiga — perlu verifikasi sertifikat kalibrasi.",
          "Sertifikasi inspektur terbatas (4 orang API 653).",
        ],
        rekomendasi: "Layak Dilanjutkan dengan syarat (cadangan).",
        skor_akhir: 84,
      },
      "CV Tangki Prima Sejahtera": {
        kesimpulan:
          "CV Tangki Prima Sejahtera tidak memenuhi persyaratan teknis minimum: inspektur belum bersertifikat, harga di atas HPS, dan tidak memiliki sertifikat SMK3.",
        poin_perhatian: [
          "Inspektur API 653 masih dalam proses sertifikasi.",
          "Nilai penawaran di atas HPS tanpa rincian yang memadai.",
        ],
        rekomendasi: "Tidak Layak.",
        skor_akhir: 60,
      },
    },
  },
  {
    nama_pekerjaan:
      "Pengadaan Spare Part Valve ASME B16.34 Terminal LPG Balongan 2026",
    nomor_pr: "PR-26-004955",
    klien: "Terminal LPG Balongan — Pertamina Patra Niaga",
    nilai_kontrak: 1850000000,
    deadline: "2026-09-15",
    pic: "Dewi Lestari",
    status: "proses",
    ringkasan:
      "Pengadaan spare part valve ASME B16.34 Terminal LPG Balongan 2026 senilai Rp1,85 miliar untuk kebutuhan maintenance jalur proses LPG. Tender berada pada tahap proses/pre-bid: sesi aanwijzing telah berjalan dan Berita Acara siap digenerate.",
    rks: {
      nama: "RKS TOR Pengadaan Spare Part Valve ASME B16.34 2026.txt",
      text: `RKS/TOR PENGADAAN SPARE PART VALVE ASME B16.34 2026
NOMOR PR: PR-26-004955

1. PENDAHULUAN
Pengadaan spare part valve ASME B16.34 tahun 2026 untuk mendukung kegiatan maintenance jalur proses LPG di Terminal LPG Balongan.

2. SPESIFIKASI TEKNIS
Valve gate, globe, dan ball kelas 150-600 lbs; body material CF8M dan LCB; uji hidrostatik sesuai API 598; ball valve wajib lulus uji emisi fugitive ISO 10497; serta dimensi dan toleransi sesuai ASME B16.34 dan B16.10.

3. PERSYARATAN MUTU
Setiap valve wajib dilengkapi material certificate, sertifikat pengujian (API 598), dan hasil uji emisi fugitive untuk kategori ball valve area proses.

4. JADWAL PENYERAHAN
Penyerahan maksimal 90 hari kalender sejak SPK terbit ke gudang Terminal LPG Balongan.

5. MEKANISME EVALUASI
Penawaran dievaluasi dalam empat aspek: teknis, legal/administrasi, harga, dan K3/SLA. HPS pengadaan ditetapkan sebesar Rp 1.850.000.000.`,
    },
    offers: [
      {
        nama: "penawaran PT Valveindo Sukses.txt",
        text: `PENAWARAN PT VALVEINDO SUKSES
SPARE PART VALVE ASME B16.34 2026

1. PENDAHULUAN
PT Valveindo Sukses menyampaikan penawaran pengadaan spare part valve ASME B16.34.

2. SPESIFIKASI TEKNIS
Seluruh valve (gate, globe, ball) kelas 150-600 lbs dengan body CF8M dan LCB sesuai spesifikasi, uji hidrostatik API 598, dan sertifikat uji emisi fugitive ISO 10497 untuk ball valve lengkap.

3. PERSYARATAN ADMINISTRASI
NPWP, NIB, akta pendirian, dan dokumen domisili berlaku; melampirkan surat kuasa penandatanganan.

4. HARGA PENAWARAN
Nilai penawaran Rp 1.720.000.000 termasuk PPN dan biaya pengiriman ke Terminal LPG Balongan.

5. JANGKA WAKTU
Waktu penyerahan 75 hari kalender sejak SPK terbit.

6. JAMINAN
Garansi 12 bulan dan jaminan ketersediaan suku cadang 5 tahun.`,
      },
      {
        nama: "penawaran PT Karya Baja Prima.txt",
        text: `PENAWARAN PT KARYA BAJA PRIMA
SPARE PART VALVE ASME B16.34 2026

1. PENDAHULUAN
PT Karya Baja Prima mengajukan penawaran pengadaan spare part valve ASME B16.34.

2. SPESIFIKASI TEKNIS
Menyediakan valve kelas 150-600 lbs sesuai dimensi ASME B16.34; uji hidrostatik API 598 dilaksanakan di workshop; sertifikat uji emisi fugitive ISO 10497 menyusul setelah pesanan dikonfirmasi.

3. HARGA PENAWARAN
Nilai penawaran Rp 1.590.000.000 termasuk PPN, merupakan penawaran terendah.

4. JANGKA WAKTU
Waktu penyerahan 85 hari kalender sejak SPK terbit.

5. K3
Prosedur pengiriman memperhatikan ketentuan keselamatan dasar; SMK3 level 1.`,
      },
      {
        nama: "penawaran CV Logamindo Jaya.txt",
        text: `PENAWARAN CV LOGAMINDO JAYA
SPARE PART VALVE ASME B16.34 2026

1. PENDAHULUAN
CV Logamindo Jaya menyampaikan penawaran pengadaan spare part valve.

2. SPESIFIKASI TEKNIS
Menyediakan valve gate, globe, dan ball sesuai kebutuhan; spesifikasi detail material disesuaikan dengan kondisi lapangan.

3. HARGA PENAWARAN
Nilai penawaran Rp 1.850.000.000 termasuk PPN.

4. JANGKA WAKTU
Waktu penyerahan 90 hari kalender sejak SPK terbit.

5. CATATAN
Material certificate dan sertifikat pengujian diserahkan bersamaan dengan barang.`,
      },
    ],
    supports: [
      {
        nama: "Berita Acara Aanwijzing Valve LPG 2026.txt",
        text: `BERITA ACARA AANWIJZING
PENGADAAN SPARE PART VALVE ASME B16.34 2026
Nomor PR: PR-26-004955

Aanwijzing dilaksanakan secara daring pada Rabu, 13 Mei 2026, pukul 09.00-11.00 WIB, dihadiri 8 perwakilan calon penyedia. Panitia menjelaskan spesifikasi valve kelas 150-600 lbs, HPS Rp 1.850.000.000, dan kewajiban uji emisi fugitive ISO 10497.

PERTANYAAN DAN JAWABAN:
1. Apakah sertifikat ISO 10497 fugitive emission wajib dilampirkan? Jawaban: Ya, wajib untuk ball valve di area proses.
2. Apakah pengujian API 598 dapat dilakukan di workshop penyedia? Jawaban: Dapat, jika workshop terverifikasi atau pihak ketiga yang disetujui panitia.
3. Apakah harga sudah termasuk biaya pengiriman ke Terminal LPG Balongan? Jawaban: Ya, termasuk biaya pengiriman ke Terminal LPG Balongan.`,
      },
    ],
    ba: {
      status: "draft",
      qna: [
        {
          no: 1,
          pertanyaan: "Apakah sertifikat ISO 10497 fugitive emission wajib dilampirkan?",
          jawaban: "Ya, wajib untuk ball valve di area proses.",
        },
        {
          no: 2,
          pertanyaan: "Apakah pengujian API 598 dapat dilakukan di workshop penyedia?",
          jawaban: "Dapat, jika workshop terverifikasi atau pihak ketiga yang disetujui panitia.",
        },
        {
          no: 3,
          pertanyaan: "Apakah harga sudah termasuk biaya pengiriman ke Terminal LPG Balongan?",
          jawaban: "Ya, termasuk biaya pengiriman ke Terminal LPG Balongan.",
        },
      ],
    },
  },
];

/* ---------------- helpers ---------------- */

type TenderSeed = {
  nama_pekerjaan: string;
  nomor_pr: string;
  klien: string;
  nilai_kontrak: number;
  deadline: string;
  pic: string;
  status: string;
  ringkasan: string;
  mode_evaluasi?: TenderMode;
  rks: { nama: string; text: string };
  offers: { nama: string; text: string }[];
  supports: { nama: string; text: string }[];
  ba?: { qna: QnaNote[]; hasil?: BaJson; status: "draft" | "final" };
  consensus?: Record<string, ConsensusJson>;
};

function ai(
  analysis: string,
  skor: number,
  status: AspectStatus,
  sesuai: string[],
  kurang: string[] = [],
  catatan: string[] = [],
  analyzed_at = "2026-06-05T09:00:00.000Z"
): AspectInput {
  return {
    analysis,
    catatan: catatan.join(" "),
    status,
    skor,
    poin: { sesuai, kurang, catatan },
    analyzed_at,
  };
}

/* ---------------- data evaluasi awal (mode aspek) ----------------
   Key vendor = nama yang diturunkan dari nama file penawaran
   ("penawaran PT X.txt" -> "PT X"). Skor bervariasi agar hasil
   evaluasi tidak seragam: ada unggul teknis, unggul harga, dan lemah. */

const ASPECT_EVAL_SEEDS: Record<
  string,
  Record<string, Partial<Record<Aspect, AspectInput>>>
> = {
  "PR-26-004812": {
    "PT Metrologi Nusantara": {
      teknis: ai(
        "Laboratorium terakreditasi KAN ISO/IEC 17025 mencakup seluruh parameter yang diminta (flow, tekanan, temperatur, torsi) dengan standar acuan tertelusur nasional; jadwal pelaksanaan 14 hari kerja memenuhi batas 30 hari kalender.",
        92,
        "dinilai",
        [
          "Akreditasi KAN ISO/IEC 17025 mencakup seluruh parameter yang diminta",
          "Standar acuan tertelusur ke standar nasional",
          "Jadwal pelaksanaan 14 hari kerja, lebih cepat dari batas 30 hari",
        ],
        [],
        ["Sertifikat kalibrasi diterbitkan maksimal 7 hari kerja setelah pelaksanaan"],
        "2026-05-28T09:00:00.000Z"
      ),
      legal: ai(
        "Kelengkapan administrasi PT Metrologi Nusantara lengkap: NPWP, NIB, akta pendirian, TDP, dan surat domisili seluruhnya masih berlaku; surat kuasa penandatanganan dilampirkan.",
        88,
        "dinilai",
        [
          "NPWP, NIB, akta pendirian, dan domisili lengkap dan berlaku",
          "Surat kuasa penandatanganan dokumen penawaran terlampir",
        ],
        [],
        ["Tidak ada temuan administrasi yang signifikan"],
        "2026-05-28T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 425.000.000 termasuk PPN berada di bawah HPS Rp 450.000.000, dengan rincian meliputi pengambilan/pengantaran alat dan penerbitan sertifikat kalibrasi.",
        85,
        "dinilai",
        [
          "Nilai penawaran di bawah HPS",
          "Rincian komponen biaya lengkap termasuk PPN",
        ],
        [],
        ["Margin harga wajar dibanding penawaran lain"],
        "2026-05-28T09:00:00.000Z"
      ),
      k3: ai(
        "Penerapan SMK3 level 3, prosedur penanganan alat ukur sensitif, dan jaminan rekalibrasi gratis apabila hasil di luar batas toleransi; dokumen ISO 14001 terdokumentasi.",
        90,
        "dinilai",
        [
          "Sertifikat SMK3 level 3",
          "Prosedur penanganan alat ukur sensitif terdokumentasi",
          "Jaminan rekalibrasi gratis untuk hasil di luar toleransi",
        ],
        [],
        [],
        "2026-05-28T09:00:00.000Z"
      ),
    },
    "PT Karya Kalibrasi Indonesia": {
      teknis: ai(
        "Akreditasi KAN baru mencakup parameter tekanan dan temperatur; parameter flow dan torsi dilaksanakan di lokasi kilang dengan peralatan acuan tersertifikasi — perlu verifikasi kualifikasi personel di lapangan.",
        78,
        "dinilai",
        [
          "Akreditasi KAN untuk parameter tekanan dan temperatur",
          "Peralatan acuan tersertifikasi untuk parameter flow dan torsi",
        ],
        [
          "Ruang lingkup akreditasi belum mencakup seluruh parameter yang diminta",
        ],
        ["Verifikasi personel pelaksana di lokasi kilang diperlukan"],
        "2026-05-28T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen legal perusahaan lengkap dan berlaku; badan usaha PT dengan pengalaman jasa kalibrasi pada sektor industri.",
        85,
        "dinilai",
        ["NPWP, NIB, dan akta pendirian berlaku", "Pengalaman jasa kalibrasi sektor industri"],
        [],
        [],
        "2026-05-28T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 398.000.000 termasuk PPN merupakan penawaran terendah di bawah HPS Rp 450.000.000, dengan komponen biaya yang wajar.",
        95,
        "dinilai",
        [
          "Nilai penawaran terendah di antara seluruh peserta",
          "Penawaran di bawah HPS dengan rincian wajar",
        ],
        [],
        ["Perlu dipastikan tidak ada biaya tambahan di luar cakupan RKS"],
        "2026-05-28T09:00:00.000Z"
      ),
      k3: ai(
        "Perusahaan memiliki sertifikat SMK3 level 2 dan prosedur kerja di area kilang sesuai ketentuan; catatan kecil pada cakupan pelatihan tanggap darurat.",
        80,
        "dinilai",
        ["Sertifikat SMK3 level 2", "Prosedur kerja di area kilang terdokumentasi"],
        [],
        ["Pelatihan tanggap darurat untuk kru lapangan perlu diperluas"],
        "2026-05-28T09:00:00.000Z"
      ),
    },
    "CV Alat Ukur Prima": {
      teknis: ai(
        "Akreditasi KAN laboratorium masih dalam proses pengajuan; sertifikat kalibrasi diterbitkan berdasarkan standar acuan tersertifikasi — belum setara dengan persyaratan KAN yang wajib.",
        55,
        "perlu_klarifikasi",
        ["Melayani seluruh parameter yang diminta secara onsite"],
        [
          "Akreditasi KAN laboratorium masih dalam proses pengajuan",
          "Sertifikat kalibrasi belum dijamin terbit dari laboratorium terakreditasi KAN",
        ],
        ["Perlu klarifikasi status akreditasi sebelum penunjukan"],
        "2026-05-28T09:00:00.000Z"
      ),
      legal: ai(
        "Kelengkapan administrasi dasar tersedia; badan usaha CV dengan dokumen yang masih berlaku.",
        70,
        "dinilai",
        ["NPWP, NIB, dan domisili berlaku"],
        [],
        ["Lampiran surat kuasa belum disertakan"],
        "2026-05-28T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 515.000.000 termasuk PPN berada di atas HPS Rp 450.000.000 tanpa rincian komponen biaya yang memadai.",
        40,
        "belum_dinilai",
        [],
        [
          "Nilai penawaran di atas HPS",
          "Rincian komponen biaya tidak disertakan",
        ],
        ["Penawaran tidak wajar secara harga"],
        "2026-05-28T09:00:00.000Z"
      ),
      k3: ai(
        "Prosedur K3 dasar dilaksanakan; sertifikasi SMK3 dan pelatihan personel belum dapat diverifikasi dari dokumen penawaran.",
        60,
        "perlu_klarifikasi",
        ["Prosedur kerja dasar di area kilang disebutkan"],
        [
          "Sertifikat SMK3 tidak dilampirkan",
          "Sertifikasi personel kalibrasi belum dapat diverifikasi",
        ],
        [],
        "2026-05-28T09:00:00.000Z"
      ),
    },
  },
  "PR-26-004788": {
    "PT Sarana Lingkungan Persada": {
      teknis: ai(
        "Izin pengelolaan limbah B3 berlaku, pengalaman cleaning tanki di 5 terminal BBM, serta peralatan water washing dan vacuum tanker milik sendiri; jadwal 45 hari kalender memenuhi batas 60 hari.",
        90,
        "dinilai",
        [
          "Izin pengelolaan limbah B3 berlaku",
          "Pengalaman cleaning tanki di 5 terminal BBM",
          "Peralatan water washing dan vacuum tanker milik sendiri",
        ],
        [],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen legal lengkap termasuk izin pengelolaan limbah B3, akta, NPWP, dan NIB yang seluruhnya masih berlaku.",
        88,
        "dinilai",
        ["Izin pengelolaan limbah B3 berlaku", "NPWP, NIB, dan akta lengkap"],
        [],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 1.985.000.000 termasuk PPN dan biaya pengelolaan limbah B3 berada di bawah HPS Rp 2.100.000.000 dengan rincian wajar.",
        82,
        "dinilai",
        ["Nilai penawaran di bawah HPS", "Biaya pengelolaan limbah B3 termasuk dalam penawaran"],
        [],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
      k3: ai(
        "Gas free test dilaksanakan oleh personel bersertifikat, work permit lengkap, dan prosedur tanggap darurat teruji pada pekerjaan sebelumnya.",
        92,
        "dinilai",
        [
          "Personel gas free test bersertifikat",
          "Prosedur work permit dan tanggap darurat lengkap",
        ],
        [],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
    },
    "PT Mitra Bumi Sejahtera": {
      teknis: ai(
        "Izin pengelolaan limbah B3 tersedia, 10 kru operasional bersertifikat, dan pengalaman cleaning tanki di kilang dan terminal; jadwal 50 hari kalender memenuhi batas.",
        80,
        "dinilai",
        ["Izin pengelolaan limbah B3 tersedia", "10 kru operasional bersertifikat"],
        [],
        ["Pengalaman di terminal perlu dilengkapi referensi klien"],
        "2026-06-03T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen administrasi lengkap dan berlaku; tidak ada temuan material pada aspek legal.",
        85,
        "dinilai",
        ["NPWP, NIB, akta, dan izin B3 lengkap"],
        [],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 2.045.000.000 termasuk PPN di bawah HPS namun lebih tinggi dari peserta lain; rincian biaya wajar.",
        78,
        "dinilai",
        ["Penawaran di bawah HPS"],
        ["Nilai penawaran lebih tinggi dari peserta lain dengan lingkup setara"],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
      k3: ai(
        "Menerapkan SMK3 level 2, gas free test sebelum dan sesudah pekerjaan, serta pelaporan limbah sesuai ketentuan.",
        85,
        "dinilai",
        ["SMK3 level 2", "Gas free test sebelum dan sesudah pekerjaan"],
        [],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
    },
    "CV Energi Bersih Mandiri": {
      teknis: ai(
        "Metode water washing sesuai RKS, namun penanganan limbah B3 bergantung pada perusahaan pengelola limbah mitra karena izin sendiri masih dalam proses perpanjangan.",
        70,
        "dinilai",
        ["Metode water washing sesuai ketentuan RKS"],
        ["Penanganan limbah B3 bergantung pada pihak ketiga"],
        [],
        "2026-06-03T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen dasar tersedia; izin pengelolaan limbah B3 perusahaan sedang dalam proses perpanjangan dan ditargetkan terbit sebelum pelaksanaan.",
        75,
        "dinilai",
        ["NPWP, NIB, dan akta berlaku"],
        ["Izin pengelolaan limbah B3 belum terbit (masih perpanjangan)"],
        ["Status izin perlu dipantau sampai terbit"],
        "2026-06-03T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 1.580.000.000 termasuk PPN merupakan penawaran terendah, signifikan di bawah HPS Rp 2.100.000.000.",
        95,
        "dinilai",
        ["Nilai penawaran terendah di antara seluruh peserta"],
        [],
        ["Perlu pengecekan kewajaran karena jauh di bawah penawaran lain"],
        "2026-06-03T09:00:00.000Z"
      ),
      k3: ai(
        "Kepatuhan K3 belum dapat dipastikan: sertifikat SMK3 tidak dilampirkan dan prosedur tanggap darurat tidak dijelaskan dalam penawaran.",
        55,
        "perlu_klarifikasi",
        [],
        [
          "Sertifikat SMK3 tidak dilampirkan",
          "Prosedur tanggap darurat tidak dijelaskan",
        ],
        ["Klarifikasi wajib sebelum evaluasi lanjut"],
        "2026-06-03T09:00:00.000Z"
      ),
    },
  },
  "PR-14-2026": {
    "PT Eventora Kreasi Nusantara": {
      teknis: ai(
        "Berpengalaman 5 event nasional; venue kapasitas 500 orang, 20 booth pameran, LED screen 6x3 meter, sistem sound 32 channel, dan dokumentasi 4K sesuai kebutuhan acara.",
        85,
        "dinilai",
        [
          "Pengalaman 5 event berskala nasional",
          "Venue kapasitas 500 orang dan 20 booth sesuai rencana",
          "Dokumentasi 4K dan sound 32 channel",
        ],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      legal: ai(
        "Kelengkapan legal event organizer lengkap termasuk izin usaha dan dokumen perusahaan yang berlaku.",
        88,
        "dinilai",
        ["Izin usaha event organizer lengkap", "NPWP, NIB, dan akta berlaku"],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      harga: ai(
        "Total penawaran Rp 318.000.000 termasuk PPN di bawah HPS Rp 350.000.000 dengan rincian venue, produksi, juri, dan catering.",
        84,
        "dinilai",
        ["Penawaran di bawah HPS", "Rincian komponen biaya disertakan"],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      k3: ai(
        "Sertifikasi K3 event, asuransi peserta, dan tim produksi 12 orang selama 3 hari pelaksanaan tersedia.",
        82,
        "dinilai",
        ["Sertifikasi K3 event", "Asuransi peserta disediakan"],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
    },
    "CV Mitra Lomba Indonesia": {
      teknis: ai(
        "Berpengalaman 3 event nasional; venue kapasitas 400 orang, 15 booth, proyektor 10K lumen, dan sound 16 channel — memenuhi kebutuhan namun lebih sederhana dari peserta lain.",
        72,
        "dinilai",
        ["Pengalaman 3 event nasional"],
        ["Kapasitas venue dan booth di bawah rencana acara"],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen legal dasar lengkap; badan usaha CV dengan izin usaha event organizer yang berlaku.",
        80,
        "dinilai",
        ["Izin usaha event organizer berlaku", "NPWP, NIB, dan akta lengkap"],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      harga: ai(
        "Total penawaran Rp 285.000.000 termasuk PPN merupakan penawaran terendah, di bawah HPS Rp 350.000.000.",
        95,
        "dinilai",
        ["Nilai penawaran terendah"],
        [],
        ["Perlu verifikasi rincian biaya catering dan produksi"],
        "2026-06-10T09:00:00.000Z"
      ),
      k3: ai(
        "Memiliki izin usaha dan asuransi acara; tim produksi 10 orang sesuai persyaratan minimum.",
        75,
        "dinilai",
        ["Asuransi acara disediakan"],
        ["Sertifikasi K3 event tidak disebutkan"],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
    },
    "PT Cipta Panggung Nusantara": {
      teknis: ai(
        "Berpengalaman 7 event nasional dan 2 internasional; venue eksklusif kapasitas 600 orang, 25 booth, LED screen 8x4 meter, panggung 12x8 meter, dan live streaming — paling lengkap secara teknis.",
        95,
        "dinilai",
        [
          "Pengalaman 7 event nasional dan 2 internasional",
          "Venue 600 orang dan 25 booth melebihi kebutuhan",
          "LED screen, panggung besar, dan live streaming",
        ],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      legal: ai(
        "Kelengkapan legal sangat baik termasuk izin usaha dan dokumen pendukung lengkap.",
        90,
        "dinilai",
        ["Izin usaha lengkap", "Dokumen administrasi tanpa temuan"],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      harga: ai(
        "Total penawaran Rp 342.000.000 termasuk PPN berada di bawah HPS namun paling tinggi di antara peserta, sejalan dengan cakupan teknis terlengkap.",
        78,
        "dinilai",
        ["Penawaran masih di bawah HPS"],
        ["Nilai penawaran tertinggi di antara peserta"],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
      k3: ai(
        "Sertifikasi K3 event, protokol keamanan lengkap, dan SLA respon 1x24 jam tersedia.",
        88,
        "dinilai",
        ["Sertifikasi K3 event", "Protokol keamanan lengkap", "SLA respon 1x24 jam"],
        [],
        [],
        "2026-06-10T09:00:00.000Z"
      ),
    },
  },
  "PR-26-004910": {
    "PT Inspeksi Tangki Indonesia": {
      teknis: ai(
        "Inspektur API 653 dan CSWIP (8 orang), pengalaman 12 proyek inspeksi tangki timbun, peralatan NDT milik sendiri dengan sertifikat kalibrasi berlaku; jadwal 52 hari kalender memenuhi batas 60 hari.",
        93,
        "dinilai",
        [
          "Inspektur bersertifikat API 653 dan CSWIP (8 orang)",
          "Pengalaman 12 proyek inspeksi tangki timbun",
          "Peralatan NDT milik sendiri dengan sertifikat kalibrasi berlaku",
        ],
        [],
        ["Laporan inspeksi maksimal 14 hari kerja setelah pekerjaan selesai"],
        "2026-05-02T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen legal lengkap dan berlaku: NPWP, NIB, akta pendirian, TDP, dan domisili; badan usaha PT dengan rekam jejak jasa inspeksi.",
        90,
        "dinilai",
        ["NPWP, NIB, akta pendirian, dan domisili lengkap"],
        [],
        [],
        "2026-05-02T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 2.680.000.000 termasuk PPN, scaffolding, dan laporan inspeksi — di bawah HPS Rp 2.850.000.000 dengan rincian wajar.",
        86,
        "dinilai",
        ["Penawaran di bawah HPS", "Seluruh biaya scaffolding termasuk dalam penawaran"],
        [],
        [],
        "2026-05-02T09:00:00.000Z"
      ),
      k3: ai(
        "SMK3 level 2, izin kerja dan gas free test lengkap, prosedur tanggap darurat, serta pelaporan temuan inspeksi secara harian.",
        91,
        "dinilai",
        ["SMK3 level 2", "Izin kerja dan gas free test lengkap", "Pelaporan temuan inspeksi harian"],
        [],
        [],
        "2026-05-02T09:00:00.000Z"
      ),
    },
    "PT Mandiri Tankindo Utama": {
      teknis: ai(
        "Inspektur bersertifikat API 653 (4 orang) dan pengalaman 6 proyek; peralatan NDT disewa dari pihak ketiga yang tersertifikasi — kapasitas cukup namun lebih terbatas dari pemenang.",
        82,
        "dinilai",
        ["Inspektur API 653 tersedia (4 orang)", "Pengalaman 6 proyek inspeksi tangki"],
        ["Peralatan NDT disewa dari pihak ketiga"],
        ["Verifikasi sertifikat kalibrasi peralatan NDT pihak ketiga"],
        "2026-05-02T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen administrasi lengkap dan berlaku; tidak ada temuan material pada aspek legal.",
        85,
        "dinilai",
        ["NPWP, NIB, dan akta lengkap"],
        [],
        [],
        "2026-05-02T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 2.410.000.000 termasuk PPN merupakan penawaran terendah, signifikan di bawah HPS Rp 2.850.000.000.",
        94,
        "dinilai",
        ["Nilai penawaran terendah di antara seluruh peserta"],
        [],
        ["Perlu pengecekan kewajaran komponen biaya"],
        "2026-05-02T09:00:00.000Z"
      ),
      k3: ai(
        "Prosedur izin kerja tersedia; sertifikat SMK3 level 1 dan pelatihan tanggap darurat dasar — kepatuhan K3 cukup namun di bawah standar tertinggi.",
        78,
        "dinilai",
        ["Prosedur izin kerja tersedia"],
        ["Sertifikat SMK3 baru level 1"],
        [],
        "2026-05-02T09:00:00.000Z"
      ),
    },
    "CV Tangki Prima Sejahtera": {
      teknis: ai(
        "Pengalaman terbatas pada coating dan pekerjaan sipil tangki; inspektur API 653 masih dalam proses sertifikasi dan hydrostatic test skala besar belum pernah dilakukan.",
        58,
        "perlu_klarifikasi",
        ["Pengalaman coating dan pekerjaan sipil tangki"],
        [
          "Inspektur API 653 belum bersertifikat",
          "Belum pernah melaksanakan hydrostatic test skala besar",
        ],
        ["Tidak memenuhi persyaratan teknis minimum RKS"],
        "2026-05-02T09:00:00.000Z"
      ),
      legal: ai(
        "Dokumen legal dasar tersedia; badan usaha CV dengan NPWP, NIB, dan akta yang berlaku.",
        72,
        "dinilai",
        ["NPWP, NIB, dan akta berlaku"],
        [],
        ["Lampiran administrasi kurang lengkap"],
        "2026-05-02T09:00:00.000Z"
      ),
      harga: ai(
        "Nilai penawaran Rp 2.890.000.000 termasuk PPN berada di atas HPS Rp 2.850.000.000 tanpa rincian biaya yang memadai.",
        50,
        "belum_dinilai",
        [],
        ["Nilai penawaran di atas HPS", "Rincian komponen biaya tidak memadai"],
        ["Penawaran tidak wajar secara harga"],
        "2026-05-02T09:00:00.000Z"
      ),
      k3: ai(
        "Sertifikat SMK3 belum dimiliki dan prosedur K3 tidak dijelaskan dalam dokumen penawaran.",
        60,
        "perlu_klarifikasi",
        [],
        ["Sertifikat SMK3 tidak dimiliki", "Prosedur K3 tidak terdokumentasi"],
        [],
        "2026-05-02T09:00:00.000Z"
      ),
    },
  },
};

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

  const demoEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email.toLowerCase()));
  let pruned = 0;
  for (const u of existing?.users ?? []) {
    if (
      u.email &&
      u.email.toLowerCase().endsWith("@patramind.demo") &&
      !demoEmails.has(u.email.toLowerCase())
    ) {
      try {
        await supabase.from("profiles").delete().eq("id", u.id);
      } catch {
        // lanjut hapus user
      }
      const { error } = await supabase.auth.admin.deleteUser(u.id);
      if (!error) pruned++;
      else log(`  ! gagal hapus akun lama ${u.email}: ${error.message}`);
    }
  }
  if (pruned > 0) log(`akun lama dihapus: ${pruned}`);
}

const TENDER_SEEDS: TenderSeed[] = [
  {
    nama_pekerjaan: "Pengadaan Spare Part Pompa Sentrifugal NPK 2026",
    nomor_pr: "PR-26-004821",
    klien: "Unit Produksi NPK — Pertamina Patra Niaga",
    nilai_kontrak: 1250000000,
    deadline: "2026-05-15",
    pic: "Budi Santoso",
    status: "proses",
    ringkasan:
      "Pengadaan spare part pompa sentrifugal unit NPK 2026 senilai Rp1,25 miliar untuk mendukung keandalan operasional produksi NPK. Tender berada pada tahap proses: sesi pre-bid/aanwijzing telah berjalan dan Berita Acara siap digenerate dari RKS.",
    rks: {
      nama: "RKS TOR Pengadaan Spare Part NPK 2026.txt",
      text: RKS_TEXT,
    },
    offers: OFFERS,
    supports: SUPPORT_DOCS,
    ba: {
      status: "draft",
      qna: [
        {
          no: 1,
          pertanyaan: "Apakah biaya pengiriman ke gudang Patra Niaga sudah termasuk dalam penawaran?",
          jawaban: "Ya, biaya pengiriman ke gudang sudah termasuk dalam penawaran.",
        },
        {
          no: 2,
          pertanyaan: "Apakah material certificate wajib dilampirkan saat penawaran?",
          jawaban: "Wajib dilampirkan bersamaan dengan dokumen penawaran.",
        },
        {
          no: 3,
          pertanyaan: "Apakah ada toleransi dimensi impeller?",
          jawaban: "Toleransi mengikuti standar OEM, maksimal plus minus 1 mm.",
        },
        {
          no: 4,
          pertanyaan: "Apakah garansi dihitung sejak barang diterima?",
          jawaban: "Ya, garansi mutu 12 bulan sejak serah terima barang.",
        },
        {
          no: 5,
          pertanyaan: "Bagaimana jika terjadi keterlambatan pengiriman?",
          jawaban: "Berlaku ketentuan denda keterlambatan sesuai klausul kontrak.",
        },
      ],
    },
  },
  ...EXTRA_TENDERS,
];

async function seedTenderAndDocs(seed: TenderSeed) {
  const { data: existing } = await supabase
    .from("tenders")
    .select("id, nomor_pr")
    .eq("nomor_pr", seed.nomor_pr)
    .maybeSingle();

  let tenderId = existing?.id ?? null;

  if (!tenderId) {
    const { data, error } = await supabase
      .from("tenders")
      .insert({
        nama_pekerjaan: seed.nama_pekerjaan,
        nomor_pr: seed.nomor_pr,
        klien: seed.klien,
        nilai_kontrak: seed.nilai_kontrak,
        deadline: seed.deadline,
        pic: seed.pic,
        status: seed.status,
        ringkasan: seed.ringkasan,
        ...(seed.mode_evaluasi ? { mode_evaluasi: seed.mode_evaluasi } : {}),
      })
      .select("id")
      .single();
    if (error) throw error;
    tenderId = data.id;
    log(`tender dibuat: ${seed.nama_pekerjaan}`);
  } else {
    const { error } = await supabase
      .from("tenders")
      .update({
        klien: seed.klien,
        nilai_kontrak: seed.nilai_kontrak,
        deadline: seed.deadline,
        pic: seed.pic,
        ringkasan: seed.ringkasan,
        ...(seed.mode_evaluasi ? { mode_evaluasi: seed.mode_evaluasi } : {}),
      })
      .eq("id", tenderId);
    if (error) throw error;
    log(`tender sudah ada: ${seed.nama_pekerjaan}`);
  }

  const docs = [
    { jenis: "rks_tor" as const, nama_file: seed.rks.nama, konten_text: seed.rks.text },
    ...seed.offers.map((o) => ({
      jenis: "penawaran" as const,
      nama_file: o.nama,
      konten_text: o.text,
    })),
    ...seed.supports.map((o) => ({
      jenis: "lainnya" as const,
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

  // Evaluasi draft otomatis untuk tender berstatus evaluasi/diterima
  if (seed.status === "evaluasi" || seed.status === "diterima") {
    const { data: existingEvals } = await supabase
      .from("evaluations")
      .select("vendor_name")
      .eq("tender_id", tenderId);
    const done = new Set(
      (existingEvals ?? []).map((e) => e.vendor_name.toLowerCase())
    );
    const newEvals = seed.offers
      .map((o) => {
        const m = o.nama.match(/penawaran[_\-\s]*(.+)/i);
        const nama = m ? m[1].replace(/\.[a-z]+$/i, "").trim() : o.nama;
        return nama;
      })
      .filter((nama) => nama.length > 2 && !done.has(nama.toLowerCase()))
      .map((nama) => ({ tender_id: tenderId, vendor_name: nama, status: "draft" }));

    if (newEvals.length > 0) {
      const { error } = await supabase.from("evaluations").insert(newEvals);
      if (error) throw error;
      log(`evaluasi draft dibuat: ${newEvals.length} vendor`);
    } else {
      log("evaluasi sudah ada untuk semua vendor");
    }

    const { data: evals } = await supabase
      .from("evaluations")
      .select("id, vendor_name")
      .eq("tender_id", tenderId);

    await seedAspectEvals(seed, evals ?? []);
    await seedConsensus(seed, evals ?? []);
  }

  await seedBa(seed, tenderId);
}

/* ---------------- isi data evaluasi awal (mode aspek) ---------------- */

async function seedAspectEvals(
  seed: TenderSeed,
  evals: { id: string; vendor_name: string }[]
) {
  const data = ASPECT_EVAL_SEEDS[seed.nomor_pr];
  if (!data) return;
  for (const ev of evals) {
    const perVendor = data[ev.vendor_name];
    if (!perVendor) continue;
    const { data: row } = await supabase
      .from("evaluations")
      .select("teknis_input, legal_input, harga_input, k3_input")
      .eq("id", ev.id)
      .single();
    const patch: Record<string, unknown> = {};
    for (const aspect of ["teknis", "legal", "harga", "k3"] as const) {
      const current = row?.[`${aspect}_input` as const];
      const value = perVendor[aspect];
      if (current == null && value) patch[`${aspect}_input`] = value;
    }
    if (Object.keys(patch).length === 0) continue;
    const { error } = await supabase.from("evaluations").update(patch).eq("id", ev.id);
    if (error) throw error;
    log(`  evaluasi aspek diisi: ${ev.vendor_name} (${Object.keys(patch).length} aspek)`);
  }
}

async function seedConsensus(
  seed: TenderSeed,
  evals: { id: string; vendor_name: string }[]
) {
  if (!seed.consensus) return;
  for (const ev of evals) {
    const consensus = seed.consensus[ev.vendor_name];
    if (!consensus) continue;
    const { data: row } = await supabase
      .from("evaluations")
      .select("consensus_result, status")
      .eq("id", ev.id)
      .single();
    if (row?.consensus_result) continue;
    const { error } = await supabase
      .from("evaluations")
      .update({ consensus_result: consensus, status: "final" })
      .eq("id", ev.id);
    if (error) throw error;
    log(`  konsensus + final: ${ev.vendor_name} (skor akhir ${consensus.skor_akhir})`);
  }
}

async function seedBa(seed: TenderSeed, tenderId: string) {
  if (!seed.ba) return;
  const { data: existing } = await supabase
    .from("berita_acara")
    .select("id")
    .eq("tender_id", tenderId)
    .limit(1)
    .maybeSingle();
  if (existing) {
    log(`berita acara sudah ada: ${seed.nama_pekerjaan}`);
    return;
  }
  const { error } = await supabase.from("berita_acara").insert({
    tender_id: tenderId,
    qna_notes: seed.ba.qna,
    hasil_generate: seed.ba.hasil ?? {},
    status: seed.ba.status,
  });
  if (error) throw error;
  log(`berita acara dibuat (${seed.ba.status}): ${seed.nama_pekerjaan}`);
}

/* ---------------- departemen & demo bobot ---------------- */

const DEFAULT_DEPARTMENTS = ["Teknis", "Legal", "Keuangan", "K3 / HSSE"];

async function seedDepartments() {
  for (const nama of DEFAULT_DEPARTMENTS) {
    const { data } = await supabase
      .from("departments")
      .select("id")
      .eq("nama", nama)
      .maybeSingle();
    if (!data) {
      const { error } = await supabase.from("departments").insert({ nama });
      if (error && error.code !== "23505") throw error;
      log(`departemen dibuat: ${nama}`);
    }
  }

  // Demo: Event K3 -> mode departemen + bobot + penilaian contoh
  const { data: tender } = await supabase
    .from("tenders")
    .select("id")
    .eq("nomor_pr", "PR-26-003388")
    .maybeSingle();
  if (!tender) return;

  const { data: deps } = await supabase.from("departments").select("id, nama");
  const depMap = new Map((deps ?? []).map((d) => [d.nama, d.id]));
  const bobotDemo: [string, number][] = [
    ["K3 / HSSE", 35],
    ["Teknis", 30],
    ["Legal", 20],
    ["Keuangan", 15],
  ];

  await supabase
    .from("tenders")
    .update({ mode_evaluasi: "departemen" })
    .eq("id", tender.id);
  await supabase.from("tender_departments").delete().eq("tender_id", tender.id);
  for (const [nama, bobot] of bobotDemo) {
    const depId = depMap.get(nama);
    if (!depId) continue;
    const { error } = await supabase
      .from("tender_departments")
      .insert({ tender_id: tender.id, department_id: depId, bobot });
    if (error) throw error;
  }
  log("Event K3 -> mode departemen (bobot: K3 35, Teknis 30, Legal 20, Keuangan 15)");

  const { data: evals } = await supabase
    .from("evaluations")
    .select("id, vendor_name")
    .eq("tender_id", tender.id);
  const contoh: Record<string, [string, string, number]> = {
    Teknis: [
      "Spesifikasi venue, booth, dan simulasi tanggap darurat sesuai RKS; tim instruktur tersertifikasi.",
      "Kebutuhan teknis terpenuhi dengan baik, kapasitas sesuai rencana acara.",
      82,
    ],
    Legal: [
      "Kelengkapan izin usaha dan dokumen administrasi perusahaan dalam kondisi lengkap.",
      "Dokumen legal lengkap tanpa temuan berarti.",
      88,
    ],
    Keuangan: [
      "Penawaran harga berada di bawah HPS dengan rincian komponen yang wajar.",
      "Harga kompetitif dan sesuai estimasi anggaran.",
      79,
    ],
    "K3 / HSSE": [
      "Protokol K3 acara, asuransi peserta, dan SLA tanggap darurat tercantum secara memadai.",
      "Kepatuhan K3 baik; sedikit catatan pada jadwal simulasi.",
      84,
    ],
  };

  for (const ev of evals ?? []) {
    for (const [depNama, [proposal, penilaian, skor]] of Object.entries(contoh)) {
      const depId = depMap.get(depNama);
      if (!depId) continue;
      const { data: existing } = await supabase
        .from("department_assessments")
        .select("id")
        .eq("evaluation_id", ev.id)
        .eq("department_id", depId)
        .maybeSingle();
      if (existing) continue;
      const { error } = await supabase
        .from("department_assessments")
        .insert({
          evaluation_id: ev.id,
          department_id: depId,
          ai_proposal: proposal,
          penilaian_teks: penilaian,
          ai_skor: skor,
          ai_ringkasan: `Analisis bahasa oleh AI untuk ${depNama}: penilaian positif. Skor 0-100: ${skor}.`,
          status: "diskor",
        });
      if (error) throw error;
    }
    log(`penilaian departemen demo dibuat untuk ${ev.vendor_name}`);
  }
}

/* ---------------- main ---------------- */

async function main() {
  log("Mulai seeding PATRAMIND...");
  await upsertDemoUsers();
  for (const seed of TENDER_SEEDS) {
    await seedTenderAndDocs(seed);
  }
  await seedDepartments();
  log("Selesai. Data demo siap digunakan.");
}

main().catch((e) => {
  console.error("[seed] Gagal:", e.message ?? e);
  process.exit(1);
});
