import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { site, companyAddressLine } from "@/config/site";

/**
 * E-mail via SMTP. Werkt met elke aanbieder (bijv. je eigen hosting, Brevo,
 * Postmark, Amazon SES of Google Workspace). Zonder SMTP-instellingen worden
 * e-mails alleen in de serverlog geschreven, handig tijdens ontwikkelen.
 */

let transporter: Transporter | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST);
}

function transport(): Transporter {
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT ?? 587) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

const FROM = () => process.env.EMAIL_FROM ?? `${site.name} <${site.company.email}>`;
export const adminEmail = () => process.env.ADMIN_EMAIL ?? site.company.email;

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

export async function sendMail(mail: Mail): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.info(`[e-mail niet verstuurd: SMTP niet ingesteld] Aan: ${mail.to} | ${mail.subject}\n${mail.text}`);
    return false;
  }
  await transport().sendMail({ from: FROM(), ...mail });
  return true;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function layout(title: string, body: string): string {
  return `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f3ee;font-family:Arial,Helvetica,sans-serif;color:#10231a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ee;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#123f29;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;">${escapeHtml(site.name)}</td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.6;">${body}</td></tr>
<tr><td style="padding:16px 28px 24px;font-size:12px;line-height:1.5;color:#5b6b62;border-top:1px solid #ecebe4;">
${escapeHtml(site.company.legalName)} · ${escapeHtml(companyAddressLine())} · KvK ${escapeHtml(site.company.kvk)}<br>
Vragen? Mail naar <a href="mailto:${site.company.email}" style="color:#1c7a45;">${site.company.email}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:28px 0;"><a href="${href}" style="background:#1c7a45;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px;display:inline-block;">${escapeHtml(label)}</a></p>`;
}

export function plansReadyEmail(input: {
  to: string;
  name: string;
  types: ("voeding" | "training")[];
  link: string;
  seq: number;
}): Mail {
  const what =
    input.types.length === 2
      ? "je voedingsschema en trainingsschema"
      : input.types[0] === "voeding"
        ? "je voedingsschema"
        : "je trainingsschema";
  const intro =
    input.seq > 1
      ? `Er staat een nieuwe periode voor je klaar! We hebben ${what} vernieuwd, afgestemd op je voortgang.`
      : `Goed nieuws: ${what} ${input.types.length === 2 ? "staan" : "staat"} voor je klaar. Helemaal afgestemd op jouw doel, voorkeuren en agenda.`;
  const subject = input.seq > 1 ? `Je nieuwe schema staat klaar, ${input.name}` : `Je persoonlijke schema staat klaar, ${input.name}!`;
  const html = layout(
    subject,
    `<p>Hoi ${escapeHtml(input.name)},</p>
<p>${intro}</p>
${button(input.link, "Bekijk mijn schema")}
<p><strong>Zo haal je er het meeste uit:</strong></p>
<ul style="padding-left:20px;">
<li>Lees eerst de introductie en de kernafspraken.</li>
<li>Doe je boodschappen met de boodschappenlijst (handig: download het schema als PDF).</li>
<li>Weeg jezelf 1x per week, op dezelfde dag en hetzelfde tijdstip, en vul je weegmoment in. Wijkt je voortgang af, dan sturen we je schema meteen bij.</li>
<li>Na 4 weken vul je een korte check-in in. Daarmee maken we je volgende schema, afgestemd op je voortgang. We sturen je een herinnering.</li>
</ul>
<p>Deze link is persoonlijk; deel hem niet met anderen. Is de link verlopen? Via ${site.url}/inloggen vraag je eenvoudig een nieuwe aan.</p>
<p>Veel succes! Je kunt dit.</p>
<p>Team ${escapeHtml(site.name)}</p>`,
  );
  const text = `Hoi ${input.name},\n\n${intro}\n\nBekijk je schema: ${input.link}\n\nDeze link is persoonlijk. Nieuwe link nodig? Ga naar ${site.url}/inloggen\n\nTeam ${site.name}`;
  return { to: input.to, subject, html, text };
}

/**
 * Uitnodiging (reminder 0) en herinneringen voor de verplichte check-in. Het
 * volgende schema maken we pas als de check-in is ingevuld.
 */
export function checkinEmail(input: {
  to: string;
  name: string;
  link: string;
  /** De periode waarvoor de check-in het schema maakt. */
  seq: number;
  dueAt: Date;
  reminder: number;
}): Mail {
  const due = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(input.dueAt);
  const subject =
    input.reminder === 0
      ? `Tijd voor je check-in, ${input.name}`
      : input.reminder === 1
        ? "Herinnering: je nieuwe schema wacht op je check-in"
        : "Je nieuwe schema staat nog voor je klaar";
  const intro =
    input.reminder === 0
      ? `Je huidige periode loopt bijna af (${due}). Vul je check-in in: het kost je 2 minuten. Daarna maken we direct je schema voor periode ${input.seq}, afgestemd op hoe het ging.`
      : `We hebben je check-in nog niet ontvangen. Je schema voor periode ${input.seq} maken we pas als je hem hebt ingevuld, zodat het echt bij je voortgang past. Het kost je 2 minuten.`;
  const html = layout(
    subject,
    `<p>Hoi ${escapeHtml(input.name)},</p>
<p>${escapeHtml(intro)}</p>
${button(input.link, "Check-in invullen")}
<p><strong>Wat we je vragen:</strong></p>
<ul style="padding-left:20px;">
<li>Je huidige gewicht (weeg je bij voorkeur 's ochtends, voor het ontbijt).</li>
<li>Hoe goed je het schema kon volgen, en hoe je honger, energie en slaap waren.</li>
<li>Wat je lekker vond, wat je anders wilt en of je nieuwe klachten hebt.</li>
</ul>
<p>Binnen een paar minuten na je check-in staat je nieuwe schema klaar en krijg je een e-mail.</p>
<p>Team ${escapeHtml(site.name)}</p>`,
  );
  const text = `Hoi ${input.name},\n\n${intro}\n\nCheck-in invullen: ${input.link}\n\nTeam ${site.name}`;
  return { to: input.to, subject, html, text };
}

/** Herinnering voor het wekelijkse weegmoment (klant kan dit uitzetten in Mijn schema's). */
export function weeklyReminderEmail(input: { to: string; name: string; link: string; week: number }): Mail {
  const subject = `Weegmoment week ${input.week}: hoe gaat het, ${input.name}?`;
  const intro =
    "Tijd voor je wekelijkse weegmoment. Vul je gewicht en een paar korte vragen in (1 minuut). Wijkt je voortgang af, dan sturen we je schema meteen bij: iets meer of minder eten, of zwaarder of lichter trainen.";
  const html = layout(
    subject,
    `<p>Hoi ${escapeHtml(input.name)},</p>
<p>${escapeHtml(intro)}</p>
${button(input.link, "Weegmoment invullen")}
<p style="font-size:14px;color:#5b6b62;">Tip: weeg je op een vaste dag, 's ochtends voor het ontbijt. Geen zin in deze herinneringen? Zet ze uit in Mijn schema's, onder Check-in.</p>
<p>Team ${escapeHtml(site.name)}</p>`,
  );
  return { to: input.to, subject, html, text: `Hoi ${input.name},\n\n${intro}\n\nWeegmoment invullen: ${input.link}\n\nTeam ${site.name}` };
}

export function loginEmail(input: { to: string; name: string; link: string }): Mail {
  const subject = "Je inloglink voor Mijn schema's";
  const html = layout(
    subject,
    `<p>Hoi ${escapeHtml(input.name)},</p>
<p>Met de knop hieronder log je in op je persoonlijke omgeving. Daar vind je al je schema's, kun je je check-in invullen en je abonnement beheren of opzeggen.</p>
${button(input.link, "Inloggen")}
<p style="font-size:14px;color:#5b6b62;">Heb je deze e-mail niet aangevraagd? Dan kun je hem negeren.</p>`,
  );
  return {
    to: input.to,
    subject,
    html,
    text: `Hoi ${input.name},\n\nLog in via: ${input.link}\n\nNiet aangevraagd? Negeer deze e-mail.`,
  };
}

export function withdrawalConfirmationEmail(input: {
  to: string;
  name: string;
  orderReference: string;
  message?: string;
  receivedAt: Date;
  id: string;
}): Mail {
  const when = new Intl.DateTimeFormat("nl-NL", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(input.receivedAt);
  const subject = "Ontvangstbevestiging van je herroeping";
  const details = `Naam: ${input.name}\nE-mailadres: ${input.to}\nBestelling: ${input.orderReference}\n${input.message ? `Toelichting: ${input.message}\n` : ""}Ontvangen op: ${when}\nKenmerk: ${input.id}`;
  const html = layout(
    subject,
    `<p>Hoi ${escapeHtml(input.name)},</p>
<p>We hebben je verklaring van herroeping ontvangen. Hieronder vind je de inhoud en het tijdstip van ontvangst. Bewaar deze e-mail goed.</p>
<pre style="background:#f4f3ee;border-radius:12px;padding:16px;font-family:inherit;white-space:pre-wrap;">${escapeHtml(details)}</pre>
<p>Voor zover je herroepingsrecht van toepassing is, betalen we het bedrag binnen 14 dagen terug via dezelfde betaalmethode en stoppen we een eventueel abonnement. Als je herroepingsrecht al was vervallen (bijvoorbeeld omdat je schema al was geleverd nadat je daar uitdrukkelijk mee had ingestemd), laten we je dat binnen ${site.responseTimeDays} werkdagen weten.</p>
<p>Team ${escapeHtml(site.name)}</p>`,
  );
  return { to: input.to, subject, html, text: `Hoi ${input.name},\n\nWe hebben je herroeping ontvangen.\n\n${details}\n\nTeam ${site.name}` };
}

export function adminNotificationEmail(subject: string, lines: Record<string, string | undefined>, replyTo?: string): Mail {
  const entries = Object.entries(lines).filter(([, v]) => v);
  return {
    to: adminEmail(),
    subject: `[${site.shortName}] ${subject}`,
    replyTo,
    html: layout(
      subject,
      `<h2 style="margin-top:0;">${escapeHtml(subject)}</h2>${entries
        .map(([k, v]) => `<p><strong>${escapeHtml(k)}:</strong><br>${escapeHtml(v!).replace(/\n/g, "<br>")}</p>`)
        .join("")}`,
    ),
    text: entries.map(([k, v]) => `${k}: ${v}`).join("\n"),
  };
}

export function cancellationEmail(input: { to: string; name: string; productName: string; endsAt: Date | null }): Mail {
  const end = input.endsAt
    ? new Intl.DateTimeFormat("nl-NL", { dateStyle: "long", timeZone: "Europe/Amsterdam" }).format(input.endsAt)
    : null;
  const subject = "Bevestiging van je opzegging";
  const line = `Je abonnement "${input.productName}" is opgezegd.${end ? ` Het loopt nog tot en met ${end}; daarna wordt er niets meer afgeschreven.` : ""}`;
  const html = layout(
    subject,
    `<p>Hoi ${escapeHtml(input.name)},</p>
<p>${escapeHtml(line)}</p>
<p>Je houdt toegang tot alle schema's die je al hebt ontvangen via <a href="${site.url}/account" style="color:#1c7a45;">Mijn schema's</a>. Bedenk je je? Tot de einddatum kun je de opzegging daar met één klik intrekken.</p>
<p>Bedankt dat je ons hebt laten meedenken. Veel succes met afblijven!</p>
<p>Team ${escapeHtml(site.name)}</p>`,
  );
  return { to: input.to, subject, html, text: `Hoi ${input.name},\n\n${line}\n\nTeam ${site.name}` };
}

export function orderConfirmationEmail(input: {
  to: string;
  name: string;
  orderNumber: string;
  productName: string;
  durationLabel: string;
  amountPaid: string;
  renewal: string;
  incassoNote?: string;
}): Mail {
  const subject = `Orderbevestiging ${input.orderNumber}`;
  const rows: [string, string][] = [
    ["Bestelnummer", input.orderNumber],
    ["Product", input.productName],
    ["Looptijd", input.durationLabel],
    ["Betaald", input.amountPaid],
    ["Verlenging", input.renewal],
  ];
  const consent =
    "Je hebt bij je bestelling uitdrukkelijk ingestemd met directe levering van je schema en verklaard dat je weet dat je herroepingsrecht vervalt zodra de levering is begonnen.";
  const html = layout(
    subject,
    `<p>Hoi ${escapeHtml(input.name)},</p>
<p>Bedankt voor je bestelling! We maken nu je persoonlijke schema; je ontvangt binnen enkele minuten een aparte e-mail zodra het klaar is.</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px;">
${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#5b6b62;">${escapeHtml(k)}</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${escapeHtml(v)}</td></tr>`).join("")}
</table>
${input.incassoNote ? `<p style="font-size:14px;color:#5b6b62;">${escapeHtml(input.incassoNote)}</p>` : ""}
<p style="font-size:14px;color:#5b6b62;">${escapeHtml(consent)}</p>
<p style="font-size:14px;color:#5b6b62;">Op je bestelling zijn onze <a href="${site.url}/algemene-voorwaarden" style="color:#1c7a45;">algemene voorwaarden</a> van toepassing. Opzeggen kan altijd online via <a href="${site.url}/abonnement-opzeggen" style="color:#1c7a45;">${site.url.replace(/^https?:\/\//, "")}/abonnement-opzeggen</a>. Je factuur ontvang je apart van onze betaalpartner Stripe.</p>
<p>Team ${escapeHtml(site.name)}</p>`,
  );
  const text = `Hoi ${input.name},\n\nBedankt voor je bestelling!\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${input.incassoNote ? `${input.incassoNote}\n\n` : ""}${consent}\n\nAlgemene voorwaarden: ${site.url}/algemene-voorwaarden\nOpzeggen: ${site.url}/abonnement-opzeggen\n\nTeam ${site.name}`;
  return { to: input.to, subject, html, text };
}

