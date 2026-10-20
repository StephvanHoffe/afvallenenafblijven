import type { Metadata } from "next";
import Link from "next/link";
import { CtaBanner, FaqJsonLd, FaqList, SectionHeading } from "@/components/marketing";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "Veelgestelde vragen",
  description: "Antwoorden op de meest gestelde vragen over onze voedings- en trainingsschema's, abonnementen en betalen.",
  alternates: { canonical: "/veelgestelde-vragen" },
};

export default function FaqPage() {
  return (
    <>
      <section className="container-page py-14 sm:py-20">
        <SectionHeading
          eyebrow="Veelgestelde vragen"
          title="Alles wat je wilt weten"
          intro={
            <>
              Staat je vraag er niet tussen? <Link href="/contact" className="font-semibold text-brand-700 underline">Neem contact op</Link>, we
              helpen je graag.
            </>
          }
        />
        <FaqList items={faq} />
        <FaqJsonLd items={faq} />
      </section>
      <CtaBanner />
    </>
  );
}
