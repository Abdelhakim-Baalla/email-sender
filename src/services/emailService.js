import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    return null; // allow dry-run when env is not configured
  }

  const secure = port === 465; // implicit TLS

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send an email using SMTP configuration from environment.
 * message: { to, subject, text, html, attachments }
 * options: { dryRun: boolean }
 */
export async function sendEmail(message, options = { dryRun: false }) {
  if (options.dryRun) {
    return { accepted: [message.to], messageId: "dry-run" };
  }

  // Utiliser les credentials de l'utilisateur
  if (options.userEmail && options.userSmtpPassword) {
    const userTransporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: options.userEmail,
        pass: options.userSmtpPassword,
      },
    });

    const mailOptions = {
      from: `${options.userName || ''} <${options.userEmail}>`,
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments,
    };

    const info = await userTransporter.sendMail(mailOptions);
    return info;
  }

  // Fallback sur .env (pour compatibilité)
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error("Configuration SMTP manquante. Configurez votre mot de passe d'application Gmail.");
  }

  const fromEmail = options.userEmail || process.env.SENDER_EMAIL || process.env.SMTP_USER;
  const fromName = options.userName || process.env.SENDER_NAME || "";

  const mailOptions = {
    from: `${fromName} <${fromEmail}>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments,
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
