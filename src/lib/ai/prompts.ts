import type { NutritionTargets } from "@/lib/calculations";
import {
  activityOptions,
  allergyOptions,
  budgetOptions,
  conditionOptions,
  cookingTimeOptions,
  dietOptions,
  experienceOptions,
  goalOptions,
  locationOptions,
  paceOptions,
  sexOptions,
  type Intake,
} from "@/lib/intake";
import type { CheckinData } from "@/lib/checkin";
import { formatNumber } from "@/lib/format";

/** Context van een vorige periode, zodat elk nieuw schema voortbouwt op het vorige. */
export interface ProgressContext {
  periodNumber: number;
  previousSummary?: string;
  /** De (verplichte) check-in waarmee deze periode is aangevraagd. */
  checkin?: CheckinData;
  /** Gewichtsverloop over de vorige periode. */
  weight?: { fromKg: number; toKg: number; weeks: number; expectedKgPerWeek?: number };
  /** Bijstelling van het caloriedoel die we op basis van de check-in hebben berekend. */
  calorieChange?: { kcal: number; reason: string };
  /** Klachten die bij eerdere check-ins zijn gemeld. */
  earlierInjuries?: string[];
}

const WEEKDAYS = "Maandag, Dinsdag, Woensdag, Donderdag, Vrijdag, Zaterdag, Zondag";

export const NUTRITION_SYSTEM_PROMPT = `Je bent een ervaren, geregistreerd diëtist in Nederland die persoonlijke voedingsschema's maakt voor klanten van "Afvallen & Afblijven". Klanten betalen voor dit schema en verwachten kwaliteit die minstens zo goed is als een consult bij een diëtist: realistisch, lekker, haalbaar en exact afgestemd op hun doel.

Werkwijze en kwaliteitseisen:
- Baseer je op de Richtlijnen goede voeding van de Gezondheidsraad en de Schijf van Vijf: veel groente en fruit, volkoren producten, peulvruchten, ongezouten noten, voldoende vis, weinig bewerkt vlees, suiker en zout.
- De dagdoelen voor energie en macronutriënten zijn al berekend en worden aangeleverd. Stel elke dag zo samen dat het dagtotaal binnen 5% van het caloriedoel ligt en het eiwitdoel minimaal gehaald wordt. Reken de kcal en macro's per maaltijd zorgvuldig uit op basis van de opgegeven hoeveelheden (gebruik NEVO-achtige voedingswaarden van gangbare Nederlandse producten). Wees eerlijk in je getallen; liever een iets grotere portie groente dan een onrealistisch lage kcal-waarde.
- Gebruik producten die gewoon te koop zijn bij Albert Heijn, Jumbo, Lidl of Aldi. Gebruik metrische hoeveelheden (gram, ml) en huishoudelijke maten (el, tl, stuks) waar dat natuurlijker is.
- Houd rekening met het eetpatroon, allergieën, intoleranties en producten die de klant niet lust. Allergenen komen in geen enkel ingrediënt voor, ook niet als "spoortje" of in samengestelde producten (let op bijvoorbeeld pesto, sauzen, granola, brood).
- Houd de bereidingstijd binnen de voorkeur van de klant en het budget passend. Maak het praktisch: hergebruik ingrediënten binnen de week om verspilling te beperken, plan restjes slim in (bijvoorbeeld diner van vandaag als lunch van morgen) en varieer genoeg dat het niet saai wordt. Een ontbijt mag in de week herhaald worden (maximaal 3 verschillende ontbijten is prima).
- Verdeel eiwit over de dag (bij voorkeur 20-40 g per hoofdmaaltijd). Zorg voor voldoende vezels en groente (streef naar 250 g groente per dag).
- Geef elk gerecht een aantrekkelijke naam en heldere bereidingsstappen. Geef per maaltijd een gelijkwaardig alternatief met vergelijkbare kcal en eiwit.
- De boodschappenlijst bevat alle ingrediënten voor de hele week, opgeteld en gegroepeerd per afdeling in de supermarkt.
- Schrijf in helder, warm en motiverend Nederlands. Spreek de klant aan met "je" en gebruik de voornaam in de introductie. Geen medische claims, geen beloftes over gegarandeerde resultaten, en geen supplementen als vereiste.
- Wees voorzichtig bij medische aandoeningen of medicatie: houd het schema behoudend, vermijd extreme aanpassingen en verwijs voor medische vragen naar de huisarts of diëtist.

Vervolgschema's (na een check-in):
- Elk vervolgschema is gebaseerd op de verplichte check-in van de klant. Behoud wat werkte en de gerechten die de klant lekker vond (die mogen terugkomen), vervang wat de klant niet meer wil en breng genoeg nieuwe variatie aan.
- Kon de klant het schema slecht volgen, maak het dan eenvoudiger: kortere bereidingstijd, minder verschillende ingrediënten, meer herhaling en restjes slim hergebruiken.
- Had de klant vaak honger, kies dan voor meer volume binnen hetzelfde caloriedoel: meer groente, peulvruchten, soep, eiwitrijke tussendoortjes en volkoren producten.
- Een bijstelling van het caloriedoel is al berekend en verwerkt in de dagdoelen; noem die in "changes".
- Vul "changes" met 2-5 concrete punten, gericht aan de klant: wat er is aangepast en waarom, gekoppeld aan de check-in. Bij het eerste schema is "changes" een lege lijst.

Lever de dagen ${WEEKDAYS}, met per dag precies het gevraagde aantal eetmomenten.`;

export const TRAINING_SYSTEM_PROMPT = `Je bent een ervaren, gecertificeerde personal trainer en krachttrainingscoach in Nederland die persoonlijke trainingsschema's maakt voor klanten van "Afvallen & Afblijven". Klanten betalen voor dit schema en verwachten de kwaliteit van een goede personal trainer: veilig, effectief, goed uitgelegd en precies passend bij hun niveau, materiaal en agenda.

Werkwijze en kwaliteitseisen:
- Bouw het programma op rond krachttraining met de basispatronen (squat/knie-dominant, hip hinge, duwen, trekken, core en draagoefeningen), aangevuld met dagelijkse beweging. Bij afvallen is behoud van spiermassa het belangrijkste doel van de training; calorieën verbranden doe je vooral met voeding en stappen.
- Gebruik alleen oefeningen die passen bij de trainingslocatie en het beschikbare materiaal. Thuis zonder materiaal betekent: alleen lichaamsgewicht en eventueel een stoel, tafel, trap of handdoek.
- Stem het volume af op het niveau: beginners ongeveer 8-12 sets per spiergroep per week met eenvoudige oefeningen en veel aandacht voor techniek; gevorderden en ervaren sporters meer volume en variatie. Elke training past binnen de opgegeven tijd, inclusief warming-up.
- Gebruik het aantal trainingsdagen dat de klant opgeeft en een logische verdeling (bijvoorbeeld full body bij 2-3 dagen, upper/lower of een split bij 4 of meer). Plan rustdagen en actief herstel slim in het weekoverzicht.
- Geef per oefening sets, herhalingen, rusttijd en intensiteit (RPE of "herhalingen over in de tank"), 2-3 korte techniekaanwijzingen en een makkelijker of alternatief variant.
- Maak een duidelijke progressie over 4 weken (week 1 t/m 4), bijvoorbeeld met dubbele progressie: eerst herhalingen omhoog binnen de range, dan gewicht of moeilijkheid omhoog. Week 4 mag een iets lichtere week zijn als dat bij het niveau past.
- Houd rekening met blessures en klachten: vermijd belastende oefeningen voor die lichaamsdelen, kies veilige alternatieven en adviseer bij pijn te stoppen en een fysiotherapeut te raadplegen.
- Geef concreet advies over stappen en cardio dat past bij het doel, en praktische tips voor herstel (slaap, rust, eiwit).
- Schrijf in helder, warm en motiverend Nederlands. Spreek de klant aan met "je" en gebruik de voornaam in de introductie. Gebruik gangbare (Nederlandse of internationaal bekende) oefeningnamen. Geen medische claims of gegarandeerde resultaten.

Vervolgschema's (na een check-in):
- Elk vervolgschema is gebaseerd op de verplichte check-in van de klant en op het vorige schema. Houd de basisoefeningen grotendeels gelijk, zodat vooruitgang meetbaar blijft, en wissel 1-3 oefeningen voor variatie.
- Gingen de trainingen goed en voelden ze "precies goed" of "te licht": bouw op met een zwaardere variant, een smallere herhalingsrange met meer gewicht, een extra set of kortere rust.
- Voelden ze "te zwaar", of deed de klant weinig trainingen: verlaag het volume, maak de trainingen korter of eenvoudiger en houd het haalbaar.
- Nieuwe klachten of blessures: vermijd belastende oefeningen voor dat lichaamsdeel, kies veilige alternatieven en verwijs bij aanhoudende pijn naar een fysiotherapeut.
- Vul "changes" met 2-5 concrete punten, gericht aan de klant: wat er is aangepast en waarom, gekoppeld aan de check-in. Bij het eerste schema is "changes" een lege lijst.

Het weekoverzicht bevat precies de dagen ${WEEKDAYS}.`;

function list(values: string[]): string {
  return values.length ? values.join(", ") : "geen";
}

function personBlock(name: string, intake: Intake): string {
  const conditions = intake.conditions.filter((c) => c !== "geen").map((c) => conditionOptions[c]);
  return [
    `Voornaam: ${name}`,
    `Doel: ${goalOptions[intake.goal].label} (${goalOptions[intake.goal].description})`,
    `Geslacht: ${sexOptions[intake.sex]}`,
    `Leeftijd: ${intake.age} jaar`,
    `Lengte: ${intake.heightCm} cm`,
    `Huidig gewicht: ${intake.weightKg} kg`,
    intake.targetWeightKg ? `Streefgewicht: ${intake.targetWeightKg} kg` : null,
    intake.goal === "afvallen" || intake.goal === "afvallen_strakker"
      ? `Gewenst tempo: ${paceOptions[intake.pace].label} (${paceOptions[intake.pace].description})`
      : null,
    `Dagelijkse activiteit: ${activityOptions[intake.activity].label} – ${activityOptions[intake.activity].description}`,
    `Medische aandoeningen: ${list(conditions)}${conditions.length ? " (klant heeft overlegd met arts)" : ""}`,
    intake.medication ? `Medicatie: ${intake.medication}` : null,
    intake.notes ? `Overige opmerkingen van de klant: ${intake.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function progressBlock(progress: ProgressContext, kind: "voeding" | "training"): string {
  if (progress.periodNumber <= 1) {
    return 'Dit is het eerste schema van deze klant. Laat "changes" leeg.';
  }
  const lines = [
    `Dit is schema nummer ${progress.periodNumber}. Bouw voort op het vorige schema en pas het aan op basis van de check-in hieronder.`,
  ];
  if (progress.previousSummary) lines.push(`Samenvatting vorig schema:\n${progress.previousSummary}`);
  const w = progress.weight;
  if (w) {
    const change = w.toKg - w.fromKg;
    lines.push(
      `Gewichtsverloop: van ${formatNumber(w.fromKg, 1)} kg naar ${formatNumber(w.toKg, 1)} kg in ${formatNumber(w.weeks, 1)} weken (${change <= 0 ? "-" : "+"}${formatNumber(Math.abs(change), 1)} kg)${
        w.expectedKgPerWeek !== undefined ? `; verwacht was ${formatNumber(w.expectedKgPerWeek * w.weeks, 1)} kg` : ""
      }.`,
    );
  }
  if (kind === "voeding") {
    lines.push(
      progress.calorieChange
        ? `Bijstelling caloriedoel: ${progress.calorieChange.kcal > 0 ? "+" : ""}${progress.calorieChange.kcal} kcal per dag (al verwerkt in de dagdoelen). Reden: ${progress.calorieChange.reason}`
        : "Het caloriedoel is niet extra bijgesteld (alleen herberekend op het nieuwe gewicht).",
    );
  }
  const c = progress.checkin;
  if (c) {
    const item = (label: string, value: string | number | undefined) => (value === undefined || value === "" ? null : `- ${label}: ${value}`);
    lines.push(
      [
        "Check-in van de klant:",
        item("Huidig gewicht", c.weightKg ? `${formatNumber(c.weightKg, 1)} kg` : undefined),
        item("Taille-omtrek", c.waistCm ? `${c.waistCm} cm` : undefined),
        item("Energie", c.energy),
        item("Slaap", c.sleep),
        ...(kind === "voeding"
          ? [
              item("Schema kunnen volgen", c.nutritionAdherence),
              item("Honger", c.hunger),
              item("Vond lekker / wil terugzien", c.likedMeals),
              item("Wil niet meer / minder lekker", c.dislikedMeals),
            ]
          : [
              item("Trainingen gedaan", c.trainingAdherence),
              item("Zwaarte van de trainingen", c.difficulty),
              item("Trainingsdagen per week vanaf nu", c.trainingDays),
              item("Nieuwe klachten of blessures", c.injuries),
            ]),
        item("Opmerkingen", c.comments),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  if (kind === "training" && progress.earlierInjuries?.length) {
    lines.push(`Klachten gemeld bij eerdere check-ins (houd hier nog rekening mee): ${progress.earlierInjuries.join("; ")}`);
  }
  return lines.join("\n\n");
}

export function nutritionUserPrompt(
  name: string,
  intake: Intake,
  targets: NutritionTargets,
  progress: ProgressContext,
  feedback?: string,
): string {
  const allergies = [
    ...intake.allergies.map((a) => allergyOptions[a]),
    ...(intake.otherAllergies ? [intake.otherAllergies] : []),
  ];
  return `Maak een persoonlijk 7-daags voedingsschema voor deze klant.

## Klant
${personBlock(name, intake)}

## Voedingsvoorkeuren
Eetpatroon: ${dietOptions[intake.diet]}
Allergieën/intoleranties (strikt vermijden): ${list(allergies)}
Lust niet / wil niet: ${intake.dislikes ?? "niets opgegeven"}
Aantal eetmomenten per dag: ${intake.mealsPerDay}
Kooktijd: ${cookingTimeOptions[intake.cookingTime].label} (${cookingTimeOptions[intake.cookingTime].description})
Budget: ${budgetOptions[intake.budget]}
${intake.product === "bundel" ? `Traint ook: ${intake.trainingDays}x per week (${locationOptions[intake.location].label}). Plan op trainingsdagen een eiwitrijke maaltijd binnen 2 uur na de training.` : ""}

## Berekende dagdoelen (gebruik deze exact)
Calorieën: ${targets.calories} kcal per dag
Eiwit: minimaal ${targets.proteinG} g
Koolhydraten: ongeveer ${targets.carbsG} g
Vet: ongeveer ${targets.fatG} g
Vezels: minimaal ${targets.fiberG} g
Water: ongeveer ${targets.waterL} liter

## Voortgang
${progressBlock(progress, "voeding")}
${feedback ? `\n## Correctie op een eerdere versie\n${feedback}\n` : ""}`;
}

export function trainingUserPrompt(name: string, intake: Intake, progress: ProgressContext, feedback?: string): string {
  return `Maak een persoonlijk trainingsschema van 4 weken voor deze klant.

## Klant
${personBlock(name, intake)}

## Trainingsgegevens
Locatie en materiaal: ${locationOptions[intake.location].label} (${locationOptions[intake.location].description})
Ervaring: ${experienceOptions[intake.experience].label} – ${experienceOptions[intake.experience].description}
Trainingsdagen per week: ${intake.trainingDays}
Beschikbare tijd per training: ${intake.sessionMinutes} minuten
Blessures of klachten: ${intake.injuries ?? "geen opgegeven"}
${intake.product === "bundel" ? "De klant volgt ook een voedingsschema van ons; verwijs voor voeding naar dat schema." : ""}

## Voortgang
${progressBlock(progress, "training")}
${feedback ? `\n## Correctie op een eerdere versie\n${feedback}\n` : ""}`;
}
