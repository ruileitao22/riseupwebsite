import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { requireBackofficeUser } from "@/lib/server-auth";
import { canManageOpenDay } from "@/lib/open-day";
export function openDayClient(request?: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Serviço temporariamente indisponível.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false },
    ...(request ? { global: { headers: { Authorization: request.headers.get("authorization") || "" } } } : {}) });
}
export async function openDayManager(request: NextRequest) {
  const user = await requireBackofficeUser(request);
  if (!canManageOpenDay(user.role)) throw new Error("FORBIDDEN");
  return openDayClient(request);
}
export function openDayError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  const status = code === "UNAUTHORIZED" ? 401 : code === "FORBIDDEN" ? 403 : 503;
  return NextResponse.json({ error: status === 503 ? "Não foi possível concluir. Tenta novamente." : "Não tens acesso a estas inscrições." }, { status });
}
