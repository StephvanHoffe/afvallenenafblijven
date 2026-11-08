import type { Locale } from "@/i18n/config";
import { roundNutrients, sumNutrients, type FoodKey, type Nutrients } from "@/content/nutrition";

/**
 * Recepten voor de receptpagina's, de meal-prep-pagina en het voorbeeldweekmenu.
 * Hoeveelheden staan per portie (gram, of ml bij dranken) en verwijzen naar de
 * voedingstabel in src/content/nutrition.ts; de calorieën en macro's per
 * portie worden daaruit berekend, zodat ze overal kloppen. Kruiden, specerijen,
 * zout, peper, citroensap, knoflook en bouillon staan als "extra" zonder
 * voedingswaarden (ze tellen nauwelijks mee).
 *
 * Richtwaarden per portie: ontbijt 300-450 kcal en minimaal ± 20 g eiwit,
 * lunch 350-500 kcal en avondeten 400-600 kcal, met minimaal ± 25 g eiwit.
 */
export type RecipeCategory = "ontbijt" | "lunch" | "avondeten";

type Text = Record<Locale, string>;

export interface RecipeIngredient {
  food: FoodKey;
  /** Gram (of ml bij dranken) per portie. */
  amount: number;
  /** Naam in de ingrediëntenlijst, met kleine letter ("magere kwark"). */
  label: Text;
}

export interface Recipe {
  slug: string;
  category: RecipeCategory;
  title: Text;
  /** Bereidingstijd in minuten (zonder wachttijd in de koelkast). */
  minutes: number;
  /** Aantal porties dat je in één keer maakt; de hoeveelheden staan per portie. */
  servings: number;
  /** Geschikt om vooruit te koken (bewaren in de koelkast of vriezer). */
  mealPrep: boolean;
  vegetarian: boolean;
  ingredients: RecipeIngredient[];
  /** Kruiden en dergelijke zonder (noemenswaardige) calorieën. */
  extras: Text[];
  steps: Text[];
  /** Hoe je het bewaart (bij meal-prep-recepten). */
  storage?: Text;
}

const t = (nl: string, en: string): Text => ({ nl, en });
const i = (food: FoodKey, amount: number, nl: string, en: string): RecipeIngredient => ({ food, amount, label: { nl, en } });

const FRIDGE_FREEZE = t(
  "Laat snel afkoelen en zet in afgesloten bakjes in de koelkast: maximaal 2 dagen. Of vries porties in. Verwarm tot het overal gloeiend heet is.",
  "Cool quickly and refrigerate in sealed containers: up to 2 days. Or freeze in portions. Reheat until piping hot all the way through.",
);

export const recipes: Recipe[] = [
  // Ontbijt
  {
    slug: "kwarkbowl-blauwe-bessen-walnoten",
    category: "ontbijt",
    title: t("Kwarkbowl met blauwe bessen en walnoten", "Quark bowl with blueberries and walnuts"),
    minutes: 5,
    servings: 1,
    mealPrep: false,
    vegetarian: true,
    ingredients: [
      i("kwarkMager", 250, "magere kwark", "low-fat quark"),
      i("havermout", 40, "havermout", "oats"),
      i("blauweBessen", 75, "blauwe bessen (vers of diepvries)", "blueberries (fresh or frozen)"),
      i("walnoten", 10, "walnoten", "walnuts"),
    ],
    extras: [t("kaneel", "cinnamon")],
    steps: [
      t("Schep de kwark in een kom en roer er een snufje kaneel door.", "Spoon the quark into a bowl and stir in a pinch of cinnamon."),
      t(
        "Strooi de havermout en de blauwe bessen erover. Diepvriesbessen kun je de avond ervoor in de koelkast laten ontdooien.",
        "Scatter the oats and blueberries on top. You can thaw frozen berries in the fridge the night before.",
      ),
      t("Hak de walnoten grof en verdeel ze over de bowl.", "Roughly chop the walnuts and sprinkle them over the bowl."),
    ],
  },
  {
    slug: "overnight-oats-skyr-aardbeien",
    category: "ontbijt",
    title: t("Overnight oats met skyr en aardbeien", "Overnight oats with skyr and strawberries"),
    minutes: 5,
    servings: 2,
    mealPrep: true,
    vegetarian: true,
    ingredients: [
      i("havermout", 40, "havermout", "oats"),
      i("chiazaad", 10, "chiazaad", "chia seeds"),
      i("skyr", 150, "skyr (naturel)", "plain skyr"),
      i("melkHalfvol", 100, "halfvolle melk", "semi-skimmed milk"),
      i("aardbeien", 100, "aardbeien", "strawberries"),
    ],
    extras: [t("kaneel (optioneel)", "cinnamon (optional)")],
    steps: [
      t(
        "Meng per portie de havermout, het chiazaad, de skyr en de melk in een pot of bakje met deksel.",
        "For each portion, mix the oats, chia seeds, skyr and milk in a jar or container with a lid.",
      ),
      t(
        "Sluit af en zet minimaal 6 uur of een nacht in de koelkast. De havermout en het chiazaad nemen het vocht op.",
        "Close and refrigerate for at least 6 hours or overnight. The oats and chia seeds soak up the liquid.",
      ),
      t(
        "Snijd de aardbeien pas op de ochtend zelf en schep ze erop. Te dik? Roer er een scheutje melk of water door.",
        "Slice the strawberries on the morning itself and spoon them on top. Too thick? Stir in a splash of milk or water.",
      ),
    ],
    storage: t("Koelkast: maximaal 2 dagen. Niet geschikt om in te vriezen.", "Fridge: up to 2 days. Not suitable for freezing."),
  },
  {
    slug: "omelet-spinazie-tomaat-kaas",
    category: "ontbijt",
    title: t("Omelet met spinazie, tomaat en kaas", "Omelette with spinach, tomato and cheese"),
    minutes: 10,
    servings: 1,
    mealPrep: false,
    vegetarian: true,
    ingredients: [
      i("ei", 165, "eieren (3 stuks)", "eggs (3)"),
      i("spinazie", 75, "verse spinazie", "fresh spinach"),
      i("tomaat", 100, "tomaat", "tomato"),
      i("kaas30", 20, "geraspte kaas 30+", "grated reduced-fat cheese"),
      i("volkorenBrood", 35, "volkoren brood (1 snee)", "wholemeal bread (1 slice)"),
    ],
    extras: [t("peper en zout", "salt and black pepper")],
    steps: [
      t("Klop de eieren los met peper en een snufje zout. Snijd de tomaat in blokjes.", "Beat the eggs with pepper and a pinch of salt. Dice the tomato."),
      t(
        "Laat de spinazie in een antiaanbakpan op middelhoog vuur in 1 tot 2 minuten slinken en schep hem even uit de pan.",
        "Wilt the spinach in a non-stick frying pan over a medium heat for 1 to 2 minutes, then lift it out of the pan.",
      ),
      t(
        "Giet de eieren in de pan en laat ze 3 tot 4 minuten op laag vuur stollen. Verdeel de spinazie, tomaat en kaas over de helft.",
        "Pour the eggs into the pan and let them set over a low heat for 3 to 4 minutes. Spread the spinach, tomato and cheese over one half.",
      ),
      t("Vouw de omelet dubbel, bak nog 1 minuut en eet hem met de snee brood.", "Fold the omelette in half, cook for 1 more minute and eat it with the slice of bread."),
    ],
  },
  {
    slug: "eiermuffins-paprika-spinazie",
    category: "ontbijt",
    title: t("Eiermuffins met paprika en spinazie", "Egg muffins with pepper and spinach"),
    minutes: 25,
    servings: 3,
    mealPrep: true,
    vegetarian: true,
    ingredients: [
      i("ei", 110, "eieren (2 stuks)", "eggs (2)"),
      i("paprika", 50, "rode paprika", "red pepper"),
      i("spinazie", 30, "verse spinazie", "fresh spinach"),
      i("kaas30", 20, "geraspte kaas 30+", "grated reduced-fat cheese"),
      i("volkorenBrood", 35, "volkoren brood (1 snee)", "wholemeal bread (1 slice)"),
    ],
    extras: [t("gedroogde oregano", "dried oregano"), t("peper en zout", "salt and black pepper")],
    steps: [
      t(
        "Verwarm de oven voor op 180 °C. Zet siliconen muffinvormpjes of papieren cups in een muffinvorm: 2 per portie.",
        "Preheat the oven to 180 °C. Put silicone muffin cases or paper cases in a muffin tin: 2 per portion.",
      ),
      t("Snijd de paprika in kleine blokjes en de spinazie grof. Verdeel ze over de vormpjes.", "Finely dice the pepper and roughly chop the spinach. Divide them between the cases."),
      t(
        "Klop de eieren los met oregano, peper en een snufje zout en schenk ze over de groente. Strooi de kaas erover.",
        "Beat the eggs with oregano, pepper and a pinch of salt and pour them over the vegetables. Sprinkle the cheese on top.",
      ),
      t(
        "Bak de muffins 18 tot 20 minuten, tot het ei helemaal gestold is. Eet 2 muffins met een snee volkoren brood.",
        "Bake for 18 to 20 minutes, until the egg is completely set. Eat 2 muffins with a slice of wholemeal bread.",
      ),
    ],
    storage: t(
      "Laat snel afkoelen. Koelkast: maximaal 2 dagen. Vriezer: ja, per 2 stuks verpakt. Verwarm tot ze door en door heet zijn.",
      "Cool quickly. Fridge: up to 2 days. Freezer: yes, wrapped in pairs. Reheat until piping hot all the way through.",
    ),
  },
  {
    slug: "volkoren-brood-huttenkase-kipfilet",
    category: "ontbijt",
    title: t("Volkoren brood met hüttenkäse, kipfilet en komkommer", "Wholemeal bread with cottage cheese, chicken and cucumber"),
    minutes: 5,
    servings: 1,
    mealPrep: false,
    vegetarian: false,
    ingredients: [
      i("volkorenBrood", 70, "volkoren brood (2 sneetjes)", "wholemeal bread (2 slices)"),
      i("huttenkase", 100, "hüttenkäse", "cottage cheese"),
      i("kipfiletBeleg", 30, "kipfilet als beleg (2 plakjes)", "sliced chicken breast (2 slices)"),
      i("komkommer", 75, "komkommer", "cucumber"),
      i("cherrytomaat", 50, "cherrytomaatjes", "cherry tomatoes"),
    ],
    extras: [t("verse bieslook (optioneel)", "fresh chives (optional)"), t("peper", "black pepper")],
    steps: [
      t("Rooster het brood als je dat lekker vindt.", "Toast the bread if you like."),
      t("Besmeer beide sneetjes met de hüttenkäse en beleg ze met de kipfilet.", "Spread both slices with the cottage cheese and top with the chicken."),
      t(
        "Leg plakjes komkommer erop, strooi er peper en bieslook over en eet de tomaatjes erbij.",
        "Add slices of cucumber, season with pepper and chives and eat the tomatoes on the side.",
      ),
    ],
  },
  {
    slug: "havermoutpannenkoekjes-kwark-bessen",
    category: "ontbijt",
    title: t("Havermoutpannenkoekjes met kwark en blauwe bessen", "Oat pancakes with quark and blueberries"),
    minutes: 15,
    servings: 1,
    mealPrep: false,
    vegetarian: true,
    ingredients: [
      i("havermout", 35, "havermout", "oats"),
      i("banaan", 50, "rijpe banaan (een halve)", "ripe banana (half)"),
      i("ei", 110, "eieren (2 stuks)", "eggs (2)"),
      i("olijfolie", 3, "olijfolie (om te bakken)", "olive oil (for frying)"),
      i("kwarkMager", 100, "magere kwark", "low-fat quark"),
      i("blauweBessen", 50, "blauwe bessen", "blueberries"),
    ],
    extras: [t("kaneel", "cinnamon")],
    steps: [
      t(
        "Maal de havermout fijn in een blender of met een staafmixer. Voeg de banaan, de eieren en een snufje kaneel toe en mix tot een glad beslag.",
        "Grind the oats in a blender or with a stick blender. Add the banana, eggs and a pinch of cinnamon and blend into a smooth batter.",
      ),
      t(
        "Verhit de olie in een antiaanbakpan op middelhoog vuur en schep er 3 of 4 kleine hoopjes beslag in.",
        "Heat the oil in a non-stick frying pan over a medium heat and spoon in 3 or 4 small mounds of batter.",
      ),
      t("Bak de pannenkoekjes 2 minuten per kant, tot ze goudbruin en gaar zijn. Bak de rest op dezelfde manier.", "Cook for 2 minutes on each side, until golden and cooked through. Cook the rest the same way."),
      t("Eet de pannenkoekjes met de kwark en de blauwe bessen.", "Serve the pancakes with the quark and blueberries."),
    ],
  },
  {
    slug: "smoothie-skyr-blauwe-bessen",
    category: "ontbijt",
    title: t("Eiwitrijke smoothie met skyr en blauwe bessen", "High-protein smoothie with skyr and blueberries"),
    minutes: 5,
    servings: 1,
    mealPrep: false,
    vegetarian: true,
    ingredients: [
      i("skyr", 150, "skyr (naturel)", "plain skyr"),
      i("melkHalfvol", 150, "halfvolle melk", "semi-skimmed milk"),
      i("banaan", 60, "banaan (een halve)", "banana (half)"),
      i("blauweBessen", 75, "blauwe bessen (diepvries)", "blueberries (frozen)"),
      i("havermout", 20, "havermout", "oats"),
    ],
    extras: [],
    steps: [
      t("Doe alle ingrediënten in een blender.", "Put all the ingredients in a blender."),
      t("Mix 30 tot 60 seconden tot een gladde smoothie. Te dik? Voeg een scheutje water toe.", "Blend for 30 to 60 seconds until smooth. Too thick? Add a splash of water."),
      t("Drink hem meteen op. Neem je hem mee, houd hem dan koel en drink hem dezelfde ochtend op.", "Drink it straight away. Taking it with you? Keep it cool and drink it the same morning."),
    ],
  },
  {
    slug: "ontbijtwrap-roerei-spinazie",
    category: "ontbijt",
    title: t("Ontbijtwrap met roerei, spinazie en kaas", "Breakfast wrap with scrambled egg, spinach and cheese"),
    minutes: 10,
    servings: 1,
    mealPrep: false,
    vegetarian: true,
    ingredients: [
      i("ei", 110, "eieren (2 stuks)", "eggs (2)"),
      i("spinazie", 50, "verse spinazie", "fresh spinach"),
      i("volkorenWrap", 60, "volkoren wrap (1 stuk)", "wholemeal wrap (1)"),
      i("kaas30", 20, "geraspte kaas 30+", "grated reduced-fat cheese"),
      i("cherrytomaat", 75, "cherrytomaatjes", "cherry tomatoes"),
    ],
    extras: [t("peper en zout", "salt and black pepper")],
    steps: [
      t("Klop de eieren los met peper en een snufje zout.", "Beat the eggs with pepper and a pinch of salt."),
      t(
        "Laat de spinazie in een antiaanbakpan in 1 minuut slinken. Schenk de eieren erbij en roer op laag vuur tot het roerei net gestold is.",
        "Wilt the spinach in a non-stick frying pan for 1 minute. Pour in the eggs and stir over a low heat until just set.",
      ),
      t(
        "Verwarm de wrap kort in een droge pan. Schep het roerei erop, strooi de kaas erover en leg de gehalveerde tomaatjes erbij.",
        "Warm the wrap briefly in a dry pan. Spoon the scrambled egg on top, sprinkle with the cheese and add the halved tomatoes.",
      ),
      t("Vouw de onderkant naar binnen en rol de wrap strak op.", "Fold in the bottom and roll the wrap up tightly."),
    ],
  },

  // Lunch
  {
    slug: "wrap-kip-hummus-rauwkost",
    category: "lunch",
    title: t("Volkoren wrap met kip, hummus en rauwkost", "Wholemeal wrap with chicken, hummus and crunchy veg"),
    minutes: 15,
    servings: 1,
    mealPrep: false,
    vegetarian: false,
    ingredients: [
      i("kipfilet", 100, "kipfilet", "chicken breast"),
      i("volkorenWrap", 60, "volkoren wrap (1 stuk)", "wholemeal wrap (1)"),
      i("hummus", 30, "hummus (2 eetlepels)", "hummus (2 tablespoons)"),
      i("sla", 30, "gemengde sla", "mixed salad leaves"),
      i("komkommer", 50, "komkommer", "cucumber"),
      i("wortel", 40, "geraspte wortel", "grated carrot"),
    ],
    extras: [t("paprikapoeder", "paprika"), t("peper en zout", "salt and black pepper")],
    steps: [
      t("Snijd de kipfilet in reepjes en bestrooi met paprikapoeder, peper en een snufje zout.", "Cut the chicken into strips and season with paprika, pepper and a pinch of salt."),
      t(
        "Bak de kip in een antiaanbakpan op middelhoog vuur in 6 tot 8 minuten gaar. Snijd een reepje open: er mag geen roze meer te zien zijn.",
        "Cook the chicken in a non-stick frying pan over a medium heat for 6 to 8 minutes. Cut a strip open: there should be no pink left.",
      ),
      t("Besmeer de wrap met de hummus en beleg hem met de sla, komkommer, wortel en kip.", "Spread the wrap with the hummus and fill it with the salad, cucumber, carrot and chicken."),
      t(
        "Rol strak op en snijd doormidden. Neem je hem mee? Laat de kip eerst afkoelen en bewaar de wrap koel.",
        "Roll up tightly and cut in half. Taking it with you? Let the chicken cool first and keep the wrap chilled.",
      ),
    ],
  },
  {
    slug: "salade-tonijn-ei-krieltjes",
    category: "lunch",
    title: t("Salade met tonijn, ei, krieltjes en sperziebonen", "Salad with tuna, egg, baby potatoes and green beans"),
    minutes: 25,
    servings: 2,
    mealPrep: true,
    vegetarian: false,
    ingredients: [
      i("krieltjes", 150, "krieltjes", "baby potatoes"),
      i("sperziebonen", 100, "sperziebonen", "green beans"),
      i("ei", 55, "ei (1 stuk)", "egg (1)"),
      i("tonijn", 80, "tonijn in water (uitgelekt)", "tuna in water (drained)"),
      i("cherrytomaat", 75, "cherrytomaatjes", "cherry tomatoes"),
      i("sla", 30, "gemengde sla", "mixed salad leaves"),
      i("olijfolie", 5, "olijfolie", "olive oil"),
    ],
    extras: [t("citroensap", "lemon juice"), t("verse peterselie (optioneel)", "fresh parsley (optional)"), t("peper en zout", "salt and black pepper")],
    steps: [
      t(
        "Kook de krieltjes in 15 tot 20 minuten gaar. Kook de sperziebonen de laatste 6 minuten mee.",
        "Boil the baby potatoes for 15 to 20 minutes until tender. Add the green beans for the last 6 minutes.",
      ),
      t(
        "Kook tegelijk de eieren (1 per portie) in 8 minuten hard. Spoel ze af met koud water en pel ze.",
        "At the same time, hard-boil the eggs (1 per portion) for 8 minutes. Rinse under cold water and peel.",
      ),
      t("Giet de krieltjes en bonen af en laat ze afkoelen. Halveer de krieltjes en de tomaatjes.", "Drain the potatoes and beans and let them cool. Halve the potatoes and tomatoes."),
      t(
        "Roer de olijfolie met citroensap, peper en zout tot een dressing. Verdeel sla, krieltjes, bonen, tomaatjes, tonijn en het gehalveerde ei over een bord en schenk de dressing erover.",
        "Whisk the olive oil with lemon juice, salt and pepper into a dressing. Arrange the salad, potatoes, beans, tomatoes, tuna and halved egg on a plate and drizzle with the dressing.",
      ),
    ],
    storage: t(
      "Koelkast: maximaal 2 dagen, in een afgesloten bakje. Houd de sla en de dressing apart en meng ze pas vlak voor het eten. Niet invriezen.",
      "Fridge: up to 2 days in a sealed container. Keep the salad leaves and dressing separate and add them just before eating. Not suitable for freezing.",
    ),
  },
  {
    slug: "linzensoep-tomaat-wortel",
    category: "lunch",
    title: t("Linzensoep met tomaat en wortel", "Lentil soup with tomato and carrot"),
    minutes: 30,
    servings: 4,
    mealPrep: true,
    vegetarian: true,
    ingredients: [
      i("ui", 50, "ui (een halve)", "onion (half)"),
      i("wortel", 75, "wortel", "carrot"),
      i("olijfolie", 5, "olijfolie", "olive oil"),
      i("tomatenblokjes", 200, "tomatenblokjes (blik)", "chopped tomatoes (tin)"),
      i("linzen", 200, "linzen (uit pot of blik, uitgelekt)", "lentils (jar or tin, drained)"),
      i("volkorenBrood", 35, "volkoren brood (1 snee)", "wholemeal bread (1 slice)"),
    ],
    extras: [
      t("knoflook (1 teentje per 2 porties)", "garlic (1 clove per 2 portions)"),
      t("komijnpoeder", "ground cumin"),
      t("paprikapoeder", "paprika"),
      t("groentebouillonblokje (een halve per portie)", "vegetable stock cube (half per portion)"),
      t("peper", "black pepper"),
    ],
    steps: [
      t("Snipper de ui, snijd de wortel in blokjes en pers de knoflook.", "Finely chop the onion, dice the carrot and crush the garlic."),
      t(
        "Verhit de olie in een soeppan en bak de ui, knoflook en wortel 5 minuten. Roer de komijn en het paprikapoeder erdoor en bak 1 minuut mee.",
        "Heat the oil in a saucepan and cook the onion, garlic and carrot for 5 minutes. Stir in the cumin and paprika and cook for 1 more minute.",
      ),
      t(
        "Voeg de tomatenblokjes, de uitgelekte linzen, het bouillonblokje en 250 ml water per portie toe. Laat 15 minuten zachtjes koken.",
        "Add the chopped tomatoes, drained lentils, stock cube and 250 ml water per portion. Simmer gently for 15 minutes.",
      ),
      t(
        "Pureer de soep grof met een staafmixer, of laat hem zo. Breng op smaak met peper en eet hem met de snee brood.",
        "Blend the soup roughly with a stick blender, or leave it chunky. Season with pepper and eat it with the slice of bread.",
      ),
    ],
    storage: t(
      "Laat de soep snel afkoelen in bakjes. Koelkast: maximaal 2 dagen. Vriezer: ja, in porties. Verwarm tot de soep goed kookt.",
      "Cool the soup quickly in containers. Fridge: up to 2 days. Freezer: yes, in portions. Reheat until it's boiling.",
    ),
  },
  {
    slug: "quinoasalade-kikkererwten-edamame-feta",
    category: "lunch",
    title: t("Quinoasalade met kikkererwten, edamame en feta", "Quinoa salad with chickpeas, edamame and feta"),
    minutes: 20,
    servings: 2,
    mealPrep: true,
    vegetarian: true,
    ingredients: [
      i("quinoaOngekookt", 50, "quinoa (ongekookt)", "quinoa (uncooked)"),
      i("edamame", 75, "edamame (gepeld, diepvries)", "edamame (shelled, frozen)"),
      i("kikkererwten", 75, "kikkererwten (uit blik, uitgelekt)", "chickpeas (tinned, drained)"),
      i("komkommer", 75, "komkommer", "cucumber"),
      i("cherrytomaat", 75, "cherrytomaatjes", "cherry tomatoes"),
      i("feta", 30, "feta", "feta"),
    ],
    extras: [t("citroensap", "lemon juice"), t("verse munt of peterselie", "fresh mint or parsley"), t("peper", "black pepper")],
    steps: [
      t(
        "Spoel de quinoa af en kook hem in 12 tot 15 minuten gaar. Laat hem uitlekken en afkoelen.",
        "Rinse the quinoa and cook it for 12 to 15 minutes until tender. Drain and leave to cool.",
      ),
      t(
        "Kook de edamame 3 tot 4 minuten en spoel ze koud af. Spoel de kikkererwten af en laat ze uitlekken.",
        "Boil the edamame for 3 to 4 minutes and rinse under cold water. Rinse and drain the chickpeas.",
      ),
      t("Snijd de komkommer in blokjes, halveer de tomaatjes en verkruimel de feta.", "Dice the cucumber, halve the tomatoes and crumble the feta."),
      t("Meng alles met citroensap, de gehakte kruiden en peper.", "Mix everything with lemon juice, the chopped herbs and pepper."),
    ],
    storage: t(
      "Koelkast: maximaal 2 dagen. Bewaar komkommer en tomaat apart, dan blijft alles knapperig. Niet invriezen.",
      "Fridge: up to 2 days. Keep the cucumber and tomatoes separate so everything stays crunchy. Not suitable for freezing.",
    ),
  },
  {
    slug: "volkoren-brood-eiersalade-kwark",
    category: "lunch",
    title: t("Volkoren brood met eiersalade van kwark", "Wholemeal bread with quark egg salad"),
    minutes: 15,
    servings: 1,
    mealPrep: false,
    vegetarian: true,
    ingredients: [
      i("ei", 110, "eieren (2 stuks)", "eggs (2)"),
      i("kwarkMager", 50, "magere kwark", "low-fat quark"),
      i("volkorenBrood", 70, "volkoren brood (2 sneetjes)", "wholemeal bread (2 slices)"),
      i("sla", 20, "sla", "salad leaves"),
      i("komkommer", 75, "komkommer", "cucumber"),
    ],
    extras: [t("verse bieslook", "fresh chives"), t("kerriepoeder (snufje)", "curry powder (pinch)"), t("peper en zout", "salt and black pepper")],
    steps: [
      t("Kook de eieren in 8 minuten hard. Spoel ze af met koud water en pel ze.", "Hard-boil the eggs for 8 minutes. Rinse under cold water and peel."),
      t(
        "Prak de eieren met een vork en roer de kwark, gehakte bieslook, een snufje kerriepoeder, peper en zout erdoor.",
        "Mash the eggs with a fork and stir in the quark, chopped chives, a pinch of curry powder, salt and pepper.",
      ),
      t("Beleg het brood met de sla en de eiersalade. Eet de komkommer erbij.", "Top the bread with the salad leaves and egg salad. Eat the cucumber on the side."),
    ],
  },
  {
    slug: "couscoussalade-kip-paprika-feta",
    category: "lunch",
    title: t("Couscoussalade met kip, paprika en feta", "Couscous salad with chicken, pepper and feta"),
    minutes: 20,
    servings: 2,
    mealPrep: true,
    vegetarian: false,
    ingredients: [
      i("couscousOngekookt", 50, "volkoren couscous (ongekookt)", "wholewheat couscous (uncooked)"),
      i("kipfilet", 100, "kipfilet", "chicken breast"),
      i("olijfolie", 5, "olijfolie", "olive oil"),
      i("paprika", 75, "paprika", "pepper"),
      i("komkommer", 50, "komkommer", "cucumber"),
      i("feta", 20, "feta", "feta"),
    ],
    extras: [
      t("groentebouillonblokje (een kwart per portie)", "vegetable stock cube (quarter per portion)"),
      t("komijnpoeder", "ground cumin"),
      t("citroensap", "lemon juice"),
      t("verse peterselie", "fresh parsley"),
      t("peper", "black pepper"),
    ],
    steps: [
      t(
        "Los het bouillonblokje op in 75 ml kokend water per portie en schenk dat over de couscous. Dek af, laat 5 minuten wellen en maak los met een vork.",
        "Dissolve the stock cube in 75 ml boiling water per portion and pour it over the couscous. Cover, leave for 5 minutes and fluff up with a fork.",
      ),
      t(
        "Snijd de kip in blokjes, bestrooi met komijn en peper en bak in de olie in 6 tot 8 minuten gaar.",
        "Dice the chicken, season with cumin and pepper and fry in the oil for 6 to 8 minutes until cooked through.",
      ),
      t("Snijd de paprika en komkommer in blokjes en verkruimel de feta.", "Dice the pepper and cucumber and crumble the feta."),
      t("Meng de couscous met de kip, groente, peterselie en citroensap en verdeel de feta erover.", "Mix the couscous with the chicken, vegetables, parsley and lemon juice and top with the feta."),
    ],
    storage: t(
      "Laat de kip en couscous snel afkoelen. Koelkast: maximaal 2 dagen, in een afgesloten bakje. Niet invriezen.",
      "Cool the chicken and couscous quickly. Fridge: up to 2 days in a sealed container. Not suitable for freezing.",
    ),
  },
  {
    slug: "bowl-zalm-edamame-zilvervliesrijst",
    category: "lunch",
    title: t("Bowl met zalm, edamame en zilvervliesrijst", "Bowl with salmon, edamame and brown rice"),
    minutes: 30,
    servings: 1,
    mealPrep: false,
    vegetarian: false,
    ingredients: [
      i("zilvervliesrijstOngekookt", 50, "zilvervliesrijst (ongekookt)", "brown rice (uncooked)"),
      i("zalm", 100, "zalmfilet", "salmon fillet"),
      i("edamame", 50, "edamame (gepeld, diepvries)", "edamame (shelled, frozen)"),
      i("komkommer", 50, "komkommer", "cucumber"),
      i("wortel", 40, "wortel", "carrot"),
      i("sojasaus", 10, "sojasaus", "soy sauce"),
    ],
    extras: [t("limoensap", "lime juice"), t("verse gember (optioneel)", "fresh ginger (optional)")],
    steps: [
      t("Kook de zilvervliesrijst gaar volgens de verpakking (meestal 20 tot 25 minuten).", "Cook the brown rice according to the packet (usually 20 to 25 minutes)."),
      t(
        "Bak de zalm intussen in een antiaanbakpan op middelhoog vuur 3 tot 4 minuten per kant, tot hij gaar is en makkelijk uit elkaar valt.",
        "Meanwhile, cook the salmon in a non-stick frying pan over a medium heat for 3 to 4 minutes on each side, until cooked and it flakes easily.",
      ),
      t("Kook de edamame 3 minuten en spoel ze koud af. Snijd de komkommer en wortel in dunne reepjes.", "Boil the edamame for 3 minutes and rinse under cold water. Cut the cucumber and carrot into thin strips."),
      t(
        "Schep de rijst in een kom, leg de zalm, edamame en groente erop en besprenkel met sojasaus, limoensap en wat geraspte gember.",
        "Spoon the rice into a bowl, top with the salmon, edamame and vegetables and drizzle with soy sauce, lime juice and a little grated ginger.",
      ),
    ],
  },
  {
    slug: "tosti-kip-kaas-tomaat",
    category: "lunch",
    title: t("Volkoren tosti met kipfilet, kaas en tomaat", "Wholemeal toastie with chicken, cheese and tomato"),
    minutes: 10,
    servings: 1,
    mealPrep: false,
    vegetarian: false,
    ingredients: [
      i("volkorenBrood", 70, "volkoren brood (2 sneetjes)", "wholemeal bread (2 slices)"),
      i("kaas30", 40, "kaas 30+ (2 plakken)", "reduced-fat cheese (2 slices)"),
      i("kipfiletBeleg", 30, "kipfilet als beleg (2 plakjes)", "sliced chicken breast (2 slices)"),
      i("tomaat", 50, "tomaat (een halve)", "tomato (half)"),
      i("komkommer", 75, "komkommer", "cucumber"),
      i("wortel", 80, "wortel", "carrot"),
    ],
    extras: [t("gedroogde oregano (optioneel)", "dried oregano (optional)")],
    steps: [
      t(
        "Beleg een snee brood met een plak kaas, de kipfilet, plakjes tomaat en de tweede plak kaas. Leg de andere snee erop.",
        "Top one slice of bread with a slice of cheese, the chicken, slices of tomato and the second slice of cheese. Put the other slice on top.",
      ),
      t(
        "Bak de tosti in een tosti-apparaat of in een droge koekenpan met deksel 3 tot 4 minuten per kant, tot de kaas gesmolten is.",
        "Cook in a toastie maker, or in a dry frying pan with a lid for 3 to 4 minutes on each side, until the cheese has melted.",
      ),
      t("Snijd de komkommer en wortel in staafjes en eet ze erbij.", "Cut the cucumber and carrot into sticks and eat them on the side."),
    ],
  },

  // Avondeten
  {
    slug: "zalm-oven-krieltjes-sperziebonen",
    category: "avondeten",
    title: t("Zalm uit de oven met krieltjes en sperziebonen", "Oven-baked salmon with baby potatoes and green beans"),
    minutes: 30,
    servings: 2,
    mealPrep: false,
    vegetarian: false,
    ingredients: [
      i("krieltjes", 200, "krieltjes", "baby potatoes"),
      i("olijfolie", 5, "olijfolie", "olive oil"),
      i("zalm", 125, "zalmfilet", "salmon fillet"),
      i("sperziebonen", 200, "sperziebonen", "green beans"),
    ],
    extras: [t("citroen", "lemon"), t("verse dille", "fresh dill"), t("knoflook", "garlic"), t("peper en zout", "salt and black pepper")],
    steps: [
      t(
        "Verwarm de oven voor op 200 °C. Halveer de krieltjes, meng ze met de olie, peper en een snufje zout en rooster ze 25 minuten op een bakplaat met bakpapier.",
        "Preheat the oven to 200 °C. Halve the baby potatoes, toss with the oil, pepper and a pinch of salt and roast on a lined baking tray for 25 minutes.",
      ),
      t(
        "Leg na 10 minuten de zalm erbij, met peper, dille en een partje citroen erop. Rooster nog 12 tot 15 minuten, tot de zalm gaar is.",
        "After 10 minutes, add the salmon to the tray, topped with pepper, dill and a lemon wedge. Roast for another 12 to 15 minutes, until the salmon is cooked.",
      ),
      t(
        "Kook intussen de sperziebonen in 6 tot 8 minuten beetgaar en hussel er een geperst teentje knoflook door.",
        "Meanwhile, boil the green beans for 6 to 8 minutes until just tender and toss with a crushed garlic clove.",
      ),
      t("Serveer de zalm met de krieltjes en bonen en knijp er citroen over.", "Serve the salmon with the potatoes and beans and squeeze over some lemon."),
    ],
  },
  {
    slug: "wok-kip-groente-zilvervliesrijst",
    category: "avondeten",
    title: t("Wokschotel met kip, groente en zilvervliesrijst", "Chicken stir-fry with vegetables and brown rice"),
    minutes: 25,
    servings: 4,
    mealPrep: true,
    vegetarian: false,
    ingredients: [
      i("zilvervliesrijstOngekookt", 60, "zilvervliesrijst (ongekookt)", "brown rice (uncooked)"),
      i("kipfilet", 125, "kipfilet", "chicken breast"),
      i("olijfolie", 5, "olie (om te wokken)", "oil (for stir-frying)"),
      i("wokgroente", 250, "verse wokgroente", "fresh stir-fry vegetables"),
      i("sojasaus", 15, "sojasaus (1 eetlepel)", "soy sauce (1 tablespoon)"),
    ],
    extras: [t("knoflook", "garlic"), t("verse gember", "fresh ginger"), t("limoensap", "lime juice"), t("chilivlokken (optioneel)", "chilli flakes (optional)")],
    steps: [
      t("Kook de zilvervliesrijst gaar volgens de verpakking (meestal 20 tot 25 minuten).", "Cook the brown rice according to the packet (usually 20 to 25 minutes)."),
      t(
        "Snijd de kip in reepjes. Verhit de olie in een wok en bak de kip op hoog vuur in 5 tot 6 minuten rondom bruin en gaar.",
        "Cut the chicken into strips. Heat the oil in a wok and stir-fry the chicken over a high heat for 5 to 6 minutes until browned and cooked through.",
      ),
      t(
        "Voeg de knoflook, geraspte gember en wokgroente toe en roerbak 3 tot 4 minuten, zodat de groente knapperig blijft.",
        "Add the garlic, grated ginger and vegetables and stir-fry for 3 to 4 minutes, so the vegetables stay crunchy.",
      ),
      t("Blus af met de sojasaus en een kneepje limoen en serveer met de rijst.", "Add the soy sauce and a squeeze of lime and serve with the rice."),
    ],
    storage: FRIDGE_FREEZE,
  },
  {
    slug: "chili-con-carne-zwarte-bonen",
    category: "avondeten",
    title: t("Chili con carne met zwarte bonen en zilvervliesrijst", "Chilli con carne with black beans and brown rice"),
    minutes: 30,
    servings: 4,
    mealPrep: true,
    vegetarian: false,
    ingredients: [
      i("zilvervliesrijstOngekookt", 50, "zilvervliesrijst (ongekookt)", "brown rice (uncooked)"),
      i("rundergehakt", 100, "mager rundergehakt", "lean beef mince"),
      i("ui", 50, "ui (een halve)", "onion (half)"),
      i("paprika", 75, "paprika (een halve)", "pepper (half)"),
      i("tomatenblokjes", 150, "tomatenblokjes (blik)", "chopped tomatoes (tin)"),
      i("zwarteBonen", 100, "zwarte bonen (uit blik, uitgelekt)", "black beans (tinned, drained)"),
    ],
    extras: [
      t("knoflook", "garlic"),
      t("komijnpoeder", "ground cumin"),
      t("gerookt paprikapoeder", "smoked paprika"),
      t("chilipoeder of chilivlokken", "chilli powder or flakes"),
      t("peper en zout", "salt and black pepper"),
    ],
    steps: [
      t("Kook de zilvervliesrijst gaar volgens de verpakking.", "Cook the brown rice according to the packet."),
      t(
        "Snipper de ui en knoflook en snijd de paprika in blokjes. Bak het gehakt rul in een grote pan zonder extra olie; het gehakt geeft zelf vet af.",
        "Finely chop the onion and garlic and dice the pepper. Brown the mince in a large pan without extra oil; the mince releases its own fat.",
      ),
      t("Voeg de ui, knoflook en paprika toe en bak 3 minuten mee. Roer de kruiden erdoor.", "Add the onion, garlic and pepper and cook for 3 minutes. Stir in the spices."),
      t(
        "Voeg de tomatenblokjes en de uitgelekte bonen toe en laat 15 minuten zachtjes pruttelen. Breng op smaak en serveer met de rijst.",
        "Add the chopped tomatoes and drained beans and simmer gently for 15 minutes. Season and serve with the rice.",
      ),
    ],
    storage: t(
      "Laat de chili en rijst snel afkoelen in platte bakjes. Koelkast: maximaal 2 dagen. Vriezer: ja, heel geschikt. Verwarm tot alles gloeiend heet is.",
      "Cool the chilli and rice quickly in shallow containers. Fridge: up to 2 days. Freezer: yes, ideal. Reheat until piping hot.",
    ),
  },
  {
    slug: "pasta-kip-pesto-spinazie",
    category: "avondeten",
    title: t("Pasta met kip, pesto, spinazie en tomaatjes", "Pasta with chicken, pesto, spinach and cherry tomatoes"),
    minutes: 20,
    servings: 2,
    mealPrep: false,
    vegetarian: false,
    ingredients: [
      i("volkorenPastaOngekookt", 75, "volkoren pasta (ongekookt)", "wholewheat pasta (uncooked)"),
      i("kipfilet", 100, "kipfilet", "chicken breast"),
      i("cherrytomaat", 100, "cherrytomaatjes", "cherry tomatoes"),
      i("spinazie", 75, "verse spinazie", "fresh spinach"),
      i("pesto", 15, "pesto (1 eetlepel)", "pesto (1 tablespoon)"),
    ],
    extras: [t("knoflook", "garlic"), t("peper", "black pepper")],
    steps: [
      t("Kook de pasta beetgaar volgens de verpakking.", "Cook the pasta until al dente according to the packet."),
      t(
        "Snijd de kip in blokjes en bak in een antiaanbakpan in 6 tot 8 minuten gaar. Voeg de knoflook en gehalveerde tomaatjes toe en bak 2 minuten mee.",
        "Dice the chicken and fry in a non-stick frying pan for 6 to 8 minutes until cooked through. Add the garlic and halved tomatoes and cook for 2 minutes.",
      ),
      t("Roer de spinazie erdoor en laat hem in 1 minuut slinken.", "Stir in the spinach and let it wilt for 1 minute."),
      t("Giet de pasta af, schep hem door de kip en groente en roer de pesto erdoor. Breng op smaak met peper.", "Drain the pasta, toss it with the chicken and vegetables and stir in the pesto. Season with pepper."),
    ],
  },
  {
    slug: "curry-tofu-groente-kokosmelk",
    category: "avondeten",
    title: t("Curry met tofu, groente en kokosmelk", "Tofu and vegetable curry with coconut milk"),
    minutes: 25,
    servings: 4,
    mealPrep: true,
    vegetarian: true,
    ingredients: [
      i("zilvervliesrijstOngekookt", 50, "zilvervliesrijst (ongekookt)", "brown rice (uncooked)"),
      i("tofu", 150, "tofu (naturel)", "plain tofu"),
      i("olijfolie", 5, "olie (om te bakken)", "oil (for frying)"),
      i("wokgroente", 200, "verse wokgroente", "fresh stir-fry vegetables"),
      i("kokosmelkLight", 75, "kokosmelk light", "light coconut milk"),
    ],
    extras: [t("kerriepoeder (1 theelepel per portie)", "curry powder (1 teaspoon per portion)"), t("knoflook", "garlic"), t("verse gember", "fresh ginger"), t("limoensap", "lime juice"), t("verse koriander (optioneel)", "fresh coriander (optional)")],
    steps: [
      t("Kook de zilvervliesrijst gaar volgens de verpakking.", "Cook the brown rice according to the packet."),
      t(
        "Dep de tofu droog met keukenpapier en snijd hem in blokjes. Bak de blokjes in de olie in 6 tot 8 minuten goudbruin en schep ze uit de pan.",
        "Pat the tofu dry with kitchen paper and cut it into cubes. Fry in the oil for 6 to 8 minutes until golden, then lift out of the pan.",
      ),
      t(
        "Bak de knoflook, geraspte gember en kerriepoeder 1 minuut in dezelfde pan. Voeg de wokgroente toe en roerbak 3 minuten.",
        "Fry the garlic, grated ginger and curry powder in the same pan for 1 minute. Add the vegetables and stir-fry for 3 minutes.",
      ),
      t(
        "Schenk de kokosmelk erbij, doe de tofu terug in de pan en laat 5 minuten zachtjes koken. Maak af met limoensap en koriander en serveer met de rijst.",
        "Pour in the coconut milk, return the tofu to the pan and simmer gently for 5 minutes. Finish with lime juice and coriander and serve with the rice.",
      ),
    ],
    storage: t(
      "Laat de curry en rijst snel afkoelen. Koelkast: maximaal 2 dagen. Vriezer: ja (de groente wordt wat zachter). Verwarm tot alles gloeiend heet is.",
      "Cool the curry and rice quickly. Fridge: up to 2 days. Freezer: yes (the vegetables soften a little). Reheat until piping hot.",
    ),
  },
  {
    slug: "shakshuka-paprika-feta",
    category: "avondeten",
    title: t("Shakshuka met paprika, feta en volkoren brood", "Shakshuka with pepper, feta and wholemeal bread"),
    minutes: 25,
    servings: 2,
    mealPrep: false,
    vegetarian: true,
    ingredients: [
      i("olijfolie", 5, "olijfolie", "olive oil"),
      i("ui", 50, "ui (een halve)", "onion (half)"),
      i("paprika", 100, "rode paprika", "red pepper"),
      i("tomatenblokjes", 200, "tomatenblokjes (blik)", "chopped tomatoes (tin)"),
      i("ei", 110, "eieren (2 stuks)", "eggs (2)"),
      i("feta", 20, "feta", "feta"),
      i("volkorenBrood", 70, "volkoren brood (2 sneetjes)", "wholemeal bread (2 slices)"),
    ],
    extras: [
      t("knoflook", "garlic"),
      t("komijnpoeder", "ground cumin"),
      t("paprikapoeder", "paprika"),
      t("chilivlokken (optioneel)", "chilli flakes (optional)"),
      t("verse peterselie", "fresh parsley"),
      t("peper en zout", "salt and black pepper"),
    ],
    steps: [
      t("Snipper de ui en knoflook en snijd de paprika in reepjes.", "Finely chop the onion and garlic and slice the pepper."),
      t(
        "Verhit de olie in een koekenpan met deksel en bak de ui, knoflook en paprika 5 minuten. Roer de komijn en het paprikapoeder erdoor.",
        "Heat the oil in a frying pan with a lid and cook the onion, garlic and pepper for 5 minutes. Stir in the cumin and paprika.",
      ),
      t("Voeg de tomatenblokjes toe en laat 8 minuten inkoken. Breng op smaak met peper en zout.", "Add the chopped tomatoes and simmer for 8 minutes until thickened. Season with salt and pepper."),
      t(
        "Maak kuiltjes in de saus en breek er de eieren in. Leg de deksel op de pan en laat 6 tot 8 minuten zachtjes garen, tot het eiwit gestold is.",
        "Make small wells in the sauce and crack the eggs into them. Cover and cook gently for 6 to 8 minutes, until the whites have set.",
      ),
      t("Verkruimel de feta erover, strooi er peterselie op en eet de shakshuka met het brood.", "Crumble over the feta, scatter with parsley and eat with the bread."),
    ],
  },
  {
    slug: "kabeljauw-zoete-aardappel-broccoli",
    category: "avondeten",
    title: t("Kabeljauw uit de oven met zoete aardappel en broccoli", "Oven-baked cod with sweet potato and broccoli"),
    minutes: 30,
    servings: 2,
    mealPrep: false,
    vegetarian: false,
    ingredients: [
      i("zoeteAardappel", 200, "zoete aardappel", "sweet potato"),
      i("olijfolie", 10, "olijfolie", "olive oil"),
      i("kabeljauw", 150, "kabeljauwfilet", "cod fillet"),
      i("broccoli", 200, "broccoli", "broccoli"),
    ],
    extras: [t("citroen", "lemon"), t("paprikapoeder", "paprika"), t("knoflook", "garlic"), t("verse peterselie", "fresh parsley"), t("peper en zout", "salt and black pepper")],
    steps: [
      t(
        "Verwarm de oven voor op 200 °C. Schil de zoete aardappel, snijd hem in blokjes en meng met de helft van de olie, paprikapoeder, peper en een snufje zout. Rooster 25 minuten op een bakplaat met bakpapier.",
        "Preheat the oven to 200 °C. Peel the sweet potato, cut into cubes and toss with half the oil, paprika, pepper and a pinch of salt. Roast on a lined baking tray for 25 minutes.",
      ),
      t(
        "Leg de kabeljauw na 10 minuten in een ovenschaal, besprenkel met de rest van de olie, citroensap, knoflook en peper en bak 12 tot 15 minuten mee, tot de vis gaar is en makkelijk uit elkaar valt.",
        "After 10 minutes, put the cod in an ovenproof dish, drizzle with the rest of the oil, lemon juice, garlic and pepper and bake for 12 to 15 minutes, until it flakes easily.",
      ),
      t("Kook of stoom intussen de broccoli in 5 tot 6 minuten beetgaar.", "Meanwhile, boil or steam the broccoli for 5 to 6 minutes until just tender."),
      t("Strooi peterselie over de vis en serveer met de zoete aardappel en broccoli.", "Scatter parsley over the fish and serve with the sweet potato and broccoli."),
    ],
  },
  {
    slug: "linzenbolognese-volkoren-pasta",
    category: "avondeten",
    title: t("Linzenbolognese met volkoren pasta", "Lentil bolognese with wholewheat pasta"),
    minutes: 30,
    servings: 4,
    mealPrep: true,
    vegetarian: true,
    ingredients: [
      i("volkorenPastaOngekookt", 70, "volkoren pasta (ongekookt)", "wholewheat pasta (uncooked)"),
      i("olijfolie", 5, "olijfolie", "olive oil"),
      i("ui", 50, "ui (een halve)", "onion (half)"),
      i("wortel", 50, "wortel", "carrot"),
      i("courgette", 100, "courgette", "courgette"),
      i("tomatenblokjes", 150, "tomatenblokjes (blik)", "chopped tomatoes (tin)"),
      i("linzen", 150, "linzen (uit pot of blik, uitgelekt)", "lentils (jar or tin, drained)"),
      i("kaas30", 10, "geraspte kaas 30+", "grated reduced-fat cheese"),
    ],
    extras: [
      t("knoflook", "garlic"),
      t("gedroogde Italiaanse kruiden", "dried Italian herbs"),
      t("groentebouillonblokje (een kwart per portie)", "vegetable stock cube (quarter per portion)"),
      t("peper", "black pepper"),
    ],
    steps: [
      t("Snipper de ui en knoflook en snijd de wortel en courgette in kleine blokjes.", "Finely chop the onion and garlic and dice the carrot and courgette."),
      t(
        "Verhit de olie in een grote pan en bak de ui, knoflook en wortel 5 minuten. Voeg de courgette toe en bak 3 minuten mee.",
        "Heat the oil in a large pan and cook the onion, garlic and carrot for 5 minutes. Add the courgette and cook for 3 minutes.",
      ),
      t(
        "Voeg de tomatenblokjes, de uitgelekte linzen, de kruiden, het verkruimelde bouillonblokje en een scheutje water toe. Laat 15 minuten zachtjes pruttelen.",
        "Add the chopped tomatoes, drained lentils, herbs, crumbled stock cube and a splash of water. Simmer gently for 15 minutes.",
      ),
      t("Kook intussen de pasta beetgaar. Schep de saus over de pasta en strooi de kaas erover.", "Meanwhile, cook the pasta until al dente. Spoon the sauce over the pasta and sprinkle with the cheese."),
    ],
    storage: t(
      "Bewaar saus en pasta apart en laat ze snel afkoelen. Koelkast: maximaal 2 dagen. Vriezer: de saus wel, heel geschikt. Verwarm tot alles gloeiend heet is.",
      "Keep the sauce and pasta separate and cool them quickly. Fridge: up to 2 days. Freezer: the sauce, yes, ideal. Reheat until piping hot.",
    ),
  },
];

/** De pagina waar de recepten van een categorie staan. */
export const recipeCategoryPath: Record<RecipeCategory, string> = {
  ontbijt: "/recepten/eiwitrijk-ontbijt",
  lunch: "/recepten/eiwitrijke-lunch",
  avondeten: "/recepten/eiwitrijk-avondeten",
};

export const recipeCategoryName: Record<RecipeCategory, Text> = {
  ontbijt: t("Ontbijt", "Breakfast"),
  lunch: t("Lunch", "Lunch"),
  avondeten: t("Avondeten", "Dinner"),
};

/** De ingrediënten als [product, hoeveelheid per portie], voor sumNutrients. */
export function recipeItems(recipe: Recipe): [FoodKey, number][] {
  return recipe.ingredients.map((x) => [x.food, x.amount]);
}

/** Voedingswaarden per portie, afgerond voor weergave (kcal op 5, grammen op hele grammen). */
export function recipeNutrition(recipe: Recipe): Nutrients {
  return roundNutrients(sumNutrients(recipeItems(recipe)));
}

export function recipesIn(category: RecipeCategory): Recipe[] {
  return recipes.filter((r) => r.category === category);
}

export function recipeBySlug(slug: string): Recipe {
  const r = recipes.find((x) => x.slug === slug);
  if (!r) throw new Error(`Onbekend recept: ${slug}`);
  return r;
}

/** Link naar een recept op zijn categoriepagina (met anker). */
export function recipeHref(recipe: Recipe): string {
  return `${recipeCategoryPath[recipe.category]}#${recipe.slug}`;
}

/** Laagste en hoogste waarde (kcal of eiwit per portie) van een lijst recepten. */
export function nutritionRange(list: Recipe[], key: "kcal" | "protein"): [number, number] {
  const values = list.map((r) => recipeNutrition(r)[key]);
  return [Math.min(...values), Math.max(...values)];
}
