import type { NextRequest } from "next/server";
import { getDrivePreview } from "@/lib/workspace-drive";
import { canReadDrive, requireBackofficeUser } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ fileId: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await requireBackofficeUser(request);
    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
    if (!canReadDrive(identity.role)) return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const { fileId } = await params;
    const { response, file, contentType } = await getDrivePreview(fileId, identity.role, accessToken);
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DRIVE_REQUEST_FAILED";
    const status = message === "UNAUTHORIZED" ? 401 : message === "DRIVE_PREVIEW_UNSUPPORTED" ? 415 : message === "FORBIDDEN" ? 403 : 400;
    return Response.json({ error: message }, { status });
  }
}
