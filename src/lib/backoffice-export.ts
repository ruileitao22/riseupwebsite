export type BackofficeExportResource = {
  table: string;
  filename: string;
  sheetName: string;
  orderBy: string;
  columns: Array<{ key: string; header: string; width: number }>;
};

export const backofficeExportResources: Record<string, BackofficeExportResource> = {
  applications: {
    table: "join_applications",
    filename: "candidaturas-rise-up.xlsx",
    sheetName: "Candidaturas",
    orderBy: "submitted_at",
    columns: [
      { key: "name", header: "Nome", width: 28 },
      { key: "email", header: "Email", width: 34 },
      { key: "phone_contact", header: "Contacto telefónico", width: 22 },
      { key: "course", header: "Curso", width: 32 },
      { key: "study_year", header: "Ano de curso", width: 16 },
      { key: "age", header: "Idade", width: 10 },
      { key: "motivation", header: "Motivação", width: 56 },
      { key: "linkedin", header: "LinkedIn", width: 38 },
      { key: "source_page", header: "Origem", width: 16 },
      { key: "page_url", header: "Página", width: 42 },
      { key: "language", header: "Idioma", width: 12 },
      { key: "status", header: "Estado", width: 14 },
      { key: "submitted_at", header: "Submetida em", width: 24 }
    ]
  },
  contacts: {
    table: "contact_submissions",
    filename: "pedidos-de-contacto-rise-up.xlsx",
    sheetName: "Pedidos de contacto",
    orderBy: "submitted_at",
    columns: [
      { key: "name", header: "Nome", width: 28 },
      { key: "email", header: "Email", width: 34 },
      { key: "message", header: "Mensagem", width: 56 },
      { key: "source_page", header: "Origem", width: 16 },
      { key: "page_url", header: "Página", width: 42 },
      { key: "language", header: "Idioma", width: 12 },
      { key: "status", header: "Estado", width: 14 },
      { key: "submitted_at", header: "Submetida em", width: 24 }
    ]
  }
};

export function safeExcelText(value: unknown) {
  const text = value == null ? "" : String(value);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
