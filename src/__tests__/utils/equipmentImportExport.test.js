import { describe, it, expect, vi } from "vitest";
import {
  DATE_HEADERS,
  IMPORT_HEADERS,
  parseImportFile,
  rowsToCsv,
  exportEquipmentCsv,
  exportEquipmentXlsx,
} from "../../utils/equipmentImportExport";

const csvContent = `Equipment Code,Name,Model,Serial Number,Department,Category,Status,Purchase Date,Warranty Expiry
EQ-001,MRI Scanner,GE Signa,SN-9281,Radiology,IMAGING,Operational,2025-06-12,2027-06-12
,Ventilator,Philips,SN-9922,ICU,RESPIRATORY,Maintenance,2026-01-05,2028-01-05
`;

const makeFile = (name, content, type) =>
  new File([content], name, { type });

describe("parseImportFile", () => {
  it("parses a CSV file into rows keyed by canonical headers", async () => {
    const result = await parseImportFile(makeFile("equipment.csv", csvContent, "text/csv"));

    expect(result.error).toBeNull();
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({
      "Equipment Code": "EQ-001",
      Name: "MRI Scanner",
      Model: "GE Signa",
      "Serial Number": "SN-9281",
      Department: "Radiology",
      Category: "IMAGING",
      Status: "Operational",
      "Purchase Date": "2025-06-12",
      "Warranty Expiry": "2027-06-12",
    });
    // An omitted equipment code stays empty (backend auto-generates one).
    expect(result.rows[1]["Equipment Code"]).toBe("");
  });

  it("normalises header names case-insensitively", async () => {
    const loose = csvContent
      .replace("Equipment Code", "EquipmentCode")
      .replace("Serial Number", "serial no")
      .replace("Warranty Expiry", "WARRANTY");
    const result = await parseImportFile(makeFile("loose.csv", loose, "text/csv"));

    expect(result.rows[0]["Equipment Code"]).toBe("EQ-001");
    expect(result.rows[0]["Serial Number"]).toBe("SN-9281");
    expect(result.rows[0]["Warranty Expiry"]).toBe("2027-06-12");
    expect(result.unknownHeaders).toHaveLength(0);
  });

  it("flags unrecognised columns instead of dropping the file", async () => {
    const result = await parseImportFile(
      makeFile("weird.csv", "Name,Budget,Department\nMRI Scanner,1000,Radiology\n", "text/csv")
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].Name).toBe("MRI Scanner");
    expect(result.unknownHeaders).toEqual(["Budget"]);
  });

  it("rejects unsupported file types", async () => {
    const result = await parseImportFile(makeFile("data.pdf", "x", "application/pdf"));
    expect(result.error).toContain("Unsupported file type");
    expect(result.rows).toHaveLength(0);
  });

  it("parses the depreciation and valuation columns", async () => {
    const financeCsv = `Equipment Code,Name,Model,Serial Number,Department,Category,Status,Purchase Date,Warranty Expiry,Purchase Cost,Useful Life (Years),Depreciation Method
EQ-001,MRI Scanner,GE Signa,SN-9281,Radiology,IMAGING,Operational,2025-06-12,2027-06-12,250000.00,10,DECLINING_BALANCE
`;
    const result = await parseImportFile(makeFile("finance.csv", financeCsv, "text/csv"));

    expect(result.rows[0]["Purchase Cost"]).toBe("250000");
    expect(result.rows[0]["Useful Life (Years)"]).toBe("10");
    expect(result.rows[0]["Depreciation Method"]).toBe("DECLINING_BALANCE");
  });

  it("strips currency decoration from money cells", async () => {
    const financeCsv = `Name,Purchase Cost,Department
MRI Scanner,"$250,000.00",Radiology
`;
    const result = await parseImportFile(makeFile("money.csv", financeCsv, "text/csv"));

    expect(result.rows[0]["Purchase Cost"]).toBe("250000");
  });

  it("normalises the finance column names case-insensitively", async () => {
    const loose = `Name,Cost,Useful Life,Method,Department
MRI Scanner,"$250,000.00",10,straight line,Radiology
`;
    const result = await parseImportFile(makeFile("loose.csv", loose, "text/csv"));

    expect(result.rows[0]["Purchase Cost"]).toBe("250000");
    expect(result.rows[0]["Useful Life (Years)"]).toBe("10");
    expect(result.rows[0]["Depreciation Method"]).toBe("straight line");
    expect(result.unknownHeaders).toHaveLength(0);
  });

  it("parses an Excel workbook", async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.aoa_to_sheet([
      IMPORT_HEADERS,
      ["EQ-010", "Ultrasound", "Sonosite", "SN-X1", "Cardiology", "IMAGING", "Operational", "2025-01-01", ""],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    const result = await parseImportFile(
      new File([buffer], "assets.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    );

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].Name).toBe("Ultrasound");
    expect(result.rows[0].Department).toBe("Cardiology");
  });
});

/**
 * Date handling is the part of the import most likely to be wrong without anyone noticing: the row
 * still imports, it just carries a different date than the file did. These cover the three ways
 * that used to happen - the UTC round trip that moved every non-ISO date back a day, the warranty
 * start column that was never normalised at all, and the numeric cells that were silently blanked.
 */
describe("date normalisation", () => {
  const headerRow = "Name,Department,Purchase Date,Warranty Start Date,Warranty Expiry";

  const parseDates = async (row) => {
    const result = await parseImportFile(
      makeFile("dates.csv", `${headerRow}\n${row}\n`, "text/csv")
    );
    expect(result.error).toBeNull();
    return result.rows[0];
  };

  it("keeps ISO dates exactly as written", async () => {
    const row = await parseDates("MRI Scanner,Radiology,2025-06-12,2025-06-12,2027-06-12");

    expect(row["Purchase Date"]).toBe("2025-06-12");
    expect(row["Warranty Start Date"]).toBe("2025-06-12");
    expect(row["Warranty Expiry"]).toBe("2027-06-12");
  });

  it("does not shift a slash date by a day in timezones ahead of UTC", async () => {
    // The old implementation finished with new Date(text).toISOString().slice(0, 10). new Date()
    // gives local midnight, toISOString() converts to UTC, and in IST that lands on the previous
    // day - so this row used to import as 2025-06-11.
    const row = await parseDates("MRI Scanner,Radiology,06/12/2025,06/12/2025,06/12/2027");

    expect(row["Purchase Date"]).toBe("2025-06-12");
    expect(row["Warranty Expiry"]).toBe("2027-06-12");
  });

  it("reads a day-first date as day-first when the first part cannot be a month", async () => {
    const row = await parseDates("MRI Scanner,Radiology,13/06/2025,13/06/2025,31/12/2027");

    expect(row["Purchase Date"]).toBe("2025-06-13");
    expect(row["Warranty Expiry"]).toBe("2027-12-31");
  });

  it("accepts written-out month names in either order", async () => {
    const first = await parseDates("MRI Scanner,Radiology,12 June 2025,,June 12 2027");
    expect(first["Purchase Date"]).toBe("2025-06-12");
    expect(first["Warranty Expiry"]).toBe("2027-06-12");

    const abbreviated = await parseDates("MRI Scanner,Radiology,12 Jun 2025,,\"Jun 12, 2027\"");
    expect(abbreviated["Purchase Date"]).toBe("2025-06-12");
    expect(abbreviated["Warranty Expiry"]).toBe("2027-06-12");
  });

  it("passes an unrecognisable date through for the backend to report", async () => {
    // Deliberately not guessed at here: a clear per-row error beats a plausible wrong date.
    const row = await parseDates("MRI Scanner,Radiology,next tuesday,,2027-06-12");

    expect(row["Purchase Date"]).toBe("next tuesday");
  });

  it("passes a day that does not exist through rather than rolling it forward", async () => {
    // 31 April is not a date. Formatting it from components would have produced 1 May, which is a
    // silent correction of the user's file; the backend should be the one to say so.
    const row = await parseDates("MRI Scanner,Radiology,31/04/2027,,2027-06-12");

    expect(row["Purchase Date"]).toBe("31/04/2027");
  });

  it("normalises Warranty Start Date from a real Excel date cell", async () => {
    const XLSX = await import("xlsx");
    // SheetJS hands date-formatted cells back as Excel serials. Warranty Start Date was missing
    // from the date-column set, so this used to arrive as the string "45820".
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Name", "Department", "Purchase Date", "Warranty Start Date", "Warranty Expiry"],
      ["MRI Scanner", "Radiology", new Date(2025, 5, 12), new Date(2025, 5, 12), new Date(2027, 5, 12)],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = await parseImportFile(
      new File([buffer], "warranty.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );

    expect(result.rows[0]["Warranty Start Date"]).toBe("2025-06-12");
    expect(result.rows[0]["Purchase Date"]).toBe("2025-06-12");
    expect(result.rows[0]["Warranty Expiry"]).toBe("2027-06-12");
  });

  it("passes a numeric cell that is not a plausible serial through instead of blanking it", async () => {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.aoa_to_sheet([
      ["Name", "Department", "Purchase Date"],
      ["MRI Scanner", "Radiology", 20250612],
    ]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
    const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

    const result = await parseImportFile(
      new File([buffer], "numeric.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
    );

    // Was "": the user saw an empty date in the preview with no explanation of what happened to it.
    expect(result.rows[0]["Purchase Date"]).toBe("20250612");
  });

  it("maps every documented alias, including the ones with spaces in them", async () => {
    const result = await parseImportFile(
      makeFile(
        "aliases.csv",
        "Name,Department,Coverage Start,Date Purchased,Warranty Expiration\n" +
          "MRI Scanner,Radiology,2025-06-12,2025-01-05,2027-06-12\n",
        "text/csv"
      )
    );

    // canonicalKey strips punctuation before the alias comparison, so an alias written with a
    // space in it could never match. "Coverage Start" was reported as an unknown header.
    expect(result.unknownHeaders).toEqual([]);
    expect(result.rows[0]["Warranty Start Date"]).toBe("2025-06-12");
    expect(result.rows[0]["Purchase Date"]).toBe("2025-01-05");
    expect(result.rows[0]["Warranty Expiry"]).toBe("2027-06-12");
  });

  it("lists exactly the date columns the canonical headers contain", () => {
    expect(DATE_HEADERS.every((header) => IMPORT_HEADERS.includes(header))).toBe(true);
    expect(DATE_HEADERS).toEqual(["Purchase Date", "Warranty Start Date", "Warranty Expiry"]);
  });
});

describe("rowsToCsv", () => {
  it("emits canonical headers with a UTF-8 BOM and CRLF records", () => {
    const csv = rowsToCsv([
      { Name: 'Ventilator, Portable', Department: "ICU", Status: "Operational" },
    ]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(IMPORT_HEADERS.join(","));
    expect(csv).toContain('"Ventilator, Portable"');
    expect(csv).toContain("\r\n");
  });
});

describe("exportEquipmentCsv", () => {
  it("downloads a CSV of the supplied (filtered) view", () => {
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const createSpy = vi.fn(() => "blob:url");
    const revokeSpy = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: createSpy, revokeObjectURL: revokeSpy });

    exportEquipmentCsv(
      [{ id: "EQ-1", name: "MRI Scanner", department: "Radiology", status: "Operational" }],
      "equipment_inventory_2026-08-03.csv"
    );

    expect(clickSpy).toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
    vi.unstubAllGlobals();
  });
});
