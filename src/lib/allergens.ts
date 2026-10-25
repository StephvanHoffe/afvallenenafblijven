import { allergyOptions, type Intake } from "@/lib/intake";
import type { NutritionPlan } from "@/lib/ai/schemas";

/**
 * Controle op allergenen in een voedingsschema. Het model krijgt de
 * allergieën al mee, maar we vertrouwen daar niet blind op: elk ingrediënt,
 * gerecht, alternatief en elke regel op de boodschappenlijst wordt hier
 * nagelopen op woorden die op een opgegeven allergeen wijzen. Bij een treffer
 * maakt het model een nieuwe versie; lukt dat niet, dan wordt het schema niet
 * geleverd.
 *
 * Bewust ruim: liever een keer te veel opnieuw laten maken dan een allergeen
 * missen. Een product dat expliciet "glutenvrij", "lactosevrij" (enz.) of
 * plantaardig is, telt niet als treffer. Werkt voor Nederlandse en Engelse
 * schema's.
 */

type AllergyKey = keyof typeof allergyOptions;

interface Rule {
  label: string;
  /** Woorddelen: een woord bevat dit (ook in samenstellingen, zoals "speltbrood"). */
  stems: string[];
  /** Hele woorden: alleen precies dit woord (te kort voor een woorddeel, zoals "ei"). */
  words?: string[];
  /** Woordgroepen, zoals "soy sauce". */
  phrases?: string[];
  /** Woorden met een woorddeel die géén allergeen zijn, zoals "bloemkool" bij "bloem". */
  except?: string[];
  /** Een woord ervóór maakt het geen allergeen, zoals "rice" in "rice noodles". */
  after?: string[];
  /** Een woord erachter maakt het geen allergeen, zoals "beans" in "butter beans". */
  before?: string[];
  /** Woorddelen in "…vrij"/"… free" waarmee een product expliciet vrij is van dit allergeen. */
  family: string[];
  /** Ook plantaardige of veganistische varianten tellen als vrij (zuivel, ei, vis). */
  plantFree?: boolean;
}

const RULES: Record<AllergyKey, Rule> = {
  gluten: {
    label: "gluten",
    stems: [
      "tarwe", "spelt", "rogge", "gerst", "bulgur", "couscous", "seitan", "paneermeel", "panko", "brood", "boterham",
      "wrap", "tortilla", "pita", "beschuit", "cracker", "knackebrod", "croissant", "pannenkoek", "poffertje",
      "wentelteef", "tosti", "sandwich", "pizza", "focaccia", "ciabatta", "baguette", "pistolet", "bruschetta",
      "crostini", "pretzel", "brownie", "pasta", "spaghetti", "penne", "macaroni", "fusilli", "tagliatelle", "lasagne", "ravioli",
      "tortellini", "gnocchi", "orzo", "noedel", "bloem", "meel", "haver", "muesli", "granola", "cruesli", "sojasaus",
      "ketjap", "bier", "freekeh", "farro", "kamut", "biscuit", "koek", "wafel", "crouton",
      "wheat", "flour", "bread", "barley", "oatmeal", "noodle", "bagel", "pastry", "semolina", "pancake", "waffle",
      "cookie", "muffin", "cake", "pitta", "breadcrumb", "couscous", "porridge",
    ],
    words: ["mie", "naan", "toast", "rye", "oat", "oats", "beer", "pie"],
    phrases: ["soy sauce"],
    except: [
      "bloemkool", "zonnebloem", "boekweit", "buckwheat", "maismeel", "maisbloem", "maizena", "rijstmeel", "rijstbloem",
      "rijstnoedel", "rijstwafel", "rijstcracker", "maiswafel", "maiscracker", "maistortilla", "glasnoedel",
      "amandelmeel", "kokosmeel", "kikkererwtenmeel", "kikkererwtenbloem", "lijnzaadmeel", "aardappelmeel",
      "tapiocameel", "tomatenpasta", "currypasta", "kerriepasta", "notenpasta", "pindapasta", "sesampasta",
      "amandelpasta", "cashewpasta", "hazelnootpasta", "chilipasta", "misopasta", "gemberpasta", "knoflookpasta",
      "linzenpasta", "kikkererwtenpasta", "erwtenpasta", "studentenhaver", "tamari", "cauliflower", "rijstkoek",
      "maiskoek", "pitahaya",
    ],
    after: [
      "rice", "corn", "glass", "almond", "coconut", "chickpea", "potato", "tapioca", "buckwheat", "rijst", "mais", "glas",
      "lettuce", "sla", "courgette", "zucchini", "konjac", "shirataki",
    ],
    family: ["gluten", "tarwe", "wheat"],
  },
  lactose: {
    label: "lactose (zuivel)",
    stems: [
      "melk", "yoghurt", "yogurt", "kwark", "quark", "skyr", "kaas", "room", "boter", "cremefraiche", "mascarpone", "ricotta",
      "mozzarella", "parmezaan", "parmigiano", "parmesan", "feta", "halloumi", "burrata", "brie", "camembert", "gouda",
      "cheddar", "emmentaler", "huttenkase", "labneh", "kefir", "zuivel", "caseine", "weiprote", "whey", "milk",
      "cheese", "butter", "ghee", "dairy", "custard", "paneer",
    ],
    words: ["vla", "wei", "cream", "creme"],
    except: [
      "pindakaas", "boterham", "boterbonen", "pindaboter", "notenboter", "amandelboter", "cashewboter", "cacaoboter",
      "kokosmelk", "amandelmelk", "havermelk", "sojamelk", "rijstmelk", "cashewmelk", "erwtenmelk", "hazelnootmelk",
      "kokosyoghurt", "sojayoghurt", "haveryoghurt", "amandelyoghurt", "kokosroom", "sojaroom", "haverroom",
      "sojakwark", "kokoskwark", "haverkwark", "mushroom", "paneermeel", "butternut", "butterhead", "botersla",
    ],
    after: [
      "peanut", "almond", "cashew", "nut", "cocoa", "coconut", "oat", "soy", "soya", "rice", "hazelnut", "pea", "shea",
      "kokos", "haver", "soja", "rijst", "amandel", "pinda",
    ],
    before: ["beans", "bean", "lettuce", "squash"],
    family: ["lactose", "zuivel", "melk", "dairy", "milk"],
    plantFree: true,
  },
  noten: {
    label: "noten",
    stems: [
      "noot", "noten", "walnoot", "hazelnoot", "cashew", "amandel", "pecan", "paranoot", "pistache", "macadamia",
      "marsepein", "praline", "nougat", "frangipane", "studentenhaver", "pesto", "nutella", "walnut", "hazelnut",
      "almond", "pistachio", "marzipan", "trailmix",
    ],
    words: ["nut", "nuts"],
    phrases: ["brazil nut", "nut butter", "mixed nuts", "trail mix"],
    except: ["nootmuskaat", "muskaatnoot", "kokosnoot", "apenoot", "pindanoot", "nutmeg", "coconut", "butternut", "doughnut", "donut"],
    family: ["noten", "noot", "nut"],
  },
  pinda: {
    label: "pinda",
    stems: ["pinda", "sate", "apenoot", "peanut", "groundnut", "arachide", "satay"],
    family: ["pinda", "peanut"],
  },
  ei: {
    label: "ei",
    stems: [
      "eier", "roerei", "spiegelei", "scharrelei", "kippenei", "eidooier", "omelet", "mayonaise", "mayonnaise", "aioli",
      "hollandaise", "frittata", "quiche", "meringue", "shakshuka", "wentelteef", "pannenkoek", "pancake", "dooier",
    ],
    words: ["ei", "eieren", "eitje", "eitjes", "mayo", "egg", "eggs", "scrambled"],
    family: ["ei", "egg"],
    plantFree: true,
  },
  soja: {
    label: "soja",
    stems: ["soja", "edamame", "tofu", "tempeh", "miso", "ketjap", "tamari", "soy"],
    except: ["tamarind"],
    family: ["soja", "soy"],
  },
  vis: {
    label: "vis",
    stems: [
      "vis", "zalm", "tonijn", "kabeljauw", "makreel", "haring", "sardi", "ansjovis", "forel", "koolvis", "pangasius",
      "tilapia", "zeebaars", "dorade", "kibbeling", "lekkerbek", "surimi", "worcester", "pollak", "wijting", "bokking",
      "paling", "zeeduivel", "tarbot", "snoekbaars", "schol", "fish", "salmon", "tuna", "mackerel", "herring",
      "anchov", "trout", "pollock", "haddock", "seabass", "plaice", "halibut",
    ],
    words: ["heek", "poon", "cod", "hake"],
    phrases: ["sea bass"],
    family: ["vis", "fish"],
    plantFree: true,
  },
  schaaldieren: {
    label: "schaal- en schelpdieren",
    stems: [
      "garnaal", "garnalen", "kreeft", "krab", "langoustine", "mossel", "oester", "jakobsschelp", "coquille", "inktvis",
      "calamar", "octopus", "kokkel", "scampi", "schaaldier", "schelpdier", "kroepoek", "surimi", "vongole", "shrimp",
      "prawn", "lobster", "crab", "mussel", "oyster", "scallop", "squid", "crayfish", "shellfish", "cockle",
    ],
    words: ["clam", "clams"],
    except: ["oesterzwam"],
    before: ["mushroom", "mushrooms"],
    family: ["schaal", "schelp", "shellfish"],
    plantFree: true,
  },
};

/** Bekende allergenen die klanten vaak zelf invullen, met de woorden die erop wijzen. */
const EXTRA: Record<string, string[]> = {
  sesam: ["sesam", "tahin", "hummus", "humus", "sesame", "gomasio"],
  selderij: ["selderij", "selder", "celery", "celeriac"],
  mosterd: ["mosterd", "mustard"],
  lupine: ["lupine", "lupin"],
};

/** Vrij ingevulde allergieën die op een vast allergeen wijzen. */
const ALIASES: Record<string, AllergyKey> = {
  gluten: "gluten", tarwe: "gluten", glutenintolerantie: "gluten", coeliakie: "gluten", wheat: "gluten",
  lactose: "lactose", melk: "lactose", koemelk: "lactose", zuivel: "lactose", dairy: "lactose", milk: "lactose",
  noten: "noten", noot: "noten", nuts: "noten", nut: "noten",
  pinda: "pinda", pindas: "pinda", peanut: "pinda", peanuts: "pinda",
  ei: "ei", eieren: "ei", egg: "ei", eggs: "ei",
  soja: "soja", soy: "soja",
  vis: "vis", fish: "vis",
  schaaldieren: "schaaldieren", schelpdieren: "schaaldieren", shellfish: "schaaldieren",
};

/** Antwoorden die geen allergie zijn. */
const NONE = new Set(["geen", "nee", "niets", "niks", "n v t", "nvt", "none", "no", "nothing", "n a", "na"]);

const FILLER =
  /^(?:ik ben |ik heb |ik kan niet tegen |een |licht |lichte |ernstige |allergisch voor |allergie voor |allergie |allergieen |intolerant voor |intolerantie voor |overgevoelig voor |geen |allergic to |intolerant to |allergy to |no |mild |severe )+/;

const SUFFIX = / (?:allergie|intolerantie|overgevoeligheid|allergy|intolerance)$/;

/** Kleine letters, zonder accenten en leestekens, met losse woorden. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/'s\b/g, "s")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const PLANT = ["plantaardig", "plantaardige", "vegan", "veganistisch", "veganistische", "plant", "based"];
const WITHOUT = ["zonder", "geen", "without", "no", "non"];

function freeMarker(token: string, next: string | undefined, rule: Rule): boolean {
  const own = rule.family.some((f) => token.includes(f));
  if (own && token.includes("vrij")) return true;
  if (own && next === "free") return true;
  return false;
}

/** Vindt het eerste woord in de tekst dat op dit allergeen wijst (of null). */
function findIn(text: string, rule: Rule): string | null {
  const norm = normalize(text);
  if (!norm) return null;
  const tokens = norm.split(" ");
  // Een product dat expliciet vrij is van dit allergeen ("glutenvrij brood", "lactose-free yoghurt").
  if (tokens.some((t, i) => freeMarker(t, tokens[i + 1], rule))) return null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const prev = tokens[i - 1];
    if (prev && WITHOUT.includes(prev)) continue;
    if (rule.plantFree && prev && PLANT.includes(prev)) continue;
    if (prev && rule.after?.includes(prev)) continue;
    if (rule.before?.includes(tokens[i + 1])) continue;
    if (rule.except?.some((e) => t.includes(e))) continue;
    if (rule.words?.includes(t)) return t;
    if (rule.stems.some((s) => t.includes(s))) return t;
  }
  const padded = ` ${norm} `;
  const phrase = rule.phrases?.find((p) => padded.includes(` ${p} `));
  return phrase ?? null;
}

/** De regels die gelden voor deze klant: de aangevinkte allergieën plus wat de klant zelf heeft ingevuld. */
export function allergenRules(intake: Pick<Intake, "allergies" | "otherAllergies">): Rule[] {
  const keys = new Set<AllergyKey>(intake.allergies);
  const extra: Rule[] = [];
  const parts = (intake.otherAllergies ?? "")
    .split(/[,;/\n+&]|\s(?:en|and|of|or)\s/i)
    .map((p) => normalize(p).replace(FILLER, "").replace(SUFFIX, "").trim())
    .filter((p) => p.length >= 2 && p.length <= 30 && !NONE.has(p));
  for (const part of parts) {
    const aliases = part.split(" ").map((w) => ALIASES[w] ?? ALIASES[w.replace(/s$/, "")]).filter((a) => a !== undefined);
    if (aliases.length > 0) {
      for (const a of aliases) keys.add(a);
      continue;
    }
    const known = Object.entries(EXTRA).find(([k]) => part.includes(k));
    if (known) {
      extra.push({ label: known[0], stems: known[1], family: [known[0]] });
      continue;
    }
    // Iets anders, zoals "kiwi": zoek op het woord zelf (zonder meervouds-s), mits kort genoeg om zinnig te zoeken.
    if (part.split(" ").length <= 2 && part.length >= 3) {
      const stem = part.length > 4 ? part.replace(/(?:en|s)$/, "") : part;
      // "tomaat" staat in een schema ook als "tomaten".
      const short = stem.replace(/([aeou])\1([^aeiou])$/, "$1$2");
      extra.push({ label: part, stems: short !== stem ? [stem, short] : [stem], family: [stem] });
    }
  }
  return [...[...keys].map((k) => RULES[k]), ...extra];
}

/**
 * Loopt het voedingsschema na op de allergenen van de klant. Geeft per
 * treffer een korte omschrijving terug (leeg als alles in orde is).
 */
export function allergenProblems(plan: NutritionPlan, intake: Pick<Intake, "allergies" | "otherAllergies">): string[] {
  const rules = allergenRules(intake);
  if (rules.length === 0) return [];
  const texts: { where: string; text: string }[] = [];
  for (const day of plan.days) {
    for (const meal of day.meals) {
      const where = `${day.day}, ${meal.moment} (${meal.name})`;
      texts.push({ where, text: meal.name });
      for (const i of meal.ingredients) texts.push({ where, text: i.item });
      texts.push({ where: `${where}, alternatief`, text: meal.swap });
    }
  }
  for (const s of plan.snackIdeas) texts.push({ where: "Tussendoortjes", text: s.name });
  for (const group of plan.shoppingList) for (const i of group.items) texts.push({ where: "Boodschappenlijst", text: i.item });

  const problems: string[] = [];
  const seen = new Set<string>();
  for (const { where, text } of texts) {
    for (const rule of rules) {
      const hit = findIn(text, rule);
      if (!hit) continue;
      const key = `${normalize(text)}|${rule.label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      problems.push(`${where}: "${text}" bevat waarschijnlijk ${rule.label} ("${hit}"), en daar is de klant allergisch of intolerant voor.`);
    }
  }
  if (problems.length === 0) return [];
  const shown = problems.slice(0, 15);
  if (problems.length > shown.length) shown.push(`En nog ${problems.length - shown.length} vergelijkbare treffers.`);
  shown.push(
    "Vervang deze producten door een product zonder dit allergeen. Gebruik je bewust een allergeenvrije variant, noem die dan expliciet in de naam (bijvoorbeeld \"glutenvrij brood\", \"lactosevrije kwark\" of \"notenvrije pesto\").",
  );
  return shown;
}

/** Of een losse tekst (bijv. een aanpassing na een weegmoment) een allergeen van de klant noemt. */
export function mentionsAllergen(text: string, intake: Pick<Intake, "allergies" | "otherAllergies">): boolean {
  return allergenRules(intake).some((rule) => findIn(text, rule) !== null);
}
