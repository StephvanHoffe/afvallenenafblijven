import type { Metadata } from "next";
import { ProductLanding } from "@/components/ProductLanding";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "Bundel: voedingsschema + trainingsschema",
  description:
    "Voeding en training op elkaar afgestemd, voor het snelste en meest blijvende resultaat. Voordeliger dan los.",
  alternates: { canonical: "/bundel" },
};

export default function BundelPage() {
  return (
    <ProductLanding
      content={{
        product: "bundel",
        eyebrow: "Bundel · Meest gekozen",
        title: (
          <>
            Voeding + training: <span className="text-brand-600">de snelste route</span> naar blijvend resultaat
          </>
        ),
        intro:
          "Afvallen doe je in de keuken, strak en sterk word je met training. Met de bundel krijg je beide, volledig op elkaar afgestemd, en betaal je minder dan los.",
        heroImage: "/images/food-flatlay.jpg",
        heroAlt: "Gezonde gerechten en ingrediënten op een houten tafel",
        forWho: [
          "het deze keer echt goed wilt aanpakken",
          "wilt afvallen én er strakker uit wilt zien",
          "wilt dat voeding en training elkaar versterken",
          "het maximale voordeel wilt ten opzichte van los kopen",
        ],
        included: [
          { title: "Alles van het voedingsschema", text: "Dagdoel, weekmenu, recepten, boodschappenlijst en vervangopties." },
          { title: "Alles van het trainingsschema", text: "Weekoverzicht, trainingen, techniektips en 4 weken progressie." },
          { title: "Op elkaar afgestemd", text: "Je energiebehoefte houdt rekening met je trainingen." },
          { title: "Extra eiwit op trainingsdagen", text: "Een eiwitrijke maaltijd na je training voor beter herstel." },
          { title: "Elke 4 weken vernieuwd", text: "Beide schema's worden bijgestuurd op basis van je check-in." },
          { title: "Voordeliger dan los", text: "Je betaalt per maand flink minder dan voor voeding en training apart." },
        ],
        showcase: {
          image: "/images/deadlift.jpg",
          alt: "Sporter tilt een halter van de grond",
          title: "Afvallen zonder spiermassa te verliezen",
          text: "Wie alleen minder eet, verliest naast vet ook spieren, waardoor je stofwisseling daalt. Met voldoende eiwit en krachttraining verlies je vooral vet en houd je je resultaat makkelijker vast.",
          bullets: ["Sneller zichtbaar resultaat", "Minder kans op het jojo-effect", "Meer energie en een sterker lichaam"],
        },
        pricingProducts: ["bundel"],
        faq: faq.filter((f) => /snel|abonnement van|opzeggen|niet afval|afblijven|Wie of wat|betalen/i.test(f.q)),
      }}
    />
  );
}
