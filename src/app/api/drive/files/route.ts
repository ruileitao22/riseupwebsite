import { NextResponse, type NextRequest } from "next/server";
import { createDriveFolder, listDriveFolder, RISEUP_DRIVE_ROOT, uploadDriveFile } from "@/lib/google-drive";
import { canReadDrive, canWriteDrive, requireBackofficeUser } from "@/lib/server-auth";

function failure(error: unknown) {
  const message = error instanceof Error ? error.message : "DRIVE_REQUEST_FAILED";
  const status = message === "UNAUTHORIZED" ? 401 : message === "DRIVE_NOT_CONFIGURED" ? 503 : message === "DRIVE_OUTSIDE_ROOT" ? 403 : 400;
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!canReadDrive(identity.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const folderId = request.nextUrl.searchParams.get("folderId") || RISEUP_DRIVE_ROOT;
    const result = await listDriveFolder(folderId);
    return NextResponse.json({ ...result, rootFolderId: RISEUP_DRIVE_ROOT, permissions: { write: canWriteDrive(identity.role), delete: identity.role === "admin" } });
  } catch (error) {
    return failure(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!canWriteDrive(identity.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      const parentId = String(form.get("parentId") || RISEUP_DRIVE_ROOT);
      if (!(file instanceof File) || file.size === 0 || file.size > 25 * 1024 * 1024) {
        return NextResponse.json({ error: "INVALID_FILE" }, { status: 400 });
      }
      return NextResponse.json(await uploadDriveFile(parentId, file), { status: 201 });
    }
    const body = await request.json() as { action?: string; name?: string; parentId?: string };
    if (body.action !== "createFolder" || !body.name?.trim() || body.name.trim().length > 180) {
      return NextResponse.json({ error: "INVALID_FOLDER" }, { status: 400 });
    }
    return NextResponse.json(await createDriveFolder(body.parentId || RISEUP_DRIVE_ROOT, body.name.trim()), { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
