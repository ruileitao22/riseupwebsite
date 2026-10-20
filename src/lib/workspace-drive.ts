import { createClient } from "@supabase/supabase-js";

export const WORKSPACE_DOCUMENTS_BUCKET = "workspace-documents";
export const RISEUP_DRIVE_ROOT = "root";
export const DRIVE_FOLDER_MIME = "application/vnd.riseup.folder";

export type DriveFile = { id: string; name: string; mimeType: string; modifiedTime: string; size?: string };
type StorageEntry = { name: string; metadata?: { size?: number | null; mimetype?: string | null; lastModified?: string | null } | null };
type Department = { key: string; name: string; roles: string[] };

export const DRIVE_DEPARTMENTS: Department[] = [
  { key: "direcao", name: "Direção", roles: ["admin", "coordinator", "vice_coordinator"] },
  { key: "comercial-marketing", name: "Comercial e Marketing", roles: ["commercial_team", "team_leader_commercial"] },
  { key: "recursos-humanos", name: "Recursos Humanos", roles: ["hr_team", "team_leader_hr"] },
  { key: "comunicacao", name: "Comunicação", roles: ["communication_team", "team_leader_communication"] },
  { key: "inovacao-projetos", name: "Inovação e Projetos", roles: ["projects_innovation_team", "team_leader_projects_innovation"] }
];

function requestClient(accessToken: string) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key || !accessToken) throw new Error("UNAUTHORIZED");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { headers: { Authorization: `Bearer ${accessToken}` } } });
}
function encode(path: string) { return Buffer.from(path).toString("base64url"); }
function decode(id: string) {
  if (id === RISEUP_DRIVE_ROOT) return "";
  let path = "";
  try { path = Buffer.from(id, "base64url").toString("utf8"); } catch { throw new Error("DRIVE_FILE_NOT_FOUND"); }
  if (!path || path.startsWith("/") || path.includes("..") || path.includes("\\")) throw new Error("DRIVE_FILE_NOT_FOUND");
  return path;
}
function cleanName(value: string) { const name = value.trim().replace(/[\\/]+/g, "-"); if (!name || name === "." || name === ".." || name.length > 180) throw new Error("INVALID_NAME"); return name; }
function isDirection(role: string) { return ["admin", "coordinator", "vice_coordinator"].includes(role); }
export function driveDepartmentsForRole(role: string) { return isDirection(role) ? DRIVE_DEPARTMENTS : DRIVE_DEPARTMENTS.filter((department) => department.roles.includes(role)); }
function assertPathAccess(role: string, path: string, allowRoot = true) {
  if (!path) { if (allowRoot) return; throw new Error("DRIVE_ROOT_PROTECTED"); }
  const department = DRIVE_DEPARTMENTS.find((item) => path === item.key || path.startsWith(`${item.key}/`));
  if (!department || (!isDirection(role) && !department.roles.includes(role))) throw new Error("FORBIDDEN");
}
function assertNotDepartmentRoot(path: string) {
  if (DRIVE_DEPARTMENTS.some((department) => department.key === path)) throw new Error("DRIVE_DEPARTMENT_PROTECTED");
}
function folderPath(id?: string) { return id ? decode(id) : ""; }
function folderFile(department: Department): DriveFile { return { id: encode(department.key), name: department.name, mimeType: DRIVE_FOLDER_MIME, modifiedTime: new Date().toISOString() }; }

export async function listDriveFolder(folderId: string | undefined, role: string, accessToken: string) {
  const path = folderPath(folderId);
  assertPathAccess(role, path);
  if (!path) return { files: driveDepartmentsForRole(role).map(folderFile), rootFolderId: RISEUP_DRIVE_ROOT };
  const { data, error } = await requestClient(accessToken).storage.from(WORKSPACE_DOCUMENTS_BUCKET).list(path, { limit: 200, sortBy: { column: "name", order: "asc" } });
  if (error) throw error;
  const files: DriveFile[] = (data as StorageEntry[] || []).filter((entry) => entry.name !== ".keep").map((entry) => {
    const entryPath = `${path}/${entry.name}`;
    const isFolder = !entry.metadata;
    return { id: encode(entryPath), name: entry.name, mimeType: isFolder ? DRIVE_FOLDER_MIME : entry.metadata?.mimetype || "application/octet-stream", modifiedTime: entry.metadata?.lastModified || new Date().toISOString(), size: entry.metadata?.size ? String(entry.metadata.size) : undefined };
  });
  return { files, rootFolderId: RISEUP_DRIVE_ROOT };
}

export async function createDriveFolder(parentId: string | undefined, name: string, role: string, accessToken: string) {
  const parent = folderPath(parentId); assertPathAccess(role, parent, false);
  const path = `${parent}/${cleanName(name)}/.keep`;
  const { error } = await requestClient(accessToken).storage.from(WORKSPACE_DOCUMENTS_BUCKET).upload(path, new Blob([""]), { contentType: "text/plain", upsert: false });
  if (error) throw error;
  const folderPathValue = path.slice(0, -"/.keep".length);
  return { id: encode(folderPathValue), name: folderPathValue.split("/").at(-1) || name, mimeType: DRIVE_FOLDER_MIME, modifiedTime: new Date().toISOString() } satisfies DriveFile;
}

export async function uploadDriveFile(parentId: string | undefined, file: File, role: string, accessToken: string) {
  const parent = folderPath(parentId); assertPathAccess(role, parent, false);
  const name = cleanName(file.name); const path = `${parent}/${name}`;
  const { error } = await requestClient(accessToken).storage.from(WORKSPACE_DOCUMENTS_BUCKET).upload(path, await file.arrayBuffer(), { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw error;
  return { id: encode(path), name, mimeType: file.type || "application/octet-stream", modifiedTime: new Date().toISOString(), size: String(file.size) } satisfies DriveFile;
}

export async function uploadDriveFileBytes(parentId: string | undefined, filename: string, content: ArrayBuffer | Uint8Array, mimeType: string, role: string, accessToken: string) {
  const parent = folderPath(parentId); assertPathAccess(role, parent, false);
  const name = cleanName(filename); const path = parent + "/" + name;
  const bytes = content instanceof Uint8Array ? content : new Uint8Array(content);
  const { error } = await requestClient(accessToken).storage.from(WORKSPACE_DOCUMENTS_BUCKET).upload(path, bytes, { contentType: mimeType || "application/octet-stream", upsert: false });
  if (error) throw error;
  return { id: encode(path), name, mimeType: mimeType || "application/octet-stream", modifiedTime: new Date().toISOString(), size: String(bytes.byteLength) } satisfies DriveFile;
}

export async function renameDriveFile(fileId: string, name: string, role: string, accessToken: string) {
  const current = decode(fileId); assertPathAccess(role, current, false); assertNotDepartmentRoot(current);
  const parent = current.split("/").slice(0, -1).join("/"); const target = `${parent}/${cleanName(name)}`;
  const { error } = await requestClient(accessToken).storage.from(WORKSPACE_DOCUMENTS_BUCKET).move(current, target);
  if (error) throw error;
  return { id: encode(target), name: target.split("/").at(-1) || name, mimeType: "application/octet-stream", modifiedTime: new Date().toISOString() } satisfies DriveFile;
}

export async function trashDriveFile(fileId: string, role: string, accessToken: string) {
  const path = decode(fileId); assertPathAccess(role, path, false);
  const { error } = await requestClient(accessToken).storage.from(WORKSPACE_DOCUMENTS_BUCKET).remove([path]);
  if (error) throw error;
}

export async function getDrivePreview(fileId: string, role: string, accessToken: string) {
  const path = decode(fileId); assertPathAccess(role, path, false);
  const { data, error } = await requestClient(accessToken).storage.from(WORKSPACE_DOCUMENTS_BUCKET).download(path);
  if (error || !data) throw error || new Error("DRIVE_FILE_NOT_FOUND");
  return { response: new Response(data.stream()), file: { name: path.split("/").at(-1) || "documento" }, contentType: data.type || "application/octet-stream" };
}
