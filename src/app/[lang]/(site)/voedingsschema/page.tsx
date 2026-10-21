import type { Metadata } from "next";
import { ProductLanding } from "@/components/ProductLanding";
import { faqInOrder } from "@/content/faq";
import { defineCopy } from "@/i18n/config";
import { alternates } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    meta: {
      title: "Persoonlijk voedingsschema om af te vallen",
      description:
        "Een persoonlijk voedingsschema met weekmenu, recepten en boodschappenlijst. Afgestemd op jouw calorie- en eiwitdoel, smaak, allergieën en kooktijd.",
    },
    content: {
      eyebrow: "Voedingsschema",
      title: (
        <>
          Afvallen met eten dat je <span className="text-brand-600">écht lekker</span> vindt
        </>
      ),
      intro:
        "Elke dag kipfilet met broccoli? Geen wonder dat je het niet volhoudt. Je krijgt een persoonlijk weekmenu op jouw calorie- en eiwitdoel, met recepten, hoeveelheden en een complete boodschappenlijst. Zonder honger, zonder verboden lijstjes.",
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
        alt: "Salade in een glazen pot als meal prep",
        title: "Gemaakt voor het echte leven",
        text: "Druk, kinderen, een etentje in het weekend? Je schema houdt er rekening mee. Met slimme restjes, meal prep-tips en advies voor als je uit eten gaat.",
        bullets: [
          "Rekening met vegetarisch, veganistisch en allergieën",
          "Producten van Albert Heijn, Jumbo, Lidl of Aldi",
          "Gebaseerd op de Richtlijnen goede voeding",
        ],
      },
    },
  },
  en: {
    meta: {
      title: "Personal nutrition plan for weight loss",
      description:
        "A personal nutrition plan with a weekly meal plan, recipes and a shopping list. Tailored to your calorie and protein targets, taste, allergies and cooking time.",
    },
    content: {
      eyebrow: "Nutrition plan",
      title: (
        <>
          Lose weight with food you <span className="text-brand-600">actually love</span>
        </>
      ),
      intro:
        "Chicken and broccoli every day? No wonder you can't keep it up. You get a personal weekly meal plan built around your calorie and protein targets, with recipes, quantities and a complete shopping list. No hunger, no lists of forbidden foods.",
      heroAlt: "Colourful bowl with vegetables, chickpeas and avocado",
      forWho: [
        "want to lose weight without going hungry or giving up everything you enjoy",
        "are tired of thinking about what to eat every single day",
        "want quick, easy meals made with ingredients from the supermarket",
        "kept putting the weight back on after previous diets (the yo-yo effect)",
      ],
      included: [
        { title: "Personal daily target", text: "Calories and macros, calculated for your body, activity level and pace." },
        { title: "7-day weekly meal plan", text: "Breakfast, lunch, dinner and snacks, with quantities in grams." },
        { title: "Step-by-step recipes", text: "To fit your cooking time: from 15-minute meals to more elaborate cooking." },
        { title: "Shopping list", text: "Sorted by supermarket aisle, for the whole week. Print it or open it on your phone." },
        { title: "Swap options", text: "An equivalent alternative for every meal, for when you fancy something different." },
        { title: "Ongoing fine-tuning", text: "A new menu every 4 weeks, adjusted to your check-in and progress." },
      ],
      showcase: {
        alt: "Salad in a glass jar as meal prep",
        title: "Made for real life",
        text: "Busy job, kids, dinner out at the weekend? Your plan takes it all into account, with clever use of leftovers, meal prep tips and advice for when you eat out.",
        bullets: [
          "Caters for vegetarian and vegan diets and allergies",
          "Products from Albert Heijn, Jumbo, Lidl or Aldi",
          "Based on the official Dutch dietary guidelines",
        ],
      },
    },
  },
});

export async function generateMetadata(): Promise<Metadata> {
  const l = await getLocale();
  return { ...copy[l].meta, alternates: alternates(l, "/voedingsschema") };
}

export default async function VoedingsschemaPage() {
  const l = await getLocale();
  const c = copy[l].content;
  return (
    <ProductLanding
      content={{
        ...c,
        product: "voeding",
        heroImage: "/images/bowl-colorful.jpg",
        showcase: { ...c.showcase, image: "/images/salad-jar.jpg" },
        pricingProducts: ["voeding", "bundel"],
        faq: faqInOrder(l, ["opzeggen", "garantie", "persoonlijk", "allergie", "niet-afvallen", "snel"]),
      }}
    />
  );
}
