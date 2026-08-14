import { describe, expect, it } from "vitest";
import { submissionSchema } from "./submissions";

const base = { source_page: "contact", page_url: "https://riseupmaia.pt/contactos", language: "pt", user_agent: "test" };

describe("submissionSchema", () => {
  it("accepts a valid contact request", () => {
    expect(submissionSchema.safeParse({ type: "contact", payload: { ...base, name: "Ana", email: "ANA@example.com", message: "Olá" } }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(submissionSchema.safeParse({ type: "contact", payload: { ...base, name: "Ana", email: "invalid", message: "Olá" } }).success).toBe(false);
  });

  it("rejects unexpected payload fields", () => {
    expect(submissionSchema.safeParse({ type: "contact", payload: { ...base, name: "Ana", email: "ana@example.com", message: "Olá", role: "admin" } }).success).toBe(false);
  });

  it("only permits LinkedIn HTTPS URLs in applications", () => {
    const payload = { ...base, name: "Ana", email: "ana@example.com", phone_contact: "+351 912 345 678", course: "Gestão", study_year: "2", motivation: "Quero participar", linkedin: "https://example.com/ana", age: 21 };
    expect(submissionSchema.safeParse({ type: "application", payload }).success).toBe(false);
  });
});
