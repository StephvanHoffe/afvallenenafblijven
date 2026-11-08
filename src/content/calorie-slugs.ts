/**
 * De adressen van de pagina's "calorieën per product" (/calorieen/<slug>).
 * Een losse, kleine lijst zodat src/proxy.ts onbekende adressen direct een
 * echte 404 kan geven, zonder de hele voedingstabel in te laden.
 * src/content/calorie-products.ts controleert dat elk product hierin staat.
 */
export const calorieProductSlugs = [
  "banaan",
  "ei",
  "appel",
  "bier",
  "mandarijn",
  "watermeloen",
  "avocado",
  "havermout",
  "rijst",
  "aardappel",
  "wijn",
  "brood",
  "pasta",
  "pindakaas",
  "kwark",
] as const;

export type CalorieProductSlug = (typeof calorieProductSlugs)[number];

export function isCalorieProductSlug(slug: string): slug is CalorieProductSlug {
  return (calorieProductSlugs as readonly string[]).includes(slug);
}
