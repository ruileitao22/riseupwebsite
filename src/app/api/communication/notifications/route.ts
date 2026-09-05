import { NextResponse, type NextRequest } from "next/server";
import { getCommunicationRequest, sendNewRequestNotifications, sendRequestDecisionNotification } from "@/lib/communication-notifications";
import { requireBackofficeUser } from "@/lib/server-auth";

const canManageCommunication = (role: string) => ["admin", "coordinator", "vice_coordinator", "communication_team", "team_leader_communication"].includes(role);

export async function POST(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    const body = await request.json() as { requestId?: string; event?: "requested" | "decided" };
    if (!body.requestId || !["requested", "decided"].includes(body.event || "")) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    const communicationRequest = await getCommunicationRequest(body.requestId);

    if (body.event === "requested") {
      if (communicationRequest.requester_id !== identity.id || communicationRequest.status !== "pending") return NextResponse.json({ error: "Sem permissão para enviar esta notificação." }, { status: 403 });
      return NextResponse.json({ ok: true, ...(await sendNewRequestNotifications(body.requestId)) });
    }

    if (!canManageCommunication(identity.role)) return NextResponse.json({ error: "Sem permissão para comunicar esta decisão." }, { status: 403 });
    return NextResponse.json({ ok: true, ...(await sendRequestDecisionNotification(body.requestId)) });
  } catch (error) {
    console.error("Communication notification failed", error);
    return NextResponse.json({ error: "Não foi possível enviar a notificação por email." }, { status: 502 });
  }
}
