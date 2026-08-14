import { FolderKanban } from "lucide-react";
import { supabaseClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/auth";
import { Card } from "@/components/ui/card";
import { CreateTenderDialog } from "@/components/dashboard/create-tender-dialog";
import { PrebidTable } from "@/components/prebid/prebid-table";
import type { Tender } from "@/types";

export const dynamic = "force-dynamic";

export default async function PreBidPage() {
  let profile: Awaited<ReturnType<typeof getProfile>> = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) profile = await getProfile(data.user.id);
  } catch {
    // env belum diatur
  }

  const [{ data: tData }, { data: docs }, { data: evals }] = await Promise.all([
    supabaseClient()
      .from("tenders")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseClient().from("documents").select("tender_id"),
    supabaseClient().from("evaluations").select("tender_id, status"),
  ]);

  const tenders = (tData ?? []) as Tender[];
  const docCounts: Record<string, number> = {};
  for (const d of docs ?? []) {
    docCounts[d.tender_id] = (docCounts[d.tender_id] ?? 0) + 1;
  }
  const evalCounts: Record<string, number> = {};
  for (const e of evals ?? []) {
    evalCounts[e.tender_id] = (evalCounts[e.tender_id] ?? 0) + 1;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-brand-950">
            Daftar PreBid Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola project pengadaan, ubah status, dan buka workspace tender.
          </p>
        </div>
        {["panitia", "admin"].includes(profile?.role ?? "") && (
          <CreateTenderDialog />
        )}
      </div>

      <Card className="overflow-hidden">
        <PrebidTable
          tenders={tenders}
          docCounts={docCounts}
          evalCounts={evalCounts}
          canEdit={["panitia", "admin"].includes(profile?.role ?? "")}
        />
      </Card>
    </div>
  );
}