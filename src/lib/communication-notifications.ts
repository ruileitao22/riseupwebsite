import { createClient } from "@supabase/supabase-js";

const sender = "Rise Up · Comunicação <comunicacao@updates.riseupmaia.pt>";

export type CommunicationRequest = {
  id: string;
  requester_id: string;
  title: string;
  description: string;
  channels: string[];
  desired_publish_at: string | null;
  asset_url: string | null;
  status: "pending" | "scheduled" | "rejected" | "completed";
  scheduled_for: string | null;
  rejection_reason: string | null;
  decided_at: string | null;
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

function formatDate(value: string | null) {
  if (!value) return "Sem data indicada";
  return new Intl.DateTimeFormat("pt-PT", { dateStyle: "long", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(value));
}

function safeHttpsUrl(value: string | null) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function layout(input: { preheader: string; eyebrow: string; title: string; intro: string; content: string; footer: string }) {
  return `<!doctype html>
<html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head>
<body style="margin:0;padding:0;background:#f2f5f9;color:#101820;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f2f5f9;"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#fff;border:1px solid #dfe6ee;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(16,24,32,.08);">
      <tr><td align="center" style="padding:28px 32px 22px;"><img src="${appUrl()}/img/riseup-logo.png" width="148" alt="Rise Up" style="display:block;width:148px;max-width:100%;height:auto;border:0;"></td></tr>
      <tr><td style="height:5px;background:#1697e5;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:36px 40px 14px;"><div style="margin:0 0 10px;color:#168bd2;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</div><h1 style="margin:0 0 14px;color:#101820;font-size:28px;line-height:1.2;font-weight:750;">${escapeHtml(input.title)}</h1><p style="margin:0;color:#5c6875;font-size:16px;line-height:1.65;">${escapeHtml(input.intro)}</p></td></tr>
      <tr><td style="padding:18px 40px 8px;">${input.content}</td></tr>
      <tr><td style="padding:24px 40px 38px;"><table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:#101820;"><a href="${appUrl()}/backoffice" style="display:inline-block;padding:14px 22px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">Abrir no BackOffice &nbsp;→</a></td></tr></table></td></tr>
      <tr><td style="padding:22px 40px;background:#f8fafc;border-top:1px solid #e7edf3;color:#7b8794;font-size:12px;line-height:1.6;">Mensagem automática do BackOffice da Rise Up.<br>${escapeHtml(input.footer)}</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function details(request: CommunicationRequest) {
  const desiredDate = escapeHtml(formatDate(request.desired_publish_at));
  const channels = escapeHtml(request.channels.join(", "));
  const description = escapeHtml(request.description).replace(/\n/g, "<br>");
  const assetUrl = safeHttpsUrl(request.asset_url);
  const asset = assetUrl ? `<div style="margin-top:12px;font-size:13px;"><a href="${escapeHtml(assetUrl)}" style="color:#168bd2;">Consultar recurso enviado</a></div>` : "";
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f8fc;border:1px solid #dce8f2;border-radius:12px;"><tr><td width="50%" style="padding:16px 18px;border-right:1px solid #dce8f2;"><div style="margin-bottom:6px;color:#7a8794;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Redes</div><div style="color:#101820;font-size:15px;font-weight:700;">${channels}</div></td><td width="50%" style="padding:16px 18px;"><div style="margin-bottom:6px;color:#7a8794;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Data pretendida</div><div style="color:#101820;font-size:15px;font-weight:700;">${desiredDate}</div></td></tr></table><div style="margin-top:16px;padding:16px 18px;background:#f8fafc;border:1px solid #e7edf3;border-radius:10px;color:#44515e;font-size:14px;line-height:1.65;">${description}${asset}</div>`;
}

export function renderNewRequestEmail(request: CommunicationRequest, requester: Recipient, recipient: Recipient) {
  const greeting = recipient.name ? `Olá, ${recipient.name}.` : "Olá.";
  const requesterName = requester.name || requester.email;
  return layout({
    preheader: `${requesterName} enviou um pedido de comunicação.`,
    eyebrow: "Novo pedido de comunicação",
    title: request.title,
    intro: `${greeting} ${requesterName} enviou um novo pedido para análise da equipa de Comunicação.`,
    content: details(request),
    footer: "Recebeste este email por integrares a equipa de Comunicação."
  });
}

export function renderRequestDecisionEmail(request: CommunicationRequest, recipient: Recipient) {
  const approved = request.status === "scheduled" || request.status === "completed";
  const greeting = recipient.name ? `Olá, ${recipient.name}.` : "Olá.";
  const decision = approved
    ? `<div style="padding:17px 19px;background:#eefaf5;border:1px solid #cbeedd;border-left:4px solid #18a66c;border-radius:10px;"><div style="color:#137650;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Aprovado e agendado</div><div style="margin-top:7px;color:#101820;font-size:16px;font-weight:700;">${escapeHtml(formatDate(request.scheduled_for))}</div></div>`
    : `<div style="padding:17px 19px;background:#fff5f5;border:1px solid #f2d4d7;border-left:4px solid #bd3d4a;border-radius:10px;"><div style="color:#a93442;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Não aprovado</div><div style="margin-top:7px;color:#394550;font-size:15px;line-height:1.6;">${escapeHtml(request.rejection_reason)}</div></div>`;
  return layout({
    preheader: approved ? `O pedido ${request.title} foi aprovado e agendado.` : `O pedido ${request.title} não foi aprovado.`,
    eyebrow: "Decisão da Comunicação",
    title: request.title,
    intro: `${greeting} A equipa de Comunicação já analisou o teu pedido.`,
    content: `${decision}<div style="margin-top:16px;">${details(request)}</div>`,
    footer: "Recebeste este email por teres efetuado este pedido de comunicação."
  });
}

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL");
  return createClient(url, required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}

async function sendEmail(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${required("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": input.idempotencyKey },
    body: JSON.stringify({ from: sender, to: [input.to], subject: input.subject, html: input.html, text: input.text })
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
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

export async function getCommunicationRequest(requestId: string): Promise<CommunicationRequest> {
  const { data, error } = await adminClient().from("communication_requests").select("id,requester_id,title,description,channels,desired_publish_at,asset_url,status,scheduled_for,rejection_reason,decided_at").eq("id", requestId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Communication request not found");
  return data as CommunicationRequest;
}

export async function sendNewRequestNotifications(requestId: string) {
  const admin = adminClient();
  const request = await getCommunicationRequest(requestId);
  const { data: profiles, error } = await admin.from("user_profiles").select("id").in("role", ["communication_team", "team_leader_communication"]);
  if (error) throw error;
  const [requester] = await recipientsByIds([request.requester_id]);
  if (!requester) throw new Error("Requester has no email address");
  const recipients = await recipientsByIds((profiles || []).map((profile) => profile.id));
  if (!recipients.length) throw new Error("No communication team email recipients");
  await Promise.all(recipients.map((recipient) => sendEmail({
    to: recipient.email,
    subject: `Novo pedido de comunicação: ${request.title}`,
    idempotencyKey: `communication-requested-${request.id}-${recipient.id}`,
    text: `${requester.name || requester.email} enviou o pedido “${request.title}” para ${request.channels.join(", ")}. Data pretendida: ${formatDate(request.desired_publish_at)}. Abre o BackOffice: ${appUrl()}/backoffice`,
    html: renderNewRequestEmail(request, requester, recipient)
  })));
  return { sent: recipients.length };
}

export async function sendRequestDecisionNotification(requestId: string) {
  const request = await getCommunicationRequest(requestId);
  if (!["scheduled", "rejected", "completed"].includes(request.status)) throw new Error("Request has no decision");
  const [recipient] = await recipientsByIds([request.requester_id]);
  if (!recipient) return { sent: 0 };
  const approved = request.status === "scheduled" || request.status === "completed";
  await sendEmail({
    to: recipient.email,
    subject: approved ? `Pedido aprovado: ${request.title}` : `Pedido não aprovado: ${request.title}`,
    idempotencyKey: `communication-decided-${request.id}-${request.decided_at || request.status}`,
    text: approved ? `O teu pedido “${request.title}” foi aprovado e agendado para ${formatDate(request.scheduled_for)}.` : `O teu pedido “${request.title}” não foi aprovado. Motivo: ${request.rejection_reason}`,
    html: renderRequestDecisionEmail(request, recipient)
  });
  return { sent: 1 };
}
