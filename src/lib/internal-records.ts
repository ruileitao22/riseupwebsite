import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFImage, type PDFFont, type PDFPage } from "pdf-lib";
import { createClient } from "@supabase/supabase-js";

const sender = "Rise Up · Direção <direcao@updates.riseupmaia.pt>";
const bucket = "internal-record-pdfs";

type SourceType = "confidential_report" | "conflict_declaration";
type DirectionRecipient = { email: string; name: string | null };
type PdfInput = { type: SourceType; record: Record<string, unknown>; authorName: string | null; createdAt: string };

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing SUPABASE_URL");
  return createClient(url, required("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false, autoRefreshToken: false } });
}

function appUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || "https://riseupmaia.pt").replace(/\/$/, "");
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
}

function clean(value: unknown) {
  return String(value ?? "").trim();
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("pt-PT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function typeLabel(type: SourceType) {
  return type === "confidential_report" ? "Denúncia confidencial" : "Declaração de conflito de interesse";
}

function categoryLabel(type: SourceType, value: unknown) {
  const report = { conduct: "Conduta ou incumprimento", conflict: "Conflito interpessoal", harassment: "Assédio, intimidação ou discriminação", security: "Segurança, acessos ou dados", financial: "Irregularidade financeira", other: "Outra situação" };
  const conflict = { financial: "Financeiro", family_personal: "Familiar ou pessoal", professional: "Profissional", institutional: "Institucional", other: "Outro" };
  return type === "confidential_report"
    ? report[clean(value) as keyof typeof report] || "Outra situação"
    : conflict[clean(value) as keyof typeof conflict] || "Outro";
}

function wrap(font: PDFFont, text: string, maxWidth: number, size: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !current) current = next;
    else { lines.push(current); current = word; }
  }
  if (current) lines.push(current);
  return lines.length ? lines : ["—"];
}

function pageChrome(page: PDFPage, title: string, pageNumber: number, logo?: PDFImage) {
  const blue = rgb(0.02, 0.6, 0.88);
  page.drawLine({ start: { x: 48, y: 748 }, end: { x: 547, y: 748 }, thickness: 1.4, color: blue });
  page.drawRectangle({ x: 0, y: 0, width: 595, height: 13, color: rgb(0.03, 0.48, 0.63) });
  page.drawText(title.toUpperCase(), { x: 48, y: 28, size: 8, color: rgb(0.34, 0.39, 0.44) });
  page.drawText(`PÁGINA ${pageNumber}`, { x: 487, y: 28, size: 8, color: rgb(0.34, 0.39, 0.44) });
  if (logo) {
    const scaled = logo.scale(0.24);
    page.drawImage(logo, { x: 405, y: 786 - scaled.height, width: scaled.width, height: scaled.height });
  } else page.drawText("riseup", { x: 442, y: 776, size: 20, color: rgb(0.04, 0.6, 0.85) });
}

export async function createInternalRecordPdf(input: PdfInput) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  let logo: PDFImage | undefined;
  try { logo = await pdf.embedPng(await readFile(path.join(process.cwd(), "public", "img", "riseup-logo.png"))); } catch { logo = undefined; }
  const dark = rgb(0.08, 0.12, 0.16);
  const muted = rgb(0.37, 0.43, 0.48);
  const blue = rgb(0.02, 0.6, 0.88);
  const pale = rgb(0.95, 0.97, 0.98);
  const type = typeLabel(input.type);
  const subject = clean(input.record.title || input.record.subject);
  const classification = input.type === "confidential_report" ? "CONFIDENCIAL" : "RESERVADO";
  let page = pdf.addPage([595.28, 841.89]);
  let y = 690;
  let pageNumber = 1;
  pageChrome(page, type, pageNumber, logo);
  page.drawText("RISE UP · UMAIA JUNIOR INITIATIVE", { x: 48, y: 713, size: 9, font: bold, color: blue });
  page.drawText(type, { x: 48, y: 657, size: type.length > 28 ? 20 : 24, font: bold, color: dark });
  const subtitle = input.type === "confidential_report" ? "Ficha institucional de canal de denúncia" : "Ficha institucional de declaração de transparência";
  page.drawText(subtitle, { x: 48, y: 634, size: 11, font: regular, color: muted });
  page.drawRectangle({ x: 435, y: 652, width: 112, height: 24, color: input.type === "confidential_report" ? rgb(0.91, 0.96, 1) : rgb(0.91, 0.98, 0.95) });
  page.drawText(classification, { x: 445, y: 661, size: 8, font: bold, color: input.type === "confidential_report" ? rgb(0.08, 0.39, 0.67) : rgb(0.06, 0.43, 0.31) });
  const meta = [
    ["REFERÊNCIA", clean(input.record.id).slice(0, 8).toUpperCase()],
    ["DATA DE REGISTO", dateLabel(input.createdAt)],
    ["CLASSIFICAÇÃO", classification],
    ["PREPARADO POR", input.type === "confidential_report" && input.record.is_anonymous ? "Registo anónimo" : input.authorName || "Membro Rise Up"]
  ];
  let my = 574;
  meta.forEach(([label, value]) => {
    page.drawRectangle({ x: 48, y: my - 28, width: 499, height: 28, color: pale, borderColor: rgb(0.84, 0.88, 0.91), borderWidth: .5 });
    page.drawText(label, { x: 58, y: my - 18, size: 7.5, font: bold, color: muted });
    page.drawText(value, { x: 190, y: my - 18, size: 8.8, font: regular, color: dark });
    my -= 28;
  });
  y = 432;

  const addPage = () => {
    page = pdf.addPage([595.28, 841.89]); pageNumber += 1; pageChrome(page, type, pageNumber, logo); y = 710;
  };
  const field = (label: string, value: string) => {
    const lines = wrap(regular, value || "—", 475, 10);
    const height = 25 + lines.length * 14;
    if (y - height < 72) addPage();
    page.drawText(label.toUpperCase(), { x: 48, y, size: 8, font: bold, color: blue });
    y -= 14;
    page.drawRectangle({ x: 48, y: y - (lines.length * 14 + 12), width: 499, height: lines.length * 14 + 12, color: rgb(0.99, 1, 1), borderColor: rgb(0.84, 0.88, 0.91), borderWidth: .7 });
    lines.forEach((line, index) => page.drawText(line, { x: 60, y: y - 15 - index * 14, size: 10, font: regular, color: dark }));
    y -= lines.length * 14 + 27;
  };
  field(input.type === "confidential_report" ? "Tipo de situação" : "Tipo de interesse", categoryLabel(input.type, input.type === "confidential_report" ? input.record.report_type : input.record.category));
  field(input.type === "confidential_report" ? "Assunto" : "Assunto ou atividade", subject);
  if (input.type === "confidential_report") {
    field("Pessoas envolvidas", clean(input.record.people_involved));
    field("Descrição dos factos", clean(input.record.description));
    field("Elementos de suporte", clean(input.record.evidence_url));
  } else {
    field("Pessoa, entidade ou relação envolvida", clean(input.record.related_party));
    field("Descrição da situação", clean(input.record.description));
    field("Medida proposta", clean(input.record.proposed_mitigation));
  }
  return pdf.save();
}

async function directionRecipients(): Promise<DirectionRecipient[]> {
  const admin = adminClient();
  const { data, error } = await admin.from("user_profiles").select("id,email").in("role", ["admin", "coordinator", "vice_coordinator"]);
  if (error) throw error;
  const ids = (data || []).map((row) => row.id);
  const { data: members, error: membersError } = ids.length ? await admin.from("team_members").select("user_id,name").in("user_id", ids) : { data: [], error: null };
  if (membersError) throw membersError;
  const names = new Map((members || []).map((member) => [member.user_id, member.name]));
  return [...new Map((data || []).filter((row) => row.email).map((row) => [String(row.email).toLowerCase(), { email: row.email as string, name: names.get(row.id) || null }])).values()];
}

async function sendDirectionEmail(type: SourceType, title: string, filename: string, pdf: Uint8Array, idempotencyKey: string) {
  const recipients = await directionRecipients();
  if (!recipients.length) throw new Error("No direction email recipients");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${required("RESEND_API_KEY")}`, "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({
      from: sender,
      to: [recipients[0].email],
      bcc: recipients.slice(1).map((recipient) => recipient.email),
      subject: `${typeLabel(type)}: ${title}`,
      text: `Foi registada uma nova ${typeLabel(type).toLocaleLowerCase()}. A ficha institucional confidencial segue em anexo. Consulta também o BackOffice: ${appUrl()}/backoffice`,
      html: `<!doctype html><html lang="pt"><body style="margin:0;padding:32px;background:#f2f5f9;color:#101820;font-family:Arial,Helvetica,sans-serif"><main style="max-width:600px;margin:auto;padding:34px;background:#fff;border:1px solid #dfe6ee;border-radius:18px"><p style="margin:0 0 10px;color:#168bd2;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Direção · ${escapeHtml(typeLabel(type))}</p><h1 style="margin:0 0 14px;font-size:26px">${escapeHtml(title)}</h1><p style="margin:0;color:#5c6875;line-height:1.65">Foi criado um registo reservado. A ficha institucional em PDF segue em anexo e está disponível no arquivo privado de Documentos do BackOffice.</p><p style="margin:24px 0 0"><a href="${escapeHtml(`${appUrl()}/backoffice`)}" style="display:inline-block;padding:13px 20px;border-radius:10px;background:#101820;color:#fff;font-weight:700;text-decoration:none">Abrir no BackOffice →</a></p></main></body></html>`,
      attachments: [{ filename, content: Buffer.from(pdf).toString("base64"), content_type: "application/pdf" }]
    })
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

export async function createRecordAndInstitutionalPdf(input: { type: SourceType; userId: string; payload: Record<string, unknown> }) {
  const admin = adminClient();
  const now = new Date().toISOString();
  const isReport = input.type === "confidential_report";
  const sourcePayload = isReport
    ? { report_type: clean(input.payload.report_type), title: clean(input.payload.title), description: clean(input.payload.description), people_involved: clean(input.payload.people_involved) || null, evidence_url: clean(input.payload.evidence_url) || null, is_anonymous: Boolean(input.payload.is_anonymous), submitted_by: input.payload.is_anonymous ? null : input.userId, status: "submitted" }
    : { declarant_id: input.userId, category: clean(input.payload.category), subject: clean(input.payload.subject), related_party: clean(input.payload.related_party) || null, description: clean(input.payload.description), proposed_mitigation: clean(input.payload.proposed_mitigation) || null, status: "declared" };
  const table = isReport ? "confidential_reports" : "conflict_of_interest_declarations";
  const { data: source, error: sourceError } = await admin.from(table).insert(sourcePayload as never).select().single();
  if (sourceError || !source) throw sourceError || new Error("Record creation failed");
  const { data: member } = await admin.from("team_members").select("name").eq("user_id", input.userId).maybeSingle();
  const pdf = await createInternalRecordPdf({ type: input.type, record: source, authorName: member?.name || null, createdAt: now });
  const label = isReport ? "denuncia" : "conflito-de-interesse";
  const filename = `Rise-Up_${label}_${String(source.id).slice(0, 8)}.pdf`;
  const storagePath = `${input.type}/${new Date().toISOString().slice(0, 10)}/${source.id}.pdf`;
  const { error: uploadError } = await admin.storage.from(bucket).upload(storagePath, pdf, { contentType: "application/pdf", upsert: false });
  if (uploadError) throw uploadError;
  const title = isReport ? source.title : source.subject;
  const { data: document, error: documentError } = await admin.from("internal_document_records").insert({ source_type: input.type, source_id: source.id, title: `${typeLabel(input.type)} · ${title}`, classification: isReport ? "confidencial" : "reservado", storage_path: storagePath }).select().single();
  if (documentError || !document) throw documentError || new Error("Document archive failed");
  let emailSent = true;
  try {
    await sendDirectionEmail(input.type, title, filename, pdf, `${input.type}-direction-${source.id}`);
    await admin.from("internal_document_records").update({ email_sent_at: new Date().toISOString(), email_error: null }).eq("id", document.id);
    document.email_sent_at = new Date().toISOString();
  } catch (error) {
    emailSent = false;
    await admin.from("internal_document_records").update({ email_error: error instanceof Error ? error.message.slice(0, 1000) : "Email failed" }).eq("id", document.id);
  }
  return { source, document, emailSent };
}

export async function downloadInternalDocument(id: string) {
  const { data, error } = await adminClient().from("internal_document_records").select("title,storage_path").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("DOCUMENT_NOT_FOUND");
  const { data: file, error: fileError } = await adminClient().storage.from(bucket).download(data.storage_path);
  if (fileError || !file) throw fileError || new Error("DOCUMENT_NOT_FOUND");
  return { title: data.title, bytes: new Uint8Array(await file.arrayBuffer()) };
}
