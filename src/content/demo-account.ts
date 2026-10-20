import type { AccountView, DashboardPlan } from "@/lib/account-types";
import type { Intake } from "@/lib/intake";
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
      checkin: {
        seq: 5,
        status: "open",
        opensAt: new Date("2027-04-25T09:14:00+02:00"),
        dueAt: new Date("2027-04-28T09:14:00+02:00"),
      },
      lastWeightKg: 72.3,
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
  targets: [
    { seq: 1, date: at(PERIODS[0]), calories: sampleTargets.calories, proteinG: 120, carbsG: sampleTargets.carbsG, fatG: 50 },
    { seq: 2, date: at(PERIODS[1]), calories: 1570, proteinG: 120, carbsG: 160, fatG: 50 },
    { seq: 3, date: at(PERIODS[2]), calories: 1550, proteinG: 120, carbsG: 155, fatG: 50 },
    { seq: 4, date: at(PERIODS[3]), calories: sampleTargetsFollowUp.calories, proteinG: 120, carbsG: sampleTargetsFollowUp.carbsG, fatG: 50 },
  ],
};
