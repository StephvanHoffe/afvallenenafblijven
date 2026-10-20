import type { Metadata } from "next";
import { ProductLanding } from "@/components/ProductLanding";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "Persoonlijk trainingsschema voor thuis of de sportschool",
  description:
    "Een persoonlijk trainingsschema met progressie over 4 weken. Afgestemd op je doel, niveau, materiaal, tijd en eventuele blessures.",
  alternates: { canonical: "/trainingsschema" },
};

export default function TrainingsschemaPage() {
  return (
    <ProductLanding
      content={{
        product: "training",
        eyebrow: "Trainingsschema",
        title: (
          <>
            Sterker en strakker, <span className="text-brand-600">thuis of in de gym</span>
          </>
        ),
        intro:
          "Een trainingsschema dat past bij jouw niveau, materiaal en agenda. Met duidelijke uitleg per oefening en een opbouw waarmee je elke week vooruitgaat.",
        heroImage: "/images/woman-overhead-press.jpg",
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
          image: "/images/group-training.jpg",
          alt: "Vrouwen trainen samen op yogamatten in een lichte zaal",
          title: "Elke training binnen jouw tijd",
          text: "Of je nu 30 of 75 minuten hebt: je schema past erin, inclusief warming-up. Zo wordt trainen een gewoonte in plaats van een opgave.",
          bullets: [
            "Thuis zonder materiaal, thuis met materiaal of in de sportschool",
            "Van beginner tot ervaren sporter",
            "Stappen- en cardioadvies dat bij je doel past",
          ],
        },
        pricingProducts: ["training", "bundel"],
        faq: faq.filter((f) => /snel|sportschool|opzeggen|medische|Wie of wat|abonnement van/i.test(f.q)),
      }}
    />
  );
}
