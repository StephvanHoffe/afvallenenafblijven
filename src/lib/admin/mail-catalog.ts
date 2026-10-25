import "server-only";
import { site } from "@/config/site";
import type { Locale } from "@/i18n/config";
import {
  cancellationEmail,
  checkinEmail,
  checkoutReminderEmail,
  guaranteeRequestEmail,
  loginEmail,
  orderConfirmationEmail,
  paymentFailedEmail,
  plansReadyEmail,
  subscriptionEndedEmail,
  weeklyReminderEmail,
  withdrawalConfirmationEmail,
  type Mail,
  type MailKind,
} from "@/lib/email";

/**
 * Overzicht van de klantmails voor het beheer: wanneer ze worden verstuurd,
 * welke plaatshouders je in de teksten kunt gebruiken, en een voorbeeld met
 * fictieve gegevens (voor de voorbeeldweergave en de testmail).
 */

export interface MailCatalogEntry {
  kind: MailKind;
  label: string;
  group: string;
  trigger: string;
  placeholders: Record<string, string>;
  sample: (l: Locale) => Mail;
}

const DAY = 24 * 60 * 60 * 1000;
const link = `${site.url}/account`;
const to = "sanne@voorbeeld.nl";
const name = "Sanne";
const monday = () => {
  const d = new Date(Date.now() + 4 * DAY);
  d.setUTCHours(0, 0, 0, 0);
  while (d.getUTCDay() !== 1) d.setTime(d.getTime() + DAY);
  return d;
};

const p = {
  naam: "Voornaam van de klant",
  periode: "Nummer van de periode",
  schemas: "Welke schema's (bijv. \"je voedingsschema en trainingsschema\")",
  startdatum: "Startdag van de periode (bijv. \"maandag 26 oktober\")",
  uiterlijk: "Geadviseerde laatste dag voor de check-in (zaterdag)",
  product: "Naam van het product",
  bestelnummer: "Bestelnummer",
  bedrag: "Betaald bedrag",
};

export const mailCatalog: MailCatalogEntry[] = [
  {
    kind: "order",
    label: "Orderbevestiging",
    group: "Bestelling",
    trigger: "Direct na de betaling.",
    placeholders: { naam: p.naam, bestelnummer: p.bestelnummer, product: p.product, bedrag: p.bedrag },
    sample: (l) =>
      orderConfirmationEmail({
        to,
        name,
        orderNumber: "8F3A21C0",
        productName: "Bundel: Voeding + Training",
        durationLabel: l === "en" ? "Minimum 3 months" : "Minimaal 3 maanden",
        amountPaid: "€ 17,95",
        renewal: l === "en" ? "€ 17.95 a month by SEPA Direct Debit" : "€ 17,95 per maand via SEPA-incasso",
        locale: l,
      }),
  },
  {
    kind: "plans-first",
    label: "Eerste schema staat klaar",
    group: "Schema's",
    trigger: "Als het eerste schema voor de klant klaarstaat (binnen 2 uur na de betaling).",
    placeholders: { naam: p.naam, schemas: p.schemas, periode: p.periode },
    sample: (l) => plansReadyEmail({ to, name, types: ["voeding", "training"], link, seq: 1, locale: l }),
  },
  {
    kind: "plans-upcoming",
    label: "Nieuw schema staat klaar (start maandag)",
    group: "Schema's",
    trigger: "Na een check-in op tijd: het nieuwe schema staat klaar en start op maandag.",
    placeholders: { naam: p.naam, schemas: p.schemas, startdatum: p.startdatum, periode: p.periode },
    sample: (l) => plansReadyEmail({ to, name, types: ["voeding", "training"], link, seq: 2, startsAt: monday(), locale: l }),
  },
  {
    kind: "plans-next",
    label: "Nieuw schema staat klaar (direct)",
    group: "Schema's",
    trigger: "Na een te late check-in: het nieuwe schema start meteen.",
    placeholders: { naam: p.naam, schemas: p.schemas, periode: p.periode },
    sample: (l) => plansReadyEmail({ to, name, types: ["voeding", "training"], link, seq: 2, locale: l }),
  },
  {
    kind: "checkin-0",
    label: "Check-in: uitnodiging",
    group: "Check-in en weegmoment",
    trigger: "Donderdag voor de nieuwe periode, als de check-in opent.",
    placeholders: { naam: p.naam, startdatum: p.startdatum, uiterlijk: p.uiterlijk, periode: p.periode },
    sample: (l) => checkinEmail({ to, name, link, seq: 2, dueAt: monday(), advisedBy: new Date(monday().getTime() - 2 * DAY), reminder: 0, locale: l }),
  },
  {
    kind: "checkin-1",
    label: "Check-in: herinnering zaterdag",
    group: "Check-in en weegmoment",
    trigger: "Zaterdag, als de check-in nog niet is ingevuld.",
    placeholders: { naam: p.naam, startdatum: p.startdatum, uiterlijk: p.uiterlijk, periode: p.periode },
    sample: (l) => checkinEmail({ to, name, link, seq: 2, dueAt: monday(), advisedBy: new Date(monday().getTime() - 2 * DAY), reminder: 1, locale: l }),
  },
  {
    kind: "checkin-2",
    label: "Check-in: nieuwe periode begonnen",
    group: "Check-in en weegmoment",
    trigger: "Maandag, als de nieuwe periode is begonnen zonder check-in.",
    placeholders: { naam: p.naam, startdatum: p.startdatum, uiterlijk: p.uiterlijk, periode: p.periode },
    sample: (l) => checkinEmail({ to, name, link, seq: 2, dueAt: monday(), advisedBy: new Date(monday().getTime() - 2 * DAY), reminder: 2, locale: l }),
  },
  {
    kind: "checkin-3",
    label: "Check-in: laatste herinnering",
    group: "Check-in en weegmoment",
    trigger: "Een week na de start van de periode, als de check-in nog steeds niet is ingevuld.",
    placeholders: { naam: p.naam, startdatum: p.startdatum, uiterlijk: p.uiterlijk, periode: p.periode },
    sample: (l) => checkinEmail({ to, name, link, seq: 2, dueAt: monday(), advisedBy: new Date(monday().getTime() - 2 * DAY), reminder: 3, locale: l }),
  },
  {
    kind: "weekly",
    label: "Weegmoment: herinnering",
    group: "Check-in en weegmoment",
    trigger: "Op zaterdag in week 2 t/m 4, als het weegmoment openstaat (de klant kan dit uitzetten).",
    placeholders: { naam: p.naam, week: "Weeknummer binnen de periode" },
    sample: (l) => weeklyReminderEmail({ to, name, link, week: 2, locale: l }),
  },
  {
    kind: "login",
    label: "Inloglink",
    group: "Account",
    trigger: "Als de klant een inloglink aanvraagt, of als jij er een stuurt vanuit het beheer.",
    placeholders: { naam: p.naam },
    sample: (l) => loginEmail({ to, name, link, locale: l }),
  },
  {
    kind: "checkout-reminder",
    label: "Herinnering: betaling niet afgerond",
    group: "Marketing",
    trigger:
      "Enkele uren na een niet-afgeronde betaling, alleen als de klant toestemming gaf voor e-mail en de herinnering aanstaat (Instellingen). Eén keer per bestelling.",
    placeholders: { naam: p.naam, product: p.product },
    sample: (l) => checkoutReminderEmail({ to, name, link: `${site.url}/start?hervat=voorbeeld`, productName: "Bundel: Voeding + Training", locale: l }),
  },
  {
    kind: "cancellation",
    label: "Bevestiging van opzegging",
    group: "Opzeggen, garantie en herroeping",
    trigger: "Als de klant (of jij namens de klant) het abonnement opzegt.",
    placeholders: { naam: p.naam, product: p.product, einddatum: "Laatste dag van het abonnement" },
    sample: (l) =>
      cancellationEmail({ to, name, productName: "Bundel: Voeding + Training", endsAt: new Date(Date.now() + 40 * DAY), locale: l }),
  },
  {
    kind: "payment-failed",
    label: "Maandelijkse betaling mislukt",
    group: "Opzeggen, garantie en herroeping",
    trigger: "Als een maandelijkse afschrijving niet lukt. Mollie probeert het daarna zelf tot 5 keer opnieuw; de klant krijgt één mail.",
    placeholders: { naam: p.naam, product: p.product, bedrag: "Het bedrag van de mislukte afschrijving" },
    sample: (l) => paymentFailedEmail({ to, name, productName: "Bundel: Voeding + Training", amountCents: 1395, locale: l }),
  },
  {
    kind: "subscription-ended",
    label: "Abonnement gestopt na mislukte betalingen",
    group: "Opzeggen, garantie en herroeping",
    trigger: "Als Mollie een abonnement stopt, meestal na herhaald mislukte incasso's of een ingetrokken machtiging. Jij krijgt dan ook een melding.",
    placeholders: { naam: p.naam, product: p.product },
    sample: (l) => subscriptionEndedEmail({ to, name, productName: "Bundel: Voeding + Training", locale: l }),
  },
  {
    kind: "guarantee",
    label: "Garantie-aanvraag ontvangen",
    group: "Opzeggen, garantie en herroeping",
    trigger: "Als de klant de tevredenheidsgarantie aanvraagt in Mijn schema's. De zin over de terugbetaling staat vast.",
    placeholders: { naam: p.naam, bestelnummer: p.bestelnummer, product: p.product, bedrag: p.bedrag },
    sample: (l) =>
      guaranteeRequestEmail({ to, name, reference: "8F3A21C0", productName: "Bundel: Voeding + Training", amountCents: 1795, subscription: true, locale: l }),
  },
  {
    kind: "withdrawal",
    label: "Ontvangstbevestiging herroeping",
    group: "Opzeggen, garantie en herroeping",
    trigger: "Direct na een herroeping via de website. De inhoud en het tijdstip van ontvangst staan er wettelijk verplicht in en zijn niet aanpasbaar.",
    placeholders: { naam: p.naam, bestelling: "Bestelling zoals de klant die opgaf" },
    sample: (l) =>
      withdrawalConfirmationEmail({ to, name, orderReference: "8F3A21C0", receivedAt: new Date(), id: "voorbeeld", locale: l }),
  },
];

export function catalogEntry(kind: string): MailCatalogEntry | null {
  return mailCatalog.find((e) => e.kind === kind) ?? null;
}
