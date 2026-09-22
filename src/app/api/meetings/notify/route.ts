import { NextResponse, type NextRequest } from "next/server";
import { requireBackofficeUser } from "@/lib/server-auth";
import { sendMeetingInvitationEmails } from "@/lib/task-notifications";

const canManageMeetings = (role: string) => ["admin", "coordinator", "vice_coordinator"].includes(role) || role.startsWith("team_leader");

export async function POST(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!canManageMeetings(identity.role)) return NextResponse.json({ error: "Sem permissão para enviar notificações de reuniões." }, { status: 403 });
    const body = await request.json() as { meetingId?: string };
    if (!body.meetingId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    return NextResponse.json({ ok: true, ...(await sendMeetingInvitationEmails(body.meetingId, identity.id)) });
  } catch (error) {
    console.error("Meeting notification failed", error);
    return NextResponse.json({ error: "A reunião foi guardada, mas não foi possível enviar os emails." }, { status: 502 });
  }
}
