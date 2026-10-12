import type { NextRequest } from "next/server";
import { downloadInternalDocument } from "@/lib/internal-records";
import { requireBackofficeUser } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!["admin", "coordinator", "vice_coordinator"].includes(identity.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const document = await downloadInternalDocument(id);
    return new Response(document.bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(document.title)}.pdf`, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DOCUMENT_NOT_FOUND";
    return Response.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 404 });
  }
}
