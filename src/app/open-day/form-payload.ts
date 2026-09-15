export function createOpenDayPayload(form: FormData, participantType: string, lunch: string) {
  return {
    name: String(form.get("name") ?? ""),
    participant_type: participantType,
    organization: String(form.get("organization") ?? ""),
    student_number: String(form.get("student_number") ?? ""),
    course: String(form.get("course") ?? ""),
    email: String(form.get("email") ?? "").trim(),
    phone: String(form.get("phone") ?? ""),
    lunch: lunch === "yes",
    dietary_requirements: String(form.get("dietary_requirements") ?? "")
  };
}
