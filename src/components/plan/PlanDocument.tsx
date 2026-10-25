import Link from "@/i18n/Link";
import { ArrowLeft, Download, ShoppingCart } from "lucide-react";
import { NutritionPlanView } from "@/components/plan/NutritionPlanView";
import { TrainingPlanView } from "@/components/plan/TrainingPlanView";
import { AdjustmentsCard } from "@/components/plan/AdjustmentsCard";
import type { PlanAdjustment } from "@/lib/weekly";
import type { PlanContent } from "@/lib/ai/schemas";
import { formatDate } from "@/lib/format";
import { site } from "@/config/site";
import { defineCopy, localePath, type Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";

const copy = defineCopy({
  nl: {
    back: "Mijn schema's",
    shoppingPdf: "Boodschappenlijst (PDF)",
    downloadPdf: "Download als PDF",
    madeFor: (name: string) => `Persoonlijk schema voor ${name}`,
    madeOn: (date: string) => `, gemaakt op ${date}`,
    disclaimer:
      "Dit schema is persoonlijk leefstijladvies op basis van jouw antwoorden. Het is geen medisch advies en geen vervanging voor begeleiding door een arts, diëtist of fysiotherapeut. Heb je klachten, een medische aandoening of twijfel? Overleg dan eerst met je huisarts. Lees bij allergieën altijd de etiketten.",
  },
  en: {
    back: "My plans",
    shoppingPdf: "Shopping list (PDF)",
    downloadPdf: "Download as PDF",
    madeFor: (name: string) => `Personal plan for ${name}`,
    madeOn: (date: string) => `, created on ${date}`,
    disclaimer:
      "This plan is personal lifestyle advice based on your answers. It is not medical advice and does not replace guidance from a doctor, dietitian or physiotherapist. Do you have symptoms, a medical condition or any doubts? Then check with your GP first. If you have allergies, always read the labels.",
  },
});

/** Een volledig schema zoals de klant het ziet: terug-link, downloads, inhoud en disclaimer. */
export async function PlanDocument({
  content,
  customerName,
  generatedAt,
  backHref = "/account/schemas",
  backLabel,
  preview = false,
  pdfHref,
  shoppingPdfHref,
  storageKey,
  adjustments,
  l: locale,
}: {
  content: PlanContent;
  customerName: string;
  generatedAt: Date | null;
  backHref?: string;
  backLabel?: string;
  preview?: boolean;
  /** Download van het hele schema als PDF. */
  pdfHref?: string;
  /** Download van alleen de boodschappenlijst (voedingsschema). */
  shoppingPdfHref?: string;
  storageKey?: string;
  /** Bijsturingen uit de wekelijkse weegmomenten van deze periode. */
  adjustments?: PlanAdjustment[];
  /** Taal van de teksten om het schema heen; standaard de taal van de pagina. */
  l?: Locale;
}) {
  const l = locale ?? (await getLocale());
  const c = copy[l];
  const kcal = (adjustments ?? []).reduce((sum, a) => sum + a.kcal, 0);
  const shoppingHref = shoppingPdfHref ? localePath(l, shoppingPdfHref) : undefined;
  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {backLabel ?? c.back}
        </Link>
        <div className="flex flex-wrap gap-2">
          {shoppingHref && (
            <a href={shoppingHref} className="btn-secondary !px-4 !py-2.5 text-sm">
              <ShoppingCart className="size-4" aria-hidden /> {c.shoppingPdf}
            </a>
          )}
          {pdfHref && (
            <a href={localePath(l, pdfHref)} className="btn-primary !px-4 !py-2.5 text-sm">
              <Download className="size-4" aria-hidden /> {c.downloadPdf}
            </a>
          )}
        </div>
      </div>
      <p className="mb-4 text-sm text-muted">
        {c.madeFor(customerName)}
        {generatedAt ? c.madeOn(formatDate(generatedAt, l)) : ""} · {site.name}
      </p>
      {content.type === "voeding" ? (
        <NutritionPlanView
          plan={content.plan}
          targets={content.targets}
          preview={preview}
          storageKey={storageKey}
          shoppingPdfHref={shoppingHref}
          adjustedCalories={kcal ? content.targets.calories + kcal : undefined}
          notice={<AdjustmentsCard type="voeding" adjustments={adjustments} l={l} />}
          l={l}
        />
      ) : (
        <TrainingPlanView
          plan={content.plan}
          preview={preview}
          notice={<AdjustmentsCard type="training" adjustments={adjustments} l={l} />}
          l={l}
        />
      )}
      <p className="mt-12 rounded-2xl bg-sand p-4 text-xs leading-relaxed text-muted">{c.disclaimer}</p>
    </div>
  );
}
