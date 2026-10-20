import Link from "next/link";
import { ArrowLeft, Download, ShoppingCart } from "lucide-react";
import { NutritionPlanView } from "@/components/plan/NutritionPlanView";
import { TrainingPlanView } from "@/components/plan/TrainingPlanView";
import type { PlanContent } from "@/lib/ai/schemas";
import { formatDate } from "@/lib/format";
import { site } from "@/config/site";

/** Een volledig schema zoals de klant het ziet: terug-link, downloads, inhoud en disclaimer. */
export function PlanDocument({
  content,
  customerName,
  generatedAt,
  backHref = "/account/schemas",
  backLabel = "Mijn schema's",
  preview = false,
  pdfHref,
  shoppingPdfHref,
  storageKey,
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
}) {
  return (
    <div>
      <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> {backLabel}
        </Link>
        <div className="flex flex-wrap gap-2">
          {shoppingPdfHref && (
            <a href={shoppingPdfHref} className="btn-secondary !px-4 !py-2.5 text-sm">
              <ShoppingCart className="size-4" aria-hidden /> Boodschappenlijst (PDF)
            </a>
          )}
          {pdfHref && (
            <a href={pdfHref} className="btn-primary !px-4 !py-2.5 text-sm">
              <Download className="size-4" aria-hidden /> Download als PDF
            </a>
          )}
        </div>
      </div>
      <p className="mb-4 text-sm text-muted">
        Persoonlijk schema voor {customerName}
        {generatedAt ? `, gemaakt op ${formatDate(generatedAt)}` : ""} · {site.name}
      </p>
      {content.type === "voeding" ? (
        <NutritionPlanView
          plan={content.plan}
          targets={content.targets}
          preview={preview}
          storageKey={storageKey}
          shoppingPdfHref={shoppingPdfHref}
        />
      ) : (
        <TrainingPlanView plan={content.plan} preview={preview} />
      )}
      <p className="mt-12 rounded-2xl bg-sand p-4 text-xs leading-relaxed text-muted">
        Dit schema is persoonlijk leefstijladvies op basis van jouw antwoorden. Het is geen medisch advies en geen
        vervanging voor begeleiding door een arts, diëtist of fysiotherapeut. Heb je klachten, een medische aandoening
        of twijfel? Overleg dan eerst met je huisarts. Lees bij allergieën altijd de etiketten.
      </p>
    </div>
  );
}
