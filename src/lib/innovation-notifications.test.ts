import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getInnovationRequest, sendNewInnovationRequestNotifications } from "./innovation-notifications";

const { requestResult, roleResult, profilesResult, membersResult, from } = vi.hoisted(() => {
  const requestResult = vi.fn();
  const roleResult = vi.fn();
  const profilesResult = vi.fn();
  const membersResult = vi.fn();
  const from = vi.fn((table: string) => {
    if (table === "innovation_requests") return { select: () => ({ eq: () => ({ maybeSingle: requestResult }) }) };
    if (table === "user_profiles") return { select: (fields: string) => fields === "id" ? { in: roleResult } : { in: profilesResult } };
    return { select: () => ({ in: membersResult }) };
  });
  return { requestResult, roleResult, profilesResult, membersResult, from };
});
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from }) }));
const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("RESEND_API_KEY", "test");
  vi.stubEnv("SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://riseupmaia.pt");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(new Response(null, { status: 200 }));
  requestResult.mockResolvedValue({ data: { id: "request-1", request_type: "idea", title: "Melhorar propostas", description: "Criar modelos reutilizáveis.", submitted_by: "member-1" }, error: null });
  roleResult.mockResolvedValue({ data: [{ id: "innovation-1" }, { id: "leader-1" }], error: null });
  profilesResult.mockImplementation((_column: string, ids: string[]) => Promise.resolve({
    data: [{ id: "member-1", email: "ana@example.com" }, { id: "innovation-1", email: "inovacao@example.com" }, { id: "leader-1", email: "lider@example.com" }].filter((profile) => ids.includes(profile.id)),
    error: null
  }));
  membersResult.mockResolvedValue({ data: [{ user_id: "member-1", name: "Ana" }], error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("innovation notifications", () => {
  it("loads the request from the server-side client", async () => {
    await expect(getInnovationRequest("request-1")).resolves.toMatchObject({ title: "Melhorar propostas" });
    expect(from).toHaveBeenCalledWith("innovation_requests");
  });

  it("notifies every Innovation and Projects recipient", async () => {
    await expect(sendNewInnovationRequestNotifications("request-1")).resolves.toEqual({ sent: 2 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const first = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(first).toMatchObject({ to: ["inovacao@example.com"], subject: "Nova ideia no Banco de Ideias e Problemas: Melhorar propostas" });
    expect(first.text).toContain("Ana registou uma ideia");
  });

  it("fails visibly when there are no Innovation and Projects recipients", async () => {
    roleResult.mockResolvedValue({ data: [], error: null });
    await expect(sendNewInnovationRequestNotifications("request-1")).rejects.toThrow("No innovation team email recipients");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
