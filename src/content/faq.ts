import { site } from "@/config/site";
import { defineCopy, type Locale } from "@/i18n/config";
import { isHealthEnabled } from "@/lib/health/config";

export interface FaqItem {
  q: string;
  a: string;
}

/** Vaste sleutels van de vragen, zodat pagina's per taal dezelfde selectie tonen. */
export type FaqId =
  | "snel"
  | "persoonlijk"
  | "abonnement"
  | "opzeggen"
  | "allergie"
  | "thuis"
  | "medisch"
  | "betalen"
  | "garantie"
  | "resultaat"
  | "periode"
  | "weegmoment"
  | "koppelen"
  | "niet-afvallen"
  | "check-in"
  | "afblijven";

const ORDER: FaqId[] = [
  "snel",
  "persoonlijk",
  "abonnement",
  "opzeggen",
  "allergie",
  "thuis",
  "medisch",
  "betalen",
  "garantie",
  "resultaat",
  "periode",
  "weegmoment",
  "koppelen",
  "niet-afvallen",
  "check-in",
  "afblijven",
];

const days = site.guarantee.days;

const items = defineCopy<Record<FaqId, FaqItem>>({
  nl: {
    snel: {
      q: "Hoe snel ontvang ik mijn schema?",
      a: "Direct na je betaling gaan we aan de slag. Binnen 2 uur staat je schema voor je klaar in Mijn schema's en ontvang je een e-mail met een persoonlijke link. Je kunt elk schema ook downloaden als PDF, met een aparte boodschappenlijst om af te vinken.",
    },
    persoonlijk: {
      q: "Hoe persoonlijk is het schema?",
      a: "Heel persoonlijk. Je beantwoordt vragen over je doel, lengte, gewicht, leeftijd, dagelijkse activiteit, eetvoorkeuren, allergieën, kooktijd, budget, trainingsplek, ervaring en eventuele blessures. Op basis daarvan berekenen we jouw persoonlijke calorie- en eiwitdoel en wordt elk gerecht en elke oefening op jou afgestemd.",
    },
    abonnement: {
      q: "Hoe werkt een abonnement van 3, 6 of 12 maanden?",
      a: "Je betaalt altijd per maand via automatische incasso. Kies je een minimale looptijd van 3, 6 of 12 maanden, dan krijg je een lagere maandprijs. Elke 4 weken krijg je een nieuw schema: aan het einde van elke periode vul je een korte check-in in, en daarop maken we je volgende schema. Na de minimale looptijd loopt je abonnement door tegen dezelfde maandprijs, en kun je het op elk moment opzeggen met een opzegtermijn van maximaal een maand.",
    },
    opzeggen: {
      q: "Kan ik makkelijk opzeggen?",
      a: "Ja. Je zegt op via 'Mijn schema's' of via de pagina 'Abonnement opzeggen', in een paar klikken. Een maandabonnement is maandelijks opzegbaar. Heb je een minimale looptijd gekozen, dan stopt je abonnement aan het einde daarvan; daarna is het maandelijks opzegbaar. Je houdt toegang tot alle schema's die je al hebt ontvangen.",
    },
    allergie: {
      q: "Ik ben vegetariër, veganist of heb een allergie. Kan dat?",
      a: "Zeker. Je geeft je eetpatroon en allergieën of intoleranties op in de vragenlijst (zoals gluten, lactose, noten, pinda, ei, soja, vis of schaaldieren) en ook wat je niet lust. Die producten houden we buiten je schema, en we lopen elk voedingsschema daar nog eens extra op na. We houden wel alleen rekening met wat je opgeeft: vul je allergieën dus volledig in. Controleer daarnaast altijd zelf de ingrediënten en de etiketten van wat je koopt; samenstellingen verschillen per merk en kunnen veranderen.",
    },
    thuis: {
      q: "Ik heb geen sportschool. Werkt het trainingsschema ook thuis?",
      a: "Ja. Je kiest of je thuis traint zonder materiaal, thuis met wat materiaal (zoals dumbbells of elastieken) of in de sportschool. Je schema bevat alleen oefeningen die bij jouw situatie passen, met duidelijke uitleg en makkelijkere alternatieven.",
    },
    medisch: {
      q: "Is het veilig als ik een medische aandoening heb?",
      a: "Heb je een aandoening zoals diabetes, hart- en vaatziekten of nierproblemen, gebruik je medicatie, of ben je zwanger? Overleg dan altijd eerst met je arts. Bij zwangerschap, borstvoeding of een (verleden met een) eetstoornis maken we bewust geen schema; begeleiding door een professional is dan beter.",
    },
    betalen: {
      q: "Hoe kan ik betalen?",
      a: "Een abonnement betaal je per maand via automatische incasso (SEPA). De eerste maand betaal je met iDEAL | Wero of Bancontact; daarmee geef je meteen toestemming voor de maandelijkse afschrijving. Een los schema betaal je eenmalig met iDEAL | Wero, Bancontact of creditcard. Alle betalingen lopen veilig via onze betaalpartner Mollie. Je krijgt een betaalbevestiging per e-mail en al je facturen (inclusief btw) vind je in Mijn schema's onder Betalingen.",
    },
    garantie: {
      q: "Wat als het schema me niet bevalt?",
      a: `Dan krijg je je geld terug. Je hebt ${days} dagen tevredenheidsgarantie op je eerste betaling: vraag binnen ${days} dagen na je aankoop je geld terug in Mijn schema's (tabblad Abonnement) of stuur ons een mailtje, en we betalen het volledige bedrag van die eerste betaling terug. Zonder gedoe.`,
    },
    resultaat: {
      q: "Is het resultaat gegarandeerd?",
      a: "Nee, en eerlijk gezegd kan niemand dat beloven. Je koopt een persoonlijk schema en begeleiding, geen gegarandeerd resultaat. Hoeveel je afvalt of aan spiermassa opbouwt, verschilt per persoon en hangt onder meer af van je lichaam, je gezondheid, je omstandigheden en hoe goed je het schema volgt. Prognoses en voorbeelden op de site zijn schattingen. Wat we wél doen: je schema afstemmen op jou en het bijsturen op je voortgang.",
    },
    periode: {
      q: "Hoe lang duurt een periode, en krijg ik elke week een nieuw schema?",
      a: "Een periode duurt 4 weken en start op maandag. Je krijgt per periode één voedingsschema en/of trainingsschema. Het voedingsschema is een weekmenu van maandag tot en met zondag dat je 4 weken volgt, met een boodschappenlijst per week. Het trainingsschema bouwt in 4 weken op, met per week een duidelijke stap. Elke week, het liefst in het weekend, vul je een weegmoment in; wijkt je voortgang af, dan sturen we het lopende schema meteen bij, op tijd voor je boodschappen. Vanaf de donderdag voor een nieuwe periode vul je de check-in in. Doe je dat uiterlijk zaterdag, dan staat je nieuwe schema met boodschappenlijst klaar voordat de nieuwe week begint. Je eerste periode start direct na je bestelling en loopt tot de maandag die het dichtst bij 4 weken later ligt.",
    },
    weegmoment: {
      q: "Wat gebeurt er met mijn wekelijkse weegmoment?",
      a: "Je vult je gewicht in en, als je wilt, je taille, energie, honger, hoe goed het schema lukte en hoe zwaar de trainingen voelden. Daalt je gewicht minder snel dan gepland terwijl je het schema goed volgt, dan eet je vanaf dat moment ongeveer 100 kcal per dag minder; gaat het te snel of heb je veel honger, dan juist meer. Vond je de trainingen te licht of te zwaar, dan passen we de gewichten of herhalingen aan. Je ziet precies wat er verandert, bovenaan je schema en in de PDF. We sturen in kleine stappen en nooit onder een veilig minimum.",
    },
    koppelen: {
      q: "Kan ik mijn Apple Watch, Garmin of slimme weegschaal koppelen?",
      a: "Ja, als je dat wilt. In Mijn schema's koppel je Apple Health (iPhone en Apple Watch), Garmin, Fitbit, Oura, Polar of een Withings-weegschaal. Dan zie je hoeveel je echt beweegt en traint en wat dat oplevert, vullen we je weegmoment en check-in alvast in, en stemmen we je caloriedoel af op je gemeten activiteit. We halen alleen stappen, trainingen en gewicht op, en ontkoppelen kan altijd. Zonder koppeling werkt alles ook gewoon.",
    },
    "niet-afvallen": {
      q: "Wat als ik niet afval?",
      a: "Aan het einde van elke periode vul je een korte check-in in met je gewicht en hoe het ging (honger, energie, slaap, haalbaarheid). Je volgende schema stellen we daarop bij: valt je gewicht minder snel dan gepland terwijl je het schema goed volgde, dan verlagen we je calorieën iets; gaat het te snel of heb je veel honger, dan juist iets omhoog. In elk voedingsschema staat bovendien hoe je tussentijds zelf kleine aanpassingen doet.",
    },
    "check-in": {
      q: "Is de check-in verplicht?",
      a: "Ja, en dat is juist de kracht ervan. Je nieuwe schema maken we pas als je de check-in hebt ingevuld, zodat het echt past bij je voortgang in plaats van een standaard vervolg. De check-in opent op de donderdag voor je nieuwe periode (die altijd op maandag start); je krijgt dan een e-mail en zo nodig een herinnering. Invullen kost ongeveer 2 minuten; binnen 2 uur daarna staat je nieuwe schema klaar. Vul je hem uiterlijk zaterdag in, dan staat het met boodschappenlijst op tijd klaar voor je boodschappen in het weekend. Eerder maken we het bewust niet, zodat het aansluit op hoe het nu met je gaat.",
    },
    afblijven: {
      q: "Wat betekent 'afblijven'?",
      a: "Afvallen is één ding, je resultaat vasthouden is minstens zo belangrijk. Heb je je streefgewicht bereikt, dan kies je in je volgende check-in het doel 'Op gewicht blijven'. Je schema wordt dan omgezet naar een onderhoudsplan, dat je helpt om niet terug te vallen in oude patronen en het jojo-effect te voorkomen.",
    },
  },
  en: {
    snel: {
      q: "How quickly will I get my plan?",
      a: "We get started the moment you've paid. Within 2 hours, your plan is ready for you in My plans and you'll receive an email with a personal link. You can also download every plan as a PDF, with a separate shopping list to tick off.",
    },
    persoonlijk: {
      q: "How personal is the plan?",
      a: "Very personal. You answer questions about your goal, height, weight, age, daily activity, food preferences, allergies, cooking time, budget, where you train, your experience and any injuries. Based on your answers, we calculate your personal calorie and protein targets, and every dish and every exercise is tailored to you.",
    },
    abonnement: {
      q: "How does a 3, 6 or 12-month subscription work?",
      a: "You always pay monthly by direct debit. Choose a minimum term of 3, 6 or 12 months and you get a lower monthly price. You receive a new plan every 4 weeks: at the end of each period you complete a short check-in, and we use it to create your next plan. After the minimum term, your subscription continues at the same monthly price and you can cancel at any time, with a notice period of no more than one month.",
    },
    opzeggen: {
      q: "Is it easy to cancel?",
      a: "Yes. You can cancel in a few clicks via 'My plans' or the 'Cancel subscription' page. A monthly subscription can be cancelled any month. If you chose a minimum term, your subscription ends when that term is over; after that, you can cancel monthly. You keep access to all the plans you've already received.",
    },
    allergie: {
      q: "I'm vegetarian or vegan, or I have an allergy. Is that OK?",
      a: "Absolutely. In the questionnaire you tell us how you eat and about any allergies or intolerances (such as gluten, lactose, tree nuts, peanuts, egg, soy, fish or shellfish), plus any foods you don't like. We keep those products out of your plan, and we check every nutrition plan for them once more. We can only take into account what you tell us, though, so list all your allergies. And always check the ingredients and labels of what you buy yourself; recipes differ between brands and can change.",
    },
    thuis: {
      q: "I don't have a gym. Does the workout plan work at home too?",
      a: "Yes. You choose whether you train at home without equipment, at home with some equipment (such as dumbbells or resistance bands) or at the gym. Your plan only includes exercises that suit your situation, with clear instructions and easier alternatives.",
    },
    medisch: {
      q: "Is it safe if I have a medical condition?",
      a: "Do you have a condition such as diabetes, cardiovascular disease or kidney problems, do you take medication, or are you pregnant? Then always talk to your doctor first. If you're pregnant, breastfeeding or have (a history of) an eating disorder, we deliberately don't create a plan; support from a professional is the better choice in that case.",
    },
    betalen: {
      q: "How can I pay?",
      a: "A subscription is paid monthly by direct debit (SEPA). You pay the first month with iDEAL | Wero or Bancontact, which also authorises the monthly direct debit. A one-off plan is paid in a single payment with iDEAL | Wero, Bancontact or credit card. All payments are processed securely by our payment partner Mollie. You'll receive a payment confirmation by email, and you'll find all your invoices (including VAT) in My plans under Payments.",
    },
    garantie: {
      q: "What if I'm not happy with my plan?",
      a: `Then you get your money back. You have a ${days}-day satisfaction guarantee on your first payment: within ${days} days of your purchase, request your money back in My plans (Subscription tab) or just email us, and we'll refund the full amount of that first payment. No hassle.`,
    },
    resultaat: {
      q: "Are results guaranteed?",
      a: "No, and honestly, nobody can promise that. You're buying a personal plan and guidance, not a guaranteed result. How much weight you lose or muscle you build varies from person to person and depends on factors such as your body, your health, your circumstances and how closely you follow the plan. Projections and examples on the site are estimates. What we do: tailor your plan to you and adjust it based on your progress.",
    },
    periode: {
      q: "How long is a period, and do I get a new plan every week?",
      a: "A period lasts 4 weeks and starts on a Monday. Each period you receive one nutrition plan and/or workout plan. The nutrition plan is a Monday-to-Sunday meal plan that you follow for 4 weeks, with a shopping list for each week. The workout plan builds up over 4 weeks, with a clear step forward each week. Every week, ideally at the weekend, you log your weekly weigh-in; if your progress is off track, we adjust your current plan straight away, in time for your shopping. From the Thursday before a new period, you can complete the check-in. Do it by Saturday, and your new plan with shopping list will be ready before the new week begins. Your first period starts straight after your order and runs until the Monday closest to 4 weeks later.",
    },
    weegmoment: {
      q: "What happens with my weekly weigh-in?",
      a: "You enter your weight and, if you like, your waist, energy, hunger, how well you stuck to the plan and how hard the workouts felt. If your weight is dropping more slowly than planned while you're following the plan well, you'll eat about 100 kcal less per day from then on; if it's going too fast or you're very hungry, you'll eat more instead. If the workouts felt too light or too heavy, we adjust the weights or reps. You see exactly what changes, at the top of your plan and in the PDF. We adjust in small steps and never go below a safe minimum.",
    },
    koppelen: {
      q: "Can I connect my Apple Watch, Garmin or smart scale?",
      a: "Yes, if you'd like to. In My plans you can connect Apple Health (iPhone and Apple Watch), Garmin, Fitbit, Oura, Polar or a Withings scale. You'll then see how much you really move and train and what it achieves, we pre-fill your weekly weigh-in and check-in, and we match your calorie target to your measured activity. We only fetch steps, workouts and weight, and you can disconnect at any time. Everything works just as well without a connection.",
    },
    "niet-afvallen": {
      q: "What if I'm not losing weight?",
      a: "At the end of each period you complete a short check-in with your weight and how things went (hunger, energy, sleep, how doable it was). We adjust your next plan accordingly: if your weight dropped more slowly than planned while you followed the plan well, we lower your calories slightly; if it's going too fast or you're very hungry, we raise them a little instead. Every nutrition plan also explains how to make small adjustments yourself in between.",
    },
    "check-in": {
      q: "Is the check-in required?",
      a: "Yes, and that's exactly what makes it work. We only create your new plan once you've completed the check-in, so it truly matches your progress instead of being a standard follow-up. The check-in opens on the Thursday before your new period (which always starts on a Monday); you'll get an email and, if needed, a reminder. It takes about 2 minutes to complete, and your new plan will be ready within 2 hours. Fill it in by Saturday, and your plan with shopping list will be ready in time for your weekend shopping. We deliberately don't create it any earlier, so it matches how you're doing right now.",
    },
    afblijven: {
      q: "What does 'afblijven' (keeping it off) mean?",
      a: "Losing weight is one thing; holding on to your results matters at least as much. Once you've reached your target weight, choose the goal 'Maintain my weight' in your next check-in. Your plan then switches to a maintenance plan that helps you avoid slipping back into old habits and the yo-yo effect.",
    },
  },
});

/**
 * De veelgestelde vragen in de gegeven taal, in vaste volgorde. Met `ids`
 * alleen die vragen (de volgorde blijft die van de complete lijst).
 */
export function faqFor(l: Locale = "nl", ids?: FaqId[]): FaqItem[] {
  return ORDER.filter(
    (id) => (id !== "garantie" || site.guarantee.enabled) && (id !== "koppelen" || isHealthEnabled()) && (!ids || ids.includes(id)),
  ).map(
    (id) => items[l][id],
  );
}

/** Deze vragen in precies de gegeven volgorde (bijv. de grootste twijfels eerst). */
export function faqInOrder(l: Locale, ids: FaqId[]): FaqItem[] {
  const shown = new Set(faqFor(l, ids));
  return ids.map((id) => items[l][id]).filter((item) => shown.has(item));
}

export const faq: FaqItem[] = faqFor("nl");
