import { describe, expect, it } from "vitest";
import { canManageOpenDay, openDayClosed, openDaySchema } from "./open-day";

describe("Open Day registrations", () => {
  it("restricts management to the requested leadership roles", () => {
    expect(canManageOpenDay("coordinator")).toBe(true);
    expect(canManageOpenDay("vice_coordinator")).toBe(true);
    expect(canManageOpenDay("team_leader_hr")).toBe(true);
    expect(canManageOpenDay("admin")).toBe(false);
    expect(canManageOpenDay("member")).toBe(false);
  });
  it("closes at 15:00 on 17 September in mainland Portugal", () => {
    expect(openDayClosed(new Date("2026-09-17T13:59:59Z"))).toBe(false);
    expect(openDayClosed(new Date("2026-09-17T14:00:00Z"))).toBe(true);
  });
  it("accepts public attendees and clears dietary data without lunch", () => {
    const result = openDaySchema.parse({ name: "Pessoa Externa", participant_type: "external", organization: "Empresa Exemplo", student_number: "", course: "", email: "EXEMPLO@EMAIL.PT", phone: "+351 910 000 000", lunch: false, dietary_requirements: "Vegetariano" });
    expect(result.email).toBe("exemplo@email.pt");
    expect(result.dietary_requirements).toBe("");
    expect(result.organization).toBe("Empresa Exemplo");
  });
});
