import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { NutritionPlan, PlanContent, TrainingPlan } from "@/lib/ai/schemas";
import type { NutritionTargets } from "@/lib/calculations";
import { dayTotals } from "@/lib/ai/plan-math";
import { formatDate, formatNumber } from "@/lib/format";
import { site } from "@/config/site";
import { pdfText as t } from "@/lib/pdf/text";
import { isTrainingDay, restLabel, workoutShortName } from "@/lib/plan-format";

/**
 * PDF-versies van de schema's (A4). Dezelfde inhoud als op de website, maar
 * ingedeeld om te printen: een overzicht, één pagina per dag of training,
 * een boodschappenlijst om af te vinken en een logboek voor je gewichten.
 */

export interface PdfPlan {
  content: PlanContent;
  seq: number;
  generatedAt: Date | null;
}

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

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text>{t("Persoonlijk leefstijladvies, geen medisch advies. Overleg bij klachten met je huisarts.")}</Text>
      <Text render={({ pageNumber, totalPages }) => `Pagina ${pageNumber} van ${totalPages}`} />
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

function Heading({ title, kind, name, plan }: { title: string; kind: string; name: string; plan: PdfPlan }) {
  return (
    <View>
      <Band kind={plan.seq > 1 ? `${kind} · periode ${plan.seq}` : kind} />
      <Text style={s.h1}>{t(title)}</Text>
      <Text style={s.meta}>
        {t(`Persoonlijk voor ${name}${plan.generatedAt ? ` · gemaakt op ${formatDate(plan.generatedAt)}` : ""}`)}
      </Text>
    </View>
  );
}

function Changes({ changes }: { changes: string[] | undefined }) {
  if (!changes?.length) return null;
  return (
    <View style={[s.section, s.box, { backgroundColor: c.limeSoft, borderColor: c.lime, borderWidth: 1.25 }]} wrap={false}>
      <Text style={[s.h3, { marginBottom: 5 }]}>{t("Aangepast na je check-in")}</Text>
      <Bullets items={changes} />
    </View>
  );
}

// ---------- Voeding ----------

function Targets({ targets }: { targets: NutritionTargets }) {
  const items = [
    ["Calorieën", `${formatNumber(targets.calories)} kcal`],
    ["Eiwit", `${targets.proteinG} g`],
    ["Koolhydraten", `± ${targets.carbsG} g`],
    ["Vet", `± ${targets.fatG} g`],
    ["Water", `± ${formatNumber(targets.waterL, 1)} l`],
    ["Stappen", formatNumber(targets.steps)],
  ];
  return (
    <View style={[s.section, { backgroundColor: c.brand900, borderRadius: 10, padding: 12 }]} wrap={false}>
      <Text style={[s.bandKind, { marginBottom: 6 }]}>{t("Jouw dagdoelen")}</Text>
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

function WeekMenuTable({ plan }: { plan: NutritionPlan }) {
  const columns = Math.max(0, ...plan.days.map((d) => d.meals.length));
  const headers = Array.from({ length: columns }, (_, i) => plan.days.find((d) => d.meals[i])?.meals[i].moment ?? "");
  const cell = { flex: 1, paddingHorizontal: 5, paddingVertical: 6 };
  return (
    <View style={{ borderWidth: 0.75, borderColor: c.line, borderRadius: 8 }}>
      <View style={[s.row, { backgroundColor: c.sand, borderTopLeftRadius: 8, borderTopRightRadius: 8 }]}>
        <Text style={[s.th, { width: 58, paddingHorizontal: 7, paddingVertical: 6 }]}>Dag</Text>
        {headers.map((h, i) => (
          <Text key={`${h}-${i}`} style={[s.th, cell]}>
            {t(h)}
          </Text>
        ))}
        <Text style={[s.th, { width: 44, paddingHorizontal: 7, paddingVertical: 6, textAlign: "right" }]}>Kcal</Text>
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
                    <Text style={{ fontSize: 6.8, color: c.muted, marginTop: 1 }}>{t(`${m.kcal} kcal · ${m.proteinG} g eiwit`)}</Text>
                  </>
                )}
              </View>
            );
          })}
          <Text style={{ width: 44, paddingHorizontal: 7, paddingVertical: 6, fontWeight: 700, fontSize: 8.5, textAlign: "right" }}>
            {formatNumber(dayTotals(d).kcal)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function MealBlock({ meal }: { meal: NutritionPlan["days"][number]["meals"][number] }) {
  return (
    <View style={[s.box, { marginBottom: 6, paddingVertical: 7, paddingHorizontal: 9 }]} wrap={false}>
      <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-start" }]}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={s.eyebrow}>{t(meal.moment)}</Text>
          <Text style={[s.h3, { marginTop: 1 }]}>{t(meal.name)}</Text>
        </View>
        <Text style={[s.small, { textAlign: "right", fontSize: 7.5 }]}>
          {t(`${meal.prepMinutes} min · ${meal.kcal} kcal\neiwit ${meal.proteinG} g · kh ${meal.carbsG} g · vet ${meal.fatG} g`)}
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
        <Text style={{ fontWeight: 700 }}>{t("Liever iets anders? ")}</Text>
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
}: {
  plan: PdfPlan;
  name: string;
  fontFamily: string;
  part?: "all" | "shopping";
}) {
  if (p.content.type !== "voeding") return null;
  const { plan, targets } = p.content;
  const page = [s.page, { fontFamily }];
  const running = `Voedingsschema voor ${name}`;

  if (part === "shopping") {
    return (
      <Page size="A4" style={page}>
        <Running left={running} />
        <Band kind={p.seq > 1 ? `Boodschappenlijst · periode ${p.seq}` : "Boodschappenlijst"} />
        <Text style={s.h1}>{t("Boodschappenlijst voor de week")}</Text>
        <Text style={[s.meta, { marginBottom: 14 }]}>{t(`Bij je voedingsschema · voor ${name} · alles per afdeling`)}</Text>
        <ShoppingColumns groups={plan.shoppingList} />
        <Footer />
      </Page>
    );
  }

  return (
    <>
      <Page size="A4" style={page}>
        <Running left={running} />
        <Heading title={plan.title} kind="Voedingsschema" name={name} plan={p} />
        <Text style={s.intro}>{t(plan.intro)}</Text>
        <Targets targets={targets} />
        <Changes changes={plan.changes} />
        <View style={s.section}>
          <Text style={s.h2}>{t("Zo werkt je schema")}</Text>
          <Bullets items={plan.principles} numbered />
        </View>
        <View style={s.section} break>
          <Text style={s.h2}>{t("Je weekmenu")}</Text>
          <WeekMenuTable plan={plan} />
          <Text style={[s.small, { marginTop: 6 }]}>{t("De recepten staan per dag op de volgende pagina's.")}</Text>
        </View>
        <Footer />
      </Page>

      {plan.days.map((day, di) => {
        const total = dayTotals(day);
        return (
          <Page key={`${di}-${day.day}`} size="A4" style={page}>
            <Running left={running} />
            <View style={[s.row, { justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }]}>
              <Text style={[s.h1, { fontSize: 17 }]}>{t(day.day)}</Text>
              <Text style={s.small}>
                {t(`${formatNumber(total.kcal)} kcal · ${total.proteinG} g eiwit · ${total.carbsG} g koolhydraten · ${total.fatG} g vet`)}
              </Text>
            </View>
            {day.meals.map((meal, mi) => (
              <MealBlock key={`${mi}-${meal.name}`} meal={meal} />
            ))}
            {day.tip ? (
              <Text style={[s.box, { backgroundColor: c.brand50, borderColor: c.brand200, fontSize: 9 }]} wrap={false}>
                <Text style={{ fontWeight: 700 }}>{t("Tip: ")}</Text>
                {t(day.tip)}
              </Text>
            ) : null}
            <Footer />
          </Page>
        );
      })}

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t("Boodschappenlijst voor de week")}</Text>
        <Text style={[s.small, { marginBottom: 10 }]}>{t("Alles voor de hele week, per afdeling. Vink af wat je hebt.")}</Text>
        <ShoppingColumns groups={plan.shoppingList} />
        <Footer />
      </Page>

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t("Snackideeën")}</Text>
        <View style={[s.row, { flexWrap: "wrap" }]}>
          {plan.snackIdeas.map((snack, i) => (
            <View key={snack.name} style={{ width: "50%", paddingRight: i % 2 === 0 ? 8 : 0, marginBottom: 6 }} wrap={false}>
              <View style={[s.box, { backgroundColor: c.sand, borderColor: c.sand, padding: 7 }]}>
                <Text style={{ fontSize: 9 }}>{t(snack.name)}</Text>
                <Text style={s.small}>{t(`${snack.kcal} kcal · ${snack.proteinG} g eiwit`)}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={[s.section, s.row]}>
          <View style={{ flex: 1, paddingRight: 14 }}>
            <Text style={s.h2}>{t("Slim voorbereiden")}</Text>
            <Bullets items={plan.mealPrepTips} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.h2}>{t("Uit eten of op visite")}</Text>
            <Bullets items={plan.eatingOutTips} />
          </View>
        </View>
        <View style={[s.section, s.box, { backgroundColor: c.brand50, borderColor: c.brand200 }]} wrap={false}>
          <Text style={[s.h3, { marginBottom: 4 }]}>{t("Tussentijds bijsturen")}</Text>
          <Text>{t(plan.adjustmentGuide)}</Text>
        </View>
        <Disclaimer />
        <Footer />
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

function ExerciseTable({ workout }: { workout: TrainingPlan["workouts"][number] }) {
  return (
    <View style={{ borderWidth: 0.75, borderColor: c.line, borderRadius: 8 }}>
      <View style={[s.row, { backgroundColor: c.sand, paddingVertical: 5, paddingHorizontal: 7, borderTopLeftRadius: 8, borderTopRightRadius: 8 }]}>
        <Text style={[s.th, { width: EX_COLS.num }]}>#</Text>
        <Text style={[s.th, { flex: 1 }]}>Oefening</Text>
        <Text style={[s.th, { width: EX_COLS.sets, textAlign: "center" }]}>Sets</Text>
        <Text style={[s.th, { width: EX_COLS.reps, textAlign: "center" }]}>Herhalingen</Text>
        <Text style={[s.th, { width: EX_COLS.rest, textAlign: "center" }]}>Rust</Text>
        <Text style={[s.th, { width: EX_COLS.intensity }]}>Intensiteit</Text>
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
              <Text style={{ fontWeight: 700 }}>{t("Techniek: ")}</Text>
              {t(e.cues.join(" · "))}
            </Text>
            <Text style={{ fontSize: 8, color: c.muted, marginTop: 1 }}>
              <Text style={{ fontWeight: 700 }}>{t("Alternatief: ")}</Text>
              {t(e.alternative)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function LogTable({ workout }: { workout: TrainingPlan["workouts"][number] }) {
  const weeks = [1, 2, 3, 4];
  return (
    <View style={{ marginBottom: 14 }} wrap={false}>
      <Text style={[s.h3, { marginBottom: 4 }]}>{t(workout.name)}</Text>
      <View style={{ borderWidth: 0.75, borderColor: c.line, borderRadius: 6 }}>
        <View style={[s.row, { backgroundColor: c.sand }]}>
          <Text style={[s.th, { flex: 1, padding: 5 }]}>Oefening</Text>
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

function TrainingPages({ plan: p, name, fontFamily }: { plan: PdfPlan; name: string; fontFamily: string }) {
  if (p.content.type !== "training") return null;
  const { plan } = p.content;
  const page = [s.page, { fontFamily }];
  const running = `Trainingsschema voor ${name}`;
  return (
    <>
      <Page size="A4" style={page}>
        <Running left={running} />
        <Heading title={plan.title} kind="Trainingsschema" name={name} plan={p} />
        <Text style={s.intro}>{t(plan.intro)}</Text>
        <Changes changes={plan.changes} />
        <View style={s.section}>
          <Text style={s.h2}>{t("Jouw week")}</Text>
        </View>
        <WeekSchedule plan={plan} />
        <View style={[s.section, s.row]} wrap={false}>
          <View style={[s.box, { flex: 1, marginRight: 8 }]}>
            <Text style={[s.h3, { marginBottom: 4 }]}>{t(`Warming-up (${plan.warmup.minutes} min) – voor elke training`)}</Text>
            <Bullets items={plan.warmup.steps} numbered />
          </View>
          <View style={[s.box, { flex: 1 }]}>
            <Text style={[s.h3, { marginBottom: 4 }]}>{t("Cooling-down – na elke training")}</Text>
            <Bullets items={plan.cooldown} />
          </View>
        </View>
        <View style={s.section} wrap={false}>
          <Text style={s.h2}>{t("Zo bouw je op in 4 weken")}</Text>
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
        <Footer />
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
            <Text style={s.small}>{t(`± ${w.minutes} min · ${w.exercises.length} oefeningen`)}</Text>
          </View>
          <Text style={[s.small, { marginBottom: 6 }]}>{t(`Begin met de warming-up (${plan.warmup.minutes} min) en sluit af met de cooling-down.`)}</Text>
          <ExerciseTable workout={w} />
          {w.finisher ? (
            <Text style={[s.section, s.box, { backgroundColor: c.brand50, borderColor: c.brand200 }]} wrap={false}>
              <Text style={{ fontWeight: 700 }}>{t("Afsluiter: ")}</Text>
              {t(w.finisher)}
            </Text>
          ) : null}
          <Footer />
        </Page>
      ))}

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t("Logboek")}</Text>
        <Text style={[s.small, { marginBottom: 10 }]}>
          {t("Noteer per week je gewicht en herhalingen, bijvoorbeeld \"12 kg × 10\". Zo zie je je vooruitgang en weet je wanneer je zwaarder kunt.")}
        </Text>
        {plan.workouts.map((w) => (
          <LogTable key={w.name} workout={w} />
        ))}
        <Footer />
      </Page>

      <Page size="A4" style={page}>
        <Running left={running} />
        <Text style={s.h2}>{t("Stappen & cardio")}</Text>
        <Text>{t(plan.cardioAndSteps)}</Text>
        <View style={s.section}>
          <Text style={s.h2}>{t("Herstel")}</Text>
          <Bullets items={plan.recoveryTips} />
        </View>
        {plan.safetyNotes.length > 0 && (
          <View style={[s.section, s.box, { backgroundColor: c.accent50, borderColor: "#ffc6a8" }]} wrap={false}>
            <Text style={[s.h3, { marginBottom: 4, color: c.accent600 }]}>{t("Veiligheid")}</Text>
            <Bullets items={plan.safetyNotes} />
          </View>
        )}
        <Disclaimer />
        <Footer />
      </Page>
    </>
  );
}

function Disclaimer() {
  return (
    <Text style={[s.section, s.small, { backgroundColor: c.sand, padding: 8, borderRadius: 6 }]} wrap={false}>
      {t(
        "Dit schema is persoonlijk leefstijladvies op basis van jouw antwoorden. Het is geen medisch advies en geen vervanging voor begeleiding door een arts, diëtist of fysiotherapeut. Heb je klachten, een medische aandoening of twijfel? Overleg dan eerst met je huisarts. Lees bij allergieën altijd de etiketten.",
      )}
    </Text>
  );
}

/** Eén of meer schema's in één PDF (voeding eerst, dan training). */
export function PlansDocument({ plans, name, fontFamily }: { plans: PdfPlan[]; name: string; fontFamily: string }) {
  const sorted = [...plans].sort((a, b) => (a.content.type === b.content.type ? 0 : a.content.type === "voeding" ? -1 : 1));
  return (
    <Document title={t(sorted.length === 1 ? planDocumentTitle(sorted[0]) : `Schema's – ${name}`)} author={t(site.name)} language="nl">
      {sorted.map((p, i) =>
        p.content.type === "voeding" ? (
          <NutritionPages key={i} plan={p} name={name} fontFamily={fontFamily} />
        ) : (
          <TrainingPages key={i} plan={p} name={name} fontFamily={fontFamily} />
        ),
      )}
    </Document>
  );
}

export function ShoppingListDocument({ plan, name, fontFamily }: { plan: PdfPlan; name: string; fontFamily: string }) {
  return (
    <Document title={t(`Boodschappenlijst – ${name}`)} author={t(site.name)} language="nl">
      <NutritionPages plan={plan} name={name} fontFamily={fontFamily} part="shopping" />
    </Document>
  );
}

export function planDocumentTitle(p: PdfPlan): string {
  const kind = p.content.type === "voeding" ? "Voedingsschema" : "Trainingsschema";
  return p.seq > 1 ? `${kind} – periode ${p.seq}` : kind;
}
