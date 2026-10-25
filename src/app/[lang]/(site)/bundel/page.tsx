import type { Metadata } from "next";
import { ProductLanding } from "@/components/ProductLanding";
import { faqInOrder } from "@/content/faq";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    meta: {
      title: "Bundel: voedingsschema + trainingsschema",
      description:
        "Voeding en training op elkaar afgestemd, zodat ze elkaar versterken. Voordeliger dan los.",
    },
    content: {
      eyebrow: "Bundel · Meest gekozen",
      title: (
        <>
          Minder eten én sporten, <span className="text-brand-600">maar het schiet niet op</span>?
        </>
      ),
      intro:
        "Dan werken je voeding en training waarschijnlijk langs elkaar heen. Met de bundel krijg je een voedings- én trainingsschema die volledig op elkaar zijn afgestemd, en betaal je minder dan los.",
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
        alt: "Sporter tilt een halter van de grond",
        title: "Afvallen zonder spiermassa te verliezen",
        text: "Wie alleen minder eet, verliest naast vet ook spieren, waardoor je stofwisseling daalt. Met voldoende eiwit en krachttraining verlies je vooral vet en houd je je resultaat makkelijker vast.",
        bullets: ["Gericht op vetverlies, niet op spierverlies", "Minder kans op het jojo-effect", "Werken aan meer energie en een sterker lichaam"],
      },
    },
  },
  en: {
    meta: {
      title: "Bundle: nutrition plan + workout plan",
      description:
        "Nutrition and training aligned with each other, so they reinforce each other. Better value than buying them separately.",
    },
    content: {
      eyebrow: "Bundle · Most popular",
      title: (
        <>
          Eating less and working out, <span className="text-brand-600">but getting nowhere</span>?
        </>
      ),
      intro:
        "Then your nutrition and training are probably working against each other. With the bundle, you get a nutrition plan and a workout plan that are fully aligned, and you pay less than buying them separately.",
      heroAlt: "Healthy dishes and ingredients on a wooden table",
      forWho: [
        "want to get it right this time",
        "want to lose weight and look more toned",
        "want your nutrition and training to reinforce each other",
        "want the biggest saving compared to buying separately",
      ],
      included: [
        { title: "Everything in the nutrition plan", text: "Daily target, weekly meal plan, recipes, shopping list and swap options." },
        { title: "Everything in the workout plan", text: "Weekly overview, workouts, technique tips and 4 weeks of progression." },
        { title: "Fully aligned", text: "Your energy needs take your workouts into account." },
        { title: "Extra protein on training days", text: "A protein-rich meal after your workout for better recovery." },
        { title: "Refreshed every 4 weeks", text: "Both plans are fine-tuned based on your check-in." },
        { title: "Better value than separately", text: "You pay considerably less per month than for nutrition and training on their own." },
      ],
      showcase: {
        alt: "Athlete lifting a barbell off the floor",
        title: "Lose weight without losing muscle",
        text: "If you only eat less, you lose muscle as well as fat, which slows down your metabolism. With enough protein and strength training, you mainly lose fat and find it easier to keep your results.",
        bullets: ["Focused on losing fat, not muscle", "Less risk of the yo-yo effect", "Working towards more energy and a stronger body"],
      },
    },
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { ...copy[l].meta, alternates: alternates(l, "/bundel") };
}

export default async function BundelPage() {
  const l = await getLocale();
  const c = copy[l].content;
  return (
    <ProductLanding
      content={{
        ...c,
        product: "bundel",
        heroImage: "/images/food-flatlay.jpg",
        showcase: { ...c.showcase, image: "/images/deadlift.jpg" },
        pricingProducts: ["bundel"],
        faq: faqInOrder(l, ["opzeggen", "garantie", "abonnement", "resultaat", "niet-afvallen", "afblijven"]),
      }}
    />
  );
}
