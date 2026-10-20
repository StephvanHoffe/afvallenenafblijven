import type { Metadata } from "next";
import { ProductLanding } from "@/components/ProductLanding";
import { faqFor } from "@/content/faq";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    meta: {
      title: "Persoonlijk trainingsschema voor thuis of de sportschool",
      description:
        "Een persoonlijk trainingsschema met progressie over 4 weken. Afgestemd op je doel, niveau, materiaal, tijd en eventuele blessures.",
    },
    content: {
      eyebrow: "Trainingsschema",
      title: (
        <>
          Sterker en strakker, <span className="text-brand-600">thuis of in de gym</span>
        </>
      ),
      intro:
        "Een trainingsschema dat past bij jouw niveau, materiaal en agenda. Met duidelijke uitleg per oefening en een opbouw waarmee je elke week vooruitgaat.",
      heroAlt: "Vrouw drukt een halter boven haar hoofd in de sportschool",
      forWho: [
        "wilt afvallen zonder spiermassa te verliezen",
        "in de sportschool rondloopt zonder plan",
        "thuis wilt trainen, met of zonder materiaal",
        "net begint, of juist al ervaring hebt en verder wilt",
      ],
      included: [
        { title: "Weekoverzicht", text: "Welke training op welke dag, plus rust en actief herstel." },
        { title: "Trainingen op maat", text: "Full body, upper/lower of een split, afhankelijk van je aantal dagen." },
        { title: "Sets, reps en rust", text: "Precies wat je moet doen, met intensiteit (RPE) per oefening." },
        { title: "Techniektips", text: "2-3 korte aanwijzingen per oefening en een makkelijker alternatief." },
        { title: "4 weken progressie", text: "Een duidelijke opbouw, zodat je sterker wordt in plaats van stilstaat." },
        { title: "Rekening met blessures", text: "Vermijdt belastende oefeningen en kiest veilige alternatieven." },
      ],
      showcase: {
        alt: "Vrouwen trainen samen op yogamatten in een lichte zaal",
        title: "Elke training binnen jouw tijd",
        text: "Of je nu 30 of 75 minuten hebt: je schema past erin, inclusief warming-up. Zo wordt trainen een gewoonte in plaats van een opgave.",
        bullets: [
          "Thuis zonder materiaal, thuis met materiaal of in de sportschool",
          "Van beginner tot ervaren sporter",
          "Stappen- en cardioadvies dat bij je doel past",
        ],
      },
    },
  },
  en: {
    meta: {
      title: "Personal workout plan for home or the gym",
      description:
        "A personal workout plan with progression over 4 weeks. Tailored to your goal, level, equipment, time and any injuries.",
    },
    content: {
      eyebrow: "Workout plan",
      title: (
        <>
          Stronger and more toned, <span className="text-brand-600">at home or in the gym</span>
        </>
      ),
      intro:
        "A workout plan that fits your level, equipment and schedule. With clear instructions for every exercise and a progression that moves you forward every week.",
      heroAlt: "Woman pressing a weight overhead at the gym",
      forWho: [
        "want to lose weight without losing muscle",
        "wander around the gym without a plan",
        "want to train at home, with or without equipment",
        "are just starting out, or already have experience and want to take the next step",
      ],
      included: [
        { title: "Weekly overview", text: "Which workout on which day, plus rest and active recovery." },
        { title: "Tailored workouts", text: "Full body, upper/lower or a split, depending on how many days you train." },
        { title: "Sets, reps and rest", text: "Exactly what to do, with the intensity (RPE) for every exercise." },
        { title: "Technique tips", text: "2-3 short cues per exercise, plus an easier alternative." },
        { title: "4 weeks of progression", text: "A clear build-up, so you keep getting stronger instead of standing still." },
        { title: "Injury-aware", text: "Avoids exercises that put strain on problem areas and picks safe alternatives." },
      ],
      showcase: {
        alt: "Women training together on yoga mats in a bright studio",
        title: "Every workout fits your time",
        text: "Whether you have 30 or 75 minutes, your plan fits, warm-up included. That way, training becomes a habit instead of a chore.",
        bullets: [
          "At home without equipment, at home with equipment, or at the gym",
          "From complete beginner to experienced athlete",
          "Step and cardio advice that matches your goal",
        ],
      },
    },
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { ...copy[l].meta, alternates: alternates(l, "/trainingsschema") };
}

export default async function TrainingsschemaPage() {
  const l = await getLocale();
  const c = copy[l].content;
  return (
    <ProductLanding
      content={{
        ...c,
        product: "training",
        heroImage: "/images/woman-overhead-press.jpg",
        showcase: { ...c.showcase, image: "/images/group-training.jpg" },
        pricingProducts: ["training", "bundel"],
        faq: faqFor(l, ["snel", "abonnement", "opzeggen", "thuis", "koppelen", "medisch"]),
      }}
    />
  );
}
