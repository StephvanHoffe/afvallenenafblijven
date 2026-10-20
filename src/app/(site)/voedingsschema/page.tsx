import type { Metadata } from "next";
import { ProductLanding } from "@/components/ProductLanding";
import { faq } from "@/content/faq";

export const metadata: Metadata = {
  title: "Persoonlijk voedingsschema om af te vallen",
  description:
    "Een persoonlijk voedingsschema met weekmenu, recepten en boodschappenlijst. Afgestemd op jouw calorie- en eiwitdoel, smaak, allergieën en kooktijd.",
  alternates: { canonical: "/voedingsschema" },
};

export default function VoedingsschemaPage() {
  return (
    <ProductLanding
      content={{
        product: "voeding",
        eyebrow: "Voedingsschema",
        title: (
          <>
            Afvallen met eten dat je <span className="text-brand-600">écht lekker</span> vindt
          </>
        ),
        intro:
          "Een persoonlijk weekmenu op jouw calorie- en eiwitdoel, met recepten, hoeveelheden en een complete boodschappenlijst. Zonder honger, zonder verboden lijstjes.",
        heroImage: "/images/bowl-colorful.jpg",
        heroAlt: "Kleurrijke bowl met groente, kikkererwten en avocado",
        forWho: [
          "wilt afvallen zonder te hongeren of alles te moeten laten staan",
          "geen zin meer hebt in elke dag nadenken over wat je eet",
          "snel en makkelijk wilt koken met producten uit de supermarkt",
          "na eerdere diëten steeds weer aankwam (het jojo-effect)",
        ],
        included: [
          { title: "Persoonlijk dagdoel", text: "Calorieën en macro's, berekend voor jouw lichaam, activiteit en tempo." },
          { title: "7-daags weekmenu", text: "Ontbijt, lunch, avondeten en tussendoortjes met hoeveelheden in grammen." },
          { title: "Recepten met bereiding", text: "Binnen jouw kooktijd: van 15 minuten tot uitgebreid koken." },
          { title: "Boodschappenlijst", text: "Per afdeling gesorteerd, voor de hele week. Print hem of open hem op je telefoon." },
          { title: "Vervangopties", text: "Bij elke maaltijd een gelijkwaardig alternatief, voor als je eens iets anders wilt." },
          { title: "Bijsturen", text: "Elke 4 weken een nieuw menu, afgestemd op je check-in en voortgang." },
        ],
        showcase: {
          image: "/images/salad-jar.jpg",
          alt: "Salade in een glazen pot als meal prep",
          title: "Gemaakt voor het echte leven",
          text: "Druk, kinderen, een etentje in het weekend? Je schema houdt er rekening mee. Met slimme restjes, meal prep-tips en advies voor als je uit eten gaat.",
          bullets: [
            "Rekening met vegetarisch, veganistisch en allergieën",
            "Producten van Albert Heijn, Jumbo, Lidl of Aldi",
            "Gebaseerd op de Richtlijnen goede voeding",
          ],
        },
        pricingProducts: ["voeding", "bundel"],
        faq: faq.filter((f) => /snel|persoonlijk|allergie|opzeggen|niet afval/i.test(f.q)),
      }}
    />
  );
}
