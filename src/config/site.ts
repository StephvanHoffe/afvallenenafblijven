import { intlLocale, type Locale } from "@/i18n/config";

/**
 * Centrale bedrijfs- en site-instellingen.
 *
 * LET OP: vul vóór livegang de echte bedrijfsgegevens in. Deze gegevens worden
 * gebruikt in de footer, de juridische pagina's en e-mails. Een webwinkel is
 * wettelijk verplicht om naam, adres, KvK-nummer, btw-nummer en een
 * e-mailadres te tonen.
 */
export const site = {
  name: "Afvallen & Afblijven",
  shortName: "Afvallen & Afblijven",
  domain: "afvallenenafblijven.nl",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://afvallenenafblijven.nl",
  tagline: "Persoonlijke voedings- en trainingsschema's die écht bij jou passen",
  description:
    "Persoonlijke voedingsschema's en trainingsschema's, afgestemd op jouw doel, lichaam en agenda. Binnen enkele minuten in je mailbox. Maandelijks opzegbaar.",

  company: {
    legalName: "[Bedrijfsnaam / handelsnaam]",
    address: "[Straat en huisnummer]",
    postalCode: "[Postcode]",
    city: "[Plaats]",
    country: "Nederland",
    kvk: "[KvK-nummer]",
    vat: "[Btw-identificatienummer]",
    email: "info@afvallenenafblijven.nl",
    privacyEmail: "privacy@afvallenenafblijven.nl",
    phone: "",
  },

  /** Datum van de laatste wijziging van de juridische teksten. */
  legalUpdated: "20 oktober 2026",

  /** Hoe snel reageren we op e-mail (gebruikt in contact- en klachtenteksten). */
  responseTimeDays: 2,

  /**
   * Tevredenheidsgarantie op de eerste betaling. Dit is een vrijwillige,
   * juridisch bindende belofte: zet `enabled` op false als je dit niet wilt
   * aanbieden. De algemene voorwaarden passen zich automatisch aan.
   */
  guarantee: {
    enabled: true,
    days: 30,
  },

  /**
   * Lanceringsactie: automatische korting op de eerste betaling.
   * Wordt alleen getoond én toegepast tussen startsAt en endsAt.
   */
  launchOffer: {
    enabled: true,
    couponId: "LANCERING2027",
    percentOff: 20,
    startsAt: "2026-12-01T00:00:00+01:00",
    endsAt: "2027-01-31T23:59:59+01:00",
    label: "Lanceringsactie",
    labelEn: "Launch offer",
  },

  /** Lengte van een periode: abonnees krijgen elke 28 dagen een nieuw schema, na hun check-in. */
  planIntervalDays: 28,

  checkin: {
    /** Zoveel dagen voor het einde van een periode opent de check-in. */
    opensDaysBefore: 3,
    /** Uitnodiging en herinneringen: dagen na het openen van de check-in (0 = uitnodiging). */
    reminderDays: [0, 3, 7, 14],
  },

  social: {
    instagram: "",
    facebook: "",
    tiktok: "",
  },
} as const;

export function companyAddressLine() {
  const c = site.company;
  return `${c.address}, ${c.postalCode} ${c.city}`;
}

export type LaunchOffer = typeof site.launchOffer;

/** Is de lanceringsactie op het gegeven moment actief? */
export function isLaunchOfferActive(now: Date): boolean {
  const o = site.launchOffer;
  if (!o.enabled) return false;
  const t = now.getTime();
  return t >= Date.parse(o.startsAt) && t <= Date.parse(o.endsAt);
}

export function launchOfferEndLabel(l: Locale = "nl"): string {
  return new Intl.DateTimeFormat(intlLocale(l), {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(site.launchOffer.endsAt));
}
