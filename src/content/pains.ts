import { defineCopy } from "@/i18n/config";

/**
 * Herkenbare problemen per onderwerp: wat de bezoeker nu ervaart, wat het
 * kost om zo door te gaan, waarom het niet aan hem of haar ligt, en hoe wij
 * het anders doen. Gebruikt op de homepage, de productpagina's en de
 * campagne-landingspagina's.
 *
 * Bewust over frustratie, verspilde moeite en het steeds opnieuw beginnen,
 * niet over iemands lichaam: dat past bij onze toon en bij de regels van
 * advertentieplatforms. En zonder beloftes over resultaat.
 */

export const PAIN_TOPICS = ["afvallen", "voeding", "training", "bundel"] as const;
export type PainTopic = (typeof PAIN_TOPICS)[number];

export interface PainCopy {
  /** Herkenbare problemen: zo voelt het nu. */
  painTitle: string;
  painPoints: string[];
  /** Wat het kost om zo door te gaan (geld, tijd, vertrouwen). */
  costs: { title: string; text: string }[];
  /** Het ligt niet aan jou, maar aan je aanpak. */
  reframe: { title: string; text: string };
  /** Hoe het meestal gaat, en hoe wij het doen. */
  fixes: { pain: string; answer: string }[];
}

export const painLabels = defineCopy({
  nl: {
    painsEyebrow: "Herken je dit?",
    costTitle: "Wat het je kost om zo door te gaan",
    painCta: "Doorbreek het patroon",
    painCtaNote: "2 minuten · je betaalt pas als je een plan kiest",
    fixEyebrow: "Zo pakken we het anders aan",
    fixTitle: "Een plan dat zich aanpast aan jou, niet andersom",
    fixLabels: ["Meestal", "Bij ons"] as [string, string],
  },
  en: {
    painsEyebrow: "Sound familiar?",
    costTitle: "What carrying on like this costs you",
    painCta: "Break the cycle",
    painCtaNote: "2 minutes · you only pay once you choose a plan",
    fixEyebrow: "How we do things differently",
    fixTitle: "A plan that adapts to you, not the other way round",
    fixLabels: ["Usually", "With us"] as [string, string],
  },
});

export const painCopy = defineCopy<Record<PainTopic, PainCopy>>({
  nl: {
    afvallen: {
      painTitle: "Maandag begin je. Alweer.",
      painPoints: [
        "Je begint vol goede moed, en na een paar weken sluipen de oude gewoontes er weer in.",
        "Je hebt al van alles geprobeerd: calorieën tellen, shakes, koolhydraatarm. Het werkt even, en dan niet meer.",
        "De kilo's die eraf gingen, kwamen er net zo makkelijk weer bij.",
        "Door alle tegenstrijdige adviezen weet je niet meer wat je nou wel en niet moet eten.",
        "Je hebt honger, mist wat je lekker vindt en voelt je schuldig bij elk koekje.",
        "En stiekem ben je gaan denken dat het aan jou ligt.",
      ],
      costs: [
        { title: "Geld", text: "Elke nieuwe poging kost weer geld: apps, shakes, boeken en abonnementen die je na een maand niet meer gebruikt." },
        { title: "Tijd", text: "Elke keer begin je weer bij nul. Zo worden een paar maanden al snel een paar jaar." },
        { title: "Vertrouwen in jezelf", text: "Elke poging die strandt, maakt de volgende zwaarder. Tot je niet meer gelooft dat het jou kan lukken." },
      ],
      reframe: {
        title: "Het ligt niet aan jou. Het ligt aan je aanpak.",
        text: "Een standaard dieet is voor iedereen hetzelfde, en past dus bij niemand echt. Te streng, niet afgestemd op je leven, en niemand die bijstuurt als het tegenzit. Dan hangt alles af van wilskracht, en die raakt op.",
      },
      fixes: [
        { pain: "Een crashdieet met een groot tekort: het gaat snel, en komt net zo snel terug.", answer: "Een realistisch tekort met genoeg eiwit: verantwoord afvallen, met minder kans op een jojo-effect." },
        { pain: "Honger en trek, tot je wilskracht op is.", answer: "Verzadigende maaltijden met eiwit, vezels en volume. Heb je toch honger, dan sturen we bij." },
        { pain: "Recepten die niet in je drukke week passen.", answer: "Recepten binnen jouw bereidingstijd, slim hergebruik en een complete boodschappenlijst." },
        { pain: "Niemand die ziet dat het misgaat.", answer: "Elke week een weegmoment. Wijkt je voortgang af, dan passen we je plan meteen aan." },
      ],
    },
    voeding: {
      painTitle: "Je eet 'gezond'. En toch schiet het niet op.",
      painPoints: [
        "Je weet niet of je genoeg, te veel of juist te weinig eet.",
        "Dieetmenu's zijn zo saai dat je na een week alweer eet wat je altijd at.",
        "Om vijf uur sta je nog te bedenken wat je vanavond gaat eten.",
        "Je allergie, je eetpatroon of wat je niet lust past nooit in een standaardschema.",
        "Overdag gaat het goed, maar 's avonds slaat de honger toe.",
      ],
      costs: [
        { title: "Geld", text: "Dure 'light'-producten, eten dat je weggooit, en toch nog vaak de bezorger aan de deur." },
        { title: "Tijd", text: "Elke dag opnieuw bedenken wat je eet, en zonder lijstje door de supermarkt dwalen." },
        { title: "Plezier in eten", text: "Het gevoel dat afvallen alleen lukt met eten dat je eigenlijk niet lekker vindt." },
      ],
      reframe: {
        title: "Het ligt niet aan jou. Het ligt aan je menu.",
        text: "Een menu dat niet past bij wat jij lekker vindt, hoeveel tijd je hebt en wat je lichaam nodig heeft, is bijna niet vol te houden. Daar helpt geen wilskracht tegen. Een beter plan wel.",
      },
      fixes: [
        { pain: "Gissen wat en hoeveel je moet eten.", answer: "Exacte hoeveelheden per maaltijd, uitgerekend op jouw dagdoel." },
        { pain: "Saaie dieetmenu's die je na een week zat bent.", answer: "Gerechten op basis van wat jij lekker vindt, met genoeg variatie." },
        { pain: "Standaardschema's die geen rekening houden met je allergie of eetpatroon.", answer: "Rekening met allergieën, vegetarisch of veganistisch, en wat je niet lust." },
        { pain: "Honger in de avond, tot het toch misgaat.", answer: "Verzadigende maaltijden met eiwit en vezels. Heb je toch honger, dan sturen we bij." },
      ],
    },
    training: {
      painTitle: "Je traint wel. Maar het schiet niet op.",
      painPoints: [
        "Je staat in de sportschool en weet niet goed wat je moet doen, dus doe je maar wat.",
        "Je doet al maanden dezelfde oefeningen, met dezelfde gewichten.",
        "Je zweet, maar je merkt niet dat je sterker wordt.",
        "Je twijfelt over je techniek en bent bang voor een blessure.",
        "Na een paar weken zakt je motivatie in, want waar doe je het eigenlijk voor?",
      ],
      costs: [
        { title: "Geld", text: "Een sportschoolabonnement dat je amper benut, of thuismateriaal dat stof verzamelt." },
        { title: "Tijd", text: "Uren trainen zonder opbouw: veel moeite, weinig vooruitgang." },
        { title: "Motivatie", text: "Het gevoel dat sporten gewoon niets voor jou is." },
      ],
      reframe: {
        title: "Het ligt niet aan jou. Je mist een plan.",
        text: "Zonder opbouw, duidelijke uitleg en iemand die bijstuurt, blijf je hangen op hetzelfde niveau. Met een schema dat elke week een stap verder gaat, weet je bij elke training precies wat je moet doen.",
      },
      fixes: [
        { pain: "Maar wat doen in de sportschool.", answer: "Een vast schema met per oefening sets, herhalingen, rust en uitleg." },
        { pain: "Maandenlang dezelfde oefeningen en gewichten.", answer: "Een opbouw over 4 weken met progressie, afgestemd op je doel." },
        { pain: "Twijfel over je techniek, of last van een blessure.", answer: "Rekening met je klachten en niveau, met een alternatief voor elke oefening." },
        { pain: "Niemand die ziet of het te zwaar of te licht is.", answer: "Elke week bijgestuurd: we passen gewichten of herhalingen aan op hoe het voelt." },
      ],
    },
    bundel: {
      painTitle: "Hard werken, weinig vooruitgang.",
      painPoints: [
        "Je eet minder, maar je voelt je slap en hebt geen energie om te trainen.",
        "Je traint fanatiek, en eet daarna ongemerkt alles er weer bij.",
        "Je voedingsadvies en je trainingsschema komen uit verschillende hoeken en passen niet bij elkaar.",
        "Je weet niet wat je op trainingsdagen anders moet eten dan op rustdagen.",
        "Na weken van diëten voel je je eerder zwakker dan sterker.",
      ],
      costs: [
        { title: "Geld", text: "Een app voor je eten, een sportschoolabonnement, en losse adviezen die elkaar tegenspreken." },
        { title: "Tijd", text: "Weken minder eten en trainen, terwijl het ene het andere tegenwerkt." },
        { title: "Energie", text: "Moe van het diëten, te moe om te trainen. Zo blijf je rondjes draaien." },
      ],
      reframe: {
        title: "Het ligt niet aan jou. Je voeding en training werken langs elkaar heen.",
        text: "Wie alleen minder eet, verliest naast vet ook spieren. Wie alleen traint, eet het vaak ongemerkt weer bij. Pas als voeding en training op elkaar zijn afgestemd, versterken ze elkaar.",
      },
      fixes: [
        { pain: "Minder eten zonder genoeg eiwit, waardoor je ook spieren verliest.", answer: "Genoeg eiwit en krachttraining, gericht op vetverlies in plaats van spierverlies." },
        { pain: "Een trainingsschema dat geen rekening houdt met wat je eet.", answer: "Je energiebehoefte houdt rekening met je trainingen, met extra eiwit op trainingsdagen." },
        { pain: "Losse adviezen uit verschillende hoeken.", answer: "Eén plan: voeding en training vanuit dezelfde berekening, volledig op elkaar afgestemd." },
        { pain: "Niemand die bijstuurt als het niet opschiet.", answer: "Elke week een weegmoment. Wijkt je voortgang af, dan passen we voeding of training meteen aan." },
      ],
    },
  },
  en: {
    afvallen: {
      painTitle: "Starting again on Monday. Again.",
      painPoints: [
        "You start full of good intentions, and after a few weeks the old habits creep back in.",
        "You've tried it all: counting calories, shakes, low-carb. It works for a while, and then it doesn't.",
        "The kilos that came off went straight back on.",
        "With all the conflicting advice, you no longer know what you should and shouldn't eat.",
        "You're hungry, you miss the food you love and you feel guilty about every biscuit.",
        "And deep down, you've started to think it's your fault.",
      ],
      costs: [
        { title: "Money", text: "Every new attempt costs money again: apps, shakes, books and subscriptions you stop using after a month." },
        { title: "Time", text: "Every time, you start from zero. A few months easily turns into a few years." },
        { title: "Self-belief", text: "Every attempt that falls apart makes the next one harder. Until you stop believing you can do it." },
      ],
      reframe: {
        title: "It's not you. It's your approach.",
        text: "A standard diet is the same for everyone, so it doesn't truly fit anyone. Too strict, not built around your life, and nobody to adjust it when things get tough. Then everything depends on willpower, and willpower runs out.",
      },
      fixes: [
        { pain: "A crash diet with a big deficit: it goes fast, and comes back just as fast.", answer: "A realistic deficit with enough protein: losing weight responsibly, with less risk of the yo-yo effect." },
        { pain: "Hunger and cravings, until your willpower runs out.", answer: "Filling meals with protein, fibre and volume. Still hungry? Then we adjust." },
        { pain: "Recipes that don't fit your busy week.", answer: "Recipes within your cooking time, smart leftovers and a complete shopping list." },
        { pain: "Nobody notices when it's going wrong.", answer: "A weekly weigh-in. If your progress is off track, we adjust your plan straight away." },
      ],
    },
    voeding: {
      painTitle: "You're eating 'healthily'. And still not getting anywhere.",
      painPoints: [
        "You don't know whether you're eating enough, too much or too little.",
        "Diet menus are so boring that within a week you're back to your usual meals.",
        "At five o'clock you're still wondering what to have for dinner.",
        "Your allergy, your way of eating or the foods you dislike never fit a standard plan.",
        "The day goes fine, but in the evening the hunger kicks in.",
      ],
      costs: [
        { title: "Money", text: "Pricey 'light' products, food you throw away, and still the delivery driver at your door." },
        { title: "Time", text: "Working out what to eat every single day, and wandering round the supermarket without a list." },
        { title: "Enjoying food", text: "The feeling that losing weight only works with food you don't actually like." },
      ],
      reframe: {
        title: "It's not you. It's your menu.",
        text: "A menu that doesn't match what you enjoy, how much time you have and what your body needs is almost impossible to stick to. Willpower won't fix that. A better plan will.",
      },
      fixes: [
        { pain: "Guessing what and how much to eat.", answer: "Exact quantities per meal, calculated to your daily target." },
        { pain: "Boring diet menus you're sick of within a week.", answer: "Dishes based on what you enjoy, with plenty of variety." },
        { pain: "Standard plans that ignore your allergy or way of eating.", answer: "We account for allergies, vegetarian or vegan eating, and foods you dislike." },
        { pain: "Evening hunger, until it goes wrong after all.", answer: "Filling meals with protein and fibre. Still hungry? Then we adjust." },
      ],
    },
    training: {
      painTitle: "You do train. But you're not getting anywhere.",
      painPoints: [
        "You're at the gym, not quite sure what to do, so you just do something.",
        "You've been doing the same exercises with the same weights for months.",
        "You sweat, but you don't notice yourself getting any stronger.",
        "You're unsure about your technique and worried about getting injured.",
        "After a few weeks your motivation drops, because what are you actually doing it for?",
      ],
      costs: [
        { title: "Money", text: "A gym membership you barely use, or home equipment gathering dust." },
        { title: "Time", text: "Hours of training without a build-up: lots of effort, little progress." },
        { title: "Motivation", text: "The feeling that exercise just isn't for you." },
      ],
      reframe: {
        title: "It's not you. You're missing a plan.",
        text: "Without a build-up, clear instructions and someone to adjust things, you stay stuck at the same level. With a plan that moves a step forward every week, you know exactly what to do at every workout.",
      },
      fixes: [
        { pain: "Just doing something at the gym.", answer: "A set plan with sets, reps, rest and instructions for every exercise." },
        { pain: "The same exercises and weights for months.", answer: "A 4-week build-up with progression, matched to your goal." },
        { pain: "Doubts about your technique, or an injury that bothers you.", answer: "We account for your complaints and level, with an alternative for every exercise." },
        { pain: "Nobody checking whether it's too hard or too easy.", answer: "Adjusted every week: we change the weights or reps based on how it feels." },
      ],
    },
    bundel: {
      painTitle: "Working hard, getting nowhere.",
      painPoints: [
        "You're eating less, but you feel drained and have no energy to train.",
        "You train hard, then unknowingly eat it all back afterwards.",
        "Your nutrition advice and your workout plan come from different places and don't fit together.",
        "You don't know what to eat differently on training days compared with rest days.",
        "After weeks of dieting, you feel weaker rather than stronger.",
      ],
      costs: [
        { title: "Money", text: "An app for your food, a gym membership, and separate advice that contradicts itself." },
        { title: "Time", text: "Weeks of eating less and training, while one works against the other." },
        { title: "Energy", text: "Tired of dieting, too tired to train. And so you keep going round in circles." },
      ],
      reframe: {
        title: "It's not you. Your nutrition and training are working against each other.",
        text: "If you only eat less, you lose muscle as well as fat. If you only train, you often eat it back without noticing. Only when nutrition and training are aligned do they reinforce each other.",
      },
      fixes: [
        { pain: "Eating less without enough protein, so you lose muscle too.", answer: "Enough protein and strength training, focused on losing fat rather than muscle." },
        { pain: "A workout plan that ignores what you eat.", answer: "Your energy needs take your workouts into account, with extra protein on training days." },
        { pain: "Separate advice from different places.", answer: "One plan: nutrition and training from the same calculation, fully aligned." },
        { pain: "Nobody adjusting things when you're not making progress.", answer: "A weekly weigh-in. If your progress is off track, we adjust your nutrition or training straight away." },
      ],
    },
  },
});
