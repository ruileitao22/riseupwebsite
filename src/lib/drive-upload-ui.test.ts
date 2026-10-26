import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("backoffice-workspace.js", "utf8");
const handler = source.slice(
  source.indexOf("  async function uploadDriveFile(event)"),
  source.indexOf("  function renderProfileModules()")
);

describe("Drive upload event lifecycle", () => {
  it.each([false, true])("handles a completed browser event (upload failure: %s)", async (fails) => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const driveRequest = vi.fn(async () => {
      await pending;
      if (fails) throw new Error("UPLOAD_FAILED");
    });
    const loadDrive = vi.fn();
    const setDriveMessage = vi.fn();
    const upload = runInNewContext(handler + "\nuploadDriveFile", {
      workspace: { preview: false, drive: { folderId: "rh" } },
      driveRequest, loadDrive, setDriveMessage, FormData
    });
    const file = new File(["test"], "documento.txt", { type: "text/plain" });
    const input = { files: [file], value: "documento.txt" };
    const event: { currentTarget: typeof input | null } = { currentTarget: input };
    const result = upload(event);
    event.currentTarget = null; // Browser clears this before the request resolves.
    finish();
    await result;

    expect(input.value).toBe("");
    expect(driveRequest).toHaveBeenCalledOnce();
    const body = driveRequest.mock.calls[0] as unknown as [string, { body: FormData }];
    expect(body[1].body.get("parentId")).toBe("rh");
    expect(body[1].body.get("file")).toBeInstanceOf(File);
    if (fails) {
      expect(loadDrive).not.toHaveBeenCalled();
      expect(setDriveMessage).toHaveBeenLastCalledWith("UPLOAD_FAILED", "error");
    } else {
      expect(loadDrive).toHaveBeenCalledWith("rh");
      expect(setDriveMessage).toHaveBeenLastCalledWith("Ficheiro carregado.", "success");
    }
  });
});
