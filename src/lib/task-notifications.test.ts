import { describe, expect, it } from "vitest";
import { renderAssignmentEmail, renderDailyTaskEmail, renderEventInvitationEmail, renderMeetingInvitationEmail } from "./task-notifications";

const recipient = { id: "user-1", email: "rui@example.com", name: "Rui" };
const task = {
  id: "task-1",
  title: "Preparar apresentação",
  description: "Rever <slides> & notas",
  priority: "high",
  due_date: "2026-08-28",
  status: "todo"
};

describe("task notification email design", () => {
  it("renders a branded and escaped assignment email", () => {
    const html = renderAssignmentEmail(task, recipient);

    expect(html).toContain("<!doctype html>");
    expect(html).toContain("/img/riseup-logo.png");
    expect(html).toContain("Nova tarefa");
    expect(html).toContain("Preparar apresentação");
    expect(html).toContain("Prioridade");
    expect(html).toContain("Alta");
    expect(html).toContain("Rever &lt;slides&gt; &amp; notas");
    expect(html).not.toContain("Rever <slides>");
  });

  it("renders overdue and upcoming sections in one daily email", () => {
    const html = renderDailyTaskEmail({
      recipient,
      overdue: [{ ...task, title: "Tarefa atrasada", due_date: "2026-08-10" }],
      dueTomorrow: [{ ...task, id: "task-2", title: "Tarefa de amanhã" }]
    });

    expect(html).toContain("Resumo diário");
    expect(html).toContain("Em atraso · 1");
    expect(html).toContain("Prazo amanhã · 1");
    expect(html).toContain("Tarefa atrasada");
    expect(html).toContain("Tarefa de amanhã");
    expect(html).toContain("Abrir o To-Do");
  });

  it("renders a branded meeting invitation with schedule and location", () => {
    const html = renderMeetingInvitationEmail({
      id: "meeting-1",
      title: "Reunião <semanal>",
      description: "Alinhar prioridades & próximos passos.",
      starts_at: "2026-09-23T17:00:00Z",
      ends_at: "2026-09-23T18:00:00Z",
      location: "Microsoft Teams",
      attendee_ids: [recipient.id],
      created_by: "creator-1"
    }, recipient);

    expect(html).toContain("Reunião marcada");
    expect(html).toContain("Reunião &lt;semanal&gt;");
    expect(html).toContain("Microsoft Teams");
    expect(html).toContain("Alinhar prioridades &amp; próximos passos.");
  });

  it("renders a branded event invitation for an assigned member", () => {
    const html = renderEventInvitationEmail({
      id: "event-1",
      title: "Welcome Day",
      description: "Receção à nova equipa.",
      starts_at: "2026-10-21T15:00:00Z",
      ends_at: null,
      location: "Sala Rise Up",
      attendee_ids: [recipient.id],
      created_by: "creator-1",
      event_type: "event"
    }, recipient);

    expect(html).toContain("Evento marcado");
    expect(html).toContain("Foste associado a um evento");
    expect(html).toContain("Welcome Day");
    expect(html).toContain("Sala Rise Up");
  });
});
