import type { Metadata } from "next";
import Image from "next/image";
import { CtaBanner, SectionHeading } from "@/components/marketing";
import { site } from "@/config/site";

export const metadata: Metadata = {
  title: "Over ons",
  description: `Waarom ${site.name} bestaat en hoe we je helpen om af te vallen én op gewicht te blijven.`,
  alternates: { canonical: "/over-ons" },
};

const values = [
  {
    title: "Haalbaar boven perfect",
    text: "Een schema dat je 80% van de tijd volhoudt, werkt beter dan een perfect schema dat je na twee weken loslaat.",
  },
  {
    title: "Wetenschap, geen hypes",
    text: "We baseren ons op de Richtlijnen goede voeding en bewezen trainingsprincipes. Geen detox, geen pillen, geen poeders.",
  },
  {
    title: "Eerlijk en transparant",
    text: "Je weet precies wat je betaalt, je zegt makkelijk op en we zijn open over hoe je schema wordt gemaakt.",
  },
  {
    title: "Veiligheid voorop",
    text: "Bij zwangerschap, eetstoornissen of ondergewicht maken we bewust geen schema. Gezondheid gaat altijd voor.",
  },
];

export default function OverOnsPage() {
  return (
    <>
      <section className="container-page grid items-center gap-10 py-14 md:grid-cols-2 sm:py-20">
        <div>
          <p className="eyebrow mb-3">Over ons</p>
          <h1 className="heading-xl">Afvallen is één ding. Afblijven is de kunst.</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">
            {site.name} is ontstaan uit frustratie over diëten die niet werken. Strenge lijstjes, shakes en
            verboden producten leveren misschien snel resultaat op, maar bijna iedereen komt de kilo&apos;s daarna weer
            aan.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-muted">
            Wij geloven in een andere aanpak: een persoonlijk plan met eten dat je lekker vindt, training die past in
            je week en kleine, blijvende gewoontes. Dankzij slimme technologie kunnen we die persoonlijke aanpak
            aanbieden voor een fractie van de prijs van een diëtist of personal trainer.
          </p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
          <Image src="/images/cooking-friends.jpg" alt="Vrienden koken samen in de keuken" fill preload sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      </section>
      <section className="bg-sand py-16">
        <div className="container-page">
          <SectionHeading title="Waar we voor staan" />
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="card p-6">
                <h2 className="text-lg font-bold">{v.title}</h2>
                <p className="mt-2 text-muted">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="heading-md">Hoe we technologie inzetten</h2>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            Je schema wordt gemaakt met Claude, de AI van Anthropic. Wij bepalen de spelregels: we rekenen je
            energie- en eiwitdoelen zelf uit, geven duidelijke kwaliteitseisen mee (zoals de Richtlijnen goede voeding,
            jouw allergieën en je trainingsniveau) en controleren elk voedingsschema automatisch voordat je het krijgt.
            Zo combineren we de snelheid en betaalbaarheid van technologie met een verantwoorde, persoonlijke aanpak. Onze
            schema&apos;s zijn bedoeld als leefstijladvies en geen vervanging van medisch advies.
          </p>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
