import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { submissionSchema } from "./submissions";

type Submission = z.infer<typeof submissionSchema>;
const inbox = "riseup@umaia.pt";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function renderSubmissionEmail(submission: Submission) {
  const title = submission.type === "contact" ? "Novo pedido de contacto" : "Nova candidatura";
  const fields: [string, string][] = [["Nome", submission.payload.name], ["Email", submission.payload.email]];
  if (submission.type === "contact") {
    fields.push(["Mensagem", submission.payload.message]);
  } else {
    const payload = submission.payload;
    fields.push(["Contacto telefónico", payload.phone_contact], ["Curso", payload.course],
      ["Ano", payload.study_year], ["Idade", String(payload.age)],
      ["Motivação", payload.motivation]);
    if (payload.linkedin) fields.push(["LinkedIn", payload.linkedin]);
  }
  const url = `${(process.env.NEXT_PUBLIC_APP_URL || "https://riseupmaia.pt").replace(/\/$/, "")}/backoffice`;
  return {
    subject: `${title} · Rise Up`,
    text: `${title}\n\n${fields.map(([label, value]) => `${label}: ${value}`).join("\n\n")}\n\nAbrir no BackOffice: ${url}`,
    html: `<html lang="pt"><body style="font-family:Arial,sans-serif;color:#101820;max-width:600px;margin:auto;padding:32px"><h1>${title}</h1>${fields.map(([label, value]) => `<p><strong>${label}</strong><br>${escapeHtml(value).replace(/\n/g, "<br>")}</p>`).join("")}<p><a href="${escapeHtml(url)}">Abrir no BackOffice</a></p><p>Responde a este email para contactar ${escapeHtml(submission.payload.name)}.</p></body></html>`
  };
}

export async function sendSubmissionNotification(submission: Submission) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");
  const recipients = new Set([inbox]);
  let lookupFailed = false;
  if (submission.type === "application") {
    try {
      const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) throw new Error("Missing Supabase notification credentials");
      const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data, error } = await admin.from("user_profiles").select("email")
        .in("role", ["hr_team", "team_leader_hr"]);
      if (error) throw error;
      for (const profile of data || []) {
        const email = typeof profile.email === "string" ? profile.email.trim().toLowerCase() : "";
        if (z.email().safeParse(email).success) recipients.add(email);
      }
    } catch {
      // Still notify the institutional inbox if the HR directory is unavailable.
      lookupFailed = true;
    }
  }

  const message = renderSubmissionEmail(submission);
  const addresses = [...recipients];
  const notificationId = randomUUID();
  // Resend accepts at most 50 recipients per email. Hide the other addresses.
  for (let offset = 0; offset < addresses.length; offset += 50) {
    const [to, ...bcc] = addresses.slice(offset, offset + 50);
    const body = JSON.stringify({ from: "Rise Up <comunicacao@updates.riseupmaia.pt>", to: [to],
      ...(bcc.length ? { bcc } : {}), reply_to: submission.payload.email, ...message });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
            "Idempotency-Key": `submission-${notificationId}-${offset}` },
          body,
          signal: AbortSignal.timeout(5000)
        });
        if (response.ok) break;
        if (response.status !== 429 && response.status < 500) {
          throw new Error(`Email rejected (${response.status})`);
        }
        throw new Error("Email service temporarily unavailable");
      } catch (error) {
        if (attempt === 2 || (error instanceof Error && error.message.startsWith("Email rejected"))) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }
  if (lookupFailed) throw new Error("Institutional inbox notified, but HR recipient lookup failed");
}
