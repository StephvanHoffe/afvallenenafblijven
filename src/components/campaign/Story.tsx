import { Check, X } from "lucide-react";
import type { LandingVariant } from "@/content/landing";
import { defineCopy, type Locale } from "@/i18n/config";

/**
 * Bouwstenen voor het verhaal van de landingspagina: eerst de pijn (hoe het
 * vaak gaat), dan de omslag en de oplossing (hoe wij het doen). De twee
 * illustraties spiegelen elkaar: het jojo-patroon tegenover rustig afvallen en
 * afblijven, of bij training het plateau tegenover een vaste opbouw.
 */
export const storyCopy = defineCopy({
  nl: {
    heroCta: "Laat zien hoe het anders kan",
    heroOr: "Of start meteen",
    solutionEyebrow: "De oplossing",
    solutionIntro: {
      afvallen:
        "Wij maken een voedings- en trainingsschema op jouw lichaam, smaak en agenda, en sturen het elke week bij op wat er echt gebeurt. Geen crashdieet, geen honger, en een plan om daarna op gewicht te blijven.",
      voeding:
        "Wij maken een weekmenu op jouw dagdoel, smaak en agenda, met precieze hoeveelheden en een boodschappenlijst. En we sturen het elke week bij op wat er echt gebeurt.",
      training:
        "Wij maken een trainingsschema op jouw niveau, plek en tijd, opgebouwd over 4 weken. Elke periode een stap zwaarder, en bijgestuurd op hoe het echt gaat.",
    } as Record<LandingVariant, string>,
    proofEyebrow: "Zo ziet het eruit",
    proofTitle: "Binnen 2 uur in je mailbox: jouw eigen plan",
    closeEyebrow: "Jouw beurt",
    steps: ["2 minuten vragen beantwoorden", "Kies je plan", "Binnen 2 uur je schema"],
    chart: {
      weight: {
        painTitle: "Zo gaat het vaak",
        painLabels: ["Start: nieuw dieet", "Week 3: honger en trek", "Terug bij af"],
        painNote: "Herkenbaar? Je bent zeker niet de enige.",
        fixTitle: "Zo werken wij",
        fixLabels: ["Start", "Elke week bijgestuurd", "Op gewicht blijven"],
        axis: "Gewicht",
        aria: (pain: boolean): string =>
          pain
            ? "Illustratie: het gewicht gaat omlaag met een nieuw dieet, komt na een paar weken weer terug en eindigt hoger dan bij de start."
            : "Illustratie van onze aanpak: rustig afvallen, elke week bijgestuurd, en daarna op gewicht blijven.",
      },
      strength: {
        painTitle: "Zo gaat het vaak",
        painLabels: ["Vol goede moed", "Steeds dezelfde oefeningen", "Geen vooruitgang"],
        painNote: "Herkenbaar? Je bent zeker niet de enige.",
        fixTitle: "Zo werken wij",
        fixLabels: ["Periode 1", "Elke periode een stap zwaarder", "Sterker, met een plan"],
        axis: "Vooruitgang",
        aria: (pain: boolean): string =>
          pain
            ? "Illustratie: na een goede start blijft de vooruitgang hangen op hetzelfde niveau."
            : "Illustratie van onze aanpak: elke periode van 4 weken een stap zwaarder, zodat je blijft vooruitgaan.",
      },
      time: "Tijd",
      fixNote: "Illustratie van onze aanpak, geen belofte: resultaten verschillen per persoon.",
    },
  },
  en: {
    heroCta: "Show me how it can be different",
    heroOr: "Or start right away",
    solutionEyebrow: "The solution",
    solutionIntro: {
      afvallen:
        "We create a nutrition and training plan around your body, tastes and schedule, and fine-tune it every week based on what really happens. No crash diet, no hunger, and a plan to keep the weight off afterwards.",
      voeding:
        "We create a weekly menu around your daily target, tastes and schedule, with exact quantities and a shopping list. And we fine-tune it every week based on what really happens.",
      training:
        "We create a training plan around your level, location and time, built up over 4 weeks. A step harder every period, and adjusted to how it's really going.",
    } as Record<LandingVariant, string>,
    proofEyebrow: "What it looks like",
    proofTitle: "In your inbox within 2 hours: your own plan",
    closeEyebrow: "Your turn",
    steps: ["Answer questions for 2 minutes", "Choose your plan", "Your plan within 2 hours"],
    chart: {
      weight: {
        painTitle: "How it often goes",
        painLabels: ["Start: new diet", "Week 3: hunger and cravings", "Back to square one"],
        painNote: "Sound familiar? You're definitely not the only one.",
        fixTitle: "How we work",
        fixLabels: ["Start", "Fine-tuned every week", "Keeping it off"],
        axis: "Weight",
        aria: (pain: boolean): string =>
          pain
            ? "Illustration: weight goes down with a new diet, comes back after a few weeks and ends higher than at the start."
            : "Illustration of our approach: losing weight steadily, fine-tuned every week, and then keeping it off.",
      },
      strength: {
        painTitle: "How it often goes",
        painLabels: ["Full of energy", "Always the same exercises", "No progress"],
        painNote: "Sound familiar? You're definitely not the only one.",
        fixTitle: "How we work",
        fixLabels: ["Period 1", "A step harder every period", "Stronger, with a plan"],
        axis: "Progress",
        aria: (pain: boolean): string =>
          pain
            ? "Illustration: after a good start, progress gets stuck at the same level."
            : "Illustration of our approach: a step harder every 4-week period, so you keep making progress.",
      },
      time: "Time",
      fixNote: "Illustration of our approach, not a promise: results vary from person to person.",
    },
  },
});

type Pt = [number, number];

/** Vloeiende lijn door de punten (Catmull-Rom omgezet naar Bézier). */
function smooth(points: Pt[]): string {
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d;
}

type Mark = { idx: number; x: number; y: number; anchor: "start" | "middle" | "end" };

/**
 * De lijnen (viewBox 360 × 190). Gewicht: hoger in beeld is zwaarder.
 * Vooruitgang: hoger is verder. Drie gemarkeerde punten per tekening, elk met
 * een vaste plek voor het label zodat tekst en lijn elkaar niet raken.
 */
const SHAPES: Record<"weight" | "strength", Record<"pain" | "fix", { line: Pt[]; marks: Mark[] }>> = {
  weight: {
    pain: {
      line: [[24, 70], [72, 112], [104, 122], [142, 92], [178, 62], [216, 104], [246, 114], [290, 66], [336, 48]],
      marks: [
        { idx: 0, x: 20, y: 56, anchor: "start" },
        { idx: 2, x: 104, y: 144, anchor: "middle" },
        { idx: 8, x: 340, y: 34, anchor: "end" },
      ],
    },
    fix: {
      line: [[24, 52], [96, 82], [168, 112], [228, 128], [282, 132], [336, 132]],
      marks: [
        { idx: 0, x: 20, y: 38, anchor: "start" },
        { idx: 2, x: 160, y: 134, anchor: "end" },
        { idx: 5, x: 340, y: 160, anchor: "end" },
      ],
    },
  },
  strength: {
    pain: {
      line: [[24, 140], [70, 112], [112, 96], [160, 98], [212, 94], [264, 99], [336, 96]],
      marks: [
        { idx: 0, x: 20, y: 162, anchor: "start" },
        { idx: 3, x: 160, y: 122, anchor: "middle" },
        { idx: 6, x: 340, y: 80, anchor: "end" },
      ],
    },
    fix: {
      line: [[24, 140], [92, 122], [160, 104], [228, 82], [282, 64], [336, 48]],
      marks: [
        { idx: 0, x: 20, y: 162, anchor: "start" },
        { idx: 2, x: 170, y: 126, anchor: "start" },
        { idx: 5, x: 340, y: 34, anchor: "end" },
      ],
    },
  },
};

/**
 * Illustratie (geen data): het patroon dat de bezoeker kent, of hoe wij het
 * aanpakken. Eén lijn per tekening met labels erbij; de pijnlijn is gestreept
 * en oranje, de oplossing doorgetrokken en groen (kleur is nooit het enige
 * verschil). Zonder getallen, want het is geen voorspelling.
 */
export function StoryChart({ kind, variant, l }: { kind: "pain" | "fix"; variant: LandingVariant; l: Locale }) {
  const c = storyCopy[l].chart;
  const metric = variant === "training" ? "strength" : "weight";
  const m = c[metric];
  const shape = SHAPES[metric][kind];
  const pain = kind === "pain";
  const labels = pain ? m.painLabels : m.fixLabels;
  const color = pain ? "var(--color-accent-500)" : "var(--color-brand-600)";
  const startY = shape.line[0][1];
  return (
    <figure className="card min-w-0 p-5 sm:p-6">
      <figcaption className="flex items-center gap-2 font-extrabold">
        {pain ? (
          <span className="grid size-7 place-items-center rounded-full bg-accent-50 text-accent-600">
            <X className="size-4" aria-hidden />
          </span>
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-brand-50 text-brand-700">
            <Check className="size-4" aria-hidden />
          </span>
        )}
        {pain ? m.painTitle : m.fixTitle}
      </figcaption>
      <svg viewBox="0 0 360 190" className="mt-3 w-full overflow-visible" role="img" aria-label={m.aria(pain)}>
        {/* As: recessief, zonder getallen */}
        <line x1="16" y1="172" x2="344" y2="172" stroke="var(--color-line)" strokeWidth="1" />
        <text x="16" y="12" fontSize="11" fontWeight="600" fill="var(--color-muted)">
          {m.axis}
        </text>
        <text x="344" y="186" fontSize="11" fontWeight="600" fill="var(--color-muted)" textAnchor="end">
          {c.time} →
        </text>
        {/* Het startgewicht als stippellijn: zo zie je dat de jojo hoger eindigt */}
        {metric === "weight" && (
          <line x1="16" y1={startY} x2="344" y2={startY} stroke="var(--color-muted)" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 4" />
        )}
        {/* Oplossing: de zone waar je blijft (afblijven) */}
        {!pain && metric === "weight" && (
          <rect x="228" y="118" width="116" height="28" rx="8" fill="var(--color-lime-glow)" fillOpacity="0.35" />
        )}
        <path
          d={smooth(shape.line)}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={pain ? "7 6" : undefined}
        />
        {shape.marks.map((mark, i) => {
          const [x, y] = shape.line[mark.idx];
          return (
            <g key={mark.idx}>
              <circle cx={x} cy={y} r="5" fill={color} stroke="#fff" strokeWidth="2" />
              <text x={mark.x} y={mark.y} fontSize="11.5" fontWeight="700" fill="var(--color-ink)" textAnchor={mark.anchor}>
                {labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
      <p className={`mt-2 text-sm ${pain ? "font-semibold text-ink/80" : "text-muted"}`}>{pain ? m.painNote : c.fixNote}</p>
    </figure>
  );
}
