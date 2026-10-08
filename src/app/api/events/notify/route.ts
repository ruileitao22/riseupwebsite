import { NextResponse, type NextRequest } from "next/server";
import { requireBackofficeUser } from "@/lib/server-auth";
import { sendEventInvitationEmails } from "@/lib/task-notifications";

const canManageEvents = (role: string) => ["admin", "coordinator", "vice_coordinator"].includes(role) || role.startsWith("team_leader");

export async function POST(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!canManageEvents(identity.role)) return NextResponse.json({ error: "Sem permissão para enviar notificações de eventos." }, { status: 403 });
    const body = await request.json() as { eventId?: string };
    if (!body.eventId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    return NextResponse.json({ ok: true, ...(await sendEventInvitationEmails(body.eventId)) });
  } catch (error) {
    console.error("Event notification failed", error);
    return NextResponse.json({ error: "O evento foi guardado, mas não foi possível enviar os emails." }, { status: 502 });
  }
}
