import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import { CalorieCalculator } from "@/components/calculator/CalorieCalculator";
import { CtaBanner, FaqJsonLd, FaqList, SectionHeading } from "@/components/marketing";
import { resultDisclaimer } from "@/content/disclaimers";
import { defineCopy, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { alternates, pageTitle } from "@/i18n/metadata";
import { intakeLabels } from "@/i18n/options";
import { getLocale } from "@/i18n/server";
import { nutritionTargets } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";
import type { Intake } from "@/lib/intake";

/** Voorbeeldpersonen voor de tabellen (geen gemiddelde, gewoon een rekenvoorbeeld). */
const EXAMPLES = {
  vrouw: { heightCm: 168, weightKg: 70 },
  man: { heightCm: 182, weightKg: 85 },
} as const;
const AGES = [25, 35, 45, 55, 65];
const LEVELS: Intake["activity"][] = ["zittend", "licht", "actief"];

/** Dagelijks verbruik (onderhoud) met één keer sporten per week, met dezelfde formule als de schema's. */
function maintenance(sex: Intake["sex"], age: number, activity: Intake["activity"]): number {
  return nutritionTargets({
    sex,
    age,
    ...EXAMPLES[sex],
    activity,
    goal: "afblijven",
    pace: "gemiddeld",
    experience: "beginner",
    trainingDays: 1,
    product: "bundel",
  }).tdee;
}

const copy = defineCopy({
  nl: {
    metaTitle: "Caloriebehoefte berekenen: hoeveel calorieën per dag?",
    metaDescription:
      "Bereken gratis hoeveel calorieën en eiwitten je per dag nodig hebt om af te vallen of op gewicht te blijven, met je ruststofwisseling (BMR) en verbruik (TDEE).",
    eyebrow: "Gratis rekenhulp",
    h1: "Caloriebehoefte berekenen",
    h1Accent: "hoeveel calorieën per dag heb jij nodig?",
    intro:
      "Vul je gegevens in en zie direct je ruststofwisseling, je dagelijkse verbruik en hoeveel calorieën en eiwitten je per dag nodig hebt om af te vallen, op gewicht te blijven of spieren op te bouwen. We rekenen met dezelfde formules en veiligheidsgrenzen als in onze persoonlijke schema's.",
    tableTitle: (sex: string) => `Hoeveel calorieën per dag als ${sex}?`,
    tableIntro: (sex: "vrouw" | "man", h: string, w: string) =>
      `Hoeveel calorieën je per dag nodig hebt, hangt af van je lengte, gewicht, leeftijd en hoe actief je bent. Als voorbeeld: dit is het dagelijkse verbruik van een ${sex} van ${h} m en ${w} kilo die één keer per week sport. Met dit aantal calorieën blijf je op gewicht; om af te vallen eet je iets minder.`,
    sexWord: { vrouw: "vrouw", man: "man" },
    ageCol: "Leeftijd",
    years: (n: number) => `${n} jaar`,
    tableNote: "Calorieën per dag om op gewicht te blijven, afgerond op 10. Je eigen uitkomst bereken je hierboven.",
    menopause: "In de overgang? Lees waarom afvallen dan lastiger is en wat wél werkt",
    sections: [
      {
        title: "Hoeveel calorieën per dag om af te vallen?",
        paragraphs: [
          "Om af te vallen eet je minder calorieën dan je verbruikt. Een kilo lichaamsvet bevat ongeveer 7.700 kilocalorieën. Wil je een halve kilo per week afvallen, dan heb je per dag een tekort nodig van ongeveer 550 kcal.",
          "Meer is niet altijd beter. Een te groot tekort maakt je moe en hongerig, kost spiermassa en is lastig vol te houden, met het bekende jojo-effect als gevolg. Daarom gaan we in de rekenhulp en in onze schema's nooit meer dan 25% onder je dagelijkse verbruik, en nooit onder 1.200 kcal per dag voor vrouwen of 1.500 kcal voor mannen.",
          "Gebruik de uitkomst als startpunt. Weeg jezelf een paar weken lang wekelijks op hetzelfde moment: val je sneller of langzamer af dan verwacht, stel dan je inname met 100 tot 150 kcal per dag bij.",
        ],
      },
      {
        title: "Hoeveel eiwitten per dag?",
        paragraphs: [
          "Voor gezonde volwassenen adviseert de Gezondheidsraad 0,83 gram eiwit per kilo lichaamsgewicht per dag. Dat is de hoeveelheid om tekorten te voorkomen.",
          "Wie afvalt of aan krachttraining doet, heeft baat bij meer eiwit: het helpt je spiermassa te behouden en geeft een vol gevoel. In sportvoedingsonderzoek wordt vaak 1,6 gram per kilo of meer gebruikt. In de rekenhulp en in onze schema's rekenen we met 1,6 gram per kilo om op gewicht te blijven, 1,8 gram om af te vallen en 2,0 gram om spieren op te bouwen. Bij overgewicht rekenen we niet met je volle gewicht, maar met het gewicht dat bij een BMI van 25 hoort.",
          "Eiwit zit onder meer in vlees, vis, eieren, zuivel zoals kwark en skyr, peulvruchten, tofu en noten. Verdeel het over je maaltijden: dat werkt beter dan alles in één keer.",
        ],
      },
      {
        title: "Wat is het verschil tussen BMR en TDEE?",
        paragraphs: [
          "Je BMR (basal metabolic rate) of ruststofwisseling is wat je lichaam verbruikt als je de hele dag stil zou liggen: voor je hart, ademhaling, hersenen en lichaamstemperatuur. We berekenen hem met de formule van Mifflin-St Jeor, die rekent met je gewicht, lengte, leeftijd en geslacht.",
          "Je TDEE (total daily energy expenditure) is je totale dagelijkse verbruik: je ruststofwisseling plus alles wat je beweegt, van traplopen tot sporten. Dat is het aantal calorieën waarmee je op gewicht blijft. We vermenigvuldigen je BMR daarvoor met een factor voor je dagelijkse activiteit en tellen daar je sportmomenten bij op.",
        ],
      },
      {
        title: "Hoe nauwkeurig is deze berekening?",
        paragraphs: [
          "Formules als Mifflin-St Jeor zitten voor de meeste mensen binnen ongeveer 10% van het werkelijke verbruik, maar iedereen is anders. Je spiermassa, slaap, stress en medicijnen spelen ook mee. Zie de uitkomst daarom als een goed onderbouwd startpunt, niet als exacte waarheid.",
          "De rekenhulp is bedoeld voor gezonde volwassenen en geen medisch advies. Ben je zwanger of geef je borstvoeding, heb je een medische aandoening, gebruik je medicijnen die je gewicht beïnvloeden of heb je (een geschiedenis van) een eetstoornis? Overleg dan met je huisarts of een diëtist.",
        ],
      },
    ],
    planTitle: "Van een getal naar een plan dat je volhoudt",
    planText:
      "Weten hoeveel calorieën je nodig hebt is stap één. Het lastige is elke dag eten dat op dat getal uitkomt, zonder te tellen en zonder honger. In je persoonlijke voedingsschema staat een weekmenu met recepten en boodschappenlijst op precies jouw calorie- en eiwitdoel, en elke week sturen we bij op je voortgang.",
    planCta: "Bekijk het voedingsschema",
    faqEyebrow: "Veelgestelde vragen",
    faqTitle: "Vragen over calorieën en eiwitten",
    faq: [
      {
        q: "Hoeveel calorieën per dag heeft een vrouw nodig?",
        a: "Het dagelijkse verbruik van een volwassen vrouw ligt meestal tussen ongeveer 1.600 en 2.400 kcal, afhankelijk van lengte, gewicht, leeftijd en hoe actief ze is. Om af te vallen is een tekort van 300 tot 550 kcal per dag gebruikelijk, maar ga niet onder de 1.200 kcal. Met de rekenhulp op deze pagina bereken je je eigen behoefte.",
      },
      {
        q: "Hoeveel calorieën per dag heeft een man nodig?",
        a: "Het dagelijkse verbruik van een volwassen man ligt meestal tussen ongeveer 2.100 en 3.000 kcal, afhankelijk van lengte, gewicht, leeftijd en activiteit. Om af te vallen is een tekort van 300 tot 550 kcal per dag gebruikelijk, maar ga niet onder de 1.500 kcal.",
      },
      {
        q: "Hoeveel calorieën per dag om 1 kilo per week af te vallen?",
        a: "Voor een kilo per week heb je een tekort nodig van ongeveer 1.100 kcal per dag. Voor de meeste mensen is dat te veel: je verliest dan ook spiermassa en houdt het moeilijk vol. Een halve kilo per week (± 550 kcal per dag) is voor de meeste mensen goed haalbaar.",
      },
      {
        q: "Moet ik de calorieën die ik met sporten verbrand terugeten?",
        a: "Nee, niet apart. In de rekenhulp tellen je sportmomenten al mee in je dagelijkse verbruik. Horloges en apps overschatten het verbruik bij sporten vaak; tel het daarom niet nog een keer op.",
      },
      {
        q: "Waarom krijg ik minder eiwit dan 2 gram per kilo als ik zwaar ben?",
        a: "Bij overgewicht rekenen we niet met je volle lichaamsgewicht, maar met het gewicht dat bij een BMI van 25 hoort. Je spiermassa groeit niet mee met je vetmassa, dus anders zou het advies onnodig hoog uitvallen.",
      },
    ],
  },
  en: {
    metaTitle: "Calorie calculator: how many calories do you need a day?",
    metaDescription:
      "Work out for free how many calories and how much protein you need a day to lose weight or maintain it, including your BMR and daily energy use (TDEE).",
    eyebrow: "Free calculator",
    h1: "Calorie calculator",
    h1Accent: "how many calories a day do you need?",
    intro:
      "Fill in your details and instantly see your basal metabolic rate, your daily energy use and how many calories and how much protein you need a day to lose weight, maintain your weight or build muscle. We use the same formulas and safety limits as in our personal plans.",
    tableTitle: (sex: string) => `How many calories a day for a ${sex}?`,
    tableIntro: (sex: "vrouw" | "man", h: string, w: string) =>
      `How many calories you need a day depends on your height, weight, age and how active you are. As an example: this is the daily energy use of a ${sex === "vrouw" ? "woman" : "man"} of ${h} m and ${w} kilos who works out once a week. With this number of calories, you maintain your weight; to lose weight, you eat a little less.`,
    sexWord: { vrouw: "woman", man: "man" },
    ageCol: "Age",
    years: (n: number) => `${n} years`,
    tableNote: "Calories a day to maintain your weight, rounded to 10. Work out your own number above.",
    menopause: "Going through menopause? Read why losing weight is harder then and what does work",
    sections: [
      {
        title: "How many calories a day to lose weight?",
        paragraphs: [
          "To lose weight, you eat fewer calories than you use. A kilo of body fat contains roughly 7,700 kilocalories. To lose half a kilo a week, you need a deficit of around 550 kcal a day.",
          "More isn't always better. Too big a deficit makes you tired and hungry, costs muscle and is hard to keep up, leading to the familiar yo-yo effect. That's why the calculator and our plans never go more than 25% below your daily energy use, and never below 1,200 kcal a day for women or 1,500 kcal for men.",
          "Use the result as a starting point. Weigh yourself weekly at the same time for a few weeks: if you lose weight faster or slower than expected, adjust your intake by 100 to 150 kcal a day.",
        ],
      },
      {
        title: "How much protein a day?",
        paragraphs: [
          "For healthy adults, the Dutch Health Council recommends 0.83 grams of protein per kilo of body weight a day. That's the amount needed to prevent deficiencies.",
          "If you're losing weight or doing strength training, more protein helps: it helps you keep your muscle and keeps you feeling full. Sports nutrition research often uses 1.6 grams per kilo or more. The calculator and our plans use 1.6 grams per kilo to maintain your weight, 1.8 grams to lose weight and 2.0 grams to build muscle. If you're overweight, we don't use your full weight, but the weight that matches a BMI of 25.",
          "Protein is found in meat, fish, eggs, dairy such as quark and skyr, pulses, tofu and nuts, among other things. Spread it across your meals: that works better than having it all at once.",
        ],
      },
      {
        title: "What's the difference between BMR and TDEE?",
        paragraphs: [
          "Your BMR (basal metabolic rate) is what your body uses if you were to lie still all day: for your heart, breathing, brain and body temperature. We calculate it with the Mifflin-St Jeor formula, which uses your weight, height, age and sex.",
          "Your TDEE (total daily energy expenditure) is everything you use in a day: your BMR plus all your movement, from climbing stairs to working out. That's the number of calories at which you maintain your weight. We multiply your BMR by a factor for your daily activity and add your workouts.",
        ],
      },
      {
        title: "How accurate is this calculation?",
        paragraphs: [
          "For most people, formulas like Mifflin-St Jeor come within about 10% of their actual energy use, but everyone is different. Your muscle mass, sleep, stress and medication also play a part. So see the result as a well-founded starting point, not an exact truth.",
          "The calculator is meant for healthy adults and is not medical advice. Are you pregnant or breastfeeding, do you have a medical condition, do you take medication that affects your weight or do you have (a history of) an eating disorder? Then please talk to your GP or a dietitian.",
        ],
      },
    ],
    planTitle: "From a number to a plan you can keep up",
    planText:
      "Knowing how many calories you need is step one. The hard part is eating to that number every day, without counting and without going hungry. Your personal nutrition plan has a weekly menu with recipes and a shopping list based on exactly your calorie and protein targets, and we fine-tune it every week based on your progress.",
    planCta: "See the nutrition plan",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Questions about calories and protein",
    faq: [
      {
        q: "How many calories a day does a woman need?",
        a: "An adult woman usually uses roughly 1,600 to 2,400 kcal a day, depending on height, weight, age and how active she is. To lose weight, a deficit of 300 to 550 kcal a day is usual, but don't go below 1,200 kcal. Use the calculator on this page to work out your own needs.",
      },
      {
        q: "How many calories a day does a man need?",
        a: "An adult man usually uses roughly 2,100 to 3,000 kcal a day, depending on height, weight, age and activity. To lose weight, a deficit of 300 to 550 kcal a day is usual, but don't go below 1,500 kcal.",
      },
      {
        q: "How many calories a day to lose 1 kilo a week?",
        a: "For a kilo a week, you need a deficit of around 1,100 kcal a day. For most people, that's too much: you lose muscle too and it's hard to keep up. Half a kilo a week (± 550 kcal a day) is achievable for most people.",
      },
      {
        q: "Should I eat back the calories I burn working out?",
        a: "No, not separately. In the calculator, your workouts already count towards your daily energy use. Watches and apps often overestimate what you burn when working out, so don't add it again.",
      },
      {
        q: "Why do I get less than 2 grams of protein per kilo if I'm heavier?",
        a: "If you're overweight, we don't use your full body weight, but the weight that matches a BMI of 25. Your muscle mass doesn't grow along with your fat mass, so otherwise the advice would be unnecessarily high.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, "/caloriebehoefte-berekenen") };
}

function MaintenanceTable({ sex, l }: { sex: Intake["sex"]; l: Locale }) {
  const c = copy[l];
  const labels = intakeLabels(l);
  const ex = EXAMPLES[sex];
  return (
    <section className="space-y-4">
      <h2 className="heading-md">{c.tableTitle(c.sexWord[sex])}</h2>
      <p className="text-lg leading-relaxed text-muted">{c.tableIntro(sex, formatNumber(ex.heightCm / 100, 2, l), formatNumber(ex.weightKg, 0, l))}</p>
      <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead className="bg-sand text-xs font-bold text-muted uppercase">
            <tr>
              <th scope="col" className="px-4 py-3">
                {c.ageCol}
              </th>
              {LEVELS.map((a) => (
                <th key={a} scope="col" className="px-4 py-3">
                  {labels.activity[a].label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {AGES.map((age) => (
              <tr key={age}>
                <th scope="row" className="px-4 py-3 font-bold">
                  {c.years(age)}
                </th>
                {LEVELS.map((a) => (
                  <td key={a} className="px-4 py-3 tabular-nums">
                    {formatNumber(maintenance(sex, age, a), 0, l)} kcal
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted">{c.tableNote}</p>
      {sex === "vrouw" && (
        <Link href="/afvallen-in-de-overgang" className="inline-flex items-center gap-1.5 font-bold text-brand-700 underline">
          {c.menopause} <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}
    </section>
  );
}

export default async function CaloriebehoeftePage() {
  const l = await getLocale();
  const c = copy[l];
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-cream pt-10 pb-12 sm:pt-14">
        <div className="container-page">
          <div className="mb-8 max-w-3xl">
            <h1 className="heading-xl">
              <span className="eyebrow mb-3 block">{c.eyebrow}</span>
              <span className="sr-only">: </span>
              {c.h1}: <span className="text-brand-600">{c.h1Accent}</span>
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{c.intro}</p>
          </div>
          <CalorieCalculator />
        </div>
      </section>

      <div className="container-page max-w-3xl space-y-14 py-14">
        <MaintenanceTable sex="vrouw" l={l} />
        <MaintenanceTable sex="man" l={l} />
        {c.sections.map((s) => (
          <section key={s.title} className="space-y-4">
            <h2 className="heading-md">{s.title}</h2>
            {s.paragraphs.map((p) => (
              <p key={p.slice(0, 40)} className="text-lg leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}
        <section className="rounded-[2rem] bg-brand-900 p-6 text-white sm:p-8">
          <h2 className="heading-md text-white">{c.planTitle}</h2>
          <p className="mt-3 text-lg leading-relaxed text-white/80">{c.planText}</p>
          <Link href="/voedingsschema" className="btn-primary mt-5 !bg-lime-glow !text-brand-950">
            {c.planCta} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </section>
      </div>

      <section className="container-page pb-16">
        <SectionHeading eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <FaqList items={c.faq} />
        <FaqJsonLd items={c.faq} />
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs text-muted">{resultDisclaimer[l].short}</p>
      </section>
      <CtaBanner />
    </>
  );
}
