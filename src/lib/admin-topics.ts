/**
 * De meldingen die de website naar de beheerder stuurt. Elke soort staat bij
 * Beheer → E-mails → Meldingen aan jou, met de inhoud van elke melding. Per
 * soort kun je de mail uitzetten; de melding blijft dan wel zichtbaar in het
 * beheer.
 */
export interface AdminTopicInfo {
  id: string;
  group: string;
  label: string;
  /** Wanneer de melding komt. */
  trigger: string;
  /** Altijd aan (niet uit te zetten). */
  fixed?: boolean;
}

export const ADMIN_TOPICS = [
  {
    id: "nieuwe-bestelling",
    group: "Bestellingen en abonnementen",
    label: "Nieuwe bestelling",
    trigger: "Direct na een gelukte eerste betaling: een afgesloten abonnement of een los schema.",
  },
  {
    id: "opgezegd",
    group: "Bestellingen en abonnementen",
    label: "Abonnement opgezegd",
    trigger: "Als een klant zelf opzegt in Mijn schema's, met de einddatum en de reden.",
  },
  {
    id: "opzegging-ingetrokken",
    group: "Bestellingen en abonnementen",
    label: "Opzegging ingetrokken",
    trigger: "Als een klant een opzegging ongedaan maakt; het abonnement loopt dan gewoon door.",
  },
  {
    id: "opzegverzoek",
    group: "Bestellingen en abonnementen",
    label: "Opzegverzoek zonder inloggen",
    trigger: "Als iemand via de opzegpagina een opzegverzoek stuurt, ook als er geen klant bij dat adres hoort.",
  },
  {
    id: "betaling-mislukt",
    group: "Betalingen",
    label: "Maandelijkse betaling mislukt",
    trigger: "Als een automatische incasso mislukt. De klant krijgt ook een mail; Mollie probeert het daarna zelf opnieuw.",
  },
  {
    id: "abonnement-gestopt",
    group: "Betalingen",
    label: "Abonnement gestopt door Mollie",
    trigger: "Als Mollie een abonnement stopt na herhaald mislukte incasso's of een ingetrokken machtiging.",
  },
  {
    id: "terugboeking",
    group: "Betalingen",
    label: "Terugboeking door de bank",
    trigger: "Als een klant een betaling via de bank laat terugboeken.",
  },
  {
    id: "garantie",
    group: "Herroepen, garantie en contact",
    label: "Garantie-aanvraag",
    trigger: "Als een klant binnen de garantietermijn zijn eerste betaling terugvraagt.",
  },
  {
    id: "herroeping",
    group: "Herroepen, garantie en contact",
    label: "Herroeping ontvangen",
    trigger: "Als iemand de overeenkomst herroept via de herroepingsfunctie.",
  },
  {
    id: "contact",
    group: "Herroepen, garantie en contact",
    label: "Bericht via het contactformulier",
    trigger: "Als iemand het contactformulier invult. Beantwoorden kan direct vanuit je mail.",
  },
  {
    id: "schema-goedkeuren",
    group: "Schema's",
    label: "Schema wacht op je goedkeuring",
    trigger: "Als goedkeuren aanstaat en er een schema klaarstaat om te bekijken.",
  },
  {
    id: "schema-mislukt",
    group: "Schema's",
    label: "Schema kon niet worden gemaakt",
    trigger: "Als een schema na vijf pogingen nog niet is gelukt.",
  },
  {
    id: "test",
    group: "Overig",
    label: "Testmail",
    trigger: "Als je bij Instellingen een testmail stuurt.",
    fixed: true,
  },
] as const satisfies readonly AdminTopicInfo[];

export type AdminTopic = (typeof ADMIN_TOPICS)[number]["id"];

export function adminTopicInfo(id: string | null | undefined): AdminTopicInfo | undefined {
  return ADMIN_TOPICS.find((t) => t.id === id);
}

export function isAdminTopic(id: unknown): id is AdminTopic {
  return typeof id === "string" && ADMIN_TOPICS.some((t) => t.id === id);
}
