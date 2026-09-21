import ExcelJS from "exceljs";
import { createClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { backofficeExportResources, safeExcelText } from "@/lib/backoffice-export";
import { requireBackofficeUser } from "@/lib/server-auth";

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
    await requireBackofficeUser(request);

    const { resource } = await params;
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
