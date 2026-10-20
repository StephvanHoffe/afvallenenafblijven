import type { Metadata } from "next";
import Image from "next/image";
import { CtaBanner, SectionHeading } from "@/components/marketing";
import { site } from "@/config/site";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    metaTitle: "Over ons",
    metaDescription: `Waarom ${site.name} bestaat en hoe we je helpen om af te vallen én op gewicht te blijven.`,
    eyebrow: "Over ons",
    title: "Afvallen is één ding. Afblijven is de kunst.",
    story: [
      `${site.name} is ontstaan uit frustratie over diëten die niet werken. Strenge lijstjes, shakes en verboden producten leveren misschien snel resultaat op, maar bijna iedereen komt de kilo's daarna weer aan.`,
      "Wij geloven in een andere aanpak: een persoonlijk plan met eten dat je lekker vindt, training die past in je week en kleine, blijvende gewoontes. Dankzij slimme technologie kunnen we die persoonlijke aanpak aanbieden voor een fractie van de prijs van een diëtist of personal trainer.",
    ],
    imageAlt: "Vrienden koken samen in de keuken",
    valuesTitle: "Waar we voor staan",
    values: [
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
    ],
    howTitle: "Hoe we werken",
    howText:
      "We rekenen je energie- en eiwitdoelen uit met erkende formules. Daarna stelt ons systeem je schema samen volgens duidelijke kwaliteitseisen (zoals de Richtlijnen goede voeding, jouw allergieën en je trainingsniveau) en controleren we elk voedingsschema automatisch voordat je het krijgt. Zo combineren we de snelheid en betaalbaarheid van technologie met een verantwoorde, persoonlijke aanpak. Onze schema's zijn bedoeld als leefstijladvies en geen vervanging van medisch advies.",
  },
  en: {
    metaTitle: "About us",
    metaDescription: `Why ${site.name} exists and how we help you lose weight and keep it off.`,
    eyebrow: "About us",
    title: "Losing weight is one thing. Keeping it off is the real art.",
    story: [
      `${site.name} (Dutch for "lose weight and keep it off") was born out of frustration with diets that don't work. Strict lists, shakes and forbidden foods might deliver quick results, but almost everyone puts the kilos back on afterwards.`,
      "We believe in a different approach: a personal plan with food you enjoy, training that fits into your week, and small habits that last. Thanks to smart technology, we can offer that personal approach for a fraction of the price of a dietitian or personal trainer.",
    ],
    imageAlt: "Friends cooking together in the kitchen",
    valuesTitle: "What we stand for",
    values: [
      {
        title: "Doable over perfect",
        text: "A plan you stick to 80% of the time works better than a perfect plan you abandon after two weeks.",
      },
      {
        title: "Science, not hype",
        text: "We base our approach on the official Dutch dietary guidelines and proven training principles. No detox, no pills, no powders.",
      },
      {
        title: "Honest and transparent",
        text: "You know exactly what you pay, cancelling is easy, and we're open about how your plan is made.",
      },
      {
        title: "Safety first",
        text: "We deliberately don't create plans for anyone who is pregnant, has an eating disorder or is underweight. Health always comes first.",
      },
    ],
    howTitle: "How we work",
    howText:
      "We calculate your energy and protein targets using recognised formulas. Our system then puts together your plan according to clear quality standards (such as the Dutch dietary guidelines, your allergies and your training level), and we automatically check every nutrition plan before you receive it. That way, we combine the speed and affordability of technology with a responsible, personal approach. Our plans are intended as lifestyle advice and are not a substitute for medical advice.",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: c.metaTitle, description: c.metaDescription, alternates: alternates(l, "/over-ons") };
}

export default async function OverOnsPage() {
  const c = copy[await getLocale()];
  return (
    <>
      <section className="container-page grid items-center gap-10 py-14 md:grid-cols-2 sm:py-20">
        <div>
          <p className="eyebrow mb-3">{c.eyebrow}</p>
          <h1 className="heading-xl">{c.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-muted">{c.story[0]}</p>
          <p className="mt-4 text-lg leading-relaxed text-muted">{c.story[1]}</p>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem]">
          <Image
            src="/images/cooking-friends.jpg"
            alt={c.imageAlt}
            fill
            preload
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-cover"
          />
        </div>
      </section>
      <section className="bg-sand py-16">
        <div className="container-page">
          <SectionHeading title={c.valuesTitle} />
          <div className="grid gap-5 sm:grid-cols-2">
            {c.values.map((v) => (
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
          <h2 className="heading-md">{c.howTitle}</h2>
          <p className="mt-3 text-lg leading-relaxed text-muted">{c.howText}</p>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
