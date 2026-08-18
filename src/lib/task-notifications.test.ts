import { describe, expect, it } from "vitest";
import { renderAssignmentEmail, renderDailyTaskEmail } from "./task-notifications";

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
});
