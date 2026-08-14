import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (!["panitia", "admin"].includes(profile?.role ?? "")) {
      return NextResponse.json({ error: "Khusus Panitia Pengadaan" }, { status: 403 });
    }

    const body = await request.json();
    const nama_pekerjaan = String(body.nama_pekerjaan ?? "").trim();
    const nomor_pr = String(body.nomor_pr ?? "").trim();
    const klien = String(body.klien ?? "").trim();
    const pic = String(body.pic ?? "").trim();
    const deadline = body.deadline ? String(body.deadline) : null;
    const nilai_kontrak = Number(body.nilai_kontrak ?? 0) || 0;
    if (!nama_pekerjaan) {
      return NextResponse.json({ error: "Nama pekerjaan wajib diisi" }, { status: 400 });
    }

    const { data, error } = await supabaseClient()
      .from("tenders")
      .insert({ nama_pekerjaan, nomor_pr, klien, pic, deadline, nilai_kontrak, status: "draft" })
      .select("id")
      .single();
    if (error) throw error;

    return NextResponse.json({ id: data.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Terjadi kesalahan" },
      { status: 500 }
    );
  }
}
