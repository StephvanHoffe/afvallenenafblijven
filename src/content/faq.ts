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
    a: "Direct na je betaling gaan we aan de slag. Meestal staat je schema binnen 10 minuten voor je klaar: je ziet het meteen op je scherm en je ontvangt een e-mail met een persoonlijke link. Je kunt elk schema ook downloaden als PDF, met een aparte boodschappenlijst om af te vinken.",
  },
  {
    q: "Hoe persoonlijk is het schema?",
    a: "Heel persoonlijk. Je beantwoordt vragen over je doel, lengte, gewicht, leeftijd, dagelijkse activiteit, eetvoorkeuren, allergieën, kooktijd, budget, trainingsplek, ervaring en eventuele blessures. Op basis daarvan berekenen we jouw persoonlijke calorie- en eiwitdoel en wordt elk gerecht en elke oefening op jou afgestemd.",
  },
  {
    q: "Hoe werkt een abonnement van 3, 6 of 12 maanden?",
    a: "Je betaalt altijd per maand via automatische incasso. Kies je een minimale looptijd van 3, 6 of 12 maanden, dan krijg je een lagere maandprijs. Elke 4 weken krijg je een nieuw schema: aan het einde van elke periode vul je een korte check-in in, en daarop maken we je volgende schema. Na de minimale looptijd loopt je abonnement door tegen dezelfde maandprijs, en kun je het op elk moment opzeggen met een opzegtermijn van maximaal een maand.",
  },
  {
    q: "Kan ik makkelijk opzeggen?",
    a: "Ja. Je zegt op via 'Mijn schema's' of via de pagina 'Abonnement opzeggen', in een paar klikken. Een maandabonnement is maandelijks opzegbaar. Heb je een minimale looptijd gekozen, dan stopt je abonnement aan het einde daarvan; daarna is het maandelijks opzegbaar. Je houdt toegang tot alle schema's die je al hebt ontvangen.",
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
    a: "Een abonnement betaal je per maand via automatische incasso (SEPA). De eerste maand betaal je met iDEAL | Wero, Bancontact of je IBAN; daarmee geef je meteen toestemming voor de maandelijkse afschrijving. Een los schema betaal je eenmalig met iDEAL | Wero, Bancontact of creditcard. Alle betalingen lopen veilig via Stripe en je ontvangt automatisch een factuur per e-mail.",
  },
  ...guarantee,
  {
    q: "Wat als ik niet afval?",
    a: "Aan het einde van elke periode vul je een korte check-in in met je gewicht en hoe het ging (honger, energie, slaap, haalbaarheid). Je volgende schema stellen we daarop bij: valt je gewicht minder snel dan gepland terwijl je het schema goed volgde, dan verlagen we je calorieën iets; gaat het te snel of heb je veel honger, dan juist iets omhoog. In elk voedingsschema staat bovendien hoe je tussentijds zelf kleine aanpassingen doet.",
  },
  {
    q: "Is de check-in verplicht?",
    a: "Ja, en dat is juist de kracht ervan. Je nieuwe schema maken we pas als je de check-in hebt ingevuld, zodat het echt past bij je voortgang in plaats van een standaard vervolg. De check-in opent een paar dagen voor het einde van je periode; je krijgt dan een e-mail en zo nodig een herinnering. Invullen kost ongeveer 2 minuten. Direct daarna maken we je nieuwe schema.",
  },
  {
    q: "Wat betekent 'afblijven'?",
    a: "Afvallen is één ding, je resultaat vasthouden is minstens zo belangrijk. Heb je je streefgewicht bereikt, dan kies je in je volgende check-in het doel 'Op gewicht blijven'. Je schema wordt dan omgezet naar een onderhoudsplan, zodat je niet terugvalt in oude patronen en het jojo-effect voorkomt.",
  },
];
