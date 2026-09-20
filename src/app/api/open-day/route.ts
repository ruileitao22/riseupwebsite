import { NextResponse, type NextRequest } from "next/server";
import { openDayManager, openDayError } from "@/lib/open-day-server";
import { openDaySchema } from "@/lib/open-day";
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
