import type { Metadata } from "next";
import { ArrowRight, Calculator, Info } from "lucide-react";
import { ProteinCalculator } from "@/components/calculator/ProteinCalculator";
import { CtaBanner, FaqJsonLd, FaqList, SectionHeading } from "@/components/marketing";
import { site } from "@/config/site";
import { resultDisclaimer } from "@/content/disclaimers";
import { defineCopy, localeUrl, type Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { alternates, pageTitle } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { PROTEIN_MINIMUM_PER_KG, PROTEIN_PER_KG } from "@/lib/calculations";
import { formatNumber } from "@/lib/format";

const PATH = "/eiwitten-per-dag";
/** Datum van de laatste inhoudelijke wijziging (ook in de Article-gegevens voor Google). */
const UPDATED = "2026-11-08";
const WEIGHTS = [50, 60, 70, 80, 90, 100];
const COLUMNS = [PROTEIN_MINIMUM_PER_KG, PROTEIN_PER_KG.afblijven, PROTEIN_PER_KG.afvallen, PROTEIN_PER_KG.sterker];

const copy = defineCopy({
  nl: {
    metaTitle: "Hoeveel eiwitten per dag heb je nodig? Met rekenhulp",
    metaDescription:
      "Hoeveel eiwitten per dag heb je nodig om af te vallen, spieren op te bouwen of gezond te eten? Bereken het gratis, met tabel per gewicht en eiwitrijke ideeën.",
    eyebrow: "Voeding",
    h1: "Hoeveel eiwitten per dag",
    h1Accent: "heb je nodig?",
    intro:
      "Eiwit helpt je spieren te behouden, geeft een vol gevoel en is extra belangrijk als je afvalt of traint. Hoeveel je nodig hebt, hangt af van je gewicht en je doel. Bereken het hieronder, of kijk in de tabel.",
    updated: (d: string) => `Bijgewerkt op ${d}`,
    shortTitle: "Kort antwoord",
    short:
      "Gezonde volwassenen hebben minimaal 0,83 gram eiwit per kilo lichaamsgewicht per dag nodig (advies van de Gezondheidsraad). Wie afvalt of aan krachttraining doet, heeft baat bij meer: zo'n 1,6 tot 2,0 gram per kilo. Weeg je 70 kilo, dan is dat minimaal 58 gram, zo'n 125 gram als je afvalt en 140 gram als je spieren opbouwt.",
    tableTitle: "Eiwitten per dag: tabel per lichaamsgewicht",
    tableIntro:
      "Zoek je gewicht op en kijk in de kolom van je doel. De tabel gaat uit van een gezond gewicht; bij overgewicht reken je met het gewicht dat bij een BMI van 25 hoort (de rekenhulp doet dat automatisch).",
    cols: ["Gewicht", "Minimum (0,83 g/kg)", "Op gewicht + sporten (1,6)", "Afvallen (1,8)", "Spieren opbouwen (2,0)"],
    tableNote: "Gram eiwit per dag. Het minimum is afgerond op hele grammen, de rest op 5 gram.",
    sections: [
      {
        title: "Hoeveel eiwitten per dag als vrouw of man?",
        paragraphs: [
          "Voor eiwit maakt het niet uit of je een vrouw of man bent: je behoefte hangt af van je lichaamsgewicht en je doel. Een vrouw van 65 kilo die wil afvallen, heeft zo'n 115 gram per dag nodig; een man van 85 kilo met hetzelfde doel ongeveer 155 gram. Omdat mannen gemiddeld zwaarder zijn, hebben ze gemiddeld wel meer eiwit nodig.",
        ],
      },
      {
        title: "Hoeveel eiwitten per dag om af te vallen?",
        paragraphs: [
          "Als je afvalt, verlies je niet alleen vet maar ook spiermassa. Genoeg eiwit, samen met krachttraining, helpt je spieren te behouden. Bovendien vult eiwit goed, waardoor je minder snel trek krijgt. In onze schema's rekenen we om af te vallen met 1,8 gram per kilo; bij overgewicht met het gewicht dat bij een BMI van 25 hoort.",
          "Eiwit telt wel mee in je calorieën: 1 gram eiwit levert 4 kcal. Kies daarom vooral magere eiwitbronnen, zoals kwark, skyr, kip, vis, eieren en peulvruchten.",
        ],
      },
      {
        title: "Hoeveel eiwitten per dag voor spieropbouw?",
        paragraphs: [
          "Voor spieropbouw is krachttraining de belangrijkste prikkel; eiwit is de bouwstof. In sportvoedingsonderzoek wordt vaak 1,6 gram per kilo of meer gebruikt. Wij rekenen met 2,0 gram per kilo. Nog meer eten levert voor de meeste mensen weinig extra op.",
        ],
      },
      {
        title: "Eiwitten voor ouderen",
        paragraphs: [
          "Voor gezonde ouderen geldt officieel hetzelfde minimum van 0,83 gram per kilo. Wel neemt je spiermassa met de leeftijd af, dus genoeg eiwit en krachttraining blijven belangrijk. Bij ziekte, ondervoeding of na een operatie kan meer nodig zijn: overleg dan met je huisarts of een diëtist.",
        ],
      },
    ],
    foodsTitle: "Hoeveel eiwit zit erin?",
    foodsIntro: "Zo kom je aan je eiwit met gewone producten uit de supermarkt.",
    foodsCols: ["Product", "Portie", "Eiwit"],
    foods: [
      ["Magere kwark", "250 g", 21],
      ["Skyr", "150 g", 16],
      ["Hüttenkäse", "100 g", 11],
      ["Halfvolle melk", "250 ml", 9],
      ["Kaas (30+)", "2 plakjes (40 g)", 11],
      ["Eieren", "2 stuks", 13],
      ["Kipfilet (rauw)", "100 g", 23],
      ["Zalm (rauw)", "100 g", 20],
      ["Tonijn in water", "1 blikje (120 g)", 30],
      ["Linzen (gekookt)", "150 g", 13],
      ["Kikkererwten (uit blik)", "150 g", 10],
      ["Tofu", "100 g", 13],
      ["Volkoren brood", "2 sneetjes", 7],
      ["Amandelen", "25 g", 5],
    ] as [string, string, number][],
    foodsNote: "Afgeronde waarden; per merk verschilt het wat. Vlees en vis zijn rauw gewogen.",
    breakfastTitle: "Eiwitrijk ontbijt: 5 ideeën",
    breakfast: [
      ["Kwarkbowl", "250 g magere kwark met 40 g havermout en fruit", 26],
      ["Roerei op brood", "2 eieren op 2 sneetjes volkoren brood met tomaat", 20],
      ["Omelet", "3 eieren met spinazie en 20 g geraspte kaas", 25],
      ["Skyr met muesli", "150 g skyr met 30 g muesli en blauwe bessen", 19],
      ["Brood met hüttenkäse", "2 sneetjes volkoren met 100 g hüttenkäse en komkommer", 18],
    ] as [string, string, number][],
    gram: (g: string) => `± ${g} g eiwit`,
    tooMuchTitle: "Kun je te veel eiwit eten?",
    tooMuch:
      "Voor gezonde volwassenen worden hoeveelheden tot ongeveer 2 gram per kilo lichaamsgewicht als veilig beschouwd. Meer heeft meestal geen extra effect. Heb je een nieraandoening of twijfel je, overleg dan met je huisarts.",
    shakesTitle: "Heb je eiwitshakes nodig?",
    shakes:
      "Nee, niet per se. Met gewone voeding kom je meestal goed aan je eiwit. Een shake kan handig zijn als het je anders echt niet lukt, maar hij vervangt geen maaltijd en is duurder dan kwark of eieren.",
    planTitle: "Je eiwitdoel, zonder te tellen",
    planText:
      "In je persoonlijke voedingsschema rekenen we je calorie- en eiwitdoel voor je uit en krijg je een weekmenu met recepten en boodschappenlijst dat daar precies op uitkomt. Elke week sturen we bij op je voortgang.",
    planCta: "Bekijk het voedingsschema",
    calcCta: "Bereken ook je caloriebehoefte",
    faqEyebrow: "Veelgestelde vragen",
    faqTitle: "Vragen over eiwitten",
    faq: [
      {
        q: "Hoeveel eiwitten per dag heb ik nodig?",
        a: "Minimaal 0,83 gram per kilo lichaamsgewicht per dag (advies van de Gezondheidsraad). Als je afvalt of aan krachttraining doet, is 1,6 tot 2,0 gram per kilo verstandig. Bij overgewicht reken je met het gewicht dat bij een BMI van 25 hoort.",
      },
      {
        q: "Hoeveel eiwit per maaltijd?",
        a: "Verdeel je eiwit over 3 tot 4 eetmomenten. Voor de meeste mensen komt dat neer op zo'n 25 tot 40 gram per maaltijd. Dat werkt beter dan alles in één keer.",
      },
      {
        q: "Hoeveel eiwitten per dag om af te vallen als vrouw?",
        a: "Reken met ongeveer 1,8 gram per kilo. Een vrouw van 70 kilo komt dan uit op zo'n 125 gram per dag. Weeg je meer dan bij een BMI van 27 past, dan reken je met het gewicht bij BMI 25.",
      },
      {
        q: "Tel ik vlees en vis rauw of gaar?",
        a: "In de tabel op deze pagina is vlees en vis rauw gewogen. Gaar is het lichter (er gaat vocht uit), dus per 100 gram gaar zit er meer eiwit in.",
      },
      {
        q: "Zitten er ook eiwitten in plantaardig eten?",
        a: "Ja. Peulvruchten zoals linzen, kikkererwten en bonen, tofu, tempeh, noten en volkoren granen bevatten eiwit. Eet je vegetarisch of veganistisch, combineer dan verschillende bronnen over de dag.",
      },
    ],
  },
  en: {
    metaTitle: "How much protein do you need a day? With calculator",
    metaDescription:
      "How much protein do you need a day to eat healthily, lose weight or build muscle? Work it out for free, with a table by body weight and high-protein ideas.",
    eyebrow: "Nutrition",
    h1: "How much protein",
    h1Accent: "do you need a day?",
    intro:
      "Protein helps you keep your muscle, keeps you feeling full and is extra important when you're losing weight or training. How much you need depends on your weight and your goal. Work it out below, or check the table.",
    updated: (d: string) => `Updated on ${d}`,
    shortTitle: "Short answer",
    short:
      "Healthy adults need at least 0.83 grams of protein per kilo of body weight a day (Dutch Health Council advice). If you're losing weight or doing strength training, more helps: around 1.6 to 2.0 grams per kilo. If you weigh 70 kilos, that's at least 58 grams, around 125 grams if you're losing weight and 140 grams if you're building muscle.",
    tableTitle: "Protein per day: table by body weight",
    tableIntro:
      "Find your weight and look in the column for your goal. The table assumes a healthy weight; if you're overweight, use the weight that matches a BMI of 25 (the calculator does this automatically).",
    cols: ["Weight", "Minimum (0.83 g/kg)", "Maintain + exercise (1.6)", "Lose weight (1.8)", "Build muscle (2.0)"],
    tableNote: "Grams of protein a day. The minimum is rounded to whole grams, the rest to 5 grams.",
    sections: [
      {
        title: "How much protein a day for women and men?",
        paragraphs: [
          "For protein, it doesn't matter whether you're a woman or a man: your needs depend on your body weight and your goal. A 65-kilo woman who wants to lose weight needs around 115 grams a day; an 85-kilo man with the same goal around 155 grams. Because men weigh more on average, they do need more protein on average.",
        ],
      },
      {
        title: "How much protein a day to lose weight?",
        paragraphs: [
          "When you lose weight, you lose not only fat but also muscle. Enough protein, together with strength training, helps you keep your muscle. Protein is also filling, so you get hungry less quickly. In our plans, we use 1.8 grams per kilo to lose weight; if you're overweight, based on the weight that matches a BMI of 25.",
          "Protein does count towards your calories: 1 gram of protein provides 4 kcal. So mainly choose lean sources of protein, such as quark, skyr, chicken, fish, eggs and pulses.",
        ],
      },
      {
        title: "How much protein a day to build muscle?",
        paragraphs: [
          "For building muscle, strength training is the main trigger; protein is the building material. Sports nutrition research often uses 1.6 grams per kilo or more. We use 2.0 grams per kilo. Eating even more adds little for most people.",
        ],
      },
      {
        title: "Protein for older adults",
        paragraphs: [
          "For healthy older adults, the official minimum is the same 0.83 grams per kilo. Muscle mass does decline with age, so enough protein and strength training remain important. During illness, malnutrition or after surgery, more may be needed: talk to your GP or a dietitian.",
        ],
      },
    ],
    foodsTitle: "How much protein is in it?",
    foodsIntro: "This is how to reach your protein with ordinary supermarket products.",
    foodsCols: ["Product", "Portion", "Protein"],
    foods: [
      ["Low-fat quark", "250 g", 21],
      ["Skyr", "150 g", 16],
      ["Cottage cheese", "100 g", 11],
      ["Semi-skimmed milk", "250 ml", 9],
      ["Cheese (30+)", "2 slices (40 g)", 11],
      ["Eggs", "2", 13],
      ["Chicken breast (raw)", "100 g", 23],
      ["Salmon (raw)", "100 g", 20],
      ["Tuna in water", "1 tin (120 g)", 30],
      ["Lentils (cooked)", "150 g", 13],
      ["Chickpeas (tinned)", "150 g", 10],
      ["Tofu", "100 g", 13],
      ["Wholemeal bread", "2 slices", 7],
      ["Almonds", "25 g", 5],
    ] as [string, string, number][],
    foodsNote: "Rounded values; they vary a little by brand. Meat and fish are weighed raw.",
    breakfastTitle: "High-protein breakfast: 5 ideas",
    breakfast: [
      ["Quark bowl", "250 g low-fat quark with 40 g oats and fruit", 26],
      ["Scrambled eggs on toast", "2 eggs on 2 slices of wholemeal bread with tomato", 20],
      ["Omelette", "3 eggs with spinach and 20 g grated cheese", 25],
      ["Skyr with muesli", "150 g skyr with 30 g muesli and blueberries", 19],
      ["Bread with cottage cheese", "2 slices of wholemeal with 100 g cottage cheese and cucumber", 18],
    ] as [string, string, number][],
    gram: (g: string) => `± ${g} g protein`,
    tooMuchTitle: "Can you eat too much protein?",
    tooMuch:
      "For healthy adults, amounts up to around 2 grams per kilo of body weight are considered safe. More usually has no extra effect. If you have a kidney condition or are unsure, talk to your GP.",
    shakesTitle: "Do you need protein shakes?",
    shakes:
      "No, not necessarily. With ordinary food, you can usually reach your protein. A shake can be handy if you really can't manage otherwise, but it doesn't replace a meal and costs more than quark or eggs.",
    planTitle: "Your protein target, without counting",
    planText:
      "In your personal nutrition plan, we work out your calorie and protein targets for you, and you get a weekly menu with recipes and a shopping list that adds up to exactly that. We fine-tune it every week based on your progress.",
    planCta: "See the nutrition plan",
    calcCta: "Also calculate your calorie needs",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Questions about protein",
    faq: [
      {
        q: "How much protein do I need a day?",
        a: "At least 0.83 grams per kilo of body weight a day (Dutch Health Council advice). If you're losing weight or doing strength training, 1.6 to 2.0 grams per kilo is sensible. If you're overweight, use the weight that matches a BMI of 25.",
      },
      {
        q: "How much protein per meal?",
        a: "Spread your protein over 3 to 4 meals. For most people, that comes down to around 25 to 40 grams per meal. That works better than having it all at once.",
      },
      {
        q: "How much protein a day to lose weight as a woman?",
        a: "Use around 1.8 grams per kilo. A 70-kilo woman would then need around 125 grams a day. If you weigh more than fits a BMI of 27, use the weight at a BMI of 25.",
      },
      {
        q: "Do I weigh meat and fish raw or cooked?",
        a: "In the table on this page, meat and fish are weighed raw. Cooked, they're lighter (they lose moisture), so 100 grams cooked contains more protein.",
      },
      {
        q: "Is there protein in plant-based food too?",
        a: "Yes. Pulses such as lentils, chickpeas and beans, tofu, tempeh, nuts and wholegrains contain protein. If you eat vegetarian or vegan, combine different sources throughout the day.",
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

export default async function EiwittenPage() {
  const l = await getLocale();
  const c = copy[l];
  const n = (x: number) => formatNumber(x, 0, l);
  const updated = new Intl.DateTimeFormat(l === "en" ? "en-GB" : "nl-NL", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${UPDATED}T12:00:00`));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(l)) }} />
      <section className="bg-gradient-to-b from-brand-50 to-cream pt-10 pb-12 sm:pt-14">
        <div className="container-page">
          <div className="mb-8 max-w-3xl">
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
          <ProteinCalculator />
        </div>
      </section>

      <article className="container-page max-w-3xl space-y-14 py-12">
        <section className="space-y-4">
          <h2 className="heading-md">{c.tableTitle}</h2>
          <p className="text-lg leading-relaxed text-muted">{c.tableIntro}</p>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="bg-sand text-xs font-bold text-muted uppercase">
                <tr>
                  {c.cols.map((col) => (
                    <th key={col} scope="col" className="px-4 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {WEIGHTS.map((w) => (
                  <tr key={w}>
                    <th scope="row" className="px-4 py-3 font-bold">
                      {w} kg
                    </th>
                    {COLUMNS.map((perKg, i) => {
                      const g = i === 0 ? Math.round(w * perKg) : Math.round((w * perKg) / 5) * 5;
                      return (
                        <td key={perKg} className="px-4 py-3 whitespace-nowrap tabular-nums">
                          {n(g)} g
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">{c.tableNote}</p>
        </section>

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

        <section className="space-y-4">
          <h2 className="heading-md">{c.foodsTitle}</h2>
          <p className="text-lg leading-relaxed text-muted">{c.foodsIntro}</p>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
            <table className="w-full min-w-[22rem] text-left text-sm">
              <thead className="bg-sand text-xs font-bold text-muted uppercase">
                <tr>
                  {c.foodsCols.map((col) => (
                    <th key={col} scope="col" className="px-4 py-3">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {c.foods.map(([food, portion, g]) => (
                  <tr key={food}>
                    <th scope="row" className="px-4 py-3 font-semibold">
                      {food}
                    </th>
                    <td className="px-4 py-3 text-muted">{portion}</td>
                    <td className="px-4 py-3 font-bold whitespace-nowrap tabular-nums">± {n(g)} g</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">{c.foodsNote}</p>
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{c.breakfastTitle}</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {c.breakfast.map(([title, text, g]) => (
              <li key={title} className="card p-4">
                <p className="font-extrabold">{title}</p>
                <p className="mt-1 text-muted">{text}</p>
                <p className="mt-2 text-sm font-bold text-brand-700">{c.gram(n(g))}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{c.tooMuchTitle}</h2>
          <p className="text-lg leading-relaxed text-muted">{c.tooMuch}</p>
        </section>

        <section className="space-y-4">
          <h2 className="heading-md">{c.shakesTitle}</h2>
          <p className="text-lg leading-relaxed text-muted">{c.shakes}</p>
        </section>

        <section className="rounded-[2rem] bg-brand-900 p-6 text-white sm:p-8">
          <h2 className="heading-md text-white">{c.planTitle}</h2>
          <p className="mt-3 text-lg leading-relaxed text-white/80">{c.planText}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/voedingsschema" className="btn-primary !bg-lime-glow !text-brand-950">
              {c.planCta} <ArrowRight className="size-5" aria-hidden />
            </Link>
            <Link href="/caloriebehoefte-berekenen" className="btn-secondary !border-white/30 !bg-transparent !text-white">
              <Calculator className="size-5" aria-hidden /> {c.calcCta}
            </Link>
          </div>
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
