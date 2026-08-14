import { GoogleAuth, OAuth2Client } from "google-auth-library";

export const DRIVE_FOLDER_MIME = "application/vnd.google-apps.folder";
export const RISEUP_DRIVE_ROOT = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "18mdhHygC7zUMlU7U0r_2lR5SXkvg2s8T";

export type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
  parents?: string[];
  capabilities?: { canEdit?: boolean; canDelete?: boolean; canDownload?: boolean };
};

type DriveListResponse = { files?: DriveFile[]; nextPageToken?: string };

let auth: GoogleAuth | OAuth2Client | undefined;
const ancestryCache = new Map<string, boolean>();

function getAuth() {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  if (clientId && clientSecret && refreshToken) {
    if (!(auth instanceof OAuth2Client)) {
      const oauth = new OAuth2Client(clientId, clientSecret);
      oauth.setCredentials({ refresh_token: refreshToken });
      auth = oauth;
    }
    return auth;
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !privateKey) throw new Error("DRIVE_NOT_CONFIGURED");
  auth ??= new GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/drive"]
  });
  return auth;
}

async function driveFetch(path: string, init: RequestInit = {}) {
  const access = await getAuth().getAccessToken();
  const token = typeof access === "string" ? access : access?.token;
  if (!token) throw new Error("DRIVE_AUTH_FAILED");
  const response = await fetch(path.startsWith("http") ? path : `https://www.googleapis.com/drive/v3${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
    cache: "no-store"
  });
  if (!response.ok) {
    const detail = await response.text();
    console.error("Google Drive request failed:", response.status, detail.slice(0, 500));
    throw new Error(response.status === 404 ? "DRIVE_FILE_NOT_FOUND" : "DRIVE_REQUEST_FAILED");
  }
  return response;
}

export async function getDriveFile(fileId: string) {
  const fields = "id,name,mimeType,modifiedTime,size,webViewLink,iconLink,parents,capabilities(canEdit,canDelete,canDownload)";
  const response = await driveFetch(`/files/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(fields)}&supportsAllDrives=true`);
  return response.json() as Promise<DriveFile>;
}

export async function assertInsideRiseUpDrive(fileId: string) {
  if (!/^[A-Za-z0-9_-]{10,}$/.test(fileId)) throw new Error("INVALID_DRIVE_ID");
  if (fileId === RISEUP_DRIVE_ROOT) return;
  const cached = ancestryCache.get(fileId);
  if (cached === true) return;

  const visited = new Set<string>();
  let currentId = fileId;
  for (let depth = 0; depth < 100; depth += 1) {
    if (currentId === RISEUP_DRIVE_ROOT) {
      ancestryCache.set(fileId, true);
      return;
    }
    if (visited.has(currentId)) break;
    visited.add(currentId);
    const file = await getDriveFile(currentId);
    const parent = file.parents?.[0];
    if (!parent) break;
    currentId = parent;
  }
  throw new Error("DRIVE_OUTSIDE_ROOT");
}

export async function listDriveFolder(folderId = RISEUP_DRIVE_ROOT) {
  await assertInsideRiseUpDrive(folderId);
  const q = `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false`;
  const fields = "nextPageToken,files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink,parents,capabilities(canEdit,canDelete,canDownload))";
  const params = new URLSearchParams({ q, fields, pageSize: "200", orderBy: "folder,name_natural", supportsAllDrives: "true", includeItemsFromAllDrives: "true" });
  const response = await driveFetch(`/files?${params}`);
  const data = await response.json() as DriveListResponse;
  return { folderId, files: data.files || [] };
}

export async function createDriveFolder(parentId: string, name: string) {
  await assertInsideRiseUpDrive(parentId);
  const response = await driveFetch("/files?supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,webViewLink,parents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: DRIVE_FOLDER_MIME, parents: [parentId] })
  });
  return response.json() as Promise<DriveFile>;
}

export async function uploadDriveFile(parentId: string, file: File) {
  await assertInsideRiseUpDrive(parentId);
  const start = await driveFetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,size,webViewLink,parents", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Upload-Content-Type": file.type || "application/octet-stream",
      "X-Upload-Content-Length": String(file.size)
    },
    body: JSON.stringify({ name: file.name, parents: [parentId] })
  });
  const uploadUrl = start.headers.get("location");
  if (!uploadUrl) throw new Error("DRIVE_UPLOAD_FAILED");
  const response = await driveFetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream", "Content-Length": String(file.size) },
    body: await file.arrayBuffer()
  });
  return response.json() as Promise<DriveFile>;
}

export async function renameDriveFile(fileId: string, name: string) {
  await assertInsideRiseUpDrive(fileId);
  const response = await driveFetch(`/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,name,mimeType,modifiedTime,size,webViewLink,parents`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name })
  });
  return response.json() as Promise<DriveFile>;
}

export async function trashDriveFile(fileId: string) {
  if (fileId === RISEUP_DRIVE_ROOT) throw new Error("DRIVE_ROOT_PROTECTED");
  await assertInsideRiseUpDrive(fileId);
  await driveFetch(`/files/${encodeURIComponent(fileId)}?supportsAllDrives=true&fields=id,trashed`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trashed: true })
  });
  ancestryCache.delete(fileId);
}

export async function getDrivePreview(fileId: string) {
  await assertInsideRiseUpDrive(fileId);
  const file = await getDriveFile(fileId);
  const exportable = new Set([
    "application/vnd.google-apps.document",
    "application/vnd.google-apps.spreadsheet",
    "application/vnd.google-apps.presentation",
    "application/vnd.google-apps.drawing"
  ]);
  if (exportable.has(file.mimeType)) {
    const response = await driveFetch(`/files/${encodeURIComponent(fileId)}/export?mimeType=${encodeURIComponent("application/pdf")}`);
    return { response, file, contentType: "application/pdf" };
  }
  if (file.mimeType === "application/pdf" || file.mimeType.startsWith("image/") || file.mimeType.startsWith("text/")) {
    const response = await driveFetch(`/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`);
    return { response, file, contentType: file.mimeType };
  }
  throw new Error("DRIVE_PREVIEW_UNSUPPORTED");
}
