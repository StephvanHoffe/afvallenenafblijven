import type { Metadata } from "next";
import Image from "next/image";
import { ArrowDown, ArrowRight, Check, Dumbbell, Flame, Scale, Target, TrendingDown, X } from "lucide-react";
import { BlackFridayDeal, BlackFridayStrip, bfCopy, bfGlow } from "@/components/campaign/BlackFriday";
import { StoryChart, storyCopy } from "@/components/campaign/Story";
import { FutureSection } from "@/components/conversion";
import { FaqList, Guarantee, SectionHeading, TrustRow } from "@/components/marketing";
import { Countdown } from "@/components/promo/Countdown";
import { PricingTable } from "@/components/pricing/PricingTable";
import { promotionSummary, site } from "@/config/site";
import { resultDisclaimer } from "@/content/disclaimers";
import { faqInOrder } from "@/content/faq";
import { landingCopy, variantSettings, type LandingVariant } from "@/content/landing";
import { painCopy, painLabels } from "@/content/pains";
import { samplePlansFor } from "@/content/sample-plans";
import Link from "@/i18n/Link";
import { intakeLabels } from "@/i18n/options";
import { getLocale } from "@/i18n/server";
import { formatNumber } from "@/lib/format";
import type { Intake } from "@/lib/intake";
import { currentPromotion } from "@/lib/promotion";

const goalIcons: Record<Intake["goal"], typeof Target> = {
  afvallen: TrendingDown,
  afvallen_strakker: Flame,
  afblijven: Scale,
  sterker: Dumbbell,
};

/** Adres van de vragenlijst, met het doel en (per variant) het plan al ingevuld. */
function startHref(variant: LandingVariant, goal?: Intake["goal"]): string {
  const params = new URLSearchParams();
  if (goal) params.set("doel", goal);
  const product = variantSettings[variant].product;
  if (product) params.set("plan", product);
  const q = params.toString();
  return q ? `/start?${q}` : "/start";
}

/** "Maandag begin je. Alweer.": de laatste zin krijgt de accentkleur. */
function accentLastSentence(title: string): [string, string] {
  const i = title.lastIndexOf(". ", title.length - 2);
  return i === -1 ? [title, ""] : [title.slice(0, i + 2), title.slice(i + 2)];
}

export async function landingMetadata(variant: LandingVariant): Promise<Metadata> {
  const l = await getLocale();
  const v = landingCopy[l].variants[variant];
  // Campagnepagina's horen niet in zoekmachines: de gewone pagina's zijn daarvoor.
  return { title: v.metaTitle, description: v.metaDescription, robots: { index: false, follow: true } };
}

/**
 * De landingspagina voor bezoekers uit een online campagne, als één verhaal:
 * bovenaan de pijn (herkenning en het patroon dat iedereen kent), dan de
 * omslag ("het ligt niet aan jou"), de oplossing, hoe het eruitziet, waar je
 * over 3 maanden staat, het aanbod en tot slot één duidelijke keuze. Elke
 * stap leidt naar de volgende; de zwevende startknop is er voor wie al
 * overtuigd is. Tijdens Black Friday komt de actie erbij als accent.
 */
export async function CampaignLanding({ variant }: { variant: LandingVariant }) {
  const l = await getLocale();
  const c = landingCopy[l].shared;
  const v = landingCopy[l].variants[variant];
  const s = storyCopy[l];
  const pain = painCopy[l][variant];
  const pl = painLabels[l];
  const settings = variantSettings[variant];
  const labels = intakeLabels(l);
  const promo = await currentPromotion(l);
  const bf = promo?.theme === "blackfriday" ? promo : null;
  const samples = samplePlansFor(l);
  const day = samples.sampleNutritionPlan.days[0];
  const targets = samples.sampleTargets;
  const workout = samples.sampleTrainingPlan.workouts[0];
  const heroMeal = day.meals.find((m) => /lunch/i.test(m.moment)) ?? day.meals[0];
  const mainHref = startHref(variant);
  const n = (x: number) => formatNumber(x, 0, l);
  const [titleStart, titleAccent] = accentLastSentence(pain.painTitle);

  return (
    <>
      {/* 1. DE PIJN: herkenning, en het patroon dat iedereen kent */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[46rem] bg-gradient-to-b from-sand to-cream" />
        <div className="container-page grid items-center gap-10 pt-10 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-16 lg:pb-20">
          <div className="min-w-0">
            {bf ? (
              <div className="mb-6">
                <BlackFridayStrip promo={bf} l={l} />
              </div>
            ) : (
              <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800">
                <span className="size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                {promo ? c.launchBadge(promo.label, promotionSummary(promo.percentOff, promo.months, l), promo.endsLabel) : c.badge}
              </p>
            )}
            <p className="eyebrow mb-3 !text-accent-600">{pl.painsEyebrow}</p>
            <h1 className="heading-xl">
              {titleStart}
              {titleAccent && <span className="text-accent-500">{titleAccent}</span>}
            </h1>
            <ul className="mt-7 space-y-3.5">
              {pain.painPoints.slice(0, 3).map((point) => (
                <li key={point} className="flex gap-3 text-lg leading-relaxed text-ink/85">
                  <X className="mt-1 size-5 shrink-0 text-accent-500" aria-hidden />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#oplossing" className="btn-primary text-lg">
                {s.heroCta} <ArrowDown className="size-5" aria-hidden />
              </a>
              <Link href={mainHref} data-lp-cta="hero" className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
                {s.heroOr} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <StoryChart kind="pain" variant={variant} l={l} />
        </div>
      </section>

      {/* 2. DE OMSLAG: het ligt niet aan jou */}
      <section id="oplossing" className="scroll-mt-16 bg-white">
        <div className="container-page max-w-3xl py-16 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-lime-glow text-brand-950" aria-hidden>
            <ArrowDown className="size-6" />
          </span>
          <h2 className="heading-lg mt-6">{pain.reframe.title}</h2>
          <p className="mt-4 text-lg leading-relaxed text-muted">{pain.reframe.text}</p>
        </div>
      </section>

      {/* 3. DE OPLOSSING: hetzelfde beeld, maar dan zoals het wél werkt */}
      <section className="bg-white pb-20">
        <div className="container-page grid items-center gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div className="order-2 min-w-0 lg:order-1">
            <StoryChart kind="fix" variant={variant} l={l} />
          </div>
          <div className="order-1 lg:order-2">
            <p className="eyebrow mb-3">{s.solutionEyebrow}</p>
            <h2 className="heading-lg">{pl.fixTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-muted">{s.solutionIntro[variant]}</p>
            <ul className="mt-7 space-y-4">
              {pain.fixes.map((f) => (
                <li key={f.pain} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                    <Check className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-bold">{f.answer}</span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {pl.fixLabels[0]}: {f.pain}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. ZO ZIET HET ERUIT: het echte plan */}
      <section className="bg-sand py-16">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
          <div className="relative mx-auto w-full max-w-xl">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)]">
              <Image src={settings.image.src} alt={v.heroAlt} fill sizes="(min-width: 1024px) 560px, 100vw" className={`object-cover ${settings.image.position}`} />
            </div>
            {variant === "training" ? (
              <>
                <div className="absolute -top-4 -right-2 rounded-3xl bg-brand-900 p-4 text-white shadow-[var(--shadow-lift)] sm:-right-6">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    <Dumbbell className="size-3.5 text-lime-glow" aria-hidden /> {c.minutes(workout.minutes)}
                  </p>
                  <p className="max-w-[11rem] text-base leading-snug font-extrabold">{workout.name}</p>
                </div>
                <div className="absolute -bottom-6 -left-3 w-[15.5rem] rounded-3xl bg-white p-4 shadow-[var(--shadow-lift)] sm:-left-8">
                  <p className="text-xs font-bold text-brand-600 uppercase">{workout.exercises[0].muscleGroups}</p>
                  <p className="text-sm leading-snug font-bold">{workout.exercises[0].name}</p>
                  <div className="mt-3 flex gap-1.5 text-[0.6875rem] font-bold">
                    <span className="rounded-full bg-sand px-2 py-1">{c.setsReps(workout.exercises[0].sets, workout.exercises[0].reps)}</span>
                    <span className="rounded-full bg-sand px-2 py-1">{c.rest(workout.exercises[0].restSeconds)}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="absolute -top-4 -right-2 rounded-3xl bg-brand-900 p-4 text-white shadow-[var(--shadow-lift)] sm:-right-6">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    <Flame className="size-3.5 text-lime-glow" aria-hidden /> {c.previewTargets}
                  </p>
                  <p className="text-2xl font-extrabold">
                    {n(targets.calories)} {c.kcal}
                  </p>
                  <p className="text-xs text-white/70">
                    {n(targets.proteinG)} g {c.protein}
                  </p>
                </div>
                <div className="absolute -bottom-6 -left-3 w-[15.5rem] rounded-3xl bg-white p-4 shadow-[var(--shadow-lift)] sm:-left-8">
                  <p className="text-xs font-bold text-brand-600 uppercase">
                    {heroMeal.moment} · {c.minutes(heroMeal.prepMinutes)}
                  </p>
                  <p className="text-sm leading-snug font-bold">{heroMeal.name}</p>
                  <div className="mt-3 flex gap-1.5 text-[0.6875rem] font-bold">
                    <span className="rounded-full bg-sand px-2 py-1">
                      {n(heroMeal.kcal)} {c.kcal}
                    </span>
                    <span className="rounded-full bg-sand px-2 py-1">
                      {n(heroMeal.proteinG)} g {c.protein}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <div>
            <p className="eyebrow mb-3">{s.proofEyebrow}</p>
            <h2 className="heading-lg">{s.proofTitle}</h2>
            <ul className="mt-7 space-y-5">
              {v.gets.map((g) => (
                <li key={g.title} className="flex gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-600 text-white">
                    <Check className="size-4" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-bold">{g.title}</span>
                    <span className="block text-muted">{g.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href="/voorbeeld" className="mt-8 inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
              {c.previewFull} <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. OVER 3 MAANDEN: zo blijven, of vandaag beginnen */}
      <FutureSection topic={variant} l={l} href={mainHref} cta="toekomst" />

      {/* 6. HET AANBOD */}
      <section id="prijzen" className="container-page scroll-mt-20 pb-16">
        {bf ? (
          <div className="mb-12">
            <BlackFridayDeal promo={bf} l={l} />
          </div>
        ) : (
          <SectionHeading eyebrow={c.pricingEyebrow} title={c.pricingTitle} intro={c.pricingIntro} />
        )}
        <PricingTable promo={promo} only={settings.pricing.only} highlight={settings.pricing.highlight} hidePromoBanner={Boolean(bf)} />
        <div className="mt-12">
          <Guarantee />
        </div>
      </section>

      {/* 7. NOG TWIJFELS: alleen de vragen die het meest tegenhouden */}
      <section className="container-page pb-6">
        <SectionHeading eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <FaqList items={faqInOrder(l, settings.faq).slice(0, 5)} />
      </section>

      {/* 8. DE KEUZE: terug naar het begin ("maandag begin je, alweer") en meteen een eerste stap */}
      <section className="container-page py-16">
        <div className={`rounded-[2rem] px-5 py-12 text-white sm:px-12 ${bf ? "ring-1 ring-lime-glow/25" : "bg-brand-900"}`} style={bf ? bfGlow : undefined}>
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow !text-lime-glow">{bf ? `${bfCopy[l].label} · ${bfCopy[l].until(bf.endsLabel)}` : s.closeEyebrow}</p>
            <h2 className="heading-lg mt-3 text-white">{v.finalTitle}</h2>
            <p className="mt-4 text-lg text-white/80">
              {v.finalText}
              {site.guarantee.enabled ? c.finalRisk(site.guarantee.days) : ""}
            </p>
            {bf && <Countdown endsAt={bf.endsAt} className="mt-7 justify-center" />}
            <p className="mt-9 text-lg font-extrabold">{c.pickTitle}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left lg:grid-cols-4">
              {settings.goals.map((goal) => {
                const Icon = goalIcons[goal];
                return (
                  <Link
                    key={goal}
                    href={startHref(variant, goal)}
                    data-lp-cta="doel"
                    className="group flex min-h-24 flex-col justify-between gap-3 rounded-2xl bg-white p-4 text-ink transition hover:-translate-y-0.5 hover:ring-4 hover:ring-lime-glow focus-visible:ring-4 focus-visible:ring-lime-glow focus-visible:outline-none"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="flex items-end justify-between gap-2 leading-tight font-bold">
                      {labels.goal[goal].label}
                      <ArrowRight className="size-4 shrink-0 text-brand-600 transition group-hover:translate-x-0.5" aria-hidden />
                    </span>
                  </Link>
                );
              })}
            </div>
            <ol className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-semibold text-white/80">
              {s.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded-full bg-white/15 text-xs font-extrabold text-lime-glow">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
            <div className="mt-6 flex justify-center">
              <TrustRow light />
            </div>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-muted">{resultDisclaimer[l].short}</p>
      </section>
    </>
  );
}
