"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2, Lock, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  applyPercentOff,
  durations,
  isSubscription,
  monthlyPrice,
  products,
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
import { PricingTable } from "@/components/pricing/PricingTable";
import { startCheckout, type CheckoutState } from "@/app/(site)/start/actions";

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

function validateStep(step: StepId, s: QuizState): string | null {
  const a = s.answers;
  switch (step) {
    case "doel":
      return a.goal ? null : "Kies je doel";
    case "hulp":
      return s.product ? null : "Kies waar je hulp bij wilt";
    case "over-jou": {
      if (!a.sex) return "Kies je geslacht";
      const age = num(a.age);
      if (!Number.isFinite(age)) return "Vul je leeftijd in";
      if (age < 18) return "Onze schema's zijn alleen voor volwassenen (18+).";
      if (age > 99) return "Vul een geldige leeftijd in";
      return null;
    }
    case "lichaam": {
      const h = num(a.heightCm);
      const w = num(a.weightKg);
      if (!(h >= 130 && h <= 230)) return "Vul je lengte in centimeters in (bijv. 172)";
      if (!(w >= 35 && w <= 300)) return "Vul je gewicht in kilo's in (bijv. 78)";
      if (losing(a)) {
        const t = num(a.targetWeightKg);
        if (!Number.isFinite(t)) return "Vul je streefgewicht in";
        if (t >= w) return "Je streefgewicht moet lager zijn dan je huidige gewicht";
        if (t < 35) return "Vul een realistisch streefgewicht in";
      }
      return null;
    }
    case "activiteit":
      return a.activity ? null : "Kies wat het best bij je past";
    case "training-plek":
      if (!a.location) return "Kies waar je traint";
      return a.experience ? null : "Kies je ervaring";
    case "gezondheid":
      if (a.pregnant === undefined) return "Beantwoord de vraag over zwangerschap";
      if (a.eatingDisorder === undefined) return "Beantwoord de vraag over eetstoornissen";
      return null;
    default:
      return null;
  }
}

export function Quiz({
  initialProduct,
  initialDuration,
  startAtPlan,
  launch,
}: {
  initialProduct: ProductId | null;
  initialDuration: DurationId;
  startAtPlan: boolean;
  launch: { active: boolean; percentOff: number };
}) {
  const presetProduct = initialProduct !== null;
  const [s, setS] = useState<QuizState>({
    product: initialProduct,
    duration: initialDuration,
    step: "doel",
    answered: [],
    answers: initialAnswers,
    name: "",
    email: "",
    consents: { healthData: false, terms: false, immediateDelivery: false, marketing: false },
  });
  const [error, setError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);
  const restored = useRef(false);
  const topRef = useRef<HTMLDivElement>(null);
  const [checkoutState, formAction, pending] = useActionState<CheckoutState, FormData>(startCheckout, {});

  // Herstel een eerder ingevulde vragenlijst (bijv. na annuleren van de betaling).
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as QuizState;
      const next: QuizState = {
        ...parsed,
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
  }, [initialProduct, initialDuration, presetProduct, startAtPlan]);

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
  const safety = intake ? checkSafety(intake) : null;

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
    const problem = validateStep(state.step, state);
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

  const payload = JSON.stringify({
    intake: toIntakeInput(s),
    customer: { name: s.name, email: s.email },
    consents: s.consents,
    product: s.product,
    duration: s.duration,
  });

  const a = s.answers;

  return (
    <div ref={topRef} className="scroll-mt-24">
      {s.step !== "plan" && (
        <div className="mx-auto mb-8 max-w-2xl">
          <div className="mb-3 flex items-center justify-between text-sm font-semibold text-muted">
            {index > 0 ? (
              <button type="button" onClick={back} className="inline-flex items-center gap-1 hover:text-ink">
                <ArrowLeft className="size-4" aria-hidden /> Vorige
              </button>
            ) : (
              <span />
            )}
            <span>{progress}% klaar</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-brand-100" aria-hidden>
            <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${Math.max(progress, 4)}%` }} />
          </div>
        </div>
      )}

      <div className={s.step === "plan" ? "" : "mx-auto max-w-2xl"}>
        {s.step === "doel" && (
          <Step title="Wat is je belangrijkste doel?" subtitle="We stemmen je hele schema hierop af.">
            <Options>
              {(Object.keys(goalOptions) as Intake["goal"][]).map((g) => (
                <OptionCard
                  key={g}
                  selected={a.goal === g}
                  onClick={() => pickAndNext({ goal: g })}
                  title={goalOptions[g].label}
                  description={goalOptions[g].description}
                />
              ))}
            </Options>
          </Step>
        )}

        {s.step === "hulp" && (
          <Step title="Waar wil je hulp bij?" subtitle="Je kunt dit straks nog aanpassen.">
            <Options>
              <OptionCard
                selected={s.product === "bundel"}
                onClick={() => pickAndNext({ product: "bundel" })}
                title="Voeding én training"
                description="Snelst resultaat: alles op elkaar afgestemd"
                badge="Meest gekozen"
              />
              <OptionCard
                selected={s.product === "voeding"}
                onClick={() => pickAndNext({ product: "voeding" })}
                title="Alleen voeding"
                description="Weekmenu, recepten en boodschappenlijst"
              />
              <OptionCard
                selected={s.product === "training"}
                onClick={() => pickAndNext({ product: "training" })}
                title="Alleen training"
                description="Thuis of in de sportschool"
              />
            </Options>
          </Step>
        )}

        {s.step === "over-jou" && (
          <Step title="Vertel iets over jezelf" subtitle="Dit hebben we nodig om je energiebehoefte te berekenen.">
            <fieldset>
              <legend className="label">Geslacht</legend>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(sexOptions) as Intake["sex"][]).map((x) => (
                  <ChoiceChip key={x} selected={a.sex === x} onClick={() => update({ sex: x })}>
                    {sexOptions[x]}
                  </ChoiceChip>
                ))}
              </div>
              <p className="mt-2 text-sm text-muted">
                Mannen en vrouwen hebben een andere energiebehoefte. Daarom hebben we dit nodig voor een goede berekening.
              </p>
            </fieldset>
            <NumberField label="Leeftijd" suffix="jaar" value={a.age} onChange={(v) => update({ age: v })} placeholder="35" />
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "lichaam" && (
          <Step title="Je lengte en gewicht" subtitle="Eerlijk invullen geeft het beste schema. Niemand anders ziet dit.">
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Lengte" suffix="cm" value={a.heightCm} onChange={(v) => update({ heightCm: v })} placeholder="170" />
              <NumberField label="Huidig gewicht" suffix="kg" value={a.weightKg} onChange={(v) => update({ weightKg: v })} placeholder="78" decimal />
            </div>
            {losing(a) && (
              <NumberField
                label="Streefgewicht"
                suffix="kg"
                value={a.targetWeightKg}
                onChange={(v) => update({ targetWeightKg: v })}
                placeholder="68"
                decimal
                hint="Tip: kies een eerste tussendoel van 5 à 10% van je gewicht. Dat is goed haalbaar én al heel gezond."
              />
            )}
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "tempo" && (
          <Step title="Hoe snel wil je afvallen?" subtitle="Rustiger afvallen is beter vol te houden en je houdt meer spiermassa.">
            <Options>
              {(Object.keys(paceOptions) as Intake["pace"][]).map((p) => (
                <OptionCard
                  key={p}
                  selected={a.pace === p}
                  onClick={() => pickAndNext({ pace: p })}
                  title={paceOptions[p].label}
                  description={paceOptions[p].description}
                  badge={p === "gemiddeld" ? "Aanbevolen" : undefined}
                />
              ))}
            </Options>
          </Step>
        )}

        {s.step === "activiteit" && (
          <Step title="Hoe actief ben je op een gewone dag?" subtitle="Training niet meegerekend.">
            <Options>
              {(Object.keys(activityOptions) as Intake["activity"][]).map((x) => (
                <OptionCard
                  key={x}
                  selected={a.activity === x}
                  onClick={() => pickAndNext({ activity: x })}
                  title={activityOptions[x].label}
                  description={activityOptions[x].description}
                />
              ))}
            </Options>
          </Step>
        )}

        {s.step === "eetstijl" && (
          <Step title="Wat eet je wel en niet?" subtitle="Je schema bevat alleen gerechten die bij jou passen.">
            <fieldset>
              <legend className="label">Eetpatroon</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(dietOptions) as Intake["diet"][]).map((d) => (
                  <ChoiceChip key={d} selected={a.diet === d} onClick={() => update({ diet: d })}>
                    {dietOptions[d]}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Allergieën of intoleranties</legend>
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
                      {allergyOptions[al]}
                    </ChoiceChip>
                  );
                })}
              </div>
            </fieldset>
            <TextField
              label="Andere allergieën (optioneel)"
              value={a.otherAllergies}
              onChange={(v) => update({ otherAllergies: v })}
              placeholder="Bijv. selderij of kiwi"
            />
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "maaltijden" && (
          <Step title="Jouw eetmomenten en keuken" subtitle="Zo past je schema in je dagelijkse leven.">
            <fieldset>
              <legend className="label">Hoeveel eetmomenten per dag?</legend>
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map((n) => (
                  <ChoiceChip key={n} selected={a.mealsPerDay === n} onClick={() => update({ mealsPerDay: n })}>
                    {n} {n === 3 ? "(geen snacks)" : n === 4 ? "(1 snack)" : "(2 snacks)"}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Hoeveel tijd wil je besteden aan koken?</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(cookingTimeOptions) as Intake["cookingTime"][]).map((c) => (
                  <ChoiceChip key={c} selected={a.cookingTime === c} onClick={() => update({ cookingTime: c })}>
                    <span className="block font-bold">{cookingTimeOptions[c].label}</span>
                    <span className="block text-xs font-normal opacity-80">{cookingTimeOptions[c].description}</span>
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Budget voor boodschappen</legend>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(budgetOptions) as Intake["budget"][]).map((b) => (
                  <ChoiceChip key={b} selected={a.budget === b} onClick={() => update({ budget: b })}>
                    {budgetOptions[b]}
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <TextField
              label="Wat lust je niet? (optioneel)"
              value={a.dislikes}
              onChange={(v) => update({ dislikes: v })}
              placeholder="Bijv. champignons, koriander, avocado"
            />
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "training-plek" && (
          <Step title="Waar ga je trainen?" subtitle="Je krijgt alleen oefeningen die bij jouw situatie passen.">
            <fieldset>
              <legend className="label">Trainingsplek</legend>
              <div className="grid gap-2">
                {(Object.keys(locationOptions) as Intake["location"][]).map((l) => (
                  <ChoiceChip key={l} selected={a.location === l} onClick={() => update({ location: l })}>
                    <span className="block font-bold">{locationOptions[l].label}</span>
                    <span className="block text-xs font-normal opacity-80">{locationOptions[l].description}</span>
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Ervaring met krachttraining</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {(Object.keys(experienceOptions) as Intake["experience"][]).map((x) => (
                  <ChoiceChip key={x} selected={a.experience === x} onClick={() => update({ experience: x })}>
                    <span className="block font-bold">{experienceOptions[x].label}</span>
                    <span className="block text-xs font-normal opacity-80">{experienceOptions[x].description}</span>
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "training-tijd" && (
          <Step title="Hoeveel tijd heb je om te trainen?" subtitle="Liever 3 keer per week volhouden dan 5 keer en afhaken.">
            <fieldset>
              <legend className="label">Trainingen per week</legend>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((n) => (
                  <ChoiceChip key={n} selected={a.trainingDays === n} onClick={() => update({ trainingDays: n })}>
                    {n}x
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="label">Tijd per training</legend>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 75].map((n) => (
                  <ChoiceChip key={n} selected={a.sessionMinutes === n} onClick={() => update({ sessionMinutes: n })}>
                    {n} min
                  </ChoiceChip>
                ))}
              </div>
            </fieldset>
            <TextField
              label="Blessures of klachten? (optioneel)"
              value={a.injuries}
              onChange={(v) => update({ injuries: v })}
              placeholder="Bijv. pijnlijke knie, onderrugklachten"
            />
            <NextButton onClick={() => next()} />
          </Step>
        )}

        {s.step === "gezondheid" && (
          <Step title="Een paar vragen over je gezondheid" subtitle="Voor je veiligheid. Deze gegevens behandelen we vertrouwelijk.">
            <YesNo label="Ben je zwanger of geef je borstvoeding?" value={a.pregnant} onChange={(v) => update({ pregnant: v })} />
            <YesNo
              label="Heb je (of had je) een eetstoornis?"
              value={a.eatingDisorder}
              onChange={(v) => update({ eatingDisorder: v })}
            />
            <fieldset>
              <legend className="label">Heb je een van deze aandoeningen?</legend>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(conditionOptions) as Intake["conditions"]).map((c) => {
                  const on = c === "geen" ? a.conditions.length === 0 : a.conditions.includes(c);
                  return (
                    <ChoiceChip
                      key={c}
                      multi
                      selected={on}
                      onClick={() =>
                        update({
                          conditions:
                            c === "geen" ? [] : on ? a.conditions.filter((x) => x !== c) : [...a.conditions, c],
                          ...(c === "geen" ? { doctorApproval: false } : {}),
                        })
                      }
                    >
                      {conditionOptions[c]}
                    </ChoiceChip>
                  );
                })}
              </div>
            </fieldset>
            {a.conditions.length > 0 && (
              <>
                <TextField
                  label="Gebruik je medicatie? (optioneel)"
                  value={a.medication}
                  onChange={(v) => update({ medication: v })}
                  placeholder="Bijv. metformine, bloeddrukverlagers"
                />
                <Checkbox
                  checked={a.doctorApproval}
                  onChange={(v) => update({ doctorApproval: v })}
                  label="Ik heb met mijn arts overlegd dat een voedings- of trainingsschema voor mij verantwoord is."
                />
              </>
            )}
            <NextButton onClick={() => next()} label="Bereken mijn resultaat" />
          </Step>
        )}

        {s.step === "resultaat" &&
          (calculating || !intake || !targets ? (
            <Calculating />
          ) : safety && !safety.ok ? (
            <div className="card p-7">
              <TriangleAlert className="size-10 text-accent-500" aria-hidden />
              <h2 className="heading-md mt-4">We kunnen je op dit moment helaas geen schema aanbieden</h2>
              <p className="mt-3 leading-relaxed text-muted">{safety.reason}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" onClick={() => goTo("doel")} className="btn-secondary">
                  Antwoorden aanpassen
                </button>
                <Link href="/contact" className="btn-secondary">
                  Neem contact op
                </Link>
              </div>
            </div>
          ) : (
            <Step
              title={`Jouw persoonlijke plan is klaar om gemaakt te worden`}
              subtitle="Op basis van je antwoorden hebben we jouw dagdoelen berekend."
            >
              <div className="rounded-[var(--radius-card)] bg-brand-900 p-6 text-white">
                <p className="text-sm font-semibold text-white/70">Jouw dagelijkse energiedoel</p>
                <p className="mt-1 text-5xl font-extrabold tracking-tight">
                  {formatNumber(targets.calories)} <span className="text-2xl">kcal</span>
                </p>
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "Eiwit", value: `${targets.proteinG} g` },
                    { label: "Koolhydraten", value: `${targets.carbsG} g` },
                    { label: "Vet", value: `${targets.fatG} g` },
                  ].map((m) => (
                    <div key={m.label} className="rounded-2xl bg-white/10 p-3">
                      <p className="text-xs text-white/70">{m.label}</p>
                      <p className="text-lg font-extrabold">{m.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-white/70">
                  Je onderhoudsniveau is ongeveer {formatNumber(targets.tdee)} kcal per dag. BMI: {formatNumber(targets.bmi, 1)}.
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
                <h3 className="text-lg font-bold">Waar mogen we je schema naartoe sturen?</h3>
                <TextField label="Voornaam" value={s.name} onChange={(v) => setS({ ...s, name: v })} placeholder="Sanne" autoComplete="given-name" />
                <TextField
                  label="E-mailadres"
                  type="email"
                  value={s.email}
                  onChange={(v) => setS({ ...s, email: v })}
                  placeholder="sanne@voorbeeld.nl"
                  autoComplete="email"
                />
                <NextButton
                  label="Bekijk mijn plan"
                  onClick={() => {
                    if (s.name.trim().length < 2) return setError("Vul je voornaam in");
                    if (!/^\S+@\S+\.\S+$/.test(s.email.trim())) return setError("Vul een geldig e-mailadres in");
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
                <ArrowLeft className="size-4" aria-hidden /> Terug naar je resultaat
              </button>
              <h1 className="heading-lg">{s.name ? `${s.name.trim()}, kies` : "Kies"} je plan</h1>
              <p className="mt-3 text-lg text-muted">
                {targets ? `Je schema wordt gemaakt op ${formatNumber(targets.calories)} kcal en ${targets.proteinG} g eiwit per dag. ` : ""}
                Na betaling staat het binnen enkele minuten klaar.
              </p>
            </div>
            <PricingTable
              initialDuration={s.duration}
              launch={launch}
              onSelect={choosePlan}
              selectedProduct={s.product ?? undefined}
            />
            {s.product && (
              <CheckoutBox
                state={s}
                setConsents={(c) => setS({ ...s, consents: { ...s.consents, ...c } })}
                launch={launch}
                payload={payload}
                formAction={formAction}
                pending={pending}
                serverError={checkoutState.error}
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
  launch,
  payload,
  formAction,
  pending,
  serverError,
}: {
  state: QuizState;
  setConsents: (c: Partial<QuizState["consents"]>) => void;
  launch: { active: boolean; percentOff: number };
  payload: string;
  formAction: (fd: FormData) => void;
  pending: boolean;
  serverError?: string;
}) {
  const product = state.product!;
  const d = durations[state.duration];
  const subscription = isSubscription(state.duration);
  const total = monthlyPrice(product, state.duration);
  const first = launch.active ? applyPercentOff(total, launch.percentOff) : total;
  const c = state.consents;
  const ready = c.healthData && c.terms && c.immediateDelivery;
  const [touched, setTouched] = useState(false);

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
        const data = new FormData(e.currentTarget);
        startTransition(() => formAction(data));
      }}
      className="card mx-auto mt-12 max-w-2xl scroll-mt-24 p-6 sm:p-8"
    >
      <input type="hidden" name="payload" value={payload} />
      <h2 className="heading-md">Je bestelling</h2>
      <dl className="mt-5 space-y-3 text-[0.9375rem]">
        <div className="flex justify-between gap-4">
          <dt className="font-semibold">
            {products[product].name} ·{" "}
            {!subscription ? "los schema" : d.months === 1 ? "per maand" : `minimaal ${d.label}`}
          </dt>
          <dd className="font-semibold">
            {euro(total)}
            {subscription ? " p/m" : ""}
          </dd>
        </div>
        {launch.active && (
          <div className="flex justify-between gap-4 text-brand-700">
            <dt>Lanceringskorting ({launch.percentOff}%)</dt>
            <dd>− {euro(total - first)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-lg font-extrabold">
          <dt>{subscription ? "Nu te betalen (eerste maand)" : "Nu te betalen"}</dt>
          <dd>{euro(first)}</dd>
        </div>
        <p className="text-sm text-muted">
          {subscription
            ? d.months === 1
              ? `Daarna schrijven we elke maand ${euro(total)} af via automatische incasso. Maandelijks opzegbaar.`
              : `Daarna schrijven we elke maand ${euro(total)} af via automatische incasso. Minimale looptijd ${d.label}, daarna maandelijks opzegbaar.`
            : "Eenmalige betaling, geen abonnement."}{" "}
          Inclusief 21% btw.
        </p>
      </dl>

      <div className="mt-6 space-y-3">
        <Checkbox
          checked={c.healthData}
          onChange={(v) => setConsents({ healthData: v })}
          invalid={touched && !c.healthData}
          label={
            <>
              Ik geef uitdrukkelijk toestemming om mijn gezondheidsgegevens (zoals gewicht, lengte en eventuele
              aandoeningen) te gebruiken om mijn schema te maken. Zie het{" "}
              <Link href="/privacybeleid" target="_blank" className="font-semibold underline">
                privacybeleid
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
              Ik ga akkoord met de{" "}
              <Link href="/algemene-voorwaarden" target="_blank" className="font-semibold underline">
                algemene voorwaarden
              </Link>
              .
            </>
          }
        />
        <Checkbox
          checked={c.immediateDelivery}
          onChange={(v) => setConsents({ immediateDelivery: v })}
          invalid={touched && !c.immediateDelivery}
          label="Ik wil dat jullie direct na mijn betaling beginnen met het maken van mijn schema. Ik weet dat ik daardoor mijn herroepingsrecht verlies zodra het schema aan mij is geleverd."
        />
        <Checkbox
          checked={c.marketing}
          onChange={(v) => setConsents({ marketing: v })}
          label="Stuur mij af en toe tips en aanbiedingen per e-mail (optioneel, afmelden kan altijd)."
        />
      </div>

      {touched && !ready && (
        <p role="alert" className="mt-4 text-sm font-semibold text-accent-600">
          Vink de verplichte vakjes aan om verder te gaan.
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
            <Loader2 className="size-5 animate-spin" aria-hidden /> Betaalpagina openen…
          </>
        ) : (
          <>
            <Lock className="size-5" aria-hidden /> Doorgaan naar veilig betalen
          </>
        )}
      </button>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-muted">
        <ShieldCheck className="size-4 text-brand-600" aria-hidden />
        {subscription
          ? "Eerste maand met iDEAL | Wero, Bancontact of IBAN; daarna automatische SEPA-incasso"
          : "Betalen via Stripe met iDEAL | Wero, Bancontact of creditcard"}
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
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <ChoiceChip selected={value === false} onClick={() => onChange(false)}>
          Nee
        </ChoiceChip>
        <ChoiceChip selected={value === true} onClick={() => onChange(true)}>
          Ja
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

function NextButton({ onClick, label = "Volgende" }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="btn-primary w-full text-lg sm:w-auto">
      {label} <ArrowRight className="size-5" aria-hidden />
    </button>
  );
}

function Calculating() {
  const items = ["Energiebehoefte berekenen", "Eiwitbehoefte bepalen", "Veilig tempo kiezen", "Jouw plan samenstellen"];
  return (
    <div className="card p-8 text-center" role="status" aria-live="polite">
      <Loader2 className="mx-auto size-10 animate-spin text-brand-600" aria-hidden />
      <h2 className="heading-md mt-4">Even rekenen…</h2>
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
  const dateLabel = new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(date);

  return (
    <div className="card p-6">
      <p className="text-lg leading-snug font-bold">
        Met dit plan kun je rond <span className="text-brand-600">{dateLabel}</span> op{" "}
        <span className="text-brand-600">{formatNumber(target, target % 1 ? 1 : 0)} kg</span> zitten.
      </p>
      <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" role="img" aria-label={`Verwachte gewichtsdaling van ${max} naar ${target} kilo in ${weeks} weken`}>
        <line x1={pad.l} x2={width - pad.r} y1={y(target)} y2={y(target)} stroke="#b5e4c8" strokeDasharray="6 6" />
        <path d={`${d} L${x(weeks)},${height - pad.b} L${x(0)},${height - pad.b} Z`} fill="#d9f2e2" opacity="0.6" />
        <path d={d} fill="none" stroke="#1c7a48" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={x(0)} cy={y(max)} r="6" fill="#ffffff" stroke="#1c7a48" strokeWidth="3" />
        <circle cx={x(weeks)} cy={y(target)} r="7" fill="#c8f169" stroke="#123f29" strokeWidth="3" />
        <text x={pad.l - 8} y={y(max) + 4} textAnchor="end" fontSize="13" fill="#4d6156" fontWeight="600">
          {formatNumber(max, max % 1 ? 1 : 0)}
        </text>
        <text x={pad.l - 8} y={y(target) + 4} textAnchor="end" fontSize="13" fill="#4d6156" fontWeight="600">
          {formatNumber(target, target % 1 ? 1 : 0)}
        </text>
        <text x={x(0)} y={height - 8} fontSize="13" fill="#4d6156">
          Nu
        </text>
        <text x={x(weeks)} y={height - 8} textAnchor="end" fontSize="13" fill="#4d6156">
          Week {weeks}
        </text>
      </svg>
      <p className="mt-2 text-xs text-muted">
        Indicatie op basis van een gemiddeld en veilig tempo. Iedereen is anders: je gewicht schommelt van dag tot dag en
        het resultaat hangt af van hoe je het schema volgt.
      </p>
    </div>
  );
}
