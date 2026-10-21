import "server-only";
import { z } from "zod";
import { PRODUCT_IDS, SUBSCRIPTION_DURATIONS, durations, isDurationId, isProductId, monthlyPrice, products } from "@/config/pricing";
import { site } from "@/config/site";
import { isDemoMode } from "@/lib/admin/auth";
import { analyticsReport, type AnalyticsReport } from "@/lib/admin/analytics-report";
import { adminData, type AdminOverview } from "@/lib/admin/data";
import { funnelReport, type FunnelReport } from "@/lib/admin/funnel-report";
import { FEEDBACK_CONCERNS, discountCodes, emailLog, feedbackReport, type FeedbackReport } from "@/lib/admin/insights";
import { CHANNEL_LABELS } from "@/lib/admin/channels";
import { visitorsReport, type VisitorsReport } from "@/lib/admin/visitors-report";
import { cancelReasonLabel } from "@/lib/cancel-reasons";
import type { DiscountCodeRow } from "@/lib/discounts-server";
import { formatNumber } from "@/lib/format";
import { getSetting, setSetting } from "@/lib/repo";
import { checkoutReminderSettings } from "@/lib/settings";

/**
 * Kansen: tips en verbeteringen voor de website en het bedrijf, berekend uit
 * alle cijfers in het beheer (funnel, bezoekers, analyse, feedback, e-mails,
 * kortingscodes). Vaste regels met drempels, zodat een kans alleen verschijnt
 * als er genoeg gegevens zijn. Daarnaast kan Claude op verzoek meedenken met
 * dezelfde (geanonimiseerde, opgetelde) cijfers.
 */

export type KansArea =
  | "funnel"
  | "vragenlijst"
  | "afrekenen"
  | "bezoekers"
  | "marketing"
  | "behoud"
  | "tevredenheid"
  | "schemas"
  | "email"
  | "beheer";

export const AREA_LABELS: Record<KansArea, string> = {
  funnel: "Funnel",
  vragenlijst: "Vragenlijst",
  afrekenen: "Afrekenen",
  bezoekers: "Bezoekers",
  marketing: "Marketing",
  behoud: "Klanten behouden",
  tevredenheid: "Tevredenheid",
  schemas: "Schema's",
  email: "E-mail",
  beheer: "Beheer",
};

export type KansImpact = "hoog" | "middel" | "laag";

export interface Kans {
  id: string;
  area: KansArea;
  impact: KansImpact;
  title: string;
  /** Wat de cijfers laten zien. */
  finding: string;
  /** Wat je eraan kunt doen. */
  actions: string[];
  /** Waarop de kans is gebaseerd (periode en aantallen). */
  basis: string;
  link?: { href: string; label: string };
  /** Voor de volgorde binnen dezelfde impact: hoe meer, hoe belangrijker. */
  weight: number;
}

export interface OpportunityInput {
  funnel: FunnelReport;
  analytics: AnalyticsReport;
  visitors: VisitorsReport;
  feedback: FeedbackReport;
  overview: AdminOverview;
  failedEmails: number;
  skippedEmails: number;
  codes: DiscountCodeRow[];
  reminder: { enabled: boolean; delayHours: number };
  approval: boolean;
  now: Date;
}

const DAY = 24 * 60 * 60 * 1000;
const MIN_VISITS = 50;
const p0 = (x: number) => `${formatNumber(x * 100, 0)}%`;
const p1 = (x: number) => `${formatNumber(x * 100, 1)}%`;
const n = (x: number) => formatNumber(x);
const euro = (cents: number) => `€ ${formatNumber(cents / 100, cents % 100 === 0 ? 0 : 2)}`;
const rate = (a: number, b: number) => (b > 0 ? a / b : 0);
const planName = (product: string, duration: string) =>
  `${isProductId(product) ? products[product].shortName : product} · ${
    isDurationId(duration) ? (duration === "eenmalig" ? "los" : duration === "1m" ? "per maand" : `min. ${durations[duration].label}`) : duration
  }`;

/** Concreet advies per vraag van de vragenlijst waar veel mensen stoppen. */
const STEP_ADVICE: Record<string, string[]> = {
  doel: [
    "Laat bij de eerste vraag zien hoe kort de vragenlijst is (± 2 minuten) en wat je ervoor terugkrijgt.",
    "Zet de doel-knoppen al op de homepage en landingspagina's, zodat de eerste klik daar gebeurt.",
  ],
  hulp: ["Maak deze vraag korter of laat hem vervallen als het plan al uit de link bekend is."],
  "over-jou": ["Leg in één zin uit waarom leeftijd en geslacht nodig zijn: voor een correcte berekening van je dagdoelen."],
  lichaam: [
    "Gewicht invullen is gevoelig. Zet erbij dat het alleen voor de berekening is en nooit wordt gedeeld.",
    "Maak het streefgewicht optioneel of geef een suggestie.",
  ],
  tempo: ["Geef één aanbevolen keuze duidelijk aan, zodat mensen niet hoeven te twijfelen."],
  activiteit: ["Maak de omschrijvingen korter en geef herkenbare voorbeelden (kantoor, zorg, bouw)."],
  eetstijl: ["Zet de meest gekozen opties bovenaan en maak allergieën een korte, optionele lijst."],
  maaltijden: ["Overweeg deze vraag samen te voegen met de eetstijl of een standaardkeuze voor te selecteren."],
  "training-plek": ["Laat de trainingsvragen alleen zien als iemand training kiest (al zo), en maak de keuzes visueel."],
  "training-tijd": ["Voorselecteer de meest gekozen waarden (3 dagen, 45 minuten)."],
  gezondheid: [
    "Leg uit dat deze vragen er zijn voor je veiligheid, en dat het niet lang duurt.",
    "Zet de meest voorkomende antwoorden (\"Geen\") als eerste neer.",
  ],
  resultaat: [
    "Hier vragen we naam en e-mail. Laat eerst (een deel van) het resultaat zien, of leg uit dat het e-mailadres nodig is om het schema te sturen.",
    "Zet er een korte geruststelling bij: geen spam, afmelden kan altijd.",
  ],
};

/** Advies bij de meest genoemde opzegreden. */
const CANCEL_ADVICE: Record<string, string[]> = {
  te_duur: [
    "Laat de prijs per week zien naast de maandprijs (bijv. \"minder dan € 4 per week\").",
    "Geef opzeggers een alternatief: een tijdelijke korting voor de eerste maanden (kortingscode met \"de eerste maanden\") of een los voedingsschema.",
    "Wijs bij langere looptijden duidelijker op het voordeel ten opzichte van per maand.",
  ],
  geen_tijd: [
    "Bied een \"snelle week\" aan met maaltijden onder 15 minuten en kortere trainingen.",
    "Overweeg een pauzeknop (1-2 maanden) naast opzeggen; dan blijven klanten behouden.",
  ],
  doel_bereikt: [
    "Stuur klanten die hun streefgewicht bereiken een aanbod voor \"Op gewicht blijven\" (onderhoud), met een lagere prijs of korting.",
    "Vraag deze klanten om een review: ze zijn tevreden.",
  ],
  past_niet: [
    "Lees de toelichtingen bij Feedback en gebruik \"Opnieuw maken met aanwijzing\" vaker in de eerste weken.",
    "Vraag na week 1 actief of het schema bevalt (mail of check-in), voordat mensen afhaken.",
  ],
  gezondheid: ["Hier valt weinig aan te doen; zorg voor een vriendelijke afsluiting en een uitnodiging om later terug te komen."],
  anders: ["Lees de toelichtingen bij Feedback voor de echte redenen."],
};

/** Advies als veel klanten een probleem melden in de check-in. */
const FEEDBACK_ADVICE: Record<string, { title: string; actions: string[] }> = {
  hunger: {
    title: "Veel klanten hebben vaak honger",
    actions: [
      "Laat de voedingsschema's meer volume en eiwit per maaltijd geven (groente, peulvruchten, magere zuivel).",
      "Gebruik bij deze klanten \"Opnieuw maken met aanwijzing\" (bijv. \"meer verzadigende tussendoortjes\").",
      "Controleer of klanten met tempo \"Sneller\" niet te scherp afvallen.",
    ],
  },
  nutritionAdherence: {
    title: "Klanten volgen het voedingsschema vaak niet",
    actions: [
      "Maak recepten eenvoudiger en korter, met herkenbare producten uit de supermarkt.",
      "Herhaal maaltijden vaker in de week (minder boodschappen en minder kookwerk).",
    ],
  },
  energy: {
    title: "Veel klanten hebben weinig energie",
    actions: ["Controleer of het tekort niet te groot is, vooral bij tempo \"Sneller\".", "Zorg voor genoeg koolhydraten rond de trainingen."],
  },
  sleep: {
    title: "Veel klanten slapen slecht",
    actions: ["Voeg een korte slaaptip toe aan de schema's of de wekelijkse mail.", "Plan trainingen niet laat op de avond in."],
  },
  trainingAdherence: {
    title: "Klanten doen vaak niet alle trainingen",
    actions: ["Maak kortere trainingen (20-30 minuten) als optie.", "Stel minder trainingsdagen voor bij beginners."],
  },
  difficulty: {
    title: "De trainingen sluiten vaak niet aan bij het niveau",
    actions: [
      "Bouw de zwaarte geleidelijker op, en pas het niveau aan op de antwoorden in de check-in.",
      "Gebruik \"Opnieuw maken met aanwijzing\" bij klanten die \"te zwaar\" of \"te licht\" aangeven.",
    ],
  },
};

const STOPWORDS = new Set(
  "de het een en van met in op niet wel te is was ik mijn je geen of als dat die er maar ook voor naar bij om wat dan zo nog heel erg echt beetje vind vond lekker meer minder iets alles".split(
    " ",
  ),
);

/** Woorden die het vaakst genoemd worden bij "niet lekker" in de check-ins. */
function topDislikes(feedback: FeedbackReport): { word: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of feedback.checkins) {
    const text = c.data.dislikedMeals?.toLowerCase() ?? "";
    for (const w of new Set(text.split(/[^\p{L}-]+/u).filter((x) => x.length > 2 && !STOPWORDS.has(x)))) {
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .filter((x) => x.count >= 3)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** Berekent alle kansen uit de cijfers. Pure functie, zodat hij ook met demo-cijfers werkt. */
export function buildOpportunities(i: OpportunityInput): { kansen: Kans[]; strengths: Kans[]; dataNote: string | null } {
  const out: Kans[] = [];
  const good: Kans[] = [];
  const f = i.funnel;
  const v = i.visitors;
  const a = i.analytics;
  const stage = (key: string) => f.stages.find((s) => s.key === key)?.count ?? 0;
  const visits = stage("visits");
  const basis30 = `Laatste ${f.filters.days} dagen, ${n(visits)} bezoeken`;

  // ---------- Funnel ----------
  if (visits >= MIN_VISITS) {
    const quizShare = rate(stage("quiz"), visits);
    if (quizShare < 0.3) {
      out.push({
        id: "funnel-start",
        area: "funnel",
        impact: quizShare < 0.2 ? "hoog" : "middel",
        title: "Weinig bezoekers beginnen aan de vragenlijst",
        finding: `Van de bezoekers opent ${p0(quizShare)} de vragenlijst. Bij een goede landingspagina is dat vaak 35% of meer.`,
        actions: [
          "Zet één duidelijke knop bovenaan elke pagina, bijvoorbeeld \"Start de gratis vragenlijst (2 minuten)\".",
          "Laat de eerste vraag (je doel) al op de homepage en landingspagina's zien.",
          "Test een andere kop die het probleem van de bezoeker benoemt, en laat het voorbeeldschema zien.",
        ],
        basis: basis30,
        link: { href: "/beheer/bezoekers", label: "Bekijk de instappagina's" },
        weight: visits - stage("quiz"),
      });
    }
    const startedShare = rate(stage("started"), stage("quiz"));
    if (stage("quiz") >= 30 && startedShare < 0.8) {
      out.push({
        id: "funnel-eerste-vraag",
        area: "vragenlijst",
        impact: "middel",
        title: "Veel mensen stoppen al bij de eerste vraag",
        finding: `${p0(1 - startedShare)} van wie de vragenlijst opent, beantwoordt de eerste vraag niet.`,
        actions: STEP_ADVICE.doel,
        basis: `${n(stage("quiz"))} keer geopend`,
        link: { href: "/beheer/funnel", label: "Bekijk de vragen" },
        weight: stage("quiz") - stage("started"),
      });
    }
    // De vraag waar de meeste mensen afhaken (zonder de laatste stap: daar zit het afrekenen).
    const worst = f.steps
      .filter((s) => s.step !== "plan" && s.step !== "doel" && s.reached >= 30)
      .map((s) => ({ ...s, share: rate(s.leftHere, s.reached) }))
      .sort((x, y) => y.leftHere - x.leftHere)[0];
    if (worst && worst.share >= 0.06) {
      out.push({
        id: `stap-${worst.step}`,
        area: "vragenlijst",
        impact: worst.share >= 0.12 ? "hoog" : "middel",
        title: `Bij de vraag "${worst.label}" haken de meeste mensen af`,
        finding: `${n(worst.leftHere)} van de ${n(worst.reached)} mensen die deze vraag zagen (${p0(worst.share)}) gingen niet verder.`,
        actions: STEP_ADVICE[worst.step] ?? ["Maak deze vraag korter of eenvoudiger, of verplaats hem naar later."],
        basis: basis30,
        link: { href: "/beheer/funnel", label: "Bekijk de funnel per vraag" },
        weight: worst.leftHere,
      });
    }
    const selectShare = rate(stage("selected"), stage("plan"));
    if (stage("plan") >= 30 && selectShare < 0.55) {
      out.push({
        id: "funnel-plankeuze",
        area: "afrekenen",
        impact: "hoog",
        title: "Veel mensen bekijken de plannen maar kiezen er geen",
        finding: `${p0(1 - selectShare)} van wie de plannen ziet, kiest geen plan. Twijfel over prijs of looptijd is de meest voorkomende reden.`,
        actions: [
          "Laat ons advies (het voorgeselecteerde plan) nog duidelijker zien, met waarom dit plan past.",
          `Zet de ${site.guarantee.days}-dagengarantie en \"maandelijks opzegbaar\" direct naast de prijs.`,
          "Toon de prijs per week, en een korte review of voorbeeld bij het plan.",
        ],
        basis: `${n(stage("plan"))} keer de plannen bekeken`,
        link: { href: "/beheer/funnel", label: "Bekijk per plan" },
        weight: stage("plan") - stage("selected"),
      });
    }
    const submitShare = rate(stage("submitted"), stage("selected"));
    if (stage("selected") >= 20 && submitShare < 0.6) {
      out.push({
        id: "funnel-afrekenblok",
        area: "afrekenen",
        impact: "hoog",
        title: "Na het kiezen van een plan klikken weinig mensen op betalen",
        finding: `${p0(1 - submitShare)} van wie een plan koos, klikt niet op \"Doorgaan naar veilig betalen\". De drie verplichte vinkjes kunnen een drempel zijn.`,
        actions: [
          "Maak de teksten bij de vinkjes korter (met een link naar de volledige tekst).",
          "Zet een korte samenvatting van wat je krijgt en wanneer (binnen 2 uur) vlak boven de knop.",
          "Laat de betaalmethoden (iDEAL | Wero) en de garantie zien bij de knop.",
        ],
        basis: `${n(stage("selected"))} keer een plan gekozen`,
        link: { href: "/start", label: "Bekijk de vragenlijst" },
        weight: stage("selected") - stage("submitted"),
      });
    }
    const paidShare = rate(stage("purchase"), stage("checkout"));
    if (stage("checkout") >= 10 && paidShare < 0.55) {
      out.push({
        id: "funnel-betaalpagina",
        area: "afrekenen",
        impact: "hoog",
        title: "Veel mensen openen de betaalpagina maar betalen niet",
        finding: `${p0(1 - paidShare)} van wie de betaalpagina van Stripe opent, rondt de betaling niet af.`,
        actions: [
          i.reminder.enabled
            ? "De herinnering bij niet-afgeronde betaling staat aan; kijk in de funnel of die mails worden geopend en of mensen alsnog bestellen."
            : "Zet de herinnering bij niet-afgeronde betaling aan (Instellingen).",
          "Controleer in Stripe of iDEAL | Wero en Bancontact aanstaan, en of de betaalpagina in het Nederlands is.",
          "Leg vóór de betaalpagina uit dat je nu de eerste maand betaalt en daarna maandelijks via incasso.",
        ],
        basis: `${n(stage("checkout"))} keer de betaalpagina geopend`,
        link: { href: "/beheer/funnel#afgehaakt", label: "Bekijk de niet-afgeronde betalingen" },
        weight: stage("checkout") - stage("purchase"),
      });
    } else if (stage("checkout") >= 10 && paidShare >= 0.7) {
      good.push({
        id: "goed-betaalpagina",
        area: "afrekenen",
        impact: "laag",
        title: "De betaalpagina werkt goed",
        finding: `${p0(paidShare)} van wie de betaalpagina opent, betaalt ook.`,
        actions: [],
        basis: `${n(stage("checkout"))} keer geopend`,
        weight: 0,
      });
    }
  }

  // Herinnering bij niet-afgeronde betaling
  const withConsent = f.abandoned.filter((x) => x.marketing && !x.remindedAt).length;
  if (!i.reminder.enabled && f.abandoned.length >= 3) {
    out.push({
      id: "herinnering-uit",
      area: "afrekenen",
      impact: "hoog",
      title: "Zet de herinnering bij een niet-afgeronde betaling aan",
      finding: `${n(f.abandoned.length)} mensen vulden de vragenlijst in maar betaalden niet; ${n(f.abandoned.filter((x) => x.marketing).length)} van hen gaven toestemming voor e-mail.`,
      actions: [
        "Zet de herinnering aan bij Instellingen (bijv. na 3 uur). Er gaat maximaal één mail per persoon, alleen met toestemming.",
        "Pas eventueel de tekst van de mail aan bij E-mails (\"Herinnering: betaling niet afgerond\").",
      ],
      basis: `Laatste ${f.filters.days} dagen`,
      link: { href: "/beheer/instellingen#herinnering", label: "Naar de instelling" },
      weight: f.abandoned.length,
    });
  } else if (withConsent >= 3) {
    out.push({
      id: "herinnering-handmatig",
      area: "afrekenen",
      impact: "middel",
      title: `${n(withConsent)} mensen kregen nog geen herinnering`,
      finding: "Zij gaven toestemming voor e-mail, rondden de betaling niet af en kregen nog geen herinnering (bijv. omdat ze er nog niet lang genoeg tussen zaten).",
      actions: ["Stuur ze vanuit de funnel alvast een herinnering, als het al langer dan een paar uur geleden is."],
      basis: `Laatste ${f.filters.days} dagen`,
      link: { href: "/beheer/funnel#afgehaakt", label: "Naar de lijst" },
      weight: withConsent,
    });
  }

  // Apparaten
  const mob = f.byDevice.find((d) => d.key === "mobiel");
  const desk = f.byDevice.find((d) => d.key === "desktop");
  if (mob && desk && mob.visits >= 40 && desk.visits >= 40) {
    const cm = rate(mob.orders, mob.visits);
    const cd = rate(desk.orders, desk.visits);
    if (cd > 0 && cm < cd * 0.7) {
      out.push({
        id: "apparaat-mobiel",
        area: "funnel",
        impact: rate(mob.visits, visits) > 0.5 ? "hoog" : "middel",
        title: "Bezoekers op mobiel bestellen minder vaak",
        finding: `Op mobiel betaalt ${p1(cm)} van de bezoekers, op een computer ${p1(cd)}. ${p0(rate(mob.visits, visits))} van je bezoekers zit op mobiel.`,
        actions: [
          "Loop de vragenlijst en het afrekenen zelf door op je telefoon: zijn alle knoppen goed te raken en is de volgende knop zichtbaar zonder te scrollen?",
          "Houd teksten boven de knop kort; op mobiel scrollen mensen minder.",
          "Controleer de snelheid van de landingspagina op mobiel (bijv. met PageSpeed Insights).",
        ],
        basis: `${n(mob.visits)} mobiele en ${n(desk.visits)} computerbezoeken`,
        link: { href: "/beheer/bezoekers", label: "Bekijk per apparaat" },
        weight: Math.round(mob.visits * (cd - cm)),
      });
    }
  }

  // Bronnen (utm)
  const totalConv = rate(stage("purchase"), visits);
  for (const s of f.bySource.filter((x) => x.key && x.visits >= MIN_VISITS)) {
    const c = rate(s.orders, s.visits);
    if (totalConv > 0 && c < totalConv * 0.5) {
      out.push({
        id: `bron-zwak-${s.key}`,
        area: "marketing",
        impact: rate(s.visits, visits) > 0.2 ? "hoog" : "middel",
        title: `Bezoekers via ${s.key} bestellen weinig`,
        finding: `Via ${s.key} betaalt ${p1(c)} van de bezoekers, gemiddeld is dat ${p1(totalConv)}. Dit is ${p0(rate(s.visits, visits))} van je bezoek.`,
        actions: [
          "Kijk of de advertentie dezelfde belofte doet als de landingspagina (bijv. \"voedingsschema\" → /lp/voeding).",
          "Verfijn de doelgroep of zoekwoorden, of verlaag het budget tot de conversie beter is.",
          "Stuur dit verkeer naar de landingspagina die het best converteert.",
        ],
        basis: `${n(s.visits)} bezoeken via ${s.key}`,
        link: { href: "/beheer/funnel", label: "Bekijk per bron" },
        weight: s.visits,
      });
    } else if (totalConv > 0 && c > totalConv * 1.5 && rate(s.visits, visits) < 0.3) {
      out.push({
        id: `bron-sterk-${s.key}`,
        area: "marketing",
        impact: "middel",
        title: `${s.key} levert goede klanten op: hier kan meer`,
        finding: `Via ${s.key} betaalt ${p1(c)} van de bezoekers, ruim boven het gemiddelde van ${p1(totalConv)}, terwijl het maar ${p0(rate(s.visits, visits))} van je bezoek is.`,
        actions: ["Verhoog het budget voor deze bron stapsgewijs (bijv. +20% per week) en houd de conversie in de gaten."],
        basis: `${n(s.visits)} bezoeken via ${s.key}`,
        link: { href: "/beheer/funnel", label: "Bekijk per bron" },
        weight: s.visits,
      });
    }
  }

  // Plannen die zelden worden afgerond
  for (const pl of f.byPlan.filter((x) => x.checkouts >= 8)) {
    const c = rate(pl.orders, pl.checkouts);
    if (c < 0.35) {
      out.push({
        id: `plan-${pl.product}-${pl.duration}`,
        area: "afrekenen",
        impact: "middel",
        title: `Bij ${planName(pl.product, pl.duration)} ronden weinig mensen de betaling af`,
        finding: `${n(pl.checkouts)} keer de betaalpagina geopend, ${n(pl.orders)} keer betaald (${p0(c)}).`,
        actions: [
          "Controleer of de prijs en de minimale looptijd vóór het betalen duidelijk zijn.",
          pl.duration === "eenmalig" ? "Leg uit dat een los schema niet wordt bijgestuurd, en wat een abonnement extra geeft." : "Laat zien wat het per maand en per week kost.",
        ],
        basis: `Laatste ${f.filters.days} dagen`,
        link: { href: "/beheer/funnel", label: "Bekijk per plan" },
        weight: pl.checkouts - pl.orders,
      });
    }
  }

  // ---------- Bezoekers ----------
  const k = v.kpis;
  const pv = v.previous;
  if (k.visits >= 100 && pv.visits >= 100) {
    const change = rate(k.visits - pv.visits, pv.visits);
    if (change <= -0.2) {
      out.push({
        id: "bezoek-daalt",
        area: "bezoekers",
        impact: "hoog",
        title: "Het aantal bezoekers daalt",
        finding: `${n(k.visits)} bezoeken in de laatste ${v.days} dagen, ${p0(-change)} minder dan de ${v.days} dagen ervoor (${n(pv.visits)}).`,
        actions: [
          "Kijk bij Bezoekers → Kanalen welk kanaal daalt: gestopte advertenties, minder vindbaar in Google of minder social posts.",
          "Plan een actie of nieuwe advertentie voor de komende week.",
        ],
        basis: `${v.days} dagen vergeleken met de periode ervoor`,
        link: { href: "/beheer/bezoekers", label: "Bekijk de kanalen" },
        weight: pv.visits - k.visits,
      });
    } else if (change >= 0.2) {
      good.push({
        id: "goed-bezoek",
        area: "bezoekers",
        impact: "laag",
        title: "Het aantal bezoekers groeit",
        finding: `${p0(change)} meer bezoeken dan de ${v.days} dagen ervoor.`,
        actions: [],
        basis: `${n(k.visits)} tegen ${n(pv.visits)} bezoeken`,
        weight: 0,
      });
    }
    if (k.conversion !== null && pv.conversion !== null && pv.conversion > 0) {
      const cc = rate(k.conversion - pv.conversion, pv.conversion);
      if (cc <= -0.25) {
        out.push({
          id: "conversie-daalt",
          area: "funnel",
          impact: "hoog",
          title: "Minder bezoekers worden klant",
          finding: `De conversie is ${p1(k.conversion)}, was ${p1(pv.conversion)} in de periode ervoor.`,
          actions: [
            "Kijk of er iets is veranderd: een nieuwe campagne, de prijs, de lanceringsactie die is afgelopen, of een fout in de vragenlijst.",
            "Loop zelf de hele vragenlijst door tot de betaalpagina, op mobiel en op een computer.",
          ],
          basis: `${v.days} dagen vergeleken met de periode ervoor`,
          link: { href: "/beheer/funnel", label: "Bekijk de funnel" },
          weight: Math.round(k.visits * (pv.conversion - k.conversion)),
        });
      } else if (cc >= 0.2) {
        good.push({
          id: "goed-conversie",
          area: "funnel",
          impact: "laag",
          title: "Meer bezoekers worden klant",
          finding: `De conversie steeg van ${p1(pv.conversion)} naar ${p1(k.conversion)}.`,
          actions: [],
          basis: `${v.days} dagen vergeleken met de periode ervoor`,
          weight: 0,
        });
      }
    }
  }
  if (k.visits >= 100 && k.bounceRate !== null) {
    if (k.bounceRate > 0.55) {
      out.push({
        id: "bounce-hoog",
        area: "bezoekers",
        impact: "middel",
        title: "Veel bezoekers vertrekken na één pagina",
        finding: `${p0(k.bounceRate)} van de bezoeken bekijkt één pagina en doet verder niets.`,
        actions: [
          "Zorg dat de belofte uit de advertentie of zoekresultaat direct bovenaan de pagina terugkomt.",
          "Zet de belangrijkste knop boven de vouw, ook op mobiel.",
          "Controleer de laadsnelheid van de instappagina's.",
        ],
        basis: `${n(k.visits)} bezoeken`,
        link: { href: "/beheer/bezoekers", label: "Bekijk de instappagina's" },
        weight: Math.round(k.visits * k.bounceRate),
      });
    } else if (k.bounceRate < 0.35) {
      good.push({
        id: "goed-bounce",
        area: "bezoekers",
        impact: "laag",
        title: "Bezoekers blijven goed hangen",
        finding: `Maar ${p0(k.bounceRate)} van de bezoeken vertrekt na één pagina.`,
        actions: [],
        basis: `${n(k.visits)} bezoeken`,
        weight: 0,
      });
    }
  }
  for (const e of v.entries.filter((x) => x.visits >= 40)) {
    const b = rate(e.bounces, e.visits);
    if (b > 0.6) {
      out.push({
        id: `landing-${e.key}`,
        area: "bezoekers",
        impact: e.visits >= 150 ? "hoog" : "middel",
        title: `Instappagina ${e.key}: veel mensen gaan direct weer weg`,
        finding: `${p0(b)} van de ${n(e.visits)} bezoeken die op ${e.key} binnenkomen, vertrekt zonder verder te klikken.`,
        actions: [
          "Vergelijk de kop met de advertentie of zoekterm waarmee mensen binnenkomen.",
          "Zet de vragenlijst-knop hoger en maak de eerste schermhoogte rustiger.",
          e.key.startsWith("/en") ? "Controleer of Engelstalige advertenties wel bij je doelgroep passen." : "Test een variant van deze pagina met een andere kop.",
        ],
        basis: `Laatste ${v.days} dagen`,
        link: { href: "/beheer/bezoekers", label: "Bekijk de instappagina's" },
        weight: e.bounces,
      });
    }
  }
  const bestLanding = [...v.entries].filter((x) => x.visits >= 60).sort((x, y) => rate(y.purchases, y.visits) - rate(x.purchases, x.visits))[0];
  const worstLanding = [...v.entries].filter((x) => x.visits >= 60).sort((x, y) => rate(x.purchases, x.visits) - rate(y.purchases, y.visits))[0];
  if (bestLanding && worstLanding && bestLanding.key !== worstLanding.key) {
    const cb = rate(bestLanding.purchases, bestLanding.visits);
    const cw = rate(worstLanding.purchases, worstLanding.visits);
    if (cb > 0 && cw < cb * 0.5) {
      out.push({
        id: "landing-vergelijk",
        area: "marketing",
        impact: "middel",
        title: `${bestLanding.key} converteert veel beter dan ${worstLanding.key}`,
        finding: `Bezoekers die op ${bestLanding.key} binnenkomen, worden in ${p1(cb)} van de gevallen klant; op ${worstLanding.key} is dat ${p1(cw)}.`,
        actions: [
          `Stuur advertenties en links waar mogelijk naar ${bestLanding.key}.`,
          `Neem de sterke onderdelen van ${bestLanding.key} over op ${worstLanding.key}.`,
        ],
        basis: `${n(bestLanding.visits)} en ${n(worstLanding.visits)} bezoeken`,
        link: { href: "/beheer/bezoekers", label: "Bekijk de instappagina's" },
        weight: worstLanding.visits,
      });
    }
  }
  for (const pg of v.pages.filter((x) => x.views >= 50 && /^\/(en\/)?(prijzen|bundel|voedingsschema|trainingsschema|hoe-werkt-het|voorbeeld)$/.test(x.path))) {
    const exitRate = rate(pg.exits, pg.views);
    if (exitRate > 0.35) {
      out.push({
        id: `uitstap-${pg.path}`,
        area: "bezoekers",
        impact: pg.path.endsWith("prijzen") ? "hoog" : "middel",
        title: `Veel bezoekers verlaten de site op ${pg.path}`,
        finding: `${p0(exitRate)} van de weergaven van ${pg.path} is de laatste pagina van het bezoek.`,
        actions: pg.path.endsWith("prijzen")
          ? [
              "Laat bij elke prijs zien wat je precies krijgt (en een voorbeeld), plus de garantie.",
              "Zet onderaan een duidelijke knop naar de vragenlijst, met \"eerst gratis je resultaat zien\".",
            ]
          : ["Zet onderaan de pagina een duidelijke volgende stap (de vragenlijst of het voorbeeldschema)."],
        basis: `${n(pg.views)} weergaven`,
        link: { href: "/beheer/bezoekers", label: "Bekijk de pagina's" },
        weight: pg.exits,
      });
    }
  }
  const search = v.channels.find((c) => c.key === "zoekmachine");
  if (k.visits >= 200 && search && rate(search.visits, k.visits) < 0.1) {
    out.push({
      id: "kanaal-seo",
      area: "marketing",
      impact: "laag",
      title: "Weinig bezoekers via Google",
      finding: `Maar ${p0(rate(search.visits, k.visits))} van je bezoek komt via zoekmachines. Dat is gratis bezoek dat kan groeien.`,
      actions: [
        "Schrijf pagina's of artikelen bij veelgezochte vragen (bijv. \"voedingsschema afvallen vrouw\", \"krachttraining thuis beginners\").",
        "Meld de website aan bij Google Search Console en controleer of alle pagina's worden gevonden.",
      ],
      basis: `${n(k.visits)} bezoeken`,
      link: { href: "/beheer/bezoekers", label: "Bekijk de kanalen" },
      weight: 1,
    });
  }
  const en = v.languages.find((l) => l.key === "en");
  const nl = v.languages.find((l) => l.key === "nl");
  if (en && nl && en.visits >= 30 && rate(en.purchases, en.visits) < rate(nl.purchases, nl.visits) * 0.4) {
    out.push({
      id: "taal-en",
      area: "bezoekers",
      impact: "laag",
      title: "Engelstalige bezoekers worden zelden klant",
      finding: `Op de Engelse site betaalt ${p1(rate(en.purchases, en.visits))} van de bezoekers, op de Nederlandse ${p1(rate(nl.purchases, nl.visits))}.`,
      actions: [
        "Controleer of advertenties in het Engels wel op Nederland gericht zijn (expats), en niet op het buitenland.",
        "Laat iemand de Engelse teksten en de vragenlijst eens doorlopen.",
      ],
      basis: `${n(en.visits)} Engelstalige bezoeken`,
      link: { href: "/beheer/bezoekers", label: "Bekijk per taal" },
      weight: en.visits,
    });
  }

  // ---------- Klanten behouden ----------
  if (a.kpis.activeSubs >= 10 && a.kpis.churn30 !== null) {
    if (a.kpis.churn30 > 0.08) {
      out.push({
        id: "churn-hoog",
        area: "behoud",
        impact: "hoog",
        title: "Veel abonnees stoppen",
        finding: `${p1(a.kpis.churn30)} van de abonnementen stopte in de laatste 30 dagen.`,
        actions: [
          "Kijk bij Analyse naar de opzegredenen en bij Feedback naar de toelichtingen.",
          "Stuur in de week vóór het einde van de minimale looptijd een mail met de resultaten tot nu toe en een reden om door te gaan.",
        ],
        basis: `${n(a.kpis.activeSubs)} actieve abonnementen`,
        link: { href: "/beheer/analyse", label: "Bekijk het behoud" },
        weight: Math.round(a.kpis.activeSubs * a.kpis.churn30),
      });
    } else if (a.kpis.churn30 < 0.04) {
      good.push({
        id: "goed-churn",
        area: "behoud",
        impact: "laag",
        title: "Abonnees blijven goed",
        finding: `Maar ${p1(a.kpis.churn30)} van de abonnementen stopte in de laatste 30 dagen.`,
        actions: [],
        basis: `${n(a.kpis.activeSubs)} actieve abonnementen`,
        weight: 0,
      });
    }
  }
  const reasonsTotal = a.cancelReasons.reduce((s, r) => s + r.count, 0);
  const topReason = [...a.cancelReasons].filter((r) => r.reason && r.reason !== "anders").sort((x, y) => y.count - x.count)[0];
  if (topReason && topReason.count >= 3 && rate(topReason.count, reasonsTotal) >= 0.25) {
    out.push({
      id: `opzegreden-${topReason.reason}`,
      area: "behoud",
      impact: rate(topReason.count, reasonsTotal) >= 0.4 ? "hoog" : "middel",
      title: `De meest genoemde reden om te stoppen: "${cancelReasonLabel(topReason.reason)}"`,
      finding: `${n(topReason.count)} van de ${n(reasonsTotal)} opzeggingen met een reden (${p0(rate(topReason.count, reasonsTotal))}).`,
      actions: CANCEL_ADVICE[topReason.reason] ?? CANCEL_ADVICE.anders,
      basis: "Opzeggingen van de laatste 12 maanden",
      link: { href: "/beheer/feedback", label: "Lees de toelichtingen" },
      weight: topReason.count,
    });
  }
  // Behoud rond de minimale looptijd (3 maanden is de populairste looptijd).
  const m2 = a.cohorts.map((c) => c.retention[2]).filter((x): x is number => x !== null && x !== undefined);
  const m4 = a.cohorts.map((c) => c.retention[4]).filter((x): x is number => x !== null && x !== undefined);
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  if (m2.length >= 2 && m4.length >= 2 && avg(m2) - avg(m4) > 0.25) {
    out.push({
      id: "behoud-looptijd",
      area: "behoud",
      impact: "hoog",
      title: "Na de minimale looptijd stoppen veel klanten",
      finding: `Na 2 maanden is gemiddeld ${p0(avg(m2))} nog klant, na 4 maanden ${p0(avg(m4))}.`,
      actions: [
        "Stuur in maand 3 een persoonlijke mail met de voortgang (gewicht, trainingen) en wat de volgende periode brengt.",
        "Geef bij verlengen een voordeel, bijvoorbeeld een kortingscode voor de eerste maanden van een nieuwe looptijd.",
      ],
      basis: `${n(m4.length)} startmaanden met genoeg gegevens`,
      link: { href: "/beheer/analyse", label: "Bekijk de cohorten" },
      weight: 50,
    });
  }
  const mixTotal = a.mix.reduce((s, m) => s + m.count, 0);
  if (mixTotal >= 10) {
    const monthly = a.mix.filter((m) => m.duration === "1m").reduce((s, m) => s + m.count, 0);
    if (rate(monthly, mixTotal) > 0.5) {
      out.push({
        id: "mix-maand",
        area: "afrekenen",
        impact: "middel",
        title: "De meeste klanten kiezen per maand",
        finding: `${p0(rate(monthly, mixTotal))} van de verkochte abonnementen is maandelijks opzegbaar. Klanten met een langere looptijd blijven gemiddeld langer en halen betere resultaten.`,
        actions: [
          "Laat bij de plankeuze zien hoeveel je per maand bespaart met 3 of 6 maanden.",
          "Leg uit waarom resultaat tijd kost (bijv. \"de meeste klanten zien na 8-12 weken het verschil\"), zonder resultaat te beloven.",
        ],
        basis: `${n(mixTotal)} abonnementen in 12 maanden`,
        link: { href: "/beheer/analyse", label: "Bekijk de verkochte plannen" },
        weight: monthly,
      });
    }
    const bundles = a.mix.filter((m) => m.product === "bundel").reduce((s, m) => s + m.count, 0);
    if (rate(bundles, mixTotal) < 0.3) {
      out.push({
        id: "mix-bundel",
        area: "marketing",
        impact: "laag",
        title: "Weinig klanten kiezen voeding én training",
        finding: `${p0(rate(bundles, mixTotal))} kiest de bundel. Een klant met alleen voeding of training is een kans voor de bundel.`,
        actions: [
          "Stuur klanten met alleen een voedingsschema na 4 weken een aanbod om training toe te voegen (en omgekeerd).",
          "Laat in Mijn schema's zien wat de bundel extra geeft.",
        ],
        basis: `${n(mixTotal)} abonnementen in 12 maanden`,
        link: { href: "/beheer/analyse", label: "Bekijk de verkochte plannen" },
        weight: mixTotal - bundles,
      });
    }
  }
  if (a.kpis.revenue30Cents > 0 && rate(a.kpis.refunds30Cents, a.kpis.revenue30Cents) > 0.1) {
    out.push({
      id: "terugbetalingen",
      area: "tevredenheid",
      impact: "hoog",
      title: "Veel terugbetalingen",
      finding: `In de laatste 30 dagen werd ${euro(a.kpis.refunds30Cents)} terugbetaald op ${euro(a.kpis.revenue30Cents)} omzet (${p0(rate(a.kpis.refunds30Cents, a.kpis.revenue30Cents))}).`,
      actions: [
        "Lees de redenen bij de garantie-aanvragen: klopt de verwachting die de website wekt met wat klanten krijgen?",
        "Laat het voorbeeldschema prominenter zien, zodat mensen vooraf weten wat ze krijgen.",
      ],
      basis: `${n(a.kpis.guaranteeRequests30)} garantie-aanvragen`,
      link: { href: "/beheer/feedback", label: "Bekijk de garantie-aanvragen" },
      weight: a.kpis.refunds30Cents / 100,
    });
  }
  if (a.kpis.ltvCents !== null && a.kpis.ltvCents > 0) {
    out.push({
      id: "budget-per-klant",
      area: "marketing",
      impact: "laag",
      title: `Je kunt tot ongeveer ${euro(Math.round(a.kpis.ltvCents / 300) * 100)} uitgeven om een klant te werven`,
      finding: `Een klant brengt gemiddeld ${euro(a.kpis.ltvCents)} op (inclusief btw). Een veelgebruikte vuistregel is maximaal een derde daarvan aan advertenties per nieuwe klant.`,
      actions: [
        "Vergelijk dit met wat een klant je nu kost per advertentiekanaal (advertentiekosten gedeeld door het aantal klanten uit dat kanaal).",
        "Houd rekening met btw, Stripe-kosten en de kosten van Claude per schema.",
      ],
      basis: `Gemiddeld ${formatNumber(a.kpis.avgLifetimeMonths ?? 0, 1)} maanden klant × ${euro(a.kpis.arpuCents ?? 0)} per maand`,
      link: { href: "/beheer/analyse", label: "Bekijk de klantwaarde" },
      weight: 1,
    });
  }

  // ---------- Betrokkenheid en schema's ----------
  const e = a.engagement;
  if (e.checkins90 >= 10 && rate(e.checkinsOnTime90, e.checkins90) < 0.6) {
    out.push({
      id: "checkin-laat",
      area: "behoud",
      impact: "middel",
      title: "Veel check-ins komen te laat binnen",
      finding: `${p0(rate(e.checkinsOnTime90, e.checkins90))} van de check-ins kwam op tijd (vóór maandag).`,
      actions: [
        "Stuur de eerste herinnering een dag eerder, of maak de onderwerpregel dringender.",
        "Leg in de uitnodiging uit dat het nieuwe schema anders niet op tijd klaar is voor de boodschappen.",
      ],
      basis: `${n(e.checkins90)} check-ins in 90 dagen`,
      link: { href: "/beheer/emails", label: "Pas de check-in-mails aan" },
      weight: e.checkins90 - e.checkinsOnTime90,
    });
  }
  if (e.checkinsOverdue >= 2) {
    out.push({
      id: "checkin-verlopen",
      area: "behoud",
      impact: "middel",
      title: `${n(e.checkinsOverdue)} abonnees hebben hun check-in niet op tijd ingevuld`,
      finding: "Zij krijgen geen nieuw schema tot ze de check-in invullen, en lopen het risico af te haken.",
      actions: ["Stuur ze een persoonlijke mail of inloglink vanaf hun klantpagina.", "Start zo nodig een nieuwe periode zonder check-in."],
      basis: "Nu",
      link: { href: "/beheer/klanten", label: "Naar de klanten" },
      weight: e.checkinsOverdue * 3,
    });
  }
  if (a.kpis.activeSubs >= 10 && rate(e.weeklyOptOut, a.kpis.activeSubs) > 0.25) {
    out.push({
      id: "weegmoment-uit",
      area: "email",
      impact: "laag",
      title: "Veel klanten zetten de herinnering voor het weegmoment uit",
      finding: `${n(e.weeklyOptOut)} van de ${n(a.kpis.activeSubs)} abonnees wil de wekelijkse herinnering niet meer.`,
      actions: ["Maak de mail korter en persoonlijker, of stuur hem op een ander moment (bijv. vrijdagochtend)."],
      basis: "Actieve abonnementen",
      link: { href: "/beheer/emails/weekly", label: "Pas de mail aan" },
      weight: e.weeklyOptOut,
    });
  }
  const connected = e.healthConnections.reduce((s, c) => s + c.count, 0);
  if (a.kpis.activeSubs >= 15 && rate(connected, a.kpis.activeSubs) < 0.1) {
    out.push({
      id: "koppelingen",
      area: "behoud",
      impact: "laag",
      title: "Weinig klanten koppelen een gezondheidsapp",
      finding: `${n(connected)} van de ${n(a.kpis.activeSubs)} abonnees heeft een app of weegschaal gekoppeld. Met een koppeling worden check-ins vanzelf ingevuld en het schema beter afgestemd.`,
      actions: ["Noem de koppeling in de eerste mail en in Mijn schema's, met wat het oplevert."],
      basis: "Actieve abonnementen",
      weight: 1,
    });
  }
  if (a.results.customers >= 10 && a.results.lostShare !== null && a.results.lostShare < 0.6) {
    out.push({
      id: "resultaten",
      area: "schemas",
      impact: "hoog",
      title: "Een groot deel van de klanten valt (nog) niet af",
      finding: `Bij ${p0(a.results.lostShare)} van de klanten met metingen is de laatste weging lager dan bij de start.`,
      actions: [
        "Kijk bij Feedback of klanten het schema volgen. Volgen ze het wel, controleer dan de calorieberekening; zo niet, maak de schema's eenvoudiger.",
        "Stuur klanten zonder resultaat na 4 weken een persoonlijke check-in.",
      ],
      basis: `${n(a.results.customers)} klanten met metingen`,
      link: { href: "/beheer/feedback", label: "Bekijk de feedback" },
      weight: a.results.customers,
    });
  }
  if (a.plans.failed > 0) {
    out.push({
      id: "schemas-mislukt",
      area: "beheer",
      impact: "hoog",
      title: a.plans.failed === 1 ? "1 schema is definitief mislukt" : `${n(a.plans.failed)} schema's zijn definitief mislukt`,
      finding: "Deze klanten wachten op hun schema. Na 5 pogingen probeert de website het niet meer vanzelf.",
      actions: ["Controleer de API-sleutel en het tegoed bij Anthropic, en klik bij elk schema op \"Opnieuw maken\"."],
      basis: "Alle tijd",
      link: { href: "/beheer/schemas?status=failed", label: "Naar de mislukte schema's" },
      weight: a.plans.failed * 10,
    });
  }
  if (a.plans.rated >= 3 && a.plans.avgRating !== null && a.plans.avgRating < 3.5) {
    out.push({
      id: "schemas-cijfer",
      area: "schemas",
      impact: "middel",
      title: "Je beoordeelt de schema's gemiddeld onvoldoende",
      finding: `Gemiddeld ${formatNumber(a.plans.avgRating, 1)} van de 5, over ${n(a.plans.rated)} beoordeelde schema's.`,
      actions: [
        "Lees je eigen toelichtingen bij Feedback: zie je een terugkerend punt, laat dan de standaardinstructie voor de schema's aanpassen.",
        "Zet tijdelijk \"Schema's eerst zelf goedkeuren\" aan.",
      ],
      basis: `${n(a.plans.rated)} beoordelingen`,
      link: { href: "/beheer/feedback", label: "Bekijk je beoordelingen" },
      weight: a.plans.rated,
    });
  } else if (a.plans.generated30 >= 5 && a.plans.rated === 0) {
    out.push({
      id: "schemas-steekproef",
      area: "schemas",
      impact: "laag",
      title: "Beoordeel af en toe een schema",
      finding: `Er zijn ${n(a.plans.generated30)} schema's gemaakt in 30 dagen, maar je hebt er nog geen beoordeeld.`,
      actions: ["Open elke week 2-3 schema's en geef een cijfer. Zo zie je bij Feedback of de kwaliteit stabiel blijft."],
      basis: `${n(a.plans.generated30)} schema's`,
      link: { href: "/beheer/schemas?status=ready", label: "Naar de schema's" },
      weight: 1,
    });
  } else if (a.plans.rated >= 3 && a.plans.avgRating !== null && a.plans.avgRating >= 4.2) {
    good.push({
      id: "goed-schemas",
      area: "schemas",
      impact: "laag",
      title: "Je bent tevreden over de schema's",
      finding: `Gemiddeld ${formatNumber(a.plans.avgRating, 1)} van de 5.`,
      actions: [],
      basis: `${n(a.plans.rated)} beoordelingen`,
      weight: 0,
    });
  }

  // ---------- Feedback uit de check-ins ----------
  for (const d of i.feedback.distributions) {
    const total = d.answers.reduce((s, x) => s + x.count, 0);
    const concern = d.answers.filter((x) => FEEDBACK_CONCERNS[d.key]?.includes(x.answer)).reduce((s, x) => s + x.count, 0);
    const advice = FEEDBACK_ADVICE[d.key];
    if (advice && total >= 10 && rate(concern, total) >= 0.3) {
      out.push({
        id: `feedback-${d.key}`,
        area: d.key === "trainingAdherence" || d.key === "difficulty" ? "schemas" : "tevredenheid",
        impact: rate(concern, total) >= 0.45 ? "hoog" : "middel",
        title: advice.title,
        finding: `${p0(rate(concern, total))} van de check-ins bij "${d.label}" wijst op een probleem.`,
        actions: advice.actions,
        basis: `${n(total)} check-ins in 90 dagen`,
        link: { href: "/beheer/feedback", label: "Bekijk de antwoorden" },
        weight: concern,
      });
    }
  }
  const dislikes = topDislikes(i.feedback);
  if (dislikes.length) {
    out.push({
      id: "feedback-niet-lekker",
      area: "schemas",
      impact: "laag",
      title: "Deze ingrediënten vinden klanten vaak niet lekker",
      finding: dislikes.map((x) => `${x.word} (${n(x.count)}×)`).join(", "),
      actions: [
        "Laat deze ingrediënten minder vaak terugkomen in de schema's, of bied een alternatief aan.",
        "Het volgende schema van deze klanten houdt er al rekening mee via de check-in.",
      ],
      basis: `${n(i.feedback.checkins.length)} check-ins in 90 dagen`,
      link: { href: "/beheer/feedback", label: "Bekijk de opmerkingen" },
      weight: dislikes[0].count,
    });
  }

  // ---------- E-mail ----------
  if (i.skippedEmails > 0) {
    out.push({
      id: "email-smtp",
      area: "email",
      impact: "hoog",
      title: "E-mails worden niet verstuurd",
      finding: `${n(i.skippedEmails)} e-mails zijn niet verstuurd omdat de SMTP-instellingen ontbreken. Klanten krijgen dan hun schema, inloglinks en bevestigingen niet.`,
      actions: ["Zet SMTP_HOST, SMTP_PORT, SMTP_USER en SMTP_PASS bij je hosting (zie de README) en stuur een testmail."],
      basis: "E-maillog",
      link: { href: "/beheer/instellingen", label: "Naar de instellingen" },
      weight: i.skippedEmails * 5,
    });
  }
  if (i.failedEmails > 0) {
    out.push({
      id: "email-mislukt",
      area: "email",
      impact: "hoog",
      title: `${n(i.failedEmails)} e-mails konden niet worden verstuurd`,
      finding: "Bekijk het e-maillog voor de foutmelding (bijv. een verkeerd wachtwoord of een limiet bij de mailaanbieder).",
      actions: ["Los de fout op en stuur belangrijke mails (schema's, inloglinks) opnieuw vanaf de klantpagina."],
      basis: "E-maillog",
      link: { href: "/beheer/emails?weergave=log&status=failed", label: "Bekijk de mislukte mails" },
      weight: i.failedEmails * 5,
    });
  }

  // ---------- Kortingscodes en acties ----------
  const nowMs = i.now.getTime();
  const activeCodes = i.codes.filter((c) => c.active && (!c.expires_at || c.expires_at.getTime() > nowMs));
  for (const c of activeCodes.filter((x) => x.checkouts >= 10 && rate(x.redemptions, x.checkouts) < 0.3)) {
    out.push({
      id: `code-${c.code}`,
      area: "marketing",
      impact: "laag",
      title: `Code ${c.code}: veel mensen openen de betaalpagina, weinigen betalen`,
      finding: `${n(c.checkouts)} keer de betaalpagina geopend met deze code, ${n(c.redemptions)} keer betaald.`,
      actions: ["Controleer of de korting op de betaalpagina zichtbaar is en overeenkomt met wat de partner belooft."],
      basis: "Sinds het aanmaken van de code",
      link: { href: "/beheer/kortingscodes", label: "Naar de kortingscodes" },
      weight: c.checkouts - c.redemptions,
    });
  }
  for (const c of activeCodes.filter((x) => x.expires_at && x.expires_at.getTime() - nowMs < 7 * DAY)) {
    out.push({
      id: `code-verloopt-${c.code}`,
      area: "marketing",
      impact: "laag",
      title: `Code ${c.code} verloopt binnenkort`,
      finding: `Geldig tot en met ${new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long" }).format(c.expires_at!)}.`,
      actions: ["Laat het de partner weten of maak een vervolgcode, zodat links blijven werken."],
      basis: "Kortingscodes",
      link: { href: "/beheer/kortingscodes", label: "Naar de kortingscodes" },
      weight: 1,
    });
  }
  if (i.codes.length === 0 && a.kpis.activeSubs >= 5) {
    out.push({
      id: "code-geen",
      area: "marketing",
      impact: "laag",
      title: "Werk met kortingscodes voor partners",
      finding: "Je hebt nog geen kortingscodes. Een eigen code per influencer, sportschool of bedrijf laat precies zien wat elke partner oplevert.",
      actions: ["Maak per partner een code (bijv. 10% op de eerste maand) en deel de link /start?code=CODE."],
      basis: "Kortingscodes",
      link: { href: "/beheer/kortingscodes", label: "Maak een code" },
      weight: 1,
    });
  }
  const offerEnd = Date.parse(site.launchOffer.endsAt);
  if (site.launchOffer.enabled && offerEnd > nowMs && offerEnd - nowMs < 14 * DAY) {
    out.push({
      id: "actie-eindigt",
      area: "marketing",
      impact: "middel",
      title: `De ${site.launchOffer.label.toLowerCase()} eindigt binnenkort`,
      finding: `Nog ${n(Math.ceil((offerEnd - nowMs) / DAY))} dagen. Daarna betalen nieuwe klanten de normale prijs; de conversie kan dalen.`,
      actions: [
        "Communiceer de einddatum (\"nog 3 dagen\") in advertenties en een mail aan mensen die de vragenlijst invulden.",
        "Bedenk een vervolgactie, bijvoorbeeld een kortingscode voor partners.",
      ],
      basis: "Instellingen",
      link: { href: "/beheer/instellingen", label: "Bekijk de actie" },
      weight: 20,
    });
  }

  // ---------- Beheer ----------
  const o = i.overview;
  if (o.openGuaranteeRequests + o.openWithdrawals > 0) {
    out.push({
      id: "open-aanvragen",
      area: "beheer",
      impact: "hoog",
      title: "Er wachten aanvragen op afhandeling",
      finding: `${n(o.openGuaranteeRequests)} garantie-aanvra${o.openGuaranteeRequests === 1 ? "ag" : "gen"} en ${n(o.openWithdrawals)} herroeping${o.openWithdrawals === 1 ? "" : "en"}. Klanten verwachten binnen ${site.responseTimeDays} werkdagen antwoord.`,
      actions: ["Handel ze af via Herroepingen & garantie; terugbetalen kan met één knop."],
      basis: "Nu",
      link: { href: "/beheer/herroepingen", label: "Naar de aanvragen" },
      weight: (o.openGuaranteeRequests + o.openWithdrawals) * 10,
    });
  }
  if (i.approval && o.plansAwaitingApproval > 0) {
    out.push({
      id: "goedkeuren",
      area: "beheer",
      impact: "hoog",
      title: o.plansAwaitingApproval === 1 ? "1 schema wacht op jouw goedkeuring" : `${n(o.plansAwaitingApproval)} schema's wachten op jouw goedkeuring`,
      finding: "Klanten krijgen hun schema pas als jij het hebt goedgekeurd; de belofte is binnen 2 uur.",
      actions: ["Keur ze goed, of zet goedkeuren uit als de kwaliteit inmiddels stabiel is."],
      basis: "Nu",
      link: { href: "/beheer/schemas?status=goedkeuren", label: "Naar de schema's" },
      weight: o.plansAwaitingApproval * 10,
    });
  }

  const order: Record<KansImpact, number> = { hoog: 0, middel: 1, laag: 2 };
  out.sort((x, y) => order[x.impact] - order[y.impact] || y.weight - x.weight);
  const dataNote =
    visits < 100
      ? `Er zijn nog maar ${n(visits)} bezoeken gemeten in de laatste ${f.filters.days} dagen. Kansen over de funnel en bezoekers verschijnen vanaf ongeveer ${MIN_VISITS}-100 bezoeken en worden betrouwbaarder naarmate er meer gegevens zijn.`
      : null;
  return { kansen: out, strengths: good, dataNote };
}

/** Haalt alle cijfers op die de kansen nodig hebben. */
export async function opportunityInput(): Promise<OpportunityInput> {
  const demo = isDemoMode();
  const [funnel, analytics, visitors, feedback, overview, failed, skipped, codes, reminder, approval] = await Promise.all([
    funnelReport({ days: 30 }),
    analyticsReport(),
    visitorsReport({ days: 30 }),
    feedbackReport(90),
    adminData().overview(),
    demo ? Promise.resolve([]) : emailLog({ status: "failed", limit: 500 }),
    demo ? Promise.resolve([]) : emailLog({ status: "skipped", limit: 500 }),
    discountCodes(),
    demo ? Promise.resolve({ enabled: true, delayHours: 3 }) : checkoutReminderSettings(),
    adminData().approvalRequired(),
  ]);
  const now = demo ? new Date("2027-02-15T10:00:00+01:00") : new Date();
  const recent = (rows: { createdAt: Date }[]) => rows.filter((r) => now.getTime() - r.createdAt.getTime() < 30 * DAY).length;
  return {
    funnel,
    analytics,
    visitors,
    feedback,
    overview,
    failedEmails: recent(failed),
    skippedEmails: recent(skipped.filter((r) => r.kind !== "admin")),
    codes,
    reminder,
    approval,
    now,
  };
}

// ---------- Verbergen ----------

const HIDDEN_KEY = "kansen_verborgen";
const HIDE_DAYS = 30;

/** Kansen die de beheerder heeft verborgen, met de datum tot wanneer. */
export async function hiddenOpportunities(): Promise<Record<string, string>> {
  if (isDemoMode()) return {};
  const saved = (await getSetting<Record<string, string>>(HIDDEN_KEY).catch(() => null)) ?? {};
  const now = Date.now();
  return Object.fromEntries(Object.entries(saved).filter(([, until]) => Date.parse(until) > now));
}

export async function hideOpportunity(id: string): Promise<void> {
  const current = await hiddenOpportunities();
  await setSetting(HIDDEN_KEY, { ...current, [id.slice(0, 120)]: new Date(Date.now() + HIDE_DAYS * DAY).toISOString() });
}

export async function showAllOpportunities(): Promise<void> {
  await setSetting(HIDDEN_KEY, {});
}

// ---------- Advies van Claude ----------

export const aiAdviceSchema = z.object({
  summary: z.string().describe("Twee à drie zinnen: de belangrijkste conclusie uit de cijfers"),
  items: z
    .array(
      z.object({
        title: z.string().describe("Korte titel van de verbetering"),
        area: z.enum(["funnel", "vragenlijst", "afrekenen", "bezoekers", "marketing", "behoud", "tevredenheid", "schemas", "email", "beheer"]),
        impact: z.enum(["hoog", "middel", "laag"]),
        why: z.string().describe("Waarom: welke cijfers wijzen hierop"),
        actions: z.array(z.string()).describe("Concrete stappen, elk één zin"),
        measure: z.string().describe("Hoe je meet of het werkt (welk cijfer in het beheer)"),
      }),
    )
    .describe("5 tot 8 verbeteringen, de belangrijkste eerst"),
});

export type AiAdvice = z.infer<typeof aiAdviceSchema> & { at: string };

const AI_KEY = "kansen_ai";

export const DEMO_AI_ADVICE: AiAdvice = {
  at: "2027-02-15T09:12:00+01:00",
  summary:
    "De grootste winst zit tussen de plankeuze en betalen: van de mensen die de plannen zien, betaalt maar een op de elf. Daarnaast converteert mobiel duidelijk slechter dan desktop, terwijl 71% van je bezoek mobiel is.",
  items: [
    {
      title: "Vereenvoudig het afrekenblok op mobiel",
      area: "afrekenen",
      impact: "hoog",
      why: "214 mensen kozen een plan, 92 klikten op betalen (43%). Op mobiel is de conversie 1,3% tegen 2,4% op desktop.",
      actions: [
        "Vervang de drie lange vinkteksten door korte zinnen met een link naar de volledige tekst.",
        "Maak de betaalknop sticky onderin beeld zodra een plan is gekozen.",
        "Zet de prijs per week en de 14-dagengarantie direct boven de knop.",
      ],
      measure: "Funnel: stap \"Op betalen geklikt\" ten opzichte van \"Plan gekozen\", apart voor mobiel.",
    },
    {
      title: "Stuur Meta-verkeer naar /lp in plaats van de homepage",
      area: "marketing",
      impact: "hoog",
      why: "Bezoekers die op /lp binnenkomen worden in 2,0% van de gevallen klant, op de homepage 1,5%. Meta levert 45% van je bezoek.",
      actions: ["Zet alle Meta-advertenties op /lp of /lp/voeding met utm-gegevens.", "Test een tweede kop op /lp."],
      measure: "Bezoekers: instappagina's, conversie per pagina.",
    },
    {
      title: "Leg bij het resultaat uit waarom we je e-mailadres vragen",
      area: "vragenlijst",
      impact: "middel",
      why: "Bij \"Persoonlijk resultaat\" haken 31 mensen af; dit is de stap waar naam en e-mail worden gevraagd.",
      actions: ["Voeg toe: \"We sturen je schema naar dit adres. Geen spam, afmelden kan altijd.\""],
      measure: "Funnel: afhakers bij de vraag \"Persoonlijk resultaat\".",
    },
    {
      title: "Bied opzeggers die het te duur vinden een alternatief",
      area: "behoud",
      impact: "middel",
      why: "\"Te duur\" is de meest genoemde opzegreden.",
      actions: ["Maak een kortingscode \"BLIJF20\" (20% de eerste 2 maanden) en noem die in de opzegbevestiging voor deze groep."],
      measure: "Analyse: opzeggingen per maand en opzegredenen.",
    },
    {
      title: "Zet het advertentiebudget vooral 's avonds in",
      area: "marketing",
      impact: "laag",
      why: "De meeste bezoeken en bestellingen vallen tussen 19:00 en 22:00, het drukst op zondag en maandag.",
      actions: ["Plan in Meta en Google een hoger budget tussen 18:00 en 23:00, en stuur mails op zondagavond."],
      measure: "Bezoekers en Funnel: heatmaps per uur, en de conversie per bron.",
    },
  ],
};

export async function aiAdvice(): Promise<AiAdvice | null> {
  if (isDemoMode()) return DEMO_AI_ADVICE;
  return getSetting<AiAdvice>(AI_KEY).catch(() => null);
}

/** Alleen opgetelde cijfers: geen namen, e-mailadressen of letterlijke opmerkingen van klanten. */
export function opportunitySummary(i: OpportunityInput, kansen: Kans[]): string {
  const f = i.funnel;
  const v = i.visitors;
  const a = i.analytics;
  const lines: string[] = [];
  lines.push(`# Bedrijf`);
  lines.push(
    `${site.name}: persoonlijke voedings- en trainingsschema's als abonnement (per maand of met minimale looptijd van 3, 6 of 12 maanden) of los. Gemaakt met software op basis van een vragenlijst, binnen 2 uur geleverd, ${site.guarantee.days} dagen geld-terug-garantie. Nederland, vooral via advertenties naar landingspagina's /lp, /lp/voeding en /lp/training.`,
  );
  lines.push(
    `Prijzen per maand (incl. btw): ${PRODUCT_IDS.map(
      (p) =>
        `${products[p].shortName}: ${[...SUBSCRIPTION_DURATIONS, "eenmalig" as const]
          .map((d) => `${d === "eenmalig" ? "los" : d} € ${(monthlyPrice(p, d) / 100).toFixed(2)}`)
          .join(", ")}`,
    ).join("; ")}. Lanceringsactie: ${site.launchOffer.enabled ? `${site.launchOffer.percentOff}% op de eerste betaling, ${site.launchOffer.startsAt.slice(0, 10)} t/m ${site.launchOffer.endsAt.slice(0, 10)}` : "uit"}.`,
  );
  lines.push(`\n# Funnel (laatste ${f.filters.days} dagen)`);
  lines.push(f.stages.map((s) => `${s.label}: ${s.count}`).join("; "));
  lines.push(`Afhakers per vraag (laatste vraag van het bezoek): ${f.steps.map((s) => `${s.label} ${s.leftHere}/${s.reached}`).join("; ")}`);
  lines.push(`Per bron (bezoeken/vragenlijst/betaalpagina/betaald): ${f.bySource.map((s) => `${s.key || "direct"} ${s.visits}/${s.quiz}/${s.checkout}/${s.orders}`).join("; ")}`);
  lines.push(`Per apparaat: ${f.byDevice.map((s) => `${s.key} ${s.visits}/${s.quiz}/${s.checkout}/${s.orders}`).join("; ")}`);
  lines.push(`Per plan (betaalpagina/betaald): ${f.byPlan.map((p) => `${planName(p.product, p.duration)} ${p.checkouts}/${p.orders}`).join("; ")}`);
  lines.push(`Niet-afgeronde betalingen: ${f.abandoned.length}, waarvan met toestemming voor e-mail: ${f.abandoned.filter((x) => x.marketing).length}. Herinnering: ${i.reminder.enabled ? `aan, na ${i.reminder.delayHours} uur` : "uit"}.`);
  lines.push(`Mediaan tijd van eerste bezoek tot betaling: ${f.medianMinutesToOrder ?? "onbekend"} minuten.`);
  lines.push(`\n# Bezoekers (laatste ${v.days} dagen, tussen haakjes de ${v.days} dagen ervoor)`);
  const kp = (x: number | null, pct = false) => (x === null ? "–" : pct ? `${(x * 100).toFixed(1)}%` : x.toFixed(1));
  lines.push(
    `Bezoeken ${v.kpis.visits} (${v.previous.visits}); paginaweergaven ${v.kpis.pageviews} (${v.previous.pageviews}); bounce ${kp(v.kpis.bounceRate, true)} (${kp(v.previous.bounceRate, true)}); gem. duur ${kp(v.kpis.avgSeconds)} s; naar vragenlijst ${kp(v.kpis.startShare, true)}; conversie ${kp(v.kpis.conversion, true)} (${kp(v.previous.conversion, true)}); mobiel ${kp(v.kpis.mobileShare, true)}.`,
  );
  lines.push(`Kanalen (bezoeken/bounce/vragenlijst/betaald): ${v.channels.map((c) => `${CHANNEL_LABELS[c.key]} ${c.visits}/${c.bounces}/${c.toStart}/${c.purchases}`).join("; ")}`);
  lines.push(`Instappagina's (bezoeken/bounce/vragenlijst/betaald): ${v.entries.map((e) => `${e.key} ${e.visits}/${e.bounces}/${e.toStart}/${e.purchases}`).join("; ")}`);
  lines.push(`Pagina's (weergaven/gem. seconden/laatste pagina van bezoek): ${v.pages.slice(0, 15).map((p) => `${p.path} ${p.views}/${p.avgSeconds === null ? "–" : Math.round(p.avgSeconds)}/${p.exits}`).join("; ")}`);
  lines.push(`Verwijzende websites: ${v.referrers.map((r) => `${r.host} ${r.visits}`).join("; ") || "geen"}`);
  lines.push(`Talen: ${v.languages.map((l) => `${l.key} ${l.visits}/${l.purchases}`).join("; ")}`);
  lines.push(`\n# Omzet en abonnementen`);
  lines.push(
    `MRR € ${(a.kpis.mrrCents / 100).toFixed(0)}, ${a.kpis.activeSubs} actieve abonnementen, ARPU € ${((a.kpis.arpuCents ?? 0) / 100).toFixed(2)}, churn 30 dagen ${kp(a.kpis.churn30, true)}, klantwaarde € ${((a.kpis.ltvCents ?? 0) / 100).toFixed(0)}, omzet 30 dagen € ${(a.kpis.revenue30Cents / 100).toFixed(0)}, terugbetaald € ${(a.kpis.refunds30Cents / 100).toFixed(0)}, garantie-aanvragen ${a.kpis.guaranteeRequests30}.`,
  );
  lines.push(`Verkochte plannen (12 mnd): ${a.mix.map((m) => `${planName(m.product, m.duration)} ${m.count}`).join("; ")}`);
  lines.push(`Opzegredenen: ${a.cancelReasons.map((r) => `${cancelReasonLabel(r.reason)} ${r.count}`).join("; ") || "nog geen"}`);
  lines.push(`Behoud per startmaand (aandeel nog klant na 0..n maanden): ${a.cohorts.filter((c) => c.size > 0).map((c) => `${c.month} (${c.size}): ${c.retention.filter((x) => x !== null).map((x) => `${Math.round((x ?? 0) * 100)}%`).join(" ")}`).join("; ")}`);
  lines.push(
    `Betrokkenheid: check-ins 90 dagen ${a.engagement.checkins90} (op tijd ${a.engagement.checkinsOnTime90}), verlopen ${a.engagement.checkinsOverdue}, weegmomenten 30 dagen ${a.engagement.weekly30}, herinneringen uit ${a.engagement.weeklyOptOut}, gekoppelde apps ${a.engagement.healthConnections.reduce((s, c) => s + c.count, 0)}.`,
  );
  lines.push(`Resultaten: ${a.results.customers} klanten met metingen, gem. verandering ${a.results.avgChangeKg ?? "–"} kg, aandeel afgevallen ${kp(a.results.lostShare, true)}, streefgewicht bereikt ${a.results.reachedTarget}.`);
  lines.push(`Schema's: ${a.plans.generated30} gemaakt in 30 dagen, mislukt ${a.plans.failed}, beoordeling beheerder ${a.plans.avgRating ?? "–"} (${a.plans.rated}).`);
  lines.push(`\n# Feedback uit check-ins (90 dagen, aantallen per antwoord)`);
  for (const d of i.feedback.distributions) lines.push(`${d.label}: ${d.answers.map((x) => `${x.answer} ${x.count}`).join("; ")}`);
  const dislikes = topDislikes(i.feedback);
  if (dislikes.length) lines.push(`Vaak genoemd als niet lekker: ${dislikes.map((x) => `${x.word} ${x.count}`).join(", ")}`);
  lines.push(`\n# E-mail en codes`);
  lines.push(`Mislukte mails 30 dagen: ${i.failedEmails}; niet verstuurd (geen SMTP): ${i.skippedEmails}.`);
  lines.push(`Kortingscodes: ${i.codes.map((c) => `${c.code} ${c.checkouts} geopend/${c.redemptions} betaald`).join("; ") || "geen"}`);
  lines.push(`\n# Wat de vaste regels al signaleren`);
  lines.push(kansen.map((k) => `- [${k.impact}] ${k.title}: ${k.finding}`).join("\n") || "- niets");
  return lines.join("\n");
}

const AI_SYSTEM = `Je bent een ervaren groei- en conversiespecialist voor Nederlandse webwinkels met abonnementen, met kennis van gezondheid en leefstijl.
Je krijgt opgetelde, geanonimiseerde cijfers uit het beheer van een website die persoonlijke voedings- en trainingsschema's verkoopt.
Geef 5 tot 8 concrete verbeteringen voor de website, de marketing en het behoud van klanten. De belangrijkste (grootste verwachte winst) eerst.

Regels:
- Baseer elke verbetering op de cijfers en noem die cijfers bij "why". Verzin geen cijfers. Zijn er te weinig gegevens, zeg dat dan in de samenvatting en geef voorzichtige adviezen.
- Wees concreet: wat moet er op welke pagina of in welke mail veranderen. Eén zin per stap.
- Herhaal niet letterlijk wat de vaste regels al signaleren; vul ze aan, of maak ze concreter als ze het belangrijkst zijn.
- Houd je aan de Nederlandse regels: geen resultaatgaranties of misleidende claims over afvallen, geen medische claims, toestemming voor marketingmail, eerlijke prijsvermelding (ACM), opzeggen moet makkelijk blijven.
- Schrijf in eenvoudig Nederlands, in de je-vorm, zonder vakjargon.`;

/** Vraagt Claude om advies op basis van de cijfers en bewaart het resultaat. */
export async function generateAiAdvice(): Promise<AiAdvice> {
  const input = await opportunityInput();
  const { kansen } = buildOpportunities(input);
  const { generateStructured } = await import("@/lib/ai/generate");
  const result = await generateStructured(aiAdviceSchema, AI_SYSTEM, opportunitySummary(input, kansen), { effort: "medium", maxTokens: 16000 });
  const advice: AiAdvice = { ...result, at: new Date().toISOString() };
  await setSetting(AI_KEY, advice);
  return advice;
}
