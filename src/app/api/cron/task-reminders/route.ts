import { NextResponse, type NextRequest } from "next/server";
import { sendDailyTaskEmails } from "@/lib/task-notifications";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await sendDailyTaskEmails()) });
  } catch (error) {
    console.error("Daily task reminder failed", error);
    return NextResponse.json({ error: "Não foi possível enviar os lembretes diários." }, { status: 502 });
  }
}
