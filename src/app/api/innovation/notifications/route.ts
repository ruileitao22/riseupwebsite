import { NextResponse, type NextRequest } from "next/server";
import { getInnovationRequest, sendNewInnovationRequestNotifications } from "@/lib/innovation-notifications";
import { requireBackofficeUser } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    const body = await request.json() as { requestId?: string };
    if (!body.requestId) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    const innovationRequest = await getInnovationRequest(body.requestId);
    if (innovationRequest.submitted_by !== identity.id) return NextResponse.json({ error: "Sem permissão para enviar esta notificação." }, { status: 403 });
    return NextResponse.json({ ok: true, ...(await sendNewInnovationRequestNotifications(body.requestId)) });
  } catch (error) {
    console.error("Innovation notification failed", error);
    return NextResponse.json({ error: "Não foi possível enviar a notificação por email." }, { status: 502 });
  }
}
