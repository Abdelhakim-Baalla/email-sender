import "dotenv/config";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import { sendEmail } from "./services/emailService.js";
import { appendApplicationRecord } from "./services/excelService.js";
import { delay } from "./utils/delay.js";
import { buildApplicationEmail } from "./templates/applicationEmail.js";

const app = express();
const port = Number(process.env.PORT ?? 4859);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: "10mb" }));

function extractBase64Payload(rawContent) {
  if (!rawContent) return null;
  const [, data] = rawContent.includes(",") ? rawContent.split(",", 2) : [null, rawContent];
  return data;
}

function buildAttachmentsFromPayload(payload, dryRun) {
  const attachments = [];
  const { cvFile } = payload;

  if (cvFile?.content) {
    try {
      const base64Content = extractBase64Payload(cvFile.content);
      if (base64Content) {
        attachments.push({
          filename: cvFile.fileName ?? "cv.pdf",
          content: Buffer.from(base64Content, cvFile.encoding ?? "base64"),
          contentType: cvFile.contentType ?? "application/pdf",
        });
      }
    } catch (error) {
      if (!dryRun) {
        throw new Error(
          "Impossible de décoder le CV fourni. Vérifie le format (Base64 attendu)."
        );
      }
    }
  }

  const preferredCvPath = payload.cvPath ?? process.env.CV_PATH ?? "";
  if (preferredCvPath) {
    const absoluteCvPath = path.isAbsolute(preferredCvPath)
      ? preferredCvPath
      : path.resolve(process.cwd(), preferredCvPath);

    if (fs.existsSync(absoluteCvPath)) {
      attachments.push({
        filename: path.basename(absoluteCvPath),
        path: absoluteCvPath,
      });
    } else if (!dryRun) {
      throw new Error(
        `CV introuvable au chemin ${absoluteCvPath}. Fournis un cvPath valide ou active dryRun.`
      );
    }
  }

  return attachments;
}

async function logApplicationAttempt(record, override = {}) {
  await appendApplicationRecord({ ...record, ...override });
}

async function processApplication(payload, options = {}) {
  const dryRun = !!options.dryRun;
  const to = payload.to?.trim();

  if (!to) {
    throw new Error("Missing required field: to");
  }

  const template = buildApplicationEmail({
    companyName: payload.entreprise,
    jobTitle: payload.poste,
    applicant: payload.applicant,
    portfolioUrl: payload.portfolioUrl,
    linkedinUrl: payload.linkedinUrl,
    phoneNumber: payload.phoneNumber,
  });

  const composedSubject = payload.subject ?? template.subject;
  const composedText = payload.text ?? template.text;
  const composedHtml = payload.html ?? template.html;

  let attachments = [];

  try {
    attachments = buildAttachmentsFromPayload(payload, dryRun);
  } catch (attachmentError) {
    // Attachment errors should result in failure logging but still propagate.
    await logApplicationAttempt(
      {
        entreprise: payload.entreprise,
        poste: payload.poste,
        localisation: payload.localisation,
        type_contrat: payload.type_contrat,
        statut_candid: payload.statut_candid,
        date_candid: payload.date_candid,
        site_web: payload.site_web,
        remarques: payload.remarques,
        email_envoye: "Non",
        date_envoi: new Date().toISOString(),
        message: attachmentError.message,
      }
    );

    throw attachmentError;
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
      { dryRun }
    );

    await logApplicationAttempt({
      entreprise: payload.entreprise,
      poste: payload.poste,
      localisation: payload.localisation,
      type_contrat: payload.type_contrat,
      statut_candid: payload.statut_candid,
      date_candid: payload.date_candid,
      site_web: payload.site_web,
      remarques: payload.remarques,
      email_envoye: info && info.accepted ? "Oui" : "Non",
      date_envoi: new Date().toISOString(),
      message: composedText ?? composedHtml ?? "",
    });

    return { info, composedSubject, composedText, composedHtml };
  } catch (err) {
    await logApplicationAttempt({
      entreprise: payload.entreprise,
      poste: payload.poste,
      localisation: payload.localisation,
      type_contrat: payload.type_contrat,
      statut_candid: payload.statut_candid,
      date_candid: payload.date_candid,
      site_web: payload.site_web,
      remarques: payload.remarques,
      email_envoye: "Non",
      date_envoi: new Date().toISOString(),
      message: err.message ?? String(err),
    });

    throw err;
  }
}

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
  const { delayMs, dryRun } = body;

  try {
    const result = await processApplication(body, { dryRun });

    if (delayMs && Number(delayMs) > 0) {
      await delay(Number(delayMs));
    }

    return res.json({ ok: true, info: result.info });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "send error" });
  }
});

app.post("/applications/send-batch", async (req, res) => {
  const body = req.body ?? {};
  const { applications, limit, delayMs, dryRun } = body;

  if (!Array.isArray(applications) || applications.length === 0) {
    return res.status(400).json({ error: "La liste 'applications' doit contenir au moins un élément." });
  }

  const safeDelay = Number(delayMs) || 0;
  const maxToSend = limit ? Math.min(Number(limit), applications.length) : applications.length;
  const results = [];

  for (let index = 0; index < maxToSend; index += 1) {
    const application = applications[index] ?? {};
    const effectiveDryRun =
      application.dryRun !== undefined ? !!application.dryRun : !!dryRun;

    try {
      const result = await processApplication(application, { dryRun: effectiveDryRun });
      results.push({
        status: "sent",
        index,
        to: application.to ?? null,
        info: result.info,
      });
    } catch (error) {
      results.push({
        status: "failed",
        index,
        to: application.to ?? null,
        error: error.message ?? String(error),
      });
    }

    if (safeDelay > 0 && index < maxToSend - 1) {
      await delay(safeDelay);
    }
  }

  const successes = results.filter((item) => item.status === "sent").length;
  const failures = results.length - successes;

  return res.json({
    ok: failures === 0,
    total: results.length,
    successes,
    failures,
    results,
  });
});

app.listen(port, () => {
  // Provide quick confirmation in logs when the service boots.
  console.log(`Email sender service listening on port ${port}`);
});
