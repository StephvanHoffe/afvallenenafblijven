import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { NutritionPlan, PlanContent, TrainingPlan } from "@/lib/ai/schemas";
import type { NutritionTargets } from "@/lib/calculations";
import { dayTotals } from "@/lib/ai/plan-math";
import { formatDate, formatNumber } from "@/lib/format";
import { site } from "@/config/site";
import { pdfText as t } from "@/lib/pdf/text";
import { isTrainingDay, restLabel, workoutShortName } from "@/lib/plan-format";
import { trainingDirectionLabel, type PlanAdjustment } from "@/lib/weekly";
import { defineCopy, type Locale } from "@/i18n/config";

/**
 * PDF-versies van de schema's (A4). Dezelfde inhoud als op de website, maar
 * ingedeeld om te printen: een overzicht, één pagina per dag of training,
 * een boodschappenlijst om af te vinken en een logboek voor je gewichten.
 */

export interface PdfPlan {
  content: PlanContent;
  seq: number;
  generatedAt: Date | null;
  /** Bijsturingen uit de wekelijkse weegmomenten van deze periode. */
  adjustments?: PlanAdjustment[];
}

const copy = defineCopy({
  nl: {
    footer: "Persoonlijk leefstijladvies, geen medisch advies. Overleg bij klachten met je huisarts.",
    page: (n: number, total: number) => `Pagina ${n} van ${total}`,
    period: (seq: number) => `periode ${seq}`,
    madeFor: (name: string, date: string | null) => `Persoonlijk voor ${name}${date ? ` · gemaakt op ${date}` : ""}`,
    changes: "Aangepast na je check-in",
    adjustments: "Bijgestuurd na je weegmoment",
    adjustmentsIntro: "Deze aanpassingen gelden voor de rest van deze periode, bovenop het schema.",
    adjustmentKcal: (week: number, kcal: string, target: string | null) =>
      `Week ${week}: ${kcal} kcal per dag${target ? ` (dagdoel nu ${target} kcal)` : ""}`,
    adjustmentTraining: (week: number, direction: string) => `Week ${week}: trainingen ${direction}`,
    calories: "Calorieën",
    caloriesWas: (kcal: string) => `Calorieën (was ${kcal})`,
    protein: "Eiwit",
    carbs: "Koolhydraten",
    fat: "Vet",
    water: "Water",
    steps: "Stappen",
    dailyTargets: "Jouw dagdoelen",
    day: "Dag",
    kcal: "Kcal",
    gProtein: "g eiwit",
    mealMacros: (protein: number, carbs: number, fat: number) => `eiwit ${protein} g · kh ${carbs} g · vet ${fat} g`,
    dayMacros: (kcal: string, protein: number, carbs: number, fat: number) =>
      `${kcal} kcal · ${protein} g eiwit · ${carbs} g koolhydraten · ${fat} g vet`,
    swap: "Liever iets anders? ",
    nutritionPlan: "Voedingsschema",
    nutritionFor: (name: string) => `Voedingsschema voor ${name}`,
    shoppingList: "Boodschappenlijst",
    shoppingTitle: "Boodschappenlijst voor de week",
    shoppingMeta: (name: string) => `Bij je voedingsschema · voor ${name} · alles per afdeling`,
    shoppingIntro: "Alles voor de hele week, per afdeling. Vink af wat je hebt.",
    howItWorks: "Zo werkt je schema",
    weekMenu: "Je weekmenu",
    recipesNext: "De recepten staan per dag op de volgende pagina's.",
    tip: "Tip: ",
    snackIdeas: "Snackideeën",
    mealPrep: "Slim voorbereiden",
    eatingOut: "Uit eten of op visite",
    adjusting: "Tussentijds bijsturen",
    trainingPlan: "Trainingsschema",
    trainingFor: (name: string) => `Trainingsschema voor ${name}`,
    yourWeek: "Jouw week",
    warmup: (minutes: number) => `Warming-up (${minutes} min) – voor elke training`,
    cooldown: "Cooling-down – na elke training",
    progression: "Zo bouw je op in 4 weken",
    workoutMeta: (minutes: number, exercises: number) => `± ${minutes} min · ${exercises} oefeningen`,
    workoutIntro: (minutes: number) => `Begin met de warming-up (${minutes} min) en sluit af met de cooling-down.`,
    exercise: "Oefening",
    sets: "Sets",
    reps: "Herhalingen",
    rest: "Rust",
    intensity: "Intensiteit",
    technique: "Techniek: ",
    alternative: "Alternatief: ",
    finisher: "Afsluiter: ",
    log: "Logboek",
    logIntro:
      'Noteer per week je gewicht en herhalingen, bijvoorbeeld "12 kg × 10". Zo zie je je vooruitgang en weet je wanneer je zwaarder kunt.',
    stepsCardio: "Stappen & cardio",
    recovery: "Herstel",
    safety: "Veiligheid",
    disclaimer:
      "Dit schema is persoonlijk leefstijladvies op basis van jouw antwoorden. Het is geen medisch advies en geen vervanging voor begeleiding door een arts, diëtist of fysiotherapeut. Heb je klachten, een medische aandoening of twijfel? Overleg dan eerst met je huisarts. Lees bij allergieën altijd de etiketten.",
    plansTitle: (name: string) => `Schema's – ${name}`,
    shoppingDocTitle: (name: string) => `Boodschappenlijst – ${name}`,
    language: "nl",
  },
  en: {
    footer: "Personal lifestyle advice, not medical advice. If you have any symptoms, talk to your GP.",
    page: (n: number, total: number) => `Page ${n} of ${total}`,
    period: (seq: number) => `period ${seq}`,
    madeFor: (name: string, date: string | null) => `Personal plan for ${name}${date ? ` · created on ${date}` : ""}`,
    changes: "Updated after your check-in",
    adjustments: "Adjusted after your weekly weigh-in",
    adjustmentsIntro: "These adjustments apply for the rest of this period, on top of the plan.",
    adjustmentKcal: (week: number, kcal: string, target: string | null) =>
      `Week ${week}: ${kcal} kcal per day${target ? ` (daily target now ${target} kcal)` : ""}`,
    adjustmentTraining: (week: number, direction: string) => `Week ${week}: ${direction} workouts`,
    calories: "Calories",
    caloriesWas: (kcal: string) => `Calories (was ${kcal})`,
    protein: "Protein",
    carbs: "Carbs",
    fat: "Fat",
    water: "Water",
    steps: "Steps",
    dailyTargets: "Your daily targets",
    day: "Day",
    kcal: "Kcal",
    gProtein: "g protein",
    mealMacros: (protein: number, carbs: number, fat: number) => `protein ${protein} g · carbs ${carbs} g · fat ${fat} g`,
    dayMacros: (kcal: string, protein: number, carbs: number, fat: number) =>
      `${kcal} kcal · ${protein} g protein · ${carbs} g carbs · ${fat} g fat`,
    swap: "Fancy something else? ",
    nutritionPlan: "Nutrition plan",
    nutritionFor: (name: string) => `Nutrition plan for ${name}`,
    shoppingList: "Shopping list",
    shoppingTitle: "Shopping list for the week",
    shoppingMeta: (name: string) => `With your nutrition plan · for ${name} · everything by aisle`,
    shoppingIntro: "Everything for the whole week, by aisle. Tick off what you already have.",
    howItWorks: "How your plan works",
    weekMenu: "Your weekly meal plan",
    recipesNext: "You'll find the recipes for each day on the following pages.",
    tip: "Tip: ",
    snackIdeas: "Snack ideas",
    mealPrep: "Smart meal prep",
    eatingOut: "Eating out or visiting friends",
    adjusting: "Adjusting along the way",
    trainingPlan: "Workout plan",
    trainingFor: (name: string) => `Workout plan for ${name}`,
    yourWeek: "Your week",
    warmup: (minutes: number) => `Warm-up (${minutes} min) – before every workout`,
    cooldown: "Cool-down – after every workout",
    progression: "How you progress over 4 weeks",
    workoutMeta: (minutes: number, exercises: number) => `± ${minutes} min · ${exercises} exercises`,
    workoutIntro: (minutes: number) => `Start with the warm-up (${minutes} min) and finish with the cool-down.`,
    exercise: "Exercise",
    sets: "Sets",
    reps: "Reps",
    rest: "Rest",
    intensity: "Intensity",
    technique: "Technique: ",
    alternative: "Alternative: ",
    finisher: "Finisher: ",
    log: "Training log",
    logIntro:
      'Each week, write down your weights and reps, for example "12 kg × 10". That way you can see your progress and know when you\'re ready to go heavier.',
    stepsCardio: "Steps & cardio",
    recovery: "Recovery",
    safety: "Safety",
    disclaimer:
      "This plan is personal lifestyle advice based on your answers. It is not medical advice and does not replace guidance from a doctor, dietitian or physiotherapist. Do you have symptoms, a medical condition or any doubts? Then check with your GP first. If you have allergies, always read the labels.",
    plansTitle: (name: string) => `Plans – ${name}`,
    shoppingDocTitle: (name: string) => `Shopping list – ${name}`,
    language: "en-GB",
  },
});

type Copy = (typeof copy)[Locale];

const c = {
  brand900: "#123f29",
  brand700: "#17623b",
  brand600: "#1c7a48",
  brand200: "#b5e4c8",
  brand50: "#effaf3",
  lime: "#c8f169",
  limeSoft: "#f6fbe8",
  ink: "#10231a",
  muted: "#4d6156",
  line: "#e5e4dc",
  sand: "#f7f6f1",
  accent50: "#fff4ee",
  accent600: "#d94711",
};

const s = StyleSheet.create({
  page: { fontSize: 9.5, color: c.ink, lineHeight: 1.4, paddingTop: 46, paddingBottom: 50, paddingHorizontal: 40 },
  running: {
    position: "absolute",
    top: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: c.muted,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: c.muted,
    borderTopWidth: 0.5,
    borderTopColor: c.line,
    paddingTop: 6,
  },
  band: {
    backgroundColor: c.brand900,
    color: "#ffffff",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  bandBrand: { fontSize: 12, fontWeight: 800 },
  bandKind: { fontSize: 8.5, fontWeight: 700, color: c.lime, textTransform: "uppercase", letterSpacing: 0.6 },
  h1: { fontSize: 21, fontWeight: 800, lineHeight: 1.15, letterSpacing: -0.3 },
  h2: { fontSize: 14, fontWeight: 800, marginBottom: 8 },
  h3: { fontSize: 10.5, fontWeight: 700 },
  eyebrow: { fontSize: 7, fontWeight: 700, color: c.brand600, textTransform: "uppercase", letterSpacing: 0.6 },
  meta: { fontSize: 8.5, color: c.muted, marginTop: 4 },
  intro: { fontSize: 10.5, color: c.muted, marginTop: 10, lineHeight: 1.5 },
  section: { marginTop: 16 },
  box: { borderWidth: 0.75, borderColor: c.line, borderRadius: 8, padding: 10 },
  small: { fontSize: 8, color: c.muted },
  row: { flexDirection: "row" },
  bullet: { flexDirection: "row", marginBottom: 3 },
  dot: { width: 10, color: c.brand600, fontWeight: 800 },
  num: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: c.brand600,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    marginTop: 0.5,
  },
  numText: { color: "#ffffff", fontSize: 7, fontWeight: 800, lineHeight: 1 },
  th: { fontSize: 7, fontWeight: 700, color: c.muted, textTransform: "uppercase", letterSpacing: 0.4 },
  checkbox: { width: 9, height: 9, borderWidth: 1, borderColor: c.brand600, borderRadius: 2, marginRight: 6, marginTop: 1.5 },
});

function Running({ left }: { left: string }) {
  return (
    <View style={s.running} fixed>
      <Text>{t(site.name)}</Text>
      <Text>{t(left)}</Text>
    </View>
  );
}

function Footer({ x }: { x: Copy }) {
  return (
    <View style={s.footer} fixed>
      <Text>{t(x.footer)}</Text>
      <Text render={({ pageNumber, totalPages }) => x.page(pageNumber, totalPages)} />
    </View>
  );
}

function Band({ kind }: { kind: string }) {
  return (
    <View style={s.band}>
      <Text style={s.bandBrand}>{t(site.name)}</Text>
      <Text style={s.bandKind}>{t(kind)}</Text>
    </View>
  );
}

function Bullets({ items, numbered = false }: { items: string[]; numbered?: boolean }) {
  return (
    <View>
      {items.map((item, i) => (
        <View key={`${i}-${item}`} style={s.bullet} wrap={false}>
          {numbered ? (
            <View style={s.num}>
              <Text style={s.numText}>{i + 1}</Text>
            </View>
          ) : (
            <Text style={s.dot}>•</Text>
          )}
          <Text style={{ flex: 1 }}>{t(item)}</Text>
        </View>
      ))}
    </View>
  );
}

function Heading({ title, kind, name, plan, l, x }: { title: string; kind: string; name: string; plan: PdfPlan; l: Locale; x: Copy }) {
  return (
    <View>
      <Band kind={plan.seq > 1 ? `${kind} · ${x.period(plan.seq)}` : kind} />
      <Text style={s.h1}>{t(title)}</Text>
      <Text style={s.meta}>{t(x.madeFor(name, plan.generatedAt ? formatDate(plan.generatedAt, l) : null))}</Text>
    </View>
  );
}

function Changes({ changes, x }: { changes: string[] | undefined; x: Copy }) {
  if (!changes?.length) return null;
  return (
    <View style={[s.section, s.box, { backgroundColor: c.limeSoft, borderColor: c.lime, borderWidth: 1.25 }]} wrap={false}>
      <Text style={[s.h3, { marginBottom: 5 }]}>{t(x.changes)}</Text>
      <Bullets items={changes} />
    </View>
  );
}

function Adjustments({ plan, type, l, x }: { plan: PdfPlan; type: "voeding" | "training"; l: Locale; x: Copy }) {
  const list = (plan.adjustments ?? []).filter((a) => !a.pending);
  if (list.length === 0) return null;
  return (
    <View style={[s.section, s.box, { backgroundColor: c.brand50, borderColor: c.brand200, borderWidth: 1.25 }]} wrap={false}>
      <Text style={[s.h3, { marginBottom: 2 }]}>{t(x.adjustments)}</Text>
      <Text style={[s.small, { marginBottom: 5 }]}>{t(x.adjustmentsIntro)}</Text>
      {list.map((a) => (
        <View key={a.week} style={{ marginBottom: 5 }}>
          <Text style={{ fontWeight: 700, fontSize: 9 }}>
            {t(
              type === "voeding"
                ? x.adjustmentKcal(a.week, `${a.kcal > 0 ? "+" : "-"}${Math.abs(a.kcal)}`, a.calories ? formatNumber(a.calories, 0, l) : null)
                : x.adjustmentTraining(a.week, a.training ? trainingDirectionLabel(a.training, l) : ""),
            )}
          </Text>
          <Bullets
            items={
              type === "voeding"
                ? (a.nutrition?.swaps ?? []).map((sw) => `${sw.meal}: ${sw.change}`)
                : (a.trainingPlan?.changes ?? []).map((ch) => `${ch.exercise}: ${ch.change}`)
            }
          />
        </View>
      ))}
    </View>
  );
}

// ---------- Voeding ----------

function Targets({ targets, adjustedCalories, l, x }: { targets: NutritionTargets; adjustedCalories?: number; l: Locale; x: Copy }) {
  const adjusted = adjustedCalories !== undefined && adjustedCalories !== targets.calories;
  const items = [
    [
      adjusted ? x.caloriesWas(formatNumber(targets.calories, 0, l)) : x.calories,
      `${formatNumber(adjusted ? adjustedCalories : targets.calories, 0, l)} kcal`,
    ],
    [x.protein, `${targets.proteinG} g`],
    [x.carbs, `± ${targets.carbsG} g`],
    [x.fat, `± ${targets.fatG} g`],
    [x.water, `± ${formatNumber(targets.waterL, 1, l)} l`],
    [x.steps, formatNumber(targets.steps, 0, l)],
  ];
  return (
    <View style={[s.section, { backgroundColor: c.brand900, borderRadius: 10, padding: 12 }]} wrap={false}>
      <Text style={[s.bandKind, { marginBottom: 6 }]}>{t(x.dailyTargets)}</Text>
      <View style={s.row}>
        {items.map(([label, value]) => (
          <View key={label} style={{ flex: 1 }}>
            <Text style={{ fontSize: 7.5, color: "#cfe3d7" }}>{t(label)}</Text>
            <Text style={{ fontSize: 12.5, fontWeight: 800, color: "#ffffff", marginTop: 1 }}>{t(value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function WeekMenuTable({ plan, l, x }: { plan: NutritionPlan; l: Locale; x: Copy }) {
  const columns = Math.max(0, ...plan.days.map((d) => d.meals.length));
  const headers = Array.from({ length: columns }, (_, i) => plan.days.find((d) => d.meals[i])?.meals[i].moment ?? "");
  const cell = { flex: 1, paddingHorizontal: 5, paddingVertical: 6 };
  return (
    <View style={{ borderWidth: 0.75, borderColor: c.line, borderRadius: 8 }}>
      <View style={[s.row, { backgroundColor: c.sand, borderTopLeftRadius: 8, borderTopRightRadius: 8 }]}>
        <Text style={[s.th, { width: 58, paddingHorizontal: 7, paddingVertical: 6 }]}>{t(x.day)}</Text>
        {headers.map((h, i) => (
          <Text key={`${h}-${i}`} style={[s.th, cell]}>
            {t(h)}
          </Text>
        ))}
        <Text style={[s.th, { width: 44, paddingHorizontal: 7, paddingVertical: 6, textAlign: "right" }]}>{t(x.kcal)}</Text>
      </View>
      {plan.days.map((d, di) => (
        <View key={`${di}-${d.day}`} style={[s.row, { borderTopWidth: 0.75, borderTopColor: c.line }]} wrap={false}>
          <Text style={{ width: 58, paddingHorizontal: 7, paddingVertical: 6, fontWeight: 700, fontSize: 8.5 }}>{t(d.day)}</Text>
          {headers.map((_, i) => {
            const m = d.meals[i];
            return (
              <View key={i} style={cell}>
                {m && (
                  <>
                    <Text style={{ fontSize: 7.8, fontWeight: 600, lineHeight: 1.3 }}>{t(m.name)}</Text>
                    <Text style={{ fontSize: 6.8, color: c.muted, marginTop: 1 }}>{t(`${m.kcal} kcal · ${m.proteinG} ${x.gProtein}`)}</Text>
                  </>
                )}
              </View>
            );
          })}
          <Text style={{ width: 44, paddingHorizontal: 7, paddingVertical: 6, fontWeight: 700, fontSize: 8.5, textAlign: "right" }}>
            {formatNumber(dayTotals(d).kcal, 0, l)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function MealBlock({ meal, x }: { meal: NutritionPlan["days"][number]["meals"][number]; x: Copy }) {
  return (
    <View style={[s.box, { marginBottom: 6, paddingVertical: 7, paddingHorizontal: 9 }]} wrap={false}>
      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={s.eyebrow}>{t(meal.moment)}</Text>
          <Text style={[s.h3, { marginTop: 1 }]}>{t(meal.name)}</Text>
        </View>
        <Text style={[s.small, { textAlign: "right", fontSize: 7.5 }]}>
          {t(`${meal.prepMinutes} min · ${meal.kcal} kcal\n${x.mealMacros(meal.proteinG, meal.carbsG, meal.fatG)}`)}
        </Text>
      </View>
      <View style={[s.row, { marginTop: 5 }]}>
        <View style={{ width: "38%", paddingRight: 12 }}>
          {meal.ingredients.map((ing) => (
            <View
              key={ing.item}
              style={[s.row, { justifyContent: "space-between", borderBottomWidth: 0.5, borderBottomColor: c.line, paddingVertical: 1.2 }]}
            >
              <Text style={{ flex: 1, fontSize: 8, paddingRight: 4, lineHeight: 1.3 }}>{t(ing.item)}</Text>
              <Text style={{ fontSize: 8, color: c.muted, fontWeight: 600, lineHeight: 1.3 }}>{t(ing.amount)}</Text>
            </View>
          ))}
        </View>
        <View style={{ flex: 1 }}>
          {meal.instructions.map((step, i) => (
            <View key={step} style={[s.row, { marginBottom: 1.5 }]}>
              <Text style={{ width: 11, fontSize: 8, fontWeight: 800, color: c.brand600, lineHeight: 1.3 }}>{i + 1}.</Text>
              <Text style={{ flex: 1, fontSize: 8, lineHeight: 1.3 }}>{t(step)}</Text>
            </View>
          ))}
        </View>
      </View>
      <Text style={{ marginTop: 5, fontSize: 7.5, backgroundColor: c.accent50, paddingVertical: 3.5, paddingHorizontal: 5, borderRadius: 4 }}>
        <Text style={{ fontWeight: 700 }}>{t(x.swap)}</Text>
        {t(meal.swap)}
      </Text>
    </View>
  );
}

function ShoppingColumns({ groups }: { groups: NutritionPlan["shoppingList"] }) {
  // Verdeel de afdelingen over twee kolommen met ongeveer evenveel regels.
  const cols: NutritionPlan["shoppingList"][] = [[], []];
  const size = [0, 0];
  for (const g of groups) {
    const i = size[0] <= size[1] ? 0 : 1;
    cols[i].push(g);
    size[i] += g.items.length + 2;
  }
  return (
    <View style={s.row}>
      {cols.map((col, ci) => (
        <View key={ci} style={{ flex: 1, paddingRight: ci === 0 ? 14 : 0 }}>
          {col.map((g) => (
            <View key={g.category} style={{ marginBottom: 12 }} wrap={false}>
              <Text style={[s.eyebrow, { fontSize: 7.5, marginBottom: 4 }]}>{t(g.category)}</Text>
              {g.items.map((i) => (
                <View key={i.item} style={[s.row, { paddingVertical: 2.5, borderBottomWidth: 0.5, borderBottomColor: c.line }]}>
                  <View style={s.checkbox} />
                  <Text style={{ flex: 1, fontSize: 9 }}>{t(i.item)}</Text>
                  <Text style={{ fontSize: 9, color: c.muted, fontWeight: 600 }}>{t(i.amount)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function NutritionPages({
  plan: p,
  name,
  fontFamily,
  part = "all",
  l,
}: {
  plan: PdfPlan;
  name: string;
  fontFamily: string;
  part?: "all" | "shopping";
  l: Locale;
}) {
  if (p.content.type !== "voeding") return null;
  const { plan, targets } = p.content;
  const x = copy[l];
  const page = [s.page, { fontFamily }];
  const running = x.nutritionFor(name);

  if (part === "shopping") {
    return (
      <Page size="A4" style={page}>
        <Running left={running} />
        <Band kind={p.seq > 1 ? `${x.shoppingList} · ${x.period(p.seq)}` : x.shoppingList} />
        <Text style={s.h1}>{t(x.shoppingTitle)}</Text>
        <Text style={[s.meta, { marginBottom: 14 }]}>{t(x.shoppingMeta(name))}</Text>
        <ShoppingColumns groups={plan.shoppingList} />
        <Footer x={x} />
      </Page>
    );
  }

  return (
    <>
      <Page size="A4" style={page}>
        <Running left={running} />
        <Heading title={plan.title} kind={x.nutritionPlan} name={name} plan={p} l={l} x={x} />
        <Text style={s.intro}>{t(plan.intro)}</Text>
        <Targets
          targets={targets}
          adjustedCalories={p.adjustments?.length ? targets.calories + p.adjustments.reduce((sum, a) => sum + a.kcal, 0) : undefined}
          l={l}
          x={x}
        />
        <Changes changes={plan.changes} x={x} />
        <Adjustments plan={p} type="voeding" l={l} x={x} />
        <View style={s.section}>
          <Text style={s.h2}>{t(x.howItWorks)}</Text>
          <Bullets items={plan.principles} numbered />
        </View>
        <View style={s.section} break>
          <Text style={s.h2}>{t(x.weekMenu)}</Text>
          <WeekMenuTable plan={plan} l={l} x={x} />
          <Text style={[s.small, { marginTop: 6 }]}>{t(x.recipesNext)}</Text>
        </View>
        <Footer x={x} />
      </Page>

      {plan.days.map((day, di) => {
        const total = dayTotals(day);
        return (
          <Page key={`${di}-${day.day}`} size="A4" style={page}>
            <Running left={running} />
            <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }]}>
              <Text style={[s.h1, { fontSize: 17 }]}>{t(day.day)}</Text>
              <Text style={s.small}>
                {t(x.dayMacros(formatNumber(total.kcal, 0, l), total.proteinG, total.carbsG, total.fatG))}
              </Text>
            </View>
            {day.meals.map((meal, mi) => (
              <MealBlock key={`${mi}-${meal.name}`} meal={meal} x={x} />
            ))}
            {day.tip ? (
              <Text style={[s.box, { backgroundColor: c.brand50, borderColor: c.brand200, fontSize: 9 }]} wrap={false}>
                <Text style={{ fontWeight: 700 }}>{t(x.tip)}</Text>
                {t(day.tip)}
              </Text>
            ) : null}
            <Footer x={x} />
          </Page>
        );
      })}

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t(x.shoppingTitle)}</Text>
        <Text style={[s.small, { marginBottom: 10 }]}>{t(x.shoppingIntro)}</Text>
        <ShoppingColumns groups={plan.shoppingList} />
        <Footer x={x} />
      </Page>

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t(x.snackIdeas)}</Text>
        <View style={[s.row, { flexWrap: "wrap" }]}>
          {plan.snackIdeas.map((snack, i) => (
            <View key={snack.name} style={{ width: "50%", paddingRight: i % 2 === 0 ? 8 : 0, marginBottom: 6 }} wrap={false}>
              <View style={[s.box, { backgroundColor: c.sand, borderColor: c.sand, padding: 7 }]}>
                <Text style={{ fontSize: 9 }}>{t(snack.name)}</Text>
                <Text style={s.small}>{t(`${snack.kcal} kcal · ${snack.proteinG} ${x.gProtein}`)}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[s.section, s.row]}>
          <View style={{ flex: 1, paddingRight: 14 }}>
            <Text style={s.h2}>{t(x.mealPrep)}</Text>
            <Bullets items={plan.mealPrepTips} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>{t(x.eatingOut)}</Text>
            <Bullets items={plan.eatingOutTips} />
          </View>
        </View>
        <View style={[s.section, s.box, { backgroundColor: c.brand50, borderColor: c.brand200 }]} wrap={false}>
          <Text style={[s.h3, { marginBottom: 4 }]}>{t(x.adjusting)}</Text>
          <Text>{t(plan.adjustmentGuide)}</Text>
        </View>
        <Disclaimer x={x} />
        <Footer x={x} />
      </Page>
    </>
  );
}

// ---------- Training ----------

function WeekSchedule({ plan }: { plan: TrainingPlan }) {
  return (
    <View style={[s.section, s.row]} wrap={false}>
      {plan.weekSchedule.map((d, i) => {
        const training = isTrainingDay(d.activity);
        return (
          <View
            key={d.day}
            style={{
              flex: 1,
              marginRight: i < plan.weekSchedule.length - 1 ? 4 : 0,
              borderRadius: 6,
              padding: 6,
              backgroundColor: training ? c.lime : c.sand,
              minHeight: 58,
            }}
          >
            <Text style={{ fontSize: 7, fontWeight: 800, textTransform: "uppercase", color: training ? c.brand900 : c.muted }}>
              {t(d.day.slice(0, 2))}
            </Text>
            <Text style={{ fontSize: 7.5, marginTop: 2, lineHeight: 1.3 }}>{t(d.activity)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const EX_COLS = { num: 18, sets: 34, reps: 58, rest: 40, intensity: 120 };

function ExerciseTable({ workout, x }: { workout: TrainingPlan["workouts"][number]; x: Copy }) {
  return (
    <View style={{ borderWidth: 0.75, borderColor: c.line, borderRadius: 8 }}>
      <View style={[s.row, { backgroundColor: c.sand, paddingVertical: 5, paddingHorizontal: 7, borderTopLeftRadius: 8, borderTopRightRadius: 8 }]}>
        <Text style={[s.th, { width: EX_COLS.num }]}>#</Text>
        <Text style={[s.th, { flex: 1 }]}>{t(x.exercise)}</Text>
        <Text style={[s.th, { width: EX_COLS.sets, textAlign: "center" }]}>{t(x.sets)}</Text>
        <Text style={[s.th, { width: EX_COLS.reps, textAlign: "center" }]}>{t(x.reps)}</Text>
        <Text style={[s.th, { width: EX_COLS.rest, textAlign: "center" }]}>{t(x.rest)}</Text>
        <Text style={[s.th, { width: EX_COLS.intensity }]}>{t(x.intensity)}</Text>
      </View>
      {workout.exercises.map((e, i) => (
        <View key={e.name} style={{ borderTopWidth: 0.75, borderTopColor: c.line, paddingVertical: 6, paddingHorizontal: 7 }} wrap={false}>
          <View style={s.row}>
            <Text style={{ width: EX_COLS.num, fontWeight: 800, color: c.brand600 }}>{i + 1}</Text>
            <View style={{ flex: 1, paddingRight: 6 }}>
              <Text style={{ fontWeight: 700, fontSize: 9.5 }}>{t(e.name)}</Text>
              <Text style={s.small}>{t(e.muscleGroups)}</Text>
            </View>
            <Text style={{ width: EX_COLS.sets, textAlign: "center", fontWeight: 800 }}>{e.sets}</Text>
            <Text style={{ width: EX_COLS.reps, textAlign: "center", fontWeight: 800 }}>{t(e.reps)}</Text>
            <Text style={{ width: EX_COLS.rest, textAlign: "center" }}>{t(restLabel(e.restSeconds))}</Text>
            <Text style={{ width: EX_COLS.intensity, fontSize: 8 }}>{t(e.intensity)}</Text>
          </View>
          <View style={{ marginLeft: EX_COLS.num, marginTop: 3 }}>
            <Text style={{ fontSize: 8, color: c.ink }}>
              <Text style={{ fontWeight: 700 }}>{t(x.technique)}</Text>
              {t(e.cues.join(" · "))}
            </Text>
            <Text style={{ fontSize: 8, color: c.muted, marginTop: 1 }}>
              <Text style={{ fontWeight: 700 }}>{t(x.alternative)}</Text>
              {t(e.alternative)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function LogTable({ workout, x }: { workout: TrainingPlan["workouts"][number]; x: Copy }) {
  const weeks = [1, 2, 3, 4];
  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <Text style={[s.h3, { marginBottom: 4 }]}>{t(workout.name)}</Text>
      <View style={{ borderWidth: 0.75, borderColor: c.line, borderRadius: 6 }}>
        <View style={[s.row, { backgroundColor: c.sand }]}>
          <Text style={[s.th, { flex: 1, padding: 5 }]}>{t(x.exercise)}</Text>
          {weeks.map((w) => (
            <Text key={w} style={[s.th, { width: 78, padding: 5, textAlign: "center", borderLeftWidth: 0.75, borderLeftColor: c.line }]}>
              {`Week ${w}`}
            </Text>
          ))}
        </View>
        {workout.exercises.map((e) => (
          <View key={e.name} style={[s.row, { borderTopWidth: 0.75, borderTopColor: c.line, minHeight: 20 }]}>
            <Text style={{ flex: 1, padding: 5, fontSize: 8.5 }}>{t(`${e.name} (${e.sets} × ${e.reps})`)}</Text>
            {weeks.map((w) => (
              <View key={w} style={{ width: 78, borderLeftWidth: 0.75, borderLeftColor: c.line }} />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function TrainingPages({ plan: p, name, fontFamily, l }: { plan: PdfPlan; name: string; fontFamily: string; l: Locale }) {
  if (p.content.type !== "training") return null;
  const { plan } = p.content;
  const x = copy[l];
  const page = [s.page, { fontFamily }];
  const running = x.trainingFor(name);
  return (
    <>
      <Page size="A4" style={page}>
        <Running left={running} />
        <Heading title={plan.title} kind={x.trainingPlan} name={name} plan={p} l={l} x={x} />
        <Text style={s.intro}>{t(plan.intro)}</Text>
        <Changes changes={plan.changes} x={x} />
        <Adjustments plan={p} type="training" l={l} x={x} />
        <View style={s.section}>
          <Text style={s.h2}>{t(x.yourWeek)}</Text>
        </View>
        <WeekSchedule plan={plan} />
        <View style={[s.section, s.row]} wrap={false}>
          <View style={[s.box, { flex: 1, marginRight: 8 }]}>
            <Text style={[s.h3, { marginBottom: 4 }]}>{t(x.warmup(plan.warmup.minutes))}</Text>
            <Bullets items={plan.warmup.steps} numbered />
          </View>
          <View style={[s.box, { flex: 1 }]}>
            <Text style={[s.h3, { marginBottom: 4 }]}>{t(x.cooldown)}</Text>
            <Bullets items={plan.cooldown} />
          </View>
        </View>
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>{t(x.progression)}</Text>
          <View style={s.row}>
            {plan.progression.map((w, i) => (
              <View key={w.week} style={[s.box, { flex: 1, marginRight: i < plan.progression.length - 1 ? 6 : 0, backgroundColor: c.sand, borderColor: c.sand }]}>
                <Text style={s.eyebrow}>{t(`Week ${w.week}`)}</Text>
                <Text style={[s.h3, { fontSize: 9.5, marginTop: 1 }]}>{t(w.focus)}</Text>
                <Text style={{ fontSize: 8, marginTop: 2 }}>{t(w.instructions)}</Text>
              </View>
            ))}
          </View>
        </View>
        <Footer x={x} />
      </Page>

      {plan.workouts.map((w) => (
        <Page key={w.name} size="A4" style={page}>
          <Running left={running} />
          <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-end", marginBottom: 10 }]}>
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={s.eyebrow}>{t(workoutShortName(w.name))}</Text>
              <Text style={[s.h1, { fontSize: 18 }]}>{t(w.name)}</Text>
              <Text style={s.meta}>{t(w.focus)}</Text>
            </View>
            <Text style={s.small}>{t(x.workoutMeta(w.minutes, w.exercises.length))}</Text>
          </View>
          <Text style={[s.small, { marginBottom: 6 }]}>{t(x.workoutIntro(plan.warmup.minutes))}</Text>
          <ExerciseTable workout={w} x={x} />
          {w.finisher ? (
            <Text style={[s.section, s.box, { backgroundColor: c.brand50, borderColor: c.brand200 }]} wrap={false}>
              <Text style={{ fontWeight: 700 }}>{t(x.finisher)}</Text>
              {t(w.finisher)}
            </Text>
          ) : null}
          <Footer x={x} />
        </Page>
      ))}

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t(x.log)}</Text>
        <Text style={[s.small, { marginBottom: 10 }]}>{t(x.logIntro)}</Text>
        {plan.workouts.map((w) => (
          <LogTable key={w.name} workout={w} x={x} />
        ))}
        <Footer x={x} />
      </Page>

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t(x.stepsCardio)}</Text>
        <Text>{t(plan.cardioAndSteps)}</Text>
        <View style={s.section}>
          <Text style={s.h2}>{t(x.recovery)}</Text>
          <Bullets items={plan.recoveryTips} />
        </View>
        {plan.safetyNotes.length > 0 && (
          <View style={[s.section, s.box, { backgroundColor: c.accent50, borderColor: "#ffc6a8" }]} wrap={false}>
            <Text style={[s.h3, { marginBottom: 4, color: c.accent600 }]}>{t(x.safety)}</Text>
            <Bullets items={plan.safetyNotes} />
          </View>
        )}
        <Disclaimer x={x} />
        <Footer x={x} />
      </Page>
    </>
  );
}

function Disclaimer({ x }: { x: Copy }) {
  return (
    <Text style={[s.section, s.small, { backgroundColor: c.sand, padding: 8, borderRadius: 6 }]} wrap={false}>
      {t(x.disclaimer)}
    </Text>
  );
}

/** Eén of meer schema's in één PDF (voeding eerst, dan training). */
export function PlansDocument({
  plans,
  name,
  fontFamily,
  l = "nl",
}: {
  plans: PdfPlan[];
  name: string;
  fontFamily: string;
  l?: Locale;
}) {
  const x = copy[l];
  const sorted = [...plans].sort((a, b) => (a.content.type === b.content.type ? 0 : a.content.type === "voeding" ? -1 : 1));
  return (
    <Document title={t(sorted.length === 1 ? planDocumentTitle(sorted[0], l) : x.plansTitle(name))} author={t(site.name)} language={x.language}>
      {sorted.map((p, i) =>
        p.content.type === "voeding" ? (
          <NutritionPages key={i} plan={p} name={name} fontFamily={fontFamily} l={l} />
        ) : (
          <TrainingPages key={i} plan={p} name={name} fontFamily={fontFamily} l={l} />
        ),
      )}
    </Document>
  );
}

export function ShoppingListDocument({
  plan,
  name,
  fontFamily,
  l = "nl",
}: {
  plan: PdfPlan;
  name: string;
  fontFamily: string;
  l?: Locale;
}) {
  const x = copy[l];
  return (
    <Document title={t(x.shoppingDocTitle(name))} author={t(site.name)} language={x.language}>
      <NutritionPages plan={plan} name={name} fontFamily={fontFamily} part="shopping" l={l} />
    </Document>
  );
}

export function planDocumentTitle(p: PdfPlan, l: Locale = "nl"): string {
  const x = copy[l];
  const kind = p.content.type === "voeding" ? x.nutritionPlan : x.trainingPlan;
  return p.seq > 1 ? `${kind} – ${x.period(p.seq)}` : kind;
}
