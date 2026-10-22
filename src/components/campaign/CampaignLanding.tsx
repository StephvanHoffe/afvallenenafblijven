import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChefHat,
  Dumbbell,
  Flame,
  House,
  LineChart,
  ListChecks,
  Minus,
  RefreshCw,
  Scale,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Target,
  TrendingDown,
  TrendingUp,
  Watch,
} from "lucide-react";
import { FixSection, FutureSection, PainSection } from "@/components/conversion";
import { CtaBanner, FaqList, Guarantee, SectionHeading, Steps, TrustRow } from "@/components/marketing";
import { resultDisclaimer } from "@/content/disclaimers";
import { PricingTable } from "@/components/pricing/PricingTable";
import { BlackFridayFinal, BlackFridayMarquee, BlackFridayOffer, bfCopy, promoPercent } from "@/components/campaign/BlackFriday";
import { WeightChartFor } from "@/components/account/tabs/OverviewTab";
import { lowestMonthlyPrice, monthlyPrice, SUBSCRIPTION_DURATIONS, type ProductId } from "@/config/pricing";
import { promotionSummary, site } from "@/config/site";
import { demoAccountViewFor } from "@/content/demo-account";
import { faqInOrder } from "@/content/faq";
import { landingCopy, variantSettings, type LandingVariant } from "@/content/landing";
import { samplePlansFor } from "@/content/sample-plans";
import type { Locale } from "@/i18n/config";
import Link from "@/i18n/Link";
import { intakeLabels } from "@/i18n/options";
import { getLocale } from "@/i18n/server";
import { euro, formatNumber } from "@/lib/format";
import { isHealthEnabled } from "@/lib/health/config";
import type { Intake } from "@/lib/intake";
import { currentPromotion } from "@/lib/promotion";
import { buildProgress } from "@/lib/progress";

const goalIcons: Record<Intake["goal"], typeof Target> = {
  afvallen: TrendingDown,
  afvallen_strakker: Flame,
  afblijven: Scale,
  sterker: Dumbbell,
};

const getIcons: Record<LandingVariant, (typeof Target)[]> = {
  afvallen: [Target, ChefHat, Dumbbell, SlidersHorizontal],
  voeding: [Target, ChefHat, ShoppingCart, RefreshCw],
  training: [House, TrendingUp, ListChecks, SlidersHorizontal],
};

const guideIcons = [Scale, CalendarDays, LineChart];

/** Adres van de vragenlijst, met het doel en (per variant) het plan al ingevuld. */
function startHref(variant: LandingVariant, goal?: Intake["goal"]): string {
  const params = new URLSearchParams();
  if (goal) params.set("doel", goal);
  const product = variantSettings[variant].product;
  if (product) params.set("plan", product);
  const q = params.toString();
  return q ? `/start?${q}` : "/start";
}

/** Laagste maandprijs voor de producten van deze variant. */
function fromPrice(variant: LandingVariant): number {
  const product = variantSettings[variant].product;
  if (!product) return lowestMonthlyPrice();
  return Math.min(...SUBSCRIPTION_DURATIONS.map((d) => monthlyPrice(product as ProductId, d)));
}

export async function landingMetadata(variant: LandingVariant): Promise<Metadata> {
  const l = await getLocale();
  const v = landingCopy[l].variants[variant];
  // Campagnepagina's horen niet in zoekmachines: de gewone pagina's zijn daarvoor.
  return { title: v.metaTitle, description: v.metaDescription, robots: { index: false, follow: true } };
}

function Value({ value, l }: { value: string | boolean; l: Locale }) {
  if (value === true) {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-brand-600 text-white">
        <Check className="size-4" aria-hidden />
        <span className="sr-only">{l === "en" ? "Yes" : "Ja"}</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex size-7 items-center justify-center rounded-full bg-sand text-muted">
        <Minus className="size-4" aria-hidden />
        <span className="sr-only">{l === "en" ? "No" : "Nee"}</span>
      </span>
    );
  }
  return <span className="text-sm font-semibold">{value}</span>;
}

/** De landingspagina voor bezoekers uit een online campagne. */
export async function CampaignLanding({ variant }: { variant: LandingVariant }) {
  const l = await getLocale();
  const c = landingCopy[l].shared;
  const v = landingCopy[l].variants[variant];
  const settings = variantSettings[variant];
  const labels = intakeLabels(l);
  const promo = await currentPromotion(l);
  const samples = samplePlansFor(l);
  const day = samples.sampleNutritionPlan.days[0];
  const targets = samples.sampleTargets;
  const workout = samples.sampleTrainingPlan.workouts[0];
  const heroMeal = day.meals.find((m) => /lunch/i.test(m.moment)) ?? day.meals[0];
  const progress = buildProgress(demoAccountViewFor(l), l);
  const health = isHealthEnabled();
  const mainHref = startHref(variant);
  const n = (x: number) => formatNumber(x, 0, l);
  const price = fromPrice(variant);
  // Zolang een Black Friday-actie loopt, krijgt de pagina het Black Friday-thema.
  const bf = promo?.theme === "blackfriday" ? promo : null;
  const bfc = bfCopy[l];

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-gradient-to-b from-brand-50 to-cream" />
        <div className="container-page grid items-center gap-10 pt-8 pb-14 lg:grid-cols-[1.05fr_1fr] lg:gap-12 lg:pt-14 lg:pb-20">
          <div className="min-w-0">
            {bf ? (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-lime-glow/40 bg-black px-3.5 py-1.5 text-sm font-bold tracking-wide text-lime-glow uppercase">
                <span className="size-2 shrink-0 animate-pulse rounded-full bg-accent-400 motion-reduce:animate-none" aria-hidden />
                {bfc.badge(bf.endsLabel)}
              </p>
            ) : (
              <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-800">
                <span className="size-2 shrink-0 rounded-full bg-brand-500" aria-hidden />
                {promo
                  ? c.launchBadge(promo.label, promotionSummary(promo.percentOff, promo.months, l), promo.endsLabel)
                  : c.badge}
              </p>
            )}
            <h1 className="heading-xl">
              {v.title[0]}
              <span className="text-brand-600">{v.title[1]}</span>
              {v.title[2]}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{v.intro}</p>
            {bf && <BlackFridayOffer promo={bf} l={l} href={mainHref} fromPrice={price} />}

            <div className="mt-7 max-w-xl rounded-[var(--radius-card)] border border-line bg-white p-4 shadow-[var(--shadow-lift)] sm:p-5">
              <p className="text-lg font-extrabold">{c.pickTitle}</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                {settings.goals.map((goal) => {
                  const Icon = goalIcons[goal];
                  return (
                    <Link
                      key={goal}
                      href={startHref(variant, goal)}
                      data-lp-cta="doel"
                      className="group flex min-h-16 flex-col items-start gap-2 rounded-2xl border border-line bg-cream p-3 text-left transition hover:border-brand-500 hover:bg-brand-50 focus-visible:ring-4 focus-visible:ring-brand-100 focus-visible:outline-none sm:flex-row sm:items-center sm:gap-3"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white sm:size-10">
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span className="min-w-0 text-[0.9375rem] leading-tight font-bold">{labels.goal[goal].label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <p className="max-w-sm text-xs leading-relaxed text-muted">{c.pickNote}</p>
                <Link href={mainHref} data-lp-cta="hero" className="inline-flex items-center gap-1 text-sm font-bold text-brand-700 hover:underline">
                  {c.orStart} <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            </div>

            {!bf && (
              <p className="mt-5 text-[0.9375rem] font-semibold text-ink/80">
                <span className="text-brand-700">{c.priceFrom(euro(price, l), euro(Math.round((price * 12) / 52), l))}</span> · {c.priceNote}
              </p>
            )}
            <div className="mt-5">
              <TrustRow />
            </div>
            <p className="mt-3 text-xs text-muted">{resultDisclaimer[l].short}</p>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            {bf && (
              <div className="absolute -top-5 -left-2 z-10 grid size-24 -rotate-12 place-items-center rounded-full bg-lime-glow text-center text-brand-950 shadow-[0_12px_32px_-8px_rgb(200_241_105/0.7)] ring-4 ring-black sm:-left-6 sm:size-32">
                <span>
                  <span className="block text-2xl leading-none font-black sm:text-4xl">−{promoPercent(bf)}%</span>
                  <span className="block text-[0.6875rem] font-extrabold tracking-wide uppercase sm:text-xs">{bfc.sticker}</span>
                </span>
              </div>
            )}
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-[var(--shadow-lift)] sm:aspect-square">
              <Image
                src={settings.image.src}
                alt={v.heroAlt}
                fill
                preload
                sizes="(min-width: 1024px) 560px, 100vw"
                className={`object-cover ${settings.image.position}`}
              />
            </div>
            {variant === "training" ? (
              <>
                <div className="absolute -top-4 -right-2 rounded-3xl bg-brand-900 p-4 text-white shadow-[var(--shadow-lift)] sm:-right-6">
                  <p className="flex items-center gap-1.5 text-xs font-semibold text-white/70">
                    <Dumbbell className="size-3.5 text-lime-glow" aria-hidden /> {c.minutes(workout.minutes)}
                  </p>
                  <p className="max-w-[11rem] text-base leading-snug font-extrabold">{workout.name}</p>
                </div>
                <div className="absolute -bottom-6 -left-3 w-[15.5rem] rounded-3xl bg-white p-4 shadow-[var(--shadow-lift)] sm:-left-10">
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
                <div className="absolute -bottom-6 -left-3 w-[15.5rem] rounded-3xl bg-white p-4 shadow-[var(--shadow-lift)] sm:-left-10">
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
        </div>
      </section>

      {bf && <BlackFridayMarquee promo={bf} l={l} />}

      {/* HERKEN JE DIT? Eerst het probleem, dan wat het kost, dan de uitweg. */}
      <PainSection topic={variant} l={l} href={mainHref} cta="pijn" />
      <FixSection topic={variant} l={l} />

      {/* WAT JE KRIJGT */}
      <section className="bg-sand py-14">
        <div className="container-page">
          <SectionHeading eyebrow={c.getsEyebrow} title={c.getsTitle} />
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {v.gets.map((g, i) => {
              const Icon = getIcons[variant][i] ?? Target;
              return (
                <li key={g.title} className="card p-4 sm:p-5">
                  <Icon className="size-9 rounded-xl bg-brand-50 p-2 text-brand-600 sm:size-10" aria-hidden />
                  <h3 className="mt-3 leading-snug font-bold sm:mt-4">{g.title}</h3>
                  <p className="mt-1 text-sm text-muted sm:text-[0.9375rem]">{g.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* VOORBEELD */}
      <section className="container-page py-16">
        <SectionHeading eyebrow={c.previewEyebrow} title={c.previewTitle} intro={c.previewIntro} />
        <div className="grid gap-6 lg:grid-cols-2">
          {settings.preview.includes("voeding") && (
            <div className="card min-w-0 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <ChefHat className="size-5 text-brand-600" aria-hidden /> {c.previewDay(day.day)}
              </h3>
              <ul className="mt-4 divide-y divide-line">
                {day.meals.map((m) => (
                  <li key={m.moment + m.name} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-xs font-bold tracking-wide text-brand-600 uppercase">
                        {m.moment} · {c.minutes(m.prepMinutes)}
                      </p>
                      <p className="font-semibold break-words">{m.name}</p>
                    </div>
                    <p className="shrink-0 text-right text-sm tabular-nums">
                      <span className="font-bold">
                        {n(m.kcal)} {c.kcal}
                      </span>
                      <span className="block text-muted">
                        {n(m.proteinG)} g {c.protein}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {settings.preview.includes("training") ? (
            <div className="card min-w-0 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <Dumbbell className="size-5 text-brand-600" aria-hidden /> {c.previewWorkout(workout.name)}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {workout.focus} · {c.minutes(workout.minutes)}
              </p>
              <ol className="mt-4 divide-y divide-line">
                {workout.exercises.slice(0, 5).map((e, i) => (
                  <li key={e.name} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-bold text-brand-700">{i + 1}</span>
                      <span className="min-w-0 font-semibold break-words">{e.name}</span>
                    </span>
                    <span className="shrink-0 text-right text-sm tabular-nums">
                      <span className="font-bold">{c.setsReps(e.sets, e.reps)}</span>
                      <span className="block text-muted">{c.rest(e.restSeconds)}</span>
                    </span>
                  </li>
                ))}
              </ol>
              {settings.preview.length === 1 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="text-sm font-bold">{c.previewWeek}</p>
                  <ul className="mt-2 grid grid-cols-7 gap-1 text-center text-[0.6875rem]">
                    {samples.sampleTrainingPlan.weekSchedule.map((d) => {
                      const train = /training|workout/i.test(d.activity);
                      return (
                        <li key={d.day} className={`rounded-lg px-0.5 py-2 ${train ? "bg-brand-600 text-white" : "bg-sand text-muted"}`} title={d.activity}>
                          <span className="block font-bold">{d.day.slice(0, 2)}</span>
                          <span className="sr-only">{d.activity}</span>
                          {train ? <Dumbbell className="mx-auto mt-1 size-3.5" aria-hidden /> : <span className="mt-1 block" aria-hidden>·</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="card min-w-0 p-5 sm:p-6">
              <h3 className="flex items-center gap-2 text-lg font-extrabold">
                <Target className="size-5 text-brand-600" aria-hidden /> {c.previewTargets}
              </h3>
              <dl className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { k: c.kcal, v: n(targets.calories) },
                  { k: `g ${c.protein}`, v: n(targets.proteinG) },
                  { k: `g ${c.carbs}`, v: n(targets.carbsG) },
                  { k: `g ${c.fat}`, v: n(targets.fatG) },
                ].map((x) => (
                  <div key={x.k} className="rounded-2xl bg-sand p-4">
                    <dt className="text-sm text-muted">{x.k}</dt>
                    <dd className="text-2xl font-extrabold tabular-nums">{x.v}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm text-muted">{c.previewTargetsNote}</p>
              <p className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-sm font-semibold">
                <ShoppingCart className="size-4 text-brand-600" aria-hidden />
                {samples.sampleNutritionPlan.shoppingList.map((g) => g.category).join(" · ")}
              </p>
            </div>
          )}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/voorbeeld" className="btn-secondary">
            {c.previewFull}
          </Link>
          <Link href="/voorbeeld/mijn-schemas" className="btn-secondary">
            {c.previewAccount}
          </Link>
        </div>
      </section>

      {/* BEGELEIDING */}
      <section className="bg-brand-950 py-16 text-white">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow mb-3 !text-lime-glow">{c.guideEyebrow}</p>
            <h2 className="heading-lg text-white">{c.guideTitle}</h2>
            <p className="mt-4 text-lg leading-relaxed text-white/75">{c.guideIntro}</p>
            <ul className="mt-8 space-y-5">
              {[...c.guidePoints, ...(health ? [c.guideHealth] : [])].map((p, i) => {
                const Icon = guideIcons[i] ?? Watch;
                return (
                  <li key={p.title} className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-lime-glow">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-bold">{p.title}</span>
                      <span className="mt-0.5 block text-[0.9375rem] text-white/70">{p.text}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="min-w-0 rounded-[var(--radius-card)] bg-white p-5 text-ink sm:p-6">
            <p className="font-extrabold">{c.guideChart}</p>
            <p className="mb-4 text-sm text-muted">{c.guideChartNote}</p>
            <WeightChartFor progress={progress} l={l} compact />
          </div>
        </div>
      </section>

      {/* ZO WERKT HET */}
      <section className="container-page py-16">
        <SectionHeading eyebrow={c.stepsEyebrow} title={c.stepsTitle} />
        <Steps />
        <div className="mt-10 flex justify-center">
          <Link href={mainHref} data-lp-cta="stappen" className="btn-primary text-lg">
            {v.ctaLabel} <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>

      {/* VERGELIJKING */}
      <section className="bg-sand py-16">
        <div className="container-page">
          <SectionHeading eyebrow={c.compareEyebrow} title={c.compareTitle} />
          <div className="relative mx-auto max-w-4xl overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
            <table className="w-full text-left text-sm sm:min-w-[34rem] sm:text-[0.9375rem]">
              <thead>
                <tr className="border-b border-line">
                  <th className="px-3 py-4 sm:px-4">
                    <span className="sr-only">{l === "en" ? "Comparison" : "Vergelijking"}</span>
                  </th>
                  {c.compareCols.map((col, i) => (
                    <th
                      key={col}
                      className={`px-3 py-4 text-center text-xs font-extrabold sm:px-4 sm:text-sm ${i === 0 ? "bg-brand-50 text-brand-800" : "text-muted"} ${i === 2 ? "hidden sm:table-cell" : ""}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {c.compareRows.map((row, ri) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-3 py-3.5 font-semibold sm:px-4">
                      {row.label}
                    </th>
                    {row.values.map((val, i) => (
                      <td key={i} className={`px-3 py-3.5 text-center sm:px-4 ${i === 0 ? "bg-brand-50" : ""} ${i === 2 ? "hidden sm:table-cell" : ""}`}>
                        {ri === c.compareRows.length - 1 && i === 0 ? (
                          <span className="text-sm font-extrabold text-brand-800">{c.compareFrom(euro(price, l))}</span>
                        ) : (
                          <Value value={val} l={l} />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* OVER 3 MAANDEN: vlak voor de prijzen */}
      <FutureSection topic={variant} l={l} href={mainHref} cta="toekomst" />

      {/* PRIJZEN */}
      <section id="prijzen" className="container-page scroll-mt-20 py-16">
        {bf ? (
          <SectionHeading eyebrow={bfc.pricingEyebrow} title={bfc.pricingTitle(promoPercent(bf), bf.months)} intro={bfc.pricingIntro} />
        ) : (
          <SectionHeading eyebrow={c.pricingEyebrow} title={c.pricingTitle} intro={c.pricingIntro} />
        )}
        <PricingTable promo={promo} only={settings.pricing.only} highlight={settings.pricing.highlight} />
        <div className="mt-12 space-y-6">
          <Guarantee />
          <div className="mx-auto flex max-w-3xl gap-4 rounded-[var(--radius-card)] bg-sand p-6">
            <ShieldCheck className="mt-0.5 size-7 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h3 className="font-extrabold">{c.safeTitle}</h3>
              <p className="mt-1 text-[0.9375rem] text-muted">{c.safeText}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container-page pb-6">
        <SectionHeading eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <FaqList items={faqInOrder(l, settings.faq)} />
      </section>

      {bf ? (
        <BlackFridayFinal promo={bf} l={l} href={mainHref} />
      ) : (
        <CtaBanner
          title={v.finalTitle}
          text={v.finalText + (site.guarantee.enabled ? c.finalRisk(site.guarantee.days) : "")}
          href={mainHref}
          label={v.ctaLabel}
        />
      )}
    </>
  );
}
