import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

const outputPath = process.env.EXCEL_OUTPUT_PATH || "logs/applications.xlsx";

async function ensureWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  if (fs.existsSync(filePath)) {
    await workbook.xlsx.readFile(filePath);
  } else {
    const sheet = workbook.addWorksheet("Applications");
    sheet.columns = [
      { header: "Entreprise", key: "entreprise", width: 30 },
      { header: "Poste", key: "poste", width: 30 },
      { header: "Localisation", key: "localisation", width: 20 },
      { header: "Type de contrat", key: "type_contrat", width: 20 },
      { header: "Statut de candid", key: "statut_candid", width: 20 },
      { header: "Date de candid", key: "date_candid", width: 20 },
      { header: "Site Web", key: "site_web", width: 40 },
      { header: "Remarques de reunion", key: "remarques", width: 40 },
      { header: "Email envoyé?", key: "email_envoye", width: 12 },
      { header: "Date d'envoi", key: "date_envoi", width: 24 },
      { header: "Message", key: "message", width: 80 },
    ];
  }
  return workbook;
}

export async function appendApplicationRecord(record) {
  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const workbook = await ensureWorkbook(outputPath);
  const sheet =
    workbook.getWorksheet("Applications") ??
    workbook.addWorksheet("Applications");

  sheet.addRow({
    entreprise: record.entreprise ?? "",
    poste: record.poste ?? "",
    localisation: record.localisation ?? "",
    type_contrat: record.type_contrat ?? "",
    statut_candid: record.statut_candid ?? "",
    date_candid: record.date_candid ?? "",
    site_web: record.site_web ?? "",
    remarques: record.remarques ?? "",
    email_envoye: record.email_envoye ?? "",
    date_envoi: record.date_envoi ?? "",
    message: record.message ?? "",
  });

  await workbook.xlsx.writeFile(outputPath);
}
