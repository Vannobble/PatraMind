import type {
  Aspect,
  AspectStatus,
  BaJson,
  ConsensusJson,
  DocChunk,
  QnaNote,
  Tender,
} from "@/types";
import { sleep } from "@/lib/utils";

/* ============================================================
   MODE DEMO OFFLINE: generator AI lokal yang realistis.
   Memakai input asli (RKS + catatan sesi) supaya hasilnya
   terlihat kontekstual, bukan template kosong.
   ============================================================ */

const STOPWORDS = new Set(
  `apa bagaimana berapa kapan mengapa yang untuk dengan tanpa pada di ke dari dalam tentang mengenai berdasarkan
   apakah jelaskan sebutkan tolong saya kami mohon itu ini tersebut adalah sebagai dapat bisa harus akan telah sudah
   ada tidak apakah nomor bagian per poin butir silahkan dimohon informasi info ditanyakan minta tolong penjelasan
   penjelasannya klarifikasi atas pada saat ketika sebelum sesudah selama dalam sesudah dan atau juga serta ataupun
   dan sebagainya dsb dll uu sk pkpt pkptnp sbsk`.split(/\s+/)
);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function countOccurrences(haystack: string, needle: string): number {
  const lower = haystack.toLowerCase();
  let count = 0;
  let idx = 0;
  while ((idx = lower.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

function scoreChunk(chunk: DocChunk, tokens: string[]): number {
  let score = 0;
  for (const t of tokens) {
    score += countOccurrences(chunk.content, t);
  }
  return score;
}

export function keywordRetrieve(
  chunks: DocChunk[],
  question: string,
  limit = 3
): DocChunk[] {
  const tokens = tokenize(question);
  if (tokens.length === 0) return chunks.slice(0, limit);
  const hits = [...chunks]
    .map((c) => ({ c, s: scoreChunk(c, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.c);
  if (hits.length > 0) return hits;
  return chunks.slice(0, limit);
}

export function firstSentence(text: string, maxLen = 220): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const m = cleaned.match(/^.*?[\.\!\?](?:\s|$)/);
  const s = m ? m[0].trim() : cleaned;
  return s.length > maxLen ? s.slice(0, maxLen).trimEnd() + "…" : s;
}

/* ---------------- Utilitas parsing RKS ---------------- */

interface RksSection {
  num: string;
  title: string;
  text: string;
}

function parseRksSections(content: string): RksSection[] {
  const lines = content.split("\n").map((l) => l.trim());
  const sections: RksSection[] = [];
  let current: RksSection | null = null;

  for (const line of lines) {
    const m = line.match(/^(\d+(?:\.\d+)*)[\.\)]?\s+(.+)$/);
    if (m && /[A-Za-z]/.test(m[2][0] ?? "") && line.length < 120) {
      if (current) sections.push(current);
      current = { num: m[1], title: m[2], text: "" };
    } else if (current) {
      current.text += line + " ";
    } else if (line.length > 20) {
      if (!current) current = { num: "0", title: "PENDAHULUAN", text: "" };
      current.text += line + " ";
    }
  }
  if (current) sections.push(current);
  return sections;
}

function pickRksPoints(rksContent: string, maxPoints = 6): string[] {
  const sections = parseRksSections(rksContent);
  return sections.slice(0, maxPoints).map((s) => {
    const lead = firstSentence(s.text, 150);
    return `${s.num}. ${s.title} — ${lead}`;
  });
}

/* ---------------- D5: Generate Berita Acara ---------------- */

export async function mockGenerateBa(params: {
  tender: Tender;
  rksContent: string;
  qnaNotes: QnaNote[];
}): Promise<BaJson> {
  await sleep(900);
  const { tender, rksContent, qnaNotes } = params;

  const tahun = new Date().getFullYear();
  const tanggal = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const nomor_ba = `BA/PP/${tender.nomor_pr}/AANW/${tahun}`;

  const peserta = 8;
  const ringkasan_pelaksanaan = `Pada hari ${tanggal} pukul 09.00 WIB s.d. selesai, Panitia Pengadaan PT Pertamina Patra Niaga telah melaksanakan Pemberian Penjelasan (Aanwijzing) untuk pekerjaan "${tender.nama_pekerjaan}" Nomor PR ${tender.nomor_pr} secara tatap muka bertempat di Ruang Rapat Direktorat Pengadaan. Sesi dihadiri oleh Panitia Pengadaan, Tim Teknis, serta ${peserta} perwakilan calon penyedia jasa. Penjelasan mencakup lingkup pekerjaan, spesifikasi teknis, persyaratan administrasi, mekanisme evaluasi, dan aspek K3L sebagaimana tertuang dalam RKS/TOR. Selama sesi berlangsung, Panitia Pengadaan menjawab seluruh pertanyaan peserta dan hasilnya dicatat dalam berita acara ini.`;

  const poin_penjelasan = pickRksPoints(rksContent);

  const tanya_jawab: QnaNote[] = qnaNotes.map((n, i) => ({
    no: i + 1,
    pertanyaan: n.pertanyaan,
    jawaban: n.jawaban,
  }));

  const kataKunci = [
    "perubahan",
    "addendum",
    "klarifikasi",
    "revisi",
    "penambahan",
    "disesuaikan",
    "dapat berubah",
    "batas akhir",
  ];
  const perubahan = tanya_jawab
    .filter((tj) =>
      kataKunci.some((k) =>
        (tj.pertanyaan + " " + tj.jawaban).toLowerCase().includes(k)
      )
    )
    .map(
      (tj) =>
        `Berdasarkan sesi tanya-jawab poin ${tj.no}, Panitia menyampaikan: "${firstSentence(tj.jawaban, 180)}"`
    );

  const adaPerubahan = perubahan.length > 0;
  const kesimpulan = `Berdasarkan pelaksanaan pemberian penjelasan yang telah berlangsung, seluruh pertanyaan peserta telah dijawab dan dicatat oleh Panitia Pengadaan. ${
    adaPerubahan
      ? "Perubahan sebagaimana diuraikan pada bagian perubahan dokumen akan ditindaklanjuti oleh Panitia dalam bentuk addendum yang menjadi bagian tidak terpisahkan dari RKS."
      : "Tidak terdapat perubahan atas dokumen RKS/TOR selama sesi pemberian penjelasan berlangsung."
  } Peserta diharapkan menyampaikan penawaran sesuai ketentuan yang tertuang dalam RKS beserta perubahan (jika ada). Berita Acara ini ditandatangani oleh Panitia Pengadaan dan menjadi lampiran resmi dokumen pengadaan.`;

  return {
    nomor_ba,
    ringkasan_pelaksanaan,
    poin_penjelasan,
    tanya_jawab,
    perubahan: adaPerubahan ? perubahan : ["Tidak terdapat perubahan atau addendum terhadap dokumen RKS/TOR pada sesi pemberian penjelasan ini."],
    kesimpulan,
  };
}

/* ---------------- D6: Evaluasi per aspek ---------------- */

function keywordPresence(text: string, keywords: string[]): number {
  const lower = text.toLowerCase();
  return keywords.filter((k) => lower.includes(k)).length;
}

export async function mockEvaluateAspect(params: {
  aspect: Aspect;
  vendorName: string;
  rksSpec: string;
  vendorOffer: string;
}): Promise<{
  analysis: string;
  rekomendasi: string;
  status: AspectStatus;
  skor: number;
  poin: { sesuai: string[]; kurang: string[]; catatan: string[] };
}> {
  await sleep(750);
  const { aspect, vendorName, rksSpec, vendorOffer } = params;
  const lowerOffer = vendorOffer.toLowerCase();
  const short = firstSentence(vendorOffer, 240);

  const perAspek: Record<
    Aspect,
    { checklist: string[]; label: string }
  > = {
    teknis: {
      label: "kesesuaian spesifikasi teknis",
      checklist: [
        "impeller",
        "mechanical seal",
        "bearing",
        "316l",
        "cast iron",
        "duplex",
        "diameter",
        "flow",
        "head",
        "capacity",
        "bar",
        "kw",
      ],
    },
    legal: {
      label: "kelengkapan legal & administrasi",
      checklist: [
        "npwp",
        "nib",
        "siup",
        "tdp",
        "domisili",
        "surat kuasa",
        "akta",
        "bpjs",
      ],
    },
    harga: {
      label: "kewajaran harga penawaran",
      checklist: ["rupiah", "rp ", "ppn", "pengiriman", "garansi", "warranty", "hps", "penawaran"],
    },
    k3: {
      label: "aspek K3, lingkungan & SLA",
      checklist: [
        "smk3",
        "iso 45001",
        "iso 14001",
        "k3",
        "aplikasi kerja",
        "apd",
        "lingkungan",
        "sla",
        "purna jual",
      ],
    },
  };

  const meta = perAspek[aspect];
  const terpenuhi = keywordPresence(vendorOffer, meta.checklist);
  const total = meta.checklist.length;
  const pct = terpenuhi / total;

  let status: AspectStatus;
  let statusSentence: string;
  if (pct >= 0.6) {
    status = "dinilai";
    statusSentence = "memenuhi ketentuan yang dipersyaratkan";
  } else if (pct >= 0.35) {
    status = "perlu_klarifikasi";
    statusSentence = "belum sepenuhnya memenuhi ketentuan sehingga perlu klarifikasi";
  } else {
    status = "belum_dinilai";
    statusSentence = "tidak memenuhi ketentuan yang dipersyaratkan";
  }

  const missing = meta.checklist
    .filter((k) => !lowerOffer.includes(k))
    .slice(0, 3);

  let analysis: string;
  if (aspect === "harga") {
    const hargaMatch = vendorOffer.match(
      /(?:Rp\.?\s?|IDR\s?)?\d{1,3}(?:\.\d{3})+(?:,\d+)?/
    );
    const harga = hargaMatch ? hargaMatch[0] : "nilai yang tidak tertera secara eksplisit";
    const hpsMatch = rksSpec.match(/(?:HPS\s*:?\s*)(?:Rp\.?\s?)?\d[\d.,]*/);
    const hps = hpsMatch ? hpsMatch[0] : "Rp 1.250.000.000 (perkiraan anggaran)";
    analysis = `Evaluasi aspek harga atas penawaran ${vendorName} menunjukkan nilai penawaran ${harga}, dievaluasi terhadap perkiraan anggaran (${hps}). Kewajaran harga ditinjau dari komponen biaya material, pengiriman, serta garansi yang ditawarkan dalam dokumen penawaran. Berdasarkan cakupan tersebut, harga penawaran ${statusSentence}.`;
  } else {
    const rksIntro = firstSentence(rksSpec, 160);
    analysis = `Analisis aspek ${aspect === "teknis" ? "teknis" : aspect === "legal" ? "legal" : aspect === "k3" ? "K3/SLA" : "harga"} terhadap penawaran ${vendorName}: dokumen penawaran disandingkan dengan ketentuan RKS (${rksIntro}). Dari ${total} kriteria yang dievaluasi, ${terpenuhi} kriteria teridentifikasi terpenuhi dalam dokumen penawaran; kekurangan yang perlu diperhatikan antara lain: ${missing.length ? missing.join(", ") : "tidak ada kekurangan signifikan"}. Kesimpulan sementara: penawaran ${statusSentence} sehingga rekomendasi awal ${status === "dinilai" ? "Layak" : status === "perlu_klarifikasi" ? "Perlu Klarifikasi" : "Tidak Layak"} untuk tahap ini.`;
  }

  const rekomendasi =
    status === "dinilai"
      ? "Layak"
      : status === "perlu_klarifikasi"
        ? "Perlu Klarifikasi"
        : "Tidak Layak";

  const skor = Math.round(pct * 100);
  const sesuai = meta.checklist
    .filter((k) => lowerOffer.includes(k))
    .map((k) => `Kriteria "${k}" teridentifikasi pada dokumen penawaran`);
  const kurang = missing.map(
    (k) => `Kriteria "${k}" belum teridentifikasi pada dokumen penawaran`
  );
  const catatanPoin = [
    `Rekomendasi awal: ${rekomendasi.toLowerCase()}${missing.length > 0 ? " — mohon klarifikasi untuk kriteria yang belum teridentifikasi" : ""}`,
  ];

  return {
    analysis: analysis + ` (Ringkasan penawaran: ${short})`,
    rekomendasi,
    status,
    skor,
    poin: { sesuai, kurang, catatan: catatanPoin },
  };
}

/* ---------------- D6: Consensus ---------------- */

export async function mockConsensus(params: {
  vendorName: string;
  teknis: { analysis: string; catatan: string; status: AspectStatus } | null;
  legal: { analysis: string; catatan: string; status: AspectStatus } | null;
  harga: { analysis: string; catatan: string; status: AspectStatus } | null;
  k3: { analysis: string; catatan: string; status: AspectStatus } | null;
}): Promise<ConsensusJson> {
  await sleep(900);
  const { vendorName, teknis, legal, harga, k3 } = params;
  const semua = [
    { nama: "Teknis", v: teknis },
    { nama: "Legal", v: legal },
    { nama: "Harga", v: harga },
    { nama: "K3/SLA", v: k3 },
  ];
  const dinilai = semua.filter((x) => x.v && x.v.status === "dinilai").length;
  const klarifikasi = semua.filter(
    (x) => x.v && x.v.status === "perlu_klarifikasi"
  ).length;
  const tidak = semua.filter(
    (x) => x.v && x.v.status === "belum_dinilai"
  ).length;

  let rekomendasi: string;
  if (tidak > 0) {
    rekomendasi = "Tidak Layak";
  } else if (klarifikasi > 0) {
    rekomendasi = "Perlu Klarifikasi Tambahan";
  } else {
    rekomendasi = "Layak Dilanjutkan";
  }

  const ringkasan = semua
    .map((x) => {
      if (!x.v) return `${x.nama}: belum ada input`;
      const st = x.v.status === "dinilai" ? "dinilai baik" : x.v.status === "perlu_klarifikasi" ? "perlu klarifikasi" : "tidak layak";
      return `${x.nama}: ${st}${x.v.catatan ? ` (catatan: ${x.v.catatan})` : ""}`;
    })
    .join(". ");

  const poin_perhatian: string[] = [];
  if (klarifikasi > 0)
    poin_perhatian.push(
      `Terdapat ${klarifikasi} aspek berstatus perlu klarifikasi dan wajib ditindaklanjuti sebelum keputusan final.`
    );
  if (tidak > 0)
    poin_perhatian.push(
      `Terdapat ${tidak} aspek yang tidak memenuhi ketentuan — mengarah pada ketidaklayakan penawaran.`
    );
  const catatanNonEmpty = semua
    .map((x) => x.v?.catatan)
    .filter((c): c is string => Boolean(c && c.trim().length > 2));
  catatanNonEmpty.forEach((c, i) => poin_perhatian.push(`Catatan evaluator ${i + 1}: ${c}`));
  if (poin_perhatian.length === 0)
    poin_perhatian.push(
      "Seluruh aspek evaluasi telah terpenuhi tanpa temuan signifikan."
    );

  const kesimpulan = `Hasil konsolidasi evaluasi penawaran ${vendorName} melibatkan empat aspek: Teknis, Legal, Harga, dan K3/SLA. ${ringkasan}. Secara keseluruhan, penawaran menunjukkan komitmen terhadap lingkup pekerjaan yang dipersyaratkan RKS, namun keputusan akhir tetap mempertimbangkan hasil klarifikasi dan ketersediaan dokumen pendukung.`;

  return { kesimpulan, poin_perhatian, rekomendasi };
}

/* ---------------- D6: Konsensus bobot departemen ---------------- */

const SENTIMEN_POSITIF = [
  "layak", "memenuhi", "lengkap", "baik", "sesuai", "kompetitif", "andal",
  "relevan", "profesional", "sesuai ketentuan", "tidak ada temuan", "tepat",
  "unggul", "solid", "memadai", "mendukung", "terjamin", "terpenuhi", "aman",
  "berpengalaman", "berkualitas", "transparan", "jelas", "cukup",
];
const SENTIMEN_NEGATIF = [
  "tidak layak", "tidak memenuhi", "kurang", "tidak lengkap", "risiko",
  "tidak sesuai", "mahal", "diragukan", "menyimpang", "tidak jelas",
  "bermasalah", "kekurangan", "gagal", "tidak ada", "tidak tersedia",
  "tidak berpengalaman", "lambat", "tidak aman", "meragukan", "perlu perbaikan",
];

export async function mockDepartmentProposal(params: {
  departmentName: string;
  vendorName: string;
  rksSpec: string;
  vendorOffer: string;
}): Promise<string> {
  await sleep(750);
  const { departmentName, vendorName, rksSpec, vendorOffer } = params;
  const lower = vendorOffer.toLowerCase();

  const temuanPositif = SENTIMEN_POSITIF.filter((k) => lower.includes(k)).slice(0, 3);
  const temuanNegatif = SENTIMEN_NEGATIF.filter((k) => lower.includes(k)).slice(0, 3);
  const rksLead = firstSentence(rksSpec, 120);

  const bagian = [
    `Usulan penilaian awal dari perspektif ${departmentName} terhadap penawaran ${vendorName}:`,
    `1. Kesesuaian lingkup — penawaran ${temuanPositif.length > 0 ? `menunjukkan kesesuaian (${temuanPositif.join(", ")})` : "belum menunjukkan kesesuaian yang eksplisit"} terhadap RKS (${rksLead}).`,
    `2. Kelengkapan dokumen — ${temuanNegatif.length > 0 ? `terdapat potensi celah (${temuanNegatif.join(", ")}) yang perlu dikonfirmasi` : "dokumen pendukung tampak tersedia, mohon verifikasi kelengkapan akhir"}.`,
    `3. Rekomendasi awal ${departmentName}: ${temuanNegatif.length >= 2 ? "perlu klarifikasi sebelum dilanjutkan" : "dapat dilanjutkan ke penilaian penuh, dengan catatan verifikasi lapangan"}.`,
  ];
  return bagian.join("\n");
}

export async function mockScoreAssessment(params: {
  departmentName: string;
  penilaianTeks: string;
}): Promise<{ skor: number; ringkasan: string }> {
  await sleep(650);
  const { departmentName, penilaianTeks } = params;
  const lower = penilaianTeks.toLowerCase();
  const positif = SENTIMEN_POSITIF.filter((k) => lower.includes(k)).length;
  const negatif = SENTIMEN_NEGATIF.filter((k) => lower.includes(k)).length;

  let skor = Math.round(50 + (positif - negatif) * 9);
  skor = Math.max(0, Math.min(100, skor));
  if (positif === 0 && negatif === 0) skor = 50;

  const nada =
    skor >= 75
      ? "positif — penilaian mendukung kelayakan vendor"
      : skor >= 50
        ? "cenderung netral — terdapat catatan yang perlu diverifikasi"
        : "negatif — terdapat kekhawatiran signifikan terhadap vendor";
  const ringkasan = `Analisis bahasa oleh AI untuk ${departmentName}: penilaian bernada ${nada}. Skor 0-100: ${skor}.`;

  return { skor, ringkasan };
}

export async function mockWeightedConsensus(params: {
  vendorName: string;
  items: {
    department: string;
    penilaian: string;
    skor: number;
    bobot: number;
  }[];
}): Promise<ConsensusJson> {
  await sleep(900);
  const { vendorName, items } = params;

  const totalBobot = items.reduce((a, i) => a + i.bobot, 0) || 100;
  const skorAkhir = Math.round(
    items.reduce((a, i) => a + i.skor * i.bobot, 0) / totalBobot
  );

  let rekomendasi: string;
  if (skorAkhir >= 75) rekomendasi = "Layak Dilanjutkan";
  else if (skorAkhir >= 50) rekomendasi = "Perlu Klarifikasi Tambahan";
  else rekomendasi = "Tidak Layak";

  const rincian = items
    .map(
      (i) =>
        `${i.department} (bobot ${i.bobot}%): skor ${i.skor} — ${firstSentence(i.penilaian, 90)}`
    )
    .join(". ");

  const poin_perhatian = items
    .filter((i) => i.skor < 60)
    .map((i) => `${i.department} memberi skor ${i.skor} — perlu tindak lanjut: ${firstSentence(i.penilaian, 120)}`);
  if (poin_perhatian.length === 0)
    poin_perhatian.push("Seluruh departemen memberikan penilaian di atas ambang, tanpa temuan signifikan.");

  const kesimpulan = `Konsensus tertimbang atas penawaran ${vendorName} menggabungkan ${items.length} departemen: ${rincian}. Skor akhir tertimbang: ${skorAkhir}/100. Rekomendasi: ${rekomendasi}.`;

  return { kesimpulan, poin_perhatian, rekomendasi, skor_akhir: skorAkhir };
}

/* ---------------- D6b: Tanya-jawab & rangkum ruang departemen ---------------- */

function scoreParagraph(text: string, tokens: string[]): number {
  let score = 0;
  for (const t of tokens) score += countOccurrences(text, t);
  return score;
}

function bestParagraph(text: string, tokens: string[]): string {
  const paras = text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter((p) => p.length > 10);
  if (paras.length === 0) return "";
  let best = paras[0];
  let bestScore = -1;
  for (const p of paras) {
    const s = scoreParagraph(p, tokens);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore > 0 ? best : "";
}

export async function mockAssessmentChatAnswer(params: {
  departmentName: string;
  vendorName: string;
  rksSpec: string;
  vendorOffer: string;
  question: string;
}): Promise<string> {
  await sleep(600);
  const { departmentName, vendorName, rksSpec, vendorOffer, question } = params;
  const tokens = tokenize(question);
  const doc = bestParagraph(vendorOffer, tokens) || bestParagraph(rksSpec, tokens);

  if (!doc) {
    return `Dari dokumen penawaran ${vendorName} dan RKS/TOR yang saya baca, saya belum menemukan informasi yang menjawab pertanyaan tersebut. Coba tanyakan hal lain, misalnya tentang spesifikasi teknis, kelengkapan dokumen, harga, atau ketentuan K3.`;
  }

  const quote = firstSentence(doc, 260);
  const sumber =
    bestParagraph(vendorOffer, tokens) === doc ? "penawaran" : "RKS/TOR";
  return `Ditinjau dari perspektif ${departmentName}, berdasarkan ${sumber} ${vendorName}: "${quote}". Apabila Anda ingin detail lain (misal perbandingan dengan ketentuan RKS atau bagian tertentu penawaran), silakan tanyakan lebih spesifik.`;
}

export async function mockSummarizeAssessment(params: {
  departmentName: string;
  vendorName: string;
  messages: { role: "user" | "assistant"; content: string }[];
}): Promise<string> {
  await sleep(900);
  const { departmentName, vendorName, messages } = params;
  const userLines = messages
    .filter((m) => m.role === "user")
    .map((m) => firstSentence(m.content, 140));
  const aiLines = messages
    .filter((m) => m.role === "assistant")
    .map((m) => firstSentence(m.content, 160));

  const topik =
    userLines.length > 0
      ? userLines.join("; ")
      : "kesesuaian penawaran dengan lingkup pekerjaan";
  const temuan =
    aiLines.length > 0
      ? aiLines.slice(0, 3).map((s) => `• ${s}`).join("\n")
      : "• Belum ada temuan spesifik dari tanya-jawab.";

  return [
    `RINGKASAN PENILAIAN — ${departmentName}`,
    `Vendor: ${vendorName}`,
    "",
    `Berdasarkan tanya-jawab yang dilakukan, departemen ${departmentName} meninjau: ${topik}.`,
    "",
    "Temuan dari dokumen:",
    temuan,
    "",
    `Kesimpulan: secara umum penawaran ${vendorName} dinilai sesuai untuk aspek yang menjadi lingkup ${departmentName}, dengan catatan yang perlu dikonfirmasi lebih lanjut bila ada kekurangan.`,
  ].join("\n");
}

/* ---------------- D8: Edit dokumen offline ---------------- */

function escRe(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function lowerTrim(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

function stripQuotes(text: string): string {
  return text.replace(/^["“']+|["”']+$/g, "").trim();
}

const MONTH_WORDS =
  /(?:januari|februari|maret|april|mei|juni|juli|agustus|september|oktober|november|desember)/i;

function isSectionHeading(line: string): boolean {
  const t = line.trim();
  if (t.length >= 120) return false;
  if (MONTH_WORDS.test(t)) return false;
  return /^\d+(?:\.\d+)*[\.\)]?\s+[A-Za-z]/.test(t);
}

function documentExcerpt(content: string, maxLines = 3): string {
  return content
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, maxLines)
    .join(" | ")
    .slice(0, 300);
}

export async function mockDocumentEdit(params: {
  documentTitle: string;
  currentContent: string;
  instruction: string;
}): Promise<{ konten_baru: string; ringkasan: string }> {
  await sleep(700);
  const { documentTitle, currentContent, instruction } = params;
  const ins = lowerTrim(instruction);

  // 1. Ganti X menjadi Y (dengan atau tanpa tanda kutip)
  const ganti = ins.match(
    /^(?:ganti|ubah|replace)(?:\s+(?:kata|kata-kata|frasa|teks|tulisan|isi|istilah|judul))?\s+["“']?([^"”']{1,200})["”']?\s+(?:menjadi|dengan|jadi|ke)\s+["“']?([^"”']{1,400})["”']?$/i
  );
  if (ganti) {
    const from = stripQuotes(ganti[1]);
    const to = stripQuotes(ganti[2]);
    if (!from || !to || from === to) {
      return {
        konten_baru: currentContent,
        ringkasan: `Instruksi "ganti" tidak jelas. Contoh: ganti "1. PENDAHULUAN" menjadi "1. Pengantar" (tanda kutip boleh dipakai atau tidak).`,
      };
    }
    if (!currentContent.toLowerCase().includes(from.toLowerCase())) {
      return {
        konten_baru: currentContent,
        ringkasan: `Saya tidak menemukan frasa "${from}" pada ${documentTitle}. Tidak ada perubahan yang dilakukan — perintahkan saya dengan frasa yang persis ada di dokumen. ${currentContent.trim() ? `Dokumen diawali dengan: ${documentExcerpt(currentContent)}` : ""}`,
      };
    }
    const konten_baru = currentContent.replace(
      new RegExp(escRe(from), "gi"),
      to
    );
    return {
      konten_baru,
      ringkasan: `Saya mengganti "${from}" menjadi "${to}" pada ${documentTitle}. Jumlah penggantian: ${countOccurrences(currentContent, from)}.`,
    };
  }

  // 2. Hapus seksi/bagian yang menyebut kata kunci (sampai heading berikutnya)
  const hapus = ins.match(/^(?:hapus|buang|hilangkan)\s+(.+)$/i);
  if (hapus) {
    const target = stripQuotes(hapus[1])
      .replace(
        /^(?:bagian|seksi|baris|kalimat|paragraf|semua|seluruh|isi|isinya|teks|tulisan|poin|butir)\s*(?:yang\s*)?/,
        ""
      )
      .replace(
        /^(?:yang\s*)?(?:menyebut|mengandung|berisi|berisikan|membahas|berkaitan\s+dengan|terkait\s+dengan|tentang|mengenai|berjudul)\s+/,
        ""
      )
      .trim();
    if (!target) {
      return {
        konten_baru: currentContent,
        ringkasan: `Instruksi "hapus" tidak jelas. Contoh: hapus bagian yang menyebut "jadwal pelaksanaan".`,
      };
    }
    const needle = lowerTrim(target);
    const lines = currentContent.split("\n");
    const kept: string[] = [];
    let skipping = false;
    let removed = 0;
    for (const line of lines) {
      if (skipping && isSectionHeading(line)) skipping = false;
      if (!skipping && lowerTrim(line).includes(needle)) {
        skipping = true;
        removed++;
        continue;
      }
      if (skipping) {
        removed++;
        continue;
      }
      kept.push(line);
    }
    if (removed === 0) {
      return {
        konten_baru: currentContent,
        ringkasan: `Saya tidak menemukan bagian yang menyebut "${target}" pada ${documentTitle}. Tidak ada yang dihapus — coba kata kunci yang lebih tepat. ${currentContent.trim() ? `Bagian yang ada: ${documentExcerpt(currentContent)}` : ""}`,
      };
    }
    return {
      konten_baru: kept.join("\n").replace(/\n{3,}/g, "\n\n").trim(),
      ringkasan: `Saya menghapus bagian yang menyebut "${target}" (${removed} baris) dari ${documentTitle}.`,
    };
  }

  // 3. Tambahkan paragraf/klausa (opsional: di akhir dokumen)
  const tambah = ins.match(/^(?:tambahkan?|sisipkan|buatkan)\s+(.+)$/i);
  if (tambah) {
    let teksBaru = stripQuotes(tambah[1]);
    const lokasi = teksBaru.match(
      /\s+(?:di|pada|setelah)\s+(?:bagian\s+)?(?:akhir|belakang)(?:\s+dokumen)?\s*$/
    );
    if (lokasi?.index !== undefined) teksBaru = teksBaru.slice(0, lokasi.index);
    teksBaru = teksBaru.replace(/^klausa\s+/i, "Klausa ").trim();
    if (!teksBaru) {
      return {
        konten_baru: currentContent,
        ringkasan:
          "Instruksi penambahan tidak jelas. Contoh: \"Tambahkan klausa tentang jaminan mutu di akhir dokumen\".",
      };
    }
    const konten_baru = `${currentContent.replace(/\s+$/, "")}\n\n${teksBaru}\n`;
    return {
      konten_baru,
      ringkasan: `Saya menambahkan paragraf baru di akhir ${documentTitle}: "${firstSentence(teksBaru, 120)}".`,
    };
  }

  // 4. Perbaiki ejaan/format ringan
  if (/(?:perbaiki|rapikan|bersihkan|perjelas)\s+(?:ejaan|format|penulisan|tata|tulisan)/i.test(ins) || /perbaiki ejaan/i.test(ins)) {
    const konten_baru = currentContent
      .split("\n")
      .map((l) =>
        l.trim() && /^[a-z]/.test(l) && !/^[a-z0-9]+[\.\)]\s/.test(l)
          ? l.charAt(0).toUpperCase() + l.slice(1)
          : l
      )
      .join("\n")
      .replace(/ +/g, " ")
      .replace(/ ?([,;:]) ?/g, "$1 ")
      .replace(/\s+([.!?])/g, "$1")
      .replace(/\n{3,}/g, "\n\n");
    const changed = konten_baru !== currentContent;
    return {
      konten_baru,
      ringkasan: changed
        ? `Saya merapikan ejaan dan format ${documentTitle}: huruf kapital di awal baris, spasi sebelum tanda baca, dan baris kosong ganda.`
        : `Isi ${documentTitle} sudah cukup rapi; tidak ada perbaikan format yang perlu dilakukan.`,
    };
  }

  // 5. Tulis ulang / perpendek
  if (/(?:tulis ulang|tuliskan ulang|perpendek|ringkas|rangkum)/i.test(ins)) {
    const kalimat = currentContent
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);
    const pendek = kalimat.slice(0, Math.max(2, Math.ceil(kalimat.length / 2))).join("\n");
    return {
      konten_baru: pendek,
      ringkasan: `Versi ringkas ${documentTitle} disusun: ${kalimat.length} paragraf menjadi ${pendek.split("\n").length} paragraf. Anda tetap dapat menyimpan versi ini atau membatalkannya.`,
    };
  }

  return {
    konten_baru: currentContent,
    ringkasan: `Saya belum memahami instruksi "${firstSentence(instruction, 80)}" untuk ${documentTitle}. Coba perintah seperti: ganti "1. PENDAHULUAN" menjadi "1. Pengantar", hapus bagian yang menyebut "jadwal pelaksanaan", tambahkan klausa tentang K3, atau perbaiki ejaan dan format.${currentContent.trim() ? `\n\nDokumen diawali dengan: ${documentExcerpt(currentContent)}` : ""}`,
  };
}

/* ---------------- D8: Chat RAG offline ---------------- */

export async function mockChatAnswer(params: {
  question: string;
  chunks: DocChunk[];
}): Promise<{ answer: string; sources: string[] }> {
  await sleep(700);
  const { question, chunks } = params;
  const top = keywordRetrieve(chunks, question, 3);

  if (top.length === 0) {
    return {
      answer:
        "Maaf, saya tidak menemukan informasi yang relevan pada dokumen project ini untuk menjawab pertanyaan tersebut. Coba tanyakan hal lain seputar RKS/TOR, penawaran vendor, atau jadwal proses pengadaan.",
      sources: [],
    };
  }

  const sources = top.map((c) => c.sumber);
  const main = top[0];
  const quote = firstSentence(main.content, 260);

  const tambahan =
    top.length > 1
      ? ` Informasi pendukung lainnya: ${firstSentence(top[1].content, 160)}`
      : "";

  const answer = `Berdasarkan dokumen project yang saya akses (${main.sumber}): "${quote}".${tambahan} Apabila Anda membutuhkan detail lebih lanjut dari bagian lain, saya dapat menelusuri kembali dokumen terkait.`;

  return { answer, sources };
}
