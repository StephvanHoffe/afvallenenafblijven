import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { CtaBanner, FaqJsonLd, FaqList, Guarantee, SectionHeading } from "@/components/marketing";
import { PricingTable } from "@/components/pricing/PricingTable";
import { faq } from "@/content/faq";
import {
  SUBSCRIPTION_DURATIONS,
  durations,
  monthlyPrice,
  commitmentTotal,
  maxSavingsPercent,
  products,
  type ProductId,
} from "@/config/pricing";
import { site } from "@/config/site";
import { euro } from "@/lib/format";
import { launchOfferActive } from "@/lib/launch";

export const metadata: Metadata = {
  title: "Prijzen & abonnementen",
  description:
    "Bekijk de prijzen van ons persoonlijke voedingsschema, trainingsschema en de voordelige bundel. Per maand of voordeliger voor 3, 6 of 12 maanden.",
  alternates: { canonical: "/prijzen" },
};

const comparison: { label: string; voeding: boolean; training: boolean }[] = [
  { label: "Persoonlijk calorie- en macrodoel", voeding: true, training: false },
  { label: "7-daags weekmenu met recepten", voeding: true, training: false },
  { label: "Boodschappenlijst per week", voeding: true, training: false },
  { label: "Rekening met allergieën en eetpatroon", voeding: true, training: false },
  { label: "Trainingsschema thuis of sportschool", voeding: false, training: true },
  { label: "4 weken progressie met uitleg per oefening", voeding: false, training: true },
  { label: "Rekening met blessures en niveau", voeding: false, training: true },
  { label: "Elke 4 weken een nieuw schema", voeding: true, training: true },
  { label: "Wekelijks weegmoment en bijsturen", voeding: true, training: true },
  { label: "Check-in en bijsturen", voeding: true, training: true },
  { label: "Downloaden als PDF, met logboek of boodschappenlijst", voeding: true, training: true },
];

export default async function PrijzenPage() {
  const launch = { active: await launchOfferActive(), percentOff: site.launchOffer.percentOff };
  const ids: ProductId[] = ["voeding", "training", "bundel"];
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-sand py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Prijzen & abonnementen"
            title="Persoonlijke begeleiding, zonder de prijs van een personal trainer"
            intro={`Kies voeding, training of de voordelige bundel. Je betaalt altijd per maand via automatische incasso. Kies je een langere minimale looptijd, dan bespaar je tot ${maxSavingsPercent()}% per maand.`}
          />
          <PricingTable launch={launch} />
          <div className="mt-12">
            <Guarantee />
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading title="Wat zit er in elk plan?" />
        <div className="mx-auto max-w-4xl overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
          <table className="w-full min-w-[34rem] text-left text-[0.9375rem]">
            <thead>
              <tr className="border-b border-line bg-sand">
                <th className="p-4 font-bold">Inbegrepen</th>
                <th className="p-4 text-center font-bold">Voeding</th>
                <th className="p-4 text-center font-bold">Training</th>
                <th className="bg-brand-900 p-4 text-center font-bold text-white">Bundel</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((row) => (
                <tr key={row.label} className="border-b border-line last:border-0">
                  <td className="p-4">{row.label}</td>
                  {[row.voeding, row.training, true].map((v, i) => (
                    <td key={i} className={`p-4 text-center ${i === 2 ? "bg-brand-50" : ""}`}>
                      {v ? (
                        <Check className="mx-auto size-5 text-brand-600" aria-label="Ja" />
                      ) : (
                        <Minus className="mx-auto size-5 text-line" aria-label="Nee" />
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
            title="Alle prijzen op een rij"
            intro="Alle bedragen zijn per maand en inclusief 21% btw. Abonnementen worden maandelijks afgeschreven via SEPA-incasso. Na de minimale looptijd loopt je abonnement door tegen dezelfde maandprijs en is het maandelijks opzegbaar."
          />
          <div className="mx-auto max-w-4xl overflow-x-auto rounded-[var(--radius-card)] border border-line bg-white">
            <table className="w-full min-w-[40rem] text-left text-[0.9375rem]">
              <thead>
                <tr className="border-b border-line bg-sand">
                  <th className="p-4 font-bold">Minimale looptijd</th>
                  {ids.map((id) => (
                    <th key={id} className="p-4 font-bold">
                      {products[id].shortName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SUBSCRIPTION_DURATIONS.map((d) => (
                  <tr key={d} className="border-b border-line">
                    <td className="p-4 font-semibold">{durations[d].label}</td>
                    {ids.map((id) => (
                      <td key={id} className="p-4">
                        <span className="font-bold">{euro(monthlyPrice(id, d))}</span> p/m
                        {durations[d].months > 1 && (
                          <span className="block text-sm text-muted">
                            minimaal {durations[d].label} (samen {euro(commitmentTotal(id, d))})
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="p-4 font-semibold">Los schema (eenmalig, 4 weken)</td>
                  {ids.map((id) => (
                    <td key={id} className="p-4">
                      <span className="font-bold">{euro(monthlyPrice(id, "eenmalig"))}</span>
                      <span className="block text-sm text-muted">geen abonnement</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <SectionHeading eyebrow="Vragen over betalen" title="Duidelijk en eerlijk" />
        <FaqList items={faq.filter((f) => /abonnement van|opzeggen|betalen|bevalt/i.test(f.q))} />
        <FaqJsonLd items={faq.filter((f) => /abonnement van|opzeggen|betalen|bevalt/i.test(f.q))} />
      </section>

      <CtaBanner />
    </>
  );
}
