import { createClient } from "@supabase/supabase-js";

const sender = "Rise Up · Inovação e Projetos <inovacao@updates.riseupmaia.pt>";

type InnovationRequest = {
  id: string;
  request_type: "idea" | "problem";
  title: string;
  description: string;
  submitted_by: string;
};

type Recipient = { id: string; email: string; name: string | null };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://riseupmaia.pt").replace(/\/$/, "");
}

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL");
  return createClient(url, required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}

async function recipientsByIds(ids: string[]): Promise<Recipient[]> {
  if (!ids.length) return [];
  const admin = adminClient();
  const { data: profiles, error: profilesError } = await admin.from("user_profiles").select("id,email").in("id", ids);
  if (profilesError) throw profilesError;
  const { data: members, error: membersError } = await admin.from("team_members").select("user_id,name").in("user_id", ids);
  if (membersError) throw membersError;
  const names = new Map((members || []).map((member) => [member.user_id, member.name]));
  return (profiles || []).filter((profile) => profile.email).map((profile) => ({ id: profile.id, email: profile.email, name: names.get(profile.id) || null }));
}

async function sendEmail(input: { to: string; subject: string; text: string; html: string; idempotencyKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${required("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from: sender, to: [input.to], subject: input.subject, text: input.text, html: input.html })
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

export async function getInnovationRequest(requestId: string): Promise<InnovationRequest> {
  const { data, error } = await adminClient().from("innovation_requests")
    .select("id,request_type,title,description,submitted_by").eq("id", requestId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Innovation request not found");
  return data as InnovationRequest;
}

export async function sendNewInnovationRequestNotifications(requestId: string) {
  const admin = adminClient();
  const request = await getInnovationRequest(requestId);
  const { data: profiles, error } = await admin.from("user_profiles").select("id")
    .in("role", ["projects_innovation_team", "team_leader_projects_innovation"]);
  if (error) throw error;
  const [requester] = await recipientsByIds([request.submitted_by]);
  const recipients = await recipientsByIds((profiles || []).map((profile) => profile.id));
  if (!recipients.length) throw new Error("No innovation team email recipients");
  const type = request.request_type === "idea" ? "ideia" : "problema";
  const article = type === "ideia" ? "Nova" : "Novo";
  const submittedBy = requester?.name || requester?.email || "Um membro da Rise Up";
  const backofficeUrl = `${appUrl()}/backoffice`;
  await Promise.all(recipients.map((recipient) => sendEmail({
    to: recipient.email,
    subject: `${article} ${type} no Banco de Ideias e Problemas: ${request.title}`,
    idempotencyKey: `innovation-requested-${request.id}-${recipient.id}`,
    text: `${submittedBy} registou ${type === "ideia" ? "uma ideia" : "um problema"}: “${request.title}”.\n\n${request.description}\n\nAbre o BackOffice: ${backofficeUrl}`,
    html: `<!doctype html><html lang="pt"><body style="margin:0;padding:32px;background:#f2f5f9;color:#101820;font-family:Arial,Helvetica,sans-serif;"><main style="max-width:600px;margin:auto;padding:32px;background:#fff;border:1px solid #dfe6ee;border-radius:18px;"><p style="margin:0 0 10px;color:#168bd2;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">Banco de Ideias e Problemas</p><h1 style="margin:0 0 14px;font-size:28px;">${article} ${escapeHtml(type)}</h1><p style="color:#5c6875;line-height:1.6;">${escapeHtml(submittedBy)} registou ${type === "ideia" ? "uma ideia" : "um problema"} para análise.</p><h2 style="font-size:19px;">${escapeHtml(request.title)}</h2><p style="padding:16px;background:#f8fafc;border:1px solid #e7edf3;border-radius:10px;line-height:1.6;white-space:pre-line;">${escapeHtml(request.description)}</p><p><a href="${escapeHtml(backofficeUrl)}" style="display:inline-block;padding:14px 22px;background:#101820;border-radius:10px;color:#fff;font-weight:700;text-decoration:none;">Abrir no BackOffice →</a></p></main></body></html>`
  })));
  return { sent: recipients.length };
}
