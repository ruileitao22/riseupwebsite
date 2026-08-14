import { NextResponse, type NextRequest } from "next/server";
import { renameDriveFile, trashDriveFile } from "@/lib/google-drive";
import { canDeleteDrive, canWriteDrive, requireBackofficeUser } from "@/lib/server-auth";

type RouteContext = { params: Promise<{ fileId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!canWriteDrive(identity.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const { fileId } = await params;
    const body = await request.json() as { name?: string };
    if (!body.name?.trim() || body.name.trim().length > 180) return NextResponse.json({ error: "INVALID_NAME" }, { status: 400 });
    return NextResponse.json(await renameDriveFile(fileId, body.name.trim()));
  } catch (error) {
    const message = error instanceof Error ? error.message : "DRIVE_REQUEST_FAILED";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const identity = await requireBackofficeUser(request);
    if (!canDeleteDrive(identity.role)) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    const { fileId } = await params;
    await trashDriveFile(fileId);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DRIVE_REQUEST_FAILED";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}
