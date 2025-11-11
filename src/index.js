import "dotenv/config";
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";

import { sendEmail } from "./services/emailService.js";
import { appendApplicationRecord } from "./services/excelService.js";
import { delay } from "./utils/delay.js";
import { buildApplicationEmail } from "./templates/applicationEmail.js";
import { authenticateToken, generateToken } from "./middleware/auth.js";
import authRoutes from "./routes/auth.js";
import User from "./models/User.js";

const app = express();
const port = Number(process.env.PORT ?? 4859);

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins, credentials: true } : { credentials: true }));
app.use(express.json({ limit: "10mb" }));

// Routes d'authentification
app.use('/auth', authRoutes);



function extractBase64Payload(rawContent) {
  if (!rawContent) return null;
  const [, data] = rawContent.includes(",")
    ? rawContent.split(",", 2)
    : [null, rawContent];
  return data;
}

async function buildAttachmentsFromPayload(payload, dryRun, userId = null) {
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

  // Priorité au CV de l'utilisateur authentifié
  let preferredCvPath = payload.cvPath ?? process.env.CV_PATH ?? "";
  
  if (userId) {
    const userCvPath = await User.getCvPath(userId);
    if (userCvPath) {
      preferredCvPath = userCvPath;
    }
  }
  
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
  const userId = options.userId;
  const to = payload.to?.trim();

  if (!to) {
    throw new Error("Missing required field: to");
  }

  const emails = to.split(',').map(e => e.trim()).filter(Boolean);
  
  if (emails.length === 0) {
    throw new Error("No valid email addresses provided");
  }

  // Récupérer les infos utilisateur pour le template
  let userInfo = {};
  if (userId) {
    const user = await User.findByEmail(options.userEmail);
    if (user) {
      userInfo = {
        applicant: user.name,
        portfolioUrl: user.personalInfo?.portfolio || payload.portfolioUrl,
        linkedinUrl: user.personalInfo?.linkedin || payload.linkedinUrl,
        phoneNumber: user.personalInfo?.phone || payload.phoneNumber,
      };
    }
  }

  const template = buildApplicationEmail({
    companyName: payload.company,
    jobTitle: payload.position,
    applicant: payload.applicant || userInfo.applicant,
    portfolioUrl: payload.portfolioUrl || userInfo.portfolioUrl,
    linkedinUrl: payload.linkedinUrl || userInfo.linkedinUrl,
    phoneNumber: payload.phoneNumber || userInfo.phoneNumber,
  });

  const composedSubject = payload.subject ?? template.subject;
  const composedText = payload.text ?? template.text;
  const composedHtml = payload.html ?? template.html;

  let attachments = [];

  try {
    attachments = await buildAttachmentsFromPayload(payload, dryRun, userId);
  } catch (attachmentError) {
    await logApplicationAttempt({
      company: payload.company,
      position: payload.position,
      location: payload.location,
      flexibility: payload.flexibility,
      type_contrat: payload.type_contrat,
      application_method: payload.application_method,
      contact: payload.contact,
      apply_date: payload.apply_date,
      status: "Failed",
      response_date: "",
      referral: payload.referral,
      interview_date: "",
      in_touch_person: "",
      salary_range: "",
      notes: attachmentError.message,
    });

    throw attachmentError;
  }

  const results = [];
  const emailDelay = options.emailDelay || 1000;

  for (let i = 0; i < emails.length; i++) {
    const email = emails[i];
    
    try {
      // Récupérer le mot de passe SMTP de l'utilisateur
      let userSmtpPassword = null;
      if (userId && !dryRun) {
        const smtpConfig = await User.getSmtpConfig(userId);
        if (smtpConfig.configured && smtpConfig.password) {
          const { decrypt } = await import('./utils/encryption.js');
          userSmtpPassword = decrypt(smtpConfig.password);
        }
      }

      const info = await sendEmail(
        {
          to: email,
          subject: composedSubject,
          text: composedText,
          html: composedHtml,
          attachments,
        },
        { 
          dryRun,
          userEmail: options.userEmail,
          userName: userInfo.applicant,
          userSmtpPassword
        }
      );

      await logApplicationAttempt({
        company: payload.company,
        position: payload.position,
        location: payload.location,
        flexibility: payload.flexibility,
        type_contrat: payload.type_contrat,
        application_method: payload.application_method,
        contact: email,
        apply_date: payload.apply_date,
        status: info && info.accepted ? "Sent" : "Failed",
        response_date: "",
        referral: payload.referral,
        interview_date: "",
        in_touch_person: "",
        salary_range: "",
        notes: composedText ?? composedHtml ?? "",
      });

      results.push({ email, status: 'sent', info });
    } catch (err) {
      await logApplicationAttempt({
        company: payload.company,
        position: payload.position,
        location: payload.location,
        flexibility: payload.flexibility,
        type_contrat: payload.type_contrat,
        application_method: payload.application_method,
        contact: email,
        apply_date: payload.apply_date,
        status: "Failed",
        response_date: "",
        referral: payload.referral,
        interview_date: "",
        in_touch_person: "",
        salary_range: "",
        notes: err.message ?? String(err),
      });

      results.push({ email, status: 'failed', error: err.message });
    }

    if (i < emails.length - 1) {
      await delay(emailDelay);
    }
  }

  return { results, composedSubject, composedText, composedHtml };
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
app.post("/applications/send", authenticateToken, async (req, res) => {
  const body = req.body ?? {};
  const { delayMs, dryRun } = body;

  try {
    const result = await processApplication(body, { 
      dryRun, 
      emailDelay: Number(delayMs) || 1000,
      userId: req.user.id,
      userEmail: req.user.email
    });

    return res.json({ ok: true, results: result.results });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message ?? "send error" });
  }
});

app.post("/applications/send-batch", authenticateToken, async (req, res) => {
  const body = req.body ?? {};
  const { applications, limit, delayMs, dryRun } = body;

  if (!Array.isArray(applications) || applications.length === 0) {
    return res.status(400).json({
      error: "La liste 'applications' doit contenir au moins un élément.",
    });
  }

  const safeDelay = Number(delayMs) || 1000;
  const maxToSend = limit
    ? Math.min(Number(limit), applications.length)
    : applications.length;
  const results = [];

  for (let index = 0; index < maxToSend; index += 1) {
    const application = applications[index] ?? {};
    const effectiveDryRun =
      application.dryRun !== undefined ? !!application.dryRun : !!dryRun;

    try {
      const result = await processApplication(application, {
        dryRun: effectiveDryRun,
        emailDelay: safeDelay,
        userId: req.user.id,
        userEmail: req.user.email
      });
      
      result.results.forEach(emailResult => {
        results.push({
          status: emailResult.status,
          index,
          to: emailResult.email,
          info: emailResult.info,
          error: emailResult.error,
        });
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
