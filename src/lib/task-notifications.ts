import { createClient } from "@supabase/supabase-js";

const sender = "Rise Up · BackOffice <tarefas@updates.riseupmaia.pt>";

type TaskRecord = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  due_date: string | null;
  status: string;
};

type Recipient = { id: string; email: string; name: string | null };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function escapeHtml(value: string | null | undefined) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://riseupmaia.pt").replace(/\/$/, "");
}

function taskUrl() {
  return `${appUrl()}/backoffice`;
}

function logoUrl() {
  return `${appUrl()}/img/riseup-logo.png`;
}

function priorityLabel(priority: string) {
  return ({ low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" })[priority] || "Média";
}

function formatDueDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Lisbon" }).format(new Date(`${value}T12:00:00Z`));
}

function emailLayout(input: { preheader: string; eyebrow: string; title: string; intro: string; content: string; ctaLabel: string }) {
  return `<!doctype html>
<html lang="pt">
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.title)}</title></head>
  <body style="margin:0;padding:0;background:#f2f5f9;color:#101820;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(input.preheader)}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f2f5f9;">
      <tr><td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dfe6ee;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(16,24,32,.08);">
          <tr><td align="center" style="padding:28px 32px 22px;background:#ffffff;"><img src="${logoUrl()}" width="148" alt="Rise Up" style="display:block;width:148px;max-width:100%;height:auto;border:0;"></td></tr>
          <tr><td style="height:5px;background:#1697e5;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:36px 40px 14px;">
            <div style="margin:0 0 10px;color:#168bd2;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(input.eyebrow)}</div>
            <h1 style="margin:0 0 14px;color:#101820;font-size:28px;line-height:1.2;font-weight:750;">${escapeHtml(input.title)}</h1>
            <p style="margin:0;color:#5c6875;font-size:16px;line-height:1.65;">${escapeHtml(input.intro)}</p>
          </td></tr>
          <tr><td style="padding:18px 40px 8px;">${input.content}</td></tr>
          <tr><td style="padding:24px 40px 38px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:10px;background:#101820;"><a href="${taskUrl()}" style="display:inline-block;padding:14px 22px;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:10px;">${escapeHtml(input.ctaLabel)} &nbsp;→</a></td></tr></table>
          </td></tr>
          <tr><td style="padding:22px 40px;background:#f8fafc;border-top:1px solid #e7edf3;color:#7b8794;font-size:12px;line-height:1.6;">Mensagem automática do BackOffice da Rise Up.<br>Recebeste este email por estares associado a uma tarefa.</td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function renderAssignmentEmail(task: TaskRecord, recipient: Recipient) {
  const due = formatDueDate(task.due_date);
  const greeting = recipient.name ? `Olá, ${recipient.name}.` : "Olá.";
  const description = task.description
    ? `<div style="margin-top:16px;padding:16px 18px;background:#f8fafc;border:1px solid #e7edf3;border-radius:10px;color:#44515e;font-size:14px;line-height:1.65;">${escapeHtml(task.description)}</div>`
    : "";
  return emailLayout({
    preheader: `Foi-te atribuída a tarefa ${task.title}.`,
    eyebrow: "Nova tarefa",
    title: task.title,
    intro: `${greeting} Foi-te atribuída uma nova tarefa na Rise Up.`,
    ctaLabel: "Abrir tarefa no BackOffice",
    content: `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#f4f8fc;border:1px solid #dce8f2;border-radius:12px;"><tr><td width="50%" style="padding:16px 18px;border-right:1px solid #dce8f2;"><div style="margin-bottom:6px;color:#7a8794;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Prioridade</div><div style="color:#101820;font-size:15px;font-weight:700;">${escapeHtml(priorityLabel(task.priority))}</div></td><td width="50%" style="padding:16px 18px;"><div style="margin-bottom:6px;color:#7a8794;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Prazo</div><div style="color:#101820;font-size:15px;font-weight:700;">${escapeHtml(due)}</div></td></tr></table>${description}`
  });
}

function taskSummaryList(items: TaskRecord[], accent: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;">${items.map((task) => `<tr><td style="padding:0 0 10px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;border:1px solid #e2e8ef;border-left:4px solid ${accent};border-radius:10px;"><tr><td style="padding:14px 16px;"><div style="color:#101820;font-size:15px;font-weight:700;line-height:1.4;">${escapeHtml(task.title)}</div>${task.due_date ? `<div style="margin-top:5px;color:#6d7985;font-size:12px;line-height:1.4;">Prazo: ${escapeHtml(formatDueDate(task.due_date))}</div>` : ""}</td></tr></table></td></tr>`).join("")}</table>`;
}

export function renderDailyTaskEmail(input: { recipient: Recipient; overdue: TaskRecord[]; dueTomorrow: TaskRecord[] }) {
  const greeting = input.recipient.name ? `Olá, ${input.recipient.name}.` : "Olá.";
  const overdueSection = input.overdue.length
    ? `<div style="margin:0 0 20px;"><div style="margin:0 0 10px;color:#c74444;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Em atraso · ${input.overdue.length}</div>${taskSummaryList(input.overdue, "#ef6b6b")}</div>`
    : "";
  const tomorrowSection = input.dueTomorrow.length
    ? `<div style="margin:0 0 8px;"><div style="margin:0 0 10px;color:#168bd2;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Prazo amanhã · ${input.dueTomorrow.length}</div>${taskSummaryList(input.dueTomorrow, "#1697e5")}</div>`
    : "";
  const total = input.overdue.length + input.dueTomorrow.length;
  return emailLayout({
    preheader: `Tens ${total} tarefa${total === 1 ? "" : "s"} a precisar da tua atenção.`,
    eyebrow: "Resumo diário",
    title: "As tuas prioridades",
    intro: `${greeting} Aqui está o resumo das tarefas que precisam da tua atenção.`,
    ctaLabel: "Abrir o To-Do",
    content: `${overdueSection}${tomorrowSection}`
  });
}

async function sendEmail(input: { to: string; subject: string; html: string; text: string; idempotencyKey: string }) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${required("RESEND_API_KEY")}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey
    },
    body: JSON.stringify({ from: sender, to: [input.to], subject: input.subject, html: input.html, text: input.text })
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL");
  return createClient(url, required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function getTaskRecipients(taskId: string): Promise<{ task: TaskRecord; recipients: Recipient[] }> {
  const admin = adminClient();
  const { data: task, error: taskError } = await admin.from("workspace_tasks").select("id,title,description,priority,due_date,status").eq("id", taskId).maybeSingle();
  if (taskError) throw taskError;
  if (!task) throw new Error("Task not found");
  const { data: assignments, error: assignmentError } = await admin.from("workspace_task_assignees").select("user_id").eq("task_id", taskId);
  if (assignmentError) throw assignmentError;
  const ids = [...new Set((assignments || []).map((assignment) => assignment.user_id).filter(Boolean))];
  if (!ids.length) return { task, recipients: [] };
  const { data: profiles, error: profileError } = await admin.from("user_profiles").select("id,email").in("id", ids);
  if (profileError) throw profileError;
  const { data: members, error: memberError } = await admin.from("team_members").select("user_id,name").in("user_id", ids);
  if (memberError) throw memberError;
  const profileById = new Map((profiles || []).map((profile) => [profile.id, profile.email]));
  const nameById = new Map((members || []).map((member) => [member.user_id, member.name]));
  return { task, recipients: ids.map((id) => ({ id, email: profileById.get(id) || "", name: nameById.get(id) || null })).filter((recipient) => recipient.email) };
}

export async function sendAssignmentEmails(taskId: string, recipientIds: string[]) {
  const { task, recipients } = await getTaskRecipients(taskId);
  const targetIds = new Set(recipientIds);
  const targets = recipients.filter((recipient) => targetIds.has(recipient.id));
  await Promise.all(targets.map((recipient) => {
    const greeting = recipient.name ? `Olá, ${recipient.name}` : "Olá";
    const due = formatDueDate(task.due_date);
    return sendEmail({
      to: recipient.email,
      subject: `Nova tarefa: ${task.title}`,
      idempotencyKey: `task-assigned-${task.id}-${recipient.id}`,
      text: `${greeting}. Foi-te atribuída a tarefa “${task.title}”. Prioridade: ${priorityLabel(task.priority)}. Prazo: ${due}. Abre o BackOffice: ${taskUrl()}`,
      html: renderAssignmentEmail(task, recipient)
    });
  }));
  return { sent: targets.length, requested: targetIds.size };
}

function portugalDate(offsetDays = 0) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Lisbon", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date());
  const value = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const date = new Date(`${value.year}-${value.month}-${value.day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export async function sendDailyTaskEmails() {
  const admin = adminClient();
  const today = portugalDate();
  const tomorrow = portugalDate(1);
  const { data: tasks, error } = await admin.from("workspace_tasks").select("id,title,description,priority,due_date,status").neq("status", "done").lte("due_date", tomorrow);
  if (error) throw error;
  const records = (tasks || []) as TaskRecord[];
  const grouped = new Map<string, { recipient: Recipient; overdue: TaskRecord[]; dueTomorrow: TaskRecord[] }>();
  for (const task of records) {
    const { recipients } = await getTaskRecipients(task.id);
    recipients.forEach((recipient) => {
      const entry = grouped.get(recipient.id) || { recipient, overdue: [], dueTomorrow: [] };
      if (task.due_date && task.due_date < today) entry.overdue.push(task);
      if (task.due_date === tomorrow) entry.dueTomorrow.push(task);
      grouped.set(recipient.id, entry);
    });
  }
  await Promise.all([...grouped.values()].filter((entry) => entry.overdue.length || entry.dueTomorrow.length).map(async (entry) => {
    const greeting = entry.recipient.name ? `Olá, ${entry.recipient.name}` : "Olá";
    const overdueText = entry.overdue.map((task) => `• ${task.title} (prazo: ${formatDueDate(task.due_date)})`).join("\n");
    const tomorrowText = entry.dueTomorrow.map((task) => `• ${task.title}`).join("\n");
    const sections = [entry.overdue.length ? `Tarefas em atraso:\n${overdueText}` : "", entry.dueTomorrow.length ? `Para amanhã:\n${tomorrowText}` : ""].filter(Boolean).join("\n\n");
    await sendEmail({
      to: entry.recipient.email,
      subject: entry.overdue.length ? `Rise Up: ${entry.overdue.length} tarefa(s) em atraso` : "Rise Up: tarefas com prazo amanhã",
      idempotencyKey: `task-daily-${today}-${entry.recipient.id}`,
      text: `${greeting}.\n\n${sections}\n\nAbre o BackOffice: ${taskUrl()}`,
      html: renderDailyTaskEmail(entry)
    });
  }));
  return { recipients: grouped.size, overdueTasks: records.filter((task) => task.due_date && task.due_date < today).length, dueTomorrowTasks: records.filter((task) => task.due_date === tomorrow).length };
}
