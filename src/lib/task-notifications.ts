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

function priorityLabel(priority: string) {
  return ({ low: "Baixa", medium: "Média", high: "Alta", urgent: "Urgente" })[priority] || "Média";
}

function formatDueDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric", timeZone: "Europe/Lisbon" }).format(new Date(`${value}T12:00:00Z`));
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
  await Promise.all(recipients.filter((recipient) => targetIds.has(recipient.id)).map((recipient) => {
    const greeting = recipient.name ? `Olá, ${recipient.name}` : "Olá";
    const due = formatDueDate(task.due_date);
    return sendEmail({
      to: recipient.email,
      subject: `Nova tarefa: ${task.title}`,
      idempotencyKey: `task-assigned-${task.id}-${recipient.id}`,
      text: `${greeting}. Foi-te atribuída a tarefa “${task.title}”. Prioridade: ${priorityLabel(task.priority)}. Prazo: ${due}. Abre o BackOffice: ${taskUrl()}`,
      html: `<p>${escapeHtml(greeting)},</p><p>Foi-te atribuída uma nova tarefa na Rise Up.</p><p><strong>${escapeHtml(task.title)}</strong><br>Prioridade: ${escapeHtml(priorityLabel(task.priority))}<br>Prazo: ${escapeHtml(due)}</p>${task.description ? `<p>${escapeHtml(task.description)}</p>` : ""}<p><a href="${taskUrl()}">Abrir tarefa no BackOffice</a></p>`
    });
  }));
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
    const htmlList = (items: TaskRecord[]) => `<ul>${items.map((task) => `<li><strong>${escapeHtml(task.title)}</strong>${task.due_date ? ` — ${escapeHtml(formatDueDate(task.due_date))}` : ""}</li>`).join("")}</ul>`;
    await sendEmail({
      to: entry.recipient.email,
      subject: entry.overdue.length ? `Rise Up: ${entry.overdue.length} tarefa(s) em atraso` : "Rise Up: tarefas com prazo amanhã",
      idempotencyKey: `task-daily-${today}-${entry.recipient.id}`,
      text: `${greeting}.\n\n${sections}\n\nAbre o BackOffice: ${taskUrl()}`,
      html: `<p>${escapeHtml(greeting)},</p>${entry.overdue.length ? `<p><strong>Tarefas em atraso</strong></p>${htmlList(entry.overdue)}` : ""}${entry.dueTomorrow.length ? `<p><strong>Com prazo amanhã</strong></p>${htmlList(entry.dueTomorrow)}` : ""}<p><a href="${taskUrl()}">Abrir o To-Do no BackOffice</a></p>`
    });
  }));
  return { recipients: grouped.size, overdueTasks: records.filter((task) => task.due_date && task.due_date < today).length, dueTomorrowTasks: records.filter((task) => task.due_date === tomorrow).length };
}
