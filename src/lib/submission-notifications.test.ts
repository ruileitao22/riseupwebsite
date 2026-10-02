import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderSubmissionEmail, sendSubmissionNotification } from "./submission-notifications";
import { submissionSchema } from "./submissions";

const { roles, select, from, createClient } = vi.hoisted(() => {
  const roles = vi.fn();
  const select = vi.fn(() => ({ in: roles }));
  const from = vi.fn(() => ({ select }));
  return { roles, select, from, createClient: vi.fn(() => ({ from })) };
});
vi.mock("@supabase/supabase-js", () => ({ createClient }));
const contact = submissionSchema.parse({ type: "contact", payload: {
  name: "Ana <script>", email: "ana@example.com", message: "Olá\nMensagem & teste",
  source_page: "contact", page_url: "", language: "pt", user_agent: "test"
} });
const application = submissionSchema.parse({ type: "application", payload: {
  name: "Ana", email: "ana@example.com", phone_contact: "912345678", course: "Gestão",
  study_year: "2", age: 21, motivation: "Participar", linkedin: null,
  source_page: "join", page_url: "", language: "pt", user_agent: "test"
} });
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test");
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.useRealTimers(); });
const email = () => JSON.parse(fetchMock.mock.calls[0][1].body);

describe("submission notifications", () => {
  it("sends contacts only to the institutional inbox with the submitter as Reply-To", async () => {
    await sendSubmissionNotification(contact);
    expect(email()).toMatchObject({ to: ["riseup@umaia.pt"], reply_to: "ana@example.com" });
    expect(email().bcc).toBeUndefined();
    expect(createClient).not.toHaveBeenCalled();
  });
  it("includes all HR roles, normalizes and deduplicates addresses, and ignores invalid emails", async () => {
    roles.mockResolvedValue({ data: [{ email: " RH@example.com " }, { email: "rh@example.com" },
      { email: "riseup@umaia.pt" }, { email: null }, { email: "invalid" }, { email: "leader@example.com" }], error: null });
    await sendSubmissionNotification(application);
    expect(from).toHaveBeenCalledWith("user_profiles");
    expect(select).toHaveBeenCalledWith("email");
    expect(roles).toHaveBeenCalledWith("role", ["hr_team", "team_leader_hr"]);
    expect(email().bcc).toEqual(["rh@example.com", "leader@example.com"]);
  });
  it("still sends to Rise Up and reports failure when HR lookup fails", async () => {
    roles.mockResolvedValue({ data: null, error: new Error("unavailable") });
    await expect(sendSubmissionNotification(application)).rejects.toThrow("HR recipient lookup failed");
    expect(email().to).toEqual(["riseup@umaia.pt"]);
  });
  it("escapes form contents in HTML while retaining readable plain text", () => {
    const message = renderSubmissionEmail(contact);
    expect(message.html).toContain("Ana &lt;script&gt;");
    expect(message.html).toContain("Olá<br>Mensagem &amp; teste");
    expect(message.text).toContain("Ana <script>");
    expect(renderSubmissionEmail(application).text).toContain("Curso: Gestão");
  });
  it("retries transient failures with the same idempotency key", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 429 }));
    const pending = sendSubmissionNotification(contact);
    await vi.runAllTimersAsync();
    await pending;
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].headers["Idempotency-Key"])
      .toBe(fetchMock.mock.calls[1][1].headers["Idempotency-Key"]);
  });
  it("reports permanent rejection without retrying", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 403 }));
    await expect(sendSubmissionNotification(contact)).rejects.toThrow("Email rejected (403)");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
