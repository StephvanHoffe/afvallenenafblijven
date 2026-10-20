import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/app/(site)/contact/ContactForm";
import { FaqJsonLd, FaqList, SectionHeading } from "@/components/marketing";
import { companyAddressLine, site } from "@/config/site";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "Contact en veelgestelde vragen",
  description: `Neem contact op met ${site.name} of bekijk de veelgestelde vragen. We reageren binnen ${site.responseTimeDays} werkdagen.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  const c = site.company;
  return (
    <>
      <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.3fr] [&>*]:min-w-0">
        <div>
          <p className="eyebrow mb-3">Contact</p>
          <h1 className="heading-xl">Vraag? We helpen je graag.</h1>
          <p className="mt-5 text-lg text-muted">
            Stuur ons een bericht via het formulier of mail ons direct. We reageren binnen {site.responseTimeDays}{" "}
            werkdagen. Misschien staat je antwoord al bij de{" "}
            <Link href="#veelgestelde-vragen" className="font-semibold text-brand-700 underline">
              veelgestelde vragen
            </Link>
            .
          </p>
          <ul className="mt-8 space-y-4">
            <li className="flex gap-3">
              <Mail className="size-6 text-brand-600" aria-hidden />
              <a href={`mailto:${c.email}`} className="font-semibold underline">
                {c.email}
              </a>
            </li>
            <li className="flex gap-3">
              <MapPin className="size-6 text-brand-600" aria-hidden />
              <span>
                {c.legalName}
                <br />
                {companyAddressLine()}
                <br />
                KvK {c.kvk} · Btw {c.vat}
              </span>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="size-6 text-brand-600" aria-hidden />
              <span>
                Abonnement opzeggen? Dat kan direct online via{" "}
                <Link href="/abonnement-opzeggen" className="font-semibold underline">
                  abonnement opzeggen
                </Link>
                .
              </span>
            </li>
          </ul>
        </div>
        <div className="card p-6 sm:p-8">
          <ContactForm />
        </div>
      </section>
      <section id="veelgestelde-vragen" className="scroll-mt-20 bg-sand py-16 sm:py-20">
        <div className="container-page">
          <SectionHeading eyebrow="Veelgestelde vragen" title="Alles wat je wilt weten" />
          <FaqList items={faq} />
          <FaqJsonLd items={faq} />
        </div>
      </section>
    </>
  );
}
