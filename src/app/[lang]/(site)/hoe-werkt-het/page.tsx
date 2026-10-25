import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/i18n/Link";
import { ArrowRight } from "lucide-react";
import { CtaBanner, SectionHeading, Steps } from "@/components/marketing";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const images = ["/images/breakfast-table.jpg", "/images/ingredients-board.jpg", "/images/chicken-plate.jpg", "/images/coach-bench.jpg"];

const copy = defineCopy({
  nl: {
    metaTitle: "Hoe werkt het?",
    metaDescription:
      "Zo werkt Afvallen & Afblijven: vragenlijst invullen, plan kiezen en binnen 2 uur je persoonlijke voedings- en trainingsschema ontvangen.",
    eyebrow: "Hoe werkt het",
    title: "Van vragenlijst naar persoonlijk schema binnen 2 uur",
    intro: "Geen wachtlijst, geen intakegesprek en geen standaardlijstje dat je na drie weken weer opgeeft. Wel een schema dat helemaal van jou is, en dat meebeweegt als het even tegenzit.",
    details: [
      {
        title: "1. Je vult de vragenlijst in",
        text: "Je vertelt ons je doel, lengte, gewicht, leeftijd en hoe actief je bent. Voor je voedingsschema vragen we naar je eetpatroon, allergieën, wat je niet lust, je kooktijd en budget. Voor je trainingsschema naar je trainingsplek, ervaring, beschikbare tijd en eventuele blessures. Ook stellen we een paar veiligheidsvragen over je gezondheid.",
        alt: "Ontbijttafel met fruit, havermout en koffie",
      },
      {
        title: "2. Wij berekenen jouw dagdoelen",
        text: "Met erkende formules (Mifflin-St Jeor) berekenen we je energiebehoefte en stellen we een veilig calorietekort vast: nooit meer dan 25% onder je onderhoudsniveau en nooit onder een verantwoord minimum. Daarna bepalen we je eiwit-, vet- en koolhydraatdoel.",
        alt: "Verse ingrediënten op een snijplank",
      },
      {
        title: "3. Je schema wordt gemaakt en gecontroleerd",
        text: "Na je betaling stelt ons systeem jouw persoonlijke schema samen volgens onze strenge richtlijnen. Elk voedingsschema wordt gecontroleerd: klopt het aantal calorieën en eiwit per dag, het aantal maaltijden, en komt er niets in voor waarvoor je een allergie hebt opgegeven? Zo niet, dan wordt het opnieuw gemaakt. Binnen 2 uur staat het voor je klaar en krijg je een e-mail.",
        alt: "Gegrilde kip met groente en citroen",
      },
      {
        title: "4. Elke week bijsturen, elke 4 weken een nieuw schema",
        text: "Elke week, het liefst in het weekend, vul je in 1 minuut je gewicht in en hoe het ging. Wijkt je voortgang af, dan sturen we je schema meteen bij: iets meer of minder eten, of zwaarder of lichter trainen, op tijd voor je boodschappen. Heb je een abonnement? Elke periode duurt 4 weken en start op maandag. Vanaf de donderdag ervoor vul je een korte check-in in: je gewicht, hoe goed het lukte, je honger, energie en slaap, en hoe de trainingen voelden. Op basis daarvan maken we je nieuwe schema, dat binnen 2 uur klaarstaat: met bijgestelde calorieën, nieuwe gerechten en een volgende stap in je training. Vul je hem uiterlijk zaterdag in, dan staat het met boodschappenlijst klaar voordat de nieuwe week begint. Heb je je doel bereikt? Dan stappen we over op een plan om op gewicht te blijven.",
        alt: "Sporter traint met hulp van een begeleider",
      },
    ],
    start: "Maak mijn persoonlijke plan",
    startNote: "2 minuten · je betaalt pas als je een plan kiest",
  },
  en: {
    metaTitle: "How does it work?",
    metaDescription:
      "This is how Afvallen & Afblijven works: fill in the questionnaire, choose your plan and receive your personal nutrition and workout plan within 2 hours.",
    eyebrow: "How it works",
    title: "From questionnaire to personal plan within 2 hours",
    intro: "No waiting list, no intake interview and no generic list you give up on after three weeks. Just a plan that's entirely yours, and that adapts when things get tough.",
    details: [
      {
        title: "1. You fill in the questionnaire",
        text: "You tell us your goal, height, weight, age and how active you are. For your nutrition plan, we ask about your eating habits, allergies, foods you don't like, your cooking time and budget. For your workout plan, we ask where you train, your experience, the time you have available and any injuries. We also ask a few safety questions about your health.",
        alt: "Breakfast table with fruit, porridge and coffee",
      },
      {
        title: "2. We calculate your daily targets",
        text: "Using recognised formulas (Mifflin-St Jeor), we calculate your energy needs and set a safe calorie deficit: never more than 25% below your maintenance level and never below a responsible minimum. Then we set your protein, fat and carbohydrate targets.",
        alt: "Fresh ingredients on a chopping board",
      },
      {
        title: "3. Your plan is created and checked",
        text: "Once you've paid, our system puts together your personal plan according to our strict guidelines. Every nutrition plan is checked: are the calories and protein per day right, is the number of meals right, and does it contain nothing you've told us you're allergic to? If not, the plan is created again. Within 2 hours, it's ready for you and we'll send you an email.",
        alt: "Grilled chicken with vegetables and lemon",
      },
      {
        title: "4. Weekly fine-tuning, a new plan every 4 weeks",
        text: "Every week, ideally at the weekend, you take 1 minute to log your weight and how things went. If your progress is off track, we adjust your plan straight away: eating a little more or less, or training harder or lighter, in time for your shopping. Got a subscription? Each period lasts 4 weeks and starts on a Monday. From the Thursday before, you complete a short check-in: your weight, how well it went, your hunger, energy and sleep, and how the workouts felt. Based on that, we create your new plan, ready within 2 hours, with adjusted calories, new dishes and the next step in your training. Fill it in by Saturday, and it will be ready with its shopping list before the new week begins. Reached your goal? Then we move you onto a plan to maintain your weight.",
        alt: "Athlete training with the help of a coach",
      },
    ],
    start: "Create my personal plan",
    startNote: "2 minutes · you only pay once you choose a plan",
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  const c = copy[l];
  return { title: c.metaTitle, description: c.metaDescription, alternates: alternates(l, "/hoe-werkt-het") };
}

export default async function HoeWerktHetPage() {
  const c = copy[await getLocale()];
  const details = c.details.map((d, i) => ({ ...d, image: images[i] }));
  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-cream py-14 sm:py-20">
        <div className="container-page">
          <SectionHeading
            as="h1"
            eyebrow={c.eyebrow}
            title={c.title}
            intro={c.intro}
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
            {c.start} <ArrowRight className="size-5" aria-hidden />
          </Link>
          <p className="mt-3 text-sm text-muted">{c.startNote}</p>
        </div>
      </section>
      <CtaBanner />
    </>
  );
}
