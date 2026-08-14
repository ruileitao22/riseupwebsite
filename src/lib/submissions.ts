import { z } from "zod";

const base = z.object({
  source_page: z.string().trim().max(80),
  page_url: z.url().max(500).refine((value) => ["http:", "https:"].includes(new URL(value).protocol)).or(z.literal("")),
  language: z.enum(["pt", "en"]),
  user_agent: z.string().trim().max(300)
}).strict();

const contactPayload = base.extend({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  message: z.string().trim().min(1).max(2000)
}).strict();

const applicationPayload = base.extend({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254).transform((value) => value.toLowerCase()),
  phone_contact: z.string().trim().regex(/^\+?[0-9][0-9\s().-]{6,24}$/).max(40),
  course: z.string().trim().min(1).max(160),
  study_year: z.enum(["1", "2", "3", "4+"]),
  motivation: z.string().trim().min(1).max(3000),
  linkedin: z.url().max(300).nullable().refine((value) => {
    if (!value) return true;
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    return url.protocol === "https:" && (host === "linkedin.com" || host.endsWith(".linkedin.com"));
  }),
  age: z.number().int().min(16).max(99)
}).strict();

export const submissionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("contact"), payload: contactPayload }).strict(),
  z.object({ type: z.literal("application"), payload: applicationPayload }).strict()
]);

export const submissionTables = { contact: "contact_submissions", application: "join_applications" } as const;
