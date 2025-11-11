import "dotenv/config";
import fs from "fs";
import path from "path";
import express from "express";
import { sendEmail } from "./services/emailService.js";
import { appendApplicationRecord } from "./services/excelService.js";
import { delay } from "./utils/delay.js";
import { buildApplicationEmail } from "./templates/applicationEmail.js";

const app = express();
const port = process.env.PORT ?? 4859;

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * POST /applications/send
 * body: {
 *   to, subject, text, html,
 *   entreprise, poste, localisation, type_contrat, statut_candid, date_candid, site_web, remarques,
 *   delayMs, dryRun, cvPath
 * }
 */
app.post("/applications/send", async (req, res) => {
  const body = req.body ?? {};
  const {
    to,
    subject,
    text,
    html,
    entreprise,
    poste,
    localisation,
    type_contrat,
    statut_candid,
    date_candid,
    site_web,
    remarques,
    delayMs,
    dryRun,
    cvPath,
  } = body;

  if (!to) {
    return res.status(400).json({ error: "Missing required field: to" });
  }

  const template = buildApplicationEmail({
    companyName: entreprise,
    jobTitle: poste,
  });

  const composedSubject = subject ?? template.subject;
  const composedText = text ?? template.text;
  const composedHtml = html ?? template.html;

  let attachments = [];
  const preferredCvPath = cvPath ?? process.env.CV_PATH ?? "";
  if (preferredCvPath) {
    const absoluteCvPath = path.isAbsolute(preferredCvPath)
      ? preferredCvPath
      : path.resolve(process.cwd(), preferredCvPath);

    if (fs.existsSync(absoluteCvPath)) {
      attachments = [
        {
          filename: path.basename(absoluteCvPath),
          path: absoluteCvPath,
        },
      ];
    } else if (!dryRun) {
      return res.status(400).json({
        error: `CV introuvable au chemin ${absoluteCvPath}. Fournis un cvPath valide ou active dryRun.`,
      });
    }
  }

  try {
    const info = await sendEmail(
      {
        to,
        subject: composedSubject,
        text: composedText,
        html: composedHtml,
        attachments,
      },
      { dryRun: !!dryRun }
    );

    const record = {
      entreprise,
      poste,
      localisation,
      type_contrat,
      statut_candid,
      date_candid,
      site_web,
      remarques,
      email_envoye: info && info.accepted ? "Oui" : "Non",
      date_envoi: new Date().toISOString(),
      message: composedText ?? composedHtml ?? "",
    };

    await appendApplicationRecord(record);

    if (delayMs && Number(delayMs) > 0) await delay(Number(delayMs));

    return res.json({ ok: true, info });
  } catch (err) {
    console.error(err);
    // still try to log the failed attempt
    try {
      await appendApplicationRecord({
        entreprise,
        poste,
        localisation,
        type_contrat,
        statut_candid,
        date_candid,
        site_web,
        remarques,
        email_envoye: "Non",
        date_envoi: new Date().toISOString(),
        message: err.message ?? String(err),
      });
    } catch (e) {
      console.error("Failed to write to excel after email error", e);
    }

    return res.status(500).json({ error: err.message ?? "send error" });
  }
});

app.listen(port, () => {
  // Provide quick confirmation in logs when the service boots.
  console.log(`Email sender service listening on port ${port}`);
});
