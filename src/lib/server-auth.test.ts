import { describe, expect, it } from "vitest";
import { canDeleteDrive, canReadDrive, canWriteDrive } from "./server-auth";

describe("Google Drive role permissions", () => {
  it.each([
    "admin",
    "team_leader",
    "team_leader_communication",
    "team_leader_projects_innovation",
    "team_leader_commercial",
    "team_leader_hr"
  ])("allows %s to write", (role) => {
    expect(canWriteDrive(role)).toBe(true);
    expect(canReadDrive(role)).toBe(true);
  });

  it.each(["communication_team", "projects_innovation_team", "hr_team", "member"])("keeps %s read-only", (role) => {
    expect(canWriteDrive(role)).toBe(false);
    expect(canReadDrive(role)).toBe(false);
  });

  it("only allows administrators to delete", () => {
    expect(canDeleteDrive("admin")).toBe(true);
    expect(canDeleteDrive("team_leader_hr")).toBe(false);
  });
});
