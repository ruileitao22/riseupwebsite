import type { NextRequest } from "next/server";
import { deleteInternalDocument, moveInternalDocumentToDrive } from "@/lib/internal-records";
import { requireBackofficeUser } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ id: string }> };

function validId(id: string) {
  return /^[0-9a-f-]{36}$/i.test(id);
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "INTERNAL_DOCUMENT_REQUEST_FAILED";
  const status = message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : message === "DOCUMENT_NOT_FOUND" ? 404 : 400;
  return Response.json({ error: message }, { status });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!["admin", "coordinator", "vice_coordinator"].includes(identity.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const { id } = await params;
    if (!validId(id)) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const body = await request.json() as { action?: string; folderId?: string };
    if (body.action !== "move_to_drive" || !body.folderId) return Response.json({ error: "INVALID_DESTINATION" }, { status: 400 });
    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
    const driveFile = await moveInternalDocumentToDrive({ id, folderId: body.folderId, role: identity.role, accessToken });
    return Response.json({ driveFile });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!["admin", "coordinator", "vice_coordinator"].includes(identity.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const { id } = await params;
    if (!validId(id)) return Response.json({ error: "NOT_FOUND" }, { status: 404 });
    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
    await deleteInternalDocument(id, accessToken);
    return new Response(null, { status: 204 });
  } catch (error) {
    return errorResponse(error);
  }
}
