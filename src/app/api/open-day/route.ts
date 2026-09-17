import { NextResponse, type NextRequest } from "next/server";
import { openDayClient, openDayManager, openDayError } from "@/lib/open-day-server";
import { openDayClosed, openDaySchema } from "@/lib/open-day";

const attempts = new Map<string, number[]>();
export async function POST(request: NextRequest) {
  if (openDayClosed()) return NextResponse.json({ error: "As inscrições encerraram a 17 de setembro, às 15h00." }, { status: 410 });
  const now = Date.now();
  for (const [key, values] of attempts) if (!values.some(t => now - t < 600000)) attempts.delete(key);
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const recent = (attempts.get(ip) || []).filter(t => now - t < 600000);
  if (recent.length >= 8) return NextResponse.json({ error: "Demasiadas tentativas. Tenta novamente mais tarde." }, { status: 429 });
  attempts.set(ip, [...recent, now]);
  try {
    const raw = await request.text();
    if (raw.length > 8000) return NextResponse.json({ error: "Pedido demasiado grande." }, { status: 413 });
    let body;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Pedido inválido." }, { status: 400 }); }
    const parsed = openDaySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Verifica os campos do formulário." }, { status: 400 });
    const { error } = await openDayClient().from("open_day_registrations").insert(parsed.data);
    if (error?.code === "23505") return NextResponse.json({ error: "Já existe uma inscrição com este email." }, { status: 409 });
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) { return openDayError(error); }
}
export async function GET(request: NextRequest) {
  try {
    const client = await openDayManager(request);
    const rows = [];
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await client.from("open_day_registrations").select("*").order("created_at", { ascending: false }).order("id").range(offset, offset + 999);
      if (error) throw error;
      rows.push(...data);
      if (data.length < 1000) break;
    }
    return NextResponse.json(rows, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return openDayError(error); }
}
export async function PATCH(request: NextRequest) {
  try {
    const client = await openDayManager(request);
    const body = await request.json();
    const { id, ...payload } = body;
    const parsed = openDaySchema.safeParse(payload);
    if (!parsed.success || !/^[0-9a-f-]{36}$/i.test(id || "")) return NextResponse.json({ error: "Verifica os campos do formulário." }, { status: 400 });
    const { data, error } = await client.from("open_day_registrations").update(parsed.data).eq("id", id).select("id");
    if (error?.code === "23505") return NextResponse.json({ error: "Já existe uma inscrição com este email." }, { status: 409 });
    if (error) throw error;
    if (!data.length) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return openDayError(error); }
}
export async function DELETE(request: NextRequest) {
  try {
    const client = await openDayManager(request);
    const id = request.nextUrl.searchParams.get("id");
    if (!/^[0-9a-f-]{36}$/i.test(id || "")) return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
    const { data, error } = await client.from("open_day_registrations").delete().eq("id", id).select("id");
    if (error) throw error;
    if (!data.length) return NextResponse.json({ error: "Inscrição não encontrada." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) { return openDayError(error); }
}
