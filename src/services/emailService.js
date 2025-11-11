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
  const transporter = createTransporter();

  if (!transporter) {
    if (options.dryRun) {
      // simulate success when running in dryRun mode
      return { accepted: [message.to], messageId: "dry-run" };
    }
    throw new Error(
      "SMTP configuration is missing. Set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS or use dryRun."
    );
  }

  const mailOptions = {
    from: `${process.env.SENDER_NAME ?? ""} <${
      process.env.SENDER_EMAIL ?? process.env.SMTP_USER
    }>`,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
    attachments: message.attachments,
  };

  // sendMail throws on fatal errors
  const info = await transporter.sendMail(mailOptions);
  return info;
}
