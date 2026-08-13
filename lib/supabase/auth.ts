import { cache } from "react";
import type { Profile } from "@/types";
import { supabaseClient } from "./admin";

export { supabaseClient };

export const getProfile = cache(async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabaseClient()
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", userId)
      .single();
    if (error) return null;
    return data as Profile;
  } catch {
    return null;
  }
});

export async function isOpenaiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}
