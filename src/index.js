import "dotenv/config";
import express from "express";
import { sendEmail } from "./services/emailService.js";
import { appendApplicationRecord } from "./services/excelService.js";
import { delay } from "./utils/delay.js";

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
 *   delayMs, dryRun
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
  } = body;

  if (!to || !subject) {
    return res
      .status(400)
      .json({ error: "Missing required fields: to, subject" });
  }

  try {
    const info = await sendEmail(
      { to, subject, text, html },
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
      message: text ?? html ?? "",
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
