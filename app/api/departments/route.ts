import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";

export async function GET() {
  try {
    const { data, error } = await supabaseClient()
      .from("departments")
      .select("*")
      .order("nama");
    if (error) throw error;
    return NextResponse.json({ departments: data ?? [] });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memuat departemen" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user || !profile) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (!["admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Khusus Admin" }, { status: 403 });
    }

    const body = await request.json();
    const action = String(body.action ?? "");

    if (action === "add") {
      const nama = String(body.nama ?? "").trim();
      if (nama.length < 2) {
        return NextResponse.json({ error: "Nama departemen terlalu pendek" }, { status: 400 });
      }
      const { data, error } = await supabaseClient()
        .from("departments")
        .insert({ nama })
        .select("*")
        .single();
      if (error) {
        return NextResponse.json(
          { error: error.code === "23505" ? "Nama departemen sudah ada" : error.message },
          { status: 400 }
        );
      }
      return NextResponse.json({ department: data });
    }

    if (action === "remove") {
      const id = String(body.id ?? "");
      if (!id) {
        return NextResponse.json({ error: "id wajib" }, { status: 400 });
      }
      const { error } = await supabaseClient()
        .from("departments")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal memproses" },
      { status: 500 }
    );
  }
}