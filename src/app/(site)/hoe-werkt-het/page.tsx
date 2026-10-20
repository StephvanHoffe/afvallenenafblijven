import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CtaBanner, SectionHeading, Steps } from "@/components/marketing";

export const metadata: Metadata = {
  title: "Hoe werkt het?",
  description:
    "Zo werkt Afvallen & Afblijven: vragenlijst invullen, plan kiezen en binnen enkele minuten je persoonlijke voedings- en trainingsschema ontvangen.",
  alternates: { canonical: "/hoe-werkt-het" },
};

const details = [
  {
    title: "1. Je vult de vragenlijst in",
    text: "Je vertelt ons je doel, lengte, gewicht, leeftijd en hoe actief je bent. Voor je voedingsschema vragen we naar je eetpatroon, allergieën, wat je niet lust, je kooktijd en budget. Voor je trainingsschema naar je trainingsplek, ervaring, beschikbare tijd en eventuele blessures. Ook stellen we een paar veiligheidsvragen over je gezondheid.",
    image: "/images/breakfast-table.jpg",
    alt: "Ontbijttafel met fruit, havermout en koffie",
  },
  {
    title: "2. Wij berekenen jouw dagdoelen",
    text: "Met erkende formules (Mifflin-St Jeor) berekenen we je energiebehoefte en stellen we een veilig calorietekort vast: nooit meer dan 25% onder je onderhoudsniveau en nooit onder een verantwoord minimum. Daarna bepalen we je eiwit-, vet- en koolhydraatdoel.",
    image: "/images/ingredients-board.jpg",
    alt: "Verse ingrediënten op een snijplank",
  },
  {
    title: "3. Je schema wordt gemaakt en gecontroleerd",
    text: "Na je betaling stelt ons systeem jouw persoonlijke schema samen volgens onze strenge richtlijnen. Elk voedingsschema wordt automatisch gecontroleerd: klopt het aantal calorieën en eiwit per dag, en het aantal maaltijden? Zo niet, dan wordt het opnieuw gemaakt. Binnen enkele minuten staat het voor je klaar.",
    image: "/images/chicken-plate.jpg",
    alt: "Gegrilde kip met groente en citroen",
  },
  {
    title: "4. Elke week bijsturen, elke 4 weken een nieuw schema",
    text: "Elke week vul je in 1 minuut je gewicht in en hoe het ging. Wijkt je voortgang af, dan sturen we je schema meteen bij: iets meer of minder eten, of zwaarder of lichter trainen. Heb je een abonnement? Aan het einde van elke periode van 4 weken vul je een korte check-in in: je gewicht, hoe goed het lukte, je honger, energie en slaap, en hoe de trainingen voelden. Op basis daarvan maken we direct je nieuwe schema: met bijgestelde calorieën, nieuwe gerechten en een volgende stap in je training. Heb je je doel bereikt? Dan stappen we over op een plan om op gewicht te blijven.",
    image: "/images/coach-bench.jpg",
    alt: "Sporter traint met hulp van een begeleider",
  },
];

export default function HoeWerktHetPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-cream py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            eyebrow="Hoe werkt het"
            title="Van vragenlijst naar persoonlijk schema in een paar minuten"
            intro="Geen wachtlijst, geen intakegesprek en geen standaardlijstjes. Wel een schema dat helemaal van jou is."
          />
          <Steps />
        </div>
      </section>
      <section className="container-page space-y-16 py-16">
        {details.map((d, i) => (
          <div key={d.title} className="grid items-center gap-10 md:grid-cols-2">
            <div className={`relative aspect-[4/3] overflow-hidden rounded-[2rem] ${i % 2 ? "md:order-2" : ""}`}>
              <Image src={d.image} alt={d.alt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="heading-md">{d.title}</h2>
              <p className="mt-3 text-lg leading-relaxed text-muted">{d.text}</p>
            </div>
          </div>
        ))}
        <div className="text-center">
          <Link href="/start" className="btn-primary text-lg">
            Start de vragenlijst <ArrowRight className="size-5" aria-hidden />
          </Link>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
