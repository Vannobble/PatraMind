"use client";

import { useState } from "react";
import { FileUp, Mic, Paperclip, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type UploadedDoc = { name: string; size: number };
type UploadedAudio = { name: string; size: number; url: string };

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadPanel() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"dokumen" | "audio">("dokumen");
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [audio, setAudio] = useState<UploadedAudio[]>([]);

  function addDocs(list: FileList | null) {
    if (!list) return;
    const items = Array.from(list).map((f) => ({ name: f.name, size: f.size }));
    setDocs((prev) => [...prev, ...items]);
  }

  function addAudio(list: FileList | null) {
    if (!list) return;
    const items = Array.from(list).map((f) => ({
      name: f.name,
      size: f.size,
      url: URL.createObjectURL(f),
    }));
    setAudio((prev) => [...prev, ...items]);
  }

  function removeAudio(i: number) {
    setAudio((prev) => {
      URL.revokeObjectURL(prev[i].url);
      return prev.filter((_, idx) => idx !== i);
    });
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <Paperclip className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-slate-900">
              Lampiran Sesi Pre-Bid
            </p>
            <p className="text-[10px] text-slate-400">
              Kumpulkan dokumen pendukung & rekaman sesi (simulasi upload)
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTab("dokumen");
              setOpen(true);
            }}
          >
            <FileUp className="text-brand-700" />
            Upload Dokumen Penting
            {docs.length > 0 && (
              <Badge className="bg-brand-50 text-brand-700 border-brand-200">
                {docs.length}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setTab("audio");
              setOpen(true);
            }}
          >
            <Mic className="text-red-600" />
            Upload Rekaman Audio
            {audio.length > 0 && (
              <Badge className="bg-red-50 text-red-700 border-red-200">
                {audio.length}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                Unggah Lampiran Sesi Pre-Bid
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => setTab("dokumen")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition",
                  tab === "dokumen"
                    ? "bg-white text-brand-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <FileUp className="h-3.5 w-3.5" /> Dokumen
              </button>
              <button
                onClick={() => setTab("audio")}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-semibold transition",
                  tab === "audio"
                    ? "bg-white text-brand-800 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Mic className="h-3.5 w-3.5" /> Rekaman Audio
              </button>
            </div>

            {tab === "dokumen" ? (
              <div className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/40">
                  <FileUp className="h-7 w-7 text-brand-700" />
                  <span className="text-xs font-semibold text-slate-600">
                    Pilih dokumen (RKS pendukung, daftar hadir, materi sesi…)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Klik untuk memilih file — beberapa file sekaligus diperbolehkan
                  </span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => addDocs(e.target.files)}
                  />
                </label>
                {docs.length > 0 && (
                  <ul className="space-y-2">
                    {docs.map((d, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5"
                      >
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                            <FileUp className="h-3.5 w-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold text-slate-700">
                              {d.name}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              {fmtSize(d.size)}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            setDocs((prev) => prev.filter((_, idx) => idx !== i))
                          }
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          aria-label="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center transition hover:border-brand-300 hover:bg-brand-50/40">
                  <Mic className="h-7 w-7 text-red-600" />
                  <span className="text-xs font-semibold text-slate-600">
                    Pilih rekaman audio sesi (MP3/WAV/M4A)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Putar ulang langsung di panel ini — transkripsi AI menyusul
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addAudio(e.target.files)}
                  />
                </label>
                {audio.length > 0 && (
                  <ul className="space-y-2">
                    {audio.map((a, i) => (
                      <li
                        key={i}
                        className="rounded-xl border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                              <Mic className="h-3.5 w-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-slate-700">
                                {a.name}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {fmtSize(a.size)}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeAudio(i)}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            aria-label="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <audio
                          controls
                          src={a.url}
                          className="mt-2 h-9 w-full"
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-[11px] leading-5 text-sky-800">
              Mode simulasi: file hanya tersimpan di browser sesi ini (state
              lokal) dan belum diunggah ke server — menunggu infrastruktur
              penyimpanan file.
            </p>

            <div className="mt-4 flex justify-end">
              <Button onClick={() => setOpen(false)}>Selesai</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}