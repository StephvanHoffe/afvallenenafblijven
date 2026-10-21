import type { Metadata } from "next";
import { CalendarDays, Check, Minus, PiggyBank, RefreshCw } from "lucide-react";
import { CtaBanner, FaqJsonLd, FaqList, Guarantee, SectionHeading } from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import { faqInOrder } from "@/content/faq";
import {
  SUBSCRIPTION_DURATIONS,
  durationFor,
  durations,
  monthlyPrice,
  commitmentTotal,
  lowestMonthlyPrice,
  maxSavingsPercent,
  productFor,
  type ProductId,
} from "@/config/pricing";
import { site } from "@/config/site";
import { defineCopy, type Locale } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { euro } from "@/lib/format";
import { launchOfferActive } from "@/lib/launch";

const comparison: { label: Record<Locale, string>; voeding: boolean; training: boolean }[] = [
  { label: { nl: "Persoonlijk calorie- en macrodoel", en: "Personal calorie and macro targets" }, voeding: true, training: false },
  { label: { nl: "7-daags weekmenu met recepten", en: "7-day weekly meal plan with recipes" }, voeding: true, training: false },
  { label: { nl: "Boodschappenlijst per week", en: "Weekly shopping list" }, voeding: true, training: false },
  {
    label: { nl: "Rekening met allergieën en eetpatroon", en: "Takes allergies and dietary preferences into account" },
    voeding: true,
    training: false,
  },
  { label: { nl: "Trainingsschema thuis of sportschool", en: "Workout plan for home or the gym" }, voeding: false, training: true },
  {
    label: { nl: "4 weken progressie met uitleg per oefening", en: "4 weeks of progression with instructions for every exercise" },
    voeding: false,
    training: true,
  },
  { label: { nl: "Rekening met blessures en niveau", en: "Takes injuries and level into account" }, voeding: false, training: true },
  { label: { nl: "Elke 4 weken een nieuw schema", en: "A new plan every 4 weeks" }, voeding: true, training: true },
  { label: { nl: "Wekelijks weegmoment en bijsturen", en: "Weekly weigh-in and adjustments" }, voeding: true, training: true },
  { label: { nl: "Check-in en bijsturen", en: "Check-in and adjustments" }, voeding: true, training: true },
  {
    label: { nl: "Downloaden als PDF, met logboek of boodschappenlijst", en: "Download as PDF, with training log or shopping list" },
    voeding: true,
    training: true,
  },
];

const copy = defineCopy({
  nl: {
    metaTitle: "Prijzen & abonnementen",
    metaDescription:
      "Bekijk de prijzen van ons persoonlijke voedingsschema, trainingsschema en de voordelige bundel. Per maand of voordeliger voor 3, 6 of 12 maanden.",
    eyebrow: "Prijzen & abonnementen",
    title: "Persoonlijke begeleiding, zonder de prijs van een personal trainer",
    intro: (percent: number) =>
      `Een diëtist of personal trainer kost al snel tientallen euro's per afspraak. Bij ons krijg je een persoonlijk schema dat elke week wordt bijgestuurd, voor een vast bedrag per maand. Kies je een langere minimale looptijd, dan bespaar je tot ${percent}% per maand.`,
    whyTitle: "Waarom 3 maanden of langer?",
    why: (percent: number, from: string, perWeek: string) => [
      {
        title: "Tijd om gewoontes op te bouwen",
        text: "Eén schema van 4 weken is een begin. Met een abonnement krijg je elke 4 weken een nieuw schema, bijgestuurd op je voortgang, zodat je kunt blijven bijsturen.",
      },
      {
        title: "Lagere maandprijs",
        text: `Tot ${percent}% voordeliger dan per maand. Al vanaf ${from} per maand, ofwel ${perWeek} per week.`,
      },
      {
        title: "Daarna gewoon opzegbaar",
        text: "Na de minimale looptijd zeg je maandelijks op, online in een paar klikken. Je houdt al je schema's.",
      },
    ],
    compareTitle: "Wat zit er in elk plan?",
    included: "Inbegrepen",
    yes: "Ja",
    no: "Nee",
    allPricesTitle: "Alle prijzen op een rij",
    allPricesIntro:
      "Alle bedragen zijn per maand en inclusief 21% btw. Abonnementen worden maandelijks afgeschreven via SEPA-incasso. Na de minimale looptijd loopt je abonnement door tegen dezelfde maandprijs en is het maandelijks opzegbaar.",
    minimumTerm: "Minimale looptijd",
    perMonth: "p/m",
    minimum: (term: string, total: string) => `minimaal ${term} (samen ${total})`,
    oneOffRow: "Los schema (eenmalig, 4 weken)",
    noSubscription: "geen abonnement",
    faqEyebrow: "Vragen over betalen",
    faqTitle: "Duidelijk en eerlijk",
  },
  en: {
    metaTitle: "Pricing & subscriptions",
    metaDescription:
      "See the prices of our personal nutrition plan, workout plan and the money-saving bundle. Pay monthly, or save with 3, 6 or 12 months.",
    eyebrow: "Pricing & subscriptions",
    title: "Personal guidance, without the personal trainer price tag",
    intro: (percent: number) =>
      `A dietitian or personal trainer easily costs tens of euros per session. With us, you get a personal plan that's adjusted every week, for a fixed monthly amount. Pick a longer minimum term and save up to ${percent}% a month.`,
    whyTitle: "Why 3 months or longer?",
    why: (percent: number, from: string, perWeek: string) => [
      {
        title: "Time to build habits",
        text: "One 4-week plan is a start. With a subscription, you get a new plan every 4 weeks, fine-tuned to your progress, so you can keep adjusting.",
      },
      {
        title: "A lower monthly price",
        text: `Up to ${percent}% cheaper than monthly. From just ${from} a month, or ${perWeek} a week.`,
      },
      {
        title: "Easy to cancel afterwards",
        text: "After the minimum term, you cancel monthly, online in a few clicks. You keep all your plans.",
      },
    ],
    compareTitle: "What's included in each plan?",
    included: "Included",
    yes: "Yes",
    no: "No",
    allPricesTitle: "All prices at a glance",
    allPricesIntro:
      "All amounts are per month and include 21% VAT. Subscriptions are billed monthly by SEPA Direct Debit. After the minimum term, your subscription continues at the same monthly price and can be cancelled monthly.",
    minimumTerm: "Minimum term",
    perMonth: "a month",
    minimum: (term: string, total: string) => `minimum ${term} (${total} in total)`,
    oneOffRow: "One-off plan (single payment, 4 weeks)",
    noSubscription: "no subscription",
    faqEyebrow: "Questions about payment",
    faqTitle: "Clear and fair",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: c.metaTitle, description: c.metaDescription, alternates: alternates(l, "/prijzen") };
}

export default async function PrijzenPage() {
  const launch = { active: await launchOfferActive(), percentOff: site.launchOffer.percentOff };
  const l = await getLocale();
  const c = copy[l];
  const ids: ProductId[] = ["voeding", "training", "bundel"];
  // De twijfels die het afsluiten tegenhouden eerst.
  const faq = faqInOrder(l, ["opzeggen", "garantie", "abonnement", "betalen", "resultaat"]);
  const from = lowestMonthlyPrice();
  const why = c.why(maxSavingsPercent(), euro(from, l), euro(Math.round((from * 12) / 52), l));
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-sand py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            as="h1"
            eyebrow={c.eyebrow}
            title={c.title}
            intro={c.intro(maxSavingsPercent())}
          />
          <PricingTable launch={launch} />
          <div className="mx-auto mt-14 max-w-5xl">
            <h2 className="heading-md text-center">{c.whyTitle}</h2>
            <ul className="mt-6 grid gap-4 md:grid-cols-3">
              {why.map((w, i) => {
                const Icon = [CalendarDays, PiggyBank, RefreshCw][i] ?? Check;
                return (
                  <li key={w.title} className="card p-5">
                    <Icon className="size-9 rounded-xl bg-brand-50 p-2 text-brand-600" aria-hidden />
                    <h3 className="mt-3 font-bold">{w.title}</h3>
                    <p className="mt-1 text-[0.9375rem] text-muted">{w.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mt-12">
            <Guarantee />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading title={c.compareTitle} />
        <div className="mx-auto max-w-4xl overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
          <table className="w-full min-w-[34rem] text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-line bg-sand">
                <th className="p-4 font-bold">{c.included}</th>
                <th className="p-4 text-center font-bold">{productFor("voeding", l).shortName}</th>
                <th className="p-4 text-center font-bold">{productFor("training", l).shortName}</th>
                <th className="bg-brand-900 p-4 text-center font-bold text-white">{productFor("bundel", l).shortName}</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label.nl} className="border-b border-line last:border-0">
                  <td className="p-4">{row.label[l]}</td>
                  {[row.voeding, row.training, true].map((v, i) => (
                    <td key={i} className={`p-4 text-center ${i === 2 ? "bg-brand-50" : ""}`}>
                      {v ? (
                        <Check className="mx-auto size-5 text-brand-600" aria-label={c.yes} />
                      ) : (
                        <Minus className="mx-auto size-5 text-line" aria-label={c.no} />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-sand py-16">
        <div className="container-page">
          <SectionHeading
            title={c.allPricesTitle}
            intro={c.allPricesIntro}
          />
          <div className="mx-auto max-w-4xl overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
            <table className="w-full min-w-[40rem] text-left text-[0.9375rem]">
              <thead>
                <tr className="border-b border-line bg-sand">
                  <th className="p-4 font-bold">{c.minimumTerm}</th>
                  {ids.map((id) => (
                    <th key={id} className="p-4 font-bold">
                      {productFor(id, l).shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBSCRIPTION_DURATIONS.map((d) => (
                  <tr key={d} className="border-b border-line">
                    <td className="p-4 font-semibold">{durationFor(d, l).label}</td>
                    {ids.map((id) => (
                      <td key={id} className="p-4">
                        <span className="font-bold">{euro(monthlyPrice(id, d), l)}</span> {c.perMonth}
                        {durations[d].months > 1 && (
                          <span className="block text-sm text-muted">
                            {c.minimum(durationFor(d, l).label, euro(commitmentTotal(id, d), l))}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4 font-semibold">{c.oneOffRow}</td>
                  {ids.map((id) => (
                    <td key={id} className="p-4">
                      <span className="font-bold">{euro(monthlyPrice(id, "eenmalig"), l)}</span>
                      <span className="block text-sm text-muted">{c.noSubscription}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow={c.faqEyebrow} title={c.faqTitle} />
        <FaqList items={faq} />
        <FaqJsonLd items={faq} />
      </section>

      <CtaBanner />
    </>
  );
}
