import { z } from "zod";

// Midnight after 16 September in Europe/Lisbon (WEST).
export const OPEN_DAY_DEADLINE = "2026-09-16T23:00:00.000Z";
export const openDayClosed = (now = new Date()) => now.getTime() >= Date.parse(OPEN_DAY_DEADLINE);
export const openDayRoles = ["coordinator", "vice_coordinator", "team_leader", "team_leader_communication", "team_leader_projects_innovation", "team_leader_commercial", "team_leader_hr"];
export const canManageOpenDay = (role: string) => openDayRoles.includes(role);
export const openDaySchema = z.object({
  name: z.string().trim().min(2).max(160),
  participant_type: z.enum(["student", "legend", "external"]),
  organization: z.string().trim().max(160),
  student_number: z.string().trim().max(40),
  course: z.string().trim().max(160),
  email: z.email().max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{6,24}$/),
  lunch: z.boolean(),
  dietary_requirements: z.string().trim().max(500)
}).strict().superRefine((value, context) => {
  if (value.participant_type === "student" && !value.course) {
    context.addIssue({ code: "custom", path: ["course"], message: "Indica o teu curso." });
  }
}).transform(value => ({
  ...value,
  student_number: value.participant_type === "student" ? value.student_number : "",
  course: value.participant_type === "student" ? value.course : "",
  organization: value.participant_type === "external" ? value.organization : "",
  dietary_requirements: value.lunch ? value.dietary_requirements : ""
}));
