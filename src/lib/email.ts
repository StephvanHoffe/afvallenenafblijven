import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { site, companyAddressLine } from "@/config/site";
import { PRODUCT_IDS, productFor, products } from "@/config/pricing";
import { defineCopy, intlLocale, localeUrl, type Locale } from "@/i18n/config";
import { euro } from "@/lib/format";
import { nextPeriodStart } from "@/lib/schedule";
import { logMail, mailTextOverride } from "@/lib/email-store";

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

/**
 * Klantmails waarvan je onderwerp, hoofdtekst en knop in het beheer kunt
 * aanpassen (per taal). Teksten mogen plaatshouders bevatten, zoals {naam}.
 */
export const MAIL_KINDS = [
  "order",
  "plans-first",
  "plans-next",
  "plans-upcoming",
  "checkin-0",
  "checkin-1",
  "checkin-2",
  "checkin-3",
  "weekly",
  "login",
  "checkout-reminder",
  "cancellation",
  "guarantee",
  "withdrawal",
] as const;
export type MailKind = (typeof MAIL_KINDS)[number];

/** De aanpasbare delen van een mail. Een lege knop betekent: deze mail heeft geen knop. */
export interface MailTexts {
  subject: string;
  intro: string;
  button: string;
}

export interface Mail {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  /** Soort mail (voor het log en aangepaste teksten); "admin" = melding aan de beheerder. */
  kind?: MailKind | "admin";
  locale?: Locale;
  /** Standaardteksten met {plaatshouders}, en de waarden voor deze mail. */
  defaults?: MailTexts;
  vars?: Record<string, string>;
  /** Bouwt dezelfde mail opnieuw met (aangepaste) teksten. */
  render?: (texts: Partial<MailTexts>) => Mail;
}

export async function sendMail(mail: Mail): Promise<boolean> {
  let final = mail;
  // Teksten die in het beheer zijn aangepast, gaan voor op de standaardteksten.
  if (mail.render && mail.kind && mail.kind !== "admin" && mail.locale) {
    const override = await mailTextOverride(mail.kind, mail.locale).catch(() => null);
    if (override) final = { ...mail.render(override), to: mail.to, replyTo: mail.replyTo };
  }
  if (!isEmailConfigured()) {
    console.info(`[e-mail niet verstuurd: SMTP niet ingesteld] Aan: ${final.to} | ${final.subject}\n${final.text}`);
    await logMail(final, "skipped");
    return false;
  }
  try {
    await transport().sendMail({ from: FROM(), to: final.to, subject: final.subject, html: final.html, text: final.text, replyTo: final.replyTo });
  } catch (err) {
    await logMail(final, "failed", err instanceof Error ? err.message : String(err));
    throw err;
  }
  await logMail(final, "sent");
  return true;
}

/** Vult {plaatshouders} in; onbekende plaatshouders blijven staan. */
export function fillPlaceholders(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k] : m));
}

/** Platte tekst naar alinea's (een lege regel = nieuwe alinea). */
function paragraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/** Een aanpasbare mail: bouwt de mail met de standaardteksten, en opnieuw met aangepaste teksten. */
function editableMail(
  kind: MailKind,
  l: Locale,
  to: string,
  defaults: MailTexts,
  vars: Record<string, string>,
  build: (t: MailTexts) => { subject: string; html: string; text: string },
): Mail {
  const render = (o: Partial<MailTexts> = {}): Mail => {
    const t: MailTexts = {
      subject: fillPlaceholders(o.subject?.trim() || defaults.subject, vars),
      intro: fillPlaceholders(o.intro?.trim() || defaults.intro, vars),
      button: fillPlaceholders(o.button?.trim() || defaults.button, vars),
    };
    return { to, kind, locale: l, defaults, vars, render, ...build(t) };
  };
  return render();
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

/** "maandag 16 november" in de taal van de klant. */
function weekdayDate(date: Date, l: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(l), { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Amsterdam" }).format(date);
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
    introUpcoming: (what: string, start: string, shopping: boolean) =>
      `Je nieuwe schema staat klaar! We hebben ${what} vernieuwd, afgestemd op je check-in. Het start op ${start}; tot die tijd volg je gewoon je huidige schema.${shopping ? " Zo kun je alvast je boodschappen doen met de nieuwe boodschappenlijst." : ""}`,
    subjectUpcoming: (name: string, start: string) => `Je schema voor ${start} staat klaar, ${name}`,
    introFirst: (what: string, both: boolean) =>
      `Goed nieuws: ${what} ${both ? "staan" : "staat"} voor je klaar. Helemaal afgestemd op jouw doel, voorkeuren en agenda.`,
    subjectNext: (name: string) => `Je nieuwe schema staat klaar, ${name}`,
    subjectFirst: (name: string) => `Je persoonlijke schema staat klaar, ${name}!`,
    button: "Bekijk mijn schema",
    tipsTitle: "Zo haal je er het meeste uit:",
    tips: (next: string | null) => [
      "Lees eerst de introductie en de kernafspraken.",
      "Doe je boodschappen met de boodschappenlijst (handig: download het schema als PDF).",
      "Weeg jezelf 1x per week, bij voorkeur op zaterdag of zondag 's ochtends, en vul je weegmoment in. Wijkt je voortgang af, dan sturen we je schema meteen bij, op tijd voor je boodschappen.",
      `${next ? `Je volgende periode start op ${next}.` : "Elke periode start op maandag."} Vanaf de donderdag ervoor vul je een korte check-in in. Doe je dat uiterlijk zaterdag, dan staat je nieuwe schema met boodschappenlijst op tijd klaar. We sturen je een herinnering.`,
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
    introUpcoming: (what: string, start: string, shopping: boolean) =>
      `Your new plan is ready! We've refreshed ${what}, based on your check-in. It starts on ${start}; until then, simply keep following your current plan.${shopping ? " That way, you can already do your shopping with the new shopping list." : ""}`,
    subjectUpcoming: (name: string, start: string) => `Your plan for ${start} is ready, ${name}`,
    introFirst: (what: string, both: boolean) =>
      `Good news: ${what} ${both ? "are" : "is"} ready for you. Fully tailored to your goal, preferences and schedule.`,
    subjectNext: (name: string) => `Your new plan is ready, ${name}`,
    subjectFirst: (name: string) => `Your personal plan is ready, ${name}!`,
    button: "View my plan",
    tipsTitle: "How to get the most out of it:",
    tips: (next: string | null) => [
      "Start by reading the introduction and the key principles.",
      "Do your shopping with the shopping list (handy tip: download the plan as a PDF).",
      "Weigh yourself once a week, ideally on Saturday or Sunday morning, and fill in your weekly weigh-in. If your progress is off track, we'll adjust your plan straight away, in time for your shopping.",
      `${next ? `Your next period starts on ${next}.` : "Every period starts on a Monday."} From the Thursday before, you can fill in a short check-in. Do it by Saturday, and your new plan with shopping list will be ready in time. We'll send you a reminder.`,
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
    /** Begin van de periode; ligt het in de toekomst, dan noemen we de startdatum. */
    startsAt?: Date;
    locale?: Locale;
  },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = plansReadyCopy[l];
  const g = common[l];
  const start = input.startsAt ?? new Date();
  const upcoming = input.seq > 1 && start.getTime() > Date.now() + 60 * 60 * 1000;
  const kind: MailKind = upcoming ? "plans-upcoming" : input.seq > 1 ? "plans-next" : "plans-first";
  const defaults: MailTexts = {
    intro: upcoming
      ? c.introUpcoming("{schemas}", "{startdatum}", input.types.includes("voeding"))
      : input.seq > 1
        ? c.introNext("{schemas}")
        : c.introFirst("{schemas}", input.types.length === 2),
    subject: upcoming ? c.subjectUpcoming("{naam}", "{startdatum}") : input.seq > 1 ? c.subjectNext("{naam}") : c.subjectFirst("{naam}"),
    button: c.button,
  };
  const vars = { naam: input.name, schemas: c.what(input.types), startdatum: weekdayDate(start, l), periode: String(input.seq) };
  const tips = c.tips(weekdayDate(nextPeriodStart(start), l));
  const loginHref = localeUrl(site.url, l, "/inloggen");
  return editableMail(kind, l, input.to, defaults, vars, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
${button(input.link, t.button)}
<p><strong>${c.tipsTitle}</strong></p>
<ul style="padding-left:20px;">
${tips.map((tip) => `<li>${tip}</li>`).join("\n")}
</ul>
<p>${c.personal(loginHref)}</p>
<p>${c.goodLuck}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${c.textLink(input.link)}\n\n${c.textPersonal(loginHref)}\n\n${g.team(site.name)}`,
  }));
}

const checkinCopy = defineCopy({
  nl: {
    subject: (reminder: number, name: string) =>
      reminder === 0
        ? `Tijd voor je check-in, ${name}`
        : reminder === 1
          ? "Vandaag je check-in, dan ben je klaar voor maandag"
          : reminder === 2
            ? "Je nieuwe periode is begonnen: vul je check-in in"
            : "Je nieuwe schema staat nog voor je klaar",
    intro: (reminder: number, start: string, advised: string, seq: number | string) =>
      reminder === 0
        ? `Je nieuwe periode start op ${start}. Vul je check-in in (2 minuten), het liefst uiterlijk ${advised}: dan staat je schema voor periode ${seq} met boodschappenlijst op tijd klaar voor je boodschappen in het weekend. We maken het bewust pas na je check-in, zodat het past bij hoe het nu gaat.`
        : reminder === 1
          ? `Je nieuwe periode start op ${start}. Vul vandaag je check-in in, dan staat je nieuwe schema binnen 2 uur klaar en kun je dit weekend je boodschappen doen.`
          : reminder === 2
            ? `Je nieuwe periode is begonnen, maar we hebben je check-in nog niet ontvangen. Vul hem in, dan staat je schema voor periode ${seq} binnen 2 uur klaar. Tot die tijd volg je gewoon je huidige schema.`
            : `We hebben je check-in nog niet ontvangen. Je schema voor periode ${seq} maken we pas als je hem hebt ingevuld, zodat het echt bij je voortgang past. Het kost je 2 minuten.`,
    button: "Check-in invullen",
    askTitle: "Wat we je vragen:",
    asks: [
      "Je huidige gewicht (weeg je bij voorkeur 's ochtends, voor het ontbijt).",
      "Hoe goed je het schema kon volgen, en hoe je honger, energie en slaap waren.",
      "Wat je lekker vond, wat je anders wilt en of je nieuwe klachten hebt.",
    ],
    after: "Binnen 2 uur na je check-in staat je nieuwe schema klaar en krijg je een e-mail. Het start op de maandag van je nieuwe periode; tot die tijd volg je je huidige schema.",
    textLink: (link: string) => `Check-in invullen: ${link}`,
  },
  en: {
    subject: (reminder: number, name: string) =>
      reminder === 0
        ? `Time for your check-in, ${name}`
        : reminder === 1
          ? "Do your check-in today and you're ready for Monday"
          : reminder === 2
            ? "Your new period has started: fill in your check-in"
            : "Your new plan is still waiting for you",
    intro: (reminder: number, start: string, advised: string, seq: number | string) =>
      reminder === 0
        ? `Your new period starts on ${start}. Fill in your check-in (2 minutes), ideally by ${advised}: then your plan for period ${seq} with shopping list will be ready in time for your weekend shopping. We deliberately only create it after your check-in, so it matches how things are going now.`
        : reminder === 1
          ? `Your new period starts on ${start}. Fill in your check-in today, and your new plan will be ready within 2 hours, so you can do your shopping this weekend.`
          : reminder === 2
            ? `Your new period has started, but we haven't received your check-in yet. Fill it in and your plan for period ${seq} will be ready within 2 hours. Until then, simply keep following your current plan.`
            : `We haven't received your check-in yet. We'll only create your plan for period ${seq} once you've filled it in, so that it truly matches your progress. It only takes 2 minutes.`,
    button: "Fill in your check-in",
    askTitle: "What we'll ask you:",
    asks: [
      "Your current weight (ideally weigh yourself in the morning, before breakfast).",
      "How well you were able to follow the plan, and how your hunger, energy and sleep were.",
      "What you enjoyed, what you'd like to change and whether you have any new aches or injuries.",
    ],
    after: "Within 2 hours of your check-in, your new plan will be ready and we'll send you an email. It starts on the Monday of your new period; until then, keep following your current plan.",
    textLink: (link: string) => `Fill in your check-in: ${link}`,
  },
});

/**
 * Uitnodiging en herinneringen voor de verplichte check-in. `reminder`: 0 =
 * uitnodiging (donderdag), 1 = vandaag invullen (zaterdag), 2 = de nieuwe
 * periode is begonnen (maandag), 3 = laatste herinnering. Het volgende schema
 * maken we pas als de check-in is ingevuld.
 */
export function checkinEmail(
  input: {
    to: string;
    name: string;
    link: string;
    /** De periode waarvoor de check-in het schema maakt. */
    seq: number;
    /** Start van de nieuwe periode (maandag). */
    dueAt: Date;
    /** Uiterlijk deze dag invullen, voor de boodschappen in het weekend. */
    advisedBy: Date;
    reminder: number;
    locale?: Locale;
  },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = checkinCopy[l];
  const g = common[l];
  const stage = Math.min(3, Math.max(0, input.reminder));
  const defaults: MailTexts = {
    subject: c.subject(stage, "{naam}"),
    intro: c.intro(stage, "{startdatum}", "{uiterlijk}", "{periode}"),
    button: c.button,
  };
  const vars = { naam: input.name, startdatum: weekdayDate(input.dueAt, l), uiterlijk: weekdayDate(input.advisedBy, l), periode: String(input.seq) };
  return editableMail(`checkin-${stage}` as MailKind, l, input.to, defaults, vars, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
${button(input.link, t.button)}
<p><strong>${c.askTitle}</strong></p>
<ul style="padding-left:20px;">
${c.asks.map((ask) => `<li>${ask}</li>`).join("\n")}
</ul>
<p>${c.after}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${c.textLink(input.link)}\n\n${g.team(site.name)}`,
  }));
}

const weeklyReminderCopy = defineCopy({
  nl: {
    subject: (week: number | string, name: string) => `Weegmoment week ${week}: hoe gaat het, ${name}?`,
    intro:
      "Tijd voor je wekelijkse weegmoment. Vul je gewicht en een paar korte vragen in (1 minuut). Wijkt je voortgang af, dan sturen we je schema meteen bij: iets meer of minder eten, of zwaarder of lichter trainen.",
    button: "Weegmoment invullen",
    tip: "Tip: weeg je in het weekend, 's ochtends voor het ontbijt. Dan kun je een eventuele aanpassing meenemen in je boodschappen voor de week erna. Geen zin in deze herinneringen? Zet ze uit in Mijn schema's, onder Check-in.",
    textLink: (link: string) => `Weegmoment invullen: ${link}`,
  },
  en: {
    subject: (week: number | string, name: string) => `Weekly weigh-in, week ${week}: how's it going, ${name}?`,
    intro:
      "It's time for your weekly weigh-in. Enter your weight and answer a few short questions (1 minute). If your progress is off track, we'll adjust your plan straight away: eating a little more or less, or training harder or lighter.",
    button: "Fill in your weigh-in",
    tip: "Tip: weigh yourself at the weekend, in the morning before breakfast. That way you can take any adjustment into account in your shopping for the week ahead. Don't want these reminders? You can turn them off in My plans, under Check-in.",
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
  const defaults: MailTexts = { subject: c.subject("{week}", "{naam}"), intro: c.intro, button: c.button };
  return editableMail("weekly", l, input.to, defaults, { naam: input.name, week: String(input.week) }, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
${button(input.link, t.button)}
<p style="font-size:14px;color:#5b6b62;">${c.tip}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${c.textLink(input.link)}\n\n${g.team(site.name)}`,
  }));
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
  const defaults: MailTexts = { subject: c.subject, intro: c.body, button: c.button };
  return editableMail("login", l, input.to, defaults, { naam: input.name }, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
${button(input.link, t.button)}
<p style="font-size:14px;color:#5b6b62;">${c.ignore}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${c.text(input.link)}`,
  }));
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
  // De inhoud en het tijdstip van ontvangst zijn wettelijk verplicht en dus niet aanpasbaar; de begeleidende tekst wel.
  const defaults: MailTexts = { subject: c.subject, intro: c.intro, button: "" };
  return editableMail("withdrawal", l, input.to, defaults, { naam: input.name, bestelling: input.orderReference }, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
<pre style="background:#f4f3ee;border-radius:12px;padding:16px;font-family:inherit;white-space:pre-wrap;">${escapeHtml(details)}</pre>
<p>${c.refund(site.responseTimeDays)}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${details}\n\n${g.team(site.name)}`,
  }));
}

const guaranteeCopy = defineCopy({
  nl: {
    subject: "We hebben je garantie-aanvraag ontvangen",
    intro: (ref: string, product: string) =>
      `We hebben je aanvraag onder onze tevredenheidsgarantie ontvangen, voor bestelling ${ref} (${product}).`,
    refund: (amount: string, days: number, subscription: boolean) =>
      `We betalen je ${subscription ? "eerste betaling" : "betaling"} van ${amount} binnen ${days} werkdagen volledig terug via dezelfde betaalmethode${subscription ? " en beëindigen je abonnement direct; er wordt daarna niets meer afgeschreven" : ""}. Je krijgt bericht zodra de terugbetaling is gedaan.`,
    access: (accountHref: string) =>
      `De schema's die je al hebt ontvangen, mag je houden. Je vindt ze nog in <a href="${accountHref}" style="color:#1c7a45;">Mijn schema's</a>.`,
    sorry: "Jammer dat het niet bij je paste. Bedankt dat je het hebt geprobeerd, en heel veel succes!",
    text: "We hebben je garantie-aanvraag ontvangen.",
  },
  en: {
    subject: "We've received your guarantee request",
    intro: (ref: string, product: string) => `We've received your request under our satisfaction guarantee, for order ${ref} (${product}).`,
    refund: (amount: string, days: number, subscription: boolean) =>
      `We'll refund your ${subscription ? "first payment" : "payment"} of ${amount} in full within ${days} working days, using the same payment method${subscription ? ", and end your subscription straight away; nothing further will be charged" : ""}. We'll let you know as soon as the refund has been made.`,
    access: (accountHref: string) =>
      `You're welcome to keep the plans you've already received. You can still find them in <a href="${accountHref}" style="color:#1c7a45;">My plans</a>.`,
    sorry: "We're sorry it wasn't the right fit for you. Thank you for giving it a try, and the very best of luck!",
    text: "We've received your guarantee request.",
  },
});

export function guaranteeRequestEmail(
  input: { to: string; name: string; reference: string; productName: string; amountCents: number; subscription: boolean; locale?: Locale },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = guaranteeCopy[l];
  const g = common[l];
  const refund = c.refund(euro(input.amountCents, l), site.responseTimeDays, input.subscription);
  const defaults: MailTexts = { subject: c.subject, intro: c.intro("{bestelnummer}", "{product}"), button: "" };
  const vars = { naam: input.name, bestelnummer: input.reference, product: productName(input.productName, l), bedrag: euro(input.amountCents, l) };
  return editableMail("guarantee", l, input.to, defaults, vars, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
<p>${escapeHtml(refund)}</p>
<p>${c.access(localeUrl(site.url, l, "/account"))}</p>
<p>${c.sorry}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${refund}\n\n${g.team(site.name)}`,
  }));
}

/** Melding aan de beheerder (altijd Nederlands). */
export function adminNotificationEmail(subject: string, lines: Record<string, string | undefined>, replyTo?: string): Mail {
  const entries = Object.entries(lines).filter(([, v]) => v);
  return {
    to: adminEmail(),
    subject: `[${site.shortName}] ${subject}`,
    kind: "admin",
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
  const defaults: MailTexts = { subject: c.subject, intro: c.line("{product}", end ? "{einddatum}" : null), button: "" };
  const vars = { naam: input.name, product: productName(input.productName, l), einddatum: end ?? "" };
  return editableMail("cancellation", l, input.to, defaults, vars, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
<p>${c.access(localeUrl(site.url, l, "/account"))}</p>
<p>${c.thanks}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${g.team(site.name)}`,
  }));
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
    thanks: "Bedankt voor je bestelling! We gaan aan de slag met je persoonlijke schema. Binnen 2 uur staat het klaar; je ontvangt dan een aparte e-mail met een persoonlijke link.",
    terms: (termsHref: string, cancelHref: string, cancelLabel: string) =>
      `Op je bestelling zijn onze <a href="${termsHref}" style="color:#1c7a45;">algemene voorwaarden</a> van toepassing. Opzeggen kan altijd online via <a href="${cancelHref}" style="color:#1c7a45;">${cancelLabel}</a>. Je factuur ontvang je apart van onze betaalpartner Stripe.`,
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
    thanks: "Thank you for your order! We're getting to work on your personal plan. It will be ready within 2 hours, and we'll send you a separate email with a personal link.",
    terms: (termsHref: string, cancelHref: string, cancelLabel: string) =>
      `Our <a href="${termsHref}" style="color:#1c7a45;">terms and conditions</a> apply to your order. You can cancel online at any time via <a href="${cancelHref}" style="color:#1c7a45;">${cancelLabel}</a>. You'll receive your invoice separately from our payment partner Stripe.`,
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
  const rows: [string, string][] = [
    [c.orderNumber, input.orderNumber],
    [c.product, productName(input.productName, l)],
    [c.duration, input.durationLabel],
    [c.paid, input.amountPaid],
    [c.renewal, input.renewal],
  ];
  const termsHref = localeUrl(site.url, l, "/algemene-voorwaarden");
  const cancelHref = localeUrl(site.url, l, "/abonnement-opzeggen");
  const defaults: MailTexts = { subject: c.subject("{bestelnummer}"), intro: c.thanks, button: "" };
  const vars = { naam: input.name, bestelnummer: input.orderNumber, product: productName(input.productName, l), bedrag: input.amountPaid };
  return editableMail("order", l, input.to, defaults, vars, (t) => ({
    subject: t.subject,
    html: layout(
    t.subject,
    `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;font-size:15px;">
${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#5b6b62;">${escapeHtml(k)}</td><td style="padding:6px 0;text-align:right;font-weight:bold;">${escapeHtml(v)}</td></tr>`).join("")}
</table>
${input.incassoNote ? `<p style="font-size:14px;color:#5b6b62;">${escapeHtml(input.incassoNote)}</p>` : ""}
<p style="font-size:14px;color:#5b6b62;">${escapeHtml(c.consent)}</p>
<p style="font-size:14px;color:#5b6b62;">${c.terms(termsHref, cancelHref, cancelHref.replace(/^https?:\/\//, ""))}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
    l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\n${input.incassoNote ? `${input.incassoNote}\n\n` : ""}${c.consent}\n\n${c.textTerms}: ${termsHref}\n${c.textCancel}: ${cancelHref}\n\n${g.team(site.name)}`,
  }));
}

const checkoutReminderCopy = defineCopy({
  nl: {
    subject: (name: string) => `Je persoonlijke plan staat nog voor je klaar, ${name}`,
    intro:
      "Je was bijna klaar met je bestelling, maar de betaling is niet afgerond. Geen probleem: je antwoorden hebben we bewaard. Met de knop hieronder ga je verder waar je gebleven was en kies je je plan.",
    button: "Verder waar ik was",
    note: "Deze link werkt 7 dagen. Je krijgt deze herinnering maar één keer.",
    unsubscribe: "Je ontvangt deze e-mail omdat je hebt aangegeven tips en aanbiedingen van ons te willen ontvangen.",
    textLink: (link: string) => `Verder waar je was: ${link}`,
  },
  en: {
    subject: (name: string) => `Your personal plan is still waiting for you, ${name}`,
    intro:
      "You were almost done with your order, but the payment wasn't completed. No problem: we've saved your answers. Use the button below to pick up where you left off and choose your plan.",
    button: "Pick up where I left off",
    note: "This link works for 7 days. You'll only receive this reminder once.",
    unsubscribe: "You're receiving this email because you said you'd like to receive tips and offers from us.",
    textLink: (link: string) => `Pick up where you left off: ${link}`,
  },
});

/** Herinnering bij een begonnen maar niet afgeronde betaling (alleen met toestemming voor e-mail). */
export function checkoutReminderEmail(
  input: { to: string; name: string; link: string; productName: string; locale?: Locale },
  l: Locale = input.locale ?? "nl",
): Mail {
  const c = checkoutReminderCopy[l];
  const g = common[l];
  const defaults: MailTexts = { subject: c.subject("{naam}"), intro: c.intro, button: c.button };
  return editableMail("checkout-reminder", l, input.to, defaults, { naam: input.name, product: productName(input.productName, l) }, (t) => ({
    subject: t.subject,
    html: layout(
      t.subject,
      `<p>${g.hi(escapeHtml(input.name))}</p>
${paragraphs(t.intro)}
${button(input.link, t.button)}
<p style="font-size:14px;color:#5b6b62;">${c.note} ${c.unsubscribe}</p>
<p>${g.team(escapeHtml(site.name))}</p>`,
      l,
    ),
    text: `${g.hi(input.name)}\n\n${t.intro}\n\n${c.textLink(input.link)}\n\n${c.note}\n\n${g.team(site.name)}`,
  }));
}
