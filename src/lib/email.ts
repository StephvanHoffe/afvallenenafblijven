import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { site, companyAddressLine } from "@/config/site";
import { PRODUCT_IDS, productFor, products } from "@/config/pricing";
import { defineCopy, intlLocale, localeUrl, type Locale } from "@/i18n/config";

/**
 * E-mail via SMTP. Werkt met elke aanbieder (bijv. je eigen hosting, Brevo,
 * Postmark, Amazon SES of Google Workspace). Zonder SMTP-instellingen worden
 * e-mails alleen in de serverlog geschreven, handig tijdens ontwikkelen.
 *
 * E-mails aan klanten zijn er in het Nederlands en het Engels. Geef de taal
 * mee als `locale` in de invoer of als laatste argument (standaard Nederlands).
 * E-mails aan de beheerder zijn altijd Nederlands.
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

/** Productnaam in de taal van de klant; een Nederlandse productnaam wordt vertaald. */
function productName(name: string, l: Locale): string {
  const id = PRODUCT_IDS.find((p) => products[p].name === name);
  return id ? productFor(id, l).name : name;
}

const common = defineCopy({
  nl: {
    hi: (name: string) => `Hoi ${name},`,
    team: (brand: string) => `Team ${brand}`,
    kvk: "KvK",
    questions: "Vragen? Mail naar",
  },
  en: {
    hi: (name: string) => `Hi ${name},`,
    team: (brand: string) => `The ${brand} team`,
    kvk: "Chamber of Commerce no.",
    questions: "Questions? Email us at",
  },
});

function layout(title: string, body: string, l: Locale = "nl"): string {
  const c = common[l];
  return `<!doctype html><html lang="${l}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;background:#f4f3ee;font-family:Arial,Helvetica,sans-serif;color:#10231a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f3ee;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;">
<tr><td style="background:#123f29;padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold;">${escapeHtml(site.name)}</td></tr>
<tr><td style="padding:28px;font-size:16px;line-height:1.6;">${body}</td></tr>
<tr><td style="padding:16px 28px 24px;font-size:12px;line-height:1.5;color:#5b6b62;border-top:1px solid #ecebe4;">
${escapeHtml(site.company.legalName)} · ${escapeHtml(companyAddressLine())} · ${c.kvk} ${escapeHtml(site.company.kvk)}<br>
${c.questions} <a href="mailto:${site.company.email}" style="color:#1c7a45;">${site.company.email}</a>
</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:28px 0;"><a href="${href}" style="background:#1c7a45;color:#ffffff;text-decoration:none;font-weight:bold;padding:14px 24px;border-radius:999px;display:inline-block;">${escapeHtml(label)}</a></p>`;
}

type PlanTypes = ("voeding" | "training")[];

const plansReadyCopy = defineCopy({
  nl: {
    what: (types: PlanTypes): string =>
      types.length === 2 ? "je voedingsschema en trainingsschema" : types[0] === "voeding" ? "je voedingsschema" : "je trainingsschema",
    introNext: (what: string) => `Er staat een nieuwe periode voor je klaar! We hebben ${what} vernieuwd, afgestemd op je voortgang.`,
    introFirst: (what: string, both: boolean) =>
      `Goed nieuws: ${what} ${both ? "staan" : "staat"} voor je klaar. Helemaal afgestemd op jouw doel, voorkeuren en agenda.`,
    subjectNext: (name: string) => `Je nieuwe schema staat klaar, ${name}`,
    subjectFirst: (name: string) => `Je persoonlijke schema staat klaar, ${name}!`,
    button: "Bekijk mijn schema",
    tipsTitle: "Zo haal je er het meeste uit:",
    tips: [
      "Lees eerst de introductie en de kernafspraken.",
      "Doe je boodschappen met de boodschappenlijst (handig: download het schema als PDF).",
      "Weeg jezelf 1x per week, op dezelfde dag en hetzelfde tijdstip, en vul je weegmoment in. Wijkt je voortgang af, dan sturen we je schema meteen bij.",
      "Na 4 weken vul je een korte check-in in. Daarmee maken we je volgende schema, afgestemd op je voortgang. We sturen je een herinnering.",
    ],
    personal: (loginHref: string) =>
      `Deze link is persoonlijk; deel hem niet met anderen. Is de link verlopen? Via ${loginHref} vraag je eenvoudig een nieuwe aan.`,
    goodLuck: "Veel succes! Je kunt dit.",
    textLink: (link: string) => `Bekijk je schema: ${link}`,
    textPersonal: (loginHref: string) => `Deze link is persoonlijk. Nieuwe link nodig? Ga naar ${loginHref}`,
  },
  en: {
    what: (types: PlanTypes) =>
      types.length === 2 ? "your nutrition plan and workout plan" : types[0] === "voeding" ? "your nutrition plan" : "your workout plan",
    introNext: (what: string) => `A new period is ready for you! We've refreshed ${what}, tailored to your progress.`,
    introFirst: (what: string, both: boolean) =>
      `Good news: ${what} ${both ? "are" : "is"} ready for you. Fully tailored to your goal, preferences and schedule.`,
    subjectNext: (name: string) => `Your new plan is ready, ${name}`,
    subjectFirst: (name: string) => `Your personal plan is ready, ${name}!`,
    button: "View my plan",
    tipsTitle: "How to get the most out of it:",
    tips: [
      "Start by reading the introduction and the key principles.",
      "Do your shopping with the shopping list (handy tip: download the plan as a PDF).",
      "Weigh yourself once a week, on the same day and at the same time, and fill in your weekly weigh-in. If your progress is off track, we'll adjust your plan straight away.",
      "After 4 weeks, you'll fill in a short check-in. We use it to create your next plan, tailored to your progress. We'll send you a reminder.",
    ],
    personal: (loginHref: string) =>
      `This link is personal, so please don't share it with anyone. Has the link expired? You can easily request a new one at ${loginHref}.`,
    goodLuck: "Good luck! You've got this.",
    textLink: (link: string) => `View your plan: ${link}`,
    textPersonal: (loginHref: string) => `This link is personal. Need a new link? Go to ${loginHref}`,
  },
});

export function plansReadyEmail(
  input: {
    to: string;
    name: string;
    types: ("voeding" | "training")[];
    link: string;
    seq: number;
    locale?: Locale;
  },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = plansReadyCopy[l];
  const g = common[l];
  const what = c.what(input.types);
  const intro = input.seq > 1 ? c.introNext(what) : c.introFirst(what, input.types.length === 2);
  const subject = input.seq > 1 ? c.subjectNext(input.name) : c.subjectFirst(input.name);
  const loginHref = localeUrl(site.url, l, "/inloggen");
  const html = layout(
    subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
<p>${intro}</p>
${button(input.link, c.button)}
<p><strong>${c.tipsTitle}</strong></p>
<ul style="padding-left:20px;">
${c.tips.map((tip) => `<li>${tip}</li>`).join("\n")}
</ul>
<p>${c.personal(loginHref)}</p>
<p>${c.goodLuck}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
    l,
  );
  const text = `${g.hi(input.name)}\n\n${intro}\n\n${c.textLink(input.link)}\n\n${c.textPersonal(loginHref)}\n\n${g.team(site.name)}`;
  return { to: input.to, subject, html, text };
}

const checkinCopy = defineCopy({
  nl: {
    subject: (reminder: number, name: string) =>
      reminder === 0
        ? `Tijd voor je check-in, ${name}`
        : reminder === 1
          ? "Herinnering: je nieuwe schema wacht op je check-in"
          : "Je nieuwe schema staat nog voor je klaar",
    intro: (reminder: number, due: string, seq: number) =>
      reminder === 0
        ? `Je huidige periode loopt bijna af (${due}). Vul je check-in in: het kost je 2 minuten. Daarna maken we direct je schema voor periode ${seq}, afgestemd op hoe het ging.`
        : `We hebben je check-in nog niet ontvangen. Je schema voor periode ${seq} maken we pas als je hem hebt ingevuld, zodat het echt bij je voortgang past. Het kost je 2 minuten.`,
    button: "Check-in invullen",
    askTitle: "Wat we je vragen:",
    asks: [
      "Je huidige gewicht (weeg je bij voorkeur 's ochtends, voor het ontbijt).",
      "Hoe goed je het schema kon volgen, en hoe je honger, energie en slaap waren.",
      "Wat je lekker vond, wat je anders wilt en of je nieuwe klachten hebt.",
    ],
    after: "Binnen een paar minuten na je check-in staat je nieuwe schema klaar en krijg je een e-mail.",
    textLink: (link: string) => `Check-in invullen: ${link}`,
  },
  en: {
    subject: (reminder: number, name: string) =>
      reminder === 0
        ? `Time for your check-in, ${name}`
        : reminder === 1
          ? "Reminder: your new plan is waiting for your check-in"
          : "Your new plan is still waiting for you",
    intro: (reminder: number, due: string, seq: number) =>
      reminder === 0
        ? `Your current period is almost over (${due}). Fill in your check-in: it only takes 2 minutes. We'll then create your plan for period ${seq} straight away, based on how it went.`
        : `We haven't received your check-in yet. We'll only create your plan for period ${seq} once you've filled it in, so that it truly matches your progress. It only takes 2 minutes.`,
    button: "Fill in your check-in",
    askTitle: "What we'll ask you:",
    asks: [
      "Your current weight (ideally weigh yourself in the morning, before breakfast).",
      "How well you were able to follow the plan, and how your hunger, energy and sleep were.",
      "What you enjoyed, what you'd like to change and whether you have any new aches or injuries.",
    ],
    after: "Within a few minutes of your check-in, your new plan will be ready and we'll send you an email.",
    textLink: (link: string) => `Fill in your check-in: ${link}`,
  },
});

/**
 * Uitnodiging (reminder 0) en herinneringen voor de verplichte check-in. Het
 * volgende schema maken we pas als de check-in is ingevuld.
 */
export function checkinEmail(
  input: {
    to: string;
    name: string;
    link: string;
    /** De periode waarvoor de check-in het schema maakt. */
    seq: number;
    dueAt: Date;
    reminder: number;
    locale?: Locale;
  },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = checkinCopy[l];
  const g = common[l];
  const due = new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(input.dueAt);
  const subject = c.subject(input.reminder, input.name);
  const intro = c.intro(input.reminder, due, input.seq);
  const html = layout(
    subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
<p>${escapeHtml(intro)}</p>
${button(input.link, c.button)}
<p><strong>${c.askTitle}</strong></p>
<ul style="padding-left:20px;">
${c.asks.map((ask) => `<li>${ask}</li>`).join("\n")}
</ul>
<p>${c.after}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
    l,
  );
  const text = `${g.hi(input.name)}\n\n${intro}\n\n${c.textLink(input.link)}\n\n${g.team(site.name)}`;
  return { to: input.to, subject, html, text };
}

const weeklyReminderCopy = defineCopy({
  nl: {
    subject: (week: number, name: string) => `Weegmoment week ${week}: hoe gaat het, ${name}?`,
    intro:
      "Tijd voor je wekelijkse weegmoment. Vul je gewicht en een paar korte vragen in (1 minuut). Wijkt je voortgang af, dan sturen we je schema meteen bij: iets meer of minder eten, of zwaarder of lichter trainen.",
    button: "Weegmoment invullen",
    tip: "Tip: weeg je op een vaste dag, 's ochtends voor het ontbijt. Geen zin in deze herinneringen? Zet ze uit in Mijn schema's, onder Check-in.",
    textLink: (link: string) => `Weegmoment invullen: ${link}`,
  },
  en: {
    subject: (week: number, name: string) => `Weekly weigh-in, week ${week}: how's it going, ${name}?`,
    intro:
      "It's time for your weekly weigh-in. Enter your weight and answer a few short questions (1 minute). If your progress is off track, we'll adjust your plan straight away: eating a little more or less, or training harder or lighter.",
    button: "Fill in your weigh-in",
    tip: "Tip: weigh yourself on a fixed day, in the morning before breakfast. Don't want these reminders? You can turn them off in My plans, under Check-in.",
    textLink: (link: string) => `Fill in your weigh-in: ${link}`,
  },
});

/** Herinnering voor het wekelijkse weegmoment (klant kan dit uitzetten in Mijn schema's). */
export function weeklyReminderEmail(
  input: { to: string; name: string; link: string; week: number; locale?: Locale },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = weeklyReminderCopy[l];
  const g = common[l];
  const subject = c.subject(input.week, input.name);
  const html = layout(
    subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
<p>${escapeHtml(c.intro)}</p>
${button(input.link, c.button)}
<p style="font-size:14px;color:#5b6b62;">${c.tip}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
    l,
  );
  return { to: input.to, subject, html, text: `${g.hi(input.name)}\n\n${c.intro}\n\n${c.textLink(input.link)}\n\n${g.team(site.name)}` };
}

const loginCopy = defineCopy({
  nl: {
    subject: "Je inloglink voor Mijn schema's",
    body: "Met de knop hieronder log je in op je persoonlijke omgeving. Daar vind je al je schema's, kun je je check-in invullen en je abonnement beheren of opzeggen.",
    button: "Inloggen",
    ignore: "Heb je deze e-mail niet aangevraagd? Dan kun je hem negeren.",
    text: (link: string) => `Log in via: ${link}\n\nNiet aangevraagd? Negeer deze e-mail.`,
  },
  en: {
    subject: "Your login link for My plans",
    body: "Use the button below to log in to your personal account. There you'll find all your plans, and you can fill in your check-in and manage or cancel your subscription.",
    button: "Log in",
    ignore: "Didn't request this email? Then you can simply ignore it.",
    text: (link: string) => `Log in here: ${link}\n\nDidn't request this? Just ignore this email.`,
  },
});

export function loginEmail(input: { to: string; name: string; link: string; locale?: Locale }, l: Locale = input.locale ?? "nl"): Mail {
  const c = loginCopy[l];
  const g = common[l];
  const html = layout(
    c.subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
<p>${c.body}</p>
${button(input.link, c.button)}
<p style="font-size:14px;color:#5b6b62;">${c.ignore}</p>`,
    l,
  );
  return {
    to: input.to,
    subject: c.subject,
    html,
    text: `${g.hi(input.name)}\n\n${c.text(input.link)}`,
  };
}

const withdrawalCopy = defineCopy({
  nl: {
    subject: "Ontvangstbevestiging van je herroeping",
    name: "Naam",
    email: "E-mailadres",
    order: "Bestelling",
    message: "Toelichting",
    receivedAt: "Ontvangen op",
    reference: "Kenmerk",
    intro: "We hebben je verklaring van herroeping ontvangen. Hieronder vind je de inhoud en het tijdstip van ontvangst. Bewaar deze e-mail goed.",
    refund: (days: number) =>
      `Voor zover je herroepingsrecht van toepassing is, betalen we het bedrag binnen 14 dagen terug via dezelfde betaalmethode en stoppen we een eventueel abonnement. Als je herroepingsrecht al was vervallen (bijvoorbeeld omdat je schema al was geleverd nadat je daar uitdrukkelijk mee had ingestemd), laten we je dat binnen ${days} werkdagen weten.`,
    text: "We hebben je herroeping ontvangen.",
  },
  en: {
    subject: "Confirmation of receipt of your withdrawal",
    name: "Name",
    email: "Email address",
    order: "Order",
    message: "Notes",
    receivedAt: "Received on",
    reference: "Reference",
    intro: "We have received your notice of withdrawal. Below you'll find its contents and the time we received it. Please keep this email safe.",
    refund: (days: number) =>
      `Insofar as your right of withdrawal applies, we will refund the amount within 14 days using the same payment method and stop any subscription. If your right of withdrawal had already lapsed (for example because your plan had already been delivered after you had expressly agreed to this), we will let you know within ${days} working days.`,
    text: "We have received your withdrawal.",
  },
});

export function withdrawalConfirmationEmail(
  input: {
    to: string;
    name: string;
    orderReference: string;
    message?: string;
    receivedAt: Date;
    id: string;
    locale?: Locale;
  },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = withdrawalCopy[l];
  const g = common[l];
  const when = new Intl.DateTimeFormat(intlLocale(l), {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Amsterdam",
  }).format(input.receivedAt);
  const details = `${c.name}: ${input.name}\n${c.email}: ${input.to}\n${c.order}: ${input.orderReference}\n${input.message ? `${c.message}: ${input.message}\n` : ""}${c.receivedAt}: ${when}\n${c.reference}: ${input.id}`;
  const html = layout(
    c.subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
<p>${c.intro}</p>
<pre style="background:#f4f3ee;border-radius:12px;padding:16px;font-family:inherit;white-space:pre-wrap;">${escapeHtml(details)}</pre>
<p>${c.refund(site.responseTimeDays)}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
    l,
  );
  return { to: input.to, subject: c.subject, html, text: `${g.hi(input.name)}\n\n${c.text}\n\n${details}\n\n${g.team(site.name)}` };
}

/** Melding aan de beheerder (altijd Nederlands). */
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

const cancellationCopy = defineCopy({
  nl: {
    subject: "Bevestiging van je opzegging",
    line: (product: string, end: string | null) =>
      `Je abonnement "${product}" is opgezegd.${end ? ` Het loopt nog tot en met ${end}; daarna wordt er niets meer afgeschreven.` : ""}`,
    access: (accountHref: string) =>
      `Je houdt toegang tot alle schema's die je al hebt ontvangen via <a href="${accountHref}" style="color:#1c7a45;">Mijn schema's</a>. Bedenk je je? Tot de einddatum kun je de opzegging daar met één klik intrekken.`,
    thanks: "Bedankt dat je ons hebt laten meedenken. Veel succes met afblijven!",
  },
  en: {
    subject: "Confirmation of your cancellation",
    line: (product: string, end: string | null) =>
      `Your subscription "${product}" has been cancelled.${end ? ` It will continue until and including ${end}; after that, no further payments will be taken.` : ""}`,
    access: (accountHref: string) =>
      `You'll keep access to all the plans you've already received via <a href="${accountHref}" style="color:#1c7a45;">My plans</a>. Changed your mind? Until the end date, you can undo your cancellation there with one click.`,
    thanks: "Thank you for letting us help you along the way. Good luck keeping the weight off!",
  },
});

export function cancellationEmail(
  input: { to: string; name: string; productName: string; endsAt: Date | null; locale?: Locale },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = cancellationCopy[l];
  const g = common[l];
  const end = input.endsAt
    ? new Intl.DateTimeFormat(intlLocale(l), { dateStyle: "long", timeZone: "Europe/Amsterdam" }).format(input.endsAt)
    : null;
  const line = c.line(productName(input.productName, l), end);
  const html = layout(
    c.subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
<p>${escapeHtml(line)}</p>
<p>${c.access(localeUrl(site.url, l, "/account"))}</p>
<p>${c.thanks}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
    l,
  );
  return { to: input.to, subject: c.subject, html, text: `${g.hi(input.name)}\n\n${line}\n\n${g.team(site.name)}` };
}

const orderCopy = defineCopy({
  nl: {
    subject: (orderNumber: string) => `Orderbevestiging ${orderNumber}`,
    orderNumber: "Bestelnummer",
    product: "Product",
    duration: "Looptijd",
    paid: "Betaald",
    renewal: "Verlenging",
    consent:
      "Je hebt bij je bestelling uitdrukkelijk ingestemd met directe levering van je schema en verklaard dat je weet dat je herroepingsrecht vervalt zodra de levering is begonnen.",
    thanks: "Bedankt voor je bestelling! We maken nu je persoonlijke schema; je ontvangt binnen enkele minuten een aparte e-mail zodra het klaar is.",
    terms: (termsHref: string, cancelHref: string, cancelLabel: string) =>
      `Op je bestelling zijn onze <a href="${termsHref}" style="color:#1c7a45;">algemene voorwaarden</a> van toepassing. Opzeggen kan altijd online via <a href="${cancelHref}" style="color:#1c7a45;">${cancelLabel}</a>. Je factuur ontvang je apart van onze betaalpartner Stripe.`,
    textThanks: "Bedankt voor je bestelling!",
    textTerms: "Algemene voorwaarden",
    textCancel: "Opzeggen",
  },
  en: {
    subject: (orderNumber: string) => `Order confirmation ${orderNumber}`,
    orderNumber: "Order number",
    product: "Product",
    duration: "Term",
    paid: "Paid",
    renewal: "Renewal",
    consent:
      "When placing your order, you expressly agreed to immediate delivery of your plan and confirmed that you understand your right of withdrawal lapses once delivery has begun.",
    thanks: "Thank you for your order! We're now creating your personal plan; you'll receive a separate email within a few minutes as soon as it's ready.",
    terms: (termsHref: string, cancelHref: string, cancelLabel: string) =>
      `Our <a href="${termsHref}" style="color:#1c7a45;">terms and conditions</a> apply to your order. You can cancel online at any time via <a href="${cancelHref}" style="color:#1c7a45;">${cancelLabel}</a>. You'll receive your invoice separately from our payment partner Stripe.`,
    textThanks: "Thank you for your order!",
    textTerms: "Terms and conditions",
    textCancel: "Cancel",
  },
});

export function orderConfirmationEmail(
  input: {
    to: string;
    name: string;
    orderNumber: string;
    productName: string;
    durationLabel: string;
    amountPaid: string;
    renewal: string;
    incassoNote?: string;
    locale?: Locale;
  },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = orderCopy[l];
  const g = common[l];
  const subject = c.subject(input.orderNumber);
  const rows: [string, string][] = [
    [c.orderNumber, input.orderNumber],
    [c.product, productName(input.productName, l)],
    [c.duration, input.durationLabel],
    [c.paid, input.amountPaid],
    [c.renewal, input.renewal],
  ];
  const termsHref = localeUrl(site.url, l, "/algemene-voorwaarden");
  const cancelHref = localeUrl(site.url, l, "/abonnement-opzeggen");
  const html = layout(
    subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
<p>${c.thanks}</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px;">
${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#5b6b62;">${escapeHtml(k)}</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${escapeHtml(v)}</td></tr>`).join("")}
</table>
${input.incassoNote ? `<p style="font-size:14px;color:#5b6b62;">${escapeHtml(input.incassoNote)}</p>` : ""}
<p style="font-size:14px;color:#5b6b62;">${escapeHtml(c.consent)}</p>
<p style="font-size:14px;color:#5b6b62;">${c.terms(termsHref, cancelHref, cancelHref.replace(/^https?:\/\//, ""))}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
    l,
  );
  const text = `${g.hi(input.name)}\n\n${c.textThanks}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${input.incassoNote ? `${input.incassoNote}\n\n` : ""}${c.consent}\n\n${c.textTerms}: ${termsHref}\n${c.textCancel}: ${cancelHref}\n\n${g.team(site.name)}`;
  return { to: input.to, subject, html, text };
}
