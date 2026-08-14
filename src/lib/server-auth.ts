import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

export type BackofficeIdentity = {
  id: string;
  email: string | null;
  role: string;
};

export async function requireBackofficeUser(request: NextRequest): Promise<BackofficeIdentity> {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !url || !key) throw new Error("UNAUTHORIZED");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) throw new Error("UNAUTHORIZED");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", userData.user.id)
    .maybeSingle();

  return {
    id: userData.user.id,
    email: userData.user.email ?? null,
    role: typeof profile?.role === "string" ? profile.role : "member"
  };
}

export function canWriteDrive(role: string) {
  return role === "admin" || role.startsWith("team_leader");
}

export function canReadDrive(role: string) {
  return canWriteDrive(role);
}

export function canDeleteDrive(role: string) {
  return role === "admin";
}
