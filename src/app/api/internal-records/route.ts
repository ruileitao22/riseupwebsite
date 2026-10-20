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
    if (title.length < 3) return NextResponse.json({ error: "O assunto deve ter pelo menos 3 caracteres." }, { status: 400 });
    if (description.length < 10) return NextResponse.json({ error: "A descrição dos factos deve ter pelo menos 10 caracteres." }, { status: 400 });
    if (!(report ? validReportTypes : validConflictTypes).has(category)) return NextResponse.json({ error: "Seleciona um tipo de situação válido." }, { status: 400 });
    const payload = report
      ? { report_type: category, title, description, people_involved: value(body.payload.people_involved, 1000), evidence_url: value(body.payload.evidence_url, 2000), is_anonymous: Boolean(body.payload.is_anonymous) }
      : { category, subject: title, description, related_party: value(body.payload.related_party, 1000), proposed_mitigation: value(body.payload.proposed_mitigation, 3000) };
    const accessToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() || "";
    const result = await createRecordAndInstitutionalPdf({ type: body.type as "confidential_report" | "conflict_declaration", userId: identity.id, payload, accessToken });
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error
      ? error.message
      : typeof error === "object" && error && "message" in error
        ? String((error as { message?: unknown }).message || "INTERNAL_RECORD_CREATION_FAILED")
        : "INTERNAL_RECORD_CREATION_FAILED";
    console.error("Internal record creation failed:", errorMessage);
    return NextResponse.json({ error: "Não foi possível criar a ficha institucional. Tenta novamente." }, { status: 502 });
  }
}
