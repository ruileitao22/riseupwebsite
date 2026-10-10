import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { backofficeExportResources, safeExcelText } from "@/lib/backoffice-export";
import { canManageHr, requireBackofficeUser } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ resource: string }> };

function formatValue(key: string, value: unknown) {
  if (value == null) return "";

  if (key.endsWith("_at")) {
    const date = new Date(String(value));
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("pt-PT", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "Europe/Lisbon"
      }).format(date);
    }
  }

  return safeExcelText(value);
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await requireBackofficeUser(request);

    const { resource } = await params;
    if (resource === "attendance") {
      if (!canManageHr(identity.role)) return NextResponse.json({ error: "Não tens permissão para exportar presenças." }, { status: 403 });
      return exportAttendanceHistory(request);
    }
    const definition = backofficeExportResources[resource];
    if (!definition) return NextResponse.json({ error: "Exportação não encontrada." }, { status: 404 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const authorization = request.headers.get("authorization") || "";
    if (!url || !key || !authorization) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: authorization } }
    });
    const { data, error } = await client
      .from(definition.table)
      .select(definition.columns.map((column) => column.key).join(","))
      .order(definition.orderBy, { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Não tens permissão para exportar estes dados." }, { status: 403 });
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(definition.sheetName);
    sheet.columns = definition.columns.map((column) => ({ ...column }));
    ((data || []) as unknown as Array<Record<string, unknown>>).forEach((record) => {
      sheet.addRow(Object.fromEntries(definition.columns.map((column) => [column.key, formatValue(column.key, record[column.key])])))
    });
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102D37" } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = { from: "A1", to: { row: 1, column: definition.columns.length } };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${definition.filename}"`,
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error && error.message === "UNAUTHORIZED"
      ? "Não autorizado."
      : "Não foi possível preparar o Excel.";
    return NextResponse.json({ error: message }, { status: message === "Não autorizado." ? 401 : 500 });
  }
}

async function exportAttendanceHistory(request: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const authorization = request.headers.get("authorization") || "";
  if (!url || !key || !authorization) return NextResponse.json({ error: "Não autorizado." }, { status: 401 });

  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } }
  });
  const { data: attendance, error } = await client
    .from("attendance_records")
    .select("event_id,member_id,status,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Não foi possível consultar o histórico de presenças." }, { status: 403 });

  const eventIds = [...new Set((attendance || []).map((record) => record.event_id))];
  const memberIds = [...new Set((attendance || []).map((record) => record.member_id))];
  const [{ data: events }, { data: members }] = await Promise.all([
    eventIds.length
      ? client.from("workspace_events").select("id,title,starts_at,location").in("id", eventIds)
      : Promise.resolve({ data: [] }),
    memberIds.length
      ? client.from("team_members").select("id,name,role,area").in("id", memberIds)
      : Promise.resolve({ data: [] })
  ]);
  const eventsById = new Map((events || []).map((event) => [event.id, event]));
  const membersById = new Map((members || []).map((member) => [member.id, member]));
  const statusLabels: Record<string, string> = { present: "Presente", absent: "Ausente", justified: "Justificada" };

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Histórico de presenças");
  sheet.columns = [
    { header: "Evento", key: "event", width: 34 },
    { header: "Data do evento", key: "eventDate", width: 22 },
    { header: "Local", key: "location", width: 26 },
    { header: "Membro", key: "member", width: 28 },
    { header: "Cargo", key: "role", width: 30 },
    { header: "Presença", key: "status", width: 16 },
    { header: "Registada em", key: "recordedAt", width: 22 }
  ];
  (attendance || []).forEach((record) => {
    const event = eventsById.get(record.event_id);
    const member = membersById.get(record.member_id);
    sheet.addRow({
      event: safeExcelText(event?.title || "Evento indisponível"),
      eventDate: formatValue("starts_at", event?.starts_at),
      location: safeExcelText(event?.location || ""),
      member: safeExcelText(member?.name || "Membro indisponível"),
      role: safeExcelText(member?.role || member?.area || ""),
      status: statusLabels[record.status] || safeExcelText(record.status),
      recordedAt: formatValue("created_at", record.created_at)
    });
  });
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102D37" } };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.autoFilter = { from: "A1", to: { row: 1, column: 7 } };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="historico-presencas-rise-up.xlsx"',
      "Cache-Control": "no-store"
    }
  });
}
