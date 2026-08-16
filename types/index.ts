export type Role = "panitia" | "teknis" | "legal" | "k3" | "otorisator" | "admin";

export type TenderStatus =
  | "draft"
  | "proses"
  | "evaluasi"
  | "diterima"
  | "ditolak";

export type Aspect = "teknis" | "legal" | "harga" | "k3";

export type AspectStatus = "belum_dinilai" | "dinilai" | "perlu_klarifikasi";

export type DocJenis = "rks_tor" | "penawaran" | "lainnya";

export type TenderMode = "aspek" | "departemen";

export type AssessmentStatus = "belum" | "dinilai" | "diskor" | "submitted";

export interface AssessmentChatMessage {
  id: string;
  evaluation_id: string;
  department_id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  role: Role;
  created_at?: string;
}

export interface Tender {
  id: string;
  nama_pekerjaan: string;
  nomor_pr: string;
  klien?: string;
  nilai_kontrak?: number;
  deadline?: string | null;
  pic?: string;
  status: TenderStatus;
  ringkasan?: string;
  mode_evaluasi?: TenderMode;
  created_at?: string;
}

export interface DocumentRow {
  id: string;
  tender_id: string;
  jenis: DocJenis;
  nama_file: string;
  konten_text: string;
  created_at?: string;
}

export interface QnaNote {
  no: number;
  pertanyaan: string;
  jawaban: string;
}

export interface BaJson {
  nomor_ba: string;
  ringkasan_pelaksanaan: string;
  poin_penjelasan: string[];
  tanya_jawab: QnaNote[];
  perubahan: string[];
  kesimpulan: string;
}

export interface BeritaAcara {
  id: string;
  tender_id: string;
  qna_notes: QnaNote[];
  hasil_generate: BaJson;
  status: "draft" | "final";
  created_by?: string;
  created_at?: string;
}

export interface AspectInput {
  analysis: string;
  catatan: string;
  status: AspectStatus;
  updated_by?: string;
}

export interface ConsensusJson {
  kesimpulan: string;
  poin_perhatian: string[];
  rekomendasi: string;
  skor_akhir?: number | null;
}

export interface Evaluation {
  id: string;
  tender_id: string;
  vendor_name: string;
  teknis_input: AspectInput | null;
  legal_input: AspectInput | null;
  harga_input: AspectInput | null;
  k3_input: AspectInput | null;
  consensus_result: ConsensusJson | null;
  status: "draft" | "final";
  created_at?: string;
}

export interface Department {
  id: string;
  nama: string;
  created_at?: string;
}

export interface TenderDepartment {
  id: string;
  tender_id: string;
  department_id: string;
  bobot: number;
}

export interface DepartmentAssessment {
  id: string;
  evaluation_id: string;
  department_id: string;
  ai_proposal: string;
  penilaian_teks: string;
  ai_skor: number | null;
  ai_ringkasan: string;
  status: AssessmentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: string[];
  editProposal?: { konten_baru: string; ringkasan: string } | null;
  editApplied?: boolean;
}

export interface DocChunk {
  id: string;
  tender_id: string;
  content: string;
  sumber: string;
  similarity?: number;
}

export interface LiveDocument {
  title: string;
  subtitle?: string;
  badge?: string;
  kind: "ba" | "text";
  ba?: BaJson;
  text?: string;
}
