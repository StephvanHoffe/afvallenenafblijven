import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { site } from "@/config/site";
import type { PhotoId, PostContent, Slide } from "@/lib/instagram/content";

/**
 * Tekent de slides van een Instagram-post in de huisstijl: 1080 × 1350 (staand,
 * 4:5, de grootste ruimte in de feed). Satori (next/og) zet de opmaak om in een
 * PNG, sharp maakt er een JPEG van: Instagram accepteert alleen JPEG.
 */

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1350;
const PAD = 88;
const TEXT_WIDTH = SLIDE_WIDTH - PAD * 2;

const color = {
  dark: "#0a2417",
  green: "#123f29",
  brand: "#1c7a48",
  lime: "#c8f169",
  cream: "#fbfaf6",
  ink: "#10231a",
  muted: "#4d6156",
};

type Fonts = NonNullable<ConstructorParameters<typeof ImageResponse>[1]>["fonts"];
let fonts: Fonts | null = null;

/** Het lettertype van de website (Plus Jakarta Sans, OFL), hetzelfde als in de PDF's. */
function brandFonts(): Fonts {
  if (fonts) return fonts;
  const dir = path.join(process.cwd(), "src", "lib", "pdf", "fonts");
  fonts = ([400, 600, 700, 800] as const).map((weight) => ({
    name: "Jakarta",
    data: readFileSync(path.join(dir, `PlusJakartaSans-${weight}.woff`)),
    weight,
    style: "normal" as const,
  }));
  return fonts;
}

/** Een foto uit public/images, bijgesneden tot de slide (het interessantste deel blijft in beeld). */
function photoBuffer(photo: PhotoId): Promise<Buffer> {
  return sharp(path.join(process.cwd(), "public", "images", `${photo}.jpg`))
    .resize(SLIDE_WIDTH, SLIDE_HEIGHT, { fit: "cover", position: "attention" })
    .toBuffer();
}

/** Hoeveel regels een tekst ongeveer nodig heeft bij een gegeven aantal tekens per regel. */
function estimateLines(text: string, perLine: number): number {
  let lines = 1;
  let current = 0;
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const length = word.length;
    if (current === 0) current = length;
    else if (current + 1 + length <= perLine) current += 1 + length;
    else {
      lines++;
      current = length;
    }
    // Een woord dat zelf al langer is dan een regel loopt door op de volgende.
    if (current > perLine) {
      lines += Math.floor(current / perLine);
      current %= perLine;
    }
  }
  return lines;
}

/** De grootste lettergrootte waarbij de tekst binnen `maxLines` regels past. */
export function fitFontSize(text: string, { max, min, maxLines, width = TEXT_WIDTH, ratio = 0.56 }: { max: number; min: number; maxLines: number; width?: number; ratio?: number }): number {
  for (let size = max; size > min; size -= 2) {
    if (estimateLines(text, Math.floor(width / (size * ratio))) <= maxLines) return size;
  }
  return min;
}

function Logo({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40">
      <rect width="40" height="40" rx="12" fill={color.brand} />
      <path d="M11 27c0-8.5 6.2-15 17-16-1 10.8-7.5 17-16 17" fill="none" stroke={color.lime} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 28l8-8" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function Arrow({ stroke, size = 30 }: { stroke: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color.dark} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Onderrand: logo en naam links, rechts het slidenummer of "Swipe" op de cover van een carrousel. */
function Footer({ tone, index, total }: { tone: "light" | "dark"; index: number; total: number }) {
  const text = tone === "light" ? "#ffffff" : color.ink;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <Logo />
        <span style={{ fontSize: 30, fontWeight: 800, color: text, letterSpacing: -0.5 }}>{site.name}</span>
      </div>
      {total > 1 &&
        (index === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 24px", borderRadius: 999, background: color.lime, color: color.dark, fontSize: 26, fontWeight: 800 }}>
            Swipe <Arrow stroke={color.dark} size={26} />
          </div>
        ) : (
          <span style={{ fontSize: 28, fontWeight: 700, color: text, opacity: 0.7 }}>
            {index + 1}/{total}
          </span>
        ))}
    </div>
  );
}

function Kicker({ text, tone }: { text: string; tone: "pill" | "plain" | "dark" }) {
  if (!text) return null;
  if (tone === "pill") {
    return (
      <div style={{ display: "flex", alignSelf: "flex-start", padding: "10px 22px", borderRadius: 999, background: color.lime, color: color.dark, fontSize: 26, fontWeight: 800, letterSpacing: 2, textTransform: "uppercase" }}>
        {text}
      </div>
    );
  }
  return (
    <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2.5, textTransform: "uppercase", color: tone === "dark" ? color.green : color.brand }}>{text}</span>
  );
}

function Frame({ background, children }: { background: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%", padding: PAD, background, fontFamily: "Jakarta", position: "relative" }}>
      {children}
    </div>
  );
}

function CoverSlide({ slide, index, total, photo }: SlideProps) {
  const titleSize = fitFontSize(slide.title, { max: 112, min: 64, maxLines: 4 });
  return (
    <Frame background={photo ? "transparent" : color.dark}>
      {photo ? (
        <div style={{ position: "absolute", left: 0, top: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex", backgroundImage: "linear-gradient(180deg, rgba(10,36,23,0) 25%, rgba(10,36,23,0.55) 55%, rgba(10,36,23,0.94) 100%)" }} />
      ) : (
        <div style={{ position: "absolute", right: -220, top: -220, width: 720, height: 720, borderRadius: 999, display: "flex", background: color.lime, opacity: 0.14 }} />
      )}
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", flexGrow: 1, gap: 32 }}>
        <Kicker text={slide.kicker} tone="pill" />
        <span style={{ fontSize: titleSize, fontWeight: 800, color: "#ffffff", lineHeight: 1.04 }}>{slide.title}</span>
        {slide.body && <span style={{ fontSize: fitFontSize(slide.body, { max: 38, min: 30, maxLines: 4, ratio: 0.5 }), color: "rgba(255,255,255,0.88)", lineHeight: 1.38 }}>{slide.body}</span>}
      </div>
      <div style={{ display: "flex", marginTop: 64 }}>
        <Footer tone="light" index={index} total={total} />
      </div>
    </Frame>
  );
}

function TipSlide({ slide, index, total, number }: SlideProps) {
  const titleSize = fitFontSize(slide.title, { max: 80, min: 52, maxLines: 4 });
  return (
    <Frame background={color.cream}>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", gap: 30 }}>
        <span style={{ fontSize: 150, fontWeight: 800, color: color.brand, lineHeight: 1, letterSpacing: -4 }}>
          {String(number).padStart(2, "0")}
        </span>
        <Kicker text={slide.kicker} tone="plain" />
        <span style={{ fontSize: titleSize, fontWeight: 800, color: color.ink, lineHeight: 1.08 }}>{slide.title}</span>
        {slide.body && <span style={{ fontSize: fitFontSize(slide.body, { max: 40, min: 31, maxLines: 6, ratio: 0.5 }), color: color.muted, lineHeight: 1.42 }}>{slide.body}</span>}
      </div>
      <Footer tone="dark" index={index} total={total} />
    </Frame>
  );
}

function ListSlide({ slide, index, total }: SlideProps) {
  const titleSize = fitFontSize(slide.title, { max: 72, min: 50, maxLines: 3 });
  const longest = Math.max(0, ...slide.bullets.map((b) => b.length));
  const bulletSize = longest > 48 || slide.bullets.length > 5 ? 38 : 42;
  return (
    <Frame background={color.cream}>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", gap: 28 }}>
        <Kicker text={slide.kicker} tone="plain" />
        <span style={{ fontSize: titleSize, fontWeight: 800, color: color.ink, lineHeight: 1.08 }}>{slide.title}</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 30, marginTop: 24 }}>
          {slide.bullets.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 24 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 58, height: 58, borderRadius: 999, background: color.lime, flexShrink: 0 }}>
                <Check />
              </div>
              <span style={{ fontSize: bulletSize, fontWeight: 600, color: color.ink, lineHeight: 1.3, paddingTop: 4, width: TEXT_WIDTH - 82 }}>{b}</span>
            </div>
          ))}
        </div>
      </div>
      <Footer tone="dark" index={index} total={total} />
    </Frame>
  );
}

function QuoteSlide({ slide, index, total, photo }: SlideProps) {
  const titleSize = fitFontSize(slide.title, { max: 92, min: 56, maxLines: 5 });
  return (
    <Frame background={photo ? "transparent" : color.green}>
      {photo && <div style={{ position: "absolute", left: 0, top: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, display: "flex", background: "rgba(10,36,23,0.72)" }} />}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", gap: 28 }}>
        <Kicker text={slide.kicker} tone="pill" />
        <span style={{ fontSize: 260, fontWeight: 800, color: color.lime, lineHeight: 0.8, height: 150 }}>“</span>
        <span style={{ fontSize: titleSize, fontWeight: 800, color: "#ffffff", lineHeight: 1.08 }}>{slide.title}</span>
        {slide.body && <span style={{ fontSize: fitFontSize(slide.body, { max: 38, min: 30, maxLines: 5, ratio: 0.5 }), color: "rgba(255,255,255,0.82)", lineHeight: 1.4 }}>{slide.body}</span>}
      </div>
      <Footer tone="light" index={index} total={total} />
    </Frame>
  );
}

function CtaSlide({ slide, index, total }: SlideProps) {
  const titleSize = fitFontSize(slide.title, { max: 96, min: 58, maxLines: 4 });
  return (
    <Frame background={color.lime}>
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", gap: 32 }}>
        <Kicker text={slide.kicker} tone="dark" />
        <span style={{ fontSize: titleSize, fontWeight: 800, color: color.dark, lineHeight: 1.05 }}>{slide.title}</span>
        {slide.body && <span style={{ fontSize: fitFontSize(slide.body, { max: 40, min: 31, maxLines: 5, ratio: 0.5 }), color: color.green, lineHeight: 1.4 }}>{slide.body}</span>}
        <div style={{ display: "flex", alignSelf: "flex-start", alignItems: "center", gap: 16, marginTop: 16, padding: "24px 40px", borderRadius: 999, background: color.dark, color: color.lime, fontSize: 34, fontWeight: 800 }}>
          {site.domain} <Arrow stroke={color.lime} size={34} />
        </div>
      </div>
      <Footer tone="dark" index={index} total={total} />
    </Frame>
  );
}

interface SlideProps {
  slide: Slide;
  index: number;
  total: number;
  /** Het volgnummer van deze tip (alleen de tip-slides tellen mee). */
  number: number;
  /** Ligt er een foto onder deze slide? */
  photo: boolean;
}

const LAYOUTS: Record<Slide["kind"], (p: SlideProps) => React.ReactElement> = {
  cover: CoverSlide,
  tip: TipSlide,
  list: ListSlide,
  quote: QuoteSlide,
  cta: CtaSlide,
};

/** Alleen een cover of uitspraak krijgt een foto; de andere slides zijn vlak, zodat de tekst goed leesbaar blijft. */
export function slidePhoto(slide: Slide): PhotoId | null {
  return (slide.kind === "cover" || slide.kind === "quote") && slide.photo !== "geen" ? slide.photo : null;
}

/** Tekent slide `index` (vanaf 0) van een post als JPEG. */
export async function renderSlide(content: PostContent, index: number): Promise<Buffer> {
  const slide = content.slides[index];
  if (!slide) throw new Error(`Slide ${index + 1} bestaat niet`);
  const photo = slidePhoto(slide);
  const number = content.slides.slice(0, index + 1).filter((s) => s.kind === "tip").length;
  const Layout = LAYOUTS[slide.kind];
  const png = Buffer.from(
    await new ImageResponse(<Layout slide={slide} index={index} total={content.slides.length} number={number} photo={Boolean(photo)} />, {
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      fonts: brandFonts(),
    }).arrayBuffer(),
  );
  // Met een foto is de opmaak een doorzichtige laag over de foto.
  const base = photo ? sharp(await photoBuffer(photo)).composite([{ input: png }]) : sharp(png);
  return base.flatten({ background: color.dark }).jpeg({ quality: 88, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer();
}
