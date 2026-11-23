import { createHmac } from "node:crypto";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const { after, rpc, updateUserById } = vi.hoisted(() => ({ after: vi.fn(), rpc: vi.fn(), updateUserById: vi.fn() }));
vi.mock("next/server", async (importOriginal) => ({ ...await importOriginal<typeof import("next/server")>(), after }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ rpc, auth: { admin: { updateUserById } } }) }));
vi.mock("@/lib/password-recovery-email", async () => import("../../../../lib/password-recovery-email"));

import { POST } from "./route";

const sendEmail = vi.fn();
const email = "riser@example.com";
const password = "example-password-123";

function submit(payload: object) {
  return POST(new Request("https://riseupmaia.pt/api/backoffice/password-recovery", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
  }));
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("RESEND_API_KEY", "test-resend");
  vi.stubEnv("EMAIL_FROM", "Rise Up <backoffice@updates.riseupmaia.pt>");
  vi.stubGlobal("fetch", sendEmail);
  sendEmail.mockResolvedValue(new Response(null, { status: 200 }));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("sends a branded code and stores only its keyed hash", async () => {
  rpc.mockResolvedValue({ data: true });
  const response = await submit({ action: "request", email: " Riser@Example.com " });
  expect(response.status).toBe(202);
  expect(await response.json()).toEqual({ ok: true });
  expect(sendEmail).not.toHaveBeenCalled();
  await after.mock.calls[0][0]();

  const [url, options] = sendEmail.mock.calls[0];
  const message = JSON.parse(options.body);
  const code = message.text.match(/^\d{6}$/m)?.[0];
  expect(code).toMatch(/^\d{6}$/);
  expect(url).toBe("https://api.resend.com/emails");
  expect(message.from).toBe("Rise Up <backoffice@updates.riseupmaia.pt>");
  expect(message.to).toEqual([email]);
  expect(message.html).toContain(`>${code}</div>`);
  expect(message.html).toContain("riseup-logo.png");
  expect(message.html).toContain("10 minutos");
  expect(rpc).toHaveBeenCalledWith("issue_backoffice_recovery", {
    account_email: email,
    proposed_hash: createHmac("sha256", "test-key").update(`backoffice-password-recovery\0${email}\0${code}`).digest("hex")
  });
});

it("gives the same response without sending email when no code can be issued", async () => {
  rpc.mockResolvedValue({ data: false });
  const response = await submit({ action: "request", email });
  expect(response.status).toBe(202);
  expect(await response.json()).toEqual({ ok: true });
  await after.mock.calls[0][0]();
  expect(sendEmail).not.toHaveBeenCalled();
});

it("changes the password only for the account returned after consuming the code", async () => {
  rpc.mockResolvedValueOnce({ data: "eligible-user" }).mockResolvedValueOnce({ data: null });
  updateUserById.mockResolvedValue({ error: null });
  const payload = { action: "reset", email, code: "012345", password, userId: "other-user" };
  expect((await submit(payload)).status).toBe(200);
  expect((await submit(payload)).status).toBe(400);
  expect(updateUserById).toHaveBeenCalledExactlyOnceWith("eligible-user", { password });
});

it.each([
  { code: "12345", password },
  { code: "012345", password: "short" },
  { code: "012345", password: "á".repeat(37) }
])("rejects invalid input before consuming a code", async (fields) => {
  expect((await submit({ action: "reset", email, ...fields })).status).toBe(400);
  expect(rpc).not.toHaveBeenCalled();
  expect(updateUserById).not.toHaveBeenCalled();
});
