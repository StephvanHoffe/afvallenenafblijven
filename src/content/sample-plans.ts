import type { NutritionTargets } from "@/lib/calculations";
import type { NutritionPlan, TrainingPlan } from "@/lib/ai/schemas";

/**
 * Voorbeeldschema's voor de pagina /voorbeeld en de previews op de site.
 * Een echt schema bevat alle 7 dagen en alle trainingen; hier tonen we een
 * representatief uittreksel voor een fictieve klant.
 */

export const sampleTargets: NutritionTargets = {
  bmr: 1520,
  tdee: 2100,
  calories: 1580,
  proteinG: 120,
  fatG: 50,
  carbsG: 160,
  fiberG: 22,
  waterL: 2.6,
  steps: 8000,
  bmi: 27.6,
  expectedKgPerWeek: -0.47,
};

export const sampleNutritionPlan: NutritionPlan = {
  title: "Jouw voedingsschema – periode 1",
  intro:
    "Hoi Sanne! Dit schema helpt je om rustig en zonder honger richting de 68 kilo te gaan. We houden het simpel op werkdagen, met gerechten die je in 15 tot 30 minuten op tafel zet, en we zorgen bij elke maaltijd voor genoeg eiwit, zodat je lang verzadigd blijft en je spieren behoudt.",
  changes: [],
  principles: [
    "Eet elke maaltijd een eiwitbron: kwark, kip, vis, eieren of peulvruchten.",
    "Vul de helft van je bord met groente; daarmee haal je 250 gram per dag.",
    "Drink water, thee of koffie zonder suiker; ongeveer 2,5 liter per dag.",
    "Weeg jezelf één keer per week, op dezelfde dag en hetzelfde tijdstip.",
    "Eén keer per week iets lekkers buiten het schema mag; geniet ervan en pak de draad weer op.",
  ],
  days: [
    {
      day: "Maandag",
      tip: "Kook vanavond 2 porties krieltjes: de helft gebruik je woensdag in de lunch.",
      meals: [
        {
          moment: "Ontbijt",
          name: "Kwarkbowl met blauwe bessen en walnoot",
          prepMinutes: 5,
          ingredients: [
            { item: "Magere kwark", amount: "250 g" },
            { item: "Havermout", amount: "40 g" },
            { item: "Blauwe bessen (vers of diepvries)", amount: "100 g" },
            { item: "Walnoten, ongezouten", amount: "15 g" },
            { item: "Kaneel", amount: "snufje" },
          ],
          instructions: [
            "Schep de kwark in een kom en roer de kaneel erdoor.",
            "Strooi de havermout en blauwe bessen erover.",
            "Hak de walnoten grof en verdeel ze over de bowl.",
          ],
          kcal: 445,
          proteinG: 31,
          carbsG: 47,
          fatG: 13,
          swap: "Skyr naturel (200 g) met 1 banaan en 15 g amandelen.",
        },
        {
          moment: "Lunch",
          name: "Volkoren wrap met kip, hummus en rauwkost",
          prepMinutes: 10,
          ingredients: [
            { item: "Volkoren wrap", amount: "1 stuk (60 g)" },
            { item: "Kipfilet", amount: "125 g" },
            { item: "Hummus naturel", amount: "40 g" },
            { item: "Sla, komkommer en geraspte wortel", amount: "100 g" },
            { item: "Paprikapoeder, peper", amount: "naar smaak" },
          ],
          instructions: [
            "Snijd de kipfilet in reepjes, bestrooi met paprikapoeder en peper en bak 6-8 minuten in een antiaanbakpan tot hij gaar is.",
            "Besmeer de wrap met hummus en beleg met de rauwkost en kip.",
            "Rol strak op en snijd doormidden. Ook prima koud mee te nemen.",
          ],
          kcal: 437,
          proteinG: 38,
          carbsG: 37,
          fatG: 13,
          swap: "2 volkoren boterhammen met 100 g kipfilet-beleg, 1 el hummus en een bakje snoeptomaatjes.",
        },
        {
          moment: "Tussendoortje",
          name: "Skyr met appel",
          prepMinutes: 2,
          ingredients: [
            { item: "Skyr naturel", amount: "150 g" },
            { item: "Appel", amount: "1 stuk" },
          ],
          instructions: ["Snijd de appel in partjes en eet hem met de skyr."],
          kcal: 165,
          proteinG: 16,
          carbsG: 22,
          fatG: 1,
          swap: "1 blikje tonijn op water met komkommer en 2 volkoren crackers.",
        },
        {
          moment: "Avondeten",
          name: "Zalm uit de oven met krieltjes en citroen-sperziebonen",
          prepMinutes: 25,
          ingredients: [
            { item: "Zalmfilet", amount: "140 g" },
            { item: "Krieltjes", amount: "200 g" },
            { item: "Sperziebonen", amount: "200 g" },
            { item: "Olijfolie", amount: "1 tl (5 ml)" },
            { item: "Citroen", amount: "½ stuk" },
            { item: "Verse dille", amount: "paar takjes" },
          ],
          instructions: [
            "Verwarm de oven voor op 200 °C. Halveer de krieltjes, meng met de olijfolie, peper en een snufje zout en rooster 25 minuten.",
            "Leg de zalm na 12 minuten bij de krieltjes en bak mee tot hij net gaar is.",
            "Kook ondertussen de sperziebonen 6-8 minuten en besprenkel met citroensap.",
            "Serveer met dille en een partje citroen.",
          ],
          kcal: 535,
          proteinG: 36,
          carbsG: 38,
          fatG: 24,
          swap: "Kabeljauwfilet (175 g) met 1 extra tl olijfolie; de rest blijft gelijk.",
        },
      ],
    },
    {
      day: "Dinsdag",
      tip: "Trainingsdag! Je avondeten is je eiwitrijke herstelmaaltijd; eet het binnen 2 uur na je training.",
      meals: [
        {
          moment: "Ontbijt",
          name: "Roerei op volkoren brood met tomaat",
          prepMinutes: 8,
          ingredients: [
            { item: "Eieren", amount: "2 stuks" },
            { item: "Volkoren brood", amount: "2 sneetjes" },
            { item: "Tomaat", amount: "1 stuk" },
            { item: "Halfvolle melk", amount: "1 glas (200 ml)" },
            { item: "Bieslook, peper", amount: "naar smaak" },
          ],
          instructions: [
            "Klop de eieren los met peper en bak ze al roerend in een antiaanbakpan tot roerei.",
            "Rooster het brood en verdeel het roerei erover.",
            "Serveer met plakjes tomaat, bieslook en een glas melk.",
          ],
          kcal: 420,
          proteinG: 28,
          carbsG: 41,
          fatG: 15,
          swap: "Overnight oats: 40 g havermout, 200 ml halfvolle melk en 100 g magere kwark.",
        },
        {
          moment: "Lunch",
          name: "Linzensalade met tonijn en volkoren pita",
          prepMinutes: 10,
          ingredients: [
            { item: "Linzen, uit pot of blik (uitgelekt)", amount: "100 g" },
            { item: "Tonijn op water (uitgelekt)", amount: "1 blikje (112 g)" },
            { item: "Cherrytomaten", amount: "100 g" },
            { item: "Komkommer", amount: "50 g" },
            { item: "Rucola", amount: "handje" },
            { item: "Olijfolie", amount: "1 tl (5 ml)" },
            { item: "Volkoren pitabroodje", amount: "1 stuk" },
          ],
          instructions: [
            "Spoel de linzen af en laat uitlekken.",
            "Halveer de tomaatjes, snijd de komkommer in blokjes en meng alles met de rucola, tonijn en olijfolie.",
            "Breng op smaak met peper en een kneepje citroen. Eet met het geroosterde pitabroodje.",
          ],
          kcal: 465,
          proteinG: 43,
          carbsG: 51,
          fatG: 8,
          swap: "Vegetarisch: vervang de tonijn door 2 gekookte eieren en 30 g feta light.",
        },
        {
          moment: "Tussendoortje",
          name: "Banaan met amandelen",
          prepMinutes: 1,
          ingredients: [
            { item: "Banaan (klein)", amount: "1 stuk" },
            { item: "Amandelen, ongezouten", amount: "20 g" },
          ],
          instructions: ["Handig om mee te nemen naar je werk of de sportschool."],
          kcal: 210,
          proteinG: 5,
          carbsG: 21,
          fatG: 11,
          swap: "Een bakje magere yoghurt (200 g) met 1 el muesli zonder toegevoegd suiker.",
        },
        {
          moment: "Avondeten",
          name: "Kip-teriyaki roerbak met volkorenrijst",
          prepMinutes: 25,
          ingredients: [
            { item: "Kipfilet", amount: "125 g" },
            { item: "Volkorenrijst (ongekookt)", amount: "60 g" },
            { item: "Wokgroente (bijv. paksoi, paprika, taugé)", amount: "250 g" },
            { item: "Teriyakisaus", amount: "1 el (15 ml)" },
            { item: "Sesamolie", amount: "1 tl (5 ml)" },
            { item: "Knoflook en gember", amount: "1 teen + 1 cm" },
          ],
          instructions: [
            "Kook de rijst volgens de verpakking.",
            "Snijd de kip in blokjes en roerbak in de sesamolie met knoflook en gember in 5 minuten gaar.",
            "Voeg de wokgroente toe en roerbak 4 minuten op hoog vuur.",
            "Blus af met de teriyakisaus en serveer met de rijst.",
          ],
          kcal: 492,
          proteinG: 38,
          carbsG: 59,
          fatG: 9,
          swap: "Vegetarisch: vervang de kip door 150 g tempeh of tofu (en kies 1 tl minder olie).",
        },
      ],
    },
  ],
  snackIdeas: [
    { name: "Magere kwark met een theelepel pindakaas", kcal: 150, proteinG: 18 },
    { name: "Rijstwafel met 30+ kaas en komkommer", kcal: 110, proteinG: 8 },
    { name: "Edamame (100 g, uit de diepvries)", kcal: 125, proteinG: 11 },
    { name: "Een bakje aardbeien met 150 g skyr", kcal: 130, proteinG: 16 },
  ],
  shoppingList: [
    {
      category: "Groente & fruit",
      items: [
        { item: "Blauwe bessen", amount: "250 g" },
        { item: "Sperziebonen", amount: "200 g" },
        { item: "Wokgroente", amount: "1 zak (400 g)" },
        { item: "Komkommer", amount: "1 stuk" },
        { item: "Cherrytomaten", amount: "250 g" },
      ],
    },
    {
      category: "Zuivel & eieren",
      items: [
        { item: "Magere kwark", amount: "1 kg" },
        { item: "Skyr naturel", amount: "450 g" },
        { item: "Eieren", amount: "6 stuks" },
      ],
    },
    {
      category: "Vlees, vis & vega",
      items: [
        { item: "Kipfilet", amount: "500 g" },
        { item: "Zalmfilet", amount: "2 stuks" },
        { item: "Tonijn op water", amount: "2 blikjes" },
      ],
    },
  ],
  mealPrepTips: [
    "Bak op zondag 500 g kipfilet in één keer; in de koelkast blijft hij 3 dagen goed.",
    "Kook een dubbele portie volkorenrijst en gebruik de rest in een lunchbowl.",
    "Verdeel kwark en havermout alvast over bakjes voor 3 ontbijten.",
  ],
  eatingOutTips: [
    "Kies gegrilde vis of kip met groente en vraag de saus apart.",
    "Bij de Italiaan: pasta met tomatensaus en een salade vooraf in plaats van een romige saus.",
  ],
  adjustmentGuide:
    "Daalt je gewicht na 2 weken niet? Laat dan de walnoten bij het ontbijt weg en neem 50 g minder krieltjes of rijst bij het avondeten (samen ongeveer 150 kcal minder). Val je sneller af dan 1 kilo per week, of heb je veel honger? Neem dan een extra tussendoortje uit de lijst met snackideeën.",
};

export const sampleTrainingPlan: TrainingPlan = {
  title: "Jouw trainingsschema – periode 1",
  intro:
    "Hoi Sanne! Je traint 3 keer per week thuis met een set dumbbells. We bouwen rustig op met full-body trainingen, zodat je sterker wordt, je spieren behoudt terwijl je afvalt, en de techniek goed onder de knie krijgt.",
  changes: [],
  weekSchedule: [
    { day: "Maandag", activity: "Training A – full body (45 min)" },
    { day: "Dinsdag", activity: "Wandelen 30-45 min" },
    { day: "Woensdag", activity: "Training B – full body (45 min)" },
    { day: "Donderdag", activity: "Rust of rustig fietsen" },
    { day: "Vrijdag", activity: "Training A – full body (45 min)" },
    { day: "Zaterdag", activity: "Lange wandeling (60 min)" },
    { day: "Zondag", activity: "Rust" },
  ],
  warmup: {
    minutes: 6,
    steps: [
      "1 minuut op de plaats lopen met hoge knieën",
      "10 heupcirkels per kant",
      "10 squats met alleen je lichaamsgewicht",
      "10 armcirkels voor- en achterwaarts",
      "1 lichte set van de eerste oefening",
    ],
  },
  workouts: [
    {
      name: "Training A – Full body",
      focus: "Benen, rug en borst",
      minutes: 45,
      exercises: [
        {
          name: "Goblet squat",
          muscleGroups: "Bovenbenen, billen",
          sets: 3,
          reps: "10-12",
          restSeconds: 90,
          intensity: "RPE 7 (nog 3 herhalingen over)",
          cues: ["Houd de dumbbell tegen je borst", "Knieën in de richting van je tenen", "Borst omhoog, rug recht"],
          alternative: "Squat naar een stoel: ga zitten en sta gecontroleerd weer op.",
        },
        {
          name: "Eenarmig roeien met dumbbell",
          muscleGroups: "Rug, biceps",
          sets: 3,
          reps: "10-12 per kant",
          restSeconds: 75,
          intensity: "RPE 7",
          cues: ["Steun met je hand op een stoel", "Trek je elleboog naar je heup", "Niet draaien met je romp"],
          alternative: "Roeien met een elastiek om een deurklink.",
        },
        {
          name: "Push-up op verhoging",
          muscleGroups: "Borst, schouders, triceps",
          sets: 3,
          reps: "8-12",
          restSeconds: 75,
          intensity: "RPE 7-8",
          cues: ["Handen op een stevige tafel of bank", "Lichaam in één rechte lijn", "Ellebogen ±45° van je romp"],
          alternative: "Push-up tegen de muur.",
        },
        {
          name: "Roemeense deadlift met dumbbells",
          muscleGroups: "Hamstrings, billen, onderrug",
          sets: 3,
          reps: "10-12",
          restSeconds: 90,
          intensity: "RPE 7",
          cues: ["Duw je billen naar achteren", "Dumbbells dicht langs je benen", "Rug blijft neutraal"],
          alternative: "Glute bridge op de grond.",
        },
        {
          name: "Dead bug",
          muscleGroups: "Core",
          sets: 3,
          reps: "8 per kant",
          restSeconds: 45,
          intensity: "Gecontroleerd tempo",
          cues: ["Onderrug blijft op de grond", "Rustig uitademen tijdens het strekken"],
          alternative: "Alleen de benen bewegen, armen blijven omhoog.",
        },
      ],
      finisher: "Farmer's walk: 3 x 40 seconden lopen met een dumbbell in elke hand.",
    },
    {
      name: "Training B – Full body",
      focus: "Billen, schouders en core",
      minutes: 45,
      exercises: [
        {
          name: "Reverse lunge",
          muscleGroups: "Bovenbenen, billen",
          sets: 3,
          reps: "8-10 per been",
          restSeconds: 90,
          intensity: "RPE 7",
          cues: ["Stap ruim naar achteren", "Voorste knie boven je enkel", "Duw je weer omhoog via je hak"],
          alternative: "Split squat zonder stap, met steun aan een stoel.",
        },
        {
          name: "Schouderdrukken met dumbbells (staand)",
          muscleGroups: "Schouders, triceps",
          sets: 3,
          reps: "8-10",
          restSeconds: 75,
          intensity: "RPE 7",
          cues: ["Buik- en bilspieren aanspannen", "Druk recht omhoog", "Niet hol trekken met je onderrug"],
          alternative: "Zittend op een stoel met rugleuning.",
        },
        {
          name: "Hip thrust tegen de bank",
          muscleGroups: "Billen, hamstrings",
          sets: 3,
          reps: "12-15",
          restSeconds: 75,
          intensity: "RPE 7-8",
          cues: ["Bovenrug tegen de bank", "Kin licht naar je borst", "Knijp bovenin 1 seconde je billen samen"],
          alternative: "Glute bridge op de grond.",
        },
        {
          name: "Side plank",
          muscleGroups: "Core (schuine buikspieren)",
          sets: 3,
          reps: "20-30 sec per kant",
          restSeconds: 45,
          intensity: "Gecontroleerd",
          cues: ["Elleboog onder je schouder", "Heupen omhoog, lichaam in een lijn"],
          alternative: "Side plank met je knieën op de grond.",
        },
      ],
      finisher: "",
    },
  ],
  cooldown: ["2 minuten rustig wandelen", "Heupbuigers en hamstrings rekken, 30 seconden per kant"],
  progression: [
    { week: 1, focus: "Techniek leren", instructions: "Kies een gewicht waarmee je de onderkant van de herhalingsrange haalt met goede techniek." },
    { week: 2, focus: "Herhalingen opbouwen", instructions: "Probeer per set 1-2 herhalingen meer te doen dan in week 1." },
    { week: 3, focus: "Zwaarder", instructions: "Haal je de bovenkant van de range? Pak dan een zwaarder gewicht of een moeilijkere variant." },
    { week: 4, focus: "Consolideren", instructions: "Herhaal week 3 en schrijf je gewichten op; je volgende schema bouwt hierop verder." },
  ],
  cardioAndSteps:
    "Streef naar minimaal 8.000 stappen per dag. Dat is een van de effectiefste manieren om extra energie te verbruiken zonder dat je hongeriger wordt.",
  recoveryTips: [
    "Slaap 7-9 uur per nacht; slecht slapen vergroot je trek in snacks.",
    "Heb je spierpijn? Rustig bewegen helpt beter dan stilzitten.",
  ],
  safetyNotes: ["Stop bij scherpe pijn of duizeligheid en raadpleeg bij aanhoudende klachten een (sport)fysiotherapeut."],
};

/**
 * Dezelfde voorbeelden als vervolgschema (periode 4), zoals ze na een
 * check-in in Mijn schema's staan: met de aanpassingen bovenaan.
 */
export const sampleTargetsFollowUp: NutritionTargets = { ...sampleTargets, calories: 1540, carbsG: 150 };

export const sampleNutritionPlanFollowUp: NutritionPlan = {
  ...sampleNutritionPlan,
  title: "Jouw voedingsschema – periode 4",
  intro:
    "Goed bezig, Sanne! Je bent sinds de start 5,7 kilo afgevallen en je volgt het schema heel goed. We houden de basis hetzelfde en brengen variatie aan in je lunches.",
  changes: [
    "Je viel deze periode 1,7 kg af, mooi in het geplande tempo. Omdat je lichter bent, gaat je dagdoel licht omlaag naar 1.540 kcal.",
    "Je had bijna nooit meer honger. De eiwitrijke tussendoortjes houden we daarom vast.",
    "Je vond de kwarkbowl en de roerbak lekker: die komen terug, met nieuwe lunches voor variatie.",
  ],
};

export const sampleTrainingPlanFollowUp: TrainingPlan = {
  ...sampleTrainingPlan,
  title: "Jouw trainingsschema – periode 4",
  intro:
    "Sterk gedaan, Sanne! Je traint nu drie maanden en wordt merkbaar sterker. In deze periode bouwen we rustig verder op.",
  changes: [
    "Je deed de meeste trainingen en ze voelden precies goed: bij de goblet squat en het roeien pak je een iets zwaarder gewicht.",
    "Je knie zeurde eerder na het wandelen: we houden de reverse lunge aan, die is vriendelijker voor je knieën.",
    "Nieuw: training A sluit af met de farmer's walk voor je grip en core.",
  ],
};
