import { describe, expect, it } from "vitest";
import { openDaySchema } from "../../lib/open-day";
import { createOpenDayPayload } from "./form-payload";

function visibleFields() {
  const form = new FormData();
  form.set("name", "Pessoa Exemplo");
  form.set("email", "pessoa@example.com");
  form.set("phone", "912345678");
  return form;
}

describe("Open Day form payload", () => {
  it.each(["legend", "external"])("sends empty hidden fields for %s", (type) => {
    const form = visibleFields();
    if (type !== "legend") form.set("organization", "Universidade ou empresa");
    const payload = createOpenDayPayload(form, type, "no");
    expect(payload.student_number).toBe("");
    expect(payload.course).toBe("");
    expect(openDaySchema.safeParse(payload).success).toBe(true);
  });
  it("keeps a student's course and optional number", () => {
    const form = visibleFields();
    form.set("course", "Gestão");
    const payload = createOpenDayPayload(form, "student", "yes");
    expect(openDaySchema.safeParse(payload).success).toBe(true);
    expect(payload.student_number).toBe("");
    expect(payload.course).toBe("Gestão");
  });
});
