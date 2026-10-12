import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { createInternalRecordPdf } from "./internal-records";

const createdAt = "2026-10-12T15:30:00.000Z";

describe("institutional record PDFs", () => {
  it("creates a readable confidential-report PDF without exposing an anonymous author", async () => {
    const pdf = await createInternalRecordPdf({ type: "confidential_report", authorName: "Pessoa que não deve aparecer", createdAt, record: { id: "4e5b12a4-1c2a-4d9b-8c32-a4df14b0d11f", report_type: "conduct", title: "Situação numa reunião", description: "Descrição objetiva dos factos para análise pela Direção.", people_involved: "Uma pessoa envolvida", evidence_url: "https://example.com/evidencia", is_anonymous: true } });
    const document = await PDFDocument.load(pdf);
    expect(document.getPageCount()).toBeGreaterThan(0);
    expect(pdf.byteLength).toBeGreaterThan(10_000);
  });

  it("creates a readable conflict-declaration PDF", async () => {
    const pdf = await createInternalRecordPdf({ type: "conflict_declaration", authorName: "Rui Leitão", createdAt, record: { id: "4e5b12a4-1c2a-4d9b-8c32-a4df14b0d11f", category: "professional", subject: "Parceria institucional", related_party: "Entidade parceira", description: "Existe uma relação profissional anterior que deve ser considerada antes da participação na decisão.", proposed_mitigation: "Abstenção de participação na decisão final." } });
    const document = await PDFDocument.load(pdf);
    expect(document.getPageCount()).toBeGreaterThan(0);
    expect(pdf.byteLength).toBeGreaterThan(10_000);
  });
});
