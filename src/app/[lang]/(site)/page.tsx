import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { ArrowRight, Check, Clock, Dumbbell, Flame, Salad, ShoppingCart, X } from "lucide-react";
import {
  Benefits,
  CtaBanner,
  FaqJsonLd,
  FaqList,
  Guarantee,
  SectionHeading,
  Steps,
  TrustRow,
} from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import { FutureSection, PainSection } from "@/components/conversion";
import { faqInOrder } from "@/content/faq";
import { currentPromotion } from "@/lib/promotion";
import { site } from "@/config/site";
import { lowestMonthlyPrice, productFor, type ProductId } from "@/config/pricing";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { euro } from "@/lib/format";

const copy = defineCopy<{
  badge: string;
  title: [string, string, string];
  intro: string;
  startQuiz: string;
  sample: string;
  priceFrom: string;
  perMonth: (price: string, perWeek: string) => string;
  priceNote: string;
  heroAlt: string;
  mealLabel: string;
  mealName: string;
  mealKcal: string;
  mealProtein: string;
  dailyTarget: string;
  dailyKcal: string;
  dailyDetails: string;
  whyEyebrow: string;
  whyTitle: string;
  whyText: string;
  whyAlt: string;
  dietTitle: string;
  dietCons: string[];
  ourPros: string[];
  stepsEyebrow: string;
  stepsTitle: string;
  stepsIntro: string;
  answer: string;
  answerNote: string;
  productsEyebrow: string;
  productsTitle: string;
  productsIntro: string;
  popular: string;
  moreAbout: Record<ProductId, string>;
  getEyebrow: string;
  getTitle: string;
  getItems: { title: string; text: string }[];
  flatlayAlt: string;
  ingredientsAlt: string;
  gymAlt: string;
  benefitsEyebrow: string;
  benefitsTitle: string;
  pricingEyebrow: string;
  pricingTitle: string;
  pricingIntro: string;
  keepEyebrow: string;
  keepTitle: string;
  keepText: string;
  keepList: string[];
  runningAlt: string;
  faqEyebrow: string;
  faqTitle: string;
  allQuestions: string;
}>({
  nl: {
    badge: "In 2 minuten ingevuld · binnen 2 uur je schema",
    title: ["De kilo's gaan eraf, en komen ", "steeds weer terug", "?"],
    intro:
      "Tijd voor een aanpak die wél bij je leven past: een persoonlijk voedings- en trainingsschema op jouw lichaam, smaak en agenda, elke week bijgestuurd, met daarna een plan om op gewicht te blijven. Zonder crashdieet of honger, en binnen enkele minuten in je mailbox.",
    startQuiz: "Maak mijn persoonlijke plan",
    sample: "Bekijk een voorbeeldschema",
    priceFrom: "Al vanaf",
    perMonth: (price, perWeek) => `${price} per maand (${perWeek} per week)`,
    priceNote: "maandelijks via automatische incasso",
    heroAlt: "Vrouw doet thuis een buikspieroefening op een yogamat",
    mealLabel: "Lunch · 10 min",
    mealName: "Zalmbowl met ei & groente",
    mealKcal: "452 kcal",
    mealProtein: "38 g eiwit",
    dailyTarget: "Jouw dagdoel",
    dailyKcal: "1.580 kcal",
    dailyDetails: "120 g eiwit · 8.000 stappen",
    whyEyebrow: "Waarom deze aanpak anders is",
    whyTitle: "Geen dieet. Een plan dat je volhoudt.",
    whyText:
      "Wij doen het anders: een realistisch tekort, genoeg eiwit, krachttraining die je spieren beschermt en eten dat je gewoon lekker vindt. En omdat we elke week bijsturen, sta je er niet alleen voor als het even tegenzit.",
    whyAlt: "Vrouw kookt een gezonde maaltijd in een lichte keuken",
    dietTitle: "Standaard dieet",
    dietCons: ["Eén lijstje voor iedereen", "Honger en trek", "Saai en streng", "Jojo-effect"],
    ourPros: ["Op jóu afgestemd", "Verzadigd door eiwit & vezels", "Gerechten die je lekker vindt", "Gemaakt om vol te houden"],
    stepsEyebrow: "Zo werkt het",
    stepsTitle: "In 3 stappen naar jouw persoonlijke schema",
    stepsIntro: "Geen wachttijden of intakegesprekken. Vandaag beginnen kan gewoon.",
    answer: "Maak mijn persoonlijke plan",
    answerNote: "Duurt ongeveer 2 minuten · Je betaalt pas als je een plan kiest",
    productsEyebrow: "Kies wat bij je past",
    productsTitle: "Voeding, training of allebei",
    productsIntro: "Los te koop of voordelig als bundel. In de bundel versterken voeding en training elkaar.",
    popular: "Meest gekozen",
    moreAbout: { voeding: "Meer over voeding", training: "Meer over training", bundel: "Meer over bundel" },
    getEyebrow: "Wat je krijgt",
    getTitle: "Alles wat je nodig hebt, overzichtelijk op één plek",
    getItems: [
      { title: "Jouw persoonlijke dagdoelen", text: "Calorieën, eiwit, koolhydraten en vet, berekend voor jouw lichaam en doel." },
      { title: "Weekmenu met recepten", text: "Elke dag ontbijt, lunch, avondeten en tussendoortjes, met hoeveelheden en bereiding." },
      { title: "Boodschappenlijst", text: "Per afdeling gesorteerd, voor de hele week." },
      { title: "Trainingsschema met progressie", text: "Sets, herhalingen, rusttijden en uitleg, opgebouwd over 4 weken." },
      { title: "Elke 4 weken een nieuw schema", text: "Bijgestuurd op basis van je check-in, zodat je blijft vooruitgaan." },
    ],
    flatlayAlt: "Gezonde maaltijden op tafel",
    ingredientsAlt: "Verse ingrediënten op een snijplank",
    gymAlt: "Vrouw traint in de sportschool",
    benefitsEyebrow: "Waarom kiezen voor ons",
    benefitsTitle: "Persoonlijke begeleiding, zonder de hoge kosten",
    pricingEyebrow: "Prijzen",
    pricingTitle: "Kies je plan en looptijd",
    pricingIntro:
      "Een nieuwe gewoonte heeft volgens onderzoek gemiddeld zo'n 66 dagen nodig. Kies je 3 maanden of langer, dan krijg je elke 4 weken een nieuw, bijgestuurd schema en betaal je minder per maand. Na de minimale looptijd is elk abonnement maandelijks opzegbaar.",
    keepEyebrow: "Het geheim zit in het afblijven",
    keepTitle: "Je streefgewicht bereikt? Dan begint het pas.",
    keepText:
      "Juist na het afvallen gaat het vaak mis: het dieet stopt en de oude gewoontes komen terug. Daarom stappen we na het afvallen met je over op een onderhoudsplan: meer eten, sterk blijven en gewoontes vasthouden. Zo geef je je resultaat de beste kans om te blijven.",
    keepList: [
      "Geleidelijk terug naar je onderhoudsniveau",
      "Krachttraining om je stofwisseling te ondersteunen",
      "Flexibel eten, ook op feestjes en vakantie",
    ],
    runningAlt: "Mensen hardlopen bij zonsopkomst",
    faqEyebrow: "Veelgestelde vragen",
    faqTitle: "Nog twijfels? Logisch.",
    allQuestions: "Bekijk alle vragen",
  },
  en: {
    badge: "2 minutes to fill in · your plan within 2 hours",
    title: ["The kilos come off, then ", "keep coming back", "?"],
    intro:
      "Time for an approach that actually fits your life: a personal nutrition and workout plan built around your body, taste and schedule, adjusted every week, followed by a plan to keep the weight off. No crash diet, no going hungry, and in your inbox within minutes.",
    startQuiz: "Create my personal plan",
    sample: "See a sample plan",
    priceFrom: "From just",
    perMonth: (price, perWeek) => `${price} a month (${perWeek} a week)`,
    priceNote: "paid monthly by direct debit",
    heroAlt: "Woman doing an ab exercise on a yoga mat at home",
    mealLabel: "Lunch · 10 min",
    mealName: "Salmon bowl with egg & veg",
    mealKcal: "452 kcal",
    mealProtein: "38 g protein",
    dailyTarget: "Your daily target",
    dailyKcal: "1,580 kcal",
    dailyDetails: "120 g protein · 8,000 steps",
    whyEyebrow: "Why this approach is different",
    whyTitle: "Not a diet. A plan you can stick to.",
    whyText:
      "We do things differently: a realistic calorie deficit, plenty of protein, strength training that protects your muscles, and food you genuinely enjoy. And because we adjust your plan every week, you're not on your own when things get tough.",
    whyAlt: "Woman cooking a healthy meal in a bright kitchen",
    dietTitle: "Typical diet",
    dietCons: ["One list for everyone", "Hunger and cravings", "Boring and strict", "Yo-yo effect"],
    ourPros: ["Tailored to you", "Kept full by protein & fibre", "Dishes you actually enjoy", "Made to stick with"],
    stepsEyebrow: "How it works",
    stepsTitle: "Your personal plan in 3 simple steps",
    stepsIntro: "No waiting lists, no intake interviews. You can start today.",
    answer: "Create my personal plan",
    answerNote: "Takes about 2 minutes · You only pay once you choose a plan",
    productsEyebrow: "Choose what suits you",
    productsTitle: "Nutrition, training or both",
    productsIntro:
      "Buy them separately or save with the bundle. In the bundle, nutrition and training reinforce each other.",
    popular: "Most popular",
    moreAbout: { voeding: "More about nutrition", training: "More about training", bundel: "More about the bundle" },
    getEyebrow: "What you get",
    getTitle: "Everything you need, neatly in one place",
    getItems: [
      { title: "Your personal daily targets", text: "Calories, protein, carbs and fat, calculated for your body and goal." },
      { title: "Weekly meal plan with recipes", text: "Breakfast, lunch, dinner and snacks every day, with quantities and cooking steps." },
      { title: "Shopping list", text: "Sorted by supermarket aisle, for the whole week." },
      { title: "Workout plan with progression", text: "Sets, reps, rest times and instructions, built up over 4 weeks." },
      { title: "A new plan every 4 weeks", text: "Fine-tuned based on your check-in, so you keep making progress." },
    ],
    flatlayAlt: "Healthy meals on a table",
    ingredientsAlt: "Fresh ingredients on a chopping board",
    gymAlt: "Woman working out at the gym",
    benefitsEyebrow: "Why choose us",
    benefitsTitle: "Personal guidance, without the hefty price tag",
    pricingEyebrow: "Pricing",
    pricingTitle: "Choose your plan and term",
    pricingIntro:
      "According to research, a new habit takes around 66 days on average. Choose 3 months or longer and you get a new, fine-tuned plan every 4 weeks, at a lower monthly price. After the minimum term, every subscription can be cancelled monthly.",
    keepEyebrow: "The secret is keeping it off",
    keepTitle: "Reached your target weight? That's where it really begins.",
    keepText:
      "This is exactly where it often goes wrong: the diet ends and the old habits return. That's why, once you've lost the weight, we move you onto a maintenance plan: eating more, staying strong and holding on to your new habits. That way, you give your results the best chance to last.",
    keepList: [
      "A gradual return to your maintenance level",
      "Strength training to support your metabolism",
      "Flexible eating, even at parties and on holiday",
    ],
    runningAlt: "People running at sunrise",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Still on the fence? We get it.",
    allQuestions: "See all questions",
  },
});

const getIcons = [Flame, Salad, ShoppingCart, Dumbbell, Clock];

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { alternates: alternates(l, "/") };
}

export default async function HomePage() {
  const l = await getLocale();
  const promo = await currentPromotion(l);
  const c = copy[l];
  // De twijfels die het afsluiten tegenhouden eerst.
  const faq = faqInOrder(l, ["opzeggen", "garantie", "abonnement", "persoonlijk", "niet-afvallen", "resultaat", "snel"]);
  const price = lowestMonthlyPrice();

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[38rem] bg-gradient-to-b from-brand-50 to-cream" />
        <div className="container-page grid items-center gap-12 pt-10 pb-16 lg:grid-cols-[1.05fr_1fr] lg:pt-16 lg:pb-24">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800">
              <span className="size-2 rounded-full bg-brand-500" aria-hidden /> {c.badge}
            </p>
            <h1 className="heading-xl">
              {c.title[0]}
              <span className="text-brand-600">{c.title[1]}</span>
              {c.title[2]}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              {c.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/start" className="btn-primary text-lg">
                {c.startQuiz} <ArrowRight className="size-5" aria-hidden />
              </Link>
              <Link href="/voorbeeld" className="btn-secondary text-lg">
                {c.sample}
              </Link>
            </div>
            <p className="mt-4 text-[0.9375rem] font-semibold text-ink/80">
              {c.priceFrom} <span className="text-brand-700">{c.perMonth(euro(price, l), euro(Math.round((price * 12) / 52), l))}</span> ·{" "}
              {c.priceNote}
            </p>
            <div className="mt-8">
              <TrustRow />
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)] sm:aspect-[5/5]">
              <Image
                src="/images/hero-workout-home.jpg"
                alt={c.heroAlt}
                fill
                preload
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover object-[68%_50%]"
              />
            </div>
            <div className="absolute -bottom-6 -left-3 w-[15.5rem] rounded-3xl bg-white p-4 shadow-[var(--shadow-lift)] sm:-left-10">
              <div className="flex items-center gap-3">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl">
                  <Image src="/images/bowl-salmon.jpg" alt="" fill sizes="56px" className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-600 uppercase">{c.mealLabel}</p>
                  <p className="text-sm leading-snug font-bold">{c.mealName}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-1.5 text-[0.6875rem] font-bold">
                <span className="rounded-full bg-sand px-2 py-1">{c.mealKcal}</span>
                <span className="rounded-full bg-sand px-2 py-1">{c.mealProtein}</span>
              </div>
            </div>
            <div className="absolute -top-4 -right-2 rounded-3xl bg-brand-900 p-4 text-white shadow-[var(--shadow-lift)] sm:-right-6">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                <Flame className="size-3.5 text-lime-glow" aria-hidden /> {c.dailyTarget}
              </p>
              <p className="text-2xl font-extrabold">{c.dailyKcal}</p>
              <p className="text-xs text-white/70">{c.dailyDetails}</p>
            </div>
          </div>
        </div>
      </section>

      {/* HERKEN JE DIT? */}
      <PainSection topic="afvallen" l={l} href="/start" />

      {/* WAAROM HET WERKT */}
      <section className="container-page py-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image
              src="/images/cooking-woman.jpg"
              alt={c.whyAlt}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <p className="eyebrow mb-3">{c.whyEyebrow}</p>
            <h2 className="heading-lg">{c.whyTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{c.whyText}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-line bg-white p-5">
                <p className="mb-3 font-bold text-ink/60">{c.dietTitle}</p>
                <ul className="space-y-2 text-[0.9375rem]">
                  {c.dietCons.map((t) => (
                    <li key={t} className="flex gap-2 text-muted">
                      <X className="mt-0.5 size-5 shrink-0 text-accent-500" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-3xl bg-brand-900 p-5 text-white">
                <p className="mb-3 font-bold text-lime-glow">{site.name}</p>
                <ul className="space-y-2 text-[0.9375rem]">
                  {c.ourPros.map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-0.5 size-5 shrink-0 text-lime-glow" aria-hidden /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOE HET WERKT */}
      <section className="bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={c.stepsEyebrow}
            title={c.stepsTitle}
            intro={c.stepsIntro}
          />
          <Steps />
          <div className="mt-10 text-center">
            <Link href="/start" className="btn-primary text-lg">
              {c.answer} <ArrowRight className="size-5" aria-hidden />
            </Link>
            <p className="mt-3 text-sm text-muted">{c.answerNote}</p>
          </div>
        </div>
      </section>

      {/* PRODUCTEN */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading
          eyebrow={c.productsEyebrow}
          title={c.productsTitle}
          intro={c.productsIntro}
        />
        <div className="grid gap-5 md:grid-cols-3">
          {(["voeding", "bundel", "training"] as const).map((id) => {
            const p = productFor(id, l);
            const Icon = id === "voeding" ? Salad : id === "training" ? Dumbbell : Flame;
            return (
              <Link
                key={id}
                href={p.href}
                className={`group card overflow-hidden transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)] ${id === "bundel" ? "ring-2 ring-brand-500" : ""}`}
              >
                <div className="relative aspect-[16/10]">
                  <Image src={p.image} alt="" fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" />
                  {id === "bundel" && (
                    <span className="absolute top-3 left-3 rounded-full bg-lime-glow px-3 py-1 text-xs font-extrabold text-brand-950 uppercase">
                      {c.popular}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="flex items-center gap-2 text-xl font-extrabold">
                    <Icon className="size-5 text-brand-600" aria-hidden /> {p.name}
                  </h3>
                  <p className="mt-2 text-muted">{p.tagline}</p>
                  <span className="mt-4 inline-flex items-center gap-1 font-bold text-brand-700 group-hover:gap-2">
                    {c.moreAbout[id]} <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* WAT JE KRIJGT */}
      <section className="bg-brand-950 py-16 text-white sm:py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 !text-lime-glow">{c.getEyebrow}</p>
            <h2 className="heading-lg text-white">{c.getTitle}</h2>
            <ul className="mt-8 space-y-5">
              {c.getItems.map((item, n) => ({ ...item, icon: getIcons[n] })).map((i) => (
                <li key={i.title} className="flex gap-4">
                  <i.icon className="size-11 shrink-0 rounded-2xl bg-white/10 p-2.5 text-lime-glow" aria-hidden />
                  <div>
                    <h3 className="font-bold">{i.title}</h3>
                    <p className="text-white/70">{i.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/voorbeeld" className="btn-glow mt-10">
              {c.sample} <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="relative col-span-2 aspect-[16/9] overflow-hidden rounded-3xl">
              <Image src="/images/food-flatlay.jpg" alt={c.flatlayAlt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image src="/images/ingredients-board.jpg" alt={c.ingredientsAlt} fill sizes="(min-width: 1024px) 270px, 50vw" className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl">
              <Image src="/images/gym-woman-cable.jpg" alt={c.gymAlt} fill sizes="(min-width: 1024px) 270px, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* VOORDELEN */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeading eyebrow={c.benefitsEyebrow} title={c.benefitsTitle} />
        <Benefits />
      </section>

      {/* OVER 3 MAANDEN: vlak voor de prijzen */}
      <FutureSection topic="afvallen" l={l} href="/start" />

      {/* PRIJZEN */}
      <section id="prijzen" className="scroll-mt-20 bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow={c.pricingEyebrow}
            title={c.pricingTitle}
            intro={c.pricingIntro}
          />
          <PricingTable promo={promo} />
          <div className="mt-12">
            <Guarantee />
          </div>
        </div>
      </section>

      {/* AFBLIJVEN */}
      <section className="container-page py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <p className="eyebrow mb-3">{c.keepEyebrow}</p>
            <h2 className="heading-lg">{c.keepTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{c.keepText}</p>
            <ul className="mt-6 space-y-3">
              {c.keepList.map((t) => (
                <li key={t} className="flex gap-2.5 font-semibold">
                  <Check className="mt-0.5 size-5 shrink-0 text-brand-600" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
            <Image src="/images/running.jpg" alt={c.runningAlt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow={c.faqEyebrow} title={c.faqTitle} />
          <FaqList items={faq} />
          <p className="mt-6 text-center">
            <Link href="/contact#veelgestelde-vragen" className="font-bold text-brand-700 underline underline-offset-2">
              {c.allQuestions}
            </Link>
          </p>
          <FaqJsonLd items={faq} />
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
