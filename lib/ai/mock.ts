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
}): Promise<{ analysis: string; rekomendasi: string; status: AspectStatus }> {
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

  return { analysis: analysis + ` (Ringkasan penawaran: ${short})`, rekomendasi, status };
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
