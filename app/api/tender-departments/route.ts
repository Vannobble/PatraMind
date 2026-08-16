import { NextResponse } from "next/server";
import { supabaseClient } from "@/lib/supabase/admin";
import { getApiUser } from "@/lib/api-auth";

export async function POST(request: Request) {
  try {
    const { user, profile } = await getApiUser();
    if (!user || !profile) {
      return NextResponse.json({ error: "Tidak terautentikasi" }, { status: 401 });
    }
    if (!["panitia", "admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Khusus Panitia/Admin" }, { status: 403 });
    }

    const body = await request.json();
    const tenderId = String(body.tenderId ?? "");
    const assignments: { department_id: string; bobot: number }[] = body.assignments;
    const mode = String(body.mode ?? "aspek");

    if (!tenderId || !Array.isArray(assignments)) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    if (mode === "departemen") {
      const total = assignments.reduce((a, x) => a + Number(x.bobot || 0), 0);
      if (assignments.length === 0 || total !== 100) {
        return NextResponse.json(
          { error: "Bobot departemen harus total 100%" },
          { status: 400 }
        );
      }
    }

    const { error: modeError } = await supabaseClient()
      .from("tenders")
      .update({ mode_evaluasi: mode })
      .eq("id", tenderId);
    if (modeError) throw modeError;

    const { error: delError } = await supabaseClient()
      .from("tender_departments")
      .delete()
      .eq("tender_id", tenderId);
    if (delError) throw delError;

    if (assignments.length > 0) {
      const { error } = await supabaseClient()
        .from("tender_departments")
        .insert(
          assignments.map((a) => ({
            tender_id: tenderId,
            department_id: a.department_id,
            bobot: Number(a.bobot || 0),
          }))
        );
      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Gagal menyimpan bobot" },
      { status: 500 }
    );
  }
}