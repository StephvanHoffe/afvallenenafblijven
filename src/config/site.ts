import type { DurationId } from "@/config/pricing";
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
    "Persoonlijke voedingsschema's en trainingsschema's, afgestemd op jouw doel, lichaam en agenda. Binnen 2 uur in je mailbox. Maandelijks opzegbaar.",

  company: {
    legalName: "Afvallen en Afblijven",
    address: "[Straat en huisnummer]",
    postalCode: "[Postcode]",
    city: "[Plaats]",
    country: "Nederland",
    kvk: "89513908",
    vat: "NL004738412B27",
    email: "info@afvallenenafblijven.nl",
    privacyEmail: "privacy@afvallenenafblijven.nl",
    phone: "",
  },

  /** Datum van de laatste wijziging van de juridische teksten. */
  legalUpdated: "21 oktober 2026",

  /** Hoe snel reageren we op e-mail (gebruikt in contact- en klachtenteksten). */
  responseTimeDays: 2,

  /**
   * Tevredenheidsgarantie op de eerste betaling. Dit is een vrijwillige,
   * juridisch bindende belofte: zet `enabled` op false als je dit niet wilt
   * aanbieden. De algemene voorwaarden passen zich automatisch aan.
   */
  guarantee: {
    enabled: true,
    days: 14,
  },

  /**
   * Acties: automatische korting op de eerste betaling, per looptijd (0 = geen
   * korting voor die looptijd). Een actie wordt alleen getoond én toegepast
   * tussen startsAt en endsAt; lopen er twee tegelijk, dan geldt de eerste in
   * de lijst. Een kortingscode van een klant vervangt de actiekorting.
   * De Stripe-coupons worden bij het eerste gebruik automatisch aangemaakt.
   */
  promotions: [
    {
      // Black Week tot en met Cyber Monday. Hoe langer je kiest, hoe meer korting:
      // dat trekt klanten die echt willen doorzetten, niet alleen kortingsjagers.
      id: "blackfriday-2026",
      enabled: true,
      label: "Black Friday",
      labelEn: "Black Friday",
      startsAt: "2026-11-23T00:00:00+01:00",
      endsAt: "2026-11-30T23:59:59+01:00",
      percentOff: { "1m": 25, "3m": 40, "6m": 50, "12m": 50, eenmalig: 25 },
    },
    {
      // Januari: de drukste maand voor afvallen (goede voornemens).
      id: "nieuwjaar-2027",
      enabled: true,
      label: "Goede voornemens-actie",
      labelEn: "New Year offer",
      startsAt: "2027-01-01T00:00:00+01:00",
      endsAt: "2027-01-31T23:59:59+01:00",
      percentOff: { "1m": 20, "3m": 20, "6m": 20, "12m": 20, eenmalig: 20 },
    },
  ],

  /**
   * Lengte van een periode: abonnees krijgen elke 4 weken een nieuw schema, na
   * hun check-in. Elke periode start op dezelfde weekdag (zie src/lib/schedule.ts),
   * zodat het nieuwe schema met boodschappenlijst op tijd voor het weekend klaarstaat.
   */
  planIntervalDays: 28,
  /** Weekdag waarop elke periode start: 1 = maandag (0 = zondag … 6 = zaterdag). */
  periodStartWeekday: 1,

  checkin: {
    /** Zoveel dagen voor de start van de nieuwe periode opent de check-in (4 = donderdag). */
    opensDaysBefore: 4,
    /** Zoveel dagen voor de start adviseren we de check-in uiterlijk in te vullen (2 = zaterdag), voor de boodschappen. */
    advisedDaysBefore: 2,
    /** Uitnodiging en herinneringen: dagen na het openen van de check-in (do, za, ma, maandag erna). */
    reminderDays: [0, 2, 4, 11],
  },

  /**
   * Levering: een nieuw schema wordt direct gemaakt, maar staat pas op een
   * willekeurig moment tussen `minMinutes` en `maxMinutes` klaar (de ene klant
   * na 23 minuten, de andere na anderhalf uur). De klant krijgt dan een e-mail.
   * We beloven "binnen `promiseHours` uur"; houd `maxMinutes` daar ruim onder,
   * want de geplande taak draait elke 5 minuten. `afterCheckin` geldt hetzelfde
   * voor het nieuwe schema na een check-in. De teksten op de website, in de
   * e-mails en in de voorwaarden noemen "2 uur"; pas die mee aan als je de
   * belofte verandert.
   */
  delivery: {
    minMinutes: 20,
    maxMinutes: 110,
    promiseHours: 2,
    afterCheckin: true,
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

/** Of de juridische naam echt afwijkt van de merknaam ("en" en "&" tellen als gelijk). */
export function hasSeparateLegalName() {
  const norm = (s: string) => s.toLowerCase().replace(/&/g, "en").replace(/\s+/g, " ").trim();
  return norm(site.company.legalName) !== norm(site.name);
}

export type Promotion = (typeof site.promotions)[number];

/** De actie die op het gegeven moment loopt, of null. */
export function activePromotion(now: Date): Promotion | null {
  const t = now.getTime();
  return site.promotions.find((p) => p.enabled && t >= Date.parse(p.startsAt) && t <= Date.parse(p.endsAt)) ?? null;
}

/** Korting (in procenten) op de eerste betaling voor deze looptijd. */
export function promotionPercent(p: Pick<Promotion, "percentOff">, duration: DurationId): number {
  return p.percentOff[duration] ?? 0;
}

/** Laatste dag van de actie, bijv. "maandag 30 november". */
export function promotionEndLabel(p: Pick<Promotion, "endsAt">, l: Locale = "nl"): string {
  return new Intl.DateTimeFormat(intlLocale(l), {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Amsterdam",
  }).format(new Date(p.endsAt));
}

/** "tot 50% korting op je eerste maand", of "20% korting op je eerste betaling" als alle looptijden gelijk zijn. */
export function promotionSummary(percentOff: Record<DurationId, number>, l: Locale = "nl"): string {
  const values = Object.values(percentOff).filter((v) => v > 0);
  const max = Math.max(0, ...values);
  const same = values.length > 0 && values.every((v) => v === max);
  if (l === "en") return same ? `${max}% off your first payment` : `up to ${max}% off your first month`;
  return same ? `${max}% korting op je eerste betaling` : `tot ${max}% korting op je eerste maand`;
}
