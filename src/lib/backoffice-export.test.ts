import { describe, expect, it } from "vitest";
import { backofficeExportResources, safeExcelText } from "./backoffice-export";

describe("backoffice Excel exports", () => {
  it("only exposes the supported submission exports", () => {
    expect(Object.keys(backofficeExportResources).sort()).toEqual(["applications", "contacts"]);
  });

  it("keeps spreadsheet formula-like user input as text", () => {
    expect(safeExcelText("=1+1")).toBe("'=1+1");
    expect(safeExcelText("Mensagem normal")).toBe("Mensagem normal");
  });
});
