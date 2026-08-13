import type { BaJson } from "@/types";
import { Badge } from "@/components/ui/badge";

export function BaDocument({
  ba,
  status,
  previewSource,
}: {
  ba: BaJson;
  status?: "draft" | "final";
  previewSource?: string;
}) {
  return (
    <div className="relative">
      {previewSource && (
        <div className="absolute right-0 top-0 flex items-center gap-2">
          <Badge className="bg-sky-50 text-sky-700 border-sky-200">
            {previewSource}
          </Badge>
        </div>
      )}

      <div className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        {/* Kop dokumen */}
        <div className="border-b-2 border-slate-900 pb-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            PT Pertamina Patra Niaga
          </p>
          <h2 className="mt-2 text-xl font-extrabold uppercase tracking-wide text-slate-900">
            Berita Acara
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-700">
            Pemberian Penjelasan (Aanwijzing)
          </p>
          <p className="mt-2 text-xs text-slate-500">{ba.nomor_ba}</p>
        </div>

        {/* Ringkasan pelaksanaan */}
        <section className="mt-6">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-800">
            I. Ringkasan Pelaksanaan
          </h3>
          <p className="text-justify text-sm leading-7 text-slate-700">
            {ba.ringkasan_pelaksanaan}
          </p>
        </section>

        {/* Poin penjelasan */}
        {ba.poin_penjelasan.length > 0 && (
          <section className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-800">
              II. Poin-Poin Penjelasan Utama
            </h3>
            <ol className="space-y-2">
              {ba.poin_penjelasan.map((p, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-justify text-sm leading-6 text-slate-700"
                >
                  <span className="mt-0.5 shrink-0 text-brand-700">
                    {i + 1}.
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Tanya jawab */}
        {ba.tanya_jawab.length > 0 && (
          <section className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-800">
              III. Daftar Tanya-Jawab
            </h3>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="w-10 px-3 py-2">No</th>
                    <th className="px-3 py-2">Pertanyaan</th>
                    <th className="px-3 py-2">Jawaban Panitia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ba.tanya_jawab.map((tj) => (
                    <tr key={tj.no}>
                      <td className="px-3 py-2.5 align-top text-slate-500">
                        {tj.no}
                      </td>
                      <td className="px-3 py-2.5 align-top text-slate-700">
                        {tj.pertanyaan}
                      </td>
                      <td className="px-3 py-2.5 align-top text-slate-700">
                        {tj.jawaban}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Perubahan */}
        {ba.perubahan.length > 0 && (
          <section className="mt-5">
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-800">
              IV. Perubahan / Penambahan / Klarifikasi Dokumen
            </h3>
            <ul className="space-y-2">
              {ba.perubahan.map((p, i) => (
                <li key={i} className="flex gap-3 text-sm leading-6 text-slate-700">
                  <span className="mt-0.5 shrink-0 text-brand-700">-</span>
                  <span className="text-justify">{p}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Kesimpulan */}
        <section className="mt-5">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-800">
            V. Kesimpulan dan Penutup
          </h3>
          <p className="text-justify text-sm leading-7 text-slate-700">
            {ba.kesimpulan}
          </p>
        </section>

        {/* Tanda tangan */}
        <div className="mt-12 grid grid-cols-2 gap-6 text-center text-xs text-slate-600">
          <div>
            <p>Panitia Pengadaan,</p>
            <div className="h-24" />
            <p className="font-bold text-slate-800">
              ( ........................................ )
            </p>
          </div>
          <div>
            <p>Perwakilan Peserta,</p>
            <div className="h-24" />
            <p className="font-bold text-slate-800">
              ( ........................................ )
            </p>
          </div>
        </div>

        {status && (
          <div className="mt-6 flex justify-end border-t border-slate-100 pt-3">
            {status === "final" ? (
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                Final — tersimpan
              </Badge>
            ) : (
              <Badge className="bg-slate-100 text-slate-600 border-slate-200">
                Draft
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
