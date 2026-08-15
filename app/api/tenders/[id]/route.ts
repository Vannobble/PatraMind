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

    return NextResponse.json({ ok: true, id: data.id, status: data.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal mengubah status" },
      { status: 500 }
    );
  }
}