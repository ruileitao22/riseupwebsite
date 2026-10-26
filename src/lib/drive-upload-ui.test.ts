import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync("backoffice-workspace.js", "utf8");
const handler = source.slice(
  source.indexOf("  async function uploadDriveFiles(files)"),
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
      workspace: { preview: false, drive: { folderId: "rh", permissions: { write: true } } },
      $: () => null,
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
      expect(setDriveMessage).toHaveBeenLastCalledWith("0 ficheiros carregados. documento.txt: UPLOAD_FAILED", "error");
    } else {
      expect(loadDrive).toHaveBeenCalledWith("rh");
      expect(setDriveMessage).toHaveBeenLastCalledWith("Ficheiro carregado.", "success");
    }
  });
});

describe("Drive drag and drop", () => {
  it("uploads dropped files to the original folder and continues after a failure", async () => {
    const handlers: Record<string, (event: unknown) => void> = {};
    const zone = {
      addEventListener: (name: string, callback: (event: unknown) => void) => { handlers[name] = callback; },
      classList: { add: vi.fn(), remove: vi.fn() }
    };
    const workspace = { preview: false, drive: { folderId: "rh", permissions: { write: true } } };
    const destinations: unknown[] = [];
    const driveRequest = vi.fn(async (_url: string, options: { body: FormData }) => {
      destinations.push(options.body.get("parentId"));
      workspace.drive.folderId = "comunicacao";
      if (destinations.length === 1) throw new Error("UPLOAD_FAILED");
    });
    const setDriveMessage = vi.fn();
    runInNewContext(handler + "\nbindDriveDropZone()", {
      workspace, driveRequest, setDriveMessage, loadDrive: vi.fn(), FormData,
      $: (selector: string) => selector === "[data-drive-drop-zone]" ? zone : null
    });
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { types: ["Files"], files: [
        new File(["a"], "a.txt"), new File(["b"], "b.txt")
      ] }
    };
    handlers.dragenter(event);
    expect(zone.classList.add).toHaveBeenCalledWith("is-dragging");
    handlers.drop(event);
    await vi.waitFor(() => expect(setDriveMessage).toHaveBeenLastCalledWith(
      "Ficheiro carregado. a.txt: UPLOAD_FAILED", "error"
    ));
    expect(destinations).toEqual(["rh", "rh"]);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(zone.classList.remove).toHaveBeenCalledWith("is-dragging");
  });
});
