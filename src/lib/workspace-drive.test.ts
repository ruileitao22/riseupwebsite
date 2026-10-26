import { beforeEach, describe, expect, it, vi } from "vitest";
const storage = vi.hoisted(() => ({ upload: vi.fn(), move: vi.fn(), list: vi.fn(), download: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ storage: { from: () => storage } })
}));
import { uploadDriveFile, uploadDriveFileBytes, renameDriveFile, listDriveFolder, getDrivePreview } from "./workspace-drive";
const id = (path: string) => Buffer.from(path).toString("base64url");
const path = (id: string) => Buffer.from(id, "base64url").toString();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_ANON_KEY", "test-key");
  storage.upload.mockResolvedValue({ error: null });
  storage.move.mockResolvedValue({ error: null });
});
describe("Drive titles", () => {
  it.each(["Declaração de participação — João.pdf", "Orçamento #1 + revisão?.docx", "Plano..final.pdf", "__riseup_title__custom.pdf"])("round-trips %s through upload, listing and download", async (name) => {
    const result = await uploadDriveFile(id("recursos-humanos"), new File(["test"], name, { type: "application/pdf" }), "admin", "token");
    const key = path(result.id);
    expect(key).toMatch(/^[a-zA-Z0-9_./ ()-]+$/);
    expect(result.name).toBe(name);
    storage.list.mockResolvedValue({ data: [{ name: key.split("/").at(-1), metadata: { mimetype: "application/pdf" } }], error: null });
    const listed = await listDriveFolder(id("recursos-humanos"), "admin", "token");
    expect(listed.files[0].name).toBe(name);
    storage.download.mockResolvedValue({ data: new Blob(["test"]), error: null });
    expect((await getDrivePreview(result.id, "admin", "token")).file.name).toBe(name);
  });
  it("renames an existing file to an accented title without overwriting", async () => {
    const result = await renameDriveFile(id("recursos-humanos/old.pdf"), "Ficha de inscrição.pdf", "admin", "token");
    expect(storage.move).toHaveBeenCalledWith("recursos-humanos/old.pdf", path(result.id));
    expect(path(result.id)).toMatch(/^recursos-humanos\/[a-zA-Z0-9_-]+$/);
    expect(result.name).toBe("Ficha de inscrição.pdf");
  });
  it("uses compatible keys for generated documents too", async () => {
    const result = await uploadDriveFileBytes(id("direcao"), "Denúncia.pdf", new Uint8Array([1]), "application/pdf", "admin", "token");
    expect(storage.upload.mock.calls[0][0]).toBe(path(result.id));
    expect(result.name).toBe("Denúncia.pdf");
  });
  it("retains department access restrictions", async () => {
    await expect(renameDriveFile(id("direcao/old.pdf"), "Novo.pdf", "hr_team", "token")).rejects.toThrow("FORBIDDEN");
    expect(storage.move).not.toHaveBeenCalled();
  });
});
