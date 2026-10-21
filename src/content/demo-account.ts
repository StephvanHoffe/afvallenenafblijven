import { demoHealth } from "@/content/demo-health";
import type { Locale } from "@/i18n/config";
import type { AccountView, DashboardPlan } from "@/lib/account-types";
import type { WeeklyLog } from "@/lib/weekly";
import type { Intake } from "@/lib/intake";
import { monthlyPrice } from "@/config/pricing";
import { guaranteeDeadline } from "@/lib/guarantee";
import { sampleTargets, sampleTargetsFollowUp } from "@/content/sample-plans";

/**
 * Voorbeelddata voor de demo van Mijn schema's (/voorbeeld/mijn-schemas).
 * Een fictieve klant met de bundel, die nu in periode 4 zit en haar check-in
 * voor periode 5 kan invullen. Vaste datums, zodat de pagina's statisch zijn.
 */
export const demoCustomerName = "Sanne";

/** De vragenlijst van de fictieve klant (ook gebruikt in de beheerdemo). */
export const demoIntake: Intake = {
  product: "bundel",
  goal: "afvallen_strakker",
  sex: "vrouw",
  age: 34,
  heightCm: 168,
  weightKg: 78,
  targetWeightKg: 68,
  pace: "gemiddeld",
  activity: "zittend",
  diet: "alles",
  allergies: [],
  otherAllergies: undefined,
  dislikes: "champignons",
  mealsPerDay: 4,
  cookingTime: "normaal",
  budget: "normaal",
  location: "thuis_materiaal",
  experience: "beginner",
  trainingDays: 3,
  sessionMinutes: 45,
  injuries: undefined,
  pregnant: false,
  eatingDisorder: false,
  conditions: [],
  medication: undefined,
  doctorApproval: false,
  notes: undefined,
};

const at = (iso: string) => new Date(`${iso}T09:14:00+01:00`);
const PERIODS = ["2027-01-06", "2027-02-03", "2027-03-03", "2027-03-31"];

/** Datum waarop de schema's van de huidige periode (4) zijn gemaakt. */
export const demoPlanDate = at(PERIODS[3]);
export const DEMO_SEQ = 4;

const plans: DashboardPlan[] = PERIODS.flatMap((day, i) => {
  const seq = i + 1;
  const current = seq === DEMO_SEQ;
  return (["voeding", "training"] as const).map((type) => ({
    id: `demo-${type}-${seq}`,
    type,
    seq,
    status: "ready" as const,
    generatedAt: at(day),
    failed: false,
    href: type === "voeding" ? "/voorbeeld/mijn-schemas/voedingsschema" : "/voorbeeld/mijn-schemas/trainingsschema",
    pdfHref: current ? `/voorbeeld/pdf/${type === "voeding" ? "voedingsschema" : "trainingsschema"}` : "/voorbeeld/pdf/alles",
  }));
}).reverse();

/** Weegmomenten in periode 4: week 1 op koers, in week 2 bijgestuurd. */
export const demoWeekly: WeeklyLog[] = [
  {
    seq: 4,
    week: 1,
    date: at("2027-04-07"),
    status: "ready",
    data: { weightKg: 72, energy: "Goed", hunger: "Soms", nutritionAdherence: "Meestal (70-90%)", trainingAdherence: "De meeste", difficulty: "Precies goed" },
    adjustment: { kcal: 0, calories: 1540, message: "Je ligt op koers. Je schema blijft zoals het is; ga zo door!" },
  },
  {
    seq: 4,
    week: 2,
    date: at("2027-04-14"),
    status: "ready",
    data: {
      weightKg: 72.1,
      waistCm: 86.5,
      energy: "Goed",
      hunger: "Bijna nooit",
      nutritionAdherence: "Bijna altijd (90% of meer)",
      trainingAdherence: "Alle trainingen",
      difficulty: "Te licht",
      comments: "Trainingen gaan steeds makkelijker!",
    },
    adjustment: {
      kcal: -100,
      calories: 1440,
      nutritionReason:
        "Je viel 0,2 kg af, minder dan verwacht (0,9 kg), terwijl je het schema goed volgde. Daarom eet je nu 100 kcal per dag minder.",
      training: "zwaarder",
      trainingReason: "Je vond de trainingen te licht. Daarom maken we ze iets zwaarder.",
      nutrition: {
        summary: "Je eet vanaf nu ongeveer 100 kcal per dag minder, met dezelfde gerechten.",
        swaps: [
          { meal: "Ontbijt: kwarkbowl", change: "Neem 30 g havermout in plaats van 40 g, en 10 g walnoten in plaats van 15 g.", kcal: -60 },
          { meal: "Avondeten", change: "Neem 150 g krieltjes in plaats van 200 g, of 50 g volkorenrijst (ongekookt) in plaats van 60 g.", kcal: -40 },
        ],
      },
      trainingPlan: {
        summary: "Je trainingen worden iets zwaarder: een kleine stap per oefening.",
        changes: [
          { exercise: "Goblet squat", change: "Pak 2 kg zwaarder, of doe 12 herhalingen in plaats van 10." },
          { exercise: "Eenarmig roeien met dumbbell", change: "Pak 2 kg zwaarder; houd 10-12 herhalingen per kant aan." },
          { exercise: "Push-up op verhoging", change: "Kies een lagere verhoging, bijvoorbeeld een stoel in plaats van een tafel." },
          { exercise: "Roemeense deadlift met dumbbells", change: "Pak 2 kg zwaarder per hand." },
        ],
      },
      message: "We hebben je schema voor de rest van deze periode bijgestuurd.",
    },
  },
];

export const demoAccountView: AccountView = {
  name: demoCustomerName,
  orders: [
    {
      id: "demo-order",
      reference: "3F2A9C1B",
      product: "bundel",
      duration: "6m",
      status: "active",
      cancelAt: null,
      createdAt: new Date("2027-01-06T09:12:00+01:00"),
      manageable: true,
      commitmentEndsAt: new Date("2027-07-06T09:12:00+02:00"),
      // In de demo is het 20 april 2027: weegmoment 3 staat open, de check-in voor periode 5 komt eraan.
      checkin: {
        seq: 5,
        status: "upcoming",
        opensAt: new Date("2027-04-25T09:14:00+02:00"),
        dueAt: new Date("2027-04-28T09:14:00+02:00"),
      },
      weekly: {
        seq: 4,
        week: 3,
        status: "open",
        opensAt: new Date("2027-04-19T09:14:00+02:00"),
        closesAt: new Date("2027-04-25T09:14:00+02:00"),
      },
      lastWeightKg: 72.1,
    },
  ],
  plans,
  intake: demoIntake,
  startedAt: new Date("2027-01-06T09:12:00+01:00"),
  checkins: [
    {
      seq: 2,
      date: at("2027-02-03"),
      data: {
        weightKg: 75.6,
        waistCm: 92,
        energy: "Gemiddeld",
        sleep: "Matig",
        nutritionAdherence: "Meestal (70-90%)",
        hunger: "Soms",
        likedMeals: "De kwarkbowl en de roerbak",
        dislikedMeals: "Snellere lunches graag",
        trainingAdherence: "De meeste",
        difficulty: "Precies goed",
      },
    },
    {
      seq: 3,
      date: at("2027-03-03"),
      data: {
        weightKg: 74,
        waistCm: 89.5,
        energy: "Goed",
        sleep: "Matig",
        nutritionAdherence: "Bijna altijd (90% of meer)",
        hunger: "Soms",
        trainingAdherence: "Alle trainingen",
        difficulty: "Te licht",
        injuries: "Knie zeurt soms na het wandelen",
      },
    },
    {
      seq: 4,
      date: at("2027-03-31"),
      data: {
        weightKg: 72.3,
        waistCm: 87,
        energy: "Goed",
        sleep: "Goed",
        nutritionAdherence: "Meestal (70-90%)",
        hunger: "Bijna nooit",
        likedMeals: "Kip-teriyaki en de overnight oats",
        trainingAdherence: "De meeste",
        difficulty: "Precies goed",
        comments: "Druk op het werk, maar het lukt goed!",
      },
    },
  ],
  weekly: demoWeekly,
  weeklyReminders: true,
  health: demoHealth,
  // In het echt alleen zichtbaar in de eerste dagen na de aankoop; de demo laat zien hoe het eruitziet.
  guarantee: {
    orderId: "demo-order",
    reference: "3F2A9C1B",
    amountCents: monthlyPrice("bundel", "6m"),
    subscription: true,
    deadline: guaranteeDeadline(new Date("2027-01-06T09:12:00+01:00")),
    open: true,
    requestedAt: null,
    handledAt: null,
  },
  targets: [
    { seq: 1, date: at(PERIODS[0]), calories: sampleTargets.calories, proteinG: 120, carbsG: sampleTargets.carbsG, fatG: 50 },
    { seq: 2, date: at(PERIODS[1]), calories: 1570, proteinG: 120, carbsG: 160, fatG: 50 },
    { seq: 3, date: at(PERIODS[2]), calories: 1550, proteinG: 120, carbsG: 155, fatG: 50 },
    { seq: 4, date: at(PERIODS[3]), calories: sampleTargetsFollowUp.calories, proteinG: 120, carbsG: sampleTargetsFollowUp.carbsG, fatG: 50 },
  ],
};

/**
 * Dezelfde weegmomenten in het Engels. Antwoorden uit vaste keuzes (energie,
 * honger, ...) blijven de Nederlandse waarden, net als in de database; vrije
 * tekst en onze uitleg zijn Engels.
 */
const demoWeeklyEn: WeeklyLog[] = [
  {
    ...demoWeekly[0],
    adjustment: { kcal: 0, calories: 1540, message: "You're on track. Your plan stays as it is; keep it up!" },
  },
  {
    ...demoWeekly[1],
    data: { ...demoWeekly[1].data, comments: "The workouts are getting easier and easier!" },
    adjustment: {
      kcal: -100,
      calories: 1440,
      nutritionReason:
        "You lost 0.2 kg, less than expected (0.9 kg), even though you followed the plan well. So you'll now eat 100 kcal less per day.",
      training: "zwaarder",
      trainingReason: "You found the workouts too easy. So we're making them a little harder.",
      nutrition: {
        summary: "From now on, you'll eat about 100 kcal less per day, with the same dishes.",
        swaps: [
          { meal: "Breakfast: quark bowl", change: "Have 30 g oats instead of 40 g, and 10 g walnuts instead of 15 g.", kcal: -60 },
          { meal: "Dinner", change: "Have 150 g baby potatoes instead of 200 g, or 50 g brown rice (uncooked) instead of 60 g.", kcal: -40 },
        ],
      },
      trainingPlan: {
        summary: "Your workouts get a little harder: one small step per exercise.",
        changes: [
          { exercise: "Goblet squat", change: "Go 2 kg heavier, or do 12 reps instead of 10." },
          { exercise: "One-arm dumbbell row", change: "Go 2 kg heavier; stick to 10-12 reps per side." },
          { exercise: "Incline push-up", change: "Use a lower surface, for example a chair instead of a table." },
          { exercise: "Dumbbell Romanian deadlift", change: "Go 2 kg heavier per hand." },
        ],
      },
      message: "We've adjusted your plan for the rest of this period.",
    },
  },
];

const [checkin2, checkin3, checkin4] = demoAccountView.checkins;

/** De voorbeeldomgeving in het Engels: dezelfde klant, met Engelse vrije tekst. */
const demoAccountViewEn: AccountView = {
  ...demoAccountView,
  intake: { ...demoIntake, dislikes: "mushrooms" },
  checkins: [
    {
      ...checkin2,
      data: { ...checkin2.data, likedMeals: "The quark bowl and the stir-fry", dislikedMeals: "Quicker lunches, please" },
    },
    {
      ...checkin3,
      data: { ...checkin3.data, injuries: "My knee sometimes aches after walking" },
    },
    {
      ...checkin4,
      data: { ...checkin4.data, likedMeals: "Chicken teriyaki and the overnight oats", comments: "Busy at work, but it's going well!" },
    },
  ],
  weekly: demoWeeklyEn,
};

/** De voorbeeldomgeving in de gegeven taal. */
export function demoAccountViewFor(l: Locale): AccountView {
  return l === "en" ? demoAccountViewEn : demoAccountView;
}

/** De voorbeeld-weegmomenten in de gegeven taal. */
export function demoWeeklyFor(l: Locale): WeeklyLog[] {
  return l === "en" ? demoWeeklyEn : demoWeekly;
}
