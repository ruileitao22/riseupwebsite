import ExcelJS from "exceljs";
import { type NextRequest } from "next/server";
import { GET as getRegistrations } from "../route";
import { openDayError } from "@/lib/open-day-server";
export async function GET(request: NextRequest) {
  try {
    const result = await getRegistrations(request);
    if (!result.ok) return result;
    const rows = await result.json();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Inscrições Open Day");
    sheet.columns = [
      { header: "Nome completo", key: "name", width: 32 },
      { header: "Perfil", key: "participant_type", width: 22 },
      { header: "Organização / empresa", key: "organization", width: 30 },
      { header: "Número de aluno", key: "student_number", width: 20 },
      { header: "Curso", key: "course", width: 32 },
      { header: "Email", key: "email", width: 38 },
      { header: "Telemóvel", key: "phone", width: 23 },
      { header: "Almoço", key: "lunch", width: 13 },
      { header: "Restrições alimentares", key: "dietary_requirements", width: 45 },
      { header: "A pagar no local (€)", key: "amount", width: 23 },
      { header: "Inscrição (Portugal)", key: "created_at", width: 25 }
    ];
    const profileLabels: Record<string, string> = { student: "Estudante", professor: "Professor/a", legend: "Rise Up Legend", external: "Participante externo/a" };
    for (const row of rows) sheet.addRow({ ...row, participant_type: profileLabels[row.participant_type] || row.participant_type, lunch: row.lunch ? "Sim" : "Não", amount: row.lunch ? 3 : 0, created_at: new Intl.DateTimeFormat("pt-PT", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Lisbon" }).format(new Date(row.created_at)) });
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF102D37" } };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = "A1:K1";
    sheet.getColumn("amount").numFmt = '#,##0.00 "€"';
    // ExcelJS stores user input as string cells, never executable formulas.
    const buffer = await workbook.xlsx.writeBuffer();
    return new Response(new Uint8Array(buffer), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="inscricoes-open-day-2026.xlsx"', "Cache-Control": "no-store" } });
  } catch (error) { return openDayError(error); }
}
