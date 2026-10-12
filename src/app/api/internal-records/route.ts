import { NextResponse, type NextRequest } from "next/server";
import { createRecordAndInstitutionalPdf } from "@/lib/internal-records";
import { requireBackofficeUser } from "@/lib/server-auth";

const validReportTypes = new Set(["conduct", "conflict", "harassment", "security", "financial", "other"]);
const validConflictTypes = new Set(["financial", "family_personal", "professional", "institutional", "other"]);
const value = (input: unknown, max: number) => String(input ?? "").trim().slice(0, max);

export async function POST(request: NextRequest) {
  try {
    const identity = await requireBackofficeUser(request);
    const body = await request.json() as { type?: string; payload?: Record<string, unknown> };
    if (!body.payload || !["confidential_report", "conflict_declaration"].includes(String(body.type))) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
    const report = body.type === "confidential_report";
    const title = value(report ? body.payload.title : body.payload.subject, 180);
    const description = value(body.payload.description, 5000);
    const category = value(report ? body.payload.report_type : body.payload.category, 40);
    if (title.length < 3 || description.length < 10 || !(report ? validReportTypes : validConflictTypes).has(category)) return NextResponse.json({ error: "Verifica os campos obrigatórios." }, { status: 400 });
    const payload = report
      ? { report_type: category, title, description, people_involved: value(body.payload.people_involved, 1000), evidence_url: value(body.payload.evidence_url, 2000), is_anonymous: Boolean(body.payload.is_anonymous) }
      : { category, subject: title, description, related_party: value(body.payload.related_party, 1000), proposed_mitigation: value(body.payload.proposed_mitigation, 3000) };
    const result = await createRecordAndInstitutionalPdf({ type: body.type as "confidential_report" | "conflict_declaration", userId: identity.id, payload });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    console.error("Internal record creation failed", error);
    return NextResponse.json({ error: "Não foi possível criar a ficha institucional. Tenta novamente." }, { status: 502 });
  }
}
