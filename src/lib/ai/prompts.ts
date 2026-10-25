import type { NutritionTargets } from "@/lib/calculations";
import type { Intake } from "@/lib/intake";
import type { CheckinData } from "@/lib/checkin";
import { formatNumber } from "@/lib/format";
import { trainingDirectionLabel, type TrainingDirection } from "@/lib/weekly";
import type { Locale } from "@/i18n/config";
import { checkinLabel, intakeLabels } from "@/i18n/options";

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
  /** Weegmomenten van de vorige periode, met wat er toen is bijgestuurd. */
  weekly?: { week: number; weightKg: number; kcal: number; training?: TrainingDirection; note?: string }[];
  /** Gemeten in gekoppelde gezondheidsapps tijdens de vorige periode. */
  health?: {
    days: number;
    avgSteps: number | null;
    workouts: number;
    plannedWorkouts: number | null;
    workoutMinutes: number;
    walks: number;
    /** Activiteitsniveau waarmee nu gerekend is, als dat door de metingen is veranderd. */
    activityChange?: { from: Intake["activity"]; to: Intake["activity"] };
  };
  /** Aanwijzing van de beheerder bij het opnieuw maken van dit schema. */
  instruction?: string;
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

/**
 * Taalinstructie voor Engelstalige klanten. De systeemprompts blijven
 * Nederlands; deze instructie komt erachter als extra systeemtekst.
 */
export function languageInstruction(l: Locale, kind: "voeding" | "training"): string | null {
  if (l !== "en") return null;
  return [
    "## Taal: Engels",
    'Deze klant gebruikt de Engelstalige website. Schrijf ALLE tekst voor de klant in natuurlijk, warm en motiverend Brits Engels (en-GB, met Britse spelling zoals "personalised" en "fibre") en spreek de klant aan met "you". Dit gaat voor op de aanwijzing om in het Nederlands te schrijven; alle inhoudelijke eisen hierboven blijven gewoon gelden.',
    "- Gebruik metrische eenheden (g, ml, kg, cm, kcal) en schrijf decimalen met een punt (bijv. 0.5 kg).",
    "- Gebruik Engelse dagnamen (Monday t/m Sunday, in die volgorde) in plaats van Maandag t/m Zondag.",
    kind === "voeding"
      ? '- Gebruik Engelse namen voor gerechten, ingrediënten, maaltijdmomenten (Breakfast, Lunch, Snack, Dinner) en de afdelingen van de boodschappenlijst (bijv. "Fruit & veg", "Dairy", "Meat, fish & veggie", "Bread & grains", "Store cupboard"), en Engelse huishoudelijke maten (tbsp, tsp, pieces, slices). De supermarkten en producten blijven dezelfde; bij een typisch Nederlands product zonder gangbare Engelse naam mag je de Nederlandse naam tussen haakjes zetten, zodat de klant het in de winkel herkent (bijv. "low-fat quark (magere kwark)").'
      : '- Gebruik gangbare Engelse namen voor oefeningen en spiergroepen (bijv. "Goblet squat", "Romanian deadlift", "Glutes & hamstrings") en Engelse notatie voor de intensiteit (bijv. "RPE 7 (3 reps in reserve)"). Rustdagen heten "Rest" of "Active recovery".',
    "- Gegevens van de klant in de opdracht (antwoorden, opmerkingen, eerdere schema's) kunnen deels Nederlands zijn; vertaal wat je daaruit overneemt naar het Engels.",
    "- De JSON-sleutels en de structuur blijven ongewijzigd.",
  ].join("\n");
}

/** Korte herinnering onderaan de opdracht, zodat de taal niet wegzakt. */
function languageReminder(l: Locale): string {
  return l === "en" ? "\nSchrijf alle tekst voor de klant in natuurlijk Brits Engels (zie de taalinstructie); de JSON-sleutels blijven ongewijzigd.\n" : "";
}

function list(values: string[]): string {
  return values.length ? values.join(", ") : "geen";
}

function personBlock(name: string, intake: Intake, l: Locale): string {
  const o = intakeLabels(l);
  const conditions = intake.conditions.filter((c) => c !== "geen").map((c) => o.condition[c]);
  return [
    `Voornaam: ${name}`,
    `Doel: ${o.goal[intake.goal].label} (${o.goal[intake.goal].description})`,
    `Geslacht: ${o.sex[intake.sex]}`,
    `Leeftijd: ${intake.age} jaar`,
    `Lengte: ${intake.heightCm} cm`,
    `Huidig gewicht: ${intake.weightKg} kg`,
    intake.targetWeightKg ? `Streefgewicht: ${intake.targetWeightKg} kg` : null,
    intake.goal === "afvallen" || intake.goal === "afvallen_strakker"
      ? `Gewenst tempo: ${o.pace[intake.pace].label} (${o.pace[intake.pace].description})`
      : null,
    `Dagelijkse activiteit: ${o.activity[intake.activity].label} – ${o.activity[intake.activity].description}`,
    `Medische aandoeningen: ${list(conditions)}${conditions.length ? " (klant heeft overlegd met arts)" : ""}`,
    intake.medication ? `Medicatie: ${intake.medication}` : null,
    intake.notes ? `Overige opmerkingen van de klant: ${intake.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function progressBlock(progress: ProgressContext, kind: "voeding" | "training", l: Locale): string {
  const base = progressLines(progress, kind, l);
  // Een aanwijzing van onze diëtist/trainer (bij opnieuw maken) gaat voor, zolang die veilig is.
  return progress.instruction
    ? `${base}\n\n## Aanwijzing van onze ${kind === "voeding" ? "diëtist" : "trainer"}\n${progress.instruction}\nVolg deze aanwijzing, zolang die veilig is en binnen de dagdoelen en de eisen hierboven past.`
    : base;
}

function progressLines(progress: ProgressContext, kind: "voeding" | "training", l: Locale): string {
  const num = (n: number, digits = 0) => formatNumber(n, digits, l);
  const answer = (v?: string) => (v ? checkinLabel(l, v) : v);
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
      `Gewichtsverloop: van ${num(w.fromKg, 1)} kg naar ${num(w.toKg, 1)} kg in ${num(w.weeks, 1)} weken (${change <= 0 ? "-" : "+"}${num(Math.abs(change), 1)} kg)${
        w.expectedKgPerWeek !== undefined ? `; verwacht was ${num(w.expectedKgPerWeek * w.weeks, 1)} kg` : ""
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
        item("Huidig gewicht", c.weightKg ? `${num(c.weightKg, 1)} kg` : undefined),
        item("Taille-omtrek", c.waistCm ? `${c.waistCm} cm` : undefined),
        item("Energie", answer(c.energy)),
        item("Slaap", answer(c.sleep)),
        ...(kind === "voeding"
          ? [
              item("Schema kunnen volgen", answer(c.nutritionAdherence)),
              item("Honger", answer(c.hunger)),
              item("Vond lekker / wil terugzien", c.likedMeals),
              item("Wil niet meer / minder lekker", c.dislikedMeals),
            ]
          : [
              item("Trainingen gedaan", answer(c.trainingAdherence)),
              item("Zwaarte van de trainingen", answer(c.difficulty)),
              item("Trainingsdagen per week vanaf nu", c.trainingDays),
              item("Nieuwe klachten of blessures", c.injuries),
            ]),
        item("Opmerkingen", c.comments),
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }
  if (progress.weekly?.length) {
    lines.push(
      [
        "Wekelijkse weegmomenten in de vorige periode:",
        ...progress.weekly.map(
          (w) =>
            `- Week ${w.week}: ${num(w.weightKg, 1)} kg${w.kcal ? `, calorieën bijgesteld met ${w.kcal > 0 ? "+" : ""}${w.kcal} kcal per dag` : ""}${
              w.training ? `, training ${trainingDirectionLabel(w.training, l)} gemaakt` : ""
            }${w.note ? ` (opmerking: ${w.note})` : ""}`,
        ),
      ].join("\n"),
    );
  }
  const h = progress.health;
  if (h) {
    const o = intakeLabels(l);
    lines.push(
      [
        `Gemeten in de gekoppelde gezondheidsapp(s) van de klant (vorige periode, ${h.days} dagen):`,
        h.avgSteps !== null ? `- Gemiddeld ${num(h.avgSteps)} stappen per dag` : null,
        `- Trainingen geregistreerd: ${h.workouts}${h.plannedWorkouts ? ` van de ${h.plannedWorkouts} geplande` : ""}${
          h.workoutMinutes ? ` (samen ${num(h.workoutMinutes)} minuten)` : ""
        }${h.walks ? `, plus ${h.walks} wandeling(en)` : ""}`,
        h.activityChange
          ? `- Op basis van de stappen rekenen we nu met activiteitsniveau "${o.activity[h.activityChange.to].label}" in plaats van "${o.activity[h.activityChange.from].label}" (al verwerkt in de dagdoelen).`
          : null,
        "Gebruik dit als objectieve aanvulling op de check-in. Wijkt het af van wat de klant zelf invulde, ga dan uit van de metingen, maar wees niet belerend: een training zonder horloge wordt niet geregistreerd.",
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
  l: Locale = "nl",
): string {
  const o = intakeLabels(l);
  const allergies = [
    ...intake.allergies.map((a) => o.allergy[a]),
    ...(intake.otherAllergies ? [intake.otherAllergies] : []),
  ];
  return `Maak een persoonlijk 7-daags voedingsschema voor deze klant.

## Klant
${personBlock(name, intake, l)}

## Voedingsvoorkeuren
Eetpatroon: ${o.diet[intake.diet]}
Allergieën/intoleranties (strikt vermijden): ${list(allergies)}
Lust niet / wil niet: ${intake.dislikes ?? "niets opgegeven"}
Aantal eetmomenten per dag: ${intake.mealsPerDay}
Kooktijd: ${o.cookingTime[intake.cookingTime].label} (${o.cookingTime[intake.cookingTime].description})
Budget: ${o.budget[intake.budget]}
${intake.product === "bundel" ? `Traint ook: ${intake.trainingDays}x per week (${o.location[intake.location].label}). Plan op trainingsdagen een eiwitrijke maaltijd binnen 2 uur na de training.` : ""}

## Berekende dagdoelen (gebruik deze exact)
Calorieën: ${targets.calories} kcal per dag
Eiwit: minimaal ${targets.proteinG} g
Koolhydraten: ongeveer ${targets.carbsG} g
Vet: ongeveer ${targets.fatG} g
Vezels: minimaal ${targets.fiberG} g
Water: ongeveer ${targets.waterL} liter

## Voortgang
${progressBlock(progress, "voeding", l)}
${feedback ? `\n## Correctie op een eerdere versie\n${feedback}\n` : ""}${languageReminder(l)}`;
}

export function trainingUserPrompt(
  name: string,
  intake: Intake,
  progress: ProgressContext,
  feedback?: string,
  l: Locale = "nl",
): string {
  const o = intakeLabels(l);
  return `Maak een persoonlijk trainingsschema van 4 weken voor deze klant.

## Klant
${personBlock(name, intake, l)}

## Trainingsgegevens
Locatie en materiaal: ${o.location[intake.location].label} (${o.location[intake.location].description})
Ervaring: ${o.experience[intake.experience].label} – ${o.experience[intake.experience].description}
Trainingsdagen per week: ${intake.trainingDays}
Beschikbare tijd per training: ${intake.sessionMinutes} minuten
Blessures of klachten: ${intake.injuries ?? "geen opgegeven"}
${intake.product === "bundel" ? "De klant volgt ook een voedingsschema van ons; verwijs voor voeding naar dat schema." : ""}

## Voortgang
${progressBlock(progress, "training", l)}
${feedback ? `\n## Correctie op een eerdere versie\n${feedback}\n` : ""}${languageReminder(l)}`;
}
