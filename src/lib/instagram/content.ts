import { z } from "zod";
import { lowestMonthlyPrice } from "@/config/pricing";
import { site } from "@/config/site";
import { euro, formatDate } from "@/lib/format";

/**
 * Wat Claude maakt voor een Instagram-post: de slides (de afbeeldingen), het
 * bijschrift, de hashtags en een beschrijving voor slechtzienden. De slides
 * worden daarna in de huisstijl getekend (src/lib/instagram/render.tsx).
 */

/** De foto's in public/images (Unsplash, vrij te gebruiken) die Claude als achtergrond kan kiezen. */
export const PHOTO_IDS = [
  "bowl-colorful",
  "bowl-dark",
  "bowl-quinoa",
  "bowl-salmon",
  "breakfast-table",
  "chicken-plate",
  "coach-bench",
  "cooking-friends",
  "cooking-woman",
  "deadlift",
  "dumbbells",
  "food-flatlay",
  "group-training",
  "gym-woman-cable",
  "hero-workout-home",
  "ingredients-board",
  "running",
  "salad-jar",
  "vegetables",
  "woman-overhead-press",
  "yoga-sunset",
] as const;

export type PhotoId = (typeof PHOTO_IDS)[number];

export const PHOTOS: Record<PhotoId, string> = {
  "bowl-colorful": "Kleurrijke bowl met avocado, kikkererwten, tomaat, rode kool en zoete aardappel, van bovenaf op een houten tafel",
  "bowl-dark": "Bowl met quinoa, avocado, peultjes en kikkererwten op een donkere achtergrond, van bovenaf",
  "bowl-quinoa": "Lichte bowl met quinoa, sperziebonen en tomaatjes op een marmeren tafel, van bovenaf",
  "bowl-salmon": "Salade-bowl met gegrilde zalm, ei, maïs, tomaat en komkommer, van bovenaf",
  "breakfast-table": "Ontbijttafel met yoghurt, vers fruit, havermout, avocado en koffie",
  "chicken-plate": "Gegrilde kipfilet met gegrilde groenten en citroen op een houten plank",
  "coach-bench": "Personal trainer helpt iemand bij de bankdrukken in de sportschool",
  "cooking-friends": "Vrienden die samen koken in een lichte keuken",
  "cooking-woman": "Vrouw die lachend kookt in haar keuken, met een schaal citroenen",
  deadlift: "Close-up van een deadlift met een halter in de sportschool, donkere vloer",
  dumbbells: "Rek met dumbbells in de sportschool, onscherpe achtergrond",
  "food-flatlay": "Bord met ei, avocado, wortel, sla en radijs op een houten tafel, van bovenaf",
  "group-training": "Groepsles met vrouwen die oefeningen op een mat doen in een lichte zaal",
  "gym-woman-cable": "Vrouw die traint aan een kabelstation in de sportschool",
  "hero-workout-home": "Vrouw die thuis buikspieroefeningen doet op een mat in een lichte kamer",
  "ingredients-board": "Snijplank met verse ingrediënten: avocado, tomaatjes, eieren, champignons, lente-ui en spinazie",
  running: "Silhouetten van drie hardlopers in tegenlicht, blauwe lucht",
  "salad-jar": "Salade in een glazen pot (meal prep) met verse groenten ernaast",
  vegetables: "Grote verzameling verse groenten en fruit rond een houten plank",
  "woman-overhead-press": "Vrouw die een halter boven haar hoofd drukt in de sportschool, van achteren gezien",
  "yoga-sunset": "Silhouet van iemand die yoga doet bij zonsondergang aan zee",
};

export const POST_FORMATS = ["auto", "single", "carousel"] as const;
export type PostFormat = (typeof POST_FORMATS)[number];

export function isPostFormat(v: unknown): v is PostFormat {
  return typeof v === "string" && (POST_FORMATS as readonly string[]).includes(v);
}

export const formatLabels: Record<PostFormat, string> = {
  auto: "Claude kiest",
  single: "Eén afbeelding",
  carousel: "Carrousel (meerdere slides)",
};

export const SLIDE_KINDS = ["cover", "tip", "list", "quote", "cta"] as const;
export type SlideKind = (typeof SLIDE_KINDS)[number];

export const slideKindLabels: Record<SlideKind, string> = {
  cover: "Cover",
  tip: "Tip",
  list: "Lijst",
  quote: "Uitspraak",
  cta: "Afsluiter",
};

const slideSchema = z.object({
  kind: z
    .enum(SLIDE_KINDS)
    .describe(
      "cover: opvallende openingsslide met grote kop (altijd de eerste slide). tip: één genummerd inzicht met uitleg. list: een kop met 3-5 korte punten. quote: één krachtige uitspraak of mythe-ontkrachting. cta: afsluiter met een uitnodiging (alleen als laatste slide van een carrousel).",
    ),
  kicker: z.string().describe("Kort label boven de kop, hooguit 3 woorden, bijv. 'Voedingstip', 'Mythe' of 'Training'. Mag leeg zijn."),
  title: z.string().describe("De kop. Cover en quote: hooguit 50 tekens. Andere slides: hooguit 60 tekens. Geen emoji, geen hashtags."),
  body: z.string().describe("Toelichting van hooguit 180 tekens in één of twee korte zinnen. Leeg bij list. Geen emoji."),
  bullets: z.array(z.string()).describe("Alleen bij list: 3-5 punten van elk hooguit 55 tekens. Bij de andere soorten een lege lijst."),
  photo: z
    .enum([...PHOTO_IDS, "geen"])
    .describe("Achtergrondfoto voor een cover of quote, gekozen uit de lijst met foto's; 'geen' voor een vlak ontwerp in de huisstijl. Bij tip, list en cta altijd 'geen'."),
});

export const postContentSchema = z.object({
  slides: z
    .array(slideSchema)
    .describe("Eén slide voor een enkele afbeelding. Een carrousel heeft 4-8 slides: eerst een cover, dan de inhoud, en als laatste een cta."),
  caption: z
    .string()
    .describe(
      "Het bijschrift, zonder hashtags: een sterke eerste zin (die zie je vóór 'meer'), daarna de kern in korte alinea's (witregels ertussen) en een duidelijke afsluiter. Hooguit 1500 tekens. Spaarzaam emoji.",
    ),
  hashtags: z.array(z.string()).describe("3-5 relevante hashtags zonder #, zoals 'afvallen' of 'gezondeten'."),
  altText: z.string().describe("Beschrijving van de eerste afbeelding voor blinde en slechtziende mensen: wat je ziet en de tekst erop. Hooguit 300 tekens."),
});

export type PostContent = z.infer<typeof postContentSchema>;
export type Slide = PostContent["slides"][number];

/** Instagram staat hooguit 20 slides toe; meer dan 10 maakt een post zelden beter. */
export const MAX_SLIDES = 10;
/** Instagram toont sinds eind 2025 hooguit 5 hashtags per post. */
export const MAX_HASHTAGS = 5;
/** Maximale lengte van een bijschrift bij Instagram. */
export const MAX_CAPTION = 2200;

/** Een hashtag zonder #, spaties en leestekens ("#Gezond eten!" → "Gezondeten"). */
export function cleanHashtag(tag: string): string {
  return tag.replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 60);
}

/**
 * Maakt de inhoud veilig om te tekenen en te plaatsen: lengtes binnen de
 * grenzen, schone hashtags (uniek, hooguit 5), alleen bekende foto's, en een
 * carrousel van hooguit 10 slides. Wordt toegepast op wat Claude maakt en op
 * wat je zelf aanpast.
 */
export function normalizeContent(content: PostContent): PostContent {
  const seen = new Set<string>();
  const hashtags = content.hashtags
    .map(cleanHashtag)
    .filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()))
    .slice(0, MAX_HASHTAGS);
  const slides = content.slides.slice(0, MAX_SLIDES).map((s) => ({
    kind: s.kind,
    kicker: s.kicker.trim().slice(0, 40),
    title: s.title.trim().slice(0, 120),
    body: s.body.trim().slice(0, 320),
    bullets: s.kind === "list" ? s.bullets.map((b) => b.trim()).filter(Boolean).slice(0, 6).map((b) => b.slice(0, 90)) : [],
    photo: (PHOTO_IDS as readonly string[]).includes(s.photo) ? s.photo : "geen",
  }));
  const tags = hashtags.map((t) => `#${t}`).join(" ");
  const room = MAX_CAPTION - (tags ? tags.length + 2 : 0);
  return {
    slides,
    caption: content.caption.trim().slice(0, room),
    hashtags,
    altText: content.altText.trim().slice(0, 1000),
  };
}

/** Het volledige bijschrift zoals het op Instagram komt: tekst, witregel, hashtags. */
export function fullCaption(content: PostContent): string {
  const tags = content.hashtags.map((t) => `#${t}`).join(" ");
  return [content.caption, tags].filter(Boolean).join("\n\n").slice(0, MAX_CAPTION);
}

export const INSTAGRAM_SYSTEM_PROMPT = `Je bent de social-media-redacteur van "${site.name}", een Nederlands bedrijf dat persoonlijke voedings- en trainingsschema's verkoopt (los of als maandelijks opzegbaar abonnement), gemaakt op basis van een vragenlijst en elke 4 weken bijgesteld na een check-in. Je maakt complete Instagram-posts op basis van een korte opdracht van de eigenaar: de tekst op de afbeeldingen, het bijschrift, de hashtags en een beschrijving voor slechtzienden. De afbeeldingen worden automatisch in de huisstijl getekend (donkergroen, crème en limoen) op basis van jouw slides.

## Toon
- Warm, direct en nuchter. Spreek de lezer aan met je/jij. Geen hype, geen uitroeptekens achter elke zin.
- Begin bij wat de lezer herkent: frustratie, verspilde moeite, steeds opnieuw beginnen. Het ligt niet aan de lezer, maar aan de aanpak.
- Praktisch en concreet: liever één toepasbare tip dan vijf vage. Gebruik voorbeelden met gewone Nederlandse producten en maaltijden.
- Onderbouwd: geef alleen informatie die past bij de huidige wetenschappelijke consensus (bijv. Voedingscentrum, Gezondheidsraad). Twijfel je, laat het dan weg.

## Grenzen (altijd)
- Geen beloftes over resultaat ("10 kilo in 4 weken", "gegarandeerd"), geen voor-en-na-verhalen en geen verzonnen klantverhalen, reviews, cijfers of citaten van klanten.
- Niet over iemands lichaam oordelen en geen schaamte opwekken. Geen crashdiëten, geen extreem lage calorieën, geen detox, geen "verboden" voedingsmiddelen, geen supplementen aanprijzen.
- Geen medische claims of adviezen; bij medische vragen verwijs je naar de huisarts of een diëtist.
- Noem alleen feiten over ${site.name} die hieronder of in de opdracht staan. Verzin geen prijzen, kortingen of acties.

## Slides
- Een carrousel vertelt één verhaal: de cover maakt nieuwsgierig (een vraag, een herkenbare situatie of een belofte van waarde, geen clickbait), de slides daarna geven per slide één punt, de laatste slide is een cta.
- Houd de tekst op slides kort; de uitleg mag in het bijschrift. Respecteer de maximale lengtes, anders past de tekst niet op de afbeelding.
- Kies een foto die echt bij het onderwerp past (voeding bij voeding, training bij training). Gebruik 'geen' als geen enkele foto past.
- Een enkele afbeelding is één cover- of quote-slide met een sterke kop.

## Bijschrift
- De eerste zin moet de lezer laten stoppen met scrollen. Daarna de kern, in korte alinea's.
- Sluit af met een uitnodiging die bij de post past: opslaan voor later, delen met iemand, een vraag beantwoorden in de reacties, of "link in bio" voor een persoonlijk schema. Niet bij elke post verkopen; de meeste posts geven gewoon waarde.
- Links werken niet in een bijschrift: verwijs naar "de link in onze bio" of noem ${site.domain}.

## Taal
Schrijf in het Nederlands, tenzij de opdracht om een andere taal vraagt.`;

const photoList = PHOTO_IDS.map((id) => `- ${id}: ${PHOTOS[id]}`).join("\n");

/** Feiten die Claude mag gebruiken, zoals ze vandaag in de configuratie staan. */
function brandFacts(now: Date): string {
  const lines = [
    `- Website: ${site.domain}. Persoonlijke schema's vanaf ${euro(lowestMonthlyPrice())} per maand, maandelijks opzegbaar na de minimale looptijd. Het schema staat binnen 2 uur klaar.`,
    `- ${site.tagline}.`,
  ];
  if (site.guarantee.enabled) lines.push(`- Tevredenheidsgarantie: binnen ${site.guarantee.days} dagen je eerste betaling terug.`);
  for (const p of site.promotions) {
    if (!p.enabled || Date.parse(p.endsAt) < now.getTime()) continue;
    const max = Math.max(...Object.values(p.percentOff));
    lines.push(
      `- Actie "${p.label}" van ${formatDate(p.startsAt)} tot en met ${formatDate(p.endsAt)}: tot ${max}% korting${p.months > 1 ? ` op de eerste ${p.months} maanden` : " op de eerste betaling"}. Alleen noemen als de opdracht over deze actie gaat of de post in die periode verschijnt.`,
    );
  }
  return lines.join("\n");
}

const formatInstruction: Record<PostFormat, string> = {
  auto: "Kies zelf wat het beste werkt: één afbeelding voor één krachtige boodschap, een carrousel voor tips, uitleg of stappen.",
  single: "Maak één afbeelding (precies 1 slide).",
  carousel: "Maak een carrousel van 4-8 slides.",
};

export function instagramUserPrompt(input: {
  prompt: string;
  format: PostFormat;
  instruction?: string | null;
  previous?: PostContent | null;
  publishAt?: Date | null;
  now?: Date;
}): string {
  const now = input.now ?? new Date();
  const parts = [
    `## Opdracht\n${input.prompt}`,
    `## Vorm\n${formatInstruction[input.format]}${input.instruction ? " Vraagt de aanwijzing hieronder om een andere vorm, volg dan de aanwijzing." : ""}`,
    `## Feiten over ${site.name}\n${brandFacts(now)}`,
    `## Datum\nVandaag is ${formatDate(now)}.${input.publishAt ? ` De post verschijnt op ${formatDate(input.publishAt)}.` : ""}`,
    `## Foto's\n${photoList}`,
  ];
  if (input.previous && input.instruction) {
    parts.push(
      `## Vorige versie\n${JSON.stringify({ slides: input.previous.slides, caption: input.previous.caption, hashtags: input.previous.hashtags })}`,
      `## Aanwijzing voor de nieuwe versie\n${input.instruction}\nMaak een nieuwe, volledige post waarin deze aanwijzing is verwerkt. Houd wat goed was.`,
    );
  } else if (input.instruction) {
    parts.push(`## Aanwijzing\n${input.instruction}`);
  }
  return parts.join("\n\n");
}

/** Controleert de harde eisen; geeft de problemen terug (leeg = in orde). */
export function reviewContent(content: PostContent, format: PostFormat): string[] {
  const problems: string[] = [];
  const n = content.slides.length;
  if (n === 0) problems.push("Er staan geen slides in de post.");
  if (format === "single" && n !== 1) problems.push(`Er zijn ${n} slides; maak er precies één.`);
  if (format === "carousel" && n < 3) problems.push(`Een carrousel heeft minimaal 3 slides; er zijn er ${n}.`);
  if (n > MAX_SLIDES) problems.push(`Er zijn ${n} slides; maak er hooguit ${MAX_SLIDES}.`);
  if (!content.caption.trim()) problems.push("Het bijschrift is leeg.");
  for (const [i, s] of content.slides.entries()) {
    if (!s.title.trim()) problems.push(`Slide ${i + 1} heeft geen kop.`);
    if (s.title.length > 80) problems.push(`De kop van slide ${i + 1} is ${s.title.length} tekens; maak hem korter (hooguit 60).`);
    if (s.body.length > 240) problems.push(`De toelichting op slide ${i + 1} is ${s.body.length} tekens; maak hem korter (hooguit 180).`);
    if (s.kind === "list" && s.bullets.length < 2) problems.push(`Slide ${i + 1} is een lijst zonder punten.`);
  }
  return problems;
}
