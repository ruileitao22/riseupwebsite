import { describe, expect, it } from "vitest";
import { renderNewRequestEmail, renderRequestDecisionEmail, type CommunicationRequest } from "./communication-notifications";

const request: CommunicationRequest = {
  id: "request-1",
  requester_id: "user-1",
  title: "Divulgar workshop <IA>",
  description: "Publicar cartaz & inscrição",
  channels: ["Instagram", "LinkedIn"],
  desired_publish_at: "2026-08-28T10:00:00Z",
  asset_url: "https://example.com/cartaz",
  status: "pending",
  scheduled_for: null,
  rejection_reason: null,
  decided_at: null
};

const requester = { id: "user-1", email: "ana@example.com", name: "Ana" };

describe("communication notification email design", () => {
  it("renders a branded new-request email and escapes submitted content", () => {
    const html = renderNewRequestEmail(request, requester, { id: "user-2", email: "com@example.com", name: "Marta" });
    expect(html).toContain("<!doctype html>");
    expect(html).toContain("/img/riseup-logo.png");
    expect(html).toContain("Novo pedido de comunicação");
    expect(html).toContain("Divulgar workshop &lt;IA&gt;");
    expect(html).toContain("Publicar cartaz &amp; inscrição");
  });

  it("renders approved and rejected decisions with the relevant detail", () => {
    const approved = renderRequestDecisionEmail({ ...request, status: "scheduled", scheduled_for: "2026-08-30T12:00:00Z", decided_at: "2026-08-21T12:00:00Z" }, requester);
    const rejected = renderRequestDecisionEmail({ ...request, status: "rejected", rejection_reason: "O prazo é demasiado curto.", decided_at: "2026-08-21T12:00:00Z" }, requester);
    expect(approved).toContain("Aprovado e agendado");
    expect(rejected).toContain("Não aprovado");
    expect(rejected).toContain("O prazo é demasiado curto.");
  });
});
