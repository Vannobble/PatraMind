"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, FileUp, Mic, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Label } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

const AUDIO_PLACEHOLDER =
  "[Transkrip audio belum diproses — infrastruktur upload & transkripsi belum tersedia (mockup).]";

type Mode = "tulis" | "file" | "audio";

const MODES: { id: Mode; label: string; icon: typeof FileText; hint: string }[] =
  [
    { id: "tulis", label: "Tulis Teks", icon: FileText, hint: "Ketik isi dokumen" },
    { id: "file", label: "Upload File Teks", icon: FileUp, hint: "Baca dari file .txt" },
    { id: "audio", label: "Upload Audio", icon: Mic, hint: "Rekaman rapat/aanwijzing" },
  ];

export function CreateDocumentDialog({
  tenders,
}: {
  tenders: { id: string; nama_pekerjaan: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("tulis");
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState("lainnya");
  const [tenderId, setTenderId] = useState(tenders[0]?.id ?? "");
  const [isi, setIsi] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<{ name: string; url: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioFile) URL.revokeObjectURL(audioFile.url);
    };
  }, [audioFile]);

  function reset() {
    setMode("tulis");
    setNama("");
    setIsi("");
    setFileName(null);
    setAudioFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
    setError(null);
  }

  function handleTextFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.toLowerCase().endsWith(".txt")) {
      setError("Hanya file teks (.txt) yang bisa dibaca otomatis pada mode ini.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setIsi(String(reader.result ?? ""));
      setError(null);
    };
    reader.readAsText(f);
    setFileName(f.name);
    if (!nama) setNama(f.name);
  }

  function handleAudioFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAudioFile((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return { name: f.name, url: URL.createObjectURL(f) };
    });
    setFileName(f.name);
    setNama(`[AUDIO] ${f.name}`);
    setIsi(AUDIO_PLACEHOLDER);
    setError(null);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (mode === "audio" && !audioFile) {
      setError("Pilih file audio terlebih dahulu.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_file:
            mode === "audio"
              ? nama.startsWith("[AUDIO]")
                ? nama
                : `[AUDIO] ${nama}`
              : nama,
          jenis,
          tenderId,
          konten_text:
            mode === "audio"
              ? isi || AUDIO_PLACEHOLDER
              : isi,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat dokumen");
      setOpen(false);
      reset();
      router.push(`/dokumen/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal membuat dokumen");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus /> Tambah Dokumen
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Tambah Dokumen Baru
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setMode(m.id);
                    setError(null);
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition",
                    mode === m.id
                      ? "bg-white text-brand-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                  title={m.hint}
                >
                  <m.icon className="h-3.5 w-3.5" />
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={create} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="nama">Nama File</Label>
                <Input
                  id="nama"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: RKS TOR Pengadaan Jasa Survey 2026.txt"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="jenis">Kategori</Label>
                  <Select
                    id="jenis"
                    value={jenis}
                    onChange={(e) => setJenis(e.target.value)}
                  >
                    <option value="rks_tor">RKS / TOR</option>
                    <option value="penawaran">Penawaran</option>
                    <option value="lainnya">Lainnya / Pendukung</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tender">Lokasi Simpan (Tender)</Label>
                  <Select
                    id="tender"
                    value={tenderId}
                    onChange={(e) => setTenderId(e.target.value)}
                    required
                  >
                    {tenders.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama_pekerjaan}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {mode === "file" && (
                <div className="space-y-1.5">
                  <Label>File Teks (.txt)</Label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50/40">
                    <FileUp className="h-6 w-6 text-brand-700" />
                    <span className="text-xs font-semibold text-slate-600">
                      {fileName
                        ? fileName
                        : "Pilih file teks untuk dibaca otomatis"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Isi file akan dimuat ke kolom di bawah dan dapat diedit.
                    </span>
                    <input
                      type="file"
                      accept=".txt,text/plain"
                      className="hidden"
                      onChange={handleTextFile}
                    />
                  </label>
                  {fileName && (
                    <button
                      type="button"
                      onClick={() => {
                        setFileName(null);
                        setIsi("");
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:underline"
                    >
                      <Trash2 className="h-3 w-3" /> Kosongkan file
                    </button>
                  )}
                </div>
              )}

              {mode === "audio" && (
                <div className="space-y-1.5">
                  <Label>Rekaman Audio</Label>
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center transition hover:border-brand-300 hover:bg-brand-50/40">
                    <Mic className="h-6 w-6 text-brand-700" />
                    <span className="text-xs font-semibold text-slate-600">
                      {audioFile ? audioFile.name : "Pilih rekaman audio"}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Format MP3/WAV/M4A. Transkrip akan digenerate otomatis oleh
                      AI.
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleAudioFile}
                    />
                  </label>
                  {audioFile && (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                      <Mic className="h-4 w-4 shrink-0 text-brand-700" />
                      <audio controls src={audioFile.url} className="h-9 w-full" />
                      <button
                        type="button"
                        onClick={() => {
                          setAudioFile(null);
                          setFileName(null);
                          setNama("");
                          setIsi("");
                        }}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                        title="Hapus audio"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {audioFile && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
                      Mode demo: file audio tidak diunggah ke server. Dokumen akan
                      disimpan dengan isi transkrip placeholder.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="isi">
                  {mode === "audio" ? "Transkrip (otomatis)" : "Isi Dokumen"}
                </Label>
                <Textarea
                  id="isi"
                  value={isi}
                  onChange={(e) => setIsi(e.target.value)}
                  placeholder={
                    mode === "audio"
                      ? "Transkrip akan digenerate otomatis oleh AI dari rekaman…"
                      : "RKS/TOR ...\n\n1. PENDAHULUAN\n..."
                  }
                  rows={8}
                  required={mode !== "audio"}
                  readOnly={mode === "audio"}
                  className={cn(mode === "audio" && "bg-slate-50 text-slate-500")}
                />
                {mode === "audio" && (
                  <p className="text-[10px] text-slate-400">
                    Transkrip otomatis belum tersedia pada mode demo — placeholder
                    akan disimpan sebagai isi dokumen.
                  </p>
                )}
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </p>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy ? <Spinner className="h-4 w-4" /> : "Simpan"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}