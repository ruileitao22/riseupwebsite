import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { requireBackofficeUser } from "@/lib/server-auth";

export async function DELETE(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
      console.error("Account deletion is missing Supabase server configuration.");
      return NextResponse.json({ error: "A eliminação de contas não está configurada no servidor." }, { status: 503 });
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
    const { error } = await admin.auth.admin.deleteUser(identity.id, false);
    if (error) {
      console.error("Account deletion failed:", error.message);
      return NextResponse.json({ error: "Não foi possível apagar a conta." }, { status: 502 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Sessão inválida. Inicia sessão novamente." }, { status: 401 });
    }
    console.error("Unexpected account deletion error:", error);
    return NextResponse.json({ error: "Não foi possível apagar a conta." }, { status: 500 });
  }
}
