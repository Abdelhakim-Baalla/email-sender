const defaultPortfolioUrl = process.env.PORTFOLIO_URL ?? "";
const defaultLinkedInUrl = process.env.LINKEDIN_URL ?? "";
const defaultPhoneNumber = process.env.PHONE_NUMBER ?? "";

function buildSignature(applicant) {
  const lines = [applicant.name];
  if (applicant.email) lines.push(applicant.email);
  if (applicant.phone) lines.push(applicant.phone);
  if (applicant.linkedin) lines.push(applicant.linkedin);
  if (applicant.portfolio) lines.push(applicant.portfolio);
  return lines.join("\n");
}

export function buildApplicationEmail({
  companyName,
  jobTitle,
  applicant = {},
  portfolioUrl = defaultPortfolioUrl,
  linkedinUrl = defaultLinkedInUrl,
  phoneNumber = defaultPhoneNumber,
}) {
  const effectiveApplicant = {
    name: applicant.name ?? process.env.SENDER_NAME ?? "",
    email:
      applicant.email ??
      process.env.SENDER_EMAIL ??
      process.env.SMTP_USER ??
      "",
    phone: applicant.phone ?? phoneNumber,
    linkedin: applicant.linkedin ?? linkedinUrl,
    portfolio: applicant.portfolio ?? portfolioUrl,
  };

  const subject = `Candidature – ${jobTitle ?? "Développeur Full-Stack"}`;

  const intro = "Madame, Monsieur,";
  const bodyParagraphs = [
    "Je me permets de vous adresser ma candidature pour le poste de Développeur Full-Stack.",
    "Diplômé de YouCode en partenariat avec l’Université Mohammed VI Polytechnique, j’ai récemment consolidé mon expérience au sein de NJT-GROUP.",
    "Je suis motivé à rejoindre votre entreprise afin de mettre à profit mes compétences techniques ainsi que mon sens de l’innovation pour contribuer à vos projets.",
    `Vous trouverez ci-joint mon CV ainsi que mon portfolio présentant mes réalisations : ${
      effectiveApplicant.portfolio || ""
    }.`,
    "Je serais honoré d’échanger avec vous afin de vous exposer plus en détail ma motivation et la valeur ajoutée que je peux apporter à votre équipe.",
  ];
  if (companyName) {
    bodyParagraphs[0] = `Je me permets de vous adresser ma candidature pour le poste de ${
      jobTitle ?? "Développeur Full-Stack"
    } au sein de ${companyName}.`;
  }

  const closing =
    "Je vous prie de croire, Madame, Monsieur, en l’expression de mes salutations distinguées.";
  const signature = buildSignature(effectiveApplicant);

  const text = [intro, "", ...bodyParagraphs, "", closing, "", signature]
    .filter(Boolean)
    .join("\n");

  const htmlBodyParagraphs = bodyParagraphs
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph}</p>`) // paragraphs already sanitized
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="fr">
  <body>
    <p>${intro}</p>
    ${htmlBodyParagraphs}
    <p>${closing}</p>
    <p style="white-space: pre-line;">${signature}</p>
  </body>
</html>`;

  return {
    subject,
    text,
    html,
  };
}
