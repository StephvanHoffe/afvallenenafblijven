"use client";

import Link from "@/i18n/Link";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Lightbulb, Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  applyPercentOff,
  durationFor,
  isSubscription,
  monthlyPrice,
  productFor,
  type DurationId,
  type ProductId,
} from "@/config/pricing";
import {
  activityOptions,
  allergyOptions,
  budgetOptions,
  conditionOptions,
  cookingTimeOptions,
  dietOptions,
  experienceOptions,
  goalOptions,
  intakeSchema,
  locationOptions,
  paceOptions,
  sexOptions,
  type Intake,
} from "@/lib/intake";
import { nutritionTargets, weightProjection } from "@/lib/calculations";
import { checkSafety } from "@/lib/safety";
import { euro, formatNumber } from "@/lib/format";
import { trackEvent } from "@/lib/consent";
import { deviceType, track, visitId } from "@/lib/track";
import type { PromoView } from "@/lib/promotion";
import { discountedAmount, discountedPayments, type DiscountTerms } from "@/lib/discounts";
import { campaignFromParams, type Campaign } from "@/lib/campaign";
import { PricingTable } from "@/components/pricing/PricingTable";
import { checkDiscountCode, startCheckout, type CheckoutState } from "@/app/[lang]/(site)/start/actions";
import { site } from "@/config/site";
import { resultDisclaimer } from "@/content/disclaimers";
import { defineCopy, intlLocale, type Locale } from "@/i18n/config";
import { useLocale } from "@/i18n/client";
import { intakeLabels } from "@/i18n/options";

type StepId =
  | "doel"
  | "hulp"
  | "over-jou"
  | "lichaam"
  | "tempo"
  | "activiteit"
  | "eetstijl"
  | "maaltijden"
  | "training-plek"
  | "training-tijd"
  | "gezondheid"
  | "resultaat"
  | "plan";

type Answers = {
  goal?: Intake["goal"];
  sex?: Intake["sex"];
  age?: string;
  heightCm?: string;
  weightKg?: string;
  targetWeightKg?: string;
  pace: Intake["pace"];
  activity?: Intake["activity"];
  diet: Intake["diet"];
  allergies: Intake["allergies"];
  otherAllergies: string;
  dislikes: string;
  mealsPerDay: number;
  cookingTime: Intake["cookingTime"];
  budget: Intake["budget"];
  location?: Intake["location"];
  experience?: Intake["experience"];
  trainingDays: number;
  sessionMinutes: number;
  injuries: string;
  pregnant?: boolean;
  eatingDisorder?: boolean;
  conditions: Intake["conditions"];
  medication: string;
  doctorApproval: boolean;
};

interface QuizState {
  product: ProductId | null;
  duration: DurationId;
  step: StepId;
  answered: StepId[];
  answers: Answers;
  name: string;
  email: string;
  consents: { healthData: boolean; terms: boolean; immediateDelivery: boolean; marketing: boolean };
}

const STORAGE_KEY = "afb_quiz_v1";

const copy = defineCopy({
  nl: {
    validation: {
      goal: "Kies je doel",
      product: "Kies waar je hulp bij wilt",
      sex: "Kies je geslacht",
      age: "Vul je leeftijd in",
      adultsOnly: "Onze schema's zijn alleen voor volwassenen (18+).",
      validAge: "Vul een geldige leeftijd in",
      height: "Vul je lengte in centimeters in (bijv. 172)",
      weight: "Vul je gewicht in kilo's in (bijv. 78)",
      targetWeight: "Vul je streefgewicht in",
      targetLower: "Je streefgewicht moet lager zijn dan je huidige gewicht",
      targetRealistic: "Vul een realistisch streefgewicht in",
      activity: "Kies wat het best bij je past",
      location: "Kies waar je traint",
      experience: "Kies je ervaring",
      pregnant: "Beantwoord de vraag over zwangerschap",
      eatingDisorder: "Beantwoord de vraag over eetstoornissen",
      name: "Vul je voornaam in",
      email: "Vul een geldig e-mailadres in",
    },
    previous: "Vorige",
    progress: (n: number) => `${n}% klaar`,
    next: "Volgende",
    no: "Nee",
    yes: "Ja",
    goal: { title: "Wat is je belangrijkste doel?", subtitle: "We stemmen je hele schema hierop af." },
    help: {
      title: "Waar wil je hulp bij?",
      subtitle: "Je kunt dit straks nog aanpassen.",
      bundle: { title: "Voeding én training", description: "Alles op elkaar afgestemd: voeding en training versterken elkaar", badge: "Meest gekozen" },
      nutrition: { title: "Alleen voeding", description: "Weekmenu, recepten en boodschappenlijst" },
      training: { title: "Alleen training", description: "Thuis of in de sportschool" },
    },
    about: {
      title: "Vertel iets over jezelf",
      subtitle: "Dit hebben we nodig om je energiebehoefte te berekenen.",
      sex: "Geslacht",
      sexNote: "Mannen en vrouwen hebben een andere energiebehoefte. Daarom hebben we dit nodig voor een goede berekening.",
      age: "Leeftijd",
      years: "jaar",
    },
    body: {
      title: "Je lengte en gewicht",
      subtitle: "Eerlijk invullen geeft het beste schema. Niemand anders ziet dit.",
      height: "Lengte",
      weight: "Huidig gewicht",
      target: "Streefgewicht",
      targetHint: "Tip: kies een eerste tussendoel van 5 à 10% van je gewicht. Dat is goed haalbaar én al heel gezond.",
    },
    pace: {
      title: "Hoe snel wil je afvallen?",
      subtitle: "Rustiger afvallen is beter vol te houden en je houdt meer spiermassa.",
      recommended: "Aanbevolen",
    },
    activity: { title: "Hoe actief ben je op een gewone dag?", subtitle: "Training niet meegerekend." },
    diet: {
      title: "Wat eet je wel en niet?",
      subtitle: "Je schema bevat alleen gerechten die bij jou passen.",
      pattern: "Eetpatroon",
      allergies: "Allergieën of intoleranties",
      otherAllergies: "Andere allergieën (optioneel)",
      otherAllergiesPlaceholder: "Bijv. selderij of kiwi",
      allergyNote:
        "Geef alle allergieën en intoleranties op: we houden alleen rekening met wat je hier invult. Controleer daarnaast altijd zelf de etiketten.",
    },
    meals: {
      title: "Jouw eetmomenten en keuken",
      subtitle: "Zo past je schema in je dagelijkse leven.",
      perDay: "Hoeveel eetmomenten per dag?",
      snacks: (n: number): string => (n === 3 ? "(geen snacks)" : n === 4 ? "(1 snack)" : "(2 snacks)"),
      cookingTime: "Hoeveel tijd wil je besteden aan koken?",
      budget: "Budget voor boodschappen",
      dislikes: "Wat lust je niet? (optioneel)",
      dislikesPlaceholder: "Bijv. champignons, koriander, avocado",
    },
    trainingPlace: {
      title: "Waar ga je trainen?",
      subtitle: "Je krijgt alleen oefeningen die bij jouw situatie passen.",
      location: "Trainingsplek",
      experience: "Ervaring met krachttraining",
    },
    trainingTime: {
      title: "Hoeveel tijd heb je om te trainen?",
      subtitle: "Liever 3 keer per week volhouden dan 5 keer en afhaken.",
      perWeek: "Trainingen per week",
      perSession: "Tijd per training",
      injuries: "Blessures of klachten? (optioneel)",
      injuriesPlaceholder: "Bijv. pijnlijke knie, onderrugklachten",
    },
    health: {
      title: "Een paar vragen over je gezondheid",
      subtitle: "Voor je veiligheid. Deze gegevens behandelen we vertrouwelijk.",
      pregnant: "Ben je zwanger of geef je borstvoeding?",
      eatingDisorder: "Heb je (of had je) een eetstoornis?",
      conditions: "Heb je een van deze aandoeningen?",
      medication: "Gebruik je medicatie? (optioneel)",
      medicationPlaceholder: "Bijv. metformine, bloeddrukverlagers",
      doctorApproval: "Ik heb met mijn arts overlegd dat een voedings- of trainingsschema voor mij verantwoord is.",
      submit: "Bereken mijn resultaat",
    },
    unsafe: {
      title: "We kunnen je op dit moment helaas geen schema aanbieden",
      change: "Antwoorden aanpassen",
      contact: "Neem contact op",
    },
    result: {
      title: "Jouw persoonlijke plan is klaar om gemaakt te worden",
      subtitle: "Op basis van je antwoorden hebben we jouw dagdoelen berekend. Geen standaarddieet voor iedereen, maar een doel voor jóu.",
      energy: "Jouw dagelijkse energiedoel",
      protein: "Eiwit",
      carbs: "Koolhydraten",
      fat: "Vet",
      maintenance: (kcal: string, bmi: string) => `Je onderhoudsniveau is ongeveer ${kcal} kcal per dag. BMI: ${bmi}.`,
      sendTo: "Waar mogen we je schema naartoe sturen?",
      name: "Voornaam",
      namePlaceholder: "Sanne",
      email: "E-mailadres",
      emailPlaceholder: "sanne@voorbeeld.nl",
      submit: "Bekijk mijn plan",
    },
    plan: {
      back: "Terug naar je resultaat",
      title: (name: string) => `${name ? `${name.trim()}, kies` : "Kies"} je plan`,
      basis: (kcal: string, protein: number) => `Je schema wordt gemaakt op ${kcal} kcal en ${protein} g eiwit per dag. `,
      ready: "Na betaling staat het binnen 2 uur voor je klaar.",
      adviceTitle: (label: string) => `Ons advies voor jou: ${label}`,
      adviceProjection: (weeks: number, target: string, label: string) =>
        `Volgens de schatting heb je ongeveer ${weeks} weken nodig om op ${target} te komen. Stop je na een maand, dan ben je nog niet halverwege en sta je er weer alleen voor. Met ${label} krijg je die hele periode elke 4 weken een nieuw schema, bijgestuurd op je voortgang.`,
      adviceLong: (weeks: number, target: string) =>
        `Volgens de schatting heb je ongeveer ${weeks} weken nodig om op ${target} te komen. Stop je na een maand, dan ben je nog niet halverwege en sta je er weer alleen voor. Met 6 maanden krijg je een half jaar lang elke 4 weken een nieuw, bijgestuurd schema, en daarna loopt je abonnement maandelijks door zolang je wilt. Met 12 maanden betaal je de laagste maandprijs.`,
      adviceHabit:
        "Een nieuwe gewoonte heeft volgens onderzoek gemiddeld zo'n 66 dagen nodig voordat die vanzelf gaat. Stop je na een maand, dan sta je er weer alleen voor terwijl je nog maar net bent begonnen. Met 3 maanden heb je die tijd, krijg je elke 4 weken een nieuw, bijgestuurd schema en betaal je minder per maand.",
      adviceNote: "Een schatting, geen belofte. Je kiest zelf je looptijd.",
    },
    checkout: {
      title: "Je bestelling",
      oneOff: "los schema",
      perMonth: "per maand",
      minimum: (label: string) => `minimaal ${label}`,
      perMonthSuffix: " p/m",
      launchDiscount: (label: string, percent: number) => `${label} (${percent}%)`,
      dueNowFirstMonth: "Nu te betalen (eerste maand)",
      dueNow: "Nu te betalen",
      monthly: (amount: string) => `Daarna schrijven we elke maand ${amount} af via automatische incasso. Maandelijks opzegbaar.`,
      minimumTerm: (amount: string, label: string) =>
        `Daarna schrijven we elke maand ${amount} af via automatische incasso. Minimale looptijd ${label}, daarna maandelijks opzegbaar.`,
      oneOffPayment: "Eenmalige betaling, geen abonnement.",
      vat: "Inclusief 21% btw.",
      healthData:
        "Ik geef uitdrukkelijk toestemming om mijn gezondheidsgegevens (zoals gewicht, lengte en eventuele aandoeningen) te gebruiken om mijn schema te maken. Zie het",
      privacy: "privacybeleid",
      terms: "Ik heb de vragen naar waarheid en volledig ingevuld, ook over mijn gezondheid en allergieën, en ik ga akkoord met de",
      termsLink: "algemene voorwaarden",
      immediateDelivery:
        "Ik wil dat jullie direct na mijn betaling beginnen met het maken van mijn schema. Ik weet dat ik daardoor mijn herroepingsrecht verlies zodra het schema aan mij is geleverd.",
      marketing: "Stuur mij af en toe tips en aanbiedingen per e-mail (optioneel, afmelden kan altijd).",
      required: "Vink de verplichte vakjes aan om verder te gaan.",
      opening: "Betaalpagina openen…",
      submit: "Doorgaan naar veilig betalen",
      methodsSubscription: "Eerste maand met iDEAL | Wero, Bancontact of IBAN; daarna automatische SEPA-incasso",
      methodsOneOff: "Betalen via Stripe met iDEAL | Wero, Bancontact of creditcard",
      guarantee: (days: number) => `Past het toch niet? Binnen ${days} dagen vraag je je eerste betaling terug in Mijn schema's.`,
      codeToggle: "Heb je een kortingscode?",
      codeLabel: "Kortingscode",
      codeApply: "Toepassen",
      codeChecking: "Controleren…",
      codeRemove: "Verwijderen",
      codeLine: (code: string) => `Kortingscode ${code}`,
      codeReplacesLaunch: "Je kortingscode vervangt de actiekorting.",
      codeRepeating: (n: number, amount: string) => `Met je kortingscode betaal je de eerste ${n} maanden ${amount} per maand.`,
      codeFailed: "We konden de code nu niet controleren. Probeer het opnieuw.",
    },
    calculating: {
      title: "Even rekenen…",
      items: ["Energiebehoefte berekenen", "Eiwitbehoefte bepalen", "Veilig tempo kiezen", "Jouw plan samenstellen"],
    },
    chart: {
      aria: (from: number, to: number, weeks: number) => `Verwachte gewichtsdaling van ${from} naar ${to} kilo in ${weeks} weken`,
      now: "Nu",
      week: (n: number) => `Week ${n}`,
      delay: "Elke week dat je wacht, schuift deze datum een week op.",
      note: "Een schatting op basis van een gemiddeld en veilig tempo, geen belofte. Iedereen is anders: je gewicht schommelt van dag tot dag en je resultaat hangt onder meer af van je lichaam en hoe je het schema volgt.",
    },
  },
  en: {
    validation: {
      goal: "Choose your goal",
      product: "Choose what you'd like help with",
      sex: "Choose your sex",
      age: "Please enter your age",
      adultsOnly: "Our plans are for adults only (18+).",
      validAge: "Please enter a valid age",
      height: "Please enter your height in centimetres (e.g. 172)",
      weight: "Please enter your weight in kilos (e.g. 78)",
      targetWeight: "Please enter your target weight",
      targetLower: "Your target weight must be lower than your current weight",
      targetRealistic: "Please enter a realistic target weight",
      activity: "Choose what suits you best",
      location: "Choose where you'll train",
      experience: "Choose your experience level",
      pregnant: "Please answer the question about pregnancy",
      eatingDisorder: "Please answer the question about eating disorders",
      name: "Please enter your first name",
      email: "Please enter a valid email address",
    },
    previous: "Back",
    progress: (n: number) => `${n}% done`,
    next: "Next",
    no: "No",
    yes: "Yes",
    goal: { title: "What's your main goal?", subtitle: "We'll tailor your entire plan to it." },
    help: {
      title: "What would you like help with?",
      subtitle: "You can still change this later.",
      bundle: { title: "Nutrition and training", description: "Everything aligned: nutrition and training reinforce each other", badge: "Most popular" },
      nutrition: { title: "Nutrition only", description: "Weekly meal plan, recipes and shopping list" },
      training: { title: "Training only", description: "At home or at the gym" },
    },
    about: {
      title: "Tell us a bit about yourself",
      subtitle: "We need this to calculate your energy needs.",
      sex: "Sex",
      sexNote: "Men and women have different energy needs. That's why we need this for an accurate calculation.",
      age: "Age",
      years: "years",
    },
    body: {
      title: "Your height and weight",
      subtitle: "Honest answers give you the best plan. Nobody else sees this.",
      height: "Height",
      weight: "Current weight",
      target: "Target weight",
      targetHint: "Tip: choose a first milestone of 5 to 10% of your weight. That's very achievable and already really healthy.",
    },
    pace: {
      title: "How fast do you want to lose weight?",
      subtitle: "Losing weight more gradually is easier to keep up, and you hold on to more muscle.",
      recommended: "Recommended",
    },
    activity: { title: "How active are you on a typical day?", subtitle: "Not counting workouts." },
    diet: {
      title: "What do you eat, and what not?",
      subtitle: "Your plan only includes dishes that suit you.",
      pattern: "Eating pattern",
      allergies: "Allergies or intolerances",
      otherAllergies: "Other allergies (optional)",
      otherAllergiesPlaceholder: "E.g. celery or kiwi",
      allergyNote: "List all your allergies and intolerances: we only take into account what you enter here. And always check the labels yourself.",
    },
    meals: {
      title: "Your meals and kitchen",
      subtitle: "So your plan fits into your daily life.",
      perDay: "How many times a day do you want to eat?",
      snacks: (n: number): string => (n === 3 ? "(no snacks)" : n === 4 ? "(1 snack)" : "(2 snacks)"),
      cookingTime: "How much time do you want to spend cooking?",
      budget: "Grocery budget",
      dislikes: "Anything you don't like? (optional)",
      dislikesPlaceholder: "E.g. mushrooms, coriander, avocado",
    },
    trainingPlace: {
      title: "Where will you train?",
      subtitle: "You'll only get exercises that suit your situation.",
      location: "Training location",
      experience: "Strength training experience",
    },
    trainingTime: {
      title: "How much time do you have to train?",
      subtitle: "Better to keep up 3 times a week than to go for 5 and give up.",
      perWeek: "Workouts per week",
      perSession: "Time per workout",
      injuries: "Any injuries or complaints? (optional)",
      injuriesPlaceholder: "E.g. sore knee, lower back pain",
    },
    health: {
      title: "A few questions about your health",
      subtitle: "For your safety. We treat this information confidentially.",
      pregnant: "Are you pregnant or breastfeeding?",
      eatingDisorder: "Do you have (or have you had) an eating disorder?",
      conditions: "Do you have any of these conditions?",
      medication: "Do you take any medication? (optional)",
      medicationPlaceholder: "E.g. metformin, blood pressure medication",
      doctorApproval: "I have checked with my doctor that a nutrition or workout plan is safe for me.",
      submit: "Calculate my result",
    },
    unsafe: {
      title: "Unfortunately, we can't offer you a plan at the moment",
      change: "Change my answers",
      contact: "Get in touch",
    },
    result: {
      title: "Your personal plan is ready to be created",
      subtitle: "Based on your answers, we've calculated your daily targets. Not a standard diet for everyone, but a target for you.",
      energy: "Your daily energy target",
      protein: "Protein",
      carbs: "Carbs",
      fat: "Fat",
      maintenance: (kcal: string, bmi: string) => `Your maintenance level is about ${kcal} kcal a day. BMI: ${bmi}.`,
      sendTo: "Where should we send your plan?",
      name: "First name",
      namePlaceholder: "Sarah",
      email: "Email address",
      emailPlaceholder: "sarah@example.com",
      submit: "View my plan",
    },
    plan: {
      back: "Back to your result",
      title: (name: string) => (name ? `${name.trim()}, choose your plan` : "Choose your plan"),
      basis: (kcal: string, protein: number) => `Your plan will be built around ${kcal} kcal and ${protein} g of protein a day. `,
      ready: "After payment, it'll be ready for you within 2 hours.",
      adviceTitle: (label: string) => `Our advice for you: ${label}`,
      adviceProjection: (weeks: number, target: string, label: string) =>
        `Based on the estimate, you'll need around ${weeks} weeks to reach ${target}. Stop after one month and you won't be halfway yet, and you'll be on your own again. With ${label}, you get a new plan every 4 weeks for that whole period, fine-tuned to your progress.`,
      adviceLong: (weeks: number, target: string) =>
        `Based on the estimate, you'll need around ${weeks} weeks to reach ${target}. Stop after one month and you won't be halfway yet, and you'll be on your own again. With 6 months, you get a new, fine-tuned plan every 4 weeks for half a year, and after that your subscription continues monthly for as long as you like. With 12 months, you pay the lowest monthly price.`,
      adviceHabit:
        "According to research, a new habit takes around 66 days on average before it becomes automatic. Stop after one month and you're on your own again when you've only just started. With 3 months you have that time, you get a new, fine-tuned plan every 4 weeks and you pay less per month.",
      adviceNote: "An estimate, not a promise. You choose your own term.",
    },
    checkout: {
      title: "Your order",
      oneOff: "one-off plan",
      perMonth: "per month",
      minimum: (label: string) => `minimum ${label}`,
      perMonthSuffix: " /month",
      launchDiscount: (label: string, percent: number) => `${label} (${percent}%)`,
      dueNowFirstMonth: "Due now (first month)",
      dueNow: "Due now",
      monthly: (amount: string) => `After that, we'll collect ${amount} every month by direct debit. Cancel any month.`,
      minimumTerm: (amount: string, label: string) =>
        `After that, we'll collect ${amount} every month by direct debit. Minimum term ${label}, then cancel any month.`,
      oneOffPayment: "One-off payment, no subscription.",
      vat: "Including 21% VAT.",
      healthData:
        "I explicitly consent to my health data (such as weight, height and any conditions) being used to create my plan. See the",
      privacy: "privacy policy",
      terms: "I have answered the questions truthfully and completely, including about my health and allergies, and I agree to the",
      termsLink: "terms and conditions",
      immediateDelivery:
        "I want you to start creating my plan immediately after my payment. I understand that I will therefore lose my right of withdrawal as soon as the plan has been delivered to me.",
      marketing: "Send me occasional tips and offers by email (optional, you can unsubscribe at any time).",
      required: "Tick the required boxes to continue.",
      opening: "Opening payment page…",
      submit: "Continue to secure payment",
      methodsSubscription: "First month with iDEAL | Wero, Bancontact or IBAN; then automatic SEPA Direct Debit",
      methodsOneOff: "Pay via Stripe with iDEAL | Wero, Bancontact or credit card",
      guarantee: (days: number) => `Not the right fit after all? Within ${days} days, you can request your first payment back in My plans.`,
      codeToggle: "Have a discount code?",
      codeLabel: "Discount code",
      codeApply: "Apply",
      codeChecking: "Checking…",
      codeRemove: "Remove",
      codeLine: (code: string) => `Discount code ${code}`,
      codeReplacesLaunch: "Your discount code replaces the promotional discount.",
      codeRepeating: (n: number, amount: string) => `With your discount code, you pay ${amount} a month for the first ${n} months.`,
      codeFailed: "We couldn't check the code right now. Please try again.",
    },
    calculating: {
      title: "Crunching the numbers…",
      items: ["Calculating energy needs", "Working out protein needs", "Choosing a safe pace", "Putting your plan together"],
    },
    chart: {
      aria: (from: number, to: number, weeks: number) => `Expected weight loss from ${from} to ${to} kilos in ${weeks} weeks`,
      now: "Now",
      week: (n: number) => `Week ${n}`,
      delay: "Every week you wait pushes this date back by a week.",
      note: "An estimate based on an average, safe pace, not a promise. Everyone is different: your weight fluctuates from day to day and your result depends on factors such as your body and how closely you follow the plan.",
    },
  },
});

const initialAnswers: Answers = {
  pace: "gemiddeld",
  diet: "alles",
  allergies: [],
  otherAllergies: "",
  dislikes: "",
  mealsPerDay: 4,
  cookingTime: "normaal",
  budget: "normaal",
  trainingDays: 3,
  sessionMinutes: 45,
  injuries: "",
  conditions: [],
  medication: "",
  doctorApproval: false,
};

const num = (v?: string) => (v ? Number(v.replace(",", ".")) : NaN);
const losing = (a: Answers) => a.goal === "afvallen" || a.goal === "afvallen_strakker";
const hasNutrition = (p: ProductId | null) => p !== "training";

/** Een eerder begonnen bestelling (link "verder waar je gebleven was" uit de herinneringsmail). */
export interface QuizResume {
  intake: Intake;
  name: string;
  email: string;
  duration: DurationId | null;
}

function answersFromIntake(i: Intake): Answers {
  const str = (n: number | undefined) => (n === undefined ? undefined : String(n));
  return {
    goal: i.goal,
    sex: i.sex,
    age: str(i.age),
    heightCm: str(i.heightCm),
    weightKg: str(i.weightKg),
    targetWeightKg: str(i.targetWeightKg),
    pace: i.pace,
    activity: i.activity,
    diet: i.diet,
    allergies: i.allergies,
    otherAllergies: i.otherAllergies ?? "",
    dislikes: i.dislikes ?? "",
    mealsPerDay: i.mealsPerDay,
    cookingTime: i.cookingTime,
    budget: i.budget,
    location: i.location,
    experience: i.experience,
    trainingDays: i.trainingDays,
    sessionMinutes: i.sessionMinutes,
    injuries: i.injuries ?? "",
    pregnant: i.pregnant,
    eatingDisorder: i.eatingDisorder,
    conditions: i.conditions,
    medication: i.medication ?? "",
    doctorApproval: i.doctorApproval,
  };
}
const hasTraining = (p: ProductId | null) => p === "training" || p === "bundel";

function visibleSteps(s: QuizState, presetProduct: boolean): StepId[] {
  const steps: StepId[] = ["doel"];
  if (!presetProduct || !s.product) steps.push("hulp");
  steps.push("over-jou", "lichaam");
  if (losing(s.answers)) steps.push("tempo");
  steps.push("activiteit");
  if (hasNutrition(s.product)) steps.push("eetstijl", "maaltijden");
  if (hasTraining(s.product)) steps.push("training-plek", "training-tijd");
  steps.push("gezondheid", "resultaat", "plan");
  return steps;
}

function toIntakeInput(s: QuizState) {
  const a = s.answers;
  return {
    product: s.product ?? "bundel",
    goal: a.goal,
    sex: a.sex,
    age: num(a.age),
    heightCm: num(a.heightCm),
    weightKg: num(a.weightKg),
    targetWeightKg: losing(a) && a.targetWeightKg ? num(a.targetWeightKg) : undefined,
    pace: a.pace,
    activity: a.activity,
    diet: a.diet,
    allergies: a.allergies,
    otherAllergies: a.otherAllergies,
    dislikes: a.dislikes,
    mealsPerDay: a.mealsPerDay,
    cookingTime: a.cookingTime,
    budget: a.budget,
    location: a.location ?? "sportschool",
    experience: a.experience ?? "beginner",
    trainingDays: a.trainingDays,
    sessionMinutes: a.sessionMinutes,
    injuries: a.injuries,
    pregnant: a.pregnant ?? false,
    eatingDisorder: a.eatingDisorder ?? false,
    conditions: a.conditions,
    medication: a.medication,
    doctorApproval: a.doctorApproval,
  };
}

function validateStep(step: StepId, s: QuizState, l: Locale): string | null {
  const a = s.answers;
  const v = copy[l].validation;
  switch (step) {
    case "doel":
      return a.goal ? null : v.goal;
    case "hulp":
      return s.product ? null : v.product;
    case "over-jou": {
      if (!a.sex) return v.sex;
      const age = num(a.age);
      if (!Number.isFinite(age)) return v.age;
      if (age < 18) return v.adultsOnly;
      if (age > 99) return v.validAge;
      return null;
    }
    case "lichaam": {
      const h = num(a.heightCm);
      const w = num(a.weightKg);
      if (!(h >= 130 && h <= 230)) return v.height;
      if (!(w >= 35 && w <= 300)) return v.weight;
      if (losing(a)) {
        const t = num(a.targetWeightKg);
        if (!Number.isFinite(t)) return v.targetWeight;
        if (t >= w) return v.targetLower;
        if (t < 35) return v.targetRealistic;
      }
      return null;
    }
    case "activiteit":
      return a.activity ? null : v.activity;
    case "training-plek":
      if (!a.location) return v.location;
      return a.experience ? null : v.experience;
    case "gezondheid":
      if (a.pregnant === undefined) return v.pregnant;
      if (a.eatingDisorder === undefined) return v.eatingDisorder;
      return null;
    default:
      return null;
  }
}

/**
 * Looptijd die past bij de prognose: minimaal 3 maanden (de tijd die een
 * gewoonte nodig heeft), 6 maanden als de schatting langer is. Daarna loopt
 * een abonnement maandelijks door, dus langer dan 6 maanden adviseren we niet.
 */
function recommendedDuration(weeks: number | null): DurationId {
  return weeks !== null && weeks > 13 ? "6m" : "3m";
}

export function Quiz({
  initialProduct,
  initialDuration,
  initialGoal = null,
  startAtPlan,
  promo,
  durationPreset = false,
  initialCode = null,
  resume = null,
}: {
  initialProduct: ProductId | null;
  initialDuration: DurationId;
  /** Heeft de bezoeker al een looptijd gekozen (bijv. in de prijstabel)? Dan nemen we die over. */
  durationPreset?: boolean;
  /** Doel dat al op een landingspagina is gekozen: dan begint de vragenlijst bij de tweede vraag. */
  initialGoal?: Intake["goal"] | null;
  startAtPlan: boolean;
  /** De actie die nu loopt, of null. */
  promo: PromoView | null;
  /** Kortingscode uit de link (?code=). */
  initialCode?: string | null;
  /** Verder met een eerder begonnen bestelling (?hervat=). */
  resume?: QuizResume | null;
}) {
  const l = useLocale();
  const c = copy[l];
  const labels = intakeLabels(l);
  const presetProduct = initialProduct !== null;
  const [s, setS] = useState<QuizState>(() => {
    const start: QuizState = {
      product: initialProduct,
      duration: initialDuration,
      step: "doel",
      answered: [],
      answers: initialAnswers,
      name: "",
      email: "",
      consents: { healthData: false, terms: false, immediateDelivery: false, marketing: false },
    };
    if (resume) {
      // Alles was al ingevuld: meteen naar de plankeuze. De vinkjes zet de klant opnieuw.
      return {
        ...start,
        product: resume.intake.product,
        duration: resume.duration ?? initialDuration,
        answers: answersFromIntake(resume.intake),
        answered: visibleSteps({ ...start, product: resume.intake.product, answers: answersFromIntake(resume.intake) }, false).filter(
          (st) => st !== "plan",
        ),
        step: "plan",
        name: resume.name,
        email: resume.email,
      };
    }
    if (!initialGoal) return start;
    const withGoal = { ...start, answers: { ...initialAnswers, goal: initialGoal }, answered: ["doel" as StepId] };
    return { ...withGoal, step: visibleSteps(withGoal, presetProduct)[1] ?? "doel" };
  });
  // Campagnebron uit de advertentielink (utm), alleen in het geheugen; gaat mee met de bestelling.
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  // Zolang de bezoeker zelf geen looptijd heeft gekozen, staat ons advies voorgeselecteerd.
  const [durationChosen, setDurationChosen] = useState(durationPreset || Boolean(resume?.duration));
  // Kortingscode: wat de bezoeker invult en, na controle, de geldige code met de voorwaarden.
  const [codeInput, setCodeInput] = useState(initialCode ?? "");
  const [discount, setDiscount] = useState<{ code: string; label: string; terms: DiscountTerms } | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [codeChecking, setCodeChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const restored = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const [checkoutState, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});

  // Herstel een eerder ingevulde vragenlijst (bijv. na annuleren van de betaling).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    if (resume) return;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as QuizState;
      const next: QuizState = {
        ...parsed,
        answers: initialGoal ? { ...parsed.answers, goal: initialGoal } : parsed.answers,
        product: initialProduct ?? parsed.product,
        duration: presetProduct ? initialDuration : parsed.duration,
        step: startAtPlan && parsed.answered.includes("gezondheid") ? "plan" : parsed.answered.length ? parsed.step : "doel",
      };
      // Opslag in de browser kan alleen na het laden worden gelezen.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setS(next);
    } catch {
      /* geen opgeslagen voortgang */
    }
  }, [initialProduct, initialDuration, initialGoal, presetProduct, startAtPlan, resume]);

  // Funnel: elke stap die de bezoeker te zien krijgt (anoniem, zie src/lib/track.ts).
  const trackedStep = useRef<string | null>(null);
  useEffect(() => {
    if (trackedStep.current === s.step) return;
    trackedStep.current = s.step;
    track("quiz_step", { step: s.step, product: s.product });
  }, [s.step, s.product]);

  useEffect(() => {
    if (checkoutState.error) track("checkout_error", { step: "plan" });
  }, [checkoutState]);

  useEffect(() => {
    // De adresbalk is pas in de browser te lezen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCampaign(campaignFromParams(new URLSearchParams(window.location.search)));
    // Met een doel van de landingspagina is de eerste vraag al beantwoord.
    if (initialGoal) trackEvent("quiz_start", { goal: initialGoal });
  }, [initialGoal]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* opslag niet beschikbaar */
    }
  }, [s]);

  const steps = visibleSteps(s, presetProduct);
  const index = Math.max(0, steps.indexOf(s.step));
  const progress = Math.round((index / (steps.length - 1)) * 100);

  const parsed = useMemo(() => intakeSchema.safeParse(toIntakeInput(s)), [s]);
  const intake = parsed.success ? parsed.data : null;
  const targets = intake ? nutritionTargets(intake) : null;
  const projection = intake && targets ? weightProjection(intake, targets) : null;
  const recommended = recommendedDuration(projection?.weeks ?? null);
  const safety = intake ? checkSafety(intake, l) : null;

  function update(patch: Partial<Answers>) {
    setError(null);
    setS((prev) => ({ ...prev, answers: { ...prev.answers, ...patch } }));
  }

  function goTo(step: StepId) {
    setError(null);
    setS((prev) => ({ ...prev, step }));
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function next(override?: QuizState) {
    const state = override ?? s;
    const problem = validateStep(state.step, state, l);
    if (problem) {
      setError(problem);
      return;
    }
    if (state.step === "doel" && state.answered.length === 0) trackEvent("quiz_start");
    const list = visibleSteps(state, presetProduct);
    const nextStep = list[list.indexOf(state.step) + 1] ?? "plan";
    const answered = state.answered.includes(state.step) ? state.answered : [...state.answered, state.step];
    if (nextStep === "resultaat") {
      trackEvent("quiz_complete", { product: state.product });
      setCalculating(true);
      setTimeout(() => setCalculating(false), 1600);
    }
    setError(null);
    setS({ ...state, answered, step: nextStep });
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function back() {
    const prevStep = steps[index - 1];
    if (prevStep) goTo(prevStep);
  }

  /** Kies een optie en ga direct door (voor vragen met één antwoord). */
  function pickAndNext(patch: Partial<Answers> | { product: ProductId }) {
    const state: QuizState =
      "product" in patch
        ? { ...s, product: patch.product }
        : { ...s, answers: { ...s.answers, ...(patch as Partial<Answers>) } };
    setS(state);
    setTimeout(() => next(state), 140);
  }

  function choosePlan(product: ProductId, duration: DurationId) {
    setDurationChosen(true);
    track("plan_select", { product, duration });
    const state = { ...s, product, duration };
    // Kiest de klant een plan met onderdelen waarvoor nog geen vragen zijn beantwoord? Stel die eerst.
    const missing = visibleSteps(state, false).find(
      (st) => ["eetstijl", "maaltijden", "training-plek", "training-tijd"].includes(st) && !state.answered.includes(st),
    );
    setS(missing ? { ...state, step: missing } : state);
    if (missing) {
      setError(null);
      requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } else {
      document.getElementById("afrekenen")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // De looptijd waarmee we afrekenen: de eigen keuze, anders ons advies (zoals voorgeselecteerd in de prijstabel).
  const orderState: QuizState = durationChosen ? s : { ...s, duration: recommended };

  function applyCode(raw: string) {
    if (!s.product || !raw.trim()) return;
    const product = s.product;
    const duration = orderState.duration;
    setCodeChecking(true);
    setCodeError(null);
    checkDiscountCode(raw, product, duration)
      .then((r) => {
        if (r.ok) {
          setDiscount({ code: r.code, label: r.label, terms: r.terms });
          setCodeInput(r.code);
          track("discount_applied", { step: r.code, product, duration });
        } else {
          setDiscount(null);
          setCodeError(r.error);
        }
      })
      .catch(() => setCodeError(copy[l].checkout.codeFailed))
      .finally(() => setCodeChecking(false));
  }

  // Een code uit de link, of een al toegepaste code, controleren we (opnieuw) voor het gekozen plan.
  const pendingCode = useRef(initialCode);
  useEffect(() => {
    const code = discount?.code ?? pendingCode.current;
    if (!s.product || !code) return;
    pendingCode.current = null;
    let stale = false;
    checkDiscountCode(code, s.product, orderState.duration)
      .then((r) => {
        if (stale) return;
        if (r.ok) {
          setDiscount({ code: r.code, label: r.label, terms: r.terms });
        } else {
          setDiscount(null);
          setCodeError(r.error);
        }
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
    // Alleen opnieuw bij een ander plan of andere looptijd (niet bij het zetten van de korting zelf).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.product, orderState.duration]);
  const payload = JSON.stringify({
    intake: toIntakeInput(s),
    customer: { name: s.name, email: s.email },
    consents: s.consents,
    product: s.product,
    duration: orderState.duration,
    campaign,
  });

  const a = s.answers;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {s.step !== "plan" && (
        <div className="mx-auto mb-8 max-w-2xl">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted">
            {index > 0 ? (
              <button type="button" onClick={back} className="inline-flex items-center gap-1 hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden /> {c.previous}
              </button>
            ) : (
              <span />
            )}
            <span>{c.progress(progress)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-100" aria-hidden>
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
        </div>
      )}

      <div className={s.step === "plan" ? "" : "mx-auto max-w-2xl"}>
        {s.step === "doel" && (
          <Step title={c.goal.title} subtitle={c.goal.subtitle}>
            <Options>
              {(Object.keys(goalOptions) as Intake["goal"][]).map((g) => (
                <OptionCard
                  key={g}
                  selected={a.goal === g}
                  onClick={() => pickAndNext({ goal: g })}
                  title={labels.goal[g].label}
                  description={labels.goal[g].description}
                />
              ))}
            </Options>
          </Step>
        )}

        {s.step === "hulp" && (
          <Step title={c.help.title} subtitle={c.help.subtitle}>
            <Options>
              <OptionCard
                selected={s.product === "bundel"}
                onClick={() => pickAndNext({ product: "bundel" })}
                title={c.help.bundle.title}
                description={c.help.bundle.description}
                badge={c.help.bundle.badge}
              />
              <OptionCard
                selected={s.product === "voeding"}
                onClick={() => pickAndNext({ product: "voeding" })}
                title={c.help.nutrition.title}
                description={c.help.nutrition.description}
              />
              <OptionCard
                selected={s.product === "training"}
                onClick={() => pickAndNext({ product: "training" })}
                title={c.help.training.title}
                description={c.help.training.description}
              />
            </Options>
          </Step>
        )}

        {s.step === "over-jou" && (
          <Step title={c.about.title} subtitle={c.about.subtitle}>
            <fieldset>
              <legend className="label">{c.about.sex}</legend>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(sexOptions) as Intake["sex"][]).map((x) => (
                  <ChoiceChip key={x} selected={a.sex === x} onClick={() => update({ sex: x })}>
                    {labels.sex[x]}
                  </ChoiceChip>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">{c.about.sexNote}</p>
            </fieldset>
            <NumberField label={c.about.age} suffix={c.about.years} value={a.age} onChange={(v) => update({ age: v })} placeholder="35" />
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "lichaam" && (
          <Step title={c.body.title} subtitle={c.body.subtitle}>
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label={c.body.height} suffix="cm" value={a.heightCm} onChange={(v) => update({ heightCm: v })} placeholder="170" />
              <NumberField label={c.body.weight} suffix="kg" value={a.weightKg} onChange={(v) => update({ weightKg: v })} placeholder="78" decimal />
            </div>
            {losing(a) && (
              <NumberField
                label={c.body.target}
                suffix="kg"
                value={a.targetWeightKg}
                onChange={(v) => update({ targetWeightKg: v })}
                placeholder="68"
                decimal
                hint={c.body.targetHint}
              />
            )}
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "tempo" && (
          <Step title={c.pace.title} subtitle={c.pace.subtitle}>
            <Options>
              {(Object.keys(paceOptions) as Intake["pace"][]).map((p) => (
                <OptionCard
                  key={p}
                  selected={a.pace === p}
                  onClick={() => pickAndNext({ pace: p })}
                  title={labels.pace[p].label}
                  description={labels.pace[p].description}
                  badge={p === "gemiddeld" ? c.pace.recommended : undefined}
                />
              ))}
            </Options>
          </Step>
        )}

        {s.step === "activiteit" && (
          <Step title={c.activity.title} subtitle={c.activity.subtitle}>
            <Options>
              {(Object.keys(activityOptions) as Intake["activity"][]).map((x) => (
                <OptionCard
                  key={x}
                  selected={a.activity === x}
                  onClick={() => pickAndNext({ activity: x })}
                  title={labels.activity[x].label}
                  description={labels.activity[x].description}
                />
              ))}
            </Options>
          </Step>
        )}

        {s.step === "eetstijl" && (
          <Step title={c.diet.title} subtitle={c.diet.subtitle}>
            <fieldset>
              <legend className="label">{c.diet.pattern}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(dietOptions) as Intake["diet"][]).map((d) => (
                  <ChoiceChip key={d} selected={a.diet === d} onClick={() => update({ diet: d })}>
                    {labels.diet[d]}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">{c.diet.allergies}</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(allergyOptions) as Intake["allergies"]).map((al) => {
                  const on = a.allergies.includes(al);
                  return (
                    <ChoiceChip
                      key={al}
                      selected={on}
                      multi
                      onClick={() => update({ allergies: on ? a.allergies.filter((x) => x !== al) : [...a.allergies, al] })}
                    >
                      {labels.allergy[al]}
                    </ChoiceChip>
                  );
                })}
              </div>
            </fieldset>
            <TextField
              label={c.diet.otherAllergies}
              value={a.otherAllergies}
              onChange={(v) => update({ otherAllergies: v })}
              placeholder={c.diet.otherAllergiesPlaceholder}
            />
            <p className="text-sm text-muted">{c.diet.allergyNote}</p>
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "maaltijden" && (
          <Step title={c.meals.title} subtitle={c.meals.subtitle}>
            <fieldset>
              <legend className="label">{c.meals.perDay}</legend>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map((n) => (
                  <ChoiceChip key={n} selected={a.mealsPerDay === n} onClick={() => update({ mealsPerDay: n })}>
                    {n} {c.meals.snacks(n)}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">{c.meals.cookingTime}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(cookingTimeOptions) as Intake["cookingTime"][]).map((ct) => (
                  <ChoiceChip key={ct} selected={a.cookingTime === ct} onClick={() => update({ cookingTime: ct })}>
                    <span className="block font-bold">{labels.cookingTime[ct].label}</span>
                    <span className="block text-xs font-normal opacity-80">{labels.cookingTime[ct].description}</span>
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">{c.meals.budget}</legend>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(budgetOptions) as Intake["budget"][]).map((b) => (
                  <ChoiceChip key={b} selected={a.budget === b} onClick={() => update({ budget: b })}>
                    {labels.budget[b]}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <TextField
              label={c.meals.dislikes}
              value={a.dislikes}
              onChange={(v) => update({ dislikes: v })}
              placeholder={c.meals.dislikesPlaceholder}
            />
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "training-plek" && (
          <Step title={c.trainingPlace.title} subtitle={c.trainingPlace.subtitle}>
            <fieldset>
              <legend className="label">{c.trainingPlace.location}</legend>
              <div className="grid gap-2">
                {(Object.keys(locationOptions) as Intake["location"][]).map((loc) => (
                  <ChoiceChip key={loc} selected={a.location === loc} onClick={() => update({ location: loc })}>
                    <span className="block font-bold">{labels.location[loc].label}</span>
                    <span className="block text-xs font-normal opacity-80">{labels.location[loc].description}</span>
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">{c.trainingPlace.experience}</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(experienceOptions) as Intake["experience"][]).map((x) => (
                  <ChoiceChip key={x} selected={a.experience === x} onClick={() => update({ experience: x })}>
                    <span className="block font-bold">{labels.experience[x].label}</span>
                    <span className="block text-xs font-normal opacity-80">{labels.experience[x].description}</span>
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "training-tijd" && (
          <Step title={c.trainingTime.title} subtitle={c.trainingTime.subtitle}>
            <fieldset>
              <legend className="label">{c.trainingTime.perWeek}</legend>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((n) => (
                  <ChoiceChip key={n} selected={a.trainingDays === n} onClick={() => update({ trainingDays: n })}>
                    {n}x
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">{c.trainingTime.perSession}</legend>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 75].map((n) => (
                  <ChoiceChip key={n} selected={a.sessionMinutes === n} onClick={() => update({ sessionMinutes: n })}>
                    {n} min
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <TextField
              label={c.trainingTime.injuries}
              value={a.injuries}
              onChange={(v) => update({ injuries: v })}
              placeholder={c.trainingTime.injuriesPlaceholder}
            />
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "gezondheid" && (
          <Step title={c.health.title} subtitle={c.health.subtitle}>
            <YesNo label={c.health.pregnant} value={a.pregnant} onChange={(v) => update({ pregnant: v })} />
            <YesNo
              label={c.health.eatingDisorder}
              value={a.eatingDisorder}
              onChange={(v) => update({ eatingDisorder: v })}
            />
            <fieldset>
              <legend className="label">{c.health.conditions}</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(conditionOptions) as Intake["conditions"]).map((cond) => {
                  const on = cond === "geen" ? a.conditions.length === 0 : a.conditions.includes(cond);
                  return (
                    <ChoiceChip
                      key={cond}
                      multi
                      selected={on}
                      onClick={() =>
                        update({
                          conditions:
                            cond === "geen" ? [] : on ? a.conditions.filter((x) => x !== cond) : [...a.conditions, cond],
                          ...(cond === "geen" ? { doctorApproval: false } : {}),
                        })
                      }
                    >
                      {labels.condition[cond]}
                    </ChoiceChip>
                  );
                })}
              </div>
            </fieldset>
            {a.conditions.length > 0 && (
              <>
                <TextField
                  label={c.health.medication}
                  value={a.medication}
                  onChange={(v) => update({ medication: v })}
                  placeholder={c.health.medicationPlaceholder}
                />
                <Checkbox
                  checked={a.doctorApproval}
                  onChange={(v) => update({ doctorApproval: v })}
                  label={c.health.doctorApproval}
                />
              </>
            )}
            <NextButton onClick={() => next()} label={c.health.submit} />
          </Step>
        )}

        {s.step === "resultaat" &&
          (calculating || !intake || !targets ? (
            <Calculating />
          ) : safety && !safety.ok ? (
            <div className="card p-7">
              <TriangleAlert className="size-10 text-accent-500" aria-hidden />
              <h2 className="heading-md mt-4">{c.unsafe.title}</h2>
              <p className="mt-3 leading-relaxed text-muted">{safety.reason}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => goTo("doel")} className="btn-secondary">
                  {c.unsafe.change}
                </button>
                <Link href="/contact" className="btn-secondary">
                  {c.unsafe.contact}
                </Link>
              </div>
            </div>
          ) : (
            <Step title={c.result.title} subtitle={c.result.subtitle}>
              <div className="rounded-[var(--radius-card)] bg-brand-900 p-6 text-white">
                <p className="text-sm font-semibold text-white/70">{c.result.energy}</p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight">
                  {formatNumber(targets.calories, 0, l)} <span className="text-2xl">kcal</span>
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: c.result.protein, value: `${targets.proteinG} g` },
                    { label: c.result.carbs, value: `${targets.carbsG} g` },
                    { label: c.result.fat, value: `${targets.fatG} g` },
                  ].map((m) => (
                    <div key={m.label} className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs text-white/70">{m.label}</p>
                      <p className="text-lg font-extrabold">{m.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/70">
                  {c.result.maintenance(formatNumber(targets.tdee, 0, l), formatNumber(targets.bmi, 1, l))}
                </p>
              </div>

              {projection && intake.targetWeightKg && <ProjectionChart points={projection.points} target={intake.targetWeightKg} />}

              {safety?.ok && safety.warnings.length > 0 && (
                <div className="rounded-2xl border border-accent-200 bg-accent-50 p-4 text-sm">
                  {safety.warnings.map((w) => (
                    <p key={w}>{w}</p>
                  ))}
                </div>
              )}

              <div className="card space-y-4 p-6">
                <h3 className="text-lg font-bold">{c.result.sendTo}</h3>
                <TextField
                  label={c.result.name}
                  value={s.name}
                  onChange={(v) => setS({ ...s, name: v })}
                  placeholder={c.result.namePlaceholder}
                  autoComplete="given-name"
                />
                <TextField
                  label={c.result.email}
                  type="email"
                  value={s.email}
                  onChange={(v) => setS({ ...s, email: v })}
                  placeholder={c.result.emailPlaceholder}
                  autoComplete="email"
                />
                <NextButton
                  label={c.result.submit}
                  onClick={() => {
                    if (s.name.trim().length < 2) return setError(c.validation.name);
                    if (!/^\S+@\S+\.\S+$/.test(s.email.trim())) return setError(c.validation.email);
                    next();
                  }}
                />
              </div>
            </Step>
          ))}

        {s.step === "plan" && (
          <div>
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <button type="button" onClick={back} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden /> {c.plan.back}
              </button>
              <h1 className="heading-lg">{c.plan.title(s.name)}</h1>
              <p className="mt-3 text-lg text-muted">
                {targets ? c.plan.basis(formatNumber(targets.calories, 0, l), targets.proteinG) : ""}
                {c.plan.ready}
              </p>
              <div className="mt-6 flex gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 text-left sm:p-5">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden />
                <div>
                  <p className="font-bold">{c.plan.adviceTitle(durationFor(recommended, l).label)}</p>
                  <p className="mt-1 text-[0.9375rem] leading-relaxed">
                    {projection && projection.weeks > 8 && intake?.targetWeightKg
                      ? projection.weeks > 26
                        ? c.plan.adviceLong(projection.weeks, `${formatNumber(intake.targetWeightKg, intake.targetWeightKg % 1 ? 1 : 0, l)} kg`)
                        : c.plan.adviceProjection(
                            projection.weeks,
                            `${formatNumber(intake.targetWeightKg, intake.targetWeightKg % 1 ? 1 : 0, l)} kg`,
                            durationFor(recommended, l).label,
                          )
                      : c.plan.adviceHabit}
                  </p>
                  <p className="mt-1.5 text-xs text-muted">{c.plan.adviceNote}</p>
                </div>
              </div>
            </div>
            <PricingTable
              initialDuration={durationChosen ? s.duration : recommended}
              recommended={recommended}
              promo={promo}
              onSelect={choosePlan}
              selectedProduct={s.product ?? undefined}
            />
            {s.product && (
              <CheckoutBox
                state={orderState}
                setConsents={(c) => setS({ ...s, consents: { ...s.consents, ...c } })}
                promo={promo}
                payload={payload}
                formAction={formAction}
                pending={pending}
                serverError={checkoutState.error}
                discount={discount}
                code={{
                  value: codeInput,
                  set: (v) => {
                    setCodeInput(v);
                    setCodeError(null);
                  },
                  apply: () => applyCode(codeInput),
                  remove: () => {
                    setDiscount(null);
                    setCodeInput("");
                    setCodeError(null);
                  },
                  error: codeError,
                  checking: codeChecking,
                  initiallyOpen: Boolean(initialCode),
                }}
              />
            )}
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 rounded-2xl bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function CheckoutBox({
  state,
  setConsents,
  promo,
  payload,
  formAction,
  pending,
  serverError,
  discount,
  code,
}: {
  state: QuizState;
  setConsents: (c: Partial<QuizState["consents"]>) => void;
  promo: PromoView | null;
  payload: string;
  formAction: (fd: FormData) => void;
  pending: boolean;
  serverError?: string;
  discount: { code: string; label: string; terms: DiscountTerms } | null;
  code: {
    value: string;
    set: (v: string) => void;
    apply: () => void;
    remove: () => void;
    error: string | null;
    checking: boolean;
    initiallyOpen: boolean;
  };
}) {
  const l = useLocale();
  const t = copy[l].checkout;
  const product = state.product!;
  const d = durationFor(state.duration, l);
  const subscription = isSubscription(state.duration);
  const total = monthlyPrice(product, state.duration);
  // Een kortingscode vervangt de actiekorting.
  const promoPercent = promo ? (promo.percentOff[state.duration] ?? 0) : 0;
  const first = discount ? discountedAmount(total, discount.terms) : promoPercent > 0 ? applyPercentOff(total, promoPercent) : total;
  const later = discount && discount.terms.duration === "forever" ? discountedAmount(total, discount.terms) : total;
  const repeating = discount && subscription ? discountedPayments(discount.terms) : null;
  const c = state.consents;
  const ready = c.healthData && c.terms && c.immediateDelivery;
  const [touched, setTouched] = useState(false);
  const [codeOpen, setCodeOpen] = useState(code.initiallyOpen);

  return (
    <form
      id="afrekenen"
      onSubmit={(e) => {
        // Zelf versturen (in plaats van via action=) zodat React de vinkjes niet reset.
        e.preventDefault();
        if (!ready) {
          setTouched(true);
          return;
        }
        trackEvent("begin_checkout", { value: first / 100, currency: "EUR", items: [{ item_id: `${product}_${state.duration}` }] });
        track("checkout_submit", { product, duration: state.duration });
        const data = new FormData(e.currentTarget);
        // Bezoeknummer en apparaat (funnel) en de kortingscode gaan mee met de bestelling.
        try {
          const p = JSON.parse(String(data.get("payload")));
          data.set("payload", JSON.stringify({ ...p, visitId: visitId(), device: deviceType(), discountCode: discount?.code ?? null }));
        } catch {
          /* dan zonder */
        }
        startTransition(() => formAction(data));
      }}
      className="card mx-auto mt-12 max-w-2xl scroll-mt-24 p-6 sm:p-8"
    >
      <input type="hidden" name="payload" value={payload} />
      <h2 className="heading-md">{t.title}</h2>
      <dl className="mt-5 space-y-3 text-[0.9375rem]">
        <div className="flex justify-between gap-4">
          <dt className="font-semibold">
            {productFor(product, l).name} ·{" "}
            {!subscription ? t.oneOff : d.months === 1 ? t.perMonth : t.minimum(d.label)}
          </dt>
          <dd className="font-semibold">
            {euro(total, l)}
            {subscription ? t.perMonthSuffix : ""}
          </dd>
        </div>
        {discount ? (
          <div className="flex justify-between gap-4 text-brand-700">
            <dt>
              {t.codeLine(discount.code)} <span className="text-sm">({discount.label})</span>
            </dt>
            <dd className="whitespace-nowrap">− {euro(total - first, l)}</dd>
          </div>
        ) : (
          promo &&
          promoPercent > 0 && (
            <div className="flex justify-between gap-4 text-brand-700">
              <dt>{t.launchDiscount(promo.label, promoPercent)}</dt>
              <dd>− {euro(total - first, l)}</dd>
            </div>
          )
        )}
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg font-extrabold">
          <dt>{subscription ? t.dueNowFirstMonth : t.dueNow}</dt>
          <dd>{euro(first, l)}</dd>
        </div>
        <p className="text-sm text-muted">
          {repeating && repeating > 1 ? `${t.codeRepeating(repeating, euro(discountedAmount(total, discount!.terms), l))} ` : ""}
          {subscription
            ? d.months === 1
              ? t.monthly(euro(later, l))
              : t.minimumTerm(euro(later, l), d.label)
            : t.oneOffPayment}{" "}
          {t.vat}
          {discount && promoPercent > 0 ? ` ${t.codeReplacesLaunch}` : ""}
        </p>
      </dl>

      <div className="mt-4">
        {discount ? (
          <button type="button" onClick={code.remove} className="text-sm font-semibold text-muted underline hover:text-ink">
            {t.codeRemove} ({discount.code})
          </button>
        ) : !codeOpen ? (
          <button type="button" onClick={() => setCodeOpen(true)} className="text-sm font-semibold text-brand-700 underline">
            {t.codeToggle}
          </button>
        ) : (
          <div>
            <label htmlFor="kortingscode" className="label">
              {t.codeLabel}
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="kortingscode"
                value={code.value}
                onChange={(e) => code.set(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    code.apply();
                  }
                }}
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={30}
                className="input flex-1 uppercase"
                aria-invalid={code.error ? true : undefined}
                aria-describedby={code.error ? "kortingscode-fout" : undefined}
              />
              <button type="button" onClick={code.apply} disabled={code.checking || !code.value.trim()} className="btn-secondary !px-4 !py-2 text-sm">
                {code.checking ? t.codeChecking : t.codeApply}
              </button>
            </div>
            {code.error && (
              <p id="kortingscode-fout" role="alert" className="mt-1.5 text-sm font-semibold text-accent-600">
                {code.error}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 space-y-3">
        <Checkbox
          checked={c.healthData}
          onChange={(v) => setConsents({ healthData: v })}
          invalid={touched && !c.healthData}
          label={
            <>
              {t.healthData}{" "}
              <Link href="/privacybeleid" target="_blank" className="font-semibold underline">
                {t.privacy}
              </Link>
              .
            </>
          }
        />
        <Checkbox
          checked={c.terms}
          onChange={(v) => setConsents({ terms: v })}
          invalid={touched && !c.terms}
          label={
            <>
              {t.terms}{" "}
              <Link href="/algemene-voorwaarden" target="_blank" className="font-semibold underline">
                {t.termsLink}
              </Link>
              .
            </>
          }
        />
        <Checkbox
          checked={c.immediateDelivery}
          onChange={(v) => setConsents({ immediateDelivery: v })}
          invalid={touched && !c.immediateDelivery}
          label={t.immediateDelivery}
        />
        <Checkbox
          checked={c.marketing}
          onChange={(v) => setConsents({ marketing: v })}
          label={t.marketing}
        />
      </div>

      {touched && !ready && (
        <p role="alert" className="mt-4 text-sm font-semibold text-accent-600">
          {t.required}
        </p>
      )}
      {serverError && (
        <p role="alert" className="mt-4 rounded-2xl bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-600">
          {serverError}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary mt-6 w-full text-lg">
        {pending ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden /> {t.opening}
          </>
        ) : (
          <>
            <Lock className="size-5" aria-hidden /> {t.submit}
          </>
        )}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-muted">
        <ShieldCheck className="size-4 text-brand-600" aria-hidden />
        {subscription ? t.methodsSubscription : t.methodsOneOff}
      </p>
      <p className="mt-4 border-t border-line pt-4 text-xs leading-relaxed text-muted">
        {resultDisclaimer[l].long}
        {site.guarantee.enabled ? ` ${t.guarantee(site.guarantee.days)}` : ""}
      </p>
    </form>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby="stap-titel" className="space-y-6">
      <div>
        <h1 id="stap-titel" className="heading-lg">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-lg text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Options({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3">{children}</div>;
}

function OptionCard({
  selected,
  onClick,
  title,
  description,
  badge,
}: {
  selected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex w-full items-center gap-4 rounded-3xl border-2 bg-white p-5 text-left transition hover:border-brand-400 ${
        selected ? "border-brand-500 bg-brand-50" : "border-line"
      }`}
    >
      <span
        className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${selected ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}
        aria-hidden
      >
        {selected && <Check className="size-4" />}
      </span>
      <span className="flex-1">
        <span className="flex flex-wrap items-center gap-2 text-lg font-bold">
          {title}
          {badge && <span className="rounded-full bg-lime-glow px-2 py-0.5 text-xs font-extrabold text-brand-950">{badge}</span>}
        </span>
        {description && <span className="block text-muted">{description}</span>}
      </span>
    </button>
  );
}

function ChoiceChip({
  selected,
  onClick,
  children,
  multi = false,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-2xl border-2 px-4 py-3 text-left text-[0.9375rem] font-semibold transition ${
        selected ? "border-brand-500 bg-brand-50 text-brand-900" : "border-line bg-white hover:border-brand-300"
      } ${multi ? "inline-flex items-center gap-2" : ""}`}
    >
      {multi && (
        <span className={`grid size-5 place-items-center rounded-md border-2 ${selected ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`} aria-hidden>
          {selected && <Check className="size-3.5" />}
        </span>
      )}
      <span>{children}</span>
    </button>
  );
}

function NumberField({
  label,
  suffix,
  value,
  onChange,
  placeholder,
  decimal = false,
  hint,
}: {
  label: string;
  suffix: string;
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  decimal?: boolean;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <span className="relative block">
        <input
          className="input pr-16 text-lg font-semibold"
          inputMode={decimal ? "decimal" : "numeric"}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))}
          placeholder={placeholder}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-muted" aria-hidden>{suffix}</span>
      </span>
      {hint && <span className="mt-1.5 block text-sm text-muted">{hint}</span>}
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        maxLength={300}
      />
    </label>
  );
}

function YesNo({ label, value, onChange }: { label: string; value?: boolean; onChange: (v: boolean) => void }) {
  const c = copy[useLocale()];
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <ChoiceChip selected={value === false} onClick={() => onChange(false)}>
          {c.no}
        </ChoiceChip>
        <ChoiceChip selected={value === true} onClick={() => onChange(true)}>
          {c.yes}
        </ChoiceChip>
      </div>
    </fieldset>
  );
}

function Checkbox({
  checked,
  onChange,
  label,
  invalid = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-3 rounded-2xl border p-4 text-sm leading-relaxed ${invalid ? "border-accent-400 bg-accent-50" : "border-line bg-sand"}`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-brand-600"
      />
      <span>{label}</span>
    </label>
  );
}

function NextButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const c = copy[useLocale()];
  return (
    <button type="button" onClick={onClick} className="btn-primary w-full text-lg sm:w-auto">
      {label ?? c.next} <ArrowRight className="size-5" aria-hidden />
    </button>
  );
}

function Calculating() {
  const c = copy[useLocale()].calculating;
  const items = c.items;
  return (
    <div className="card p-8 text-center" role="status" aria-live="polite">
      <Loader2 className="mx-auto size-10 animate-spin text-brand-600" aria-hidden />
      <h2 className="heading-md mt-4">{c.title}</h2>
      <ul className="mx-auto mt-6 max-w-xs space-y-2 text-left">
        {items.map((t, i) => (
          <li key={t} className="flex items-center gap-2 opacity-0 [animation:fadein_0.3s_ease_forwards]" style={{ animationDelay: `${i * 0.35}s` }}>
            <Check className="size-5 text-brand-600" aria-hidden /> {t}
          </li>
        ))}
      </ul>
      <style>{`@keyframes fadein { to { opacity: 1 } }`}</style>
    </div>
  );
}

function ProjectionChart({ points, target }: { points: number[]; target: number }) {
  const l = useLocale();
  const c = copy[l].chart;
  const width = 600;
  const height = 200;
  const pad = { l: 44, r: 16, t: 20, b: 32 };
  const max = points[0];
  const min = target - 1;
  const x = (i: number) => pad.l + (i / Math.max(points.length - 1, 1)) * (width - pad.l - pad.r);
  const y = (v: number) => pad.t + ((max - v) / Math.max(max - min, 1)) * (height - pad.t - pad.b);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const weeks = points.length - 1;
  const date = new Date();
  date.setDate(date.getDate() + weeks * 7);
  const dateLabel = new Intl.DateTimeFormat(intlLocale(l), { day: "numeric", month: "long", year: "numeric" }).format(date);
  const targetLabel = `${formatNumber(target, target % 1 ? 1 : 0, l)} kg`;

  return (
    <div className="card p-6">
      <p className="text-lg leading-snug font-bold">
        {l === "en" ? (
          <>
            With this plan, you could reach <span className="text-brand-600">{targetLabel}</span> around{" "}
            <span className="text-brand-600">{dateLabel}</span>.
          </>
        ) : (
          <>
            Met dit plan kun je rond <span className="text-brand-600">{dateLabel}</span> op{" "}
            <span className="text-brand-600">{targetLabel}</span> zitten.
          </>
        )}
      </p>
      <p className="mt-1 text-sm font-semibold text-accent-600">{c.delay}</p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={c.aria(max, target, weeks)}>
        <line x1={pad.l} x2={width - pad.r} y1={y(target)} y2={y(target)} stroke="#b5e4c8" strokeDasharray="6 6" />
        <path d={`${d} L${x(weeks)},${height - pad.b} L${x(0)},${height - pad.b} Z`} fill="#d9f2e2" opacity="0.6" />
        <path d={d} fill="none" stroke="#1c7a48" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(0)} cy={y(max)} r="6" fill="#ffffff" stroke="#1c7a48" strokeWidth="3" />
        <circle cx={x(weeks)} cy={y(target)} r="7" fill="#c8f169" stroke="#123f29" strokeWidth="3" />
        <text x={pad.l - 8} y={y(max) + 4} textAnchor="end" fontSize="13" fill="#4d6156" fontWeight="600">
          {formatNumber(max, max % 1 ? 1 : 0, l)}
        </text>
        <text x={pad.l - 8} y={y(target) + 4} textAnchor="end" fontSize="13" fill="#4d6156" fontWeight="600">
          {formatNumber(target, target % 1 ? 1 : 0, l)}
        </text>
        <text x={x(0)} y={height - 8} fontSize="13" fill="#4d6156">
          {c.now}
        </text>
        <text x={x(weeks)} y={height - 8} textAnchor="end" fontSize="13" fill="#4d6156">
          {c.week(weeks)}
        </text>
      </svg>
      <p className="mt-2 text-xs text-muted">{c.note}</p>
    </div>
  );
}
