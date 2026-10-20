import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { CtaBanner, FaqJsonLd, FaqList, Guarantee, SectionHeading } from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import { faqFor } from "@/content/faq";
import {
  SUBSCRIPTION_DURATIONS,
  durationFor,
  durations,
  monthlyPrice,
  commitmentTotal,
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
      `Kies voeding, training of de voordelige bundel. Je betaalt altijd per maand via automatische incasso. Kies je een langere minimale looptijd, dan bespaar je tot ${percent}% per maand.`,
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
      `Choose nutrition, training or the money-saving bundle. You always pay monthly by direct debit. Pick a longer minimum term and save up to ${percent}% a month.`,
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
  const faq = faqFor(l, ["abonnement", "opzeggen", "betalen", "garantie"]);
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
