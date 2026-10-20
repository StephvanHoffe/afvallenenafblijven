import Link from "@/i18n/Link";
import { Dumbbell, HeartPulse, Salad, UserRound } from "lucide-react";
import { accountHref } from "@/components/account/AccountShell";
import { EnergyBars, MacroBar } from "@/components/account/charts/Indicators";
import { HealthConnections, type ConnectionNotice } from "@/components/account/health/HealthConnections";
import { Section } from "@/components/account/shared";
import { products } from "@/config/pricing";
import { defineCopy, type Locale } from "@/i18n/config";
import { intakeLabels } from "@/i18n/options";
import type { AccountView } from "@/lib/account-types";
import { bmi, nutritionTargets } from "@/lib/calculations";
import { formatDate, formatNumber } from "@/lib/format";
import { wantsWeightLoss } from "@/lib/intake";
import { currentProfile } from "@/lib/progress";

const copy = defineCopy({
  nl: {
    empty: "We hebben nog geen gegevens van je vragenlijst.",
    intro: (date: string | null) =>
      `Dit zijn de gegevens waarop je schema's zijn gebaseerd: je antwoorden uit de vragenlijst${date ? ` van ${date}` : ""}, bijgewerkt met je check-ins.`,
    about: "Over jou",
    sex: "Geslacht",
    ageAtStart: "Leeftijd bij de start",
    years: (n: number) => `${n} jaar`,
    height: "Lengte",
    weightAtStart: "Gewicht bij de start",
    weightNow: "Gewicht nu",
    bmiNow: "BMI nu",
    goal: "Doel",
    goalAtStart: (goal: string) => ` (bij de start: ${goal})`,
    targetWeight: "Streefgewicht",
    pace: "Tempo",
    activity: "Dagelijkse activiteit",
    dailyTargets: "Je dagdoelen",
    dailyIntro: "Berekend uit je gewicht, lengte, leeftijd en activiteit, en bijgesteld na je check-ins.",
    energy: "Energie per dag",
    deficitBefore: "Je eet ongeveer",
    deficitAfter: "per dag minder dan je verbruikt. Zo val je geleidelijk af, zonder crashdieet.",
    split: "Verdeling van je calorieën",
    water: "Water",
    fiber: "Vezels",
    steps: "Stappen",
    food: "Eten",
    diet: "Eetpatroon",
    allergies: "Allergieën en intoleranties",
    none: "Geen",
    dislikes: "Lust niet",
    nothingGiven: "Niets opgegeven",
    meals: "Eetmomenten per dag",
    cookingTime: "Kooktijd",
    budget: "Budget",
    training: "Trainen",
    location: "Waar je traint",
    experience: "Ervaring",
    perWeek: "Trainingen per week",
    daysAtStart: (n: number) => ` (bij de start ${n}x)`,
    sessionTime: "Tijd per training",
    minutes: (n: number) => `${n} minuten`,
    injuries: "Blessures en klachten",
    noneGiven: "Geen opgegeven",
    health: "Gezondheid",
    conditions: "Medische aandoeningen",
    medication: "Medicatie",
    doctor: "Overleg met arts",
    yes: "Ja",
    no: "Nee",
    notes: "Opmerkingen",
    changeTitle: "Klopt er iets niet meer?",
    change1: "Je gewicht, doel, aantal trainingen en nieuwe klachten geef je door bij je",
    changeCheckin: "check-in",
    change2: ". Wil je iets anders aanpassen, zoals je allergieën of eetpatroon, of wil je je gegevens inzien of laten verwijderen?",
    changeContact: "Neem contact op",
    change3: ". Lees ook hoe we met je gegevens omgaan in ons",
    changePrivacy: "privacybeleid",
  },
  en: {
    empty: "We don't have any details from your questionnaire yet.",
    intro: (date: string | null) =>
      `These are the details your plans are based on: your answers to the questionnaire${date ? ` from ${date}` : ""}, updated with your check-ins.`,
    about: "About you",
    sex: "Sex",
    ageAtStart: "Age at the start",
    years: (n: number) => `${n} years`,
    height: "Height",
    weightAtStart: "Weight at the start",
    weightNow: "Weight now",
    bmiNow: "BMI now",
    goal: "Goal",
    goalAtStart: (goal: string) => ` (at the start: ${goal})`,
    targetWeight: "Target weight",
    pace: "Pace",
    activity: "Daily activity",
    dailyTargets: "Your daily targets",
    dailyIntro: "Calculated from your weight, height, age and activity, and adjusted after your check-ins.",
    energy: "Energy per day",
    deficitBefore: "You eat about",
    deficitAfter: "a day less than you burn. That way you lose weight gradually, without a crash diet.",
    split: "How your calories are split",
    water: "Water",
    fiber: "Fibre",
    steps: "Steps",
    food: "Food",
    diet: "Diet",
    allergies: "Allergies and intolerances",
    none: "None",
    dislikes: "Dislikes",
    nothingGiven: "Nothing specified",
    meals: "Meals per day",
    cookingTime: "Cooking time",
    budget: "Budget",
    training: "Training",
    location: "Where you train",
    experience: "Experience",
    perWeek: "Workouts per week",
    daysAtStart: (n: number) => ` (at the start ${n}x)`,
    sessionTime: "Time per workout",
    minutes: (n: number) => `${n} minutes`,
    injuries: "Injuries and aches",
    noneGiven: "None specified",
    health: "Health",
    conditions: "Medical conditions",
    medication: "Medication",
    doctor: "Discussed with a doctor",
    yes: "Yes",
    no: "No",
    notes: "Notes",
    changeTitle: "Something no longer right?",
    change1: "You can update your weight, goal, number of workouts and any new aches at your",
    changeCheckin: "check-in",
    change2: ". Want to change something else, such as your allergies or diet, or would you like to view or delete your data?",
    changeContact: "Get in touch",
    change3: ". You can also read how we handle your data in our",
    changePrivacy: "privacy policy",
  },
});

function Facts({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <div key={k}>
            <dt className="text-sm text-muted">{k}</dt>
            <dd className="font-semibold break-words">{v}</dd>
          </div>
        ))}
    </dl>
  );
}

function Title({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      {icon}
      {children}
    </span>
  );
}

export function DetailsTab({
  view,
  base,
  l,
  demo = false,
  connectionNotice = null,
}: {
  view: AccountView;
  base: string;
  l: Locale;
  demo?: boolean;
  connectionNotice?: ConnectionNotice;
}) {
  const c = copy[l];
  const start = view.intake;
  const now = currentProfile(view);
  if (!start || !now) {
    return <p className="card p-6 text-muted">{c.empty}</p>;
  }
  const labels = intakeLabels(l);
  const includes = new Set(view.orders.flatMap((o) => products[o.product].includes));
  if (includes.size === 0) products[start.product].includes.forEach((t) => includes.add(t));
  const computed = nutritionTargets(now);
  const latest = view.targets.at(-1);
  const calories = latest?.calories ?? computed.calories;
  const macros = latest ?? computed;
  const injuries = [start.injuries, ...view.checkins.map((ci) => ci.data.injuries)].filter(Boolean) as string[];
  const conditions = start.conditions.filter((x) => x !== "geen").map((x) => labels.condition[x]);
  const allergies = [...start.allergies.map((a) => labels.allergy[a]), ...(start.otherAllergies ? [start.otherAllergies] : [])];
  const kg = (n: number) => `${formatNumber(n, 1, l)} kg`;

  return (
    <div className="space-y-6">
      <p className="text-[0.9375rem] text-muted">{c.intro(view.startedAt ? formatDate(view.startedAt, l) : null)}</p>

      <Section title={<Title icon={<UserRound className="size-5 text-brand-600" aria-hidden />}>{c.about}</Title>}>
        <Facts
          rows={[
            [c.sex, labels.sex[start.sex]],
            [c.ageAtStart, c.years(start.age)],
            [c.height, `${start.heightCm} cm`],
            [c.weightAtStart, kg(start.weightKg)],
            [c.weightNow, now.weightKg !== start.weightKg ? kg(now.weightKg) : null],
            [c.bmiNow, formatNumber(Math.round(bmi(now.weightKg, now.heightCm) * 10) / 10, 1, l)],
            [c.goal, labels.goal[now.goal].label + (now.goal !== start.goal ? c.goalAtStart(labels.goal[start.goal].label.toLowerCase()) : "")],
            [c.targetWeight, wantsWeightLoss(now) && start.targetWeightKg ? kg(start.targetWeightKg) : null],
            [c.pace, wantsWeightLoss(now) ? labels.pace[start.pace].label : null],
            [c.activity, labels.activity[start.activity].label],
          ]}
        />
      </Section>

      {includes.has("voeding") && (
        <Section title={<Title icon={<Salad className="size-5 text-brand-600" aria-hidden />}>{c.dailyTargets}</Title>} intro={c.dailyIntro}>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="mb-3 text-sm font-bold">{c.energy}</h3>
              <EnergyBars bmr={computed.bmr} tdee={computed.tdee} calories={calories} l={l} />
              {computed.tdee > calories && (
                <p className="mt-3 text-sm text-muted">
                  {c.deficitBefore} <strong className="text-ink">{formatNumber(computed.tdee - calories, 0, l)} kcal</strong> {c.deficitAfter}
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">{c.split}</h3>
              <MacroBar proteinG={macros.proteinG} carbsG={macros.carbsG} fatG={macros.fatG} l={l} />
              <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-2xl bg-sand p-3">
                  <dt className="text-muted">{c.water}</dt>
                  <dd className="font-extrabold">± {formatNumber(computed.waterL, 1, l)} l</dd>
                </div>
                <div className="rounded-2xl bg-sand p-3">
                  <dt className="text-muted">{c.fiber}</dt>
                  <dd className="font-extrabold">{computed.fiberG} g</dd>
                </div>
                <div className="rounded-2xl bg-sand p-3">
                  <dt className="text-muted">{c.steps}</dt>
                  <dd className="font-extrabold">{formatNumber(computed.steps, 0, l)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {includes.has("voeding") && (
          <Section title={<Title icon={<Salad className="size-5 text-brand-600" aria-hidden />}>{c.food}</Title>}>
            <Facts
              rows={[
                [c.diet, labels.diet[start.diet]],
                [c.allergies, allergies.length ? allergies.join(", ") : c.none],
                [c.dislikes, start.dislikes ?? c.nothingGiven],
                [c.meals, String(start.mealsPerDay)],
                [c.cookingTime, labels.cookingTime[start.cookingTime].label],
                [c.budget, labels.budget[start.budget]],
              ]}
            />
          </Section>
        )}
        {includes.has("training") && (
          <Section title={<Title icon={<Dumbbell className="size-5 text-brand-600" aria-hidden />}>{c.training}</Title>}>
            <Facts
              rows={[
                [c.location, labels.location[start.location].label],
                [c.experience, labels.experience[start.experience].label],
                [c.perWeek, `${now.trainingDays}x${now.trainingDays !== start.trainingDays ? c.daysAtStart(start.trainingDays) : ""}`],
                [c.sessionTime, c.minutes(start.sessionMinutes)],
                [c.injuries, injuries.length ? injuries.join("; ") : c.noneGiven],
              ]}
            />
          </Section>
        )}
        <Section title={<Title icon={<HeartPulse className="size-5 text-brand-600" aria-hidden />}>{c.health}</Title>}>
          <Facts
            rows={[
              [c.conditions, conditions.length ? conditions.join(", ") : c.none],
              [c.medication, start.medication ?? c.noneGiven],
              [c.doctor, conditions.length ? (start.doctorApproval ? c.yes : c.no) : null],
              [c.notes, start.notes],
            ]}
          />
        </Section>
      </div>

      {view.health && <HealthConnections health={view.health} demo={demo} notice={connectionNotice} />}

      <section className="rounded-[var(--radius-card)] bg-sand p-6 text-[0.9375rem]">
        <h2 className="text-lg font-bold">{c.changeTitle}</h2>
        <p className="mt-1 text-muted">
          {c.change1}{" "}
          <Link href={accountHref(base, "check-in")} className="font-semibold text-brand-700 underline">
            {c.changeCheckin}
          </Link>
          {c.change2}{" "}
          <Link href="/contact" className="font-semibold text-brand-700 underline">
            {c.changeContact}
          </Link>
          {c.change3}{" "}
          <Link href="/privacybeleid" className="font-semibold text-brand-700 underline">
            {c.changePrivacy}
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
