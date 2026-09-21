import { NextResponse, type NextRequest } from "next/server";
import { requireBackofficeUser } from "@/lib/server-auth";
import { sendAssignmentEmails } from "@/lib/task-notifications";

const canAssignTasks = (role: string) => ["admin", "coordinator", "vice_coordinator"].includes(role) || role.startsWith("team_leader");

function notificationErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("Missing SUPABASE_SERVICE_ROLE_KEY") || message.startsWith("Missing RESEND_API_KEY")) {
    return NextResponse.json({
      error: "O envio de emails ainda não está configurado no servidor. Contacta a administração para concluir a configuração.",
      code: "EMAIL_CONFIGURATION_MISSING"
    }, { status: 503 });
  }
  if (message.startsWith("Resend ")) {
    return NextResponse.json({
      error: "O serviço de email recusou o envio. Verifica a configuração do remetente na Resend.",
      code: "EMAIL_PROVIDER_REJECTED"
    }, { status: 502 });
  }
  return NextResponse.json({ error: "Não foi possível enviar a notificação por email.", code: "EMAIL_NOTIFICATION_FAILED" }, { status: 502 });
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!canAssignTasks(identity.role)) return NextResponse.json({ error: "Sem permissão para enviar notificações de tarefas." }, { status: 403 });
    const body = await request.json() as { taskId?: string; recipientIds?: string[] };
    if (!body.taskId || !Array.isArray(body.recipientIds) || !body.recipientIds.every((id) => typeof id === "string")) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    const result = await sendAssignmentEmails(body.taskId, body.recipientIds);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Task assignment notification failed", error);
    return notificationErrorResponse(error);
  }
}
