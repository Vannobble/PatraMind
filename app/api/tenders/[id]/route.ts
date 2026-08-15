import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";
import type { TenderStatus } from "@/types";

const VALID: TenderStatus[] = [
  "draft",
  "proses",
  "evaluasi",
  "diterima",
  "ditolak",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, profile } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (!["panitia", "admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Khusus Panitia/Admin" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const status = String(body.status ?? "");
    const ringkasan =
      body.ringkasan !== undefined ? String(body.ringkasan).trim() : undefined;

    if (status && !VALID.includes(status as TenderStatus)) {
      return NextResponse.json({ error: "Status tidak valid" }, { status: 400 });
    }

    const payload: { status?: string; ringkasan?: string } = {};
    if (status) payload.status = status;
    if (ringkasan !== undefined) payload.ringkasan = ringkasan;

    const { data, error } = await supabaseClient()
      .from("tenders")
      .update(payload)
      .eq("id", id)
      .select("id, status, ringkasan")
      .single();
    if (error) throw error;

    // Otomatisasi: saat tender masuk fase Evaluasi, buat evaluasi draft
    // untuk setiap vendor penawaran yang belum dinilai
    if (status === "evaluasi") {
      const { data: offers } = await supabaseClient()
        .from("documents")
        .select("nama_file")
        .eq("tender_id", id)
        .eq("jenis", "penawaran");
      const { data: existingEvals } = await supabaseClient()
        .from("evaluations")
        .select("vendor_name")
        .eq("tender_id", id);

      const done = new Set(
        (existingEvals ?? []).map((e) => e.vendor_name.toLowerCase())
      );
      const rows = ((offers ?? []) as { nama_file: string }[])
        .map((d) => {
          const m = d.nama_file.match(/penawaran[_\-\s]*(.+)/i);
          const nama = m
            ? m[1].replace(/\.[a-z]+$/i, "").trim()
            : d.nama_file;
          return nama;
        })
        .filter((nama) => nama.length > 2 && !done.has(nama.toLowerCase()))
        .map((nama) => ({
          tender_id: id,
          vendor_name: nama,
          status: "draft",
        }));

      if (rows.length > 0) {
        const { error: evalError } = await supabaseClient()
          .from("evaluations")
          .insert(rows);
        if (evalError) throw evalError;
      }
    }

    return NextResponse.json({ ok: true, id: data.id, status: data.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengubah status" },
      { status: 500 }
    );
  }
}