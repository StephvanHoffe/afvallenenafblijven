import type { Metadata } from "next";
import { ArrowRight, Calculator, Info } from "lucide-react";
import { CtaBanner, FaqJsonLd, FaqList, SectionHeading } from "@/components/marketing";
import { site } from "@/config/site";
import { resultDisclaimer } from "@/content/disclaimers";
import { samplePlansFor } from "@/content/sample-plans";
import { defineCopy, localeUrl, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { nutritionTargets } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";

const PATH = "/afvallen-in-de-overgang";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";

/** Rekenvoorbeeld met dezelfde formule als de schema's: vrouw van 52, 1,68 m, 76 kg, licht actief, 2× sport. */
const EXAMPLE = { age: 52, heightCm: 168, weightKg: 76 };
const example = nutritionTargets({
  sex: "vrouw",
  ...EXAMPLE,
  activity: "licht",
  goal: "afvallen",
  pace: "gemiddeld",
  experience: "beginner",
  trainingDays: 2,
  product: "bundel",
});

const copy = defineCopy({
  nl: {
    metaTitle: "Afvallen in de overgang: waarom het lastiger is en wat werkt",
    metaDescription:
      "Afvallen in de overgang is lastiger door minder oestrogeen en spiermassa. Zo pak je het aan: klein calorietekort, genoeg eiwit, krachttraining en goede slaap.",
    eyebrow: "Voeding en beweging",
    h1: "Afvallen in de overgang:",
    h1Accent: "waarom het lastiger is en wat wél werkt",
    intro:
      "Je eet niet meer dan vroeger en toch loopt je gewicht op, vooral rond je buik. Dat ligt niet aan je wilskracht. In de overgang verandert er van alles in je lichaam. Afvallen kan nog steeds, maar het vraagt een iets andere aanpak.",
    updated: (d: string) => `Bijgewerkt op ${d}`,
    shortTitle: "Kort antwoord",
    short:
      "In de overgang daalt je oestrogeen, verlies je makkelijker spiermassa en verbruik je vaak wat minder energie. Afvallen lukt nog steeds met een klein calorietekort (meestal 300 tot 500 kcal per dag), voldoende eiwit (zo'n 1,6 tot 1,8 gram per kilo), 2 tot 3 keer per week krachttraining, veel wandelen en goede slaap. Reken op een rustig tempo van 0,25 tot 0,5 kilo per week.",
    sections: {
      why: {
        title: "Waarom is afvallen in de overgang moeilijker?",
        paragraphs: [
          "De overgang is de periode waarin je eierstokken minder hormonen gaan maken. Meestal begint die ergens tussen je 45e en 55e en duurt hij een aantal jaren. Daardoor verandert er een aantal dingen tegelijk:",
        ],
        bullets: [
          "Minder oestrogeen: vet wordt vaker rond je buik opgeslagen in plaats van op heupen en benen.",
          "Minder spiermassa: die neemt met de leeftijd af, en spieren verbruiken energie, ook in rust. Minder spieren betekent dus een lager verbruik.",
          "Slechter slapen en opvliegers: na een korte nacht heb je meer trek, vooral in zoet en snel, en minder energie om te bewegen.",
          "Het leven zelf: drukte, stress en minder beweging dan vroeger tellen ook mee.",
        ],
        after:
          "Het gevolg: met hetzelfde eten als vroeger kom je langzaam aan. Niet omdat je iets fout doet, maar omdat je lichaam minder verbruikt. Een dieet dat vroeger werkte, werkt nu vaak minder goed.",
      },
      calories: {
        title: "Hoeveel calorieën heb je nodig in de overgang?",
        paragraphs: [
          "Om af te vallen eet je iets minder dan je verbruikt. Omdat je verbruik in de overgang wat lager ligt, valt ook je dagelijkse behoefte lager uit dan vroeger. Een groot tekort is juist niet verstandig: dan verlies je meer spiermassa, waardoor je verbruik nog verder daalt.",
        ],
        exampleTitle: "Rekenvoorbeeld",
        example: (bmr: string, tdee: string, kcal: string, kg: string) =>
          `Een vrouw van 52 jaar, 1,68 meter en 76 kilo, licht actief en 2 keer per week sporten, verbruikt ongeveer ${tdee} kcal per dag (ruststofwisseling ${bmr} kcal). Om af te vallen eet ze zo'n ${kcal} kcal per dag; dat is ongeveer ${kg} kilo per week.`,
        calcCta: "Bereken je eigen caloriebehoefte",
      },
      protein: {
        title: "Eiwit: belangrijker dan ooit",
        paragraphs: [
          "Eiwit helpt je spiermassa te behouden terwijl je afvalt en geeft een vol gevoel, zodat je minder snel trek krijgt. De Gezondheidsraad adviseert gezonde volwassenen 0,83 gram eiwit per kilo lichaamsgewicht per dag; dat is de ondergrens om tekorten te voorkomen. Wie afvalt en aan krachttraining doet, heeft baat bij meer: in onze schema's rekenen we met 1,8 gram per kilo om af te vallen, en bij overgewicht met het gewicht dat bij een BMI van 25 hoort.",
          "Verdeel het over de dag: een eiwitrijk ontbijt (kwark, skyr, eieren), eiwit bij de lunch en het avondeten (vis, kip, peulvruchten, tofu) en een eiwitrijk tussendoortje.",
        ],
      },
      training: {
        title: "Krachttraining en bewegen in de overgang",
        paragraphs: [
          "Krachttraining is in de overgang misschien wel het belangrijkste onderdeel. Je bouwt spiermassa op of houdt die vast, en het is ook goed voor je botten. Twee tot drie keer per week 30 tot 45 minuten is genoeg: thuis met je eigen lichaamsgewicht en een paar dumbbells, of in de sportschool.",
          "Daarnaast telt alle dagelijkse beweging mee. Wandelen is laagdrempelig en kost je weinig herstel. Een stappendoel van 8.000 tot 10.000 stappen per dag is voor de meeste mensen goed haalbaar.",
        ],
        cta: "Bekijk het trainingsschema",
      },
      sleep: {
        title: "Slaap, stress en opvliegers",
        paragraphs: [
          "Slecht slapen maakt afvallen lastiger: je hebt meer trek en minder energie. Een vast slaapritme, een koele slaapkamer en minder schermtijd voor het slapen kunnen helpen. Bij sommige vrouwen lokken alcohol, cafeïne of pittig eten opvliegers uit; let erop of dat bij jou zo is.",
          "Heb je veel last van opvliegers, slecht slapen of stemmingswisselingen? Bespreek dat met je huisarts. Er zijn behandelingen, ook met hormonen. Of die bij jou passen, bepaal je samen met je arts.",
        ],
      },
      pace: {
        title: "Hoe snel kun je afvallen in de overgang?",
        paragraphs: [
          "Reken op een rustig tempo van ongeveer 0,25 tot 0,5 kilo per week. Wil je 15 kilo afvallen, dan ben je daar bij dat tempo grofweg 7 tot 14 maanden mee bezig. Dat lijkt lang, maar een rustig tempo houd je vol, en je verliest vooral vet in plaats van spieren.",
          "Je gewicht schommelt van dag tot dag, zeker in de overgang door vocht. Weeg jezelf daarom één keer per week op hetzelfde moment en kijk naar de trend over een paar weken. Staat die een paar weken stil? Pas dan je eten of beweging een klein beetje aan.",
        ],
      },
      day: {
        title: "Zo kan een dag eten eruitzien",
        intro: (kcal: string, protein: string) =>
          `Een voorbeelddag uit een van onze voedingsschema's: ${kcal} kcal en ${protein} gram eiwit, met gewone producten uit de supermarkt.`,
        cta: "Bekijk het hele voorbeeldschema",
      },
      doctor: {
        title: "Wanneer naar de huisarts?",
        bullets: [
          "Je valt af zonder dat je het probeert: laat dat altijd nakijken.",
          "Je komt snel aan zonder duidelijke reden, of je bent erg moe (bijvoorbeeld om je schildklier te laten checken).",
          "Je hebt veel last van overgangsklachten, zoals opvliegers, slecht slapen of somberheid.",
          "Je gebruikt medicijnen die je gewicht kunnen beïnvloeden, of je hebt een aandoening zoals diabetes of hoge bloeddruk.",
        ],
      },
    },
    planTitle: "Een plan dat rekening houdt met de overgang",
    planText:
      "In je persoonlijke voedings- en trainingsschema zitten precies deze bouwstenen: een veilig calorietekort op basis van jouw gegevens, genoeg eiwit, krachttraining die past bij je niveau en elke week bijsturen op je voortgang. Met recepten en boodschappenlijst, zodat je niet hoeft te tellen.",
    planCta: "Maak mijn persoonlijke plan",
    planNote: "± 3 minuten · je betaalt pas als je een plan kiest",
    faqEyebrow: "Veelgestelde vragen",
    faqTitle: "Vragen over afvallen in de overgang",
    faq: [
      {
        q: "Kun je afvallen in de overgang?",
        a: "Ja. Het gaat vaak langzamer dan vroeger, omdat je lichaam minder verbruikt. Met een klein calorietekort, voldoende eiwit, krachttraining en genoeg beweging en slaap kun je ook in de overgang afvallen.",
      },
      {
        q: "Waarom kom ik aan in de overgang terwijl ik niet meer eet?",
        a: "Omdat je verbruik daalt: je verliest makkelijker spiermassa, beweegt vaak wat minder en slaapt slechter. Met hetzelfde eten als vroeger houd je dan elke dag een klein beetje over. Door minder oestrogeen wordt dat extra vet vaker rond je buik opgeslagen.",
      },
      {
        q: "Hoe lang duurt het om 15 kilo af te vallen in de overgang?",
        a: "Bij een gezond tempo van 0,25 tot 0,5 kilo per week ben je grofweg 7 tot 14 maanden bezig. Iedereen is anders: je resultaat hangt af van je lichaam, je startgewicht en hoe goed het plan bij je leven past.",
      },
      {
        q: "Helpen supplementen bij afvallen in de overgang?",
        a: "Voor supplementen die beloven dat je in de overgang makkelijker afvalt, is weinig of geen goed bewijs. Ze vervangen geen calorietekort, eiwit en beweging. Twijfel je over supplementen of medicijnen? Overleg met je huisarts of apotheker.",
      },
      {
        q: "Moet ik minder koolhydraten eten in de overgang?",
        a: "Niet per se. Voor afvallen telt vooral je totale aantal calorieën en voldoende eiwit. Kies wel vaker voor volkoren producten, groente en peulvruchten: die vullen goed en bevatten veel vezels.",
      },
    ],
  },
  en: {
    metaTitle: "Losing weight in menopause: why it's harder and what works",
    metaDescription:
      "Losing weight in menopause is harder with less oestrogen and muscle. How to approach it: a small calorie deficit, enough protein, strength training, good sleep.",
    eyebrow: "Nutrition and exercise",
    h1: "Losing weight during menopause:",
    h1Accent: "why it's harder and what does work",
    intro:
      "You're not eating more than you used to, yet your weight keeps creeping up, especially around your middle. It's not down to willpower. During menopause, a lot changes in your body. You can still lose weight, but it takes a slightly different approach.",
    updated: (d: string) => `Updated on ${d}`,
    shortTitle: "Short answer",
    short:
      "During menopause, your oestrogen drops, you lose muscle more easily and you often use a little less energy. You can still lose weight with a small calorie deficit (usually 300 to 500 kcal a day), enough protein (around 1.6 to 1.8 grams per kilo), strength training 2 to 3 times a week, plenty of walking and good sleep. Expect a steady pace of 0.25 to 0.5 kilo a week.",
    sections: {
      why: {
        title: "Why is losing weight during menopause harder?",
        paragraphs: [
          "Menopause is the period in which your ovaries start producing fewer hormones. It usually starts somewhere between 45 and 55 and lasts several years. As a result, several things change at once:",
        ],
        bullets: [
          "Less oestrogen: fat is more often stored around your middle instead of on your hips and legs.",
          "Less muscle: muscle mass declines with age, and muscles use energy, even at rest. Less muscle means you use less energy.",
          "Poorer sleep and hot flushes: after a short night, you're hungrier, especially for sweet and quick foods, and have less energy to move.",
          "Life itself: busy days, stress and moving less than before all play a part too.",
        ],
        after:
          "The result: eating the same as before, you slowly gain weight. Not because you're doing anything wrong, but because your body uses less. A diet that used to work often works less well now.",
      },
      calories: {
        title: "How many calories do you need during menopause?",
        paragraphs: [
          "To lose weight, you eat a little less than you use. Because you use a bit less energy during menopause, your daily needs are also lower than they used to be. A big deficit isn't a good idea: you'd lose more muscle, which lowers your energy use even further.",
        ],
        exampleTitle: "Worked example",
        example: (bmr: string, tdee: string, kcal: string, kg: string) =>
          `A 52-year-old woman of 1.68 metres and 76 kilos, lightly active and working out twice a week, uses around ${tdee} kcal a day (basal metabolic rate ${bmr} kcal). To lose weight, she eats around ${kcal} kcal a day; that's roughly ${kg} kilo a week.`,
        calcCta: "Calculate your own calorie needs",
      },
      protein: {
        title: "Protein: more important than ever",
        paragraphs: [
          "Protein helps you keep your muscle while you lose weight and keeps you feeling full, so you get hungry less quickly. The Dutch Health Council recommends 0.83 grams of protein per kilo of body weight a day for healthy adults; that's the minimum to prevent deficiencies. If you're losing weight and doing strength training, more helps: our plans use 1.8 grams per kilo to lose weight, and if you're overweight, the weight that matches a BMI of 25.",
          "Spread it across the day: a protein-rich breakfast (quark, skyr, eggs), protein at lunch and dinner (fish, chicken, pulses, tofu) and a protein-rich snack.",
        ],
      },
      training: {
        title: "Strength training and moving during menopause",
        paragraphs: [
          "Strength training may well be the most important part during menopause. You build or keep muscle, and it's good for your bones too. Two to three times a week for 30 to 45 minutes is enough: at home with your own body weight and a few dumbbells, or at the gym.",
          "On top of that, all your everyday movement counts. Walking is easy to start with and needs little recovery. A target of 8,000 to 10,000 steps a day is achievable for most people.",
        ],
        cta: "See the workout plan",
      },
      sleep: {
        title: "Sleep, stress and hot flushes",
        paragraphs: [
          "Poor sleep makes losing weight harder: you're hungrier and have less energy. A regular sleep routine, a cool bedroom and less screen time before bed can help. For some women, alcohol, caffeine or spicy food trigger hot flushes; notice whether that's the case for you.",
          "Struggling with hot flushes, poor sleep or mood swings? Talk to your GP. There are treatments, including hormonal ones. Whether they suit you is something you decide together with your doctor.",
        ],
      },
      pace: {
        title: "How fast can you lose weight during menopause?",
        paragraphs: [
          "Expect a steady pace of around 0.25 to 0.5 kilo a week. If you want to lose 15 kilos, at that pace you'll be working on it for roughly 7 to 14 months. That sounds like a long time, but a steady pace is one you can keep up, and you mainly lose fat rather than muscle.",
          "Your weight fluctuates from day to day, especially during menopause because of fluid. So weigh yourself once a week at the same time and look at the trend over a few weeks. Has it stalled for a few weeks? Then adjust what you eat or how much you move just a little.",
        ],
      },
      day: {
        title: "What a day of eating can look like",
        intro: (kcal: string, protein: string) =>
          `An example day from one of our nutrition plans: ${kcal} kcal and ${protein} grams of protein, with ordinary products from the supermarket.`,
        cta: "See the full example plan",
      },
      doctor: {
        title: "When to see your GP",
        bullets: [
          "You're losing weight without trying: always have that checked.",
          "You're gaining weight quickly for no clear reason, or you're very tired (for example, to have your thyroid checked).",
          "You're struggling with menopause symptoms, such as hot flushes, poor sleep or low mood.",
          "You take medication that can affect your weight, or you have a condition such as diabetes or high blood pressure.",
        ],
      },
    },
    planTitle: "A plan that takes menopause into account",
    planText:
      "Your personal nutrition and workout plan contains exactly these building blocks: a safe calorie deficit based on your details, enough protein, strength training that suits your level and weekly fine-tuning based on your progress. With recipes and a shopping list, so you don't have to count.",
    planCta: "Create my personal plan",
    planNote: "About 3 minutes · you only pay once you choose a plan",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Questions about losing weight during menopause",
    faq: [
      {
        q: "Can you lose weight during menopause?",
        a: "Yes. It often goes more slowly than before, because your body uses less energy. With a small calorie deficit, enough protein, strength training and enough movement and sleep, you can lose weight during menopause too.",
      },
      {
        q: "Why am I gaining weight during menopause when I'm not eating more?",
        a: "Because you use less energy: you lose muscle more easily, often move a little less and sleep worse. Eating the same as before, you end up with a small surplus every day. With less oestrogen, that extra fat is more often stored around your middle.",
      },
      {
        q: "How long does it take to lose 15 kilos during menopause?",
        a: "At a healthy pace of 0.25 to 0.5 kilo a week, roughly 7 to 14 months. Everyone is different: your result depends on your body, your starting weight and how well the plan fits your life.",
      },
      {
        q: "Do supplements help you lose weight during menopause?",
        a: "There's little or no good evidence for supplements that promise to make losing weight during menopause easier. They don't replace a calorie deficit, protein and exercise. Unsure about supplements or medication? Talk to your GP or pharmacist.",
      },
      {
        q: "Should I eat fewer carbs during menopause?",
        a: "Not necessarily. For losing weight, what matters most is your total calories and enough protein. Do choose wholegrain products, vegetables and pulses more often: they fill you up and are high in fibre.",
      },
    ],
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: pageTitle(c.metaTitle), description: c.metaDescription, alternates: alternates(l, PATH), openGraph: { type: "article" } };
}

function articleJsonLd(l: Locale) {
  const c = copy[l];
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: c.metaTitle,
    description: c.metaDescription,
    inLanguage: l,
    datePublished: UPDATED,
    dateModified: UPDATED,
    mainEntityOfPage: localeUrl(site.url, l, PATH),
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, url: site.url, logo: { "@type": "ImageObject", url: `${site.url}/icon.svg` } },
  };
}

function Prose({ paragraphs }: { paragraphs: string[] }) {
  return (
    <>
      {paragraphs.map((p) => (
        <p key={p.slice(0, 40)} className="text-lg leading-relaxed text-muted">
          {p}
        </p>
      ))}
    </>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-6 text-lg leading-relaxed text-muted marker:text-brand-600">
      {items.map((b) => (
        <li key={b.slice(0, 40)}>{b}</li>
      ))}
    </ul>
  );
}

export default async function OvergangPage() {
  const l = await getLocale();
  const c = copy[l];
  const s = c.sections;
  const n = (x: number, d = 0) => formatNumber(x, d, l);
  const samples = samplePlansFor(l);
  const day = samples.sampleNutritionPlan.days[0];
  const updated = new Intl.DateTimeFormat(l === "en" ? "en-GB" : "nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${UPDATED}T12:00:00`));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(l)) }} />
      <section className="bg-gradient-to-b from-brand-50 to-cream pt-10 pb-10 sm:pt-14">
        <div className="container-page max-w-3xl">
          {/* De kop begint zelf al met de zoekterm; het label staat er daarom los boven. */}
          <p className="eyebrow mb-3">{c.eyebrow}</p>
          <h1 className="heading-xl">
            {c.h1} <span className="text-brand-600">{c.h1Accent}</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{c.intro}</p>
          <p className="mt-3 text-sm text-muted">{c.updated(updated)}</p>
          {/* Kort antwoord bovenaan: dat is wat Google (en een AI-overzicht) het eerst leest. */}
          <div className="mt-6 rounded-[1.5rem] border-2 border-brand-200 bg-white p-5 sm:p-6">
            <p className="flex items-center gap-2 font-extrabold">
              <Info className="size-5 text-brand-600" aria-hidden /> {c.shortTitle}
            </p>
            <p className="mt-2 leading-relaxed">{c.short}</p>
          </div>
        </div>
      </section>

      <article className="container-page max-w-3xl space-y-14 py-12">
        <section className="space-y-4">
          <h2 className="heading-md">{s.why.title}</h2>
          <Prose paragraphs={s.why.paragraphs} />
          <Bullets items={s.why.bullets} />
          <p className="text-lg leading-relaxed text-muted">{s.why.after}</p>
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{s.calories.title}</h2>
          <Prose paragraphs={s.calories.paragraphs} />
          <div className="rounded-[1.5rem] bg-sand p-5 sm:p-6">
            <p className="font-extrabold">{s.calories.exampleTitle}</p>
            <p className="mt-2 leading-relaxed text-muted">
              {s.calories.example(n(example.bmr), n(example.tdee), n(example.calories), n(-example.expectedKgPerWeek, 1))}
            </p>
            <Link href="/caloriebehoefte-berekenen" className="btn-secondary mt-4">
              <Calculator className="size-5" aria-hidden /> {s.calories.calcCta}
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{s.protein.title}</h2>
          <Prose paragraphs={s.protein.paragraphs} />
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{s.training.title}</h2>
          <Prose paragraphs={s.training.paragraphs} />
          <Link href="/trainingsschema" className="inline-flex items-center gap-1.5 font-bold text-brand-700 underline">
            {s.training.cta} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{s.sleep.title}</h2>
          <Prose paragraphs={s.sleep.paragraphs} />
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{s.pace.title}</h2>
          <Prose paragraphs={s.pace.paragraphs} />
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{s.day.title}</h2>
          <p className="text-lg leading-relaxed text-muted">{s.day.intro(n(samples.sampleTargets.calories), n(samples.sampleTargets.proteinG))}</p>
          <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-white">
            {day.meals.map((m) => (
              <li key={m.moment + m.name} className="flex items-baseline justify-between gap-4 px-5 py-3.5">
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-brand-600 uppercase">{m.moment}</span>
                  <span className="block font-semibold">{m.name}</span>
                </span>
                <span className="shrink-0 text-sm font-bold text-muted tabular-nums">{n(m.kcal)} kcal</span>
              </li>
            ))}
          </ul>
          <Link href="/voorbeeld" className="inline-flex items-center gap-1.5 font-bold text-brand-700 underline">
            {s.day.cta} <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{s.doctor.title}</h2>
          <Bullets items={s.doctor.bullets} />
        </section>

        <section className="rounded-[2rem] bg-brand-900 p-6 text-white sm:p-8">
          <h2 className="heading-md text-white">{c.planTitle}</h2>
          <p className="mt-3 text-lg leading-relaxed text-white/80">{c.planText}</p>
          <Link href="/start?doel=afvallen" className="btn-primary mt-5 !bg-lime-glow !text-brand-950">
            {c.planCta} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <p className="mt-2 text-sm text-white/70">{c.planNote}</p>
        </section>
      </article>

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
