import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { submissionSchema, submissionTables } from "../../../lib/submissions";

const { after, send } = vi.hoisted(() => ({ after: vi.fn(), send: vi.fn() }));
vi.mock("next/server", async (importOriginal) => ({ ...await importOriginal<typeof import("next/server")>(), after }));
vi.mock("@/lib/submissions", () => ({ submissionSchema, submissionTables }));
vi.mock("@/lib/submission-notifications", () => ({ sendSubmissionNotification: send }));
const fetchMock = vi.fn();
let requestNumber = 0;
const request = () => new NextRequest("https://riseupmaia.pt/api/submissions", {
  method: "POST", headers: { "x-forwarded-for": `test-${requestNumber++}` },
  body: JSON.stringify({ type: "contact", payload: { name: "Ana", email: "ana@example.com", message: "Olá",
    source_page: "contact", page_url: "https://riseupmaia.pt/contactos", language: "pt", user_agent: "test" } })
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_ANON_KEY", "test");
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("schedules notification only after the submission is stored", async () => {
  const { POST } = await import("./route");
  fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
  expect((await POST(request())).status).toBe(204);
  expect(after).toHaveBeenCalledOnce();
  await after.mock.calls[0][0]();
  expect(send).toHaveBeenCalledOnce();
});
it("does not notify when storage fails", async () => {
  const { POST } = await import("./route");
  vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockResolvedValue(new Response(null, { status: 500 }));
  expect((await POST(request())).status).toBe(502);
  expect(after).not.toHaveBeenCalled();
});
it("preserves success and logs notification failure without exposing submitted data", async () => {
  const { POST } = await import("./route");
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  fetchMock.mockResolvedValue(new Response(null, { status: 201 }));
  send.mockRejectedValueOnce(new Error("Missing RESEND_API_KEY"));
  expect((await POST(request())).status).toBe(204);
  await expect(after.mock.calls[0][0]()).resolves.toBeUndefined();
  expect(log).toHaveBeenCalledWith("Submission notification failed:", "contact", "Missing RESEND_API_KEY");
});
