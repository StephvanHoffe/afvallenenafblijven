import { site } from "@/config/site";

export interface FaqItem {
  q: string;
  a: string;
}

const guarantee = site.guarantee.enabled
  ? [
      {
        q: "Wat als het schema me niet bevalt?",
        a: `Dan krijg je je geld terug. Je hebt ${site.guarantee.days} dagen tevredenheidsgarantie op je eerste betaling: stuur ons binnen ${site.guarantee.days} dagen na je aankoop een mailtje en we betalen het volledige bedrag van die eerste betaling terug. Zonder gedoe.`,
      },
    ]
  : [];

export const faq: FaqItem[] = [
  {
    q: "Hoe snel ontvang ik mijn schema?",
    a: "Direct na je betaling gaan we aan de slag. Meestal staat je schema binnen 10 minuten voor je klaar: je ziet het meteen op je scherm en je ontvangt een e-mail met een persoonlijke link. Je kunt het schema ook als PDF opslaan of printen.",
  },
  {
    q: "Hoe persoonlijk is het schema?",
    a: "Heel persoonlijk. Je beantwoordt vragen over je doel, lengte, gewicht, leeftijd, dagelijkse activiteit, eetvoorkeuren, allergieën, kooktijd, budget, trainingsplek, ervaring en eventuele blessures. Op basis daarvan berekenen we jouw persoonlijke calorie- en eiwitdoel en wordt elk gerecht en elke oefening op jou afgestemd.",
  },
  {
    q: "Wie of wat maakt de schema's?",
    a: "Je schema wordt gemaakt met Claude, de AI van Anthropic, aan de hand van onze instructies en de Richtlijnen goede voeding van de Gezondheidsraad. Jouw energie- en eiwitdoelen rekenen we vooraf zelf uit met erkende formules. Daarna controleert ons systeem elk voedingsschema automatisch op calorieën, eiwit en het aantal maaltijden; voldoet een schema niet, dan wordt het opnieuw gemaakt. Zo krijg je in een paar minuten een schema dat volledig op jou is afgestemd, voor een fractie van de prijs van persoonlijke begeleiding. Een schema van ons is geen medisch advies.",
  },
  {
    q: "Hoe werkt een abonnement van 3, 6 of 12 maanden?",
    a: "Je betaalt de eerste periode in één keer vooruit tegen een lagere maandprijs. In die periode krijg je elke 4 weken een nieuw schema, afgestemd op je voortgang. Na de eerste periode loopt je abonnement per maand door tegen dezelfde maandprijs, en kun je het op elk moment opzeggen met een opzegtermijn van maximaal een maand.",
  },
  {
    q: "Kan ik makkelijk opzeggen?",
    a: "Ja. Je zegt op via 'Mijn schema's' of via de pagina 'Abonnement opzeggen', in een paar klikken. Een maandabonnement is maandelijks opzegbaar; bij een langere looptijd zeg je op tegen het einde van die periode en daarna maandelijks. Je houdt toegang tot alle schema's die je al hebt ontvangen.",
  },
  {
    q: "Ik ben vegetariër, veganist of heb een allergie. Kan dat?",
    a: "Zeker. Je geeft je eetpatroon en allergieën of intoleranties op in de vragenlijst (zoals gluten, lactose, noten, pinda, ei, soja, vis of schaaldieren) en ook wat je niet lust. Die producten komen dan niet in je schema voor. Lees bij een ernstige allergie altijd zelf de etiketten van de producten die je koopt.",
  },
  {
    q: "Ik heb geen sportschool. Werkt het trainingsschema ook thuis?",
    a: "Ja. Je kiest of je thuis traint zonder materiaal, thuis met wat materiaal (zoals dumbbells of elastieken) of in de sportschool. Je schema bevat alleen oefeningen die bij jouw situatie passen, met duidelijke uitleg en makkelijkere alternatieven.",
  },
  {
    q: "Is het veilig als ik een medische aandoening heb?",
    a: "Heb je een aandoening zoals diabetes, hart- en vaatziekten of nierproblemen, gebruik je medicatie, of ben je zwanger? Overleg dan altijd eerst met je arts. Bij zwangerschap, borstvoeding of een (verleden met een) eetstoornis maken we bewust geen schema; begeleiding door een professional is dan beter.",
  },
  {
    q: "Hoe kan ik betalen?",
    a: "Je betaalt veilig via Stripe met iDEAL | Wero, Bancontact, creditcard of SEPA-incasso. Je ontvangt automatisch een factuur per e-mail.",
  },
  ...guarantee,
  {
    q: "Wat als ik niet afval?",
    a: "Na elke 4 weken vul je een korte check-in in met je gewicht en hoe het ging (honger, energie, haalbaarheid). Je volgende schema wordt daarop bijgestuurd. In elk voedingsschema staat bovendien uitgelegd hoe je zelf kleine aanpassingen doet als je gewicht niet of juist te snel daalt.",
  },
  {
    q: "Wat betekent 'afblijven'?",
    a: "Afvallen is één ding, je resultaat vasthouden is minstens zo belangrijk. Heb je je streefgewicht bereikt, dan kies je in je volgende check-in het doel 'Op gewicht blijven'. Je schema wordt dan omgezet naar een onderhoudsplan, zodat je niet terugvalt in oude patronen en het jojo-effect voorkomt.",
  },
];
