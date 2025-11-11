import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const outputPath = process.env.EXCEL_OUTPUT_PATH || "logs/applications.xlsx";

const EXPECTED_COLUMNS = [
  { header: "Company", key: "company", width: 30 },
  { header: "Position", key: "position", width: 30 },
  { header: "Location", key: "location", width: 20 },
  { header: "Flexibility", key: "flexibility", width: 18 },
  { header: "Type Contrat", key: "type_contrat", width: 20 },
  { header: "Application method", key: "application_method", width: 25 },
  { header: "Contact", key: "contact", width: 30 },
  { header: "Apply Date", key: "apply_date", width: 18 },
  { header: "Status", key: "status", width: 18 },
  { header: "Response Date", key: "response_date", width: 18 },
  { header: "Referral?", key: "referral", width: 15 },
  { header: "Interview Date", key: "interview_date", width: 18 },
  { header: "In-touch Person", key: "in_touch_person", width: 25 },
  { header: "Salary Range", key: "salary_range", width: 20 },
  { header: "Notes", key: "notes", width: 60 },
];

function getOrCreateSheetWithColumns(workbook) {
  const sheet =
    workbook.getWorksheet("Applications") ??
    workbook.addWorksheet("Applications");
  // Always set columns to ensure key-based addRow works after reading an existing file
  sheet.columns = EXPECTED_COLUMNS;
  return sheet;
}

async function ensureWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
    // Ensure the sheet exists and has columns mapping
    getOrCreateSheetWithColumns(workbook);
  } else {
    getOrCreateSheetWithColumns(workbook);
  }
  return workbook;
}

export async function appendApplicationRecord(record) {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const workbook = await ensureWorkbook(outputPath);
  const sheet = getOrCreateSheetWithColumns(workbook);

  sheet.addRow({
    company: record.company ?? "",
    position: record.position ?? "",
    location: record.location ?? "",
    flexibility: record.flexibility ?? "",
    type_contrat: record.type_contrat ?? "",
    application_method: record.application_method ?? "",
    contact: record.contact ?? "",
    apply_date: record.apply_date ?? "",
    status: record.status ?? "",
    response_date: record.response_date ?? "",
    referral: record.referral ?? "",
    interview_date: record.interview_date ?? "",
    in_touch_person: record.in_touch_person ?? "",
    salary_range: record.salary_range ?? "",
    notes: record.notes ?? "",
  });

  try {
    await workbook.xlsx.writeFile(outputPath);
  } catch (err) {
    // Common Windows issue: file is open/locked by Excel
    throw new Error(
      `Échec d'écriture du fichier Excel. Assure-toi que le fichier n'est pas ouvert: ${outputPath}. Détail: ${err.message}`
    );
  }
}
