import type { Metadata } from "next";
import Link from "@/i18n/Link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "@/app/[lang]/(site)/contact/ContactForm";
import { FaqJsonLd, FaqList, SectionHeading } from "@/components/marketing";
import { companyAddressLine, site } from "@/config/site";
import { faqFor } from "@/content/faq";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    metaTitle: "Contact en veelgestelde vragen",
    metaDescription: (days: number) =>
      `Neem contact op met ${site.name} of bekijk de veelgestelde vragen. We reageren binnen ${days} werkdagen.`,
    eyebrow: "Contact",
    title: "Vraag? We helpen je graag.",
    intro: (days: number) =>
      `Stuur ons een bericht via het formulier of mail ons direct. We reageren binnen ${days} werkdagen. Misschien staat je antwoord al bij de`,
    faqLink: "veelgestelde vragen",
    kvk: "KvK",
    vat: "Btw",
    cancel: "Abonnement opzeggen? Dat kan direct online via",
    cancelLink: "abonnement opzeggen",
    faqEyebrow: "Veelgestelde vragen",
    faqTitle: "Alles wat je wilt weten",
  },
  en: {
    metaTitle: "Contact and frequently asked questions",
    metaDescription: (days: number) =>
      `Get in touch with ${site.name} or browse the frequently asked questions. We reply within ${days} working days.`,
    eyebrow: "Contact",
    title: "Got a question? We're happy to help.",
    intro: (days: number) =>
      `Send us a message using the form or email us directly. We reply within ${days} working days. Your answer might already be in the`,
    faqLink: "frequently asked questions",
    kvk: "Chamber of Commerce no.",
    vat: "VAT",
    cancel: "Want to cancel your subscription? You can do that online straight away via",
    cancelLink: "cancel subscription",
    faqEyebrow: "Frequently asked questions",
    faqTitle: "Everything you want to know",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const t = copy[l];
  return {
    title: t.metaTitle,
    description: t.metaDescription(site.responseTimeDays),
    alternates: alternates(l, "/contact"),
  };
}

export default async function ContactPage() {
  const l = await getLocale();
  const t = copy[l];
  const faq = faqFor(l);
  const c = site.company;
  return (
    <>
      <section className="container-page grid gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_1.3fr] [&>*]:min-w-0">
        <div>
          <p className="eyebrow mb-3">{t.eyebrow}</p>
          <h1 className="heading-xl">{t.title}</h1>
          <p className="mt-5 text-lg text-muted">
            {t.intro(site.responseTimeDays)}{" "}
            <Link href="#veelgestelde-vragen" className="font-semibold text-brand-700 underline">
              {t.faqLink}
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
                {t.kvk} {c.kvk} · {t.vat} {c.vat}
              </span>
            </li>
            <li className="flex gap-3">
              <MessageCircle className="size-6 text-brand-600" aria-hidden />
              <span>
                {t.cancel}{" "}
                <Link href="/abonnement-opzeggen" className="font-semibold underline">
                  {t.cancelLink}
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
          <SectionHeading eyebrow={t.faqEyebrow} title={t.faqTitle} />
          <FaqList items={faq} />
          <FaqJsonLd items={faq} />
        </div>
      </section>
    </>
  );
}
