import type { Locale } from "@/i18n/config";

/**
 * Voedingswaarden van veelgegeten producten, per 100 gram (of 100 ml bij
 * dranken). Afgeronde gemiddelden van gangbare supermarktproducten; per merk
 * verschilt het wat. Koolhydraten zoals op Europese etiketten: zonder vezels.
 * Eén bron voor de calorietabel, de calorieën per product, de snacks, de
 * recepten en het weekmenu, zodat overal dezelfde getallen staan.
 */
export interface Nutrients {
  kcal: number;
  protein: number;
  carbs: number;
  /** Waarvan suikers (alleen waar het ertoe doet). */
  sugars?: number;
  fat: number;
  fiber: number;
}

export interface Portion {
  label: Record<Locale, string>;
  /** Gram (of ml bij dranken). */
  amount: number;
}

export interface Food {
  name: Record<Locale, string>;
  unit: "g" | "ml";
  per100: Nutrients;
  portions: Portion[];
}

const p = (nl: string, en: string, amount: number): Portion => ({ label: { nl, en }, amount });

export const foods = {
  // Fruit
  banaan: { name: { nl: "Banaan", en: "Banana" }, unit: "g", per100: { kcal: 89, protein: 1.1, carbs: 20, sugars: 12, fat: 0.3, fiber: 2.6 }, portions: [p("1 banaan (zonder schil)", "1 banana (peeled)", 120)] },
  appel: { name: { nl: "Appel", en: "Apple" }, unit: "g", per100: { kcal: 52, protein: 0.3, carbs: 11.5, sugars: 10, fat: 0.2, fiber: 2.4 }, portions: [p("1 appel", "1 apple", 150)] },
  mandarijn: { name: { nl: "Mandarijn", en: "Mandarin" }, unit: "g", per100: { kcal: 53, protein: 0.8, carbs: 11.5, sugars: 10.5, fat: 0.3, fiber: 1.8 }, portions: [p("1 mandarijn (zonder schil)", "1 mandarin (peeled)", 70)] },
  sinaasappel: { name: { nl: "Sinaasappel", en: "Orange" }, unit: "g", per100: { kcal: 47, protein: 0.9, carbs: 9.5, sugars: 9.4, fat: 0.1, fiber: 2.4 }, portions: [p("1 sinaasappel (zonder schil)", "1 orange (peeled)", 130)] },
  watermeloen: { name: { nl: "Watermeloen", en: "Watermelon" }, unit: "g", per100: { kcal: 30, protein: 0.6, carbs: 7.2, sugars: 6.2, fat: 0.2, fiber: 0.4 }, portions: [p("1 flinke plak (zonder schil)", "1 large slice (without rind)", 200)] },
  aardbeien: { name: { nl: "Aardbeien", en: "Strawberries" }, unit: "g", per100: { kcal: 32, protein: 0.7, carbs: 5.7, sugars: 4.9, fat: 0.3, fiber: 2 }, portions: [p("1 bakje", "1 punnet", 250), p("1 handje", "1 handful", 100)] },
  blauweBessen: { name: { nl: "Blauwe bessen", en: "Blueberries" }, unit: "g", per100: { kcal: 57, protein: 0.7, carbs: 12, sugars: 10, fat: 0.3, fiber: 2.4 }, portions: [p("1 handje", "1 handful", 75)] },
  peer: { name: { nl: "Peer", en: "Pear" }, unit: "g", per100: { kcal: 57, protein: 0.4, carbs: 12, sugars: 10, fat: 0.1, fiber: 3.1 }, portions: [p("1 peer", "1 pear", 170)] },
  kiwi: { name: { nl: "Kiwi", en: "Kiwi" }, unit: "g", per100: { kcal: 61, protein: 1.1, carbs: 11.7, sugars: 9, fat: 0.5, fiber: 3 }, portions: [p("1 kiwi (zonder schil)", "1 kiwi (peeled)", 75)] },
  druiven: { name: { nl: "Druiven", en: "Grapes" }, unit: "g", per100: { kcal: 69, protein: 0.7, carbs: 17, sugars: 15.5, fat: 0.2, fiber: 0.9 }, portions: [p("1 handje", "1 handful", 100)] },
  avocado: { name: { nl: "Avocado", en: "Avocado" }, unit: "g", per100: { kcal: 160, protein: 2, carbs: 1.9, sugars: 0.7, fat: 14.7, fiber: 6.7 }, portions: [p("1 halve avocado", "half an avocado", 70)] },
  // Groente
  broccoli: { name: { nl: "Broccoli", en: "Broccoli" }, unit: "g", per100: { kcal: 34, protein: 2.8, carbs: 4.1, fat: 0.4, fiber: 2.6 }, portions: [p("1 portie", "1 portion", 200)] },
  komkommer: { name: { nl: "Komkommer", en: "Cucumber" }, unit: "g", per100: { kcal: 15, protein: 0.7, carbs: 3.1, fat: 0.1, fiber: 0.5 }, portions: [p("halve komkommer", "half a cucumber", 150)] },
  tomaat: { name: { nl: "Tomaat", en: "Tomato" }, unit: "g", per100: { kcal: 18, protein: 0.9, carbs: 2.7, fat: 0.2, fiber: 1.2 }, portions: [p("1 tomaat", "1 tomato", 100)] },
  cherrytomaat: { name: { nl: "Cherrytomaatjes", en: "Cherry tomatoes" }, unit: "g", per100: { kcal: 18, protein: 0.9, carbs: 2.7, fat: 0.2, fiber: 1.2 }, portions: [p("1 handje", "1 handful", 100)] },
  spinazie: { name: { nl: "Spinazie", en: "Spinach" }, unit: "g", per100: { kcal: 23, protein: 2.9, carbs: 1.4, fat: 0.4, fiber: 2.2 }, portions: [p("1 zak", "1 bag", 200)] },
  paprika: { name: { nl: "Paprika", en: "Bell pepper" }, unit: "g", per100: { kcal: 31, protein: 1, carbs: 4, fat: 0.3, fiber: 2.1 }, portions: [p("1 paprika", "1 pepper", 150)] },
  wortel: { name: { nl: "Wortel", en: "Carrot" }, unit: "g", per100: { kcal: 41, protein: 0.9, carbs: 7, fat: 0.2, fiber: 2.8 }, portions: [p("1 wortel", "1 carrot", 80)] },
  courgette: { name: { nl: "Courgette", en: "Courgette" }, unit: "g", per100: { kcal: 17, protein: 1.2, carbs: 2.1, fat: 0.3, fiber: 1 }, portions: [p("1 courgette", "1 courgette", 250)] },
  sperziebonen: { name: { nl: "Sperziebonen", en: "Green beans" }, unit: "g", per100: { kcal: 31, protein: 1.8, carbs: 4.3, fat: 0.2, fiber: 2.7 }, portions: [p("1 portie", "1 portion", 200)] },
  ui: { name: { nl: "Ui", en: "Onion" }, unit: "g", per100: { kcal: 40, protein: 1.1, carbs: 7.6, fat: 0.1, fiber: 1.7 }, portions: [p("1 ui", "1 onion", 100)] },
  champignons: { name: { nl: "Champignons", en: "Mushrooms" }, unit: "g", per100: { kcal: 22, protein: 3.1, carbs: 2.3, fat: 0.3, fiber: 1 }, portions: [p("1 bakje", "1 punnet", 250)] },
  sla: { name: { nl: "Sla (gemengd)", en: "Mixed salad leaves" }, unit: "g", per100: { kcal: 17, protein: 1.3, carbs: 1.8, fat: 0.2, fiber: 1.8 }, portions: [p("1 handje", "1 handful", 50)] },
  wokgroente: { name: { nl: "Wokgroente (vers)", en: "Stir-fry vegetables (fresh)" }, unit: "g", per100: { kcal: 30, protein: 1.8, carbs: 4, fat: 0.3, fiber: 2.2 }, portions: [p("1 zak", "1 bag", 400)] },
  // Granen, brood en aardappelen
  havermout: { name: { nl: "Havermout", en: "Oats" }, unit: "g", per100: { kcal: 370, protein: 13, carbs: 59, sugars: 1, fat: 7, fiber: 10 }, portions: [p("1 portie (4 eetlepels)", "1 portion (4 tablespoons)", 40)] },
  muesli: { name: { nl: "Muesli (zonder toegevoegde suiker)", en: "Muesli (no added sugar)" }, unit: "g", per100: { kcal: 370, protein: 10, carbs: 60, sugars: 12, fat: 7, fiber: 8 }, portions: [p("1 portie", "1 portion", 40)] },
  volkorenBrood: { name: { nl: "Volkoren brood", en: "Wholemeal bread" }, unit: "g", per100: { kcal: 230, protein: 10, carbs: 39, sugars: 3, fat: 3, fiber: 7 }, portions: [p("1 snee", "1 slice", 35)] },
  witBrood: { name: { nl: "Wit brood", en: "White bread" }, unit: "g", per100: { kcal: 260, protein: 8.5, carbs: 48, sugars: 4, fat: 3, fiber: 2.7 }, portions: [p("1 snee", "1 slice", 35)] },
  volkorenWrap: { name: { nl: "Volkoren wrap", en: "Wholemeal wrap" }, unit: "g", per100: { kcal: 300, protein: 9, carbs: 48, fat: 6, fiber: 6 }, portions: [p("1 wrap", "1 wrap", 60)] },
  rijstwafel: { name: { nl: "Rijstwafel", en: "Rice cake" }, unit: "g", per100: { kcal: 380, protein: 8, carbs: 80, fat: 3, fiber: 3 }, portions: [p("1 rijstwafel", "1 rice cake", 8)] },
  rijstOngekookt: { name: { nl: "Rijst (ongekookt)", en: "Rice (uncooked)" }, unit: "g", per100: { kcal: 355, protein: 7, carbs: 78, fat: 0.6, fiber: 1.3 }, portions: [p("1 portie", "1 portion", 75)] },
  rijstGekookt: { name: { nl: "Rijst (gekookt)", en: "Rice (cooked)" }, unit: "g", per100: { kcal: 130, protein: 2.7, carbs: 28, fat: 0.3, fiber: 0.4 }, portions: [p("1 portie (75 g ongekookt)", "1 portion (75 g uncooked)", 200)] },
  zilvervliesrijstOngekookt: { name: { nl: "Zilvervliesrijst (ongekookt)", en: "Brown rice (uncooked)" }, unit: "g", per100: { kcal: 355, protein: 7.5, carbs: 73, fat: 2.7, fiber: 3.5 }, portions: [p("1 portie", "1 portion", 75)] },
  pastaOngekookt: { name: { nl: "Pasta (ongekookt)", en: "Pasta (uncooked)" }, unit: "g", per100: { kcal: 355, protein: 12.5, carbs: 70, sugars: 3, fat: 1.5, fiber: 3 }, portions: [p("1 portie", "1 portion", 80)] },
  volkorenPastaOngekookt: { name: { nl: "Volkoren pasta (ongekookt)", en: "Wholewheat pasta (uncooked)" }, unit: "g", per100: { kcal: 345, protein: 13, carbs: 62, fat: 2.5, fiber: 8 }, portions: [p("1 portie", "1 portion", 80)] },
  pastaGekookt: { name: { nl: "Pasta (gekookt)", en: "Pasta (cooked)" }, unit: "g", per100: { kcal: 155, protein: 5.8, carbs: 30, fat: 0.9, fiber: 1.8 }, portions: [p("1 portie (80 g ongekookt)", "1 portion (80 g uncooked)", 180)] },
  quinoaOngekookt: { name: { nl: "Quinoa (ongekookt)", en: "Quinoa (uncooked)" }, unit: "g", per100: { kcal: 370, protein: 14, carbs: 57, fat: 6, fiber: 7 }, portions: [p("1 portie", "1 portion", 60)] },
  couscousOngekookt: { name: { nl: "Volkoren couscous (ongekookt)", en: "Wholewheat couscous (uncooked)" }, unit: "g", per100: { kcal: 355, protein: 12.5, carbs: 65, fat: 1.5, fiber: 7 }, portions: [p("1 portie", "1 portion", 60)] },
  aardappel: { name: { nl: "Aardappelen (gekookt)", en: "Potatoes (boiled)" }, unit: "g", per100: { kcal: 80, protein: 2, carbs: 17, fat: 0.1, fiber: 1.8 }, portions: [p("1 portie (± 4 middelgrote)", "1 portion (± 4 medium)", 200)] },
  krieltjes: { name: { nl: "Krieltjes", en: "Baby potatoes" }, unit: "g", per100: { kcal: 80, protein: 2, carbs: 17, fat: 0.1, fiber: 1.8 }, portions: [p("1 portie", "1 portion", 200)] },
  zoeteAardappel: { name: { nl: "Zoete aardappel", en: "Sweet potato" }, unit: "g", per100: { kcal: 86, protein: 1.6, carbs: 17, sugars: 4, fat: 0.1, fiber: 3 }, portions: [p("1 zoete aardappel", "1 sweet potato", 200)] },
  // Zuivel en eieren
  ei: { name: { nl: "Ei", en: "Egg" }, unit: "g", per100: { kcal: 143, protein: 12.6, carbs: 0.7, fat: 9.5, fiber: 0 }, portions: [p("1 ei (zonder schaal)", "1 egg (without shell)", 55)] },
  kwarkMager: { name: { nl: "Magere kwark", en: "Low-fat quark" }, unit: "g", per100: { kcal: 55, protein: 8.5, carbs: 4, sugars: 4, fat: 0.1, fiber: 0 }, portions: [p("1 bakje", "1 tub", 250), p("1 schaaltje", "1 bowl", 150)] },
  skyr: { name: { nl: "Skyr (naturel)", en: "Skyr (plain)" }, unit: "g", per100: { kcal: 63, protein: 10.5, carbs: 4, sugars: 4, fat: 0.2, fiber: 0 }, portions: [p("1 schaaltje", "1 bowl", 150)] },
  yoghurtMager: { name: { nl: "Magere yoghurt", en: "Low-fat yoghurt" }, unit: "g", per100: { kcal: 37, protein: 4, carbs: 4.3, sugars: 4.3, fat: 0.1, fiber: 0 }, portions: [p("1 schaaltje", "1 bowl", 150)] },
  griekseYoghurt: { name: { nl: "Griekse yoghurt (10% vet)", en: "Greek yoghurt (10% fat)" }, unit: "g", per100: { kcal: 120, protein: 4.5, carbs: 4, sugars: 4, fat: 10, fiber: 0 }, portions: [p("1 schaaltje", "1 bowl", 150)] },
  huttenkase: { name: { nl: "Hüttenkäse", en: "Cottage cheese" }, unit: "g", per100: { kcal: 100, protein: 11, carbs: 3, fat: 4.5, fiber: 0 }, portions: [p("1 bakje", "1 tub", 200), p("1 portie", "1 portion", 100)] },
  melkHalfvol: { name: { nl: "Halfvolle melk", en: "Semi-skimmed milk" }, unit: "ml", per100: { kcal: 46, protein: 3.5, carbs: 4.7, sugars: 4.7, fat: 1.5, fiber: 0 }, portions: [p("1 glas", "1 glass", 250)] },
  kaas30: { name: { nl: "Kaas 30+", en: "Reduced-fat cheese (30+)" }, unit: "g", per100: { kcal: 275, protein: 28, carbs: 0, fat: 18, fiber: 0 }, portions: [p("1 plak", "1 slice", 20)] },
  feta: { name: { nl: "Feta", en: "Feta" }, unit: "g", per100: { kcal: 265, protein: 14, carbs: 1, fat: 22, fiber: 0 }, portions: [p("1 portie", "1 portion", 30)] },
  mozzarellaLight: { name: { nl: "Mozzarella light", en: "Light mozzarella" }, unit: "g", per100: { kcal: 165, protein: 19, carbs: 1, fat: 9, fiber: 0 }, portions: [p("1 bol", "1 ball", 125)] },
  // Vlees, vis en vervangers
  kipfilet: { name: { nl: "Kipfilet (rauw)", en: "Chicken breast (raw)" }, unit: "g", per100: { kcal: 110, protein: 23, carbs: 0, fat: 1.5, fiber: 0 }, portions: [p("1 portie", "1 portion", 125)] },
  kalkoenfilet: { name: { nl: "Kalkoenfilet (rauw)", en: "Turkey breast (raw)" }, unit: "g", per100: { kcal: 105, protein: 24, carbs: 0, fat: 1, fiber: 0 }, portions: [p("1 portie", "1 portion", 125)] },
  rundergehakt: { name: { nl: "Mager rundergehakt (rauw)", en: "Lean beef mince (raw)" }, unit: "g", per100: { kcal: 175, protein: 20, carbs: 0, fat: 10, fiber: 0 }, portions: [p("1 portie", "1 portion", 125)] },
  zalm: { name: { nl: "Zalmfilet (rauw)", en: "Salmon fillet (raw)" }, unit: "g", per100: { kcal: 200, protein: 20, carbs: 0, fat: 13, fiber: 0 }, portions: [p("1 filet", "1 fillet", 125)] },
  kabeljauw: { name: { nl: "Kabeljauwfilet (rauw)", en: "Cod fillet (raw)" }, unit: "g", per100: { kcal: 80, protein: 18, carbs: 0, fat: 0.7, fiber: 0 }, portions: [p("1 filet", "1 fillet", 150)] },
  tonijn: { name: { nl: "Tonijn in water (uitgelekt)", en: "Tuna in water (drained)" }, unit: "g", per100: { kcal: 110, protein: 25, carbs: 0, fat: 1, fiber: 0 }, portions: [p("1 blikje", "1 tin", 120)] },
  garnalen: { name: { nl: "Garnalen (gepeld, gaar)", en: "Prawns (peeled, cooked)" }, unit: "g", per100: { kcal: 90, protein: 20, carbs: 0, fat: 1, fiber: 0 }, portions: [p("1 portie", "1 portion", 100)] },
  kipfiletBeleg: { name: { nl: "Kipfilet (vleeswaren)", en: "Sliced chicken breast" }, unit: "g", per100: { kcal: 105, protein: 21, carbs: 1, fat: 1.5, fiber: 0 }, portions: [p("2 plakjes", "2 slices", 30)] },
  tofu: { name: { nl: "Tofu (naturel)", en: "Tofu (plain)" }, unit: "g", per100: { kcal: 120, protein: 13, carbs: 1.5, fat: 7, fiber: 1 }, portions: [p("1 portie", "1 portion", 150)] },
  tempeh: { name: { nl: "Tempeh", en: "Tempeh" }, unit: "g", per100: { kcal: 190, protein: 19, carbs: 4, fat: 11, fiber: 5 }, portions: [p("1 portie", "1 portion", 100)] },
  // Peulvruchten, noten en zaden
  linzen: { name: { nl: "Linzen (gekookt)", en: "Lentils (cooked)" }, unit: "g", per100: { kcal: 115, protein: 9, carbs: 13, fat: 0.4, fiber: 8 }, portions: [p("1 portie", "1 portion", 150)] },
  kikkererwten: { name: { nl: "Kikkererwten (uit blik, uitgelekt)", en: "Chickpeas (tinned, drained)" }, unit: "g", per100: { kcal: 120, protein: 7, carbs: 14, fat: 2.5, fiber: 6 }, portions: [p("1 portie", "1 portion", 150)] },
  zwarteBonen: { name: { nl: "Zwarte bonen (uit blik, uitgelekt)", en: "Black beans (tinned, drained)" }, unit: "g", per100: { kcal: 110, protein: 7.5, carbs: 13, fat: 0.5, fiber: 7 }, portions: [p("1 portie", "1 portion", 150)] },
  edamame: { name: { nl: "Edamame (gekookt)", en: "Edamame (cooked)" }, unit: "g", per100: { kcal: 120, protein: 12, carbs: 4, fat: 5, fiber: 5 }, portions: [p("1 schaaltje", "1 bowl", 100)] },
  hummus: { name: { nl: "Hummus", en: "Hummus" }, unit: "g", per100: { kcal: 290, protein: 7, carbs: 12, fat: 23, fiber: 6 }, portions: [p("2 eetlepels", "2 tablespoons", 30)] },
  pindakaas: { name: { nl: "Pindakaas (100% pinda)", en: "Peanut butter (100% peanuts)" }, unit: "g", per100: { kcal: 600, protein: 25, carbs: 13, sugars: 5, fat: 50, fiber: 6 }, portions: [p("dun besmeerd (1 snee)", "thinly spread (1 slice)", 15)] },
  amandelen: { name: { nl: "Amandelen", en: "Almonds" }, unit: "g", per100: { kcal: 600, protein: 21, carbs: 9, fat: 52, fiber: 12 }, portions: [p("1 handje", "1 handful", 25)] },
  walnoten: { name: { nl: "Walnoten", en: "Walnuts" }, unit: "g", per100: { kcal: 680, protein: 15, carbs: 7, fat: 65, fiber: 6.7 }, portions: [p("1 handje", "1 handful", 20)] },
  chiazaad: { name: { nl: "Chiazaad", en: "Chia seeds" }, unit: "g", per100: { kcal: 490, protein: 17, carbs: 8, fat: 31, fiber: 34 }, portions: [p("1 eetlepel", "1 tablespoon", 10)] },
  // Vetten, sauzen en overig
  olijfolie: { name: { nl: "Olijfolie", en: "Olive oil" }, unit: "g", per100: { kcal: 900, protein: 0, carbs: 0, fat: 100, fiber: 0 }, portions: [p("1 eetlepel", "1 tablespoon", 10)] },
  pesto: { name: { nl: "Pesto", en: "Pesto" }, unit: "g", per100: { kcal: 450, protein: 5, carbs: 6, fat: 45, fiber: 2 }, portions: [p("1 eetlepel", "1 tablespoon", 15)] },
  sojasaus: { name: { nl: "Sojasaus", en: "Soy sauce" }, unit: "ml", per100: { kcal: 60, protein: 8, carbs: 5, fat: 0, fiber: 0 }, portions: [p("1 eetlepel", "1 tablespoon", 15)] },
  tomatenblokjes: { name: { nl: "Tomatenblokjes (blik)", en: "Chopped tomatoes (tin)" }, unit: "g", per100: { kcal: 22, protein: 1.2, carbs: 3.5, fat: 0.2, fiber: 1 }, portions: [p("1 blik", "1 tin", 400)] },
  kokosmelkLight: { name: { nl: "Kokosmelk light", en: "Light coconut milk" }, unit: "ml", per100: { kcal: 75, protein: 0.6, carbs: 2.5, fat: 7, fiber: 0 }, portions: [p("1 pakje", "1 carton", 200)] },
  honing: { name: { nl: "Honing", en: "Honey" }, unit: "g", per100: { kcal: 320, protein: 0.3, carbs: 80, sugars: 80, fat: 0, fiber: 0 }, portions: [p("1 theelepel", "1 teaspoon", 7)] },
  pureChocolade: { name: { nl: "Pure chocolade (70%)", en: "Dark chocolate (70%)" }, unit: "g", per100: { kcal: 600, protein: 8, carbs: 34, sugars: 28, fat: 43, fiber: 11 }, portions: [p("2 blokjes", "2 squares", 10)] },
  popcorn: { name: { nl: "Popcorn (zelf gepoft, zonder boter)", en: "Popcorn (home-popped, no butter)" }, unit: "g", per100: { kcal: 390, protein: 13, carbs: 63, fat: 4.5, fiber: 15 }, portions: [p("1 kom", "1 bowl", 20)] },
  rozijnen: { name: { nl: "Rozijnen", en: "Raisins" }, unit: "g", per100: { kcal: 300, protein: 3, carbs: 75, sugars: 65, fat: 0.5, fiber: 4 }, portions: [p("1 doosje", "1 small box", 14)] },
  // Dranken
  bier: { name: { nl: "Bier (pils, 5%)", en: "Beer (lager, 5%)" }, unit: "ml", per100: { kcal: 43, protein: 0.5, carbs: 3.5, fat: 0, fiber: 0 }, portions: [p("1 glas (25 cl)", "1 glass (25 cl)", 250), p("1 flesje (30 cl)", "1 bottle (30 cl)", 300)] },
  bier00: { name: { nl: "Alcoholvrij bier (0.0)", en: "Alcohol-free beer (0.0)" }, unit: "ml", per100: { kcal: 20, protein: 0.3, carbs: 4.5, sugars: 2, fat: 0, fiber: 0 }, portions: [p("1 glas (25 cl)", "1 glass (25 cl)", 250)] },
  wijnRood: { name: { nl: "Rode wijn", en: "Red wine" }, unit: "ml", per100: { kcal: 85, protein: 0.1, carbs: 2.5, sugars: 0.6, fat: 0, fiber: 0 }, portions: [p("1 glas (10 cl)", "1 glass (10 cl)", 100), p("1 ruim glas (15 cl)", "1 large glass (15 cl)", 150)] },
  wijnWit: { name: { nl: "Witte wijn (droog)", en: "White wine (dry)" }, unit: "ml", per100: { kcal: 82, protein: 0.1, carbs: 2.6, sugars: 1, fat: 0, fiber: 0 }, portions: [p("1 glas (10 cl)", "1 glass (10 cl)", 100)] },
  cola: { name: { nl: "Cola (normaal)", en: "Cola (regular)" }, unit: "ml", per100: { kcal: 42, protein: 0, carbs: 10.6, sugars: 10.6, fat: 0, fiber: 0 }, portions: [p("1 blikje (33 cl)", "1 can (33 cl)", 330)] },
  sinaasappelsap: { name: { nl: "Sinaasappelsap", en: "Orange juice" }, unit: "ml", per100: { kcal: 45, protein: 0.7, carbs: 10, sugars: 8.5, fat: 0.2, fiber: 0.2 }, portions: [p("1 glas", "1 glass", 200)] },
} satisfies Record<string, Food>;

export type FoodKey = keyof typeof foods;

const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, sugars: 0, fat: 0, fiber: 0 };

/** Voedingswaarden voor een hoeveelheid (in gram of ml) van één product. */
export function nutrientsFor(key: FoodKey, amount: number): Nutrients {
  const n = foods[key].per100 as Nutrients;
  const f = amount / 100;
  return { kcal: n.kcal * f, protein: n.protein * f, carbs: n.carbs * f, sugars: (n.sugars ?? 0) * f, fat: n.fat * f, fiber: n.fiber * f };
}

/** Opgeteld voor een lijst van [product, hoeveelheid] (bijv. de ingrediënten van een recept). */
export function sumNutrients(items: [FoodKey, number][]): Nutrients {
  return items.reduce<Nutrients>((sum, [key, amount]) => {
    const n = nutrientsFor(key, amount);
    return {
      kcal: sum.kcal + n.kcal,
      protein: sum.protein + n.protein,
      carbs: sum.carbs + n.carbs,
      sugars: (sum.sugars ?? 0) + (n.sugars ?? 0),
      fat: sum.fat + n.fat,
      fiber: sum.fiber + n.fiber,
    };
  }, ZERO);
}

/** Afronden voor weergave: kcal op 5, grammen op hele grammen (onder 10 gram op 0,5). */
export function roundNutrients(n: Nutrients): Nutrients {
  const g = (x: number) => (x < 10 ? Math.round(x * 2) / 2 : Math.round(x));
  return { kcal: Math.round(n.kcal / 5) * 5, protein: g(n.protein), carbs: g(n.carbs), sugars: g(n.sugars ?? 0), fat: g(n.fat), fiber: g(n.fiber) };
}
